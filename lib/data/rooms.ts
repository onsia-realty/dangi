// =====================================================================
// 매물 데이터 접근층
//   - 환경변수(NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)가 유효하면 Supabase(anon)에서
//     status='active' 매물만 조회한다.
//   - 미설정이거나 조회 실패 시 lib/mock.ts 목데이터로 폴백한다.
//   - 공개 조회이므로 select 에서 address_detail(상세주소)을 절대 포함하지 않는다.
// 서버 컴포넌트에서만 사용한다.
// =====================================================================
import { createServerSupabase } from "@/lib/supabase/server";
import { MOCK_BOOKINGS, MOCK_PROPERTIES } from "@/lib/mock";
import type { Booking, Property } from "@/lib/supabase/types";

// 공개 매물 타입: 상세주소(address_detail) 제외
export type PublicRoom = Omit<Property, "address_detail">;

export interface RoomFilters {
  region?: string; // 주소 텍스트 검색
  minRent?: number; // 주간요금 하한
  maxRent?: number; // 주간요금 상한
  type?: string; // 건물유형(원룸/오피스텔/아파트/기타)
  moveIn?: string; // 입주가능일(YYYY-MM-DD): 해당일 예약 겹치는 매물 제외
}

// 공개 조회에서 노출할 컬럼(address_detail 제외)
const PUBLIC_COLUMNS =
  "id, created_at, title, address, lat, lng, building_type, weekly_rent, deposit, mgmt_fee, min_weeks, options, photos, verified, market_monthly_rent, status, lead_id";

// 상세주소 제거 헬퍼(목데이터 폴백 시 공개 렌더링 보호)
function stripDetail(p: Property): PublicRoom {
  // address_detail 만 제외하고 나머지 필드를 그대로 반환
  const { address_detail: _omit, ...rest } = p;
  void _omit;
  return rest;
}

let warnedFallback = false;
function warnFallbackOnce() {
  if (!warnedFallback) {
    warnedFallback = true;
    console.warn("[dev] Supabase 미설정 → 목데이터 사용");
  }
}

