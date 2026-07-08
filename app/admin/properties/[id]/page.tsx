// 매물 수정
import Link from "next/link";
import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  getAdminPropertyById,
  listBookingsForProperty,
} from "@/lib/data/admin";
import { SupabaseNotice } from "@/components/admin/SupabaseNotice";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { BookingManager } from "@/components/admin/BookingManager";

export const dynamic = "force-dynamic";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-4xl">
        <SupabaseNotice />
      </div>
    );
  }

  const property = await getAdminPropertyById(id);
  if (!property) notFound();

  const bookings = await listBookingsForProperty(id);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <Link
          href="/admin/properties"
          className="text-sm text-zinc-500 hover:text-zinc-800"
        >
          ← 매물 목록
        </Link>
        <h1 className="mt-2 text-xl font-bold text-zinc-900">
          매물 수정: {property.title ?? "제목 없음"}
        </h1>
        {property.lead_id && (
          <p className="mt-1 text-xs text-zinc-400">
            리드에서 전환된 매물입니다 (lead_id: {property.lead_id.slice(0, 8)}…)
          </p>
        )}
      </div>

      <PropertyForm mode="edit" property={property} />

      <BookingManager propertyId={property.id} bookings={bookings} />
    </div>
  );
}
