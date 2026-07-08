"use server";
// =====================================================================
// 파트너(임대인/중개사) 자가 접수 서버 액션
//   - 공개 페이지(/partner)의 매물 접수 폼에서 호출된다.
//   - anon RLS 로는 leads INSERT 가 불가(관리자 전용)하므로,
//     service_role 클라이언트(createAdminSupabase)로 RLS 를 우회해 INSERT 한다.
//   - stage 는 '발굴'로 시작, source_memo 에 자가접수 출처를 표기(내부 전용).
//   - service_role 키 미설정 시에는 실제 저장 대신 데모 성공 처리(문의폼과 동일 패턴).
// =====================================================================
import { createAdminSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { LeadInsert } from "@/lib/supabase/types";

export interface PartnerLeadValues {
  address: string;
  owner_name: string;
  owner_contact: string;
  memo: string;
}

export interface PartnerLeadResult {
  ok: boolean;
  error?: string;
}

// service_role 로 저장 가능한 상태인지 판정.
// NEXT_PUBLIC 값(URL/anon) + SUPABASE_SERVICE_ROLE_KEY 가 모두 있어야 실제 저장한다.
function canPersist(): boolean {
  return (
    isSupabaseConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

export async function submitPartnerLead(
  values: PartnerLeadValues,
): Promise<PartnerLeadResult> {
  // 서버 측 최종 검증(클라이언트 검증과 별개로 방어)
  const address = values.address.trim();
  const ownerName = values.owner_name.trim();
  const ownerContact = values.owner_contact.trim();
  const memo = values.memo.trim();

  if (!address) return { ok: false, error: "매물 주소를 입력해 주세요." };
  if (!ownerContact) return { ok: false, error: "연락처를 입력해 주세요." };

  const row: LeadInsert = {
    address,
    owner_name: ownerName || null,
    owner_contact: ownerContact,
    // 출처를 명확히 남겨 관리자가 자가접수 리드를 구분할 수 있게 한다(내부 전용).
    source_memo: `파트너 자가접수: ${memo || "(메모 없음)"}`,
    stage: "발굴",
  };

  // service_role 미설정: 실제 INSERT 대신 데모 성공 처리(개발/미연동 환경)
  if (!canPersist()) {
    console.log("[dev] 파트너 접수 데모 제출(service_role 미설정):", row);
    return { ok: true };
  }

  try {
    const supabase = createAdminSupabase();
    const { error } = await supabase.from("leads").insert([row]);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    console.error("파트너 접수 실패:", e);
    return {
      ok: false,
      error: "접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
}
