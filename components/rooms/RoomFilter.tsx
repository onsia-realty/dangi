"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { BUILDING_TYPES } from "@/lib/constants";

// 주간 요금대 버킷 → minRent/maxRent 매핑
const RENT_BUCKETS = [
  { value: "", label: "전체 요금" },
  { value: "0-200000", label: "20만원 이하" },
  { value: "200000-300000", label: "20~30만원" },
  { value: "300000-400000", label: "30~40만원" },
  { value: "400000-", label: "40만원 이상" },
] as const;

function bucketFromParams(min?: string | null, max?: string | null): string {
  const key = `${min ?? ""}-${max ?? ""}`;
  const found = RENT_BUCKETS.find((b) => b.value === key);
  return found?.value ?? "";
}

export function RoomFilter() {
  const router = useRouter();
  const params = useSearchParams();

  const [region, setRegion] = useState(params.get("region") ?? "");
  const [rentBucket, setRentBucket] = useState(
    bucketFromParams(params.get("minRent"), params.get("maxRent")),
  );
  const [type, setType] = useState(params.get("type") ?? "");
  const [moveIn, setMoveIn] = useState(params.get("moveIn") ?? "");

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();

    if (region.trim()) next.set("region", region.trim());
    if (rentBucket) {
      const [min, max] = rentBucket.split("-");
      if (min) next.set("minRent", min);
      if (max) next.set("maxRent", max);
    }
    if (type) next.set("type", type);
    if (moveIn) next.set("moveIn", moveIn);

    router.push(`/rooms${next.toString() ? `?${next.toString()}` : ""}`);
  }

  function reset() {
    setRegion("");
    setRentBucket("");
    setType("");
    setMoveIn("");
    router.push("/rooms");
  }

  const fieldClass =
    "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <form
      onSubmit={apply}
      className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
    >
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-600">지역</span>
        <input
          type="text"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="예: 강남구, 성수동"
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-600">주간 요금대</span>
        <select
          value={rentBucket}
          onChange={(e) => setRentBucket(e.target.value)}
          className={fieldClass}
        >
          {RENT_BUCKETS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-600">건물 유형</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={fieldClass}
        >
          <option value="">전체 유형</option>
          {BUILDING_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-600">입주 가능일</span>
        <input
          type="date"
          value={moveIn}
          onChange={(e) => setMoveIn(e.target.value)}
          className={fieldClass}
        />
      </label>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          검색
        </Button>
        <Button type="button" variant="outline" onClick={reset}>
          초기화
        </Button>
      </div>
    </form>
  );
}
