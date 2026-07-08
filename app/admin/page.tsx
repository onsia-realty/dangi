// 관리자 대시보드 — 요약 지표(카드 클릭 시 해당 목록으로 이동)
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getDashboardStats } from "@/lib/data/admin";
import { SupabaseNotice } from "@/components/admin/SupabaseNotice";
import { LEAD_STAGES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseNotice />;
  }

  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">대시보드</h1>
        <p className="mt-1 text-sm text-zinc-500">
          온시아 단기임대 운영 현황 요약
        </p>
      </div>

      {/* 상단 요약 카드 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          href="/admin/properties"
          label="공개(active) 매물"
          value={stats.activeProperties}
          tone="emerald"
        />
        <StatCard
          href="/admin/inquiries"
          label="신규 문의"
          value={stats.newInquiries}
          tone="sky"
        />
        <StatCard
          href="/admin/inquiries"
          label="오늘 접수 문의"
          value={stats.inquiriesToday}
          tone="zinc"
        />
        <StatCard
          href="/admin/inquiries"
          label="이번 주 문의"
          value={stats.inquiriesThisWeek}
          tone="zinc"
        />
      </div>

      {/* 매물 상태 분포 */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-zinc-700">매물 상태</h2>
        <div className="grid grid-cols-3 gap-3">
          <MiniStat label="공개(active)" value={stats.activeProperties} />
          <MiniStat label="숨김(hidden)" value={stats.hiddenProperties} />
          <MiniStat label="예약(booked)" value={stats.bookedProperties} />
        </div>
      </section>

      {/* 리드 파이프라인 단계별 카운트 */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700">
            리드 파이프라인 (총 {stats.totalLeads}건)
          </h2>
          <Link
            href="/admin/leads"
            className="text-xs font-medium text-emerald-700 hover:underline"
          >
            보드 열기 →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {LEAD_STAGES.map((stage) => (
            <Link
              key={stage}
              href="/admin/leads"
              className="rounded-lg border border-zinc-200 bg-white p-3 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40"
            >
              <p className="text-xs text-zinc-500">{stage}</p>
              <p className="mt-1 text-lg font-bold text-zinc-900">
                {stats.leadsByStage[stage]}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

const TONE: Record<string, string> = {
  emerald: "text-emerald-700",
  sky: "text-sky-700",
  zinc: "text-zinc-900",
};

function StatCard({
  href,
  label,
  value,
  tone,
}: {
  href: string;
  label: string;
  value: number;
  tone: keyof typeof TONE;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-emerald-300 hover:shadow-sm"
    >
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${TONE[tone]}`}>{value}</p>
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-zinc-900">{value}</p>
    </div>
  );
}
