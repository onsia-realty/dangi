// =====================================================================
// 관리자 레이아웃 (서버 컴포넌트) — 세션 가드 + 사이드바 셸
//   - 실제 접근 보호는 middleware.ts 가 담당(미인증 → /admin/login).
//   - 이 레이아웃은 인증 상태에 따라 셸(사이드바)을 렌더한다:
//       · env 미설정 → 셸 없이 children (각 페이지가 "Supabase 연결 필요" 안내)
//       · 인증 안 됨(=로그인 페이지만 여기 도달) → 셸 없이 children
//       · 인증됨 → 사이드바 + 상단 계정 표시 + 로그아웃
// =====================================================================
import type { ReactNode } from "react";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Sidebar } from "@/components/admin/Sidebar";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const configured = isSupabaseConfigured();

  // env 미설정: 셸 없이 children (로그인/각 페이지가 안내 렌더)
  if (!configured) {
    return <BareWrapper>{children}</BareWrapper>;
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 미인증(=로그인 페이지) → 셸 없이 children
  if (!user) {
    return <BareWrapper>{children}</BareWrapper>;
  }

  // 인증됨 → 사이드바 셸
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
        {/* 사이드바 */}
        <aside className="shrink-0 border-b border-zinc-200 bg-white md:min-h-screen md:w-60 md:border-b-0 md:border-r">
          <div className="flex flex-col gap-4 p-4">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-extrabold tracking-tight text-emerald-700">
                BOOIN
              </span>
              <span className="text-xs text-zinc-400">관리자</span>
            </div>
            <Sidebar />
          </div>
        </aside>

        {/* 본문 */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3">
            <span className="truncate text-xs text-zinc-500">
              로그인: {user.email}
            </span>
            <LogoutButton />
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

function BareWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900">
      <main className="flex flex-1 items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
