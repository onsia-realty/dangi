"use server";
// =====================================================================
// 리드 서버 액션 (authenticated Supabase)
//   - 리드 CRUD + stage 이동 + "매물로 전환"
//   - source_memo 는 내부 전용(공개 화면에 절대 노출되지 않음).
// =====================================================================
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEFAULT_DEPOSIT, LEAD_CONVERTIBLE_STAGE } from "@/lib/constants";
import type { LeadInsert, LeadStage } from "@/lib/supabase/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

export interface LeadFormValues {
  address: string;
  owner_name: string;
  owner_contact: string;
  source_memo: string; // 내부 전용
  stage: LeadStage;
  proposed_at: string | null;
  agreed_at: string | null;
  agree_memo: string;
  assignee: string;
}

function toRow(v: LeadFormValues): LeadInsert {
  return {
    address: v.address.trim() || null,
    owner_name: v.owner_name.trim() || null,
    owner_contact: v.owner_contact.trim() || null,
    source_memo: v.source_memo.trim() || null,
    stage: v.stage,
    proposed_at: v.proposed_at,
    agreed_at: v.agreed_at,
    agree_memo: v.agree_memo.trim() || null,
    assignee: v.assignee.trim() || null,
  };
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "알 수 없는 오류가 발생했습니다.";
}

export async function createLead(
  values: LeadFormValues,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase 미설정: 저장할 수 없습니다." };
  }
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("leads")
      .insert([toRow(values)])
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/admin/leads");
    revalidatePath("/admin");
    return { ok: true, id: data.id as string };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function updateLead(
  id: string,
  values: LeadFormValues,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase 미설정: 저장할 수 없습니다." };
  }
  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase
      .from("leads")
      .update(toRow(values))
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/leads");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function updateLeadStage(
  id: string,
  stage: LeadStage,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase 미설정" };
  }
  try {
    const supabase = await createServerSupabase();
    // 동의완료로 이동 시 agreed_at 이 비어 있으면 오늘 날짜로 채운다(편의).
    const patch: { stage: LeadStage; agreed_at?: string } = { stage };
    if (stage === "동의완료") {
      const { data: cur } = await supabase
        .from("leads")
        .select("agreed_at")
        .eq("id", id)
        .maybeSingle();
      if (cur && !cur.agreed_at) {
        patch.agreed_at = new Date().toISOString().slice(0, 10);
      }
    }
    const { error } = await supabase.from("leads").update(patch).eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/leads");
    revalidatePath("/admin");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function deleteLead(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase 미설정" };
  }
  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/leads");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

// ---------------------------------------------------------------------
// 매물로 전환: '동의완료' 리드만 가능
//   - 리드 정보(주소)로 properties 신규 생성(status='hidden' — 나머지 입력 전이므로 비공개)
//   - properties.lead_id 로 리드 연결
//   - 리드 stage 를 '등록완료'로 변경
//   - 생성된 매물 id 반환 → 클라이언트가 편집 화면으로 이동
// ---------------------------------------------------------------------
export async function convertLeadToProperty(
  leadId: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase 미설정: 전환할 수 없습니다." };
  }
  try {
    const supabase = await createServerSupabase();

    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .maybeSingle();
    if (leadErr) throw leadErr;
    if (!lead) return { ok: false, error: "리드를 찾을 수 없습니다." };
    if (lead.stage !== LEAD_CONVERTIBLE_STAGE) {
      return {
        ok: false,
        error: `'${LEAD_CONVERTIBLE_STAGE}' 상태의 리드만 매물로 전환할 수 있습니다.`,
      };
    }

    // 매물 신규 생성(요금/사진 등은 편집 화면에서 마저 입력 → 비공개 hidden 으로 시작)
    const { data: prop, error: propErr } = await supabase
      .from("properties")
      .insert([
        {
          title: lead.address ? `${lead.address} 단기임대` : "신규 매물",
          address: lead.address,
          deposit: DEFAULT_DEPOSIT,
          min_weeks: 1,
          verified: false,
          status: "hidden",
          lead_id: lead.id,
        },
      ])
      .select("id")
      .single();
    if (propErr) throw propErr;

    // 리드 stage → 등록완료
    const { error: stageErr } = await supabase
      .from("leads")
      .update({ stage: "등록완료" })
      .eq("id", leadId);
    if (stageErr) throw stageErr;

    revalidatePath("/admin/leads");
    revalidatePath("/admin/properties");
    revalidatePath("/admin");
    return { ok: true, id: prop.id as string };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}
