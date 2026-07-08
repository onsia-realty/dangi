-- =====================================================================
-- BOOIN 단기임대 플랫폼 — DB 스키마 (PostgreSQL / Supabase)
-- 지시서 5번 스키마 + 123번 RLS 정책 반영
-- 실행 순서: Supabase SQL Editor 에 본 파일을 그대로 실행
-- FK 순환/순서 문제 방지를 위해 leads → properties → inquiries → bookings 순으로 생성
-- =====================================================================

-- gen_random_uuid() 사용을 위해 pgcrypto 확장 활성화 (Supabase 는 기본 활성화되어 있음)
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1) leads : 공실 발굴 파이프라인 (내부 전용)
--    properties.lead_id 가 참조하므로 가장 먼저 생성한다.
-- ---------------------------------------------------------------------
create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  address       text,
  owner_name    text,
  owner_contact text,
  source_memo   text,                       -- 출처/경위 메모 (내부 전용, 공개 금지)
  stage         text not null default '발굴', -- 발굴/제안발송/협의중/동의완료/등록완료/거절
  proposed_at   date,                        -- 제안일
  agreed_at     date,                        -- 동의일
  agree_memo    text,                        -- 동의 방식 메모
  assignee      text                         -- 담당자
);

-- ---------------------------------------------------------------------
-- 2) properties : 매물
-- ---------------------------------------------------------------------
create table if not exists public.properties (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  title               text,
  address             text,
  address_detail      text,                        -- 계약 확정 전 비공개
  lat                 float8,
  lng                 float8,
  building_type       text,                        -- 원룸/오피스텔/아파트/기타
  weekly_rent         int,                         -- 주간 요금(원)
  deposit             int not null default 330000, -- 보증금(기본 33만원)
  mgmt_fee            int,                         -- 주간 관리비 or 0
  min_weeks           int not null default 1,      -- 최소 계약 주수
  options             jsonb,                       -- {wifi, washer, aircon, ...}
  photos              text[],                      -- storage URLs
  verified            boolean not null default false, -- 등기부 확인 완료
  market_monthly_rent int,                         -- 주변 월세 시세(수동입력, 시세배지 계산용)
  status              text not null default 'active', -- active/hidden/booked
  lead_id             uuid references public.leads(id) on delete set null
);

create index if not exists idx_properties_status on public.properties (status);

-- ---------------------------------------------------------------------
-- 3) inquiries : 계약 문의
-- ---------------------------------------------------------------------
create table if not exists public.inquiries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  property_id uuid references public.properties(id) on delete set null,
  name        text,
  phone       text,
  move_in     date,   -- 희망 입주일
  weeks       int,    -- 희망 계약 주수
  message     text,
  status      text not null default '신규', -- 신규/연락완료/계약진행/완료/취소
  admin_memo  text    -- 관리자 내부 메모(4-B): 상담 진행 기록. anon 조회 정책 없음 → 공개 비노출
);

create index if not exists idx_inquiries_property on public.inquiries (property_id);

-- 재실행 안전: 기존 DB(테이블 이미 존재)에도 admin_memo 컬럼을 보강한다.
-- create table if not exists 는 컬럼 추가를 하지 않으므로 별도 idempotent alter 를 둔다.
alter table public.inquiries add column if not exists admin_memo text;

-- ---------------------------------------------------------------------
-- 4) bookings : 예약 블록 (캘린더)
-- ---------------------------------------------------------------------
create table if not exists public.bookings (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  start_date  date,
  end_date    date,
  inquiry_id  uuid references public.inquiries(id) on delete set null,
  memo        text
);

create index if not exists idx_bookings_property on public.bookings (property_id);

-- =====================================================================
-- RLS (Row Level Security)
--   원칙(지시서 123):
--   - 공개(anon): properties 는 status='active' 인 행만 SELECT, inquiries 는 INSERT 만
--   - leads, bookings, 그리고 properties 의 쓰기, inquiries 의 조회/수정 등
--     관리 기능은 authenticated(로그인한 온시아 관리자) 롤만 허용
-- =====================================================================

alter table public.leads      enable row level security;
alter table public.properties enable row level security;
alter table public.inquiries  enable row level security;
alter table public.bookings   enable row level security;

-- ---------------------------------------------------------------------
-- properties 정책
-- ---------------------------------------------------------------------
-- 공개: 활성 매물만 조회 가능 (숨김/예약완료 매물은 비노출)
create policy "properties_public_select_active"
  on public.properties for select
  to anon
  using (status = 'active');

-- 관리자: 모든 매물 조회 (상태 무관)
create policy "properties_admin_select_all"
  on public.properties for select
  to authenticated
  using (true);

-- 관리자: 매물 등록
create policy "properties_admin_insert"
  on public.properties for insert
  to authenticated
  with check (true);

-- 관리자: 매물 수정
create policy "properties_admin_update"
  on public.properties for update
  to authenticated
  using (true)
  with check (true);

-- 관리자: 매물 삭제
create policy "properties_admin_delete"
  on public.properties for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- inquiries 정책
-- ---------------------------------------------------------------------
-- 공개: 문의 접수(INSERT)만 허용. 조회는 불가(개인정보 보호).
create policy "inquiries_public_insert"
  on public.inquiries for insert
  to anon
  with check (true);

-- 관리자: 문의 조회
create policy "inquiries_admin_select"
  on public.inquiries for select
  to authenticated
  using (true);

-- 관리자: 문의 상태/메모 수정
create policy "inquiries_admin_update"
  on public.inquiries for update
  to authenticated
  using (true)
  with check (true);

-- 관리자: 문의 삭제
create policy "inquiries_admin_delete"
  on public.inquiries for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- leads 정책 : 전부 관리자 전용 (source_memo 등 내부 정보 포함, 공개 절대 금지)
-- ---------------------------------------------------------------------
create policy "leads_admin_all"
  on public.leads for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------
-- bookings 정책 : 전부 관리자 전용
-- ---------------------------------------------------------------------
create policy "bookings_admin_all"
  on public.bookings for all
  to authenticated
  using (true)
  with check (true);

-- =====================================================================
-- 공개 예약 구간 뷰 (public_bookings)
--   목적: 공개 매물 상세의 "입주 가능 캘린더"에 예약 구간을 표시하려면
--         anon 도 예약 기간을 조회할 수 있어야 한다. 그러나 bookings 원본에는
--         memo(내부 메모)·inquiry_id(문의 연결) 등 민감 정보가 있어 통째로 공개 불가.
--   해결: property_id / start_date / end_date 3개 컬럼만 노출하는 뷰를 만들고
--         그 뷰에만 anon SELECT 권한을 부여한다.
--   주의: Postgres RLS 는 컬럼 단위 제한이 안 되므로 뷰 방식으로 컬럼을 제한한다.
--   security_invoker=on: 뷰를 호출한 롤(anon)의 권한으로 실행되게 하되,
--         bookings 에 anon SELECT 정책이 없어도 아래 grant + 뷰 소유자 권한으로
--         3개 컬럼만 조회되도록 security_invoker=off(기본, 소유자 권한 실행)를 사용한다.
--         → 소유자(postgres) 권한으로 실행되어 RLS 를 우회하지만, 뷰가 3개 컬럼만
--           선택하므로 노출 범위는 안전하게 제한된다.
-- 재실행 안전(idempotent): create or replace view + drop policy if exists 패턴 사용.
-- =====================================================================
create or replace view public.public_bookings as
  select property_id, start_date, end_date
  from public.bookings;

-- 뷰에 대한 anon/authenticated SELECT 권한 부여
grant select on public.public_bookings to anon, authenticated;
