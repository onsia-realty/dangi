// Supabase 미설정 안내 카드 (env 없을 때 각 admin 화면에서 렌더)
export function SupabaseNotice() {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
      <p className="text-base font-semibold text-amber-800">
        Supabase 연결이 필요합니다
      </p>
      <p className="mt-2 text-sm text-amber-700">
        관리자 기능을 사용하려면 환경변수(.env.local)에 Supabase URL·키를 설정하고
        서버를 재시작하세요.
      </p>
      <ul className="mx-auto mt-3 max-w-sm space-y-1 text-left text-xs text-amber-700">
        <li>· NEXT_PUBLIC_SUPABASE_URL</li>
        <li>· NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
        <li>· SUPABASE_SERVICE_ROLE_KEY (선택)</li>
      </ul>
    </div>
  );
}
