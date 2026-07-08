// 공용 상수 정의 (UI 셀렉트/필터/뱃지 등에서 재사용)

// 건물 유형
export const BUILDING_TYPES = ["원룸", "오피스텔", "아파트", "기타"] as const;
export type BuildingType = (typeof BUILDING_TYPES)[number];

// 리드 파이프라인 단계 (발굴 → ... → 등록완료 / 거절)
export const LEAD_STAGES = [
  "발굴",
  "제안발송",
  "협의중",
  "동의완료",
  "등록완료",
  "거절",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

// "동의완료" 상태의 리드만 매물로 전환 가능
export const LEAD_CONVERTIBLE_STAGE: LeadStage = "동의완료";

// 문의 상태
export const INQUIRY_STATUSES = [
  "신규",
  "연락완료",
  "계약진행",
  "완료",
  "취소",
] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

// 매물 노출 상태
export const PROPERTY_STATUSES = ["active", "hidden", "booked"] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

// 매물 옵션 아이콘 키 (jsonb options 의 키와 대응)
// key: DB/코드에서 쓰는 키, label: 화면 표기(한국어)
export const OPTION_ITEMS = [
  { key: "wifi", label: "와이파이" },
  { key: "washer", label: "세탁기" },
  { key: "aircon", label: "에어컨" },
  { key: "fridge", label: "냉장고" },
  { key: "induction", label: "인덕션" },
  { key: "desk", label: "책상" },
  { key: "bed", label: "침대" },
  { key: "tv", label: "TV" },
] as const;
export type OptionKey = (typeof OPTION_ITEMS)[number]["key"];

// 기본 보증금 (원)
export const DEFAULT_DEPOSIT = 330000;

// 월세 → 주간 환산 계수 (시세 배지 계산용): 1개월 ≈ 4.345주
export const WEEKS_PER_MONTH = 4.345;

// 시세 배지 노출 임계값(%): 차이율이 이 값 이하일 때만 "합리적 요금" 표시
export const PRICE_BADGE_MAX_DIFF_PERCENT = 15;
