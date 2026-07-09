// =====================================================================
// 공공데이터 API 공통 유틸 (XML 파싱, 응답 타입)
//   - 국토부 건축물대장(BldRgstHubService) 연동에 필요한 최소 유틸만 포팅.
//   - fast-xml-parser 기반 XML → 객체 파싱, items 안전 추출, 성공코드 판정.
// 서버 전용 유틸 (fetch/parse 는 서버에서만 호출).
// =====================================================================
import { XMLParser } from "fast-xml-parser";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: true,
});

export const API_BASE = {
  // ⚠️ 구 BldRgstService_v2 는 폐기(500 고정) — 현행은 BldRgstHubService
  BLDG_LEDGER: "https://apis.data.go.kr/1613000/BldRgstHubService",
} as const;

export function parseXmlResponse<T = unknown>(xmlData: string): T {
  return xmlParser.parse(xmlData) as T;
}

export interface PublicApiResponse<T> {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items?: { item?: T | T[] };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

// 국토부 API 응답에서 items.item 을 안전하게 배열로 추출
export function extractItems<T>(parsed: PublicApiResponse<T>): T[] {
  const items = parsed?.response?.body?.items;
  if (!items) return [];
  const item = items.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

// resultCode 체크 (000 이 성공) — parser 설정과 무관하게 문자열 비교
export function isSuccessResponse(parsed: PublicApiResponse<unknown>): boolean {
  const rc = parsed?.response?.header?.resultCode;
  return String(rc) === "000" || String(rc) === "00";
}
