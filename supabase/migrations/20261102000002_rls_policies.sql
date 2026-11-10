-- ==============================================================================
-- PHOENIX TECH SOLUTION: ROW LEVEL SECURITY POLICIES
-- Roles:
--   - Founder / Director (Full Authority)
--   - Co-Founder (Marketing & Business Scope)
--   - Technical Department (Technical Implementation Scope)
-- ==============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE compensation_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_incentive_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_incentive_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_reserves ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper: Get current user role
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS user_role AS $$
DECLARE
    r user_role;
BEGIN
    SELECT role INTO r FROM profiles WHERE id = auth.uid();
    RETURN r;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles
CREATE POLICY "Profiles viewable by authenticated users"
ON profiles FOR SELECT TO authenticated USING (true);

-- 2. Projects & Teams
CREATE POLICY "Projects accessible by founder"
ON projects FOR ALL TO authenticated
USING (auth.get_user_role() = 'founder_director');

CREATE POLICY "Projects viewable by assigned team members"
ON projects FOR SELECT TO authenticated
USING (true); -- Both Co-Founder & Technical can view company projects

-- 3. Income
CREATE POLICY "Income full control for founder"
ON income_records FOR ALL TO authenticated
USING (auth.get_user_role() = 'founder_director');

CREATE POLICY "Income summaries viewable by team"
ON income_records FOR SELECT TO authenticated
USING (true);

-- 4. Expenses
CREATE POLICY "Founder has full control over expenses"
ON expense_records FOR ALL TO authenticated
USING (auth.get_user_role() = 'founder_director');

CREATE POLICY "Co-founder & Technical can submit expenses"
ON expense_records FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Team can view approved or own submitted expenses"
ON expense_records FOR SELECT TO authenticated
USING (submitted_by = auth.uid() OR status = 'approved' OR auth.get_user_role() = 'founder_director');

-- 5. Founder Drawings (Confidential to Founder / Director)
CREATE POLICY "Founder drawings strictly restricted to Founder"
ON founder_drawings FOR ALL TO authenticated
USING (auth.get_user_role() = 'founder_director');

-- 6. Compensation & Incentives
CREATE POLICY "Founder manages compensation"
ON compensation_payments FOR ALL TO authenticated
USING (auth.get_user_role() = 'founder_director');

CREATE POLICY "Members view only own compensation"
ON compensation_payments FOR SELECT TO authenticated
USING (
    member_id IN (
        SELECT id FROM team_members WHERE profile_id = auth.uid()
    ) OR auth.get_user_role() = 'founder_director'
);

CREATE POLICY "Reserves managed strictly by Founder"
ON company_reserves FOR ALL TO authenticated
USING (auth.get_user_role() = 'founder_director');
