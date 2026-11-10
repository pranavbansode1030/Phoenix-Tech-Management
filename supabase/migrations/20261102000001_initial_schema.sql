-- ==============================================================================
-- PHOENIX TECH SOLUTION: INTERNAL FINANCE MANAGEMENT SCHEMA
-- Roles:
--   1. Founder / Director: Pranav Bansode (Strategy, Finance, Approvals)
--   2. Co-Founder: Arshad Shaikh (Meetings, Marketing, Idea Research, Planning)
--   3. Technical Department: Vivek Gajdhane (Frontend, Backend, Implementation)
-- Projects:
--   1. LeadX
--   2. Smart Review Management
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Roles & Profiles
CREATE TYPE user_role AS ENUM ('founder_director', 'co_founder', 'technical');

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Team Members Roster
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL,
    designation TEXT NOT NULL,
    responsibilities TEXT[] NOT NULL,
    monthly_compensation NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (monthly_compensation >= 0),
    is_founder BOOLEAN NOT NULL DEFAULT FALSE,
    joining_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Projects (Initially LeadX and Smart Review Management)
CREATE TYPE project_status AS ENUM ('active', 'completed', 'pipeline', 'on_hold');

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status project_status NOT NULL DEFAULT 'active',
    revenue_received NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (revenue_received >= 0),
    direct_expenses NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (direct_expenses >= 0),
    allocated_overhead NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (allocated_overhead >= 0),
    incentive_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00 CHECK (incentive_percentage >= 0 AND incentive_percentage <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project Members Association
CREATE TABLE IF NOT EXISTS project_team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    share_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (share_percentage >= 0 AND share_percentage <= 100),
    UNIQUE(project_id, member_id)
);

-- 4. Income Management (Actual Cash Received separated from invoices)
CREATE TYPE payment_method AS ENUM ('bank_transfer', 'upi', 'cheque', 'card', 'other');
CREATE TYPE payment_status AS ENUM ('received', 'pending', 'partial');

CREATE TABLE IF NOT EXISTS income_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source TEXT NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    gst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (gst_amount >= 0),
    total_with_gst NUMERIC(12, 2) NOT NULL CHECK (total_with_gst >= amount),
    payment_date DATE NOT NULL,
    status payment_status NOT NULL DEFAULT 'received',
    payment_method payment_method NOT NULL DEFAULT 'bank_transfer',
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Expense Management
CREATE TYPE expense_category AS ENUM (
    'marketing_business',
    'technical_infrastructure',
    'software_tools',
    'team_compensation',
    'administrative',
    'direct_project_cost',
    'other'
);
CREATE TYPE expense_approval_status AS ENUM ('pending_approval', 'approved', 'rejected', 'reversed');

CREATE TABLE IF NOT EXISTS expense_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category expense_category NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    gst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (gst_amount >= 0),
    total_payment NUMERIC(12, 2) NOT NULL CHECK (total_payment >= amount),
    date DATE NOT NULL,
    paid_by TEXT NOT NULL,
    description TEXT,
    status expense_approval_status NOT NULL DEFAULT 'pending_approval',
    submitted_by UUID REFERENCES profiles(id),
    approved_by UUID REFERENCES profiles(id),
    is_reversal BOOLEAN NOT NULL DEFAULT FALSE,
    reversal_for_id UUID REFERENCES expense_records(id),
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Team Compensation Records & Founder Withdrawals
CREATE TABLE IF NOT EXISTS compensation_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    period_month DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'paid', -- 'pending', 'paid'
    payment_date DATE,
    transaction_ref TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS founder_drawings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    founder_id UUID NOT NULL REFERENCES team_members(id),
    date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    reference_no TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Project Profit Sharing & Incentives
CREATE TABLE IF NOT EXISTS project_incentive_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    net_contribution NUMERIC(12, 2) NOT NULL,
    incentive_percentage NUMERIC(5, 2) NOT NULL,
    total_incentive_pool NUMERIC(12, 2) NOT NULL CHECK (total_incentive_pool >= 0),
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS member_incentive_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pool_id UUID NOT NULL REFERENCES project_incentive_pools(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    share_percentage NUMERIC(5, 2) NOT NULL CHECK (share_percentage >= 0 AND share_percentage <= 100),
    allocated_amount NUMERIC(12, 2) NOT NULL CHECK (allocated_amount >= 0),
    payment_status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'approved', 'paid'
    paid_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Company Reserves
CREATE TYPE reserve_type AS ENUM ('emergency', 'operational', 'product_dev', 'tax');

CREATE TABLE IF NOT EXISTS company_reserves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type reserve_type UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (current_balance >= 0),
    target_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (target_amount >= 0),
    monthly_allocation NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (monthly_allocation >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID,
    performed_by TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
