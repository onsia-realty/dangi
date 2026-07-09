// =====================================================================
// 주소 → 표준 PNU 19자리 변환 (NCP 네이버 우선 → VWorld fallback)
//   - NCP 네이버 지오코딩(한국 서버)은 Vercel 미국 리전에서도 정상 동작하나,
//     VWorld(한국 정부 서버)는 미국 리전에서 502 만성 실패가 발생한다.
//     따라서 네이버를 우선 시도하고, 실패 시에만 VWorld 로 fallback 한다.
//   - 네이버 지오코딩은 PNU 를 직접 주지 않으므로 2단계로 조합한다:
//       1) 지오코딩:      주소 → 경위도(x, y)
//       2) 리버스 지오코딩: 경위도 → 법정동코드(code.id) + 산여부(land.type)
//     그리고 본번/부번은 입력 주소 파싱값을 신뢰하여 조합한다.
//     (지오코딩 좌표가 필지 대표점이 아닐 수 있어, 리버스의 본번/부번이
//      입력과 어긋날 수 있으므로 입력 파싱값 우선. 못 뽑을 때만 리버스 값 사용.)
//   - PNU 19자리 = 법정동코드(10) + 산여부(1) + 본번(4, zero-pad) + 부번(4, zero-pad)
//   - ⚠️ 서버 전용. NCP/VWorld 키는 절대 클라이언트로 노출하지 말 것.
// =====================================================================
import { pnuFromAddress as pnuFromAddressVworld } from "@/lib/building-ledger/vworld";

const NAVER_CLIENT_ID = process.env.NAVER_GEOCODE_CLIENT_ID || "";
const NAVER_CLIENT_SECRET = process.env.NAVER_GEOCODE_CLIENT_SECRET || "";

/** PNU 획득 경로 (로깅/디버깅용) */
export type PnuSource = "naver" | "vworld";

export interface PnuWithSource {
  pnu: string;
  source: PnuSource;
}

/**
 * 입력 지번주소 문자열에서 본번-부번을 파싱한다.
 * 예) "서울시 강남구 논현동 201-2"  → { bon: 201, bu: 2, isMountain: false }
 *     "경기도 ... 산 12"            → { bon: 12,  bu: 0, isMountain: true }
 *     "... 논현동 201"             → { bon: 201, bu: 0, isMountain: false }
 * 지번(숫자[-숫자]) 을 못 찾으면 null.
 */
function parseJibun(
  address: string,
): { bon: number; bu: number; isMountain: boolean } | null {
  if (!address) return null;
  // 주소 끝부분의 "산 12-3" / "12-3" / "12" 형태를 잡는다.
  // 산여부: 숫자 앞에 '산' 표기가 있으면 임야(2).
  const m = address.match(/(?:^|\s)(산)?\s*(\d+)(?:-(\d+))?(?:\s*[번지]*)?\s*$/);
  if (!m) return null;
  const isMountain = !!m[1];
  const bon = parseInt(m[2], 10);
  const bu = m[3] ? parseInt(m[3], 10) : 0;
  if (!Number.isFinite(bon)) return null;
  return { bon, bu, isMountain };
}

/** 법정동코드(10) + 산여부(1) + 본번(4) + 부번(4) → PNU 19자리 조합 */
function composePnu(
  legalCode: string,
  isMountain: boolean,
  bon: number,
  bu: number,
): string | null {
  if (!/^\d{10}$/.test(legalCode)) return null;
  const mountainDigit = isMountain ? "2" : "1";
  const bonStr = String(bon).padStart(4, "0");
  const buStr = String(bu).padStart(4, "0");
  const pnu = `${legalCode}${mountainDigit}${bonStr}${buStr}`;
  return /^\d{19}$/.test(pnu) ? pnu : null;
}

/**
 * NCP 네이버 2단계 조회로 PNU 를 얻는다. 실패 시 null.
 */
