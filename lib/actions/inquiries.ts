"use server";
// =====================================================================
// 문의 서버 액션 (authenticated Supabase)
//   - 문의 상태 변경(신규/연락완료/계약진행/완료/취소)만 담당.
//   - 매물 예약 블록 생성 연계는 4단계에서 처리(여기서는 상태만).
// =====================================================================
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { InquiryStatus } from "@/lib/supabase/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function setInquiryStatus(
  id: string,
  status: InquiryStatus,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase 미설정" };
  }
  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase
      .from("inquiries")
      .update({ status })
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/inquiries");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "오류" };
  }
}

// 문의 내부 메모(admin_memo) 저장 — 내부 전용(공개 비노출)
export async function setInquiryMemo(
  id: string,
  memo: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase 미설정" };
  }
  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase
      .from("inquiries")
      .update({ admin_memo: memo.trim() || null })
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/inquiries");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "오류" };
  }
}
