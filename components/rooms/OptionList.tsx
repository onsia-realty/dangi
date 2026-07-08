import { OPTION_ITEMS } from "@/lib/constants";
import type { PropertyOptions } from "@/lib/supabase/types";

// 옵션 키 → 아이콘(이모지) 매핑. constants 의 라벨과 함께 렌더한다.
const OPTION_ICONS: Record<string, string> = {
  wifi: "📶",
  washer: "🧺",
  aircon: "❄️",
  fridge: "🧊",
  induction: "🍳",
  desk: "🪑",
  bed: "🛏️",
  tv: "📺",
};

export function OptionList({ options }: { options: PropertyOptions | null }) {
  const active = OPTION_ITEMS.filter((item) => options?.[item.key]);

  if (active.length === 0) {
    return <p className="text-sm text-zinc-500">등록된 옵션 정보가 없습니다.</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {active.map((item) => (
        <li
          key={item.key}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2.5"
        >
          <span aria-hidden="true" className="text-lg">
            {OPTION_ICONS[item.key] ?? "•"}
          </span>
          <span className="text-sm text-zinc-700">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
