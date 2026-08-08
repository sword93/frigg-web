-- ============================================================
-- FRIGG 앱 샘플 데이터 시드 스크립트
-- Supabase SQL Editor 에서 실행하세요
-- ============================================================

-- 테이블이 없을 경우 생성
CREATE TABLE IF NOT EXISTS budget_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  cycle text NOT NULL,       -- 매월 | 학기별 | 연간 | 일회성
  due_day integer,
  amount_usd numeric NOT NULL DEFAULT 0,
  amount_krw numeric NOT NULL DEFAULT 0,
  assignee text,
  memo text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_date date NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  amount_usd numeric NOT NULL DEFAULT 0,
  amount_krw numeric NOT NULL DEFAULT 0,
  payment_method text,
  paid_by text NOT NULL DEFAULT '아빠',
  memo text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  name text NOT NULL,
  priority text NOT NULL DEFAULT '중',   -- 상 | 중 | 하
  is_done boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  event_date date NOT NULL,
  category text NOT NULL,
  description text,
  is_done boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 기존 데이터 초기화 (재실행 시 중복 방지)
-- ============================================================
TRUNCATE budget_items, expenses, checklist_items, schedules RESTART IDENTITY CASCADE;

-- ============================================================
-- 1. 예산 항목 (budget_items)
-- ============================================================
INSERT INTO budget_items (name, category, cycle, due_day, amount_usd, amount_krw, assignee, memo) VALUES
-- 매월 고정 지출
('월세', '주거', '매월', 1, 1200, 1860000, '딸', '아파트 렌트비'),
('전기/수도/인터넷', '주거', '매월', 10, 80, 124000, '딸', '유틸리티'),
('핸드폰 요금', '통신', '매월', 15, 45, 69750, '딸', 'T-Mobile'),
('식비', '식비', '매월', NULL, 350, 542500, '딸', '식료품+외식 합계'),
('교통비', '교통', '매월', NULL, 80, 124000, '딸', '버스패스+우버'),
('여행자보험', '보험', '매월', 25, 60, 93000, '아빠', 'IMG 유학생 보험'),
('학업 용품/교재', '학업', '매월', NULL, 100, 155000, '딸', '교재/문구'),
('용돈 (잡비)', '생활', '매월', NULL, 200, 310000, '딸', '기타 생활비'),

-- 학기별
('등록금', '학업', '학기별', NULL, 3200, 4960000, '아빠', '수업료'),
('기숙사비', '주거', '학기별', NULL, 0, 0, '딸', '비해당 - 자취'),

-- 연간
('비행기표 (귀국)', '여행', '연간', NULL, 900, 1395000, '아빠', '방학 귀국 왕복'),
('운전면허 취득', '교통', '일회성', NULL, 300, 465000, '딸', 'DMV 시험+교습'),

-- 일회성
('초기 생활용품 구입', '생활', '일회성', NULL, 500, 775000, '아빠', '입학 초 세팅 비용'),
('노트북 구입', '학업', '일회성', NULL, 1200, 1860000, '아빠', 'MacBook Air');

-- ============================================================
-- 2. 지출 내역 (expenses) - 최근 2개월
-- ============================================================
INSERT INTO expenses (expense_date, name, category, amount_usd, amount_krw, payment_method, paid_by, memo) VALUES
-- 2026년 8월
('2026-08-07', '코스트코 장보기', '식비', 85.40, 132370, '해외카드', '딸', '한달치 식재료'),
('2026-08-06', '스타벅스', '식비', 7.50, 11625, '직불카드', '딸', NULL),
('2026-08-05', '월세 납부', '주거', 1200.00, 1860000, '해외송금', '아빠', '8월 렌트'),
('2026-08-04', '버스 패스', '교통', 35.00, 54250, '직불카드', '딸', '8월 월정액'),
('2026-08-03', '약국 (감기약)', '의료', 18.90, 29295, '직불카드', '딸', 'CVS'),
('2026-08-02', '학교 주차 퍼밋', '교통', 45.00, 69750, '직불카드', '딸', '2학기 주차권'),
('2026-08-01', 'T-Mobile 요금', '통신', 45.00, 69750, '자동이체', '딸', '8월분'),

-- 2026년 7월
('2026-07-31', '인앤아웃 버거', '식비', 14.20, 22010, '직불카드', '딸', '친구들이랑'),
('2026-07-28', '마트 장보기', '식비', 62.50, 96875, '해외카드', '딸', NULL),
('2026-07-27', '여행자보험', '보험', 60.00, 93000, '자동이체', '아빠', '7월분'),
('2026-07-25', 'UCLA 방문 교통비', '교통', 22.00, 34100, '직불카드', '딸', '우버'),
('2026-07-22', '교재 구입', '학업', 89.99, 139485, '해외카드', '딸', 'Amazon - 2학기 교재'),
('2026-07-20', '전기/수도', '주거', 78.50, 121675, '자동이체', '딸', '7월 유틸리티'),
('2026-07-15', '핸드폰 요금', '통신', 45.00, 69750, '자동이체', '딸', '7월분'),
('2026-07-10', '영화 관람', '생활', 16.00, 24800, '직불카드', '딸', '친구랑'),
('2026-07-05', '월세 납부', '주거', 1200.00, 1860000, '해외송금', '아빠', '7월 렌트'),
('2026-07-03', '미용실', '생활', 55.00, 85250, '현금', '딸', NULL),
('2026-07-01', '생활용품', '생활', 43.20, 66960, '직불카드', '딸', '다이소 미국판');

