"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

// 네이버 지도 최소 타입 선언 (SDK 로드 후 window.naver 로 접근)
interface NaverLatLng {
  lat: number;
  lng: number;
}
interface NaverMaps {
  Map: new (el: HTMLElement, opts: Record<string, unknown>) => unknown;
  LatLng: new (lat: number, lng: number) => NaverLatLng;
  Marker: new (opts: Record<string, unknown>) => unknown;
}
declare global {
  interface Window {
    naver?: { maps?: NaverMaps };
  }
}

// 네이버 지도 마커 1개. client id 미설정/로드 실패 시 placeholder 로 대체(에러 없이 진행).
export function RoomMap({
  lat,
  lng,
  address,
}: {
  lat: number | null;
  lng: number | null;
  address: string | null;
}) {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const hasKey = Boolean(clientId && !clientId.includes("your-naver-map"));
  const hasCoords = lat != null && lng != null;

  const mapRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!scriptReady || !hasCoords || !mapRef.current) return;
    const maps = window.naver?.maps;
    if (!maps) {
      setFailed(true);
      return;
    }
    try {
      const center = new maps.LatLng(lat!, lng!);
      const map = new maps.Map(mapRef.current, {
        center,
        zoom: 15,
      });
      new maps.Marker({ position: center, map });
    } catch {
      setFailed(true);
    }
  }, [scriptReady, hasCoords, lat, lng]);

  // placeholder: 키 없음 / 좌표 없음 / 로드 실패
  if (!hasKey || !hasCoords || failed) {
    return (
      <div className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-center">
        <MapPinIcon className="h-6 w-6 text-zinc-400" />
        <p className="text-sm font-medium text-zinc-600">지도 준비 중</p>
        <p className="text-xs text-zinc-500">{address ?? "위치 정보 준비 중"}</p>
      </div>
    );
  }

  return (
    <>
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setFailed(true)}
      />
      <div
        ref={mapRef}
        className="aspect-[16/9] w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100"
      />
    </>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path
        fillRule="evenodd"
        d="M10 2a5 5 0 00-5 5c0 3.5 5 11 5 11s5-7.5 5-11a5 5 0 00-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z"
        clipRule="evenodd"
      />
    </svg>
  );
}
