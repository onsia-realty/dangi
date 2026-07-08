-- =====================================================================
-- BOOIN 단기임대 — 시드(더미) 데이터
-- 실행 순서: schema.sql 실행 후 본 파일 실행
-- 고정 UUID 를 사용하므로 재실행 시 on conflict do nothing 으로 중복을 방지한다.
-- 좌표/주소는 서울 실제 지역 근처의 그럴듯한 값이며,
-- 상세주소(address_detail)는 비공개 성격이라 동/건물명 수준까지만 기입.
-- =====================================================================

-- ---------------------------------------------------------------------
-- leads : 공실 발굴 파이프라인 (다양한 stage)
-- ---------------------------------------------------------------------
insert into public.leads
  (id, address, owner_name, owner_contact, source_memo, stage, proposed_at, agreed_at, agree_memo, assignee)
values
  ('11111111-1111-1111-1111-111111111101',
   '서울 강남구 역삼동', '김소유', '010-1000-0001',
   '공실클럽 게시글에서 발견, 장기 공실', '발굴', null, null, null, '박담당'),
  ('11111111-1111-1111-1111-111111111102',
   '서울 마포구 서교동', '이임대', '010-1000-0002',
   '지인 소개, 오피스텔 2채 보유', '제안발송', '2026-06-20', null, null, '박담당'),
  ('11111111-1111-1111-1111-111111111103',
   '서울 성동구 성수동', '최건물', '010-1000-0003',
   '기존 중개 거래처, 단기 전환 긍정적', '동의완료', '2026-06-15', '2026-06-28',
   '전화 구두 동의 후 문자 확인', '정담당'),
  ('11111111-1111-1111-1111-111111111104',
   '서울 종로구 창신동', '한소유', '010-1000-0004',
   '등록 완료된 매물의 원천 리드', '등록완료', '2026-05-10', '2026-05-22',
   '서면 동의서 수령', '정담당')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- properties : 매물 10건
--   - building_type 다양화(원룸/오피스텔/아파트)
--   - weekly_rent 15만~40만원대
--   - 일부 verified=true
--   - 일부 market_monthly_rent 입력(시세배지 테스트), 일부 null
--   - photos: picsum placeholder 2~4장
--   - 마지막 매물은 lead_id(등록완료 리드) 연결
-- ---------------------------------------------------------------------
insert into public.properties
  (id, title, address, address_detail, lat, lng, building_type, weekly_rent, deposit,
   mgmt_fee, min_weeks, options, photos, verified, market_monthly_rent, status, lead_id)