-- ============================================================
-- 3. 체크리스트 (checklist_items)
-- ============================================================
INSERT INTO checklist_items (category, name, priority, is_done, notes) VALUES
-- 서류
('서류', '여권 유효기간 확인 (2년 이상)', '상', true, '2031년까지 유효'),
('서류', '비자 (F-1) 발급', '상', true, 'SEVIS 비용 포함'),
('서류', 'I-20 원본 수령', '상', true, '학교 국제학생처에서 수령'),
('서류', '영문 가족관계증명서 공증', '상', true, NULL),
('서류', '여행자보험 증명서 출력', '중', true, NULL),
('서류', '국제학생증 (ISIC) 발급', '하', false, '학생 할인 혜택용'),

-- 금융
('금융', '미국 은행 계좌 개설 (Bank of America)', '상', true, '학교 근처 지점 방문'),
('금융', '미국 직불카드 수령', '상', true, NULL),
('금융', '해외 송금 앱 설정 (와이즈)', '상', true, '아빠 → 딸 정기 송금'),
('금융', '신용 히스토리 쌓기 (Secured Card)', '중', false, '6개월 후 고려'),

-- 학업
('학업', '학교 포털 (MyPortal) 로그인 확인', '상', true, NULL),
('학업', '2학기 수강신청 완료', '상', true, '필수과목 우선'),
('학업', '학교 이메일 계정 활성화', '상', true, NULL),
('학업', '도서관 이용증 발급', '중', false, NULL),
('학업', '튜터링 센터 위치 파악', '중', false, NULL),
('학업', 'TOEFL/IELTS 점수 제출 (있는 경우)', '상', true, NULL),

-- 주거
('주거', '렌트 계약서 서명', '상', true, '12개월 계약'),
('주거', '인터넷 설치 예약', '상', true, 'Spectrum'),
('주거', '세입자 보험 가입', '중', false, '월 ~$15, 고려 중'),
('주거', '긴급 연락처 부모님께 공유', '중', true, NULL),

-- 생활
('생활', '미국 운전면허 취득', '중', false, 'DMV 예약 필요'),
('생활', '대중교통 앱 설치 (Google Maps, Citymapper)', '중', true, NULL),
('생활', '한인마트 위치 파악', '하', true, '한남체인, H마트'),
('생활', '응급실/병원 위치 파악', '상', true, NULL),
('생활', '세탁기/건조기 사용법 숙지', '중', true, '코인세탁소'),

-- 전자기기
('전자기기', '노트북 구입 (MacBook)', '상', true, 'Apple Student 할인'),
('전자기기', '어댑터/멀티탭 (110V 호환)', '중', true, NULL),
('전자기기', '학교 소프트웨어 설치 (MS Office 등)', '중', true, '학생 무료'),
('전자기기', '외장하드 (백업용)', '하', false, NULL);

-- ============================================================
-- 4. 일정 (schedules)
-- ============================================================
INSERT INTO schedules (title, event_date, category, description, is_done) VALUES
-- 완료된 일정
('인천공항 출발', '2026-08-15', '출국준비', '인천 → LAX 직항', true),
('LAX 도착 / 입국 심사', '2026-08-15', '도착정착', 'ESTA 대신 F-1 비자로 입국', true),
('아파트 입주', '2026-08-16', '도착정착', '렌트 계약 후 열쇠 수령', true),
('Bank of America 계좌 개설', '2026-08-17', '도착정착', '학교 근처 지점 방문', true),
('학교 국제학생처 방문', '2026-08-18', '학사일정', 'I-20 제출 및 오리엔테이션 등록', true),
('신입생 오리엔테이션', '2026-08-20', '학사일정', '필수 참석', true),

-- 예정 일정
('2학기 수강신청 마감', '2026-08-10', '학사일정', '늦지 않게 확인', false),
('2학기 개강', '2026-08-24', '학사일정', '첫 수업 시간표 확인', false),
('9월 렌트 납부', '2026-09-01', '월별납부', '$1,200 해외송금', false),
('9월 T-Mobile 요금', '2026-09-15', '월별납부', '$45 자동이체 확인', false),
('9월 여행자보험', '2026-09-25', '월별납부', '$60 자동이체 확인', false),
('중간고사', '2026-10-12', '학사일정', '과목별 일정 별도 확인', false),
('기말고사', '2026-12-10', '학사일정', '기말 준비 미리 시작', false),
('겨울방학 귀국 항공권 예약', '2026-09-01', '출국준비', '빨리 예약할수록 저렴', false),
('귀국 (겨울방학)', '2026-12-20', '출국준비', 'LAX → 인천', false),
('DMV 운전면허 시험 예약', '2026-09-10', '도착정착', '온라인 예약 필요', false);

-- ============================================================
-- 확인
-- ============================================================
SELECT '✅ budget_items' as table_name, count(*) as rows FROM budget_items
UNION ALL
SELECT '✅ expenses', count(*) FROM expenses
UNION ALL
SELECT '✅ checklist_items', count(*) FROM checklist_items
UNION ALL
SELECT '✅ schedules', count(*) FROM schedules;
