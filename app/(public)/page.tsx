import Link from "next/link";
import { RoomCard } from "@/components/rooms/RoomCard";
import { getActiveRooms } from "@/lib/data/rooms";

const STEPS = [
  {
    n: "1",
    title: "검증된 매물 탐색",
    desc: "공인중개사가 등기부와 권리관계를 확인한 매물만 노출됩니다.",
  },
  {
    n: "2",
    title: "계약 문의",
    desc: "원하는 매물에서 입주일과 기간을 남기면 온시아가 상담합니다.",
  },
  {
    n: "3",
    title: "안전한 계약",
    desc: "공인중개사가 계약을 책임집니다. 세금계산서·증빙도 가능합니다.",
  },
];

// 차별점: 왜 공인중개사 검증인가
const REASONS = [
  {
    title: "공인중개사 검증",
    desc: "등기부·권리관계를 확인하고 임대인 동의를 받은 매물만 등록해 전대사기 위험을 줄입니다.",
  },
  {
    title: "계약 책임 · 증빙",
    desc: "임대인 직거래와 달리 공인중개사가 계약 당사자로 책임지고, 세금계산서 등 증빙이 가능합니다.",
  },
  {
    title: "합리적인 주간 요금",
    desc: "주 단위 계약에 고정 보증금. 주변 월세 시세와 비교한 적정가 배지로 요금을 투명하게 안내합니다.",
  },
];

export default async function HomePage() {
  const rooms = await getActiveRooms();
  const featured = rooms.slice(0, 6);

  return (
    <div>
      {/* 히어로 */}
      <section className="bg-gradient-to-b from-emerald-50 to-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            공인중개사 검증 · 계약 책임
          </p>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-4xl">
            공인중개사가 검증한
            <br />
            안심 단기임대
          </h1>
          <p className="mt-4 max-w-xl text-base text-zinc-600">
            전대사기 걱정 없이, 주 단위로 계약하세요. 온시아공인중개사사무소가
            매물을 직접 확인하고 계약을 책임집니다.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/rooms"
              className="inline-flex items-center rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              매물 둘러보기
            </Link>
            <Link
              href="/guide"
              className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              이용 안내
            </Link>
          </div>
        </div>
      </section>

      {/* 차별점: 왜 BOOIN인가 */}
      <section className="mx-auto max-w-5xl px-4 pt-12">
        <h2 className="text-xl font-bold text-zinc-900">
          왜 공인중개사가 검증한 단기임대일까요?
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          임대인이 직접 올리는 직거래 플랫폼과 다릅니다.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {REASONS.map((r) => (
            <div
              key={r.title}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-base font-semibold text-emerald-700">
                {r.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 이용 흐름 3단계 */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-xl font-bold text-zinc-900">이용 흐름</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                {s.n}
              </div>
              <h3 className="mt-3 text-base font-semibold text-zinc-900">
                {s.title}
              </h3>
              <p className="mt-1 text-sm text-zinc-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 추천 매물 */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900">추천 매물</h2>
          <Link
            href="/rooms"
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            전체 보기 →
          </Link>
        </div>
        {featured.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-zinc-500">
            현재 노출 가능한 매물이 없습니다.
          </p>
        )}
      </section>

      {/* 임대인·중개사 CTA */}
      <section className="border-t border-zinc-200 bg-emerald-50">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">
              공실을 보유한 임대인·중개사이신가요?
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              온시아가 검증·계약·정산을 대행합니다. 공실을 단기임대로
              수익화하세요.
            </p>
          </div>
          <Link
            href="/partner"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            파트너 안내 보기
          </Link>
        </div>
      </section>
    </div>
  );
}
