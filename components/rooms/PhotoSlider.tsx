"use client";

import { useRef, useState } from "react";

// 사진 슬라이드/스와이프. 외부 라이브러리 없이 스크롤 스냅 + 인디케이터로 경량 구현.
export function PhotoSlider({
  photos,
  title,
}: {
  photos: string[] | null;
  title: string;
}) {
  const list = photos ?? [];
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  if (list.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-zinc-100 text-sm text-zinc-400 sm:aspect-[16/9]">
        사진 준비 중
      </div>
    );
  }

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(index, list.length - 1));
    track.scrollTo({ left: track.clientWidth * clamped, behavior: "smooth" });
    setActive(clamped);
  }

  function onScroll() {
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    if (index !== active) setActive(index);
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-zinc-100">
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {list.map((src, i) => (
          <div
            key={src + i}
            className="aspect-[4/3] w-full shrink-0 snap-center sm:aspect-[16/9]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${title} 사진 ${i + 1}`}
              className="h-full w-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      {list.length > 1 && (
        <>
          {/* 좌우 버튼 (태블릿 이상) */}
          <button
            type="button"
            onClick={() => goTo(active - 1)}
            aria-label="이전 사진"
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-zinc-800 shadow hover:bg-white sm:block"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goTo(active + 1)}
            aria-label="다음 사진"
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-zinc-800 shadow hover:bg-white sm:block"
          >
            ›
          </button>

          {/* 인디케이터 */}
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {list.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1}번째 사진 보기`}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${
                  i === active ? "w-5 bg-white" : "w-2 bg-white/60"
                }`}
              />
            ))}
          </div>

          {/* 카운터 */}
          <div className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
            {active + 1} / {list.length}
          </div>
        </>
      )}
    </div>
  );
}
