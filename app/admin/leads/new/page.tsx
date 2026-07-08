// 신규 리드 등록
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SupabaseNotice } from "@/components/admin/SupabaseNotice";
import { LeadForm } from "@/components/admin/LeadForm";

export const dynamic = "force-dynamic";

export default function NewLeadPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link
          href="/admin/leads"
          className="text-sm text-zinc-500 hover:text-zinc-800"
        >
          ← 리드 보드
        </Link>
        <h1 className="mt-2 text-xl font-bold text-zinc-900">신규 리드 등록</h1>
      </div>

      {isSupabaseConfigured() ? (
        <LeadForm mode="create" />
      ) : (
        <SupabaseNotice />
      )}
    </div>
  );
}
