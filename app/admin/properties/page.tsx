// 매물 관리 목록 (전체 상태) — 제목·지역·주간요금·상태·검증·등록일
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listProperties } from "@/lib/data/admin";
import { SupabaseNotice } from "@/components/admin/SupabaseNotice";
import { PropertyRowActions } from "@/components/admin/PropertyRowActions";
import { Badge } from "@/components/ui/Badge";
import { formatKRW } from "@/lib/pricing";
import type { PropertyStatus } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<PropertyStatus, { label: string; tone: "green" | "gray" | "amber" }> = {
  active: { label: "공개", tone: "green" },
  hidden: { label: "숨김", tone: "gray" },
  booked: { label: "예약", tone: "amber" },
};

export default async function AdminPropertiesPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseNotice />;
  }

  const properties = await listProperties();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">매물 관리</h1>
          <p className="mt-1 text-sm text-zinc-500">
            전체 {properties.length}건 (공개/숨김/예약 포함)
          </p>
        </div>
        <Link
          href="/admin/properties/new"
          className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + 신규 매물 등록
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
          등록된 매물이 없습니다. &ldquo;신규 매물 등록&rdquo;으로 추가하세요.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">제목</th>
                <th className="px-4 py-3 font-medium">지역</th>
                <th className="px-4 py-3 font-medium">주간요금</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">검증</th>
                <th className="px-4 py-3 font-medium">등록일</th>
                <th className="px-4 py-3 font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {properties.map((p) => {
                const s = STATUS_LABEL[p.status];
                return (
                  <tr key={p.id} className="hover:bg-zinc-50/60">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/properties/${p.id}`}
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        {p.title ?? "제목 없음"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {p.address ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-zinc-800">
                      {p.weekly_rent ? formatKRW(p.weekly_rent) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={s.tone}>{s.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {p.verified ? (
                        <Badge tone="green">검증완료</Badge>
                      ) : (
                        <span className="text-xs text-zinc-400">미검증</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {p.created_at?.slice(0, 10) ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <PropertyRowActions id={p.id} status={p.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
