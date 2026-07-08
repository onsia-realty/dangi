"use client";

import { useMemo, useState } from "react";
import type { Booking } from "@/lib/supabase/types";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function ymd(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

// 예약 구간을 받아 월 단위로 '예약중'을 표시하는 경량 캘린더.
export function AvailabilityCalendar({ bookings }: { bookings: Booking[] }) {
  const today = new Date();
  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(), // 0-based
  });

  // 예약된 날짜 집합 (YYYY-MM-DD)
  const bookedDays = useMemo(() => {
    const set = new Set<string>();
    for (const b of bookings) {
      if (!b.start_date || !b.end_date) continue;
      const start = new Date(b.start_date + "T00:00:00");
      const end = new Date(b.end_date + "T00:00:00");
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        set.add(ymd(d.getFullYear(), d.getMonth(), d.getDate()));
      }
    }
    return set;
  }, [bookings]);

  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const todayStr = ymd(today.getFullYear(), today.getMonth(), today.getDate());

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function shift(delta: number) {
    setView((v) => {
      const m = v.month + delta;
      const year = v.year + Math.floor(m / 12);
      const month = ((m % 12) + 12) % 12;
      return { year, month };
    });
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="이전 달"
          className="rounded-md px-2 py-1 text-zinc-600 hover:bg-zinc-100"
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-zinc-900">
          {view.year}년 {view.month + 1}월
        </p>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="다음 달"
          className="rounded-md px-2 py-1 text-zinc-600 hover:bg-zinc-100"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`py-1 font-medium ${
              i === 0 ? "text-red-500" : i === 6 ? "text-sky-500" : "text-zinc-500"
            }`}
          >
            {w}
          </div>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const dateStr = ymd(view.year, view.month, day);
          const booked = bookedDays.has(dateStr);
          const isToday = dateStr === todayStr;
          return (
            <div
              key={dateStr}
              className={`flex aspect-square items-center justify-center rounded-md text-sm ${
                booked
                  ? "bg-zinc-200 text-zinc-400 line-through"
                  : "bg-emerald-50 text-emerald-800"
              } ${isToday ? "ring-1 ring-emerald-500" : ""}`}
              title={booked ? "예약중" : "입주 가능"}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-zinc-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-emerald-50 ring-1 ring-emerald-200" />
          입주 가능
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-zinc-200" />
          예약중
        </span>
      </div>
    </div>
  );
}
