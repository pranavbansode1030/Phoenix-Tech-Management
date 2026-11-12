-- ==============================================================================
-- PHOENIX TECH SOLUTIONS: SEED DATA SCRIPT
-- Execute in Supabase SQL Editor to seed or refresh initial company data.
-- Uses RFC 4122 UUID v4 with 4-digit human-readable identifier endings.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CORE TEAM MEMBERS (3 Authorized Profiles)
-- ------------------------------------------------------------------------------
INSERT INTO public.team_members (
    id,
    member_code,
    name,
    role,
    designation,
    responsibilities,
    monthly_compensation,
    is_founder,
    joining_date
)
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
),
(
    '00000000-0000-4000-8000-000000000004',
    'AB-04',
    'Aryan Bhore',
    'technical',
    'Research Lead',
    ARRAY['Finding potential client leads', 'Lead qualification', 'Updating portal with prospect requirements', 'Pipeline tracking'],
    45000.00,
    FALSE,
    '2025-06-01'
)
ON CONFLICT (member_code) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    designation = EXCLUDED.designation,
    responsibilities = EXCLUDED.responsibilities,
    monthly_compensation = EXCLUDED.monthly_compensation;

-- ------------------------------------------------------------------------------
-- 1B. PORTAL USERS & CREDENTIALS (FOR SUPABASE TABLE EDITOR LOGIN MANAGEMENT)
-- ------------------------------------------------------------------------------
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
    'technical',
    'Research Lead',
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

-- ------------------------------------------------------------------------------
-- 2. OUR DESIGNED PRODUCTS (Strictly: 1. LeadX, 2. Smart Review Management)
-- Clean initial state: 0 revenue received, 0 direct expenses, 0 overhead
-- ------------------------------------------------------------------------------
INSERT INTO public.projects (
    id,
    code,
    name,
    description,
    status,
    revenue_received,
    direct_expenses,
    allocated_overhead,
    incentive_percentage
)
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
    description = EXCLUDED.description,
    incentive_percentage = EXCLUDED.incentive_percentage;

-- ------------------------------------------------------------------------------
-- 3. PROJECT TEAM EQUITY & INCENTIVE ALLOCATIONS
-- LeadX Split: Pranav (30%), Arshad (40% - Marketing), Vivek (30% - Technical)
-- Smart Review Split: Pranav (25%), Arshad (35%), Vivek (40% - Technical Build)
-- ------------------------------------------------------------------------------
INSERT INTO public.project_team (
    project_id,
    member_id,
    share_percentage,
    role_in_project
)
VALUES
-- LeadX Allocations
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
-- Smart Review Management Allocations
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
ON CONFLICT (project_id, member_id) DO UPDATE SET
    share_percentage = EXCLUDED.share_percentage,
    role_in_project = EXCLUDED.role_in_project;

-- ------------------------------------------------------------------------------
-- 4. INITIAL COMPANY RESERVES
-- Clean initial state: 0 balance, ready for real fund allocations
-- ------------------------------------------------------------------------------
INSERT INTO public.company_reserves (
    id,
    type,
    name,
    description,
    current_balance,
    target_amount,
    monthly_allocation
)
VALUES
(
    '00000000-0000-4000-b000-000000000001',
    'emergency',
    'Emergency Reserve',
    'Buffer for 3 months of committed company expenses.',
    0.00,
    360000.00,
    20000.00
),
(
    '00000000-0000-4000-b000-000000000002',
    'operational',
    'Operational Reserve',
    'Buffer to smooth irregular client cash cycles.',
    0.00,
    100000.00,
    15000.00
),
(
    '00000000-0000-4000-b000-000000000003',
    'product_dev',
    'Product Development Reserve',
    'R&D capital for LeadX & Smart Review upgrades.',
    0.00,
    150000.00,
    10000.00
),
(
    '00000000-0000-4000-b000-000000000004',
    'tax',
    'Tax Reserve',
    'Ring-fenced GST collections & advance statutory tax.',
    0.00,
    75000.00,
    0.00
)
ON CONFLICT (type) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    target_amount = EXCLUDED.target_amount,
    monthly_allocation = EXCLUDED.monthly_allocation;

-- ------------------------------------------------------------------------------
-- 7. CLIENT LEADS (Aryan Bhore / Research Lead Pipeline & Founder Allocation)
-- ------------------------------------------------------------------------------
INSERT INTO public.client_leads (
    id,
    lead_number,
    client_name,
    contact_person,
    phone,
    product_type,
    deal_value,
    requirements,
    submitted_by,
    submitted_by_id,
    submitted_at,
    status,
    stage
)
VALUES
(
    'lead-seed-001',
    'LEAD-2026-001',
    'Apex Logistics India',
    'Rajesh Verma',
    '+91 98201 12345',
    'LeadX Platform',
    4999.00,
    'Real-time automated WhatsApp qualification bot and CRM integration for transport logistics.',
    'Aryan Bhore',
    '00000000-0000-4000-8000-000000000004',
    '2026-11-10T10:00:00Z',
    'submitted_to_founder',
    'lead_created'
),
(
    'lead-seed-002',
    'LEAD-2026-002',
    'Dr. Kulkarni Dental Clinic',
    'Dr. Sneha Kulkarni',
    '+91 98450 67890',
    'Smart Review Management',
    4999.00,
    'Google Business Profile NFC smart review tap stand and automated 5-star filter review portal.',
    'Aryan Bhore',
    '00000000-0000-4000-8000-000000000004',
    '2026-11-11T14:30:00Z',
    'submitted_to_founder',
    'lead_created'
)
ON CONFLICT (id) DO UPDATE SET
    client_name = EXCLUDED.client_name,
    deal_value = EXCLUDED.deal_value,
    status = EXCLUDED.status;


