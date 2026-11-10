-- ==============================================================================
-- PHOENIX TECH SOLUTIONS: USERS & AUTHENTICATION CREDENTIALS TABLE
-- Table: public.users
-- Enables easy, direct management of member credentials, passwords, and roles
-- from Supabase Table Editor without modifying frontend source code.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id TEXT UNIQUE NOT NULL,          -- e.g. 'PB-01', 'AS-02', 'VG-03'
    name TEXT NOT NULL,                     -- e.g. 'Pranav Bansode'
    email TEXT UNIQUE NOT NULL,             -- e.g. 'pranav@phoenixtech.com'
    password TEXT NOT NULL,                 -- Plain/Hash password or PIN (e.g. '1001')
    role TEXT NOT NULL DEFAULT 'technical', -- 'founder_director' (or 'pranav'), 'co_founder' ('arshad'), 'technical' ('vivek')
    designation TEXT NOT NULL,              -- e.g. 'Founder & Director'
    status TEXT NOT NULL DEFAULT 'active',  -- 'active' or 'inactive'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_users_member_id ON public.users (member_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow public read access so the portal can authenticate member credentials
DROP POLICY IF EXISTS "Allow portal login select on users" ON public.users;
CREATE POLICY "Allow portal login select on users"
    ON public.users
    FOR SELECT
    USING (true);

-- Allow service role and admins full management access
DROP POLICY IF EXISTS "Allow full management on users" ON public.users;
CREATE POLICY "Allow full management on users"
    ON public.users
    FOR ALL
    USING (true);

-- Automatic trigger to refresh updated_at timestamp on edit
CREATE OR REPLACE FUNCTION public.set_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_users_updated_at();

-- ==============================================================================
-- SEED INITIAL CREDENTIALS FOR ALL 3 AUTHORIZED MEMBERS
-- ==============================================================================
INSERT INTO public.users (
    member_id,
    name,
    email,
    password,
    role,
    designation,
    status
)
VALUES
(
    'PB-01',
    'Pranav Bansode',
    'pranav@phoenixtech.com',
    '1001',
    'founder_director',
    'Founder & Director',
    'active'
),
(
    'AS-02',
    'Arshad Shaikh',
    'arshad@phoenixtech.com',
    '2002',
    'co_founder',
    'Co-Founder',
    'active'
),
(
    'VG-03',
    'Vivek Gajdhane',
    'vivek@phoenixtech.com',
    '3003',
    'technical',
    'Technical Department',
    'active'
),
(
    'AB-04',
    'Aryan Bhore',
    'aryan@phoenixtech.com',
    '4004',
    'lead_acquisition',
    'Lead Acquisition & Business Development',
    'active'
)
ON CONFLICT (member_id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    designation = EXCLUDED.designation,
    status = EXCLUDED.status,
    updated_at = NOW();

