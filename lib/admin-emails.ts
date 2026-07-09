// =====================================================================
// dangi 관리자 이메일 화이트리스트 (서버 전용)
//   - DB의 public.is_dangi_admin() RLS 함수와 동일한 개념의 앱 코드 게이트.
//   - BOOIN(onsia-job) Supabase를 공유하므로 "로그인=관리자"가 아니라
//     화이트리스트 이메일만 관리자 콘솔에 접근하도록 심층 방어를 건다.
//   - DANGI_ADMIN_EMAILS 는 서버 전용 env(콤마 구분). NEXT_PUBLIC_ 아님.
//   - env 미설정 시 기본 차단(false) — fail-safe.
// =====================================================================

// DANGI_ADMIN_EMAILS 를 파싱해 정규화된(트림·소문자) 이메일 Set 으로 반환.
function parseAdminEmails(): Set<string> {
  const raw = process.env.DANGI_ADMIN_EMAILS;
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0),
  );
}

// 주어진 이메일이 dangi 관리자 화이트리스트에 포함되는지 판정.
//   - null/undefined/빈 문자열 → false
//   - env 미설정(화이트리스트 비어있음) → false (기본 차단)
export function isDangiAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return parseAdminEmails().has(normalized);
}
