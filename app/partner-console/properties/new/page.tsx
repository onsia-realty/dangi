// 파트너 신규 매물 등록
//   - PropertyForm 을 variant="partner" 로 재활용(channel=partner, status=hidden 고정,
//     임대인 동의 필수). partner_id 는 PartnerGate 가 전달하는 승인된 파트너 id 사용.
import { PartnerGate } from "@/components/partner/PartnerGate";
import { PropertyForm } from "@/components/admin/PropertyForm";

export const dynamic = "force-dynamic";

export default function PartnerNewPropertyPage() {
  return (
    <PartnerGate>
      {(partner) => (
        <div className="mx-auto max-w-3xl space-y-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">신규 매물 등록</h1>
            <p className="mt-1 text-sm text-zinc-500">
              임대인 동의를 받은 매물만 등록해 주세요. 등록 후 관리자 검수를 거쳐
              공개됩니다.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <PropertyForm mode="create" variant="partner" partnerId={partner.id} />
          </div>
        </div>
      )}
    </PartnerGate>
  );
}
