# BOOIN — 공인중개사 검증 단기임대 플랫폼 (MVP)

온시아공인중개사사무소가 **매물을 검증하고 계약을 책임지는** 주 단위 단기임대 플랫폼입니다.
임대인이 직접 등록하는 직거래 방식과 달리, 공인중개사가 등기부·권리관계를 확인하고
동의받은 매물만 등록해 전대사기 위험을 줄이고 세금계산서 등 증빙 발급이 가능합니다.

## 주요 기능 (Phase 1)

- **공개 사이트**: 홈 `/`, 매물 목록 `/rooms`, 매물 상세 `/rooms/[id]`, 이용 안내 `/guide`, 임대인·중개사 안내 `/partner`
  - 검증 뱃지, 시세 비교 배지(주변 월세 환산 대비), 입주 가능 캘린더, 지도, 계약 문의 폼
  - 파트너 매물 자가 접수 폼 → 리드로 저장
- **관리자** `/admin` (Supabase Auth 로그인 필수): 매물 CRUD(사진 다중 업로드), 리드 파이프라인 칸반, 문의 관리, 예약 블록
- **계약 흐름**: 온라인 결제 없음. 문의 → 상담 → 오프라인/전자계약 → 예약 블록 처리

## 기술 스택

- **Next.js 16 (App Router) + TypeScript**
- **Supabase** — PostgreSQL DB / Auth(관리자) / Storage(매물 사진)
- **Tailwind CSS v4**
- **@supabase/ssr** — 서버·클라이언트 세션 처리
- 지도: 네이버 지도 SDK (매물 상세 1개)
- 배포 타깃: **Vercel**

## 로컬 실행

```bash
npm install
cp .env.local.example .env.local   # 값 채우기 (아래 환경변수 참조)
npm run dev                        # http://localhost:3000
```

> 환경변수가 없어도 앱은 크래시하지 않습니다. Supabase 미설정 시 공개 페이지는 목(mock)
> 데이터로 동작하고, 문의·파트너 접수 폼은 데모 성공 처리되며, admin은 "Supabase 연결
> 필요" 안내를 표시합니다.

기타 스크립트:

```bash
npm run build      # 프로덕션 빌드
npm run start      # 빌드 결과 실행
npm run lint       # ESLint
```

## 환경변수

`.env.local` (로컬) 또는 Vercel 프로젝트 환경변수에 설정합니다.

| 변수 | 필수 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon(public) 키 — 공개 조회/문의 INSERT |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | service_role 키 — 파트너 자가 접수(leads INSERT)에 사용. **서버 전용, 절대 클라이언트 노출 금지** |
| `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` | 선택 | 네이버 지도 SDK Client ID. 미설정 시 지도는 대체 안내로 표시 |

## Supabase 셋업 순서

1. **프로젝트 생성** — [supabase.com](https://supabase.com) 에서 새 프로젝트 생성
2. **스키마 적용** — SQL Editor 에 `supabase/schema.sql` 전체 실행 (테이블 + RLS + public_bookings 뷰)
3. **시드 데이터** — `supabase/seed.sql` 실행 (더미 매물/리드/문의, 재실행 안전)
4. **관리자 계정 생성** — Authentication → Users → **Add user** 로 온시아 관리자 이메일/비밀번호 수동 생성 (회원가입 UI 없음)
5. **Storage 버킷** — `property-photos` 이름의 **public 버킷** 생성
   - 업로드 정책: `authenticated` 롤에 INSERT(업로드) 허용 (관리자만 사진 업로드)
   - public read 로 공개 조회 가능하게 설정
6. **키 확인** — Project Settings → API 에서 URL / anon / service_role 키를 위 환경변수에 입력

> RLS 요약: 공개(anon)는 `properties`(status='active') SELECT 와 `inquiries` INSERT,
> `public_bookings` 뷰 SELECT 만 허용됩니다. `leads`·`bookings`·매물 쓰기·문의 조회 등
> 관리 기능은 authenticated 전용입니다. 파트너 자가 접수는 서버에서 service_role 로 우회 INSERT 합니다.

## Vercel 배포 순서

1. **리포 import** — Vercel 대시보드에서 New Project → Git 리포 선택 (프레임워크: Next.js 자동 인식)
2. **환경변수 등록** — 위 환경변수 4개를 Production/Preview 에 등록
   (`SUPABASE_SERVICE_ROLE_KEY` 는 서버 전용이므로 `NEXT_PUBLIC_` 접두어를 붙이지 말 것)
3. **배포** — Deploy 실행. 빌드는 키가 없어도 통과하지만, 실제 데이터 연동을 위해 환경변수를 채워야 합니다.
4. 배포 후 `/admin/login` 으로 관리자 로그인 → 매물/리드/문의 동작 확인

> 매물 사진 도메인(`picsum.photos`, `**.supabase.co`)은 `next.config.ts` 의
> `images.remotePatterns` 에 등록되어 있습니다.

## Phase 2 로드맵 (현재 범위 밖)

- 국토부 실거래가 API 연동 자동 시세
- 토스페이먼츠 결제 + 보증금 에스크로
- 표준 단기임대 전자계약서(전자서명)
- 파트너 중개사 계정(멀티 테넌트 매물 등록)
- 기업 출장 B2B 페이지(세금계산서 발행 안내)
- BOOIN(booin.co.kr) 계정/디자인 통합

## 디렉터리 구조

```
app/
  (public)/            홈·매물·상세·guide·partner (공개 사이트)
  admin/               로그인·대시보드·매물·리드·문의 (관리자)
components/
  ui/                  Button, Badge
  rooms/               공개 매물 UI + 문의/파트너 폼
  admin/               관리자 UI(폼, 칸반, 표 액션)
lib/
  actions/             서버 액션(properties, leads, inquiries, bookings, partner)
  data/                조회 계층(rooms, admin)
  supabase/            client/server/config/types
  constants.ts, pricing.ts, cn.ts, mock.ts
supabase/
  schema.sql           테이블 + RLS + 뷰
  seed.sql             더미 데이터
```
