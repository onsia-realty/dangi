import Link from "next/link";

const NAV = [
  { href: "/rooms", label: "매물" },
  { href: "/guide", label: "이용안내" },
  { href: "/partner", label: "파트너" },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold tracking-tight text-emerald-700">
              BOOIN
            </span>
            <span className="hidden text-xs text-zinc-500 sm:inline">
              공인중개사 검증 단기임대
            </span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* 본문 */}
      <main className="flex-1">{children}</main>

      {/* 푸터 */}
      <footer className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-base font-bold text-emerald-700">BOOIN</p>
              <p className="text-sm font-medium text-zinc-700">
                온시아공인중개사사무소
              </p>
              <p className="text-xs text-zinc-500">
                대표: 연대겸 · 사업자등록번호: 846-23-01501
              </p>
              <p className="text-xs text-zinc-500">
                중개사무소 등록번호: 제11710-2022-00250호
              </p>
              <p className="text-xs text-zinc-500">
                통신판매업 신고번호: 제2026-서울송파-0723호
              </p>
              <p className="text-xs text-zinc-500">
                서울특별시 송파구 중대로 197, 3층 305호 (가락동)
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-zinc-600">
                단기임대 문의를 남겨 주세요. 온시아가 직접 상담해 드립니다.
              </p>
              <Link
                href="/rooms"
                className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                매물 둘러보기
              </Link>
            </div>
          </div>
          <div className="mt-6 space-y-2 border-t border-zinc-200 pt-4">
            <p className="text-xs text-zinc-400">
              파트너 중개사무소가 등록한 매물의 경우, BOOIN은 통신판매중개자로서
              통신판매의 당사자가 아니며, 해당 거래에 관한 의무와 책임은 각
              거래 당사자에게 있습니다. 온시아공인중개사사무소가 직접 중개하는
              매물은 공인중개사법에 따라 중개대상물을 확인·설명합니다.
            </p>
            <p className="text-xs text-zinc-400">
              © {new Date().getFullYear()} 온시아공인중개사사무소. 공인중개사가
              검증하고 입주까지 함께하는 단기임대.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
