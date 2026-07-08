import Link from "next/link";
import { notFound } from "next/navigation";
import { AvailabilityCalendar } from "@/components/rooms/AvailabilityCalendar";
import { InquiryForm } from "@/components/rooms/InquiryForm";
import { OptionList } from "@/components/rooms/OptionList";
import { PhotoSlider } from "@/components/rooms/PhotoSlider";
import { PriceBadge } from "@/components/rooms/PriceBadge";
import { RoomMap } from "@/components/rooms/RoomMap";
import { VerifiedBadge } from "@/components/rooms/VerifiedBadge";
import { Badge } from "@/components/ui/Badge";
import { getBookingsForRoom, getRoomById } from "@/lib/data/rooms";
import { calcTotal, formatKRW } from "@/lib/pricing";

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const room = await getRoomById(id);
  if (!room) notFound();

  const bookings = await getBookingsForRoom(id);

  const weeklyRent = room.weekly_rent ?? 0;
  const mgmtFee = room.mgmt_fee ?? 0;
  const minWeeks = room.min_weeks ?? 1;
  const sampleTotal = calcTotal(weeklyRent, minWeeks, room.deposit);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link
        href="/rooms"
        className="text-sm text-zinc-500 hover:text-zinc-800"
      >
        ← 매물 목록
      </Link>

      {/* 사진 */}
      <div className="mt-3">
        <PhotoSlider photos={room.photos} title={room.title ?? "매물"} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 좌측: 상세 정보 */}
        <div className="space-y-8 lg:col-span-2">
          {/* 제목/뱃지 */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="blue">{room.building_type ?? "기타"}</Badge>
              <PriceBadge
                weeklyRent={weeklyRent}
                marketMonthlyRent={room.market_monthly_rent}
              />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">
              {room.title ?? "제목 없음"}
            </h1>
            <p className="text-sm text-zinc-600">{room.address ?? ""}</p>
          </div>

          {/* 검증 / 시세 강조 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <VerifiedBadge verified={room.verified} size="lg" />
            <PriceBadge
              weeklyRent={weeklyRent}
              marketMonthlyRent={room.market_monthly_rent}
              detailed
            />
          </div>

          {/* 요금 블록 */}
          <section>
            <h2 className="mb-3 text-lg font-bold text-zinc-900">요금 안내</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <PriceCell label="주간 요금" value={formatKRW(weeklyRent)} highlight />
              <PriceCell label="보증금" value={formatKRW(room.deposit)} />
              <PriceCell
                label="주간 관리비"
                value={mgmtFee > 0 ? formatKRW(mgmtFee) : "없음"}
              />
              <PriceCell label="최소 계약" value={`${minWeeks}주`} />
            </div>
            <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
              최소 계약({minWeeks}주) 기준 예상액(보증금 포함){" "}
              <span className="font-semibold text-zinc-900">
                {formatKRW(sampleTotal)}
              </span>
              {mgmtFee > 0 && " · 관리비 별도"}
            </p>
          </section>

          {/* 옵션 */}
          <section>
            <h2 className="mb-3 text-lg font-bold text-zinc-900">옵션</h2>
            <OptionList options={room.options} />
          </section>

          {/* 입주 가능 캘린더 */}
          <section>
            <h2 className="mb-3 text-lg font-bold text-zinc-900">입주 가능일</h2>
            <AvailabilityCalendar bookings={bookings} />
          </section>

          {/* 지도 */}
          <section>
            <h2 className="mb-3 text-lg font-bold text-zinc-900">위치</h2>
            <RoomMap lat={room.lat} lng={room.lng} address={room.address} />
            <p className="mt-2 text-xs text-zinc-400">
              정확한 상세 주소는 계약 확정 후 안내됩니다.
            </p>
          </section>
        </div>

        {/* 우측: 문의 폼 (데스크톱 sticky) */}
        <aside className="lg:col-span-1">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm lg:sticky lg:top-20">
            <div className="mb-4">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-emerald-700">
                  {formatKRW(weeklyRent)}
                </span>
                <span className="text-sm text-zinc-500">/ 주</span>
              </div>
              <p className="text-xs text-zinc-500">
                보증금 {formatKRW(room.deposit)}
              </p>
            </div>
            <InquiryForm
              propertyId={room.id}
              weeklyRent={weeklyRent}
              deposit={room.deposit}
              minWeeks={minWeeks}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function PriceCell({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className={`mt-1 text-sm font-semibold ${
          highlight ? "text-emerald-700" : "text-zinc-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
