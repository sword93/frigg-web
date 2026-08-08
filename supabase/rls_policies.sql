-- ============================================================
-- FRIGG 앱 — Row Level Security 정책
-- ============================================================
-- 실행 방법: Supabase Dashboard > SQL Editor에 붙여넣고 실행
--
-- 이 앱은 가족 공유 앱으로 user_id 컬럼이 없습니다.
-- 정책: 로그인(인증)된 사용자라면 모든 행에 CRUD 허용
-- ============================================================

-- ------------------------------------------------------------
-- 1. expenses
-- ------------------------------------------------------------
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 기존 정책 충돌 방지
DROP POLICY IF EXISTS "expenses_select" ON expenses;
DROP POLICY IF EXISTS "expenses_insert" ON expenses;
DROP POLICY IF EXISTS "expenses_update" ON expenses;
DROP POLICY IF EXISTS "expenses_delete" ON expenses;

CREATE POLICY "expenses_select"
  ON expenses FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "expenses_insert"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "expenses_update"
  ON expenses FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "expenses_delete"
  ON expenses FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ------------------------------------------------------------
-- 2. budget_items
-- ------------------------------------------------------------
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budget_items_select" ON budget_items;
DROP POLICY IF EXISTS "budget_items_insert" ON budget_items;
DROP POLICY IF EXISTS "budget_items_update" ON budget_items;
DROP POLICY IF EXISTS "budget_items_delete" ON budget_items;

CREATE POLICY "budget_items_select"
  ON budget_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "budget_items_insert"
  ON budget_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "budget_items_update"
  ON budget_items FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "budget_items_delete"
  ON budget_items FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ------------------------------------------------------------
-- 3. checklist_items
-- ------------------------------------------------------------
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checklist_items_select" ON checklist_items;
DROP POLICY IF EXISTS "checklist_items_insert" ON checklist_items;
DROP POLICY IF EXISTS "checklist_items_update" ON checklist_items;
DROP POLICY IF EXISTS "checklist_items_delete" ON checklist_items;

CREATE POLICY "checklist_items_select"
  ON checklist_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "checklist_items_insert"
  ON checklist_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "checklist_items_update"
  ON checklist_items FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "checklist_items_delete"
  ON checklist_items FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ------------------------------------------------------------
-- 4. schedules
-- ------------------------------------------------------------
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schedules_select" ON schedules;
DROP POLICY IF EXISTS "schedules_insert" ON schedules;
DROP POLICY IF EXISTS "schedules_update" ON schedules;
DROP POLICY IF EXISTS "schedules_delete" ON schedules;

CREATE POLICY "schedules_select"
  ON schedules FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "schedules_insert"
  ON schedules FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "schedules_update"
  ON schedules FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "schedules_delete"
  ON schedules FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ------------------------------------------------------------
-- 적용 확인
-- ------------------------------------------------------------
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename IN ('expenses', 'budget_items', 'checklist_items', 'schedules')
  AND schemaname = 'public'
ORDER BY tablename;
