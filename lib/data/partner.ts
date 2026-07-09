// =====================================================================
// 파트너(공인중개사) 데이터 접근층 — 서버 전용
//   - createServerSupabase()(로그인 세션, authenticated 롤)로 조회한다.
//   - RLS 의 properties_partner_select_own 정책에 의해 본인 파트너 매물만 조회된다.
//   - 003 미적용/조회 실패 시 안전하게 빈 배열을 반환(페이지 크래시 방지).
// =====================================================================
import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Property } from "@/lib/supabase/types";

// 본인 파트너 매물 목록 — 등록일 내림차순
export async function listPartnerProperties(
  partnerId: string,
): Promise<Property[]> {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as Property[]) ?? [];
  } catch {
    return [];
  }
}
