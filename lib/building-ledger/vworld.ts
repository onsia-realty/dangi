// =====================================================================
// VWorld 주소 → 표준 PNU 19자리 변환
//   - 지번주소 전체를 넘기면 VWorld getcoord(parcel) 응답의
//     response.refined.structure.level4LC (19자리 PNU) 를 반환한다.
//   - 5xx 응답/네트워크 예외 시 최대 3회 재시도(지수 백오프 유사).
//   - ⚠️ 서버 전용. VWORLD_API_KEY 는 절대 클라이언트로 노출하지 말 것.
// =====================================================================

/**
 * 지번주소 문자열을 VWorld 로 조회해 표준 PNU 19자리를 얻는다.
 * @param address 예) "서울시 강남구 논현동 201-2"
 * @returns 19자리 PNU 문자열, 실패 시 null
 */
export async function pnuFromAddress(address: string): Promise<string | null> {
  const key = process.env.VWORLD_API_KEY;
  if (!key) {
    console.warn("[building-ledger] VWORLD_API_KEY 미설정 → PNU 변환 불가");
    return null;
  }
  if (!address || !address.trim()) return null;

  const url =
    `https://api.vworld.kr/req/address?service=address&request=getcoord` +
    `&address=${encodeURIComponent(address)}&type=parcel&format=json&key=${key}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 600 * attempt));
    }
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      });
      if (!res.ok) {
        // 5xx 는 재시도, 4xx 는 즉시 실패
        if (res.status >= 500) continue;
        return null;
      }
      const data = (await res.json()) as {
        response?: { refined?: { structure?: { level4LC?: string } } };
      };
      const lc = data?.response?.refined?.structure?.level4LC;
      if (lc && /^\d{19}$/.test(lc)) return lc;
      return null;
    } catch {
      // 타임아웃/네트워크 오류 → 재시도
    }
  }
  return null;
}
