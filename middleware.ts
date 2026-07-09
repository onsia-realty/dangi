// =====================================================================
// 미들웨어: Supabase 세션 리프레시 + /admin/* 접근 보호
//   - /admin/* 경로에서만 동작(matcher). 공개 사이트에는 영향 없음.
//   - env 미설정이면 통과시키되(페이지에서 "Supabase 연결 필요" 안내),
//     설정된 경우 미인증 사용자를 /admin/login 으로 리다이렉트한다.
//   - /admin/login 은 보호에서 제외(로그인해야 하므로). 이미 로그인 상태면 대시보드로.
// =====================================================================
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isDangiAdminEmail } from "@/lib/admin-emails";

function configured(url?: string, key?: string): boolean {
  return Boolean(
    url &&
      key &&
      url.startsWith("http") &&
      !url.includes("your-supabase-url") &&
      !key.includes("your-anon-key"),
  );
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const pathname = request.nextUrl.pathname;
  const isLogin = pathname === "/admin/login";

  // env 미설정: 세션 검증 불가 → 통과(페이지에서 안내 처리)
  if (!configured(url, key)) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url!, key!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser()는 세션을 검증/갱신한다(getSession보다 안전).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 미인증 + 보호 경로(로그인 제외) → 로그인으로
  if (!user && !isLogin) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 로그인은 됐지만 화이트리스트가 아닌 계정 → 로그인 페이지로(권한 없음 안내)
  //   BOOIN 공유 DB의 일반 회원이 로그인만으로 /admin 에 들어오지 못하게 차단.
  //   로그인 페이지 자체는 예외(안내를 보여줘야 하므로).
  const isAdmin = isDangiAdminEmail(user?.email);
  if (user && !isAdmin && !isLogin) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("error", "not_admin");
    return NextResponse.redirect(redirectUrl);
  }

  // 이미 관리자로 로그인한 상태에서 로그인 페이지 접근 → 대시보드로
  if (user && isAdmin && isLogin) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
