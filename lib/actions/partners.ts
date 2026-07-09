"use server";
// =====================================================================
// 파트너(공인중개사) 자가 신청·조회 서버 액션
//   - 파트너 콘솔(/partner-console)에서 호출된다.
//   - authenticated(로그인 세션) Supabase 로 동작 → RLS 정책이 검증한다.
//       · applyPartner: partners_insert_self (user_id=auth.uid() AND status='pending')
//       · getMyPartner:  partners_select_own_or_admin
//   - service_role 을 쓰지 않는다(RLS 가 본인 확인을 담당).
//   - 003 마이그레이션 미적용(테이블 없음) 시에도 크래시하지 않고 안내 처리.
// =====================================================================
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { DangiPartner } from "@/lib/supabase/types";

// 신청 폼 입력값(직렬화 가능한 평문 객체)
export interface PartnerApplyValues {
  office_name: string;
  registration_no: string;
  business_no: string;
  phone: string;
  settle_bank?: string;
  settle_account?: string;
}

export interface PartnerActionResult {
  ok: boolean;
  error?: string;
  // 이미 신청/승인된 상태를 UI 가 구분할 수 있게 상태를 함께 반환
  status?: string;
}

// DB 오류 메시지에서 "테이블 없음"(마이그레이션 미적용)을 판별.
function isMissingTable(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg.includes("dangi_partners") &&
    (msg.includes("does not exist") ||
      msg.includes("relation") ||
      msg.includes("schema cache"))
  );
}

// ---------------------------------------------------------------------
// 본인 파트너 row 조회 (없으면 null)
//   - 미로그인/미설정/테이블없음 → null (호출부에서 안내)
// ---------------------------------------------------------------------
export async function getMyPartner(): Promise<DangiPartner | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("dangi_partners")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    return (data as DangiPartner) ?? null;
  } catch {
    // 테이블 없음/조회 실패 → null (콘솔에서 신청 안내 or 오류 문구)
    return null;
  }
}

// ---------------------------------------------------------------------
// 파트너 신청 (pending insert)
//   - 이미 신청/승인된 경우 상태를 그대로 반환(중복 방지: user_id UNIQUE)
// ---------------------------------------------------------------------
export async function applyPartner(
  values: PartnerApplyValues,
): Promise<PartnerActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase 미설정: 신청할 수 없습니다." };
  }

  // 서버 측 최종 검증
  const office = values.office_name.trim();
  const regNo = values.registration_no.trim();
  const bizNo = values.business_no.trim();
  const phone = values.phone.trim();
  if (!office) return { ok: false, error: "중개사무소 상호를 입력해 주세요." };
  if (!regNo)
    return { ok: false, error: "중개사무소 등록번호를 입력해 주세요." };

  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return { ok: false, error: "로그인이 필요합니다." };
    }

    // 이미 신청/승인된 상태면 그대로 안내(중복 insert 방지)
    const { data: existing } = await supabase
      .from("dangi_partners")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) {
      return {
        ok: true,
        status: (existing.status as string) ?? "pending",
      };
    }

    const { error } = await supabase.from("dangi_partners").insert([
      {
        user_id: user.id,
        email: user.email,
        office_name: office,
        registration_no: regNo,
        business_no: bizNo || null,
        phone: phone || null,
        settle_bank: values.settle_bank?.trim() || null,
        settle_account: values.settle_account?.trim() || null,
        status: "pending",
      },
    ]);
    if (error) throw error;

    return { ok: true, status: "pending" };
  } catch (e) {
    if (isMissingTable(e)) {
      return {
        ok: false,
        error:
          "파트너 신청 기능이 아직 준비 중입니다(DB 설정 대기). 잠시 후 다시 시도해 주세요.",
      };
    }
    // UNIQUE 위반(동시 신청 등) 방어
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return { ok: true, status: "pending" };
    }
    return {
      ok: false,
      error: "신청 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
}
