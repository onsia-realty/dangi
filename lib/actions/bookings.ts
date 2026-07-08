"use server";
// =====================================================================
// 예약 블록(bookings) 서버 액션 — authenticated Supabase (RLS bookings_admin_all)
//   - 매물 캘린더에 계약 기간을 블록 처리한다(지시서 4-C).
//   - 문의(inquiry)로부터 예약 블록을 생성하는 연계 액션도 포함(4-C 4번).
//
// 경계일(end_date) 기준 — 코드베이스 전역 규칙과 통일:
//   · end_date 는 "예약 구간의 마지막 날(포함)"로 취급한다.
//   · 공개 캘린더(AvailabilityCalendar)·목록 필터(isBlockedOn)가 이미
//     [start_date, end_date] 를 양끝 포함(inclusive)으로 처리하므로 이에 맞춘다.
//   · 두 예약 [s1,e1],[s2,e2] 의 겹침 판정: (s1 <= e2) AND (s2 <= e1).
//   · 문의→예약 자동 계산 시 end_date = move_in + weeks*7 (체크아웃일 포함, 보수적 블록).
//     이는 기존 seed(6주=06-25~08-06) 데이터와 동일한 규칙이다.
// =====================================================================
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Booking } from "@/lib/supabase/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

export interface CreateBookingInput {
  property_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD (마지막 예약일 포함)
  memo?: string | null;
  inquiry_id?: string | null;
}

// YYYY-MM-DD 문자열에 일수를 더한다(UTC 기준, 타임존 흔들림 방지).
function addDaysISO(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

// 같은 매물의 기존 예약과 [start,end] 가 겹치는지 검사(양끝 포함).
// excludeId 는 수정 시 자기 자신을 제외하기 위한 것.
function overlaps(
  existing: Pick<Booking, "id" | "start_date" | "end_date">[],
  start: string,
  end: string,
  excludeId?: string,
): boolean {
  return existing.some((b) => {
    if (excludeId && b.id === excludeId) return false;
    if (!b.start_date || !b.end_date) return false;
    return b.start_date <= end && start <= b.end_date;
  });
}

async function fetchPropertyBookings(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  propertyId: string,
): Promise<Pick<Booking, "id" | "start_date" | "end_date">[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("id, start_date, end_date")
    .eq("property_id", propertyId);
  if (error) throw error;
  return (data as Pick<Booking, "id" | "start_date" | "end_date">[]) ?? [];
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "알 수 없는 오류가 발생했습니다.";
}

function revalidateBookingPaths(propertyId: string) {
  revalidatePath(`/admin/properties/${propertyId}`);
  revalidatePath("/admin/properties");
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
  revalidatePath(`/rooms/${propertyId}`);
}

// ---------------------------------------------------------------------
// 예약 블록 생성
// ---------------------------------------------------------------------
export async function createBooking(
  input: CreateBookingInput,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase 미설정: 저장할 수 없습니다." };
  }
  const start = (input.start_date ?? "").trim();
  const end = (input.end_date ?? "").trim();

  if (!input.property_id) return { ok: false, error: "매물 정보가 없습니다." };
  if (!isValidDate(start) || !isValidDate(end)) {
    return { ok: false, error: "시작일/종료일을 올바르게 입력하세요." };
  }
  if (start > end) {
    return { ok: false, error: "종료일은 시작일과 같거나 이후여야 합니다." };
  }

  try {
    const supabase = await createServerSupabase();
    const existing = await fetchPropertyBookings(supabase, input.property_id);
    if (overlaps(existing, start, end)) {
      return {
        ok: false,
        error: "해당 기간에 이미 예약이 있습니다. 기간이 겹치지 않게 조정하세요.",
      };
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert([
        {
          property_id: input.property_id,
          start_date: start,
          end_date: end,
          memo: input.memo?.trim() || null,
          inquiry_id: input.inquiry_id ?? null,
        },
      ])
      .select("id")
      .single();
    if (error) throw error;

    revalidateBookingPaths(input.property_id);
    return { ok: true, id: data.id as string };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

// ---------------------------------------------------------------------
// 예약 블록 삭제
// ---------------------------------------------------------------------
export async function deleteBooking(
  id: string,
  propertyId: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase 미설정" };
  }
  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) throw error;
    revalidateBookingPaths(propertyId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

// ---------------------------------------------------------------------
// 문의 → 예약 블록 생성 (지시서 4-C 4번)
//   move_in(시작) + weeks*7 = end_date(체크아웃일 포함)로 계산.
//   inquiry_id 를 연결하고 memo 에 문의자명을 남긴다.
//   markBooked 옵션이 true 면 해당 매물 status 를 'booked' 로 변경(선택 사항).
// ---------------------------------------------------------------------
export interface CreateBookingFromInquiryInput {
  inquiryId: string;
  propertyId: string;
  moveIn: string | null;
  weeks: number | null;
  name?: string | null;
  markBooked?: boolean;
}

export async function createBookingFromInquiry(
  input: CreateBookingFromInquiryInput,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase 미설정: 저장할 수 없습니다." };
  }
  if (!input.propertyId) {
    return { ok: false, error: "연결된 매물이 없는 문의입니다." };
  }
  const moveIn = (input.moveIn ?? "").trim();
  if (!isValidDate(moveIn)) {
    return { ok: false, error: "문의에 희망 입주일이 없어 예약을 만들 수 없습니다." };
  }
  const weeks = input.weeks;
  if (!weeks || weeks < 1) {
    return { ok: false, error: "문의에 희망 계약 주수가 없어 예약을 만들 수 없습니다." };
  }

  // end_date = 입주일 + weeks*7 (체크아웃일 포함 규칙)
  const endDate = addDaysISO(moveIn, weeks * 7);
  const memo = `문의 예약 · ${input.name?.trim() || "문의자"} (${weeks}주)`;

  try {
    const supabase = await createServerSupabase();

    // 이미 이 문의로 만든 예약이 있으면 중복 생성 방지
    const { data: dup, error: dupErr } = await supabase
      .from("bookings")
      .select("id")
      .eq("inquiry_id", input.inquiryId)
      .limit(1);
    if (dupErr) throw dupErr;
    if (dup && dup.length > 0) {
      return { ok: false, error: "이 문의로 생성된 예약이 이미 있습니다." };
    }

    const existing = await fetchPropertyBookings(supabase, input.propertyId);
    if (overlaps(existing, moveIn, endDate)) {
      return {
        ok: false,
        error: "해당 기간에 이미 예약이 있습니다. 매물 캘린더에서 기간을 조정하세요.",
      };
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert([
        {
          property_id: input.propertyId,
          start_date: moveIn,
          end_date: endDate,
          memo,
          inquiry_id: input.inquiryId,
        },
      ])
      .select("id")
      .single();
    if (error) throw error;

    // 선택: 매물을 예약완료(booked)로 전환
    if (input.markBooked) {
      await supabase
        .from("properties")
        .update({ status: "booked" })
        .eq("id", input.propertyId);
    }

    revalidateBookingPaths(input.propertyId);
    return { ok: true, id: data.id as string };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}
