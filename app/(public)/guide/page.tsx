import Link from "next/link";
import { GuideFaq, type FaqItem } from "@/components/rooms/GuideFaq";
import { formatKRW } from "@/lib/pricing";
import { DEFAULT_DEPOSIT } from "@/lib/constants";

export const metadata = {
  title: "이용 안내 · BOOIN",
  description:
    "공인중개사가 검증하는 단기임대 이용 안내 — 계약 절차, 보증금·정산, 자주 묻는 질문.",
};

// 계약 절차 4단계
const STEPS = [
  {
    n: "1",
    title: "매물 문의",
    desc: "원하는 매물 상세에서 이름·연락처·희망 입주일·기간을 남깁니다. 온라인 결제는 없습니다.",
  },
  {
    n: "2",
    title: "온시아 상담",
    desc: "온시아공인중개사사무소가 전화 또는 카카오톡으로 매물 상태와 조건을 안내합니다.",
  },
  {
    n: "3",
    title: "계약 체결",
    desc: "오프라인 또는 전자계약으로 표준 절차에 따라 계약합니다. 세금계산서·증빙 발급이 가능합니다.",
  },
  {
    n: "4",
    title: "입주",
    desc: "계약이 확정되면 상세 주소·입주 안내를 받고 입주합니다. 해당 기간은 캘린더에 예약 처리됩니다.",
  },
];

const FAQ: FaqItem[] = [
  {
    q: "'공인중개사 검증'이 정확히 무엇인가요?",
    a: "온시아공인중개사사무소가 등기부와 권리관계를 확인하고, 임대인 동의를 받은 매물만 등록합니다. 임대인이 직접 올리는 직거래와 달리 공인중개사가 매물을 검증하고 계약을 책임지므로 전대사기 위험을 줄일 수 있습니다.",
  },
  {
    q: "삼삼엠투(33m²) 같은 직거래 플랫폼과 무엇이 다른가요?",
    a: "직거래 플랫폼은 임대인이 매물을 직접 등록해 계약서·세금계산서·법인 증빙이 어렵고 전대사기 리스크가 있습니다. BOOIN은 공인중개사가 계약 당사자로 책임지며, 세금계산서 등 증빙 발급이 가능합니다.",
  },
  {
    q: "최소 계약 기간은 얼마인가요?",
    a: "주 단위 계약이며 최소 계약 주수는 매물마다 다릅니다(기본 1주). 각 매물 상세의 '최소 계약' 항목에서 확인할 수 있습니다.",
  },
  {
    q: "요금은 어떻게 계산되나요?",
    a: `주간 요금 체계입니다. 총 임대료 = 주간요금 × 계약 주수이며, 여기에 보증금(기본 ${formatKRW(
      DEFAULT_DEPOSIT,
    )})이 더해집니다. 관리비가 있는 매물은 별도로 안내됩니다.`,
  },
  {
    q: "결제와 계약은 어떤 방식으로 진행되나요?",
    a: "현재 온라인 결제는 제공하지 않습니다. 문의 접수 후 온시아 상담을 거쳐 계약과 결제(보증금·임대료) 방법을 개별 안내합니다. 온라인 결제·전자계약 자동화는 추후 도입 예정입니다.",
  },
  {
    q: "상세 주소는 언제 확인할 수 있나요?",
    a: "개인정보·보안을 위해 매물 상세에서는 지역까지만 공개합니다. 정확한 상세 주소는 계약 확정 후 안내됩니다.",
  },
];

function SettlementRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-100 py-3 last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-right text-sm font-medium text-zinc-900">
        {value}
      </span>
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      {/* 헤더 */}
      <header className="max-w-2xl">
        <p className="mb-3 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          이용 안내
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
          공인중개사가 검증한 단기임대, 이렇게 이용합니다
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          온라인 결제 없이, 문의 → 상담 → 계약 → 입주의 간단한 흐름으로
          진행됩니다. 계약은 온시아공인중개사사무소가 책임집니다.
        </p>
      </header>

      {/* 계약 절차 */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-zinc-900">계약 절차</h2>
        <ol className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="relative rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                {s.n}
              </div>
              <h3 className="mt-3 text-base font-semibold text-zinc-900">
                {s.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                {s.desc}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* 보증금·정산 안내 */}
      <section className="mt-12">
        <h2 className="text-lg font-bold text-zinc-900">보증금 · 정산 안내</h2>
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-900">요금 구성</h3>
            <div className="mt-2">
              <SettlementRow
                label="기본 보증금"
                value={`${formatKRW(DEFAULT_DEPOSIT)} (매물별 변경 가능)`}
              />
              <SettlementRow
                label="임대료"
                value="주간요금 × 계약 주수"
              />
              <SettlementRow
                label="관리비"
                value="매물별 상이 · 있으면 별도 안내"
              />
              <SettlementRow label="최소 계약" value="주 단위 (매물별 최소 주수)" />
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-900">
              보증금과 퇴실 정산
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-600">
              <li>
                · 보증금은 계약 시 예치하고, 퇴실 시 시설 상태와 미납 비용을
                확인한 뒤 환급합니다.
              </li>
              <li>
                · 관리비·공과금 등 정산 대상 비용이 있으면 보증금에서 정산 후
                잔액을 돌려드립니다.
              </li>
              <li>
                · 구체적인 예치·환급·정산 방법은 계약 전 온시아 상담에서
                안내합니다.
              </li>
            </ul>
            <p className="mt-4 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
              온라인 결제·에스크로는 현재 제공하지 않으며, 상담을 통해 개별
              안내합니다.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-12">
        <h2 className="text-lg font-bold text-zinc-900">자주 묻는 질문</h2>
        <div className="mt-5">
          <GuideFaq items={FAQ} />
        </div>
      </section>

      {/* 하단 CTA */}
      <section className="mt-12 rounded-2xl bg-emerald-50 px-6 py-8 text-center">
        <h2 className="text-lg font-bold text-zinc-900">
          검증된 매물을 지금 둘러보세요
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          조건에 맞는 매물을 찾고 바로 문의를 남길 수 있습니다.
        </p>
        <Link
          href="/rooms"
          className="mt-4 inline-flex items-center rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          매물 둘러보기
        </Link>
      </section>
    </div>
  );
}
