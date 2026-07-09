// 파트너 콘솔 대시보드
//   - 내 매물 수 / 상태별 현황 + 리워드 안내 카드(7% · 예시 계산)
//   - PartnerGate 로 승인 상태를 확인하고, 승인된 경우에만 콘텐츠를 렌더한다.
import Link from "next/link";
import { PartnerGate } from "@/components/partner/PartnerGate";
import { listPartnerProperties } from "@/lib/data/partner";
import { PARTNER_REWARD_PERCENT } from "@/lib/constants";
import { formatKRW } from "@/lib/pricing";
import type { Property } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

// 예시: 이용요금 100만원 → 리워드 7만원
const EXAMPLE_FEE = 1_000_000;

function statCounts(props: Property[]) {
  let active = 0;
  let hidden = 0;
  let booked = 0;
  for (const p of props) {
    if (p.status === "active") active++;
    else if (p.status === "hidden") hidden++;
    else if (p.status === "booked") booked++;
  }
  return { total: props.length, active, hidden, booked };
}

export default function PartnerDashboardPage() {
  return (
    <PartnerGate>
      {async (partner) => {
        const props = await listPartnerProperties(partner.id);
        const s = statCounts(props);
        const exampleReward = Math.round(
          (EXAMPLE_FEE * PARTNER_REWARD_PERCENT) / 100,
        );

        const cards = [
          { label: "전체 매물", value: s.total, tone: "text-zinc-900" },
          { label: "공개", value: s.active, tone: "text-emerald-700" },
          { label: "검수 대기(숨김)", value: s.hidden, tone: "text-amber-600" },
          { label: "예약", value: s.booked, tone: "text-blue-600" },
        ];

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-zinc-900">대시보드</h1>
                <p className="mt-1 text-sm text-zinc-500">
                  {partner.office_name} 파트너 콘솔
                </p>
              </div>
              <Link
                href="/partner-console/properties/new"
                className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                + 신규 매물 등록
              </Link>
            </div>

            {/* 상태별 현황 */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {cards.map((c) => (
                <div
                  key={c.label}
                  className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-xs text-zinc-500">{c.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${c.tone}`}>
                    {c.value}
                  </p>
                </div>
              ))}
            </div>

            {/* 리워드 안내 */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <h2 className="text-base font-semibold text-emerald-800">
                계약 성사 시 이용요금의 {PARTNER_REWARD_PERCENT}% 리워드
              </h2>
              <p className="mt-2 text-sm text-emerald-900/80">
                직접 등록하신 매물이 계약으로 이어지면, 이용요금(임대료 + 관리비 +
                청소비)의 {PARTNER_REWARD_PERCENT}%를 리워드로 지급합니다.
              </p>
              <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-4">
                <p className="text-xs text-zinc-500">예시 계산</p>
                <p className="mt-1 text-sm text-zinc-800">
                  이용요금 <span className="font-semibold">{formatKRW(EXAMPLE_FEE)}</span>{" "}
                  → 리워드{" "}
                  <span className="font-bold text-emerald-700">
                    {formatKRW(exampleReward)}
                  </span>
                </p>
              </div>
              <p className="mt-3 text-xs text-emerald-900/60">
                * 등록 매물은 임대인 동의 확인 및 관리자 검수 후 공개됩니다.
              </p>
            </div>

            {props.length === 0 && (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
                아직 등록한 매물이 없습니다. &ldquo;신규 매물 등록&rdquo;으로
                시작하세요.
              </div>
            )}
          </div>
        );
      }}
    </PartnerGate>
  );
}
