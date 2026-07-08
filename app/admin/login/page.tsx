"use client";
// 관리자 로그인 (이메일/비밀번호 · Supabase Auth)
//   - 회원가입 UI 없음(온시아 계정은 Supabase 대시보드에서 수동 생성).
//   - env 미설정이면 폼 비활성 + "Supabase 미설정" 안내.
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin";
  const configured = isSupabaseConfigured();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return;
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setError("로그인에 실패했습니다. 이메일/비밀번호를 확인해 주세요.");
        setLoading(false);
        return;
      }
      // 세션 쿠키 반영 후 이동(서버 레이아웃 재평가를 위해 refresh)
      router.replace(redirect.startsWith("/admin") ? redirect : "/admin");
      router.refresh();
    } catch {
      setError("로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-zinc-100";

  return (
    <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-6 text-center">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-2xl font-extrabold tracking-tight text-emerald-700">
            BOOIN
          </span>
          <span className="text-xs text-zinc-400">관리자</span>
        </div>
        <p className="mt-1 text-sm text-zinc-500">온시아 내부 관리자 로그인</p>
      </div>

      {!configured && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
          Supabase 미설정: 환경변수(.env.local)를 설정하면 로그인할 수 있습니다.
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700">이메일</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@onsia.co.kr"
            className={fieldClass}
            disabled={!configured || loading}
            autoComplete="email"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700">비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={fieldClass}
            disabled={!configured || loading}
            autoComplete="current-password"
            required
          />
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={!configured || loading}
        >
          {loading ? "로그인 중..." : "로그인"}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-zinc-400">
        계정 발급은 온시아 관리자에게 문의하세요.
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="text-sm text-zinc-400">로딩 중...</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
