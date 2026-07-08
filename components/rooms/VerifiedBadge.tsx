import { Badge } from "@/components/ui/Badge";

// 공인중개사 검증 뱃지: verified=true 일 때만 노출.
// size="lg" 는 상세 페이지 강조용, 기본은 카드용 소형.
export function VerifiedBadge({
  verified,
  size = "sm",
}: {
  verified: boolean;
  size?: "sm" | "lg";
}) {
  if (!verified) return null;

  if (size === "lg") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
        <ShieldIcon className="h-5 w-5 shrink-0 text-emerald-600" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-emerald-800">
            공인중개사 검증 완료
          </p>
          <p className="text-xs text-emerald-700">
            온시아공인중개사사무소가 등기부 등 권리관계를 확인했습니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <Badge tone="green">
      <ShieldIcon className="h-3.5 w-3.5" />
      공인중개사 검증
    </Badge>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M10 1.5l6 2.4v4.6c0 3.9-2.5 7.4-6 8.5-3.5-1.1-6-4.6-6-8.5V3.9l6-2.4zm2.7 6.2a.75.75 0 00-1.1-1l-2.6 2.9-1.1-1.1a.75.75 0 10-1.05 1.07l1.67 1.63a.75.75 0 001.08-.03l3.11-3.47z"
        clipRule="evenodd"
      />
    </svg>
  );
}
