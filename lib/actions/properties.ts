"use server";
// =====================================================================
// 매물 서버 액션 (authenticated Supabase — RLS authenticated 정책과 일치)
//   - 클라이언트 폼(PropertyForm)에서 호출된다.
//   - 사진 업로드는 클라이언트(Storage)에서 처리하고, URL 배열만 전달받는다.
//   - env 미설정 시 크래시 대신 { ok:false } 반환.
// =====================================================================
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  PropertyChannel,
  PropertyInsert,
  PropertyStatus,
} from "@/lib/supabase/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

// 폼에서 넘어오는 매물 입력값(직렬화 가능한 평문 객체)
export interface PropertyFormValues {
  title: string;
  address: string;
  address_detail: string;
  lat: number | null;
  lng: number | null;
  building_type: string;
  weekly_rent: number | null;
  deposit: number;
  mgmt_fee: number | null;
  min_weeks: number;
  options: Record<string, boolean>;
  photos: string[];
  market_monthly_rent: number | null;
  verified: boolean;
  status: PropertyStatus;
  lead_id: string | null;
  // 003: 파트너 채널 필드(admin 폼은 direct 기본값으로 전달)
  channel: PropertyChannel;
  partner_id: string | null;
  owner_consent: boolean;
  owner_consent_note: string | null;
}

function toRow(v: PropertyFormValues): PropertyInsert {
  return {
    title: v.title.trim() || null,
    address: v.address.trim() || null,
    address_detail: v.address_detail.trim() || null,
    lat: v.lat,
    lng: v.lng,
    building_type: v.building_type || null,
    weekly_rent: v.weekly_rent,
    deposit: v.deposit,
    mgmt_fee: v.mgmt_fee,
    min_weeks: v.min_weeks,
    options: v.options,
    photos: v.photos,
    market_monthly_rent: v.market_monthly_rent,
    verified: v.verified,
    status: v.status,
    lead_id: v.lead_id,
    channel: v.channel,
    partner_id: v.partner_id,
    owner_consent: v.owner_consent,
    owner_consent_note: v.owner_consent_note,
  };
}

export async function createProperty(
  values: PropertyFormValues,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase 미설정: 저장할 수 없습니다." };
  }
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("properties")
      .insert([toRow(values)])
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/admin/properties");
    revalidatePath("/admin");
    return { ok: true, id: data.id as string };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function updateProperty(
  id: string,
  values: PropertyFormValues,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase 미설정: 저장할 수 없습니다." };
  }
  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase
      .from("properties")
      .update(toRow(values))
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/properties");
    revalidatePath(`/admin/properties/${id}`);
    revalidatePath("/admin");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function setPropertyStatus(
  id: string,
  status: PropertyStatus,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase 미설정" };
  }
  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase
      .from("properties")
      .update({ status })
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/properties");
    revalidatePath("/admin");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function deleteProperty(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase 미설정" };
  }
  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/properties");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "알 수 없는 오류가 발생했습니다.";
}
