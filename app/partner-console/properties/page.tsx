// 파트너 내 매물 목록 (partner_id = 본인)
//   - RLS(properties_partner_select_own)로 본인 매물만 조회된다.
import Link from "next/link";
import { PartnerGate } from "@/components/partner/PartnerGate";
import { listPartnerProperties } from "@/lib/data/partner";
import { Badge } from "@/components/ui/Badge";
import { formatKRW } from "@/lib/pricing";
import type { PropertyStatus } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<
  PropertyStatus,
  { label: string; tone: "green" | "gray" | "amber" }
> = {
  active: { label: "공개", tone: "green" },
  hidden: { label: "검수 대기", tone: "gray" },
  booked: { label: "예약", tone: "amber" },
};

export default function PartnerPropertiesPage() {
  return (
    <PartnerGate>
      {async (partner) => {
        const properties = await listPartnerProperties(partner.id);
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-zinc-900">내 매물</h1>
                <p className="mt-1 text-sm text-zinc-500">
                  전체 {properties.length}건
                </p>
              </div>
              <Link
                href="/partner-console/properties/new"
                className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                + 신규 매물 등록
              </Link>
            </div>

            {properties.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
                등록된 매물이 없습니다. &ldquo;신규 매물 등록&rdquo;으로
                추가하세요.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">제목</th>
                      <th className="px-4 py-3 font-medium">지역</th>
                      <th className="px-4 py-3 font-medium">주간요금</th>
                      <th className="px-4 py-3 font-medium">상태</th>
                      <th className="px-4 py-3 font-medium">임대인 동의</th>
                      <th className="px-4 py-3 font-medium">등록일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {properties.map((p) => {
                      const s = STATUS_LABEL[p.status];
                      return (
                        <tr key={p.id} className="hover:bg-zinc-50/60">
                          <td className="px-4 py-3 font-medium text-zinc-900">
                            {p.title ?? "제목 없음"}
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
                            {p.owner_consent ? (
                              <Badge tone="green">동의완료</Badge>
                            ) : (
                              <span className="text-xs text-zinc-400">
                                미확인
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-500">
                            {p.created_at?.slice(0, 10) ?? "-"}
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
      }}
    </PartnerGate>
  );
}