values
  ('22222222-2222-2222-2222-222222222201',
   '강남역 도보 5분 깔끔한 원룸', '서울 강남구 역삼동', '역삼동 스타빌 302호',
   37.4979, 127.0276, '원룸', 250000, 330000, 15000, 1,
   '{"wifi": true, "washer": true, "aircon": true, "fridge": true, "induction": true}'::jsonb,
   array['https://picsum.photos/seed/booin201a/800/600','https://picsum.photos/seed/booin201b/800/600','https://picsum.photos/seed/booin201c/800/600'],
   true, 950000, 'active', null),

  ('22222222-2222-2222-2222-222222222202',
   '홍대입구 신축 오피스텔', '서울 마포구 서교동', '서교동 리버뷰 1105호',
   37.5572, 126.9245, '오피스텔', 320000, 330000, 20000, 1,
   '{"wifi": true, "washer": true, "aircon": true, "fridge": true, "tv": true, "desk": true}'::jsonb,
   array['https://picsum.photos/seed/booin202a/800/600','https://picsum.photos/seed/booin202b/800/600'],
   true, 1250000, 'active', null),

  ('22222222-2222-2222-2222-222222222203',
   '성수동 감성 원룸 (반려동물 가능)', '서울 성동구 성수동', '성수동 팩토리하우스 201호',
   37.5446, 127.0559, '원룸', 230000, 330000, 12000, 2,
   '{"wifi": true, "aircon": true, "fridge": true, "bed": true}'::jsonb,
   array['https://picsum.photos/seed/booin203a/800/600','https://picsum.photos/seed/booin203b/800/600','https://picsum.photos/seed/booin203c/800/600','https://picsum.photos/seed/booin203d/800/600'],
   false, null, 'active', null),

  ('22222222-2222-2222-2222-222222222204',
   '잠실 넓은 투룸 아파트', '서울 송파구 잠실동', '잠실동 레이크팰리스 808호',
   37.5133, 127.1000, '아파트', 400000, 500000, 30000, 2,
   '{"wifi": true, "washer": true, "aircon": true, "fridge": true, "induction": true, "tv": true}'::jsonb,
   array['https://picsum.photos/seed/booin204a/800/600','https://picsum.photos/seed/booin204b/800/600','https://picsum.photos/seed/booin204c/800/600'],
   true, 1800000, 'active', null),

  ('22222222-2222-2222-2222-222222222205',
   '신촌 역세권 저렴한 원룸', '서울 서대문구 창천동', '창천동 학사빌 405호',
   37.5551, 126.9368, '원룸', 150000, 200000, 0, 1,
   '{"wifi": true, "aircon": true, "fridge": true}'::jsonb,
   array['https://picsum.photos/seed/booin205a/800/600','https://picsum.photos/seed/booin205b/800/600'],
   false, 620000, 'active', null),

  ('22222222-2222-2222-2222-222222222206',
   '공덕역 비즈니스 오피스텔', '서울 마포구 공덕동', '공덕동 센트럴타워 1503호',
   37.5443, 126.9515, '오피스텔', 300000, 330000, 22000, 1,
   '{"wifi": true, "washer": true, "aircon": true, "fridge": true, "desk": true, "tv": true}'::jsonb,
   array['https://picsum.photos/seed/booin206a/800/600','https://picsum.photos/seed/booin206b/800/600','https://picsum.photos/seed/booin206c/800/600'],
   true, 1150000, 'active', null),

  ('22222222-2222-2222-2222-222222222207',
   '건대입구 대학생 원룸', '서울 광진구 화양동', '화양동 유니빌 208호',
   37.5405, 127.0700, '원룸', 180000, 250000, 10000, 1,
   '{"wifi": true, "aircon": true, "fridge": true, "desk": true}'::jsonb,
   array['https://picsum.photos/seed/booin207a/800/600','https://picsum.photos/seed/booin207b/800/600'],
   false, null, 'active', null),

  ('22222222-2222-2222-2222-222222222208',
   '여의도 직장인 오피스텔', '서울 영등포구 여의도동', '여의도동 파크원레지던스 2201호',
   37.5215, 126.9245, '오피스텔', 350000, 400000, 25000, 2,
   '{"wifi": true, "washer": true, "aircon": true, "fridge": true, "induction": true, "tv": true}'::jsonb,
   array['https://picsum.photos/seed/booin208a/800/600','https://picsum.photos/seed/booin208b/800/600','https://picsum.photos/seed/booin208c/800/600','https://picsum.photos/seed/booin208d/800/600'],
   true, 1400000, 'active', null),

  ('22222222-2222-2222-2222-222222222209',
   '서울대입구 조용한 원룸 (숨김 처리)', '서울 관악구 봉천동', '봉천동 그린빌 301호',
   37.4813, 126.9527, '원룸', 170000, 250000, 8000, 1,
   '{"wifi": true, "aircon": true, "fridge": true}'::jsonb,
   array['https://picsum.photos/seed/booin209a/800/600','https://picsum.photos/seed/booin209b/800/600'],
   false, 700000, 'hidden', null),

  ('22222222-2222-2222-2222-222222222210',
   '종로 도심 아파트 (예약완료)', '서울 종로구 창신동', '창신동 한양아파트 502호',
   37.5704, 126.9910, '아파트', 380000, 500000, 28000, 2,
   '{"wifi": true, "washer": true, "aircon": true, "fridge": true, "tv": true}'::jsonb,
   array['https://picsum.photos/seed/booin210a/800/600','https://picsum.photos/seed/booin210b/800/600','https://picsum.photos/seed/booin210c/800/600'],
   true, 1700000, 'booked', '11111111-1111-1111-1111-111111111104')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- inquiries : 계약 문의 (다양한 status)
-- ---------------------------------------------------------------------
insert into public.inquiries
  (id, property_id, name, phone, move_in, weeks, message, status)
values
  ('33333333-3333-3333-3333-333333333301',
   '22222222-2222-2222-2222-222222222201',
   '홍길동', '010-2000-0001', '2026-07-15', 4,
   '4주 정도 출장으로 머물 예정입니다. 주차 가능한가요?', '신규'),
  ('33333333-3333-3333-3333-333333333302',
   '22222222-2222-2222-2222-222222222202',
   '김영희', '010-2000-0002', '2026-07-20', 8,
   '장기 프로젝트로 두 달 예약 원합니다. 할인 가능 여부 문의드려요.', '연락완료'),
  ('33333333-3333-3333-3333-333333333303',
   '22222222-2222-2222-2222-222222222210',
   '이철수', '010-2000-0003', '2026-06-25', 6,
   '계약 완료된 건입니다.', '완료')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- bookings : 예약 블록 (예약완료 매물의 캘린더 차단)
-- ---------------------------------------------------------------------
insert into public.bookings
  (id, property_id, start_date, end_date, inquiry_id, memo)
values
  ('44444444-4444-4444-4444-444444444401',
   '22222222-2222-2222-2222-222222222210',
   '2026-06-25', '2026-08-06',
   '33333333-3333-3333-3333-333333333303',
   '6주 계약 확정 — 캘린더 블록')
on conflict (id) do nothing;
