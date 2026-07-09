// =====================================================================
// 파트너 콘솔 레이아웃 (서버 컴포넌트)
//   - /admin 과 별개의 파트너 전용 콘솔. 페이지 레벨 가드(레이아웃 분기)로 보호.
//   - middleware 의 /admin 가드는 건드리지 않는다.
//   - 상태별 렌더:
//       · env 미설정        → 셸 없이 children (login/apply/각 페이지가 안내)
//       · 미로그인          → 셸 없이 children (login 페이지가 렌더됨)
//       · 로그인+파트너승인 → 콘솔 셸(사이드바) + children
//       · 그 외(신청전/심사중/반려) → 셸 없이 children
//         (dashboard 등 페이지가 getMyPartner 로 상태별 안내를 렌더한다)
//   - 003 마이그레이션 미적용 시에도 getMyPartner 가 null 을 반환하므로 크래시 없음.
// =====================================================================
import type { ReactNode } from "react";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getMyPartner } from "@/lib/actions/partners";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { PartnerSidebar } from "@/components/partner/PartnerSidebar";

export default async function PartnerConsoleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const configured = isSupabaseConfigured();

  // env 미설정: 셸 없이 children
  if (!configured) {
    return <BareWrapper>{children}</BareWrapper>;
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 미로그인 → 셸 없이 children (login 페이지가 여기 도달)
  if (!user) {
    return <BareWrapper>{children}</BareWrapper>;
  }

  const partner = await getMyPartner();

  // 승인된 파트너만 콘솔 셸을 렌더. 나머지(신청전/심사중/반려)는 bare.
  if (partner?.status !== "approved") {
    return <BareWrapper>{children}</BareWrapper>;
  }

  // 승인됨 → 콘솔 셸
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
        <aside className="shrink-0 border-b border-zinc-200 bg-white md:min-h-screen md:w-60 md:border-b-0 md:border-r">
          <div className="flex flex-col gap-4 p-4">
            <Link href="/partner-console" className="flex items-baseline gap-2">
              <span className="text-lg font-extrabold tracking-tight text-emerald-700">
                BOOIN
              </span>
              <span className="text-xs text-zinc-400">파트너</span>
            </Link>
            <PartnerSidebar />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3">
            <span className="truncate text-xs text-zinc-500">
              {partner.office_name} · {user.email}
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
