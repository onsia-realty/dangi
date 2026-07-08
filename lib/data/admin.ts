// =====================================================================
// 관리자(admin) 데이터 접근층 — 서버 전용
//   - createServerSupabase()(로그인 세션 쿠키 기반, authenticated 롤)로 조회한다.
//     RLS 의 authenticated 정책에 따라 전체 매물/리드/문의를 조회할 수 있다.
//   - env 미설정 여부는 페이지에서 isSupabaseConfigured()로 먼저 판정하므로,
//     여기서는 조회 실패 시 안전한 기본값(빈 배열/0)을 반환한다.
//   - admin 내부 화면 전용이므로 address_detail·source_memo 등 내부 필드를 포함한다.
// =====================================================================
import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import { LEAD_STAGES } from "@/lib/constants";
import type {
  Booking,
  Inquiry,
  Lead,
  LeadStage,
  Property,
} from "@/lib/supabase/types";

// 문의 + 매물 제목(조인 결과)
export interface InquiryWithProperty extends Inquiry {
  property_title: string | null;
}

export interface DashboardStats {
  activeProperties: number;
  hiddenProperties: number;
  bookedProperties: number;
  newInquiries: number; // status='신규'
  totalInquiries: number;
  inquiriesToday: number;
  inquiriesThisWeek: number;
  leadsByStage: Record<LeadStage, number>;
  totalLeads: number;
}

// 이번 주 시작(월요일 00:00) ISO 문자열
function startOfWeekISO(now: Date): string {
  const d = new Date(now);
  const day = (d.getDay() + 6) % 7; // 월=0 ... 일=6
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d.toISOString();
}

function startOfTodayISO(now: Date): string {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// ---------------------------------------------------------------------
// 대시보드 요약 지표
// ---------------------------------------------------------------------
export async function getDashboardStats(): Promise<DashboardStats> {
  const emptyLeads = LEAD_STAGES.reduce(
    (acc, s) => ({ ...acc, [s]: 0 }),
    {} as Record<LeadStage, number>,
  );
  const empty: DashboardStats = {
    activeProperties: 0,
    hiddenProperties: 0,
    bookedProperties: 0,
    newInquiries: 0,
    totalInquiries: 0,
    inquiriesToday: 0,
    inquiriesThisWeek: 0,
    leadsByStage: emptyLeads,
    totalLeads: 0,
  };

  try {
    const supabase = await createServerSupabase();
    const now = new Date();
    const todayISO = startOfTodayISO(now);
    const weekISO = startOfWeekISO(now);

    const [properties, inquiries, leads] = await Promise.all([
      supabase.from("properties").select("status"),
      supabase.from("inquiries").select("status, created_at"),
      supabase.from("leads").select("stage"),
    ]);

    if (properties.error || inquiries.error || leads.error) return empty;

    const stats: DashboardStats = {
      ...empty,
      leadsByStage: { ...emptyLeads },
    };

    for (const p of properties.data ?? []) {
      if (p.status === "active") stats.activeProperties++;
      else if (p.status === "hidden") stats.hiddenProperties++;
      else if (p.status === "booked") stats.bookedProperties++;
    }

    for (const i of inquiries.data ?? []) {
      stats.totalInquiries++;
      if (i.status === "신규") stats.newInquiries++;
      const created = i.created_at ?? "";
      if (created >= todayISO) stats.inquiriesToday++;
      if (created >= weekISO) stats.inquiriesThisWeek++;
    }

    for (const l of leads.data ?? []) {
      stats.totalLeads++;
      const stage = l.stage as LeadStage;
      if (stage in stats.leadsByStage) stats.leadsByStage[stage]++;
    }

    return stats;
  } catch {
    return empty;
  }
}

// ---------------------------------------------------------------------
// 매물 목록(전체 상태) — 등록일 내림차순
// ---------------------------------------------------------------------
export async function listProperties(): Promise<Property[]> {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as Property[]) ?? [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------
// 단일 매물(내부 필드 포함: address_detail 등)
// ---------------------------------------------------------------------
export async function getAdminPropertyById(
  id: string,
): Promise<Property | null> {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as Property) ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------
// 리드 목록(전체) — 등록일 내림차순
// ---------------------------------------------------------------------
export async function listLeads(): Promise<Lead[]> {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as Lead[]) ?? [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------
// 단일 리드
// ---------------------------------------------------------------------
export async function getLeadById(id: string): Promise<Lead | null> {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as Lead) ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------
// 문의 목록(+ 매물 제목) — 접수일 내림차순
//   관계 타입 이슈를 피하기 위해 매물 제목은 별도 조회 후 JS 조인한다.
// ---------------------------------------------------------------------
export async function listInquiries(): Promise<InquiryWithProperty[]> {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const inquiries = (data as Inquiry[]) ?? [];
    const propIds = Array.from(
      new Set(inquiries.map((i) => i.property_id).filter(Boolean)),
    ) as string[];

    const titleMap = new Map<string, string | null>();
    if (propIds.length > 0) {
      const { data: props } = await supabase
        .from("properties")
        .select("id, title")
        .in("id", propIds);
      for (const p of props ?? []) {
        titleMap.set(p.id as string, (p.title as string | null) ?? null);
      }
    }

    return inquiries.map((i) => ({
      ...i,
      property_title: i.property_id
        ? titleMap.get(i.property_id) ?? null
        : null,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------
// 특정 매물의 예약 블록(원본 bookings, memo·inquiry_id 포함) — 시작일 오름차순
//   admin 화면 전용이므로 내부 필드를 모두 노출한다.
// ---------------------------------------------------------------------
export async function listBookingsForProperty(
  propertyId: string,
): Promise<Booking[]> {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("property_id", propertyId)
      .order("start_date", { ascending: true });
    if (error) throw error;
    return (data as Booking[]) ?? [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------
// 예약과 연결된 문의 id 목록 — 문의함에서 "예약 연결됨" 표시/중복 방지에 사용
// ---------------------------------------------------------------------
export async function listBookedInquiryIds(): Promise<Set<string>> {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("bookings")
      .select("inquiry_id")
      .not("inquiry_id", "is", null);
    if (error) throw error;
    const set = new Set<string>();
    for (const row of data ?? []) {
      const id = (row as { inquiry_id: string | null }).inquiry_id;
      if (id) set.add(id);
    }
    return set;
  } catch {
    return new Set<string>();
  }
}
