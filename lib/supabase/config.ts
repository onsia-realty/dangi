// Supabase 환경변수 설정 여부 판정 (클라이언트/서버 공용)
// NEXT_PUBLIC_* 값만 읽으므로 브라우저·서버 어디서든 안전하게 사용 가능하다.
// placeholder(예시값)인 경우 미설정으로 간주한다.
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      url.startsWith("http") &&
      !url.includes("your-supabase-url") &&
      !key.includes("your-anon-key"),
  );
}
