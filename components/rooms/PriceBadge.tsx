import { Badge } from "@/components/ui/Badge";
import { getPriceBadge } from "@/lib/pricing";

// 시세 비교 배지: getPriceBadge 결과 show=true 일 때만 초록 배지 노출.
// 부정 표시(비쌈)는 하지 않으며, market_monthly_rent 미입력 시 아무것도 렌더하지 않는다.
export function PriceBadge({
  weeklyRent,
  marketMonthlyRent,
  detailed = false,
}: {
  weeklyRent: number;
  marketMonthlyRent: number | null;
  detailed?: boolean;
}) {
  const badge = getPriceBadge(weeklyRent, marketMonthlyRent);
  if (!badge.show) return null;

  const diff = badge.diffPercent ?? 0;
  const signed = diff > 0 ? `+${diff}` : `${diff}`;
  const text = `주변 월세 환산가 대비 ${signed}%`;

  if (detailed) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
        <TagIcon className="h-5 w-5 shrink-0 text-emerald-600" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-emerald-800">
            {badge.label}
          </p>
          <p className="text-xs text-emerald-700">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <Badge tone="green">
      <TagIcon className="h-3.5 w-3.5" />
      {badge.label} · {signed}%
    </Badge>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M3.5 3.5h5.17c.4 0 .78.16 1.06.44l6 6a1.5 1.5 0 010 2.12l-4.24 4.24a1.5 1.5 0 01-2.12 0l-6-6A1.5 1.5 0 013 9.24V4a.5.5 0 01.5-.5zm3 3a1 1 0 100 2 1 1 0 000-2z"
        clipRule="evenodd"
      />
    </svg>
  );
}