async function pnuFromNaver(address: string): Promise<string | null> {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    console.warn("[building-ledger] NAVER_GEOCODE 키 미설정 → 네이버 경로 skip");
    return null;
  }

  const headers = {
    "x-ncp-apigw-api-key-id": NAVER_CLIENT_ID,
    "x-ncp-apigw-api-key": NAVER_CLIENT_SECRET,
    Accept: "application/json",
  } as const;

  // 1) 지오코딩: 주소 → 경위도
  let lng: string | undefined;
  let lat: string | undefined;
  try {
    const geoUrl =
      `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`;
    const res = await fetch(geoUrl, {
      signal: AbortSignal.timeout(10000),
      headers,
    });
    if (!res.ok) {
      console.warn(`[building-ledger] 네이버 지오코딩 HTTP_${res.status}`);
      return null;
    }
    const data = (await res.json()) as {
      addresses?: Array<{ x?: string; y?: string }>;
      meta?: { totalCount?: number };
    };
    const first = data.addresses?.[0];
    if (!first?.x || !first?.y) return null;
    lng = first.x; // 경도
    lat = first.y; // 위도
  } catch (e) {
    console.warn("[building-ledger] 네이버 지오코딩 예외:", e);
    return null;
  }

  // 2) 리버스 지오코딩: 경위도 → 법정동코드 + 산여부 (+ 본번/부번 백업)
  let legalCode: string | undefined;
  let revMountain: boolean | undefined;
  let revBon: number | undefined;
  let revBu: number | undefined;
  try {
    const revUrl =
      `https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc` +
      `?coords=${lng},${lat}&orders=legalcode,addr&output=json`;
    const res = await fetch(revUrl, {
      signal: AbortSignal.timeout(10000),
      headers,
    });
    if (!res.ok) {
      console.warn(`[building-ledger] 네이버 리버스 HTTP_${res.status}`);
      return null;
    }
    const data = (await res.json()) as {
      results?: Array<{
        name?: string;
        code?: { id?: string };
        land?: { type?: string; number1?: string; number2?: string };
      }>;
    };
    const results = data.results ?? [];
    // 법정동코드: 어느 result 든 code.id 10자리를 우선 채택
    for (const r of results) {
      const id = r.code?.id;
      if (id && /^\d{10}$/.test(id)) {
        legalCode = id;
        break;
      }
    }
    // 산여부/본번/부번: land 정보가 있는 result(주로 addr) 채택
    const landResult = results.find((r) => r.land?.number1);
    if (landResult?.land) {
      const l = landResult.land;
      revMountain = l.type === "2"; // '1' 일반 / '2' 산(임야)
      if (l.number1) revBon = parseInt(l.number1, 10);
      revBu = l.number2 ? parseInt(l.number2, 10) : 0;
    }
  } catch (e) {
    console.warn("[building-ledger] 네이버 리버스 예외:", e);
    return null;
  }

  if (!legalCode) return null;

  // 본번/부번/산여부: 입력 주소 파싱값을 신뢰. 못 뽑으면 리버스 값으로 폴백.
  const parsed = parseJibun(address);
  const bon = parsed?.bon ?? revBon;
  const bu = parsed?.bu ?? revBu;
  const isMountain = parsed?.isMountain ?? revMountain ?? false;

  if (bon === undefined || bu === undefined) return null;

  return composePnu(legalCode, isMountain, bon, bu);
}

/**
 * 지번주소 문자열을 PNU 19자리로 변환한다. (네이버 우선 → VWorld fallback)
 * 어느 소스로 얻었는지까지 반환한다.
 * @param address 예) "서울시 강남구 논현동 201-2"
 */
export async function pnuFromAddressWithSource(
  address: string,
): Promise<PnuWithSource | null> {
  if (!address || !address.trim()) return null;

  // 1) 네이버 우선
  const naverPnu = await pnuFromNaver(address);
  if (naverPnu) {
    return { pnu: naverPnu, source: "naver" };
  }

  // 2) VWorld fallback (기존 로직 재사용)
  const vworldPnu = await pnuFromAddressVworld(address);
  if (vworldPnu) {
    return { pnu: vworldPnu, source: "vworld" };
  }

  return null;
}

/**
 * 지번주소 문자열을 PNU 19자리로 변환한다. (네이버 우선 → VWorld fallback)
 * @param address 예) "서울시 강남구 논현동 201-2"
 * @returns 19자리 PNU 문자열, 실패 시 null
 */
export async function pnuFromAddress(address: string): Promise<string | null> {
  const result = await pnuFromAddressWithSource(address);
  return result?.pnu ?? null;
}
