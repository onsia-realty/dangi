"use client";
// =====================================================================
// 이용 안내 FAQ 아코디언 (client, 경량)
//   - 외부 라이브러리 없이 useState 로 열림/닫힘만 관리.
//   - 접근성: button + aria-expanded, 패널 연결(aria-controls/id).
// =====================================================================
import { useState } from "react";

export interface FaqItem {
  q: string;
  a: string;
}

export function GuideFaq({ items }: { items: FaqItem[] }) {
  // 첫 항목은 기본으로 펼쳐 안내가 비어 보이지 않게 한다.
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white">
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `faq-panel-${i}`;
        const btnId = `faq-btn-${i}`;
        return (
          <div key={i}>
            <h3>
              <button
                type="button"
                id={btnId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
              >
                <span className="text-sm font-medium text-zinc-900">
                  {item.q}
                </span>
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.3 7.3a1 1 0 011.4 0L10 10.6l3.3-3.3a1 1 0 111.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </h3>
            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={btnId}
                className="px-4 pb-4 text-sm leading-relaxed text-zinc-600"
              >
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
