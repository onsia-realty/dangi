// 리드 수정
import Link from "next/link";
import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getLeadById } from "@/lib/data/admin";
import { SupabaseNotice } from "@/components/admin/SupabaseNotice";
import { LeadForm } from "@/components/admin/LeadForm";

export const dynamic = "force-dynamic";

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-3xl">
        <SupabaseNotice />
      </div>
    );
  }

  const lead = await getLeadById(id);
  if (!lead) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link
          href="/admin/leads"
          className="text-sm text-zinc-500 hover:text-zinc-800"
        >
          ← 리드 보드
        </Link>
        <h1 className="mt-2 text-xl font-bold text-zinc-900">
          리드 수정: {lead.address ?? "주소 미입력"}
        </h1>
      </div>

      <LeadForm mode="edit" lead={lead} />
    </div>
  );
}
