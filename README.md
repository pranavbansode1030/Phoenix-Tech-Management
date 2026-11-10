# Phoenix Tech Solutions — Corporate ERP & Internal Finance Portal

<div align="center">
  <img src="logo-full-black.png" alt="Phoenix Tech Solutions Logo" width="220" />
  <p>
    <strong>Enterprise Financial Governance, Lead-to-Delivery Pipeline & Role-Based Team Portal</strong><br/>
    Engineered for <strong>Phoenix Tech Solutions Private Limited</strong>
  </p>
</div>

---

## Overview

**Phoenix Tech Solutions Management System** is an integrated corporate finance ledger, project operations hub, and role-based team portal built with a clean Deep Emerald (`#026047`) & Warm Ivory (`#fffde8`) design system.

It unifies company financial solvency, real-time expense/inflow governance, **One-in-One Project P&L Analytics**, and a multi-stage **Client Lead-to-Delivery Pipeline** backed by **Supabase PostgreSQL**.

---

## Core Architecture & Features

### 1. Role-Based Security & Database Authentication
* **Always-First Login Gateway**: Opens directly to the **Member Sign In** portal (`#login-portal-screen`) with strict role isolation before revealing workspace views.
* **Live Supabase `public.users` Verification**: Authenticates credentials dynamically against the Supabase `public.users` table (matching `member_id`, `email`, or `name`) with Supabase Auth and offline PIN fallback support.
* **One-Click Role Switching & Sign Out**: Supports fast role switching for testing alongside a topbar **`Sign Out`** control (`logoutUser()`).
* **Hardened Security Gates**:
  * Executive tabs (`Dashboard Overview`, `Approvals`, `Assign Projects`, `Financial Summary`) are strictly restricted to the **Founder & Director**.
  * Expense approvals, rejections, reversals, project creation, lead allocation, and final delivery approvals enforce explicit authorization checks.
  * Input sanitization via `escapeHtml()` protects dynamic UI templates against HTML/XSS injection.

### 2. Team Structure & Role Matrix

| Member ID | Team Member | Role / Designation | Scope & Responsibilities |
| :--- | :--- | :--- | :--- |
| `PB-01` | **Pranav Bansode** | Founder & Director | Business strategy, financial governance, sole signatory approvals, lead allocation & final delivery sign-off |
| `AS-02` | **Arshad Shaikh** | Co-Founder (Marketing & Planning) | Client coordination, marketing management, commercial packaging & deal alignment verification |
| `VG-03` | **Vivek Gajdhane** | Technical Department (Architecture) | Frontend/backend engineering, technical architecture, product builds & deliverable submission |
| `AB-04` | **Aryan Bhore** | Research Lead | Market research, B2B client scouting, lead qualification & pipeline entry |

### 3. End-to-End Lead-to-Delivery Pipeline
A dedicated 5-stage operational workflow connecting scouting, engineering, marketing verification, and executive approval:

```text
[1. Research Lead: Aryan]  ──► Finds & logs prospective client leads
           │
           ▼
[2. Founder: Pranav]       ──► Reviews lead & allocates engineering task to Vivek
           │
           ▼
[3. Tech Dept: Vivek]      ──► Completes build & forwards to Arshad (notifies Founder)
           │
           ▼
[4. Co-Founder: Arshad]    ──► Verifies commercial packaging & client alignment
           │
           ▼
[5. Founder: Pranav]       ──► Grants final delivery sign-off & enrolls revenue
```

### 4. One-in-One Projects & Financial Controls
* **Projects Hub (`3. Projects`)**: Unified view for **LeadX** (`PRJ-LEADX`) and **Smart Review Management** (`PRJ-SRM`), featuring quick **`📊 View Financials`** pills (`viewProjectFinance()`) to inspect per-project revenue inflows, direct costs, net profit margins, and contractual profit share allocations without cluttering navigation.
* **Dashboard Overview (`1. Dashboard Overview`)**: Real-time calculation of Verified Money Received, Approved Business Expenses, Available Company Cash, Pending Invoices, and Solvency metrics.
* **Founder Approval Queue (`2. Approval`)**: Single-row executive approvals for pending client inflows, employee expense outflows, and delivery milestones.
* **Expense Management (`6. Expense Management`)**: Project-linked expense tracking with approval status and audit-logged reversals (`reverseExpense()`).
* **Financial Summary (`7. Financial Summary`)**: Monthly P&L breakdown, reserve tracking, and one-click CSV / Print exports.

---

## Tech Stack

* **Frontend**: HTML5, Tailwind CSS (CDN + Dark/Light mode), Vanilla JavaScript (`app.js`), Inter Typography
* **Backend & Auth**: Supabase (`@supabase/supabase-js`), PostgreSQL Schema & Row-Level Security (RLS) migrations
* **Local Hosting**: Zero-dependency PowerShell `.NET HttpListener` server (`serve.ps1`) & optional Vite/TypeScript scaffolding (`package.json`, `src/`)

---

## Project Structure

```text
Phoenix.tech/
├── index.html                        # Primary application portal & login gateway
├── app.js                            # Core state, RBAC security gates, rendering & Supabase sync
├── supabaseClient.js                 # Browser Supabase client wrapper & RPC helpers
├── serve.ps1                         # Zero-dependency local HTTP server (port 5500 / 8080)
├── schema.sql                        # Consolidated PostgreSQL schema & security definitions
├── seed.sql                          # Initial team, project & seed data
├── package.json                      # Project metadata & Vite/React dependencies
├── vite.config.ts                    # Vite configuration
├── tsconfig.json                     # TypeScript configuration
├── .env.example                      # Template for Supabase & PostgreSQL environment variables
├── src/
│   ├── lib/
│   │   ├── calculations.ts           # Financial metrics & profit-sharing formulas
│   │   ├── formatters.ts             # INR currency & date formatting helpers
│   │   └── supabaseClient.ts         # Typed Supabase client helper
│   └── types/
│       └── finance.types.ts          # TypeScript interfaces for ledgers & roles
└── supabase/
    ├── schema.sql                    # Supabase SQL schema copy
    ├── seed.sql                      # Supabase seed data copy
    └── migrations/
        ├── 20261102000001_initial_schema.sql
        ├── 20261102000002_rls_policies.sql
        └── 20261109000003_create_users_table.sql
```

---

## Getting Started

### Option 1: Instant Local Hosting (Windows PowerShell)
Serve the complete portal locally with proper MIME types and no build step required:

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 5500
```
Then open **[http://localhost:5500/](http://localhost:5500/)** in your browser. *(Automatically falls back to port `8080` if `5500` is busy.)*

### Option 2: Database Setup (Supabase)
1. Copy `.env.example` to `.env` and fill in your Supabase project URL and keys *(never commit `.env`)*.
2. Execute `schema.sql` (or apply the SQL files in `supabase/migrations/` in chronological order) inside your Supabase SQL Editor.
3. Run `seed.sql` to populate initial team profiles (`PB-01`, `AS-02`, `VG-03`, `AB-04`) and core products (**LeadX** & **Smart Review Management**).

---

## Security Best Practices
* `.gitignore` excludes `.env`, `.env.local`, `node_modules/`, and OS artifacts so sensitive `SUPABASE_SERVICE_ROLE_KEY` and PostgreSQL connection strings are never committed.
* Only the public `anon` key is used in browser code, paired with Supabase Row-Level Security (RLS) policies in `supabase/migrations/20261102000002_rls_policies.sql`.

---

## License
Proprietary & Confidential — **Phoenix Tech Solutions Private Limited** &copy; 2026.
