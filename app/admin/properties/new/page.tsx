// 신규 매물 등록
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SupabaseNotice } from "@/components/admin/SupabaseNotice";
import { PropertyForm } from "@/components/admin/PropertyForm";

export const dynamic = "force-dynamic";

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <Link
          href="/admin/properties"
          className="text-sm text-zinc-500 hover:text-zinc-800"
        >
          ← 매물 목록
        </Link>
        <h1 className="mt-2 text-xl font-bold text-zinc-900">신규 매물 등록</h1>
      </div>

      {isSupabaseConfigured() ? (
        <PropertyForm mode="create" />
      ) : (
        <SupabaseNotice />
      )}
    </div>
  );
}
