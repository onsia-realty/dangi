// 리드 파이프라인 — 칸반 보드
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listLeads } from "@/lib/data/admin";
import { SupabaseNotice } from "@/components/admin/SupabaseNotice";
import { LeadBoard } from "@/components/admin/LeadBoard";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseNotice />;
  }

  const leads = await listLeads();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">리드 파이프라인</h1>
          <p className="mt-1 text-sm text-zinc-500">
            공실 발굴 → 제안 → 동의 → 매물 전환 트래킹 (총 {leads.length}건)
          </p>
        </div>
        <Link
          href="/admin/leads/new"
          className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + 신규 리드
        </Link>
      </div>

      <LeadBoard leads={leads} />

      <p className="text-xs text-zinc-400">
        &lsquo;동의완료&rsquo; 단계 카드의 &lsquo;매물로 전환&rsquo; 버튼으로 매물을 생성합니다.
      </p>
    </div>
  );
}
