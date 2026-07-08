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
                대표: (준비 중) · 사업자등록번호: 000-00-00000
              </p>
              <p className="text-xs text-zinc-500">
                중개등록번호: 0000-0000-0000 · 서울특별시
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
          <p className="mt-6 border-t border-zinc-200 pt-4 text-xs text-zinc-400">
            © {new Date().getFullYear()} 온시아(주). 공인중개사가 검증한 단기임대
            플랫폼.
          </p>
        </div>
      </footer>
    </div>
  );
}
