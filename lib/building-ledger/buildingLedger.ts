// =====================================================================
// 국토부 건축물대장 표제부 API (BldRgstHubService/getBrTitleInfo)
//   - PNU 19자리를 시군구/법정동/대지구분/본번/부번으로 분해해 표제부를 조회한다.
//   - fetchBuildingTitle: 가장 큰 세대수 동 1건을 대표로 반환 (단지 대표성).
//   - fetchBuildingTitleAll: 전체 동 목록을 원시 아이템으로 반환.
// 서버 전용 (DATA_GO_KR_API_KEY 는 절대 클라이언트로 노출하지 말 것).
//
// PNU 19자리 = sigunguCd(5) + bjdongCd(5) + platGbCd(1) + bun(4) + ji(4)
// =====================================================================
import {
  API_BASE,
  parseXmlResponse,
  extractItems,
  isSuccessResponse,
} from "@/lib/building-ledger/publicApi";

export interface BuildingTitleItem {
  // 식별자
  mgmBldrgstPk?: string;
  sigunguCd?: string;
  bjdongCd?: string;
  platGbCd?: string;
  bun?: string;
  ji?: string;

  // 주소
  platPlc?: string;
  newPlatPlc?: string;
  bldNm?: string;
  dongNm?: string;

  // 용도
  mainPurpsCdNm?: string;
  etcPurps?: string;
  mainAtchGbCdNm?: string;

  // 면적
  platArea?: string | number;
  archArea?: string | number;
  totArea?: string | number;
  bcRat?: string | number; // 건폐율
  vlRat?: string | number; // 용적률

  // 층/세대
  grndFlrCnt?: string | number;
  ugrndFlrCnt?: string | number;
  hhldCnt?: string | number;
  fmlyCnt?: string | number;
  hoCnt?: string | number;

  // 구조
  strctCdNm?: string;
  roofCdNm?: string;

  // 승인
  useAprDay?: string;
  pmsrvDay?: string;

  // 승강기
  rideElvtCnt?: string | number;
  emgenElvtCnt?: string | number;

  // 주차
  indrMechUtcnt?: string | number;
  oudrMechUtcnt?: string | number;
  indrAutoUtcnt?: string | number;
  oudrAutoUtcnt?: string | number;
}

export interface BuildingLedgerRow {
  pnu: string;
  mgm_bldrgst_pk: string | null;
  sigungu_cd: string;
  bjdong_cd: string;
  plat_plc: string | null;
  new_plat_plc: string | null;
  bld_nm: string | null;
  dong_nm: string | null;
  main_purps_cd_nm: string | null;
  etc_purps: string | null;
  main_atch_gb_cd_nm: string | null;
  plat_area: number | null;
  arch_area: number | null;
  tot_area: number | null;
  bc_rat: number | null;
  vl_rat: number | null;
  grnd_flr_cnt: number | null;
  ugrnd_flr_cnt: number | null;
  hhld_cnt: number | null;
  fmly_cnt: number | null;
  ho_cnt: number | null;
  strct_cd_nm: string | null;
  roof_cd_nm: string | null;
  use_apr_day: string | null;
  pmsrv_day: string | null;
  ride_elvt_cnt: number | null;
  emgen_elvt_cnt: number | null;
  indr_mech_utcnt: number | null;
  oudr_mech_utcnt: number | null;
  indr_auto_utcnt: number | null;
  oudr_auto_utcnt: number | null;
  raw: unknown;
}

function num(v: string | number | undefined): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) ? null : n;
}
function int(v: string | number | undefined): number | null {
  const n = num(v);
  return n != null ? Math.floor(n) : null;
}
function str(v: string | undefined): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

/**
 * PNU 19자리에서 시군구/법정동/대지구분/본번/부번 추출.
 * ⚠️ 표준 PNU 필지구분(1=일반, 2=산)과 건축물대장 API platGbCd(0=대지, 1=산)는
 *    코드 체계가 다르다 — 여기서 변환하지 않으면 전 건이 "산"으로 조회돼 미스난다.
 */
export function splitPnu(pnu: string): {
  sigunguCd: string;
  bjdongCd: string;
  platGbCd: string;
  bun: string;
  ji: string;
} | null {
  if (!pnu || pnu.length !== 19) return null;
  const pnuGb = pnu.slice(10, 11); // 1=일반, 2=산
  const platGbCd = pnuGb === "2" ? "1" : "0";
  return {
    sigunguCd: pnu.slice(0, 5),
    bjdongCd: pnu.slice(5, 10),
    platGbCd,
    bun: pnu.slice(11, 15),
    ji: pnu.slice(15, 19),
  };
}

/**
 * 건축물대장 표제부 원시 아이템 전체 조회 (시군구5/법정동5/대지구분/본번/부번).
 * 여러 동이 있는 단지는 동 개수만큼 아이템이 반환된다.
 * @returns 표제부 아이템 배열 (없으면 빈 배열)
 */
