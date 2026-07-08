// 문의 관리 — 목록 + 상태 변경
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listBookedInquiryIds, listInquiries } from "@/lib/data/admin";
import { SupabaseNotice } from "@/components/admin/SupabaseNotice";
import { InquiryStatusSelect } from "@/components/admin/InquiryStatusSelect";
import { InquiryBookingButton } from "@/components/admin/InquiryBookingButton";
import { InquiryMemo } from "@/components/admin/InquiryMemo";

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseNotice />;
  }

  const [inquiries, bookedInquiryIds] = await Promise.all([
    listInquiries(),
    listBookedInquiryIds(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">문의 관리</h1>
        <p className="mt-1 text-sm text-zinc-500">
          계약 문의 {inquiries.length}건 — 상태를 변경해 상담 진행을 관리하세요.
        </p>
      </div>

      {inquiries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
          접수된 문의가 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">접수일</th>
                <th className="px-4 py-3 font-medium">매물</th>
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium">연락처</th>
                <th className="px-4 py-3 font-medium">희망입주일</th>
                <th className="px-4 py-3 font-medium">기간</th>
                <th className="px-4 py-3 font-medium">메시지</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">내부 메모</th>
                <th className="px-4 py-3 font-medium">예약</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {inquiries.map((i) => (
                <tr key={i.id} className="hover:bg-zinc-50/60 align-top">
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {i.created_at?.slice(0, 10) ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    {i.property_id ? (
                      <Link
                        href={`/admin/properties/${i.property_id}`}
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        {i.property_title ?? "매물"}
                      </Link>
                    ) : (
                      <span className="text-zinc-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-800">{i.name ?? "-"}</td>
                  <td className="px-4 py-3 text-zinc-600">{i.phone ?? "-"}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {i.move_in ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {i.weeks ? `${i.weeks}주` : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="block max-w-[220px] truncate text-zinc-600"
                      title={i.message ?? ""}
                    >
                      {i.message ?? "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <InquiryStatusSelect id={i.id} status={i.status} />
                  </td>
                  <td className="px-4 py-3">
                    <InquiryMemo id={i.id} memo={i.admin_memo} />
                  </td>
                  <td className="px-4 py-3">
                    <InquiryBookingButton
                      inquiryId={i.id}
                      propertyId={i.property_id}
                      moveIn={i.move_in}
                      weeks={i.weeks}
                      name={i.name}
                      status={i.status}
                      alreadyBooked={bookedInquiryIds.has(i.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
