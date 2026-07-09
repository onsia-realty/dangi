import { PartnerLeadForm } from "@/components/rooms/PartnerLeadForm";

export const metadata = {
  title: "임대인·중개사 안내 · BOOIN",
  description:
    "공실을 단기임대로 수익화하세요. 온시아공인중개사사무소가 검증·계약·정산을 대행합니다.",
};

// 이용 흐름 3단계 (제안 → 동의 → 등록)
const FLOW = [
  {
    n: "1",
    title: "제안",
    desc: "보유하신 공실 정보를 접수하면 온시아가 단기임대 전환을 제안하고 조건을 협의합니다.",
  },
  {
    n: "2",
    title: "동의",
    desc: "임대인·담당 중개사의 동의를 받은 매물만 등록합니다. 동의 없이는 노출되지 않습니다.",
  },
  {
    n: "3",
    title: "등록",
    desc: "온시아가 검증을 마친 뒤 매물을 등록하고, 문의·상담·계약·정산을 대행합니다.",
  },
];

// 혜택
const BENEFITS = [
  {
    title: "공실 수익화",
    desc: "비어 있는 기간을 주 단위 단기임대로 전환해 유휴 기간의 수익을 만듭니다.",
  },
  {
    title: "계약·정산 대행",
    desc: "문의 응대부터 계약 체결, 보증금·임대료 정산까지 온시아가 대신 처리합니다.",
  },
  {
    title: "검증된 신뢰",
    desc: "공인중개사가 계약 당사자로 책임지고, 세금계산서 등 증빙 발급이 가능합니다.",
  },
];

export default function PartnerPage() {
  return (
    <div>
      {/* 히어로 */}
      <section className="bg-gradient-to-b from-emerald-50 to-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
          <p className="mb-3 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            임대인 · 중개사 파트너
          </p>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-3xl">
            공실을 단기임대로
            <br />
            수익화하세요
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">
            비어 있는 매물, 그냥 두지 마세요. 온시아공인중개사사무소가 매물을
            검증하고 계약과 정산을 책임집니다. 임대인·중개사님은 공실 정보만
            알려주시면 됩니다.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="#lead-form"
              className="inline-flex items-center rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              매물 접수하기
            </a>
            <a
              href="/partner-console/apply"
              className="inline-flex items-center rounded-lg border border-emerald-600 px-5 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              공인중개사 파트너 신청
            </a>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            공인중개사님은 파트너로 승인받아 직접 매물을 등록하고, 계약 성사 시
            이용요금의 7%를 리워드로 받을 수 있습니다.
          </p>
        </div>
      </section>

      {/* 이용 흐름 */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <h2 className="text-lg font-bold text-zinc-900">이용 흐름</h2>
        <p className="mt-1 text-sm text-zinc-500">
          동의받은 매물만 등록하는 제안 → 동의 → 등록 구조입니다.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {FLOW.map((f) => (
            <div
              key={f.n}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                {f.n}
              </div>
              <h3 className="mt-3 text-base font-semibold text-zinc-900">
                {f.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 혜택 */}
      <section className="bg-zinc-50">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <h2 className="text-lg font-bold text-zinc-900">
            임대인·중개사 혜택
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-base font-semibold text-emerald-700">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 매물 접수 폼 */}
      <section id="lead-form" className="mx-auto max-w-2xl px-4 py-14 scroll-mt-20">
        <div className="text-center">
          <h2 className="text-xl font-bold text-zinc-900">매물 접수</h2>
          <p className="mt-1 text-sm text-zinc-600">
            간단한 정보만 남겨 주시면 온시아 담당자가 검토 후 연락드립니다.
          </p>
        </div>
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <PartnerLeadForm />
        </div>
      </section>
    </div>
  );
}