export async function fetchBuildingTitleAll(
  pnu: string,
  service_key: string,
): Promise<BuildingTitleItem[]> {
  const split = splitPnu(pnu);
  if (!split) return [];

  const endpoint = `${API_BASE.BLDG_LEDGER}/getBrTitleInfo`;
  const url = new URL(endpoint);
  // data.go.kr 서비스키는 이미 인코딩된 형태일 수 있어, URL 객체가 이중 인코딩하지
  // 않도록 searchParams 대신 raw 쿼리로 serviceKey 를 직접 붙인다.
  url.searchParams.set("sigunguCd", split.sigunguCd);
  url.searchParams.set("bjdongCd", split.bjdongCd);
  url.searchParams.set("platGbCd", split.platGbCd);
  url.searchParams.set("bun", split.bun);
  url.searchParams.set("ji", split.ji);
  url.searchParams.set("numOfRows", "10");
  url.searchParams.set("pageNo", "1");

  const finalUrl = `${url.toString()}&serviceKey=${service_key}`;

  const res = await fetch(finalUrl, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`BldRgst API ${res.status}`);
  const xml = await res.text();

  const parsed = parseXmlResponse<{
    response: {
      header: { resultCode: string; resultMsg: string };
      body: { items?: { item?: BuildingTitleItem | BuildingTitleItem[] } };
    };
  }>(xml);

  if (
    !isSuccessResponse(parsed as Parameters<typeof isSuccessResponse>[0])
  ) {
    // SERVICE_KEY_IS_NOT_REGISTERED 등 인증 오류를 상위에서 인지할 수 있도록 메시지 노출
    const msg = parsed?.response?.header?.resultMsg || "unknown";
    const code = parsed?.response?.header?.resultCode;
    // 결과 없음(정상)과 인증/파라미터 오류를 구분: 03(no data)은 빈 배열로 처리
    if (String(code) === "03") return [];
    throw new Error(`BldRgst API result ${code}: ${msg}`);
  }

  return extractItems<BuildingTitleItem>(
    parsed as unknown as Parameters<typeof extractItems<BuildingTitleItem>>[0],
  );
}

/**
 * 건축물대장 표제부 호출 (시군구5/법정동5/본번/부번).
 * 여러 동인 경우 가장 큰 세대수 동을 대표로 선택해 정규화 Row 로 반환.
 */
export async function fetchBuildingTitle(
  pnu: string,
  service_key: string,
): Promise<BuildingLedgerRow | null> {
  const split = splitPnu(pnu);
  if (!split) return null;

  const items = await fetchBuildingTitleAll(pnu, service_key);
  if (items.length === 0) return null;

  // 가장 큰 세대수 동 선택 (전체 단지 대표성)
  const main = items.reduce((best, cur) => {
    const a = int(best.hhldCnt) || 0;
    const b = int(cur.hhldCnt) || 0;
    return b > a ? cur : best;
  }, items[0]);

  return {
    pnu,
    mgm_bldrgst_pk: str(main.mgmBldrgstPk),
    sigungu_cd: split.sigunguCd,
    bjdong_cd: split.bjdongCd,
    plat_plc: str(main.platPlc),
    new_plat_plc: str(main.newPlatPlc),
    bld_nm: str(main.bldNm),
    dong_nm: str(main.dongNm),
    main_purps_cd_nm: str(main.mainPurpsCdNm),
    etc_purps: str(main.etcPurps),
    main_atch_gb_cd_nm: str(main.mainAtchGbCdNm),
    plat_area: num(main.platArea),
    arch_area: num(main.archArea),
    tot_area: num(main.totArea),
    bc_rat: num(main.bcRat),
    vl_rat: num(main.vlRat),
    grnd_flr_cnt: int(main.grndFlrCnt),
    ugrnd_flr_cnt: int(main.ugrndFlrCnt),
    hhld_cnt: int(main.hhldCnt),
    fmly_cnt: int(main.fmlyCnt),
    ho_cnt: int(main.hoCnt),
    strct_cd_nm: str(main.strctCdNm),
    roof_cd_nm: str(main.roofCdNm),
    use_apr_day: str(main.useAprDay),
    pmsrv_day: str(main.pmsrvDay),
    ride_elvt_cnt: int(main.rideElvtCnt),
    emgen_elvt_cnt: int(main.emgenElvtCnt),
    indr_mech_utcnt: int(main.indrMechUtcnt),
    oudr_mech_utcnt: int(main.oudrMechUtcnt),
    indr_auto_utcnt: int(main.indrAutoUtcnt),
    oudr_auto_utcnt: int(main.oudrAutoUtcnt),
    raw: main,
  };
}
