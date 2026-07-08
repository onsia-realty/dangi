import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 매물 사진은 외부(picsum.photos 시드) 및 Supabase Storage(*.supabase.co) URL 을 사용한다.
  // 공개 페이지는 <img>, admin 미리보기는 next/image unoptimized 라 현재 필수는 아니지만,
  // 향후 next/image 최적화 사용에 대비해 허용 도메인을 등록해 빌드/런타임 오류를 예방한다.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
