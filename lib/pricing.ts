// 요금/시세 관련 계산 헬퍼 (지시서 6번 시세 비교 배지 로직)
import { PRICE_BADGE_MAX_DIFF_PERCENT, WEEKS_PER_MONTH } from "./constants";

export interface PriceBadge {
  show: boolean;
  label?: string;
  // 주간요금이 월세 환산 주간가 대비 몇 % 차이인지 (양수=비쌈, 음수=쌈)
  diffPercent?: number;
}

/**
 * 시세 비교 배지 계산.
 * - 월세환산주간가 = market_monthly_rent / 4.345
 * - 차이율(%) = (weekly_rent - 월세환산주간가) / 월세환산주간가 * 100
 * - 차이율 <= +15% → { show:true, label:'합리적 요금', diffPercent }
 * - 그 외 / market_monthly_rent 미입력(null·0) → { show:false }  (부정 표시 안 함)
 */
export function getPriceBadge(
  weeklyRent: number,
  marketMonthlyRent: number | null,
): PriceBadge {
  // 시세 미입력(null/0)이면 배지 자체 미노출
  if (!marketMonthlyRent || marketMonthlyRent <= 0) {
    return { show: false };
  }

  const weeklyEquivalent = marketMonthlyRent / WEEKS_PER_MONTH;
  const diffPercent = ((weeklyRent - weeklyEquivalent) / weeklyEquivalent) * 100;

  // 반올림한 정수 퍼센트(표시용)
  const rounded = Math.round(diffPercent);

  if (diffPercent <= PRICE_BADGE_MAX_DIFF_PERCENT) {
    return { show: true, label: "합리적 요금", diffPercent: rounded };
  }

  return { show: false };
}

/**
 * 계약 총액 계산.
 * 총액 = 주간요금 × 주수 + 보증금
 * (관리비는 매물/UI에서 별도 안내하므로 여기서는 기본 미포함)
 */
export function calcTotal(
  weeklyRent: number,
  weeks: number,
  deposit: number,
): number {
  return weeklyRent * weeks + deposit;
}

/** 원화 표기 헬퍼 (예: 150000 → "150,000원") */
export function formatKRW(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}
