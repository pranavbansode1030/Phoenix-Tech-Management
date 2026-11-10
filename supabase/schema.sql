-- ==============================================================================
-- PHOENIX TECH SOLUTIONS: COMPLETE SUPABASE DATABASE SCHEMA
-- Architecture & Workflow:
--   Core Team:
--     1. PB-01: Pranav Bansode (Founder & Director - Strategy, Finance, Approvals)
--     2. AS-02: Arshad Shaikh (Co-Founder - Meetings, Marketing, Idea Research, Planning)
--     3. VG-03: Vivek Gajdhane (Technical Department - Frontend, Backend, Implementation)
--   Designed Products:
--     1. PRJ-LEADX: LeadX
--     2. PRJ-SRM:   Smart Review Management
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- EXTENSIONS (uuid-ossp & pgcrypto for UUID v4 support)
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- ENUMS & TYPES
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('founder_director', 'co_founder', 'technical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('active', 'completed', 'pipeline', 'on_hold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('bank_transfer', 'upi', 'cheque', 'card', 'cash', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('received', 'pending', 'partial');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE expense_category AS ENUM (
        'marketing_business',
        'technical_infrastructure',
        'software_tools',
        'team_compensation',
        'administrative',
        'direct_project_cost',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE expense_approval_status AS ENUM ('pending_approval', 'approved', 'rejected', 'reversed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('assigned', 'in_progress', 'review_pending', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reserve_type AS ENUM ('emergency', 'operational', 'product_dev', 'tax');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 1. PROFILES (Linked to Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    member_code TEXT UNIQUE NOT NULL, -- PB-01, AS-02, VG-03
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'technical',
    designation TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. TEAM MEMBERS (Operational Directory & Financial Roster)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_code TEXT UNIQUE NOT NULL, -- PB-01, AS-02, VG-03
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL,
    designation TEXT NOT NULL,
    responsibilities TEXT[] NOT NULL DEFAULT '{}',
    monthly_compensation NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (monthly_compensation >= 0),
    is_founder BOOLEAN NOT NULL DEFAULT FALSE,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    ytd_drawings NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (ytd_drawings >= 0),
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. PROJECTS / PRODUCTS (Proprietary Platforms: LeadX & Smart Review Management)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- PRJ-LEADX, PRJ-SRM
    name TEXT NOT NULL,
    description TEXT,
    status project_status NOT NULL DEFAULT 'active',
    revenue_received NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (revenue_received >= 0),
    direct_expenses NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (direct_expenses >= 0),
    allocated_overhead NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (allocated_overhead >= 0),
    incentive_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00 CHECK (incentive_percentage >= 0 AND incentive_percentage <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project Members Equity & Incentive Split
CREATE TABLE IF NOT EXISTS public.project_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
    share_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (share_percentage >= 0 AND share_percentage <= 100),
    role_in_project TEXT,
    UNIQUE(project_id, member_id)
);

-- ------------------------------------------------------------------------------
-- 4. INCOME RECORDS (Actual Received Cash & Client Receipts)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.income_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    gst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (gst_amount >= 0),
    total_with_gst NUMERIC(12, 2) NOT NULL CHECK (total_with_gst >= amount),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status payment_status NOT NULL DEFAULT 'received',
    payment_method payment_method NOT NULL DEFAULT 'bank_transfer',
    invoice_no TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. EXPENSE RECORDS & APPROVAL WORKFLOW
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expense_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category expense_category NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    gst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (gst_amount >= 0),
    total_payment NUMERIC(12, 2) NOT NULL CHECK (total_payment >= amount),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    paid_by TEXT NOT NULL,
    description TEXT,
    status expense_approval_status NOT NULL DEFAULT 'pending_approval',
    submitted_by UUID REFERENCES public.profiles(id),
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    is_reversal BOOLEAN NOT NULL DEFAULT FALSE,
    reversal_for_id UUID REFERENCES public.expense_records(id),
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. WORKFLOW & ASSIGNED TASKS (Delegated by Founder)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assigned_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    assigned_to UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id),
    priority task_priority NOT NULL DEFAULT 'medium',
    status task_status NOT NULL DEFAULT 'assigned',
    due_date DATE,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. COMPENSATION & FOUNDER DRAWINGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compensation_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
    period_month DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'paid',
    payment_date DATE,
    transaction_ref TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.founder_drawings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_id UUID NOT NULL REFERENCES public.team_members(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    reference_no TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. PROJECT INCENTIVES & PROFIT SHARING
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_incentive_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    net_contribution NUMERIC(12, 2) NOT NULL,
    incentive_percentage NUMERIC(5, 2) NOT NULL,
    total_incentive_pool NUMERIC(12, 2) NOT NULL CHECK (total_incentive_pool >= 0),
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.member_incentive_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL REFERENCES public.project_incentive_pools(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
    share_percentage NUMERIC(5, 2) NOT NULL CHECK (share_percentage >= 0 AND share_percentage <= 100),
    allocated_amount NUMERIC(12, 2) NOT NULL CHECK (allocated_amount >= 0),
    payment_status TEXT NOT NULL DEFAULT 'draft',
    paid_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. COMPANY RESERVES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_reserves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type reserve_type UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (current_balance >= 0),
    target_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (target_amount >= 0),
    monthly_allocation NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (monthly_allocation >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID,
    performed_by TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- HELPER FUNCTIONS FOR USER LOGIN & AUTHORIZATION (IN public SCHEMA)
-- ------------------------------------------------------------------------------

-- Get role of currently authenticated user
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
DECLARE
    r user_role;
BEGIN
    SELECT role INTO r FROM public.profiles WHERE id = auth.uid();
    RETURN r;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Check if current user is Founder & Director
CREATE OR REPLACE FUNCTION public.is_founder()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (public.get_user_role() = 'founder_director');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Get member code of current user (e.g. 'PB-01', 'AS-02', 'VG-03')
CREATE OR REPLACE FUNCTION public.get_member_code()
RETURNS TEXT AS $$
DECLARE
    m_code TEXT;
BEGIN
    SELECT member_code INTO m_code FROM public.profiles WHERE id = auth.uid();
    RETURN m_code;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- USER LOGIN WORKFLOW: AUTOMATED TRIGGER ON auth.users SIGNUP / PROVISIONING
-- Automatically links newly created Supabase Auth accounts to public.profiles
-- and public.team_members based on metadata member_code or matching email.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    m_code TEXT;
    u_role user_role;
    u_name TEXT;
    u_desig TEXT;
BEGIN
    -- Determine member code from metadata or email prefix
    m_code := COALESCE(
        NEW.raw_user_meta_data->>'member_code',
        CASE
            WHEN NEW.email ILIKE '%pranav%' THEN 'PB-01'
            WHEN NEW.email ILIKE '%arshad%' THEN 'AS-02'
            WHEN NEW.email ILIKE '%vivek%' THEN 'VG-03'
            ELSE 'MB-' || SUBSTRING(NEW.id::text, 1, 4)
        END
    );

    -- Determine Role and Designation
    IF m_code = 'PB-01' OR NEW.email ILIKE '%pranav%' THEN
        u_role := 'founder_director';
        u_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Pranav Bansode');
        u_desig := 'Founder & Director';
    ELSIF m_code = 'AS-02' OR NEW.email ILIKE '%arshad%' THEN
        u_role := 'co_founder';
        u_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Arshad Shaikh');
        u_desig := 'Co-Founder';
    ELSIF m_code = 'VG-03' OR NEW.email ILIKE '%vivek%' THEN
        u_role := 'technical';
        u_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Vivek Gajdhane');
        u_desig := 'Technical Department';
    ELSE
        u_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'technical');
        u_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
        u_desig := COALESCE(NEW.raw_user_meta_data->>'designation', 'Team Member');
    END IF;

    -- Upsert profile record
    INSERT INTO public.profiles (id, member_code, email, full_name, role, designation)
    VALUES (NEW.id, m_code, NEW.email, u_name, u_role, u_desig)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        designation = EXCLUDED.designation,
        updated_at = NOW();

    -- Link profile_id to team_members roster
    UPDATE public.team_members
    SET profile_id = NEW.id
    WHERE member_code = m_code;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger definition on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- RPC FUNCTION: get_current_user_profile()
-- Called by frontend immediately after login to load complete user context & permissions
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS JSONB AS $$
DECLARE
    res JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', p.id,
        'member_code', p.member_code,
        'email', p.email,
        'full_name', p.full_name,
        'role', p.role,
        'designation', p.designation,
        'avatar_url', p.avatar_url,
        'is_founder', (p.role = 'founder_director'),
        'team_member_id', tm.id,
        'monthly_compensation', tm.monthly_compensation,
        'responsibilities', tm.responsibilities,
        'permissions', jsonb_build_object(
            'can_approve_expenses', (p.role = 'founder_director'),
            'can_manage_reserves', (p.role = 'founder_director'),
            'can_view_drawings', (p.role = 'founder_director'),
            'can_assign_tasks', (p.role = 'founder_director'),
            'can_submit_expenses', TRUE,
            'can_view_projects', TRUE,
            'can_view_income', TRUE
        )
    ) INTO res
    FROM public.profiles p
    LEFT JOIN public.team_members tm ON tm.profile_id = p.id
    WHERE p.id = auth.uid();

    RETURN res;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assigned_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compensation_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founder_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_incentive_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_incentive_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_reserves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles RLS
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users"
    ON public.profiles FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Founder has full control over profiles" ON public.profiles;
CREATE POLICY "Founder has full control over profiles"
    ON public.profiles FOR ALL TO authenticated
    USING (public.is_founder());

-- 2. Team Members RLS
DROP POLICY IF EXISTS "Team roster viewable by authenticated users" ON public.team_members;
CREATE POLICY "Team roster viewable by authenticated users"
    ON public.team_members FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Founder manages team roster" ON public.team_members;
CREATE POLICY "Founder manages team roster"
    ON public.team_members FOR ALL TO authenticated
    USING (public.is_founder());

-- 3. Projects RLS
DROP POLICY IF EXISTS "Projects viewable by authenticated users" ON public.projects;
CREATE POLICY "Projects viewable by authenticated users"
    ON public.projects FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Founder manages projects" ON public.projects;
CREATE POLICY "Founder manages projects"
    ON public.projects FOR ALL TO authenticated
    USING (public.is_founder());

-- 4. Project Team Associations
DROP POLICY IF EXISTS "Project team viewable by authenticated users" ON public.project_team;
CREATE POLICY "Project team viewable by authenticated users"
    ON public.project_team FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Founder manages project team" ON public.project_team;
CREATE POLICY "Founder manages project team"
    ON public.project_team FOR ALL TO authenticated
    USING (public.is_founder());

-- 5. Income Records RLS
DROP POLICY IF EXISTS "Income records viewable by authenticated users" ON public.income_records;
CREATE POLICY "Income records viewable by authenticated users"
    ON public.income_records FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Founder manages income records" ON public.income_records;
CREATE POLICY "Founder manages income records"
    ON public.income_records FOR ALL TO authenticated
    USING (public.is_founder());

-- 6. Expense Records RLS
DROP POLICY IF EXISTS "Team members can submit expenses" ON public.expense_records;
CREATE POLICY "Team members can submit expenses"
    ON public.expense_records FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Members view approved or own expenses; Founder views all" ON public.expense_records;
CREATE POLICY "Members view approved or own expenses; Founder views all"
    ON public.expense_records FOR SELECT TO authenticated
    USING (
        submitted_by = auth.uid() OR
        status = 'approved' OR
        public.is_founder()
    );

DROP POLICY IF EXISTS "Founder approves and manages expenses" ON public.expense_records;
CREATE POLICY "Founder approves and manages expenses"
    ON public.expense_records FOR UPDATE TO authenticated
    USING (public.is_founder());

DROP POLICY IF EXISTS "Founder deletes expenses" ON public.expense_records;
CREATE POLICY "Founder deletes expenses"
    ON public.expense_records FOR DELETE TO authenticated
    USING (public.is_founder());

-- 7. Assigned Tasks RLS
DROP POLICY IF EXISTS "Team members view assigned tasks" ON public.assigned_tasks;
CREATE POLICY "Team members view assigned tasks"
    ON public.assigned_tasks FOR SELECT TO authenticated
    USING (
        assigned_to IN (SELECT id FROM public.team_members WHERE profile_id = auth.uid()) OR
        public.is_founder()
    );

DROP POLICY IF EXISTS "Founder creates and assigns tasks" ON public.assigned_tasks;
CREATE POLICY "Founder creates and assigns tasks"
    ON public.assigned_tasks FOR INSERT TO authenticated
    WITH CHECK (public.is_founder());

DROP POLICY IF EXISTS "Assigned member updates status; Founder updates all" ON public.assigned_tasks;
CREATE POLICY "Assigned member updates status; Founder updates all"
    ON public.assigned_tasks FOR UPDATE TO authenticated
    USING (
        assigned_to IN (SELECT id FROM public.team_members WHERE profile_id = auth.uid()) OR
        public.is_founder()
    );

-- 8. Founder Drawings (Strictly Confidential to Founder & Director)
DROP POLICY IF EXISTS "Drawings strictly managed and viewed by Founder" ON public.founder_drawings;
CREATE POLICY "Drawings strictly managed and viewed by Founder"
    ON public.founder_drawings FOR ALL TO authenticated
    USING (public.is_founder());

-- 9. Compensation Payments RLS
DROP POLICY IF EXISTS "Founder manages all compensation payments" ON public.compensation_payments;
CREATE POLICY "Founder manages all compensation payments"
    ON public.compensation_payments FOR ALL TO authenticated
    USING (public.is_founder());

DROP POLICY IF EXISTS "Members view only their own compensation" ON public.compensation_payments;
CREATE POLICY "Members view only their own compensation"
    ON public.compensation_payments FOR SELECT TO authenticated
    USING (
        member_id IN (SELECT id FROM public.team_members WHERE profile_id = auth.uid()) OR
        public.is_founder()
    );

-- 10. Incentive Pools & Allocations RLS
DROP POLICY IF EXISTS "Incentives viewable by authenticated users" ON public.project_incentive_pools;
CREATE POLICY "Incentives viewable by authenticated users"
    ON public.project_incentive_pools FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Founder manages incentive pools" ON public.project_incentive_pools;
CREATE POLICY "Founder manages incentive pools"
    ON public.project_incentive_pools FOR ALL TO authenticated
    USING (public.is_founder());

DROP POLICY IF EXISTS "Members view own incentive allocations; Founder views all" ON public.member_incentive_allocations;
CREATE POLICY "Members view own incentive allocations; Founder views all"
    ON public.member_incentive_allocations FOR SELECT TO authenticated
    USING (
        member_id IN (SELECT id FROM public.team_members WHERE profile_id = auth.uid()) OR
        public.is_founder()
    );

DROP POLICY IF EXISTS "Founder manages member incentive allocations" ON public.member_incentive_allocations;
CREATE POLICY "Founder manages member incentive allocations"
    ON public.member_incentive_allocations FOR ALL TO authenticated
    USING (public.is_founder());

-- 11. Company Reserves RLS
DROP POLICY IF EXISTS "Company reserves managed strictly by Founder" ON public.company_reserves;
CREATE POLICY "Company reserves managed strictly by Founder"
    ON public.company_reserves FOR ALL TO authenticated
    USING (public.is_founder());

DROP POLICY IF EXISTS "Reserves read-only viewable by authenticated team" ON public.company_reserves;
CREATE POLICY "Reserves read-only viewable by authenticated team"
    ON public.company_reserves FOR SELECT TO authenticated
    USING (true);

-- 12. Audit Logs RLS
DROP POLICY IF EXISTS "Audit logs managed by system and viewable by Founder" ON public.audit_logs;
CREATE POLICY "Audit logs managed by system and viewable by Founder"
    ON public.audit_logs FOR SELECT TO authenticated
    USING (public.is_founder());

DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
    ON public.audit_logs FOR INSERT TO authenticated
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- INITIAL SEED DATA (Clean State - Using RFC 4122 UUID v4 with 4-digit identifiers)
-- ------------------------------------------------------------------------------

-- 1. Core Team Members (PB-01, AS-02, VG-03)
INSERT INTO public.team_members (id, member_code, name, role, designation, responsibilities, monthly_compensation, is_founder, joining_date)
VALUES
(
    '00000000-0000-4000-8000-000000000001',
    'PB-01',
    'Pranav Bansode',
    'founder_director',
    'Founder & Director',
    ARRAY['Business strategy', 'Finance management', 'Final business decisions', 'Financial approvals', 'Workflow oversight'],
    0.00,
    TRUE,
    '2025-01-01'
),
(
    '00000000-0000-4000-8000-000000000002',
    'AS-02',
    'Arshad Shaikh',
    'co_founder',
    'Co-Founder',
    ARRAY['Scheduling meetings', 'Marketing management', 'Business idea research', 'Digital business planning', 'Client outreach'],
    65000.00,
    FALSE,
    '2025-03-01'
),
(
    '00000000-0000-4000-8000-000000000003',
    'VG-03',
    'Vivek Gajdhane',
    'technical',
    'Technical Department',
    ARRAY['Frontend development', 'Backend development', 'Technical architecture', 'System implementation', 'Product deployment'],
    55000.00,
    FALSE,
    '2025-05-15'
)
ON CONFLICT (member_code) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    designation = EXCLUDED.designation,
    responsibilities = EXCLUDED.responsibilities,
    monthly_compensation = EXCLUDED.monthly_compensation;

-- 2. Core Designed Products (Strictly 1: LeadX and 2: Smart Review Management)
-- Clean Starting Figures: 0 revenue received, 0 direct expenses, 0 overhead.
INSERT INTO public.projects (id, code, name, description, status, revenue_received, direct_expenses, allocated_overhead, incentive_percentage)
VALUES
(
    '00000000-0000-4000-a000-000000000001',
    'PRJ-LEADX',
    'LeadX',
    'Proprietary B2B client acquisition, automated lead capture & conversion pipeline platform designed by Phoenix Tech Solutions.',
    'active',
    0.00,
    0.00,
    0.00,
    12.00
),
(
    '00000000-0000-4000-a000-000000000002',
    'PRJ-SRM',
    'Smart Review Management',
    'Proprietary reputation intelligence, automated review interception funnel & sentiment engine designed by Phoenix Tech Solutions.',
    'active',
    0.00,
    0.00,
    0.00,
    10.00
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 3. Project Member Allocations & Equity
-- LeadX: Pranav (30%), Arshad (40% - Marketing & Outreach), Vivek (30% - Technical Implementation)
INSERT INTO public.project_team (project_id, member_id, share_percentage, role_in_project)
VALUES
(
    '00000000-0000-4000-a000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    30.00,
    'Strategic Oversight & Financial Governance'
),
(
    '00000000-0000-4000-a000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    40.00,
    'Marketing, Client Acquisition & Business Meetings'
),
(
    '00000000-0000-4000-a000-000000000001',
    '00000000-0000-4000-8000-000000000003',
    30.00,
    'Full-Stack Architecture & System Implementation'
),
-- Smart Review Management: Pranav (25%), Arshad (35%), Vivek (40% - Core Platform Build)
(
    '00000000-0000-4000-a000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    25.00,
    'Strategy & Financial Approvals'
),
(
    '00000000-0000-4000-a000-000000000002',
    '00000000-0000-4000-8000-000000000002',
    35.00,
    'Hospitality & SME Client Outreach'
),
(
    '00000000-0000-4000-a000-000000000002',
    '00000000-0000-4000-8000-000000000003',
    40.00,
    'Lead Platform Engineering & Review API Integrations'
)
ON CONFLICT (project_id, member_id) DO NOTHING;

-- 4. Initial Company Reserves (Clean Slate: Balances at 0.00, ready for real allocations)
INSERT INTO public.company_reserves (id, type, name, description, current_balance, target_amount, monthly_allocation)
VALUES
('00000000-0000-4000-b000-000000000001', 'emergency', 'Emergency Reserve', 'Buffer for 3 months of committed company expenses.', 0.00, 360000.00, 20000.00),
('00000000-0000-4000-b000-000000000002', 'operational', 'Operational Reserve', 'Buffer to smooth irregular client cash cycles.', 0.00, 100000.00, 15000.00),
('00000000-0000-4000-b000-000000000003', 'product_dev', 'Product Development Reserve', 'R&D capital for LeadX & Smart Review upgrades.', 0.00, 150000.00, 10000.00),
('00000000-0000-4000-b000-000000000004', 'tax', 'Tax Reserve', 'Ring-fenced GST collections & advance statutory tax.', 0.00, 75000.00, 0.00)
ON CONFLICT (type) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    target_amount = EXCLUDED.target_amount,
    monthly_allocation = EXCLUDED.monthly_allocation;

-- ------------------------------------------------------------------------------
-- PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_member_code ON public.profiles(member_code);
CREATE INDEX IF NOT EXISTS idx_team_members_code ON public.team_members(member_code);
CREATE INDEX IF NOT EXISTS idx_income_project_id ON public.income_records(project_id);
CREATE INDEX IF NOT EXISTS idx_income_payment_date ON public.income_records(payment_date);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON public.expense_records(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expense_records(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expense_records(date);
CREATE INDEX IF NOT EXISTS idx_assigned_tasks_member ON public.assigned_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assigned_tasks_status ON public.assigned_tasks(status);
CREATE INDEX IF NOT EXISTS idx_founder_drawings_date ON public.founder_drawings(date);

-- ------------------------------------------------------------------------------
-- 5. PORTAL USERS & CREDENTIALS TABLE (FOR EASY SUPABASE TABLE-EDITOR MANAGEMENT)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id TEXT UNIQUE NOT NULL,          -- e.g. 'PB-01', 'AS-02', 'VG-03'
    name TEXT NOT NULL,                     -- e.g. 'Pranav Bansode'
    email TEXT UNIQUE NOT NULL,             -- e.g. 'pranav@phoenixtech.com'
    password TEXT NOT NULL,                 -- Plain/Hash password or PIN (e.g. '1001')
    role TEXT NOT NULL DEFAULT 'technical', -- 'founder_director', 'co_founder', 'technical'
    designation TEXT NOT NULL,              -- e.g. 'Founder & Director'
    status TEXT NOT NULL DEFAULT 'active',  -- 'active' or 'inactive'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_member_id ON public.users (member_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow portal login select on users" ON public.users;
CREATE POLICY "Allow portal login select on users"
    ON public.users
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow full management on users" ON public.users;
CREATE POLICY "Allow full management on users"
    ON public.users
    FOR ALL
    USING (true);

INSERT INTO public.users (member_id, name, email, password, role, designation, status)
VALUES
('PB-01', 'Pranav Bansode', 'pranav@phoenixtech.com', '1001', 'founder_director', 'Founder & Director', 'active'),
('AS-02', 'Arshad Shaikh', 'arshad@phoenixtech.com', '2002', 'co_founder', 'Co-Founder', 'active'),
('VG-03', 'Vivek Gajdhane', 'vivek@phoenixtech.com', '3003', 'technical', 'Technical Department', 'active'),
('AB-04', 'Aryan Bhore', 'aryan@phoenixtech.com', '4004', 'lead_acquisition', 'Research Lead', 'active')
ON CONFLICT (member_id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    designation = EXCLUDED.designation,
    status = EXCLUDED.status,
    updated_at = NOW();
