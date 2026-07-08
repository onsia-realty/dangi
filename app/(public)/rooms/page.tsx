import { Suspense } from "react";
import { RoomCard } from "@/components/rooms/RoomCard";
import { RoomFilter } from "@/components/rooms/RoomFilter";
import { getActiveRooms, type RoomFilters } from "@/lib/data/rooms";

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function toNumber(v: string | undefined): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const filters: RoomFilters = {
    region: first(sp.region),
    minRent: toNumber(first(sp.minRent)),
    maxRent: toNumber(first(sp.maxRent)),
    type: first(sp.type),
    moveIn: first(sp.moveIn),
  };

  const rooms = await getActiveRooms(filters);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-zinc-900">검증된 단기임대 매물</h1>
        <p className="mt-1 text-sm text-zinc-600">
          공인중개사가 확인한 매물을 조건에 맞게 찾아보세요.
        </p>
      </div>

      <Suspense fallback={null}>
        <RoomFilter />
      </Suspense>

      <div className="mt-4 text-sm text-zinc-500">
        총 <span className="font-semibold text-zinc-800">{rooms.length}</span>건
      </div>

      {rooms.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-16 text-center">
          <p className="text-base font-semibold text-zinc-700">
            조건에 맞는 매물이 없습니다
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            지역이나 요금대 조건을 넓혀서 다시 검색해 보세요.
          </p>
        </div>
      )}
    </div>
  );
}
