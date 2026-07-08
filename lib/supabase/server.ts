// 서버(서버 컴포넌트 / 라우트 핸들러 / 서버 액션)용 Supabase 클라이언트
// Next.js 15+ 에서 cookies() 가 비동기이므로 await 로 접근한다.
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./types";

// 일반(anon) 서버 클라이언트: 로그인 세션 쿠키를 읽고/갱신한다.
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // 서버 컴포넌트에서 호출되면 set 이 불가할 수 있다.
            // 미들웨어에서 세션을 갱신한다면 이 예외는 무시해도 된다.
          }
        },
      },
    },
  );
}

// 관리자(service_role) 클라이언트: RLS 를 우회한다.
// ⚠️ 서버 전용. 절대 클라이언트 코드로 import 하지 말 것.
// service_role 키가 없으면 명시적으로 에러를 던진다.
export function createAdminSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다. admin 클라이언트를 사용할 수 없습니다.",
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