// 환경변수 유효성: 존재하고 예시 placeholder 가 아닌지 확인
function isSupabaseConfigured(): boolean {
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

// 특정 입주일에 예약이 겹치는지 판정 (start_date <= moveIn <= end_date)
function isBlockedOn(bookings: Booking[], moveIn: string): Set<string> {
  const blocked = new Set<string>();
  for (const b of bookings) {
    if (!b.property_id || !b.start_date || !b.end_date) continue;
    if (b.start_date <= moveIn && moveIn <= b.end_date) {
      blocked.add(b.property_id);
    }
  }
  return blocked;
}

// ---------------------------------------------------------------------
// 목데이터 기반 필터링(폴백 경로 + 실패 복구 경로 공용)
// ---------------------------------------------------------------------
function filterMockRooms(filters: RoomFilters): PublicRoom[] {
  let rooms = MOCK_PROPERTIES.filter((p) => p.status === "active");

  if (filters.region) {
    const q = filters.region.trim();
    if (q) rooms = rooms.filter((p) => (p.address ?? "").includes(q));
  }
  if (typeof filters.minRent === "number") {
    rooms = rooms.filter((p) => (p.weekly_rent ?? 0) >= filters.minRent!);
  }
  if (typeof filters.maxRent === "number") {
    rooms = rooms.filter((p) => (p.weekly_rent ?? 0) <= filters.maxRent!);
  }
  if (filters.type) {
    rooms = rooms.filter((p) => p.building_type === filters.type);
  }
  if (filters.moveIn) {
    const blocked = isBlockedOn(MOCK_BOOKINGS, filters.moveIn);
    rooms = rooms.filter((p) => !blocked.has(p.id));
  }

  return rooms.map(stripDetail);
}

// ---------------------------------------------------------------------
// getActiveRooms: 목록 조회(필터 적용)
// ---------------------------------------------------------------------
export async function getActiveRooms(
  filters: RoomFilters = {},
): Promise<PublicRoom[]> {
  if (!isSupabaseConfigured()) {
    warnFallbackOnce();
    return filterMockRooms(filters);
  }

  try {
    const supabase = await createServerSupabase();
    let query = supabase
      .from("properties")
      .select(PUBLIC_COLUMNS)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (filters.region?.trim()) {
      query = query.ilike("address", `%${filters.region.trim()}%`);
    }
    if (typeof filters.minRent === "number") {
      query = query.gte("weekly_rent", filters.minRent);
    }
    if (typeof filters.maxRent === "number") {
      query = query.lte("weekly_rent", filters.maxRent);
    }
    if (filters.type) {
      query = query.eq("building_type", filters.type);
    }

    const { data, error } = await query;
    if (error || !data) throw error ?? new Error("no data");

    let rooms = data as unknown as PublicRoom[];

    // 입주가능일 필터: 예약 겹치는 매물 제외 (bookings 조회 실패 시 무시)
    if (filters.moveIn) {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("property_id, start_date, end_date, id, inquiry_id, memo");
      if (bookings && bookings.length > 0) {
        const blocked = isBlockedOn(bookings as Booking[], filters.moveIn);
        rooms = rooms.filter((p) => !blocked.has(p.id));
      }
    }

    return rooms;
  } catch {
    warnFallbackOnce();
    return filterMockRooms(filters);
  }
}

// ---------------------------------------------------------------------
// getRoomById: 단일 매물 조회(active 만 공개)
// ---------------------------------------------------------------------
export async function getRoomById(id: string): Promise<PublicRoom | null> {
  if (!isSupabaseConfigured()) {
    warnFallbackOnce();
    const found = MOCK_PROPERTIES.find(
      (p) => p.id === id && p.status === "active",
    );
    return found ? stripDetail(found) : null;
  }

  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("properties")
      .select(PUBLIC_COLUMNS)
      .eq("id", id)
      .eq("status", "active")
      .maybeSingle();

    if (error) throw error;
    return (data as unknown as PublicRoom) ?? null;
  } catch {
    warnFallbackOnce();
    const found = MOCK_PROPERTIES.find(
      (p) => p.id === id && p.status === "active",
    );
    return found ? stripDetail(found) : null;
  }
}

// ---------------------------------------------------------------------
// getBookingsForRoom: 매물의 예약 구간(캘린더용)
//   ※ bookings 원본은 관리자 전용 RLS 이므로 anon 은 직접 조회할 수 없다.
//     대신 3단계에서 추가한 공개 뷰 public_bookings(property_id/start_date/end_date만
//     노출, memo·inquiry_id 제외)를 읽어 anon 도 예약 구간을 조회할 수 있게 한다.
//   반환 타입은 Booking[] 을 유지하되, 뷰에 없는 필드(id/inquiry_id/memo)는 null 로 채운다.
// ---------------------------------------------------------------------
export async function getBookingsForRoom(id: string): Promise<Booking[]> {
  if (!isSupabaseConfigured()) {
    warnFallbackOnce();
    return MOCK_BOOKINGS.filter((b) => b.property_id === id);
  }

  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("public_bookings")
      .select("property_id, start_date, end_date")
      .eq("property_id", id);

    if (error) throw error;

    // 공개 뷰 결과를 Booking 형태로 정규화(민감 필드는 null)
    const rows = (data ?? []) as Array<{
      property_id: string | null;
      start_date: string | null;
      end_date: string | null;
    }>;
    return rows.map((r) => ({
      id: "",
      property_id: r.property_id,
      start_date: r.start_date,
      end_date: r.end_date,
      inquiry_id: null,
      memo: null,
    }));
  } catch {
    warnFallbackOnce();
    return MOCK_BOOKINGS.filter((b) => b.property_id === id);
  }
}
