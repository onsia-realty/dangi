import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { PriceBadge } from "@/components/rooms/PriceBadge";
import { VerifiedBadge } from "@/components/rooms/VerifiedBadge";
import { formatKRW } from "@/lib/pricing";
import type { PublicRoom } from "@/lib/data/rooms";

export function RoomCard({ room }: { room: PublicRoom }) {
  const cover = room.photos?.[0];

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      {/* 대표 사진 */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={room.title ?? "매물 사진"}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
            사진 준비 중
          </div>
        )}
        {room.verified && (
          <div className="absolute left-2 top-2">
            <VerifiedBadge verified size="sm" />
          </div>
        )}
      </div>

      {/* 본문 */}
      <div className="space-y-2 p-4">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Badge tone="gray">{room.building_type ?? "기타"}</Badge>
          <span>{room.address ?? ""}</span>
        </div>

        <h3 className="line-clamp-1 text-base font-semibold text-zinc-900">
          {room.title ?? "제목 없음"}
        </h3>

        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-emerald-700">
            {room.weekly_rent != null ? formatKRW(room.weekly_rent) : "-"}
          </span>
          <span className="text-sm text-zinc-500">/ 주</span>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          <PriceBadge
            weeklyRent={room.weekly_rent ?? 0}
            marketMonthlyRent={room.market_monthly_rent}
          />
        </div>
      </div>
    </Link>
  );
}
