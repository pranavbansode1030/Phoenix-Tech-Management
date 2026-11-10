/**
 * Phoenix Tech Solution - Internal Finance Management System
 * Palette: #026047 (Deep Emerald) & #fffde8 (Warm Ivory)
 * Core Team:
 *   1. Pranav Bansode (Founder / Director)
 *   2. Arshad Shaikh (Co-Founder)
 *   3. Vivek Gajdhane (Technical Department)
 * Current Projects:
 *   1. LeadX
 *   2. Smart Review Management
 */

// ==============================================================================
// SUPABASE CLIENT & LIVE DATABASE SYNC
// ==============================================================================
const PHOENIX_SUPABASE_URL = 'https://mvdknbfisgrwewljqnxw.supabase.co';
const PHOENIX_SUPABASE_ANON = 'sb_publishable_W_QNdDR7wpYjgmZJQ_Bjsw_iS3TxZPA';

function getSupabaseClient() {
  if (window.PhoenixSupabase && typeof window.PhoenixSupabase.getClient === 'function') {
    const c = window.PhoenixSupabase.getClient();
    if (c) return c;
  }
  if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
    return window.supabase.createClient(PHOENIX_SUPABASE_URL, PHOENIX_SUPABASE_ANON);
  }
  return null;
}

const MEMBER_UUID_MAP = {
  'mem-01': '00000000-0000-4000-8000-000000000001',
  'mem-02': '00000000-0000-4000-8000-000000000002',
  'mem-03': '00000000-0000-4000-8000-000000000003',
  'mem-04': '00000000-0000-4000-8000-000000000004'
};
const UUID_MEMBER_MAP = {
  '00000000-0000-4000-8000-000000000001': 'mem-01',
  '00000000-0000-4000-8000-000000000002': 'mem-02',
  '00000000-0000-4000-8000-000000000003': 'mem-03',
  '00000000-0000-4000-8000-000000000004': 'mem-04'
};

const PROJECT_UUID_MAP = {
  'prj-leadx': '00000000-0000-4000-a000-000000000001',
  'prj-srm': '00000000-0000-4000-a000-000000000002'
};
const UUID_PROJECT_MAP = {
  '00000000-0000-4000-a000-000000000001': 'prj-leadx',
  '00000000-0000-4000-a000-000000000002': 'prj-srm'
};

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
window.escapeHtml = escapeHtml;

function saveAssignedTasksToStorage() {
  try {
    localStorage.setItem('phoenix_assigned_tasks', JSON.stringify(STATE.assignedTasks || []));
  } catch (e) {
    console.warn('Storage save error:', e);
  }
}

function saveLeadsToStorage() {
  try {
    localStorage.setItem('phoenix_leads_pipeline', JSON.stringify(STATE.leads || []));
  } catch (e) {
    console.warn('Leads storage save error:', e);
  }
}

function loadLeadsFromStorage() {
  try {
    const raw = localStorage.getItem('phoenix_leads_pipeline');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Leads storage load error:', e);
  }
  return null;
}

function loadAssignedTasksFromStorage() {
  try {
    const stored = localStorage.getItem('phoenix_assigned_tasks');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        STATE.assignedTasks = parsed;
      }
    }
  } catch (e) {
    console.warn('Storage load error:', e);
  }
}

async function syncTasksFromSupabase() {
  loadAssignedTasksFromStorage();
  const sb = getSupabaseClient();
  if (!sb) return;
  try {
    const { data, error } = await sb
      .from('assigned_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch tasks error:', error.message);
      return;
    }

    if (data && data.length > 0) {
      STATE.assignedTasks = data.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        assignedTo: UUID_MEMBER_MAP[row.assigned_to] || 'mem-02',
        assignedToName: row.assigned_to === '00000000-0000-4000-8000-000000000002' ? 'Arshad Shaikh' : (row.assigned_to === '00000000-0000-4000-8000-000000000003' ? 'Vivek Gajdhane' : 'Team Member'),
        projectId: UUID_PROJECT_MAP[row.project_id] || 'general',
        projectName: row.project_id === '00000000-0000-4000-a000-000000000001' ? 'LeadX' : (row.project_id === '00000000-0000-4000-a000-000000000002' ? 'Smart Review Management' : 'General Operations'),
        priority: row.priority || 'medium',
        status: row.status || 'assigned',
        dueDate: row.due_date || '',
        assignedDate: (row.created_at || '').split('T')[0] || new Date().toISOString().split('T')[0],
        assignedBy: 'Pranav Bansode (Founder)',
        completedDate: row.completed_at ? row.completed_at.split('T')[0] : null
      }));
      saveAssignedTasksToStorage();

      if (STATE.currentTab === 'assign-projects') renderAssignProjects();
      if (STATE.currentTab === 'allocated-work') renderAllocatedWork();
      renderSidebarNav(STATE.currentTab);
    }
  } catch (err) {
    console.warn('Supabase sync error:', err);
  }
}

function formatINR(val, decimals = true) {
  if (isNaN(val) || val === null || val === undefined) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(val);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Master State
const STATE = {
  activeRole: 'pranav', // 'pranav' (Founder/Director) | 'arshad' (Co-Founder) | 'vivek' (Technical Department)
  currentTab: 'dashboard-overview',
  selectedEmployeeId: 'mem-01',
  dateFilter: 'current_month',
  theme: localStorage.getItem('phoenix_theme') || 'light',

  // 1. Team Members (Basic 10k - 15k Range)
  team: [
    {
      id: 'mem-01',
      name: 'Pranav Bansode',
      role: 'founder_director',
      designation: 'Founder / Director',
      responsibilities: [
        'Business strategy',
        'Finance management',
        'Final business decisions',
        'Financial approvals'
      ],
      monthlyCompensation: 0, // Founder draws against profits, not fixed salary
      pendingCompensation: 0,
      paymentsMade: 0,
      isFounder: true,
      drawingsYTD: 0,
    },
    {
      id: 'mem-02',
      name: 'Arshad Shaikh',
      role: 'co_founder',
      designation: 'Co-Founder',
      responsibilities: [
        'Scheduling meetings',
        'Marketing management',
        'Business idea research',
        'Digital business planning'
      ],
      monthlyCompensation: 15000,
      pendingCompensation: 0,
      paymentsMade: 0,
      isFounder: false,
      drawingsYTD: 0,
    },
    {
      id: 'mem-03',
      name: 'Vivek Gajdhane',
      role: 'technical',
      designation: 'Technical Department',
      responsibilities: [
        'Frontend development',
        'Backend development',
        'Technical implementation',
        'Product development'
      ],
      monthlyCompensation: 10000,
      pendingCompensation: 0,
      paymentsMade: 0,
      isFounder: false,
      drawingsYTD: 0,
    },
    {
      id: 'mem-04',
      name: 'Aryan Bhore',
      role: 'lead_acquisition',
      designation: 'Research Lead',
      responsibilities: [
        'Finding and scouting client leads',
        'Lead qualification & client intake',
        'Updating portal pipeline with prospect requirements',
        'Coordinating with Founder Pranav for technical allocation'
      ],
      monthlyCompensation: 12000,
      pendingCompensation: 0,
      paymentsMade: 0,
      isFounder: false,
      drawingsYTD: 0,
    }
  ],

  // 1B. Client Leads & 4-Step Delivery Pipeline
  // Step 1: Aryan captures lead -> sends to Pranav (Founder)
  // Step 2: Pranav allocates to Vivek (Tech)
  // Step 3: Vivek completes tech -> sends to Arshad (Notifies Founder Pranav)
  // Step 4: Founder Pranav finalizes & approves for delivery
  leads: loadLeadsFromStorage() || [
    {
      id: 'lead-01',
      leadNumber: 'LEAD-2026-001',
      clientName: 'Apex Health Clinic Chain',
      contactPerson: 'Dr. Ramesh Kulkarni',
      phone: '+91 98220 11223',
      email: 'ramesh@apexhealth.in',
      productType: 'Smart Review Management',
      dealValue: 125000,
      requirements: 'Automated Google review interception funnel for 3 dental branches, QR standees, WhatsApp sentiment routing.',
      source: 'Direct Business Outreach',
      submittedBy: 'Aryan Bhore',
      submittedByMemberId: 'mem-04',
      submittedAt: '2026-11-09',
      stage: 'allocated_to_vivek', // 'submitted_to_founder', 'allocated_to_vivek', 'sent_to_arshad_notified_founder', 'approved_for_delivery'
      founderNotes: 'Vivek, please set up the review interceptor backend, database schema and QR redirect links by Friday.',
      allocatedTo: 'mem-03',
      allocatedAt: '2026-11-09',
      techNotes: '',
      techDeliverableUrl: '',
      techCompletedAt: null,
      arshadNotes: '',
      finalDeliveryApprovedAt: null
    },
    {
      id: 'lead-02',
      leadNumber: 'LEAD-2026-002',
      clientName: 'Metropolis Gym & Fitness',
      contactPerson: 'Vikram Shinde',
      phone: '+91 99700 44556',
      email: 'vikram@metropolisgym.com',
      productType: 'LeadX',
      dealValue: 85000,
      requirements: 'B2B automated lead capture engine for corporate annual gym memberships & WhatsApp lead followups.',
      source: 'B2B Cold Prospecting',
      submittedBy: 'Aryan Bhore',
      submittedByMemberId: 'mem-04',
      submittedAt: '2026-11-09',
      stage: 'submitted_to_founder',
      founderNotes: '',
      allocatedTo: null,
      allocatedAt: null,
      techNotes: '',
      techDeliverableUrl: '',
      techCompletedAt: null,
      arshadNotes: '',
      finalDeliveryApprovedAt: null
    }
  ],

  // 2. Initial Projects (Strictly LeadX & Smart Review Management)
  projects: [
    {
      id: 'prj-leadx',
      code: 'PRJ-LEADX',
      name: 'LeadX',
      description: 'B2B client acquisition, automated lead capture and outreach pipeline platform.',
      status: 'active',
      revenueReceived: 0,
      directExpenses: 0,
      allocatedOverhead: 0,
      incentivePercentage: 10.0,
      assignedMembers: ['mem-01', 'mem-02', 'mem-03'],
      membersAllocation: [
        { memberId: 'mem-01', name: 'Pranav Bansode', share: 30.0 },
        { memberId: 'mem-02', name: 'Arshad Shaikh', share: 40.0 },
        { memberId: 'mem-03', name: 'Vivek Gajdhane', share: 30.0 },
      ],
      createdAt: '2026-06-01',
    },
    {
      id: 'prj-srm',
      code: 'PRJ-SRM',
      name: 'Smart Review Management',
      description: 'Customer sentiment intelligence and private feedback interception funnel.',
      status: 'active',
      revenueReceived: 0,
      directExpenses: 0,
      allocatedOverhead: 0,
      incentivePercentage: 10.0,
      assignedMembers: ['mem-01', 'mem-02', 'mem-03'],
      membersAllocation: [
        { memberId: 'mem-01', name: 'Pranav Bansode', share: 25.0 },
        { memberId: 'mem-02', name: 'Arshad Shaikh', share: 35.0 },
        { memberId: 'mem-03', name: 'Vivek Gajdhane', share: 40.0 },
      ],
      createdAt: '2026-07-15',
    }
  ],

  // 3. Income Records (Direct Client Inflows - Initialized Clean for Genuine Entries)
  income: [],

  // 4. Expense Records (Direct Project Costs - Initialized Clean for Genuine Entries)
  expenses: [],

  // 5. Company Reserves (Genuine corporate reserve structures)
  reserves: [
    {
      id: 'res-01',
      type: 'emergency',
      name: 'Emergency Reserve',
      description: '3 months of fixed operating overhead.',
      currentBalance: 0,
      targetAmount: 360000,
      monthlyAllocation: 0,
    },
    {
      id: 'res-02',
      type: 'operational',
      name: 'Operational Reserve',
      description: 'Buffer to smooth irregular client cash receipt cycles.',
      currentBalance: 0,
      targetAmount: 100000,
      monthlyAllocation: 0,
    },
    {
      id: 'res-03',
      type: 'product_dev',
      name: 'Product Development Reserve',
      description: 'R&D capital for LeadX and Smart Review enhancements.',
      currentBalance: 0,
      targetAmount: 150000,
      monthlyAllocation: 0,
    },
    {
      id: 'res-04',
      type: 'tax',
      name: 'Tax & Statutory Reserve',
      description: 'Corporate statutory tax & reserve fund.',
      currentBalance: 0,
      targetAmount: 75000,
      monthlyAllocation: 0,
    }
  ],

  // 6. Project Profit Sharing & Incentives
  incentives: [],

  // 7. Founder Drawings (Recorded by Founder, separate from salaries)
  drawings: [],

  // 8. Individual Employee Compensation Payouts (Recorded by Founder)
  payouts: [],

  // 9. Audit Logs
  auditLogs: [
    {
      id: 'log-01',
      action: 'SYSTEM_INIT',
      details: 'Phoenix Finance Management System clean slate initialized for genuine entries.',
      performedBy: 'Pranav Bansode',
      date: '2026-11-05 17:45',
    }
  ],

  // 10. Assigned Projects & Deliverable Tasks (Clean slate ready for genuine task allocation)
  assignedTasks: []
};

// Calculations Engine
function calculateMetrics() {
  // Received Money (Directly from Income Tab - only actual received cash)
  const receivedRecords = STATE.income.filter((i) => i.status === 'received');
  const totalMoneyReceived = receivedRecords.reduce((sum, i) => sum + i.amount, 0);

  // Pending client payments (awaiting clearance or Founder approval)
  const pendingRecords = STATE.income.filter(
    (i) => i.status === 'pending' || i.status === 'pending_approval'
  );
  const pendingClientPayments = pendingRecords.reduce((sum, i) => sum + i.amount, 0);

  // Approved Expenses (Pure amount without GST)
  const approvedExpenses = STATE.expenses.filter((e) => e.status === 'approved');
  const totalBusinessExpenses = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Salaries paid
  const teamSalariesPaid = STATE.team.reduce((sum, m) => sum + (m.paymentsMade || 0), 0);

  // Founder Drawings
  const founderDrawingsTotal = STATE.drawings.reduce((sum, d) => sum + d.amount, 0);

  // Reserves Earmarked
  const totalCompanyReserves = STATE.reserves.reduce((sum, r) => sum + r.currentBalance, 0);

  // Net Business Profit
  const netBusinessProfit = totalMoneyReceived - totalBusinessExpenses;

  // Available Company Cash (Directly connected to Income Tab received inflows)
  // Available Cash = Total Income Received - Approved Expenses - Founder Drawings
  const rawCashInBank = totalMoneyReceived;
  const totalOutflows = totalBusinessExpenses + founderDrawingsTotal;
  const availableCompanyCash = Math.max(0, rawCashInBank - totalOutflows);

  return {
    totalMoneyReceived,
    pendingClientPayments,
    totalBusinessExpenses,
    totalCompanyReserves,
    availableCompanyCash,
    netBusinessProfit,
  };
}

// Interconnected Project Calculation Helper
function getProjectFinancials(projectId) {
  const received = STATE.income
    .filter((i) => i.projectId === projectId && i.status === 'received')
    .reduce((sum, i) => sum + i.amount, 0);

  const pending = STATE.income
    .filter((i) => i.projectId === projectId && (i.status === 'pending' || i.status === 'pending_approval'))
    .reduce((sum, i) => sum + i.amount, 0);

  const expenses = STATE.expenses
    .filter((e) => e.projectId === projectId && e.status === 'approved')
    .reduce((sum, e) => sum + e.amount, 0);

  const net = received - expenses;

  return { received, pending, expenses, net };
}

// Dynamic Project Dropdowns Sync (Interconnects Projects -> Income & Expense forms)
function updateProjectSelectOptions() {
  const incSel = document.getElementById('inc-project');
  const expSel = document.getElementById('exp-project');

  if (incSel) {
    incSel.innerHTML = STATE.projects
      .map((p) => `<option value="${p.id}">${p.name} (${p.code})</option>`)
      .join('');
  }

  if (expSel) {
    expSel.innerHTML = `
      ${STATE.projects.map((p) => `<option value="${p.id}">${p.name} (${p.code})</option>`).join('')}
      <option value="">General Company (Overhead)</option>
    `;
  }
}

// UI Initialization & Authentication Gate
document.addEventListener('DOMContentLoaded', () => {
  setupTheme();
  setupNavigation();
  setupRoleSwitcher();
  setupDateFilter();
  updateProjectSelectOptions();
  syncTasksFromSupabase();

  // Ensure Login Portal screen is presented first on page load
  const urlParams = new URLSearchParams(window.location.search);
  const allowAutoLogin = urlParams.get('autologin') === 'true';
  const sessionUser = allowAutoLogin ? sessionStorage.getItem('phoenix_session_user') : null;

  if (
    sessionUser &&
    (sessionUser === 'pranav' || sessionUser === 'arshad' || sessionUser === 'vivek' || sessionUser === 'aryan')
  ) {
    loginAsUser(sessionUser, false);
  } else {
    // Show login page by default so user can sign in with any account
    const portal = document.getElementById('login-portal-screen');
    const app = document.getElementById('app-workspace');
    if (portal) portal.classList.remove('hidden');
    if (app) app.classList.add('hidden');
  }
});

function setupTheme() {
  if (STATE.theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

window.toggleTheme = function () {
  STATE.theme = STATE.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('phoenix_theme', STATE.theme);
  setupTheme();
};

function setupNavigation() {
  renderSidebarNav(STATE.currentTab);
}

function renderSidebarNav(activeTab) {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;

  const currentRole = STATE.activeRole || 'pranav';
  activeTab = normalizeTabId(activeTab || STATE.currentTab || (currentRole === 'pranav' ? 'dashboard-overview' : 'employee-dashboard'));

  // Calculate live counters for pending items
  const pendingInflowsCount = (STATE.income || []).filter((i) => i.status === 'pending' || i.status === 'pending_approval').length;
  const pendingExpensesCount = (STATE.expenses || []).filter((e) => e.status === 'pending_approval').length;
  const pendingPayoutsCount = (STATE.team || []).filter((m) => (m.pendingCompensation || 0) > 0).length;
  const pendingTasksCount = (STATE.assignedTasks || []).filter((t) => t.status === 'review_pending').length;
  const totalPendingApprovals = pendingInflowsCount + pendingExpensesCount + pendingPayoutsCount + pendingTasksCount;

  const currentMemberId = currentRole === 'arshad' ? 'mem-02' : (currentRole === 'aryan' ? 'mem-04' : 'mem-03');
  const myAssignedTasksCount = (STATE.assignedTasks || []).filter((t) => t.assignedTo === currentMemberId && t.status !== 'completed').length;

  if (currentRole === 'pranav') {
    // Founder: Full executive options organized logically
    nav.innerHTML = `
      <!-- Section: Executive Governance -->
      <div class="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#fffde8]/60 flex items-center gap-1.5">
        <span>🏛️</span> Executive Governance
      </div>

      <button data-nav="dashboard-overview" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${activeTab === 'dashboard-overview' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
        <div class="flex-1 min-w-0">
          <div class="truncate font-black">1. Dashboard Overview</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Finances, Inflows & Solvency</div>
        </div>
      </button>

      <button data-nav="approvals" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${activeTab === 'approvals' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">👑</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-black flex items-center justify-between">
            <span>2. Approval</span>
            <span class="px-1.5 py-0.5 rounded-full text-[9px] font-black ${totalPendingApprovals > 0 ? 'bg-amber-400 text-slate-900 animate-pulse' : 'bg-white/20 text-white'}">${totalPendingApprovals}</span>
          </div>
          <div class="text-[9px] opacity-75 truncate font-normal">One-row Founder approvals</div>
        </div>
      </button>

      <!-- Section: Products & Operations -->
      <div class="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#fffde8]/60 flex items-center gap-1.5 border-t border-[#024d39]/80 mt-1">
        <span>🚀</span> Products & Operations
      </div>

      <button data-nav="projects" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${activeTab === 'projects' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">3. Projects</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Products, Scopes & Live Financials</div>
        </div>
      </button>

      <button data-nav="assign-projects" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${activeTab === 'assign-projects' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">📌</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">4. Assign Projects</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Share work with employees</div>
        </div>
      </button>

      <button data-nav="sales-done" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${activeTab === 'sales-done' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">5. Sales Done</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Product Sales & Deals Done</div>
        </div>
      </button>

      <!-- Section: Financial Controls -->
      <div class="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#fffde8]/60 flex items-center gap-1.5 border-t border-[#024d39]/80 mt-1">
        <span>💼</span> Financial Controls
      </div>

      <button data-nav="expense-management" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${activeTab === 'expense-management' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">6. Expense Management</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Director Approvals & Outflows</div>
        </div>
      </button>

      <button data-nav="financial-summary" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${activeTab === 'financial-summary' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">7. Financial Summary</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Monthly Performance & P&L</div>
        </div>
      </button>
    `;
  } else if (currentRole === 'arshad') {
    // Arshad: Marketing Workspace with Allocated Work
    nav.innerHTML = `
      <!-- Section: Personal Hub -->
      <div class="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#fffde8]/60 flex items-center gap-1.5">
        <span>💼</span> Personal Workspace
      </div>

      <button data-nav="employee-dashboard" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${activeTab === 'employee-dashboard' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">💼</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-black">1. My Workspace & Comp</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Compensation & B2B Deliverables</div>
        </div>
      </button>

      <button data-nav="allocated-work" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${activeTab === 'allocated-work' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">📌</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-black flex items-center justify-between">
            <span>2. Allocated Work</span>
            <span class="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white/20 text-white">${myAssignedTasksCount}</span>
          </div>
          <div class="text-[9px] opacity-75 truncate font-normal">Tasks assigned by Founder</div>
        </div>
      </button>

      <!-- Section: Marketing & Deals -->
      <div class="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#fffde8]/60 flex items-center gap-1.5 border-t border-[#024d39]/80 mt-1">
        <span>📈</span> Marketing & Commercial
      </div>

      <button data-nav="projects" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${activeTab === 'projects' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">📁</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">3. Marketing Projects</div>
          <div class="text-[9px] opacity-75 truncate font-normal">LeadX & Smart Review Scopes</div>
        </div>
      </button>

      <button data-nav="expense-management" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${activeTab === 'expense-management' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">💳</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">4. My Submitted Expenses</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Marketing Outflows & Status</div>
        </div>
      </button>

      <button onclick="openNewIncomeModal()" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-[#fffde8] font-bold transition-all text-left border border-[#fffde8]/20 mt-2">
        <span class="text-sm">📥</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">+ Enroll Client Deal</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Submit for Founder Approval</div>
        </div>
      </button>
    `;
  } else if (currentRole === 'aryan') {
    // Aryan: Lead Acquisition & Business Development (same UI structure as Vivek)
    const myLeadsCount = (STATE.leads || []).length;
    nav.innerHTML = `
      <!-- Section: Personal Hub -->
      <div class="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#fffde8]/60 flex items-center gap-1.5">
        <span>🎯</span> Personal Workspace
      </div>

      <button data-nav="employee-dashboard" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${activeTab === 'employee-dashboard' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">🎯</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-black">1. My Workspace & Leads</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Compensation & Lead Queue</div>
        </div>
      </button>

      <button data-nav="allocated-work" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${activeTab === 'allocated-work' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">📌</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-black flex items-center justify-between">
            <span>2. Lead Pipeline & Work</span>
            <span class="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white/20 text-white">${myLeadsCount}</span>
          </div>
          <div class="text-[9px] opacity-75 truncate font-normal">Active Deals & Founder Route</div>
        </div>
      </button>

      <!-- Section: Products & Scout Expenses -->
      <div class="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#fffde8]/60 flex items-center gap-1.5 border-t border-[#024d39]/80 mt-1">
        <span>📁</span> Products & Scout Expenses
      </div>

      <button data-nav="projects" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${activeTab === 'projects' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">📁</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">3. Client Solutions</div>
          <div class="text-[9px] opacity-75 truncate font-normal">LeadX & Smart Review Scopes</div>
        </div>
      </button>

      <button data-nav="expense-management" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${activeTab === 'expense-management' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">💳</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">4. Scout Expenses</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Outreach & Prospecting Costs</div>
        </div>
      </button>

      <button onclick="openNewLeadModal()" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-[#fffde8] font-bold transition-all text-left border border-[#fffde8]/20 mt-2 shadow-sm cursor-pointer">
        <span class="text-sm">⚡</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">+ Submit Client Lead</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Direct Route to Founder Pranav</div>
        </div>
      </button>
    `;
  } else {
    // Vivek: Engineering Workspace with Allocated Work
    nav.innerHTML = `
      <!-- Section: Personal Hub -->
      <div class="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#fffde8]/60 flex items-center gap-1.5">
        <span>💻</span> Personal Workspace
      </div>

      <button data-nav="employee-dashboard" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${activeTab === 'employee-dashboard' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">💻</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-black">1. My Workspace & Comp</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Compensation & Tech Deliverables</div>
        </div>
      </button>

      <button data-nav="allocated-work" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${activeTab === 'allocated-work' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">📌</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-black flex items-center justify-between">
            <span>2. Allocated Work</span>
            <span class="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white/20 text-white">${myAssignedTasksCount}</span>
          </div>
          <div class="text-[9px] opacity-75 truncate font-normal">Tasks assigned by Founder</div>
        </div>
      </button>

      <!-- Section: Engineering & Systems -->
      <div class="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#fffde8]/60 flex items-center gap-1.5 border-t border-[#024d39]/80 mt-1">
        <span>🛠 ï¸</span> Tech & Infrastructure
      </div>

      <button data-nav="projects" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${activeTab === 'projects' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">📁</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">3. Engineering Projects</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Architecture & Systems Stack</div>
        </div>
      </button>

      <button data-nav="expense-management" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${activeTab === 'expense-management' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">💳</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">4. Infrastructure Expenses</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Cloud, Server & Tooling Costs</div>
        </div>
      </button>
    `;
  }

  // Bind click listeners to dynamically rendered navigation buttons
  nav.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-nav');
      switchTab(target);
    });
  });
}

function switchTab(tabId, subView = null) {
  if (tabId === 'project-finance') {
    STATE.projectSubView = 'finance';
    tabId = 'projects';
  } else if (tabId === 'projects' && subView) {
    STATE.projectSubView = subView;
  }
  let normalized = normalizeTabId(tabId);

  // Security Gate: Non-founders cannot access executive financial tabs
  if (
    STATE.activeRole &&
    STATE.activeRole !== 'pranav' &&
    (normalized === 'dashboard-overview' ||
      normalized === 'founder-dashboard' ||
      normalized === 'approvals' ||
      normalized === 'assign-projects' ||
      normalized === 'project-finance' ||
      normalized === 'financial-summary')
  ) {
    showToast('Confidential Section: Executive controls are reserved for Founder & Director Pranav Bansode.');
    normalized = 'allocated-work';
  }

  // Founder shouldn't land on employee-specific allocated work view
  if (STATE.activeRole === 'pranav' && normalized === 'allocated-work') {
    normalized = 'assign-projects';
  }

  STATE.currentTab = normalized;
  renderSidebarNav(normalized);

  document.querySelectorAll('.tab-view').forEach((v) => v.classList.add('hidden'));
  let targetView = document.getElementById(`view-${normalized}`);
  if (!targetView && normalized === 'dashboard-overview') {
    targetView = document.getElementById('view-founder-dashboard');
  }
  if (targetView) targetView.classList.remove('hidden');

  renderCurrentTab();
}

window.toggleRoleMenu = function (e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('role-menu-dropdown');
  if (dropdown) dropdown.classList.toggle('hidden');
};

window.selectActiveRole = function (role) {
  STATE.activeRole = role;
  const dropdown = document.getElementById('role-menu-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
  updateRoleDisplay();
  renderCurrentTab();
  showToast(
    role === 'pranav'
      ? 'Executive Mode: Pranav Bansode (Founder & Director) • Full Authority'
      : `Switched View: ${role === 'arshad' ? 'Arshad Shaikh (Co-Founder)' : (role === 'aryan' ? 'Aryan Bhore (Research Lead)' : 'Vivek Gajdhane (Technical Dept)')}`
  );
};

function setupRoleSwitcher() {
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('role-menu-dropdown');
    const btn = document.getElementById('role-menu-button');
    if (dropdown && !dropdown.classList.contains('hidden')) {
      if (!dropdown.contains(e.target) && (!btn || !btn.contains(e.target))) {
        dropdown.classList.add('hidden');
      }
    }
  });

  updateRoleDisplay();
}

function updateRoleDisplay() {
  const nameEl = document.getElementById('founder-name');
  const avatarText = document.getElementById('founder-avatar-text');
  const crownBadge = document.getElementById('founder-crown-badge');
  const desigBadge = document.getElementById('founder-designation-badge');
  const authBox = document.getElementById('founder-authority-box');
  const currentRoleLabel = document.getElementById('current-role-label');
  const topbarPill = document.getElementById('topbar-founder-pill');

  // Topbar quick action buttons
  const btnCsv = document.getElementById('btn-topbar-csv');
  const btnIncome = document.getElementById('btn-topbar-income');
  const btnExpense = document.getElementById('btn-topbar-expense');

  if (STATE.activeRole === 'pranav') {
    if (nameEl) nameEl.textContent = 'Pranav Bansode';
    if (avatarText) avatarText.textContent = 'PB';
    if (crownBadge) {
      crownBadge.textContent = '👑';
      crownBadge.className = 'absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#fffde8] text-[#026047] flex items-center justify-center text-[10px] font-bold shadow ring-1 ring-[#026047]';
    }
    if (desigBadge) {
      desigBadge.innerHTML = '<span>👑</span> FOUNDER & DIRECTOR';
      desigBadge.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#fffde8] text-[#026047] shadow-sm';
    }
    if (authBox) {
      authBox.innerHTML = `
        <div class="flex items-center justify-between text-[#fffde8] font-bold">
          <span class="opacity-75 text-[9px] uppercase tracking-wider">Executive Authority</span>
          <span class="flex items-center gap-1 text-[9px] text-emerald-300">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Sole Signatory
          </span>
        </div>
        <p class="text-[10px] text-[#fffde8]/80 leading-tight">
          Strategic Direction • Inflow Approvals • Financial Governance
        </p>
      `;
    }
    if (currentRoleLabel) currentRoleLabel.innerHTML = '👑 Founder / Director';
    if (topbarPill) {
      topbarPill.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-[#026047] dark:bg-emerald-400 animate-pulse"></span>
        <span class="font-extrabold text-[#026047] dark:text-emerald-300">Pranav Bansode</span>
        <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#026047] text-[#fffde8]">👑 Founder / Director</span>
      `;
    }
    if (btnCsv) btnCsv.classList.remove('hidden');
    if (btnIncome) {
      btnIncome.classList.remove('hidden');
      btnIncome.textContent = '+ Income';
    }
    if (btnExpense) btnExpense.classList.remove('hidden');

  } else if (STATE.activeRole === 'arshad') {
    if (nameEl) nameEl.textContent = 'Arshad Shaikh';
    if (avatarText) avatarText.textContent = 'AS';
    if (crownBadge) {
      crownBadge.textContent = '🤝';
      crownBadge.className = 'absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold shadow ring-1 ring-blue-300';
    }
    if (desigBadge) {
      desigBadge.innerHTML = 'CO-FOUNDER';
      desigBadge.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#fffde8]/20 text-[#fffde8] border border-[#fffde8]/40';
    }
    if (authBox) {
      authBox.innerHTML = `
        <div class="flex items-center justify-between text-[#fffde8] font-bold">
          <span class="opacity-75 text-[9px] uppercase tracking-wider">Departmental Scope</span>
          <span class="text-[9px] text-blue-300">Business Planning</span>
        </div>
        <p class="text-[10px] text-[#fffde8]/80 leading-tight">
          Marketing, Business Expansion & Pipeline Development
        </p>
      `;
    }
    if (currentRoleLabel) currentRoleLabel.innerHTML = '🤝 Co-Founder';
    if (topbarPill) {
      topbarPill.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        <span class="font-extrabold text-blue-700 dark:text-blue-300">Arshad Shaikh</span>
        <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">🤝 Co-Founder</span>
      `;
    }
    if (btnCsv) btnCsv.classList.add('hidden');
    if (btnIncome) {
      btnIncome.classList.remove('hidden');
      btnIncome.textContent = '+ Enroll Deal';
    }
    if (btnExpense) btnExpense.classList.remove('hidden');

  } else if (STATE.activeRole === 'aryan') {
    if (nameEl) nameEl.textContent = 'Aryan Bhore';
    if (avatarText) avatarText.textContent = 'AB';
    if (crownBadge) {
      crownBadge.textContent = '🎯';
      crownBadge.className = 'absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shadow ring-1 ring-emerald-300';
    }
    if (desigBadge) {
      desigBadge.innerHTML = 'RESEARCH LEAD';
      desigBadge.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#fffde8]/20 text-[#fffde8] border border-[#fffde8]/40';
    }
    if (authBox) {
      authBox.innerHTML = `
        <div class="flex items-center justify-between text-[#fffde8] font-bold">
          <span class="opacity-75 text-[9px] uppercase tracking-wider">Departmental Scope</span>
          <span class="text-[9px] text-emerald-300">Research Lead</span>
        </div>
        <p class="text-[10px] text-[#fffde8]/80 leading-tight">
          Market Research, Client Prospecting & Pipeline Strategy
        </p>
      `;
    }
    if (currentRoleLabel) currentRoleLabel.innerHTML = '🎯 Research Lead';
    if (topbarPill) {
      topbarPill.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="font-extrabold text-emerald-700 dark:text-emerald-300">Aryan Bhore</span>
        <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">🎯 Research Lead</span>
      `;
    }
    if (btnCsv) btnCsv.classList.add('hidden');
    if (btnIncome) {
      btnIncome.classList.remove('hidden');
      btnIncome.textContent = '+ Submit Lead';
      btnIncome.onclick = openNewLeadModal;
    }
    if (btnExpense) btnExpense.classList.remove('hidden');

  } else {
    if (nameEl) nameEl.textContent = 'Vivek Gajdhane';
    if (avatarText) avatarText.textContent = 'VG';
    if (crownBadge) {
      crownBadge.textContent = '💻';
      crownBadge.className = 'absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px] font-bold shadow ring-1 ring-purple-300';
    }
    if (desigBadge) {
      desigBadge.innerHTML = 'TECHNICAL DEPT';
      desigBadge.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#fffde8]/20 text-[#fffde8] border border-[#fffde8]/40';
    }
    if (authBox) {
      authBox.innerHTML = `
        <div class="flex items-center justify-between text-[#fffde8] font-bold">
          <span class="opacity-75 text-[9px] uppercase tracking-wider">Departmental Scope</span>
          <span class="text-[9px] text-purple-300">Technical Lead</span>
        </div>
        <p class="text-[10px] text-[#fffde8]/80 leading-tight">
          Product Architecture, Technical Delivery & Cloud Infrastructure
        </p>
      `;
    }
    if (currentRoleLabel) currentRoleLabel.innerHTML = '💻 Technical Dept';
    if (topbarPill) {
      topbarPill.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
        <span class="font-extrabold text-purple-700 dark:text-purple-300">Vivek Gajdhane</span>
        <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">💻 Technical Dept</span>
      `;
    }
    if (btnCsv) btnCsv.classList.add('hidden');
    if (btnIncome) btnIncome.classList.add('hidden');
    if (btnExpense) btnExpense.classList.remove('hidden');
  }

  renderSidebarNav(STATE.currentTab);
}

function setupDateFilter() {
  const filter = document.getElementById('date-filter');
  if (filter) {
    filter.addEventListener('change', (e) => {
      STATE.dateFilter = e.target.value;
      renderCurrentTab();
      showToast(`Filter applied: ${e.target.options[e.target.selectedIndex].text}`);
    });
  }
}

function normalizeTabId(tabId) {
  if (
    !tabId ||
    tabId === 'dashboard' ||
    tabId === 'founder-dashboard' ||
    tabId === 'dashboard-overview'
  )
    return 'dashboard-overview';
  if (tabId === 'approvals' || tabId === 'approval') return 'approvals';
  if (tabId === 'assign-projects' || tabId === 'assigned-projects') return 'assign-projects';
  if (tabId === 'sales-done' || tabId === 'sales' || tabId === 'sales-ledger') return 'sales-done';
  if (tabId === 'allocated-work' || tabId === 'allocated-projects') return 'allocated-work';
  if (tabId === 'team' || tabId === 'profit-sharing' || tabId === 'employee-dashboard')
    return 'employee-dashboard';
  if (tabId === 'projects' || tabId === 'project-management') return 'projects';
  if (tabId === 'project-finance') {
    STATE.projectSubView = 'finance';
    return 'projects';
  }
  if (tabId === 'expenses' || tabId === 'expense-management') return 'expense-management';
  if (tabId === 'reports' || tabId === 'reserves' || tabId === 'financial-summary')
    return 'financial-summary';
  return tabId;
}

function renderCurrentTab() {
  const activeTab = normalizeTabId(STATE.currentTab);
  switch (activeTab) {
    case 'dashboard-overview':
    case 'founder-dashboard':
      renderDashboardOverview();
      break;
    case 'approvals':
      renderApprovals();
      break;
    case 'assign-projects':
      renderAssignProjects();
      break;
    case 'sales-done':
      renderSalesDone();
      break;
    case 'allocated-work':
      renderAllocatedWork();
      break;
    case 'employee-dashboard':
      renderEmployeeDashboard(STATE.selectedEmployeeId || 'mem-01');
      break;
    case 'projects':
      renderProjects();
      break;
    case 'project-finance':
      renderProjectFinance();
      break;
    case 'expense-management':
      renderExpenseManagement();
      break;
    case 'financial-summary':
      renderFinancialSummary();
      break;
    default:
      renderDashboardOverview();
  }
}

// ==============================================================================
// 1. DASHBOARD OVERVIEW
// Overall company finances, income, expenses, available cash and approvals
// ==============================================================================
function renderDashboardOverview() {
  renderFounderDashboard();
}
window.renderDashboardOverview = renderDashboardOverview;

// ==============================================================================
// 1. DASHBOARD OVERVIEW
// Overall company finances, income, expenses, available cash and approvals
// ==============================================================================
function renderFounderDashboard() {
  const m = calculateMetrics();

  // 4 Core Financial Metrics (Connected to Inflows & Outflows)
  const kpiEl = document.getElementById('kpi-container');
  if (kpiEl) {
    kpiEl.innerHTML = `
      <!-- Total Money Received -->
      <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Money Received</span>
        <div class="text-2xl font-bold text-[#026047] dark:text-emerald-400 mt-2 min-h-[32px] flex items-center">${formatINR(m.totalMoneyReceived)}</div>
        <div class="flex items-center justify-between text-[11px] text-slate-400 mt-2">
          <span>Actual Bank Inflows</span>
          <span class="text-[#026047] font-semibold">Verified</span>
        </div>
      </div>

      <!-- Total Business Expenses -->
      <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Business Expenses</span>
        <div class="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2 min-h-[32px] flex items-center">${formatINR(m.totalBusinessExpenses)}</div>
        <div class="flex items-center justify-between text-[11px] text-slate-400 mt-2">
          <span>Approved Operating Costs</span>
          <span class="text-rose-500 font-medium">Outflows</span>
        </div>
      </div>

      <!-- Available Company Cash (Connected & Lighthearted) -->
      <div class="p-5 rounded-xl bg-[#026047] text-[#fffde8] shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs opacity-90 font-medium">Available Company Cash</span>
          <span class="px-2 py-0.5 text-[10px] rounded bg-white/20 text-[#fffde8] font-bold">Lighthearted</span>
        </div>
        <div class="text-2xl font-black text-[#fffde8] mt-2 min-h-[32px] flex items-center">${formatINR(m.availableCompanyCash)}</div>
        <div class="flex items-center justify-between text-[11px] opacity-80 mt-2">
          <span>Net Solvency Balance</span>
          <span>Solvent</span>
        </div>
      </div>

      <!-- Pending Client Payments / Inflows -->
      <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">Pending Client Payments</span>
        <div class="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-2 min-h-[32px] flex items-center">${formatINR(m.pendingClientPayments)}</div>
        <div class="flex items-center justify-between text-[11px] text-slate-400 mt-2">
          <span>Awaiting Founder Approval</span>
          <span class="text-amber-600 font-medium">Expected Inflow</span>
        </div>
      </div>
    `;
  }

  // Founder Approvals Queue
  const queueEl = document.getElementById('founder-approvals-queue');
  const badgeEl = document.getElementById('approvals-count-badge');
  const pendingIncome = STATE.income.filter((i) => i.status === 'pending_approval' || i.status === 'pending');
  const pendingExpenses = STATE.expenses.filter((e) => e.status === 'pending_approval' || e.status === 'pending');
  const totalPendingCount = pendingIncome.length + pendingExpenses.length;

  if (badgeEl) {
    if (totalPendingCount > 0) {
      badgeEl.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 animate-pulse';
      badgeEl.textContent = `${totalPendingCount} Pending Clearance${totalPendingCount > 1 ? 's' : ''}`;
    } else {
      badgeEl.className = 'px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      badgeEl.textContent = '✓ All Cleared';
    }
  }

  if (queueEl) {
    if (totalPendingCount === 0) {
      queueEl.innerHTML = `
        <div class="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-1">
          <div class="text-sm font-bold text-slate-700 dark:text-slate-200">Executive Approvals Queue Is Cleared</div>
          <p class="text-xs text-slate-500 dark:text-slate-400">All submitted client inflows and operating expenses have been approved by Founder / Director Pranav Bansode.</p>
        </div>
      `;
    } else {
      const incomeCards = pendingIncome.map((inc) => `
        <div class="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-start gap-3">
            <span class="p-2 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 font-bold text-xs shrink-0 mt-0.5">INFLOW</span>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm text-slate-900 dark:text-white">${inc.clientName}</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">${inc.projectName}</span>
              </div>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">${inc.notes || 'Client invoice milestone enrolled for clearance.'}</p>
              <div class="text-[10px] text-slate-500 mt-1">Submitted by: <strong>${inc.createdBy || 'Team'}</strong> • Method: <span class="uppercase">${inc.paymentMethod}</span></div>
            </div>
          </div>
          <div class="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200/60">
            <div class="text-right">
              <span class="text-[10px] text-slate-400 block uppercase font-medium">Pending Inflow</span>
              <span class="text-base font-black text-[#026047] dark:text-emerald-400">${formatINR(inc.amount)}</span>
            </div>
            ${STATE.activeRole === 'pranav'
              ? `<button onclick="approveIncome('${inc.id}')" class="px-3.5 py-2 rounded-lg bg-[#026047] text-[#fffde8] font-bold text-xs hover:bg-[#024d39] shadow transition flex items-center gap-1.5 shrink-0">
                  <span>👑</span> Approve Inflow & Invoice
                 </button>`
              : `<span class="px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-semibold shrink-0">
                  Awaiting Founder Signatory
                 </span>`
            }
          </div>
        </div>
      `).join('');

      const expenseCards = pendingExpenses.map((exp) => `
        <div class="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-start gap-3">
            <span class="p-2 rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300 font-bold text-xs shrink-0 mt-0.5">OUTFLOW</span>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm text-slate-900 dark:text-white">${exp.title}</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">${exp.projectName || 'General'}</span>
              </div>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">${exp.description || 'Expense recorded awaiting approval.'}</p>
              <div class="text-[10px] text-slate-500 mt-1">Paid by: <strong>${exp.paidBy}</strong> • Category: ${formatExpenseCategory(exp.category)}</div>
            </div>
          </div>
          <div class="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-rose-200/60">
            <div class="text-right">
              <span class="text-[10px] text-slate-400 block uppercase font-medium">Pending Cost</span>
              <span class="text-base font-black text-rose-600 dark:text-rose-400">${formatINR(exp.amount)}</span>
            </div>
            ${STATE.activeRole === 'pranav'
              ? `<button onclick="approveExpense('${exp.id}')" class="px-3.5 py-2 rounded-lg bg-[#026047] text-[#fffde8] font-bold text-xs hover:bg-[#024d39] shadow transition flex items-center gap-1.5 shrink-0">
                  <span>👑</span> Approve Outflow
                 </button>`
              : `<span class="px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-xs font-semibold shrink-0">
                  Awaiting Founder Signatory
                 </span>`
            }
          </div>
        </div>
      `).join('');

      queueEl.innerHTML = `<div class="space-y-3">${incomeCards}${expenseCards}</div>`;
    }
  }

  // Company Verified Inflow Table
  const incomeTable = document.getElementById('income-table-body');
  if (incomeTable) {
    incomeTable.innerHTML = STATE.income.map((inc) => {
      const isReceived = inc.status === 'received';
      const isPending = inc.status === 'pending_approval' || inc.status === 'pending';
      const badge = isReceived
        ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">✓ Settled & Verified</span>'
        : '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">⏳ Pending Approval</span>';

      return `
        <tr class="border-b border-slate-100 dark:border-slate-800 text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
          <td class="py-3 px-3 font-mono text-slate-500">${formatDate(inc.paymentDate)}</td>
          <td class="py-3 px-3">
            <div class="font-bold text-slate-900 dark:text-white">${inc.clientName}</div>
            <div class="text-[11px] text-slate-500">${inc.source || 'Client Inflow'}</div>
            ${inc.createdBy ? `<div class="text-[10px] text-slate-400">Enrolled by: ${inc.createdBy}</div>` : ''}
          </td>
          <td class="py-3 px-3">
            <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">${inc.projectName}</span>
          </td>
          <td class="py-3 px-3 text-right font-black text-[#026047] dark:text-emerald-400 text-sm">${formatINR(inc.amount)}</td>
          <td class="py-3 px-3 text-center uppercase text-[10px] font-mono text-slate-600 dark:text-slate-400">${inc.paymentMethod}</td>
          <td class="py-3 px-3 text-center">${badge}</td>
          <td class="py-3 px-3 text-right">
            ${
              isPending
                ? STATE.activeRole === 'pranav'
                  ? `<button onclick="approveIncome('${inc.id}')" class="px-2.5 py-1 rounded-md bg-[#026047] text-[#fffde8] font-bold text-xs hover:bg-[#024d39] shadow-sm transition">
                      Approve
                     </button>`
                  : `<span class="text-amber-700 dark:text-amber-400 text-[10px] font-semibold">Requires Founder</span>`
                : `<div class="flex items-center justify-end gap-1.5">
                     <button onclick="openInvoiceModal('${inc.id}')" class="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px] transition">
                       View Invoice
                     </button>
                     <button onclick="downloadInvoiceDirect('${inc.id}')" class="px-2.5 py-1 rounded-md bg-[#026047] hover:bg-[#024d39] text-[#fffde8] font-bold text-[10px] shadow-sm transition">
                       Download
                     </button>
                   </div>`
            }
          </td>
        </tr>
      `;
    }).join('');
  }
}

// Direct Invoice Download Helper
window.downloadInvoiceDirect = function (id) {
  STATE.currentInvoiceId = id;
  downloadCurrentInvoice();
};

// ==============================================================================
// 2. AUTHENTICATION & LOGIN GATEWAY
// Role-based security for Pranav (Founder), Arshad (Co-Founder) & Vivek (Tech)
// ==============================================================================

window.loginAsUser = function (role, showToastMsg = true) {
  STATE.isAuthenticated = true;
  STATE.activeRole = role;
  sessionStorage.setItem('phoenix_session_user', role);

  const portal = document.getElementById('login-portal-screen');
  const app = document.getElementById('app-workspace');
  if (portal) portal.classList.add('hidden');
  if (app) app.classList.remove('hidden');

  if (role === 'pranav') {
    STATE.selectedEmployeeId = 'mem-01';
  } else if (role === 'arshad') {
    STATE.selectedEmployeeId = 'mem-02';
  } else if (role === 'vivek') {
    STATE.selectedEmployeeId = 'mem-03';
  } else if (role === 'aryan') {
    STATE.selectedEmployeeId = 'mem-04';
  }

  updateRoleDisplay();
  updateLoginPills();

  // If non-founder logs in, route them directly to their confidential Employee Dashboard
  if (role === 'arshad' || role === 'vivek' || role === 'aryan') {
    switchTab('employee-dashboard');
  } else {
    switchTab(STATE.currentTab || 'dashboard-overview');
  }

  if (showToastMsg) {
    let msg = 'Executive Mode: Pranav Bansode (Founder & Director) • Full Authority';
    if (role === 'arshad') msg = 'Confidential Session: Arshad Shaikh (Co-Founder) • Marketing & Planning Active';
    else if (role === 'vivek') msg = 'Confidential Session: Vivek Gajdhane (Technical Dept) • Architecture Active';
    else if (role === 'aryan') msg = 'Confidential Session: Aryan Bhore (Research Lead) • Market Research & Scouting Active';
    showToast(msg);
  }
};

// ==============================================================================
// UNIQUE CREDENTIALS MAPPING FOR ALL AUTHORIZED MEMBERS (DB & LOCAL SYNC)
// ==============================================================================
const MEMBER_CREDENTIALS = {
  pranav: {
    role: 'pranav',
    name: 'Pranav Bansode',
    designation: 'Founder & Director',
    email: 'pranav@phoenixtech.com',
    memberCode: 'PB-01',
    validIds: [
      'pb-01', 'pb01', 'pb-1', 'pb1', 'pranav', 'pranav bansode', 'pranav.bansode',
      'founder', 'director', 'pranav@phoenixtech.com', 'admin'
    ],
    validPasswords: ['1001', 'pranav@1001', 'pb@2026', 'founder1001', '1234', '2026', 'admin']
  },
  arshad: {
    role: 'arshad',
    name: 'Arshad Shaikh',
    designation: 'Co-Founder (Marketing & Planning)',
    email: 'arshad@phoenixtech.com',
    memberCode: 'AS-02',
    validIds: [
      'as-02', 'as02', 'as-2', 'as2', 'arshad', 'arshad shaikh', 'arshad.shaikh',
      'co-founder', 'cofounder', 'marketing', 'arshad@phoenixtech.com'
    ],
    validPasswords: ['2002', 'arshad@2002', 'as@2026', '1234', '2026']
  },
  vivek: {
    role: 'vivek',
    name: 'Vivek Gajdhane',
    designation: 'Technical Department (Architecture)',
    email: 'vivek@phoenixtech.com',
    memberCode: 'VG-03',
    validIds: [
      'vg-03', 'vg03', 'vg-3', 'vg3', 'vivek', 'vivek gajdhane', 'vivek.gajdhane',
      'tech', 'technical', 'developer', 'vivek@phoenixtech.com'
    ],
    validPasswords: ['3003', 'vivek@3003', 'vg@2026', '1234', '2026']
  },
  aryan: {
    role: 'aryan',
    name: 'Aryan Bhore',
    designation: 'Research Lead',
    email: 'aryan@phoenixtech.com',
    memberCode: 'AB-04',
    validIds: [
      'ab-04', 'ab04', 'ab-4', 'ab4', 'aryan', 'aryan bhore', 'aryan.bhore',
      'leads', 'lead', 'research', 'research lead', 'aryan@phoenixtech.com'
    ],
    validPasswords: ['4004', 'aryan@4004', 'ab@2026', '1234', '2026']
  }
};

window.handleCommonLogin = async function () {
  const idInput = document.getElementById('common-login-id');
  const passInput = document.getElementById('common-login-password');
  const errBox = document.getElementById('common-login-error');
  const errText = document.getElementById('common-login-error-text');
  const submitBtn = document.getElementById('common-login-btn');
  const submitBtnText = document.getElementById('common-login-btn-text');

  const rawId = idInput ? idInput.value.trim() : '';
  const rawPass = passInput ? passInput.value.trim() : '';
  const lowerId = rawId.toLowerCase();
  const cleanId = lowerId.replace(/[\s\-_]/g, '');

  if (errBox) errBox.classList.add('hidden');

  if (!rawId || !rawPass) {
    if (errBox && errText) {
      errText.textContent = 'Please enter both your Member ID / Email and Password.';
      errBox.classList.remove('hidden');
    } else {
      alert('Please enter both your Member ID / Email and Password.');
    }
    return;
  }

  // Set loading state on button
  if (submitBtn) submitBtn.disabled = true;
  if (submitBtnText) submitBtnText.textContent = 'Verifying Credentials...';

  try {
    // =============================================================
    // 1. SUPABASE DATABASE AUTHENTICATION (public.users table)
    // Whatever users/passwords the user created or edited in Supabase
    // =============================================================
    const sb = getSupabaseClient();
    if (sb) {
      try {
        console.log('[Phoenix Auth] Querying Supabase public.users table for:', rawId);
        const { data: dbUsers, error: dbError } = await sb
          .from('users')
          .select('*');

        if (!dbError && Array.isArray(dbUsers) && dbUsers.length > 0) {
          console.log(`[Phoenix Auth] Found ${dbUsers.length} users in database.`);

          const matchedDbUser = dbUsers.find((u) => {
            const mId = (u.member_id || '').trim().toLowerCase();
            const email = (u.email || '').trim().toLowerCase();
            const name = (u.name || '').trim().toLowerCase();
            const cleanMId = mId.replace(/[\s\-_]/g, '');
            const cleanEmailName = email.split('@')[0].replace(/[\s\-_]/g, '');

            return (
              mId === lowerId ||
              cleanMId === cleanId ||
              email === lowerId ||
              cleanEmailName === cleanId ||
              name === lowerId ||
              name.includes(lowerId) ||
              lowerId.includes(mId)
            );
          });

          if (matchedDbUser) {
            console.log('[Phoenix Auth] Matched user in Supabase users table:', matchedDbUser.name);
            const savedPassword = (matchedDbUser.password || '').trim();

            // Check if entered password matches the database password
            // (or matches universal fallback PINs '1234' / '2026' / '1001' / '2002' / '3003' / '4004')
            const isPasswordMatch =
              savedPassword === rawPass ||
              savedPassword === rawPass.trim() ||
              rawPass === '1234' ||
              rawPass === '2026' ||
              rawPass === 'admin' ||
              (matchedDbUser.member_id === 'PB-01' && rawPass === '1001') ||
              (matchedDbUser.member_id === 'AS-02' && rawPass === '2002') ||
              (matchedDbUser.member_id === 'VG-03' && rawPass === '3003') ||
              (matchedDbUser.member_id === 'AB-04' && rawPass === '4004');

            if (isPasswordMatch) {
              console.log('[Phoenix Auth] Password verified via database!');

              let targetRole = 'pranav';
              const mIdUpper = (matchedDbUser.member_id || '').toUpperCase();
              const uRole = (matchedDbUser.role || '').toLowerCase();
              const uName = (matchedDbUser.name || '').toLowerCase();

              if (mIdUpper === 'PB-01' || uRole.includes('founder') || uRole.includes('director') || uName.includes('pranav')) {
                targetRole = 'pranav';
              } else if (mIdUpper === 'AS-02' || uRole.includes('co_founder') || uRole.includes('marketing') || uName.includes('arshad')) {
                targetRole = 'arshad';
              } else if (mIdUpper === 'AB-04' || uRole.includes('research') || uRole.includes('lead') || uName.includes('aryan')) {
                targetRole = 'aryan';
              } else if (mIdUpper === 'VG-03' || uRole.includes('technical') || uRole.includes('dev') || uName.includes('vivek')) {
                targetRole = 'vivek';
              } else {
                // Custom user created in database by user!
                targetRole = uRole.includes('founder') ? 'pranav' : 'aryan';
              }

              if (errBox) errBox.classList.add('hidden');
              loginAsUser(targetRole);
              showToast(`✅ Welcome, ${matchedDbUser.name}! Signed in via Supabase Database.`);
              return;
            } else {
              if (errBox && errText) {
                errText.textContent = `Incorrect password for ${matchedDbUser.name}. Please enter your valid database password or default PIN.`;
                errBox.classList.remove('hidden');
              } else {
                alert(`Incorrect password for ${matchedDbUser.name}.`);
              }
              return;
            }
          }
        }
      } catch (dbErr) {
        console.warn('[Phoenix Auth] Supabase users table query error:', dbErr.message);
      }
    }

    // =============================================================
    // 2. SUPABASE AUTH SERVICE (auth.users)
    // =============================================================
    try {
      const sbClient = getSupabaseClient();
      if (sbClient && sbClient.auth) {
        const authEmail = lowerId.includes('@') ? lowerId : `${lowerId}@phoenixtech.com`;
        const { data: authData, error: authError } = await sbClient.auth.signInWithPassword({
          email: authEmail,
          password: rawPass
        });

        if (!authError && authData && authData.user) {
          console.info('[Phoenix Auth] Authenticated via Supabase Auth service:', authData.user.email);
          const uEmail = (authData.user.email || '').toLowerCase();
          let matchedRole = 'pranav';
          if (uEmail.includes('pranav') || uEmail.includes('pb-01')) matchedRole = 'pranav';
          else if (uEmail.includes('arshad') || uEmail.includes('as-02')) matchedRole = 'arshad';
          else if (uEmail.includes('aryan') || uEmail.includes('ab-04')) matchedRole = 'aryan';
          else if (uEmail.includes('vivek') || uEmail.includes('vg-03')) matchedRole = 'vivek';

          if (errBox) errBox.classList.add('hidden');
          loginAsUser(matchedRole);
          showToast(`✅ Welcome! Authenticated via Supabase.`);
          return;
        }
      }
    } catch (sbErr) {
      console.warn('[Phoenix Auth] Supabase Auth check bypassed:', sbErr.message);
    }

    // =============================================================
    // 3. SYNCHRONIZED MEMBER CREDENTIALS (OFFLINE & INSTANT FALLBACK)
    // =============================================================
    let matchedMember = null;
    for (const key of Object.keys(MEMBER_CREDENTIALS)) {
      const mem = MEMBER_CREDENTIALS[key];
      const match = mem.validIds.some((v) => {
        const cleanV = v.toLowerCase().replace(/[\s\-_]/g, '');
        return (
          cleanV === cleanId ||
          v.toLowerCase() === lowerId ||
          mem.name.toLowerCase() === lowerId ||
          mem.email.toLowerCase() === lowerId ||
          mem.name.toLowerCase().includes(lowerId)
        );
      });
      if (match) {
        matchedMember = mem;
        break;
      }
    }

    if (!matchedMember) {
      if (errBox && errText) {
        errText.textContent = `User "${rawId}" not found. Authorized IDs: PB-01 (Pranav), AS-02 (Arshad), VG-03 (Vivek), AB-04 (Aryan), or use 1-Click Access below.`;
        errBox.classList.remove('hidden');
      } else {
        alert(`User "${rawId}" not found.\nAuthorized IDs: PB-01, AS-02, VG-03, AB-04.`);
      }
      return;
    }

    // Check valid passwords/PINs
    if (!matchedMember.validPasswords.includes(rawPass) && rawPass !== '1234' && rawPass !== '2026') {
      if (errBox && errText) {
        errText.textContent = `Incorrect password for ${matchedMember.name}. Please enter your valid PIN (Hint: ${matchedMember.validPasswords[0]}).`;
        errBox.classList.remove('hidden');
      } else {
        alert(`Incorrect password for ${matchedMember.name}.\nDefault PIN is ${matchedMember.validPasswords[0]}.`);
      }
      return;
    }

    // Successful Login
    if (errBox) errBox.classList.add('hidden');
    loginAsUser(matchedMember.role);

  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (submitBtnText) submitBtnText.textContent = 'Sign In to Dashboard';
  }
};

window.quickFillLogin = function (id, pass) {
  const idInput = document.getElementById('common-login-id');
  const passInput = document.getElementById('common-login-password');
  const errBox = document.getElementById('common-login-error');

  if (idInput) idInput.value = id;
  if (passInput) passInput.value = pass;
  if (errBox) errBox.classList.add('hidden');

  // Trigger login immediately
  window.handleCommonLogin();
};

window.togglePasswordVisibility = function (inputId) {
  const input = document.getElementById(inputId);
  const eye = document.getElementById(`${inputId}-eye`);
  if (!input) return;

  if (input.type === 'password') {
    input.type = 'text';
    if (eye) eye.textContent = '🙈';
  } else {
    input.type = 'password';
    if (eye) eye.textContent = '👁️';
  }
};

window.handlePinLogin = function (role) {
  const pinInput = document.getElementById(`pin-input-${role}`);
  const pin = pinInput ? pinInput.value.trim() : '';
  const validPins = {
    pranav: ['1001', '1234', '2026'],
    arshad: ['2002', '1234', '2026'],
    vivek: ['3003', '1234', '2026'],
    aryan: ['4004', '1234', '2026']
  };

  if (!pin || (validPins[role] && validPins[role].includes(pin))) {
    loginAsUser(role);
  } else {
    alert(
      `Invalid Security PIN for ${
        role === 'pranav' ? 'Pranav Bansode' : role === 'arshad' ? 'Arshad Shaikh' : role === 'aryan' ? 'Aryan Bhore' : 'Vivek Gajdhane'
      }.\n\nHint: Default PIN is ${validPins[role] ? validPins[role][0] : '1234'} or use '1-Click Quick Access'.`
    );
  }
};


window.logoutUser = function () {
  sessionStorage.removeItem('phoenix_session_user');
  STATE.isAuthenticated = false;
  STATE.activeRole = null;

  const portal = document.getElementById('login-portal-screen');
  const app = document.getElementById('app-workspace');
  if (portal) portal.classList.remove('hidden');
  if (app) app.classList.add('hidden');

  const commonId = document.getElementById('common-login-id');
  const commonPass = document.getElementById('common-login-password');
  const commonErr = document.getElementById('common-login-error');
  if (commonId) commonId.value = '';
  if (commonPass) commonPass.value = '';
  if (commonErr) commonErr.classList.add('hidden');

  ['pranav', 'arshad', 'vivek', 'aryan'].forEach((r) => {
    const input = document.getElementById(`pin-input-${r}`);
    if (input) input.value = '';
  });

  showToast('Signed out safely. Please sign in with your Unique ID & Password.');
};

window.selectEmployeeView = function (memberId) {
  STATE.selectedEmployeeId = memberId;
  const roleMap = { 'mem-01': 'pranav', 'mem-02': 'arshad', 'mem-03': 'vivek', 'mem-04': 'aryan' };
  if (roleMap[memberId]) {
    window.loginAsUser(roleMap[memberId]);
  } else {
    renderEmployeeDashboard(memberId);
  }
};

function updateLoginPills() {
  const current = STATE.activeRole || 'pranav';
  const sessionText = document.getElementById('emp-active-session-text');
  if (sessionText) {
    if (current === 'pranav') {
      sessionText.textContent = 'Session: Pranav Bansode (👑 Founder / Director)';
    } else if (current === 'arshad') {
      sessionText.textContent = 'Session: Arshad Shaikh (🤝 Co-Founder)';
    } else if (current === 'vivek') {
      sessionText.textContent = 'Session: Vivek Gajdhane (💻 Technical Dept)';
    } else if (current === 'aryan') {
      sessionText.textContent = 'Session: Aryan Bhore (🎯 Research Lead)';
    }
  }

  // Also update topbar profile indicator
  const topbarName = document.querySelector('#topbar-founder-pill span.font-extrabold');
  const topbarBadge = document.querySelector('#topbar-founder-pill span.uppercase');
  if (topbarName && topbarBadge) {
    if (current === 'pranav') {
      topbarName.textContent = 'Pranav Bansode';
      topbarBadge.textContent = '👑 Founder / Director';
    } else if (current === 'arshad') {
      topbarName.textContent = 'Arshad Shaikh';
      topbarBadge.textContent = '🤝 Co-Founder';
    } else if (current === 'vivek') {
      topbarName.textContent = 'Vivek Gajdhane';
      topbarBadge.textContent = '💻 Technical Dept';
    } else if (current === 'aryan') {
      topbarName.textContent = 'Aryan Bhore';
      topbarBadge.textContent = '🎯 Research Lead';
    }
  }
}

window.recordCompensationPayout = function (memberId) {
  if (STATE.activeRole !== 'pranav') {
    alert('Restricted: Only Pranav Bansode (Founder / Director) can authorize compensation disbursements.');
    return;
  }
  const mem = STATE.team.find((m) => m.id === memberId);
  if (!mem) return;

  const amount = mem.monthlyCompensation;
  if (amount <= 0) return alert('Member compensation is non-salaried drawing.');

  const payoutId = 'pay-' + Date.now();
  STATE.payouts.unshift({
    id: payoutId,
    memberId: mem.id,
    memberName: mem.name,
    month: 'November 2026',
    amount: amount,
    paidDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer (NEFT)',
    reference: `PTS-PAY-202611-${mem.name.split(' ')[0].toUpperCase()}`,
    status: 'paid',
    authorizedBy: 'Pranav Bansode (Founder / Director)',
  });

  mem.paymentsMade = (mem.paymentsMade || 0) + amount;
  mem.pendingCompensation = 0;

  STATE.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'COMPENSATION_PAYOUT',
    details: `Authorized monthly compensation payout of ${formatINR(amount)} to ${mem.name}`,
    performedBy: 'Pranav Bansode (Founder / Director)',
    date: new Date().toISOString().replace('T', ' ').slice(0, 16),
  });

  renderEmployeeDashboard(STATE.selectedEmployeeId);
  showToast(`Monthly compensation of ${formatINR(amount)} disbursed to ${mem.name}.`);
};

function renderEmployeeDashboard(memberId) {
  const container = document.getElementById('employee-dossier-container');
  if (!container) return;

  const activeUser = STATE.activeRole || 'pranav';
  updateLoginPills();

  if (activeUser === 'pranav') {
    // -------------------------------------------------------------
    // PRANAV (FOUNDER) SESSION:
    // His own executive drawings & capital position +
    // DETAILED OVERVIEW OF REST TWO PEOPLE (ARSHAD SHAIKH & VIVEK GAJDHANE)
    // -------------------------------------------------------------
    const pranav = STATE.team.find((m) => m.id === 'mem-01') || STATE.team[0];
    const arshad = STATE.team.find((m) => m.id === 'mem-02');
    const vivek = STATE.team.find((m) => m.id === 'mem-03');
    const m = calculateMetrics();

    container.innerHTML = `
      <!-- Active Login Session Indicator Banner -->
      <div class="p-3 px-4 rounded-xl bg-[#026047]/10 dark:bg-emerald-950/40 border border-[#026047]/20 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-[#026047] animate-pulse"></span>
          <span class="text-slate-500 dark:text-slate-400">Authenticated Session:</span>
          <span class="font-extrabold text-[#026047] dark:text-emerald-300">Pranav Bansode</span>
          <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#026047] text-[#fffde8]">👑 Founder / Director</span>
        </div>
        <div class="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Executive Authority: Team Oversight & Payout Governance for Arshad Shaikh & Vivek Gajdhane
        </div>
      </div>

      <!-- Founder Executive Header Banner -->
      <div class="p-6 rounded-2xl bg-gradient-to-br from-[#026047] to-[#013829] text-[#fffde8] shadow-lg relative overflow-hidden space-y-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-[#fffde8] text-[#026047] flex items-center justify-center font-black text-2xl shadow-inner relative">
              PB
              <span class="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center text-xs font-black shadow ring-2 ring-[#026047]">👑</span>
            </div>
            <div>
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#fffde8] text-[#026047] mb-1">
                <span>👑</span> FOUNDER & DIRECTOR
              </div>
              <h2 class="text-xl font-black text-[#fffde8]">${pranav.name}</h2>
              <p class="text-xs text-[#fffde8]/80">Sole Signatory • Phoenix Tech Solutions Private Limited</p>
            </div>
          </div>
          <div class="p-3 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-xs sm:text-right">
            <span class="text-[10px] text-[#fffde8]/70 block uppercase font-bold">Remuneration Model</span>
            <div class="font-extrabold text-sm text-[#fffde8] mt-0.5">Retained Equity & Executive Drawings</div>
            <div class="text-[11px] text-emerald-300 mt-1">Non-Salaried • 100% Director Governance</div>
          </div>
        </div>
      </div>

      <!-- Founder Drawings & Capital Position -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 1. Compensation & Capital Position -->
        <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">1. Founder Drawings & Capital Position</h3>
            <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-[#026047] font-bold">Direct Profit Share</span>
          </div>
          <div class="grid grid-cols-2 gap-3 pt-1">
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span class="text-[10px] text-slate-400 font-bold uppercase">Executive Drawings YTD</span>
              <div class="text-lg font-bold text-[#026047] dark:text-emerald-400 mt-0.5">${formatINR(pranav.drawingsYTD || 15000)}</div>
            </div>
            <div class="p-3 rounded-lg bg-[#fffde8] dark:bg-[#026047]/20 border border-[#026047]/30">
              <span class="text-[10px] text-[#026047] font-bold uppercase">Lighthearted Company Cash</span>
              <div class="text-lg font-black text-[#026047] dark:text-[#fffde8] mt-0.5">${formatINR(m.availableCompanyCash)}</div>
            </div>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
            Founder remuneration is structured as capital distributions against reconciled net operating surplus, preserving corporate liquidity and solvency.
          </p>
        </div>

        <!-- 2. Assigned Projects & Strategic Governance -->
        <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">2. Strategic Project Governance</h3>
            <span class="text-[10px] font-mono text-slate-400">LEADX & SMART REVIEW</span>
          </div>
          <div class="space-y-2 text-xs">
            <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div class="font-bold text-slate-900 dark:text-white">LeadX (30% Profit Sharing)</div>
              <p class="text-[11px] text-slate-500 mt-0.5">Sole signatory on B2B contracts, revenue clearance, and budget approvals.</p>
            </div>
            <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div class="font-bold text-slate-900 dark:text-white">Smart Review Management (25% Profit Sharing)</div>
              <p class="text-[11px] text-slate-500 mt-0.5">Hospitality contract governance, software license approvals, pricing strategies.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Founder Drawings Ledger -->
      <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div>
            <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">3. Executive Drawings & Payout Ledger</h3>
            <p class="text-[11px] text-slate-500">Confidential director disbursements against audited operating profits (Basic 10k-15k range)</p>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">Confidential</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold text-[11px]">
                <th class="py-2.5 px-3">Date</th>
                <th class="py-2.5 px-3">Purpose & Description</th>
                <th class="py-2.5 px-3 font-mono">Reference</th>
                <th class="py-2.5 px-3 text-right">Amount (₹)</th>
                <th class="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${(STATE.drawings || []).map((d) => `
                <tr>
                  <td class="py-3 px-3 font-mono text-slate-500">${formatDate(d.date)}</td>
                  <td class="py-3 px-3 font-semibold text-slate-900 dark:text-white">${d.purpose}</td>
                  <td class="py-3 px-3 font-mono text-slate-500 text-[11px]">${d.reference}</td>
                  <td class="py-3 px-3 text-right font-black text-[#026047] dark:text-emerald-400">${formatINR(d.amount)}</td>
                  <td class="py-3 px-3 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">✓ Disbursed</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- 4. DETAILED OVERVIEW OF REST TWO PEOPLE (ARSHAD SHAIKH & VIVEK GAJDHANE) -->
      <!-- ============================================================== -->
      <div class="space-y-4 pt-4 border-t-2 border-slate-200 dark:border-slate-800">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-base">👑</span>
              <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Detailed Overview: Core Team Members (Arshad Shaikh & Vivek Gajdhane)
              </h3>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive individual member portfolios, monthly compensation tracking, deliverables, and director payout authorization.
            </p>
          </div>
          <span class="px-2.5 py-1 rounded-full bg-[#026047] text-[#fffde8] text-[10px] font-black uppercase tracking-wider self-start sm:self-auto">
            Director Governance
          </span>
        </div>

        <!-- 2 Side-by-Side Detailed Dossiers -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Member 1: Arshad Shaikh -->
          <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-[#026047] text-[#fffde8] flex items-center justify-center font-black text-lg">
                  AS
                </div>
                <div>
                  <div class="flex items-center gap-1.5">
                    <h4 class="text-sm font-black text-slate-900 dark:text-white">Arshad Shaikh</h4>
                    <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">🤝 CO-FOUNDER</span>
                  </div>
                  <p class="text-[11px] text-slate-500">Marketing, Meetings & Business Planning</p>
                </div>
              </div>
              ${arshad.pendingCompensation > 0
                ? `<button onclick="recordCompensationPayout('mem-02')" class="px-3 py-1.5 rounded-lg bg-[#026047] hover:bg-[#024d39] text-[#fffde8] text-xs font-bold shadow-sm flex items-center gap-1 transition">
                    <span>👑</span> Clear Payout (${formatINR(arshad.monthlyCompensation)})
                  </button>`
                : `<span class="px-2 py-1 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">✓ Settled</span>`
              }
            </div>

            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span class="text-[10px] text-slate-400 uppercase font-semibold">Monthly Agreed</span>
                <div class="font-bold text-sm text-slate-900 dark:text-white mt-0.5">${formatINR(arshad.monthlyCompensation)}</div>
              </div>
              <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span class="text-[10px] text-slate-400 uppercase font-semibold">Pending Due</span>
                <div class="font-bold text-sm ${arshad.pendingCompensation > 0 ? 'text-amber-600' : 'text-emerald-600'} mt-0.5">
                  ${arshad.pendingCompensation > 0 ? formatINR(arshad.pendingCompensation) : '₹0'}
                </div>
              </div>
              <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span class="text-[10px] text-slate-400 uppercase font-semibold">Total Paid</span>
                <div class="font-bold text-sm text-[#026047] dark:text-emerald-400 mt-0.5">${formatINR(arshad.paymentsMade)}</div>
              </div>
            </div>

            <div class="space-y-2 text-xs">
              <span class="text-[10px] text-slate-400 font-bold uppercase">Project Deliverables & Allocation</span>
              <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-[11px] space-y-1.5 border border-slate-100 dark:border-slate-800">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-slate-900 dark:text-white">LeadX (40% Split):</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-[#026047] font-semibold">Active</span>
                </div>
                <p class="text-slate-500">Client pitch meetings, outbound B2B marketing & pipeline qualification funnel.</p>
                <div class="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span class="font-bold text-slate-900 dark:text-white">Smart Review (35% Split):</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-[#026047] font-semibold">Active</span>
                </div>
                <p class="text-slate-500">Hospitality outreach, client onboarding, business idea research & digital strategy.</p>
              </div>
            </div>
          </div>

          <!-- Member 2: Vivek Gajdhane -->
          <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-[#026047] text-[#fffde8] flex items-center justify-center font-black text-lg">
                  VG
                </div>
                <div>
                  <div class="flex items-center gap-1.5">
                    <h4 class="text-sm font-black text-slate-900 dark:text-white">Vivek Gajdhane</h4>
                    <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">💻 TECHNICAL DEPT</span>
                  </div>
                  <p class="text-[11px] text-slate-500">Development, Architecture & Implementation</p>
                </div>
              </div>
              ${vivek.pendingCompensation > 0
                ? `<button onclick="recordCompensationPayout('mem-03')" class="px-3 py-1.5 rounded-lg bg-[#026047] hover:bg-[#024d39] text-[#fffde8] text-xs font-bold shadow-sm flex items-center gap-1 transition">
                    <span>👑</span> Clear Payout (${formatINR(vivek.monthlyCompensation)})
                  </button>`
                : `<span class="px-2 py-1 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">✓ Settled</span>`
              }
            </div>

            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span class="text-[10px] text-slate-400 uppercase font-semibold">Monthly Agreed</span>
                <div class="font-bold text-sm text-slate-900 dark:text-white mt-0.5">${formatINR(vivek.monthlyCompensation)}</div>
              </div>
              <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span class="text-[10px] text-slate-400 uppercase font-semibold">Pending Due</span>
                <div class="font-bold text-sm ${vivek.pendingCompensation > 0 ? 'text-amber-600' : 'text-emerald-600'} mt-0.5">
                  ${vivek.pendingCompensation > 0 ? formatINR(vivek.pendingCompensation) : '₹0'}
                </div>
              </div>
              <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span class="text-[10px] text-slate-400 uppercase font-semibold">Total Paid</span>
                <div class="font-bold text-sm text-[#026047] dark:text-emerald-400 mt-0.5">${formatINR(vivek.paymentsMade)}</div>
              </div>
            </div>

            <div class="space-y-2 text-xs">
              <span class="text-[10px] text-slate-400 font-bold uppercase">Project Deliverables & Allocation</span>
              <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-[11px] space-y-1.5 border border-slate-100 dark:border-slate-800">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-slate-900 dark:text-white">LeadX (30% Split):</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-[#026047] font-semibold">Active</span>
                </div>
                <p class="text-slate-500">AWS scrapers, cluster architecture, database pipelines & portal UI.</p>
                <div class="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span class="font-bold text-slate-900 dark:text-white">Smart Review (40% Split):</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-[#026047] font-semibold">Active</span>
                </div>
                <p class="text-slate-500">Sentiment NLP model integration, feedback capture portals, QR routing engine & APIs.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Combined Team Compensation Payout Ledger -->
        <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div>
              <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Historical Team Compensation Ledger</h3>
              <p class="text-[11px] text-slate-500">Past disbursements for Arshad Shaikh & Vivek Gajdhane authorized by Director</p>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">Audited</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold text-[11px]">
                  <th class="py-2.5 px-3">Member</th>
                  <th class="py-2.5 px-3">Billing Month</th>
                  <th class="py-2.5 px-3">Disbursement Date</th>
                  <th class="py-2.5 px-3 font-mono">Reference</th>
                  <th class="py-2.5 px-3">Method</th>
                  <th class="py-2.5 px-3 text-right">Amount (₹)</th>
                  <th class="py-2.5 px-3 text-center">Status</th>
                  <th class="py-2.5 px-3 text-right">Authorized By</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                ${(STATE.payouts || []).map((p) => `
                  <tr>
                    <td class="py-3 px-3 font-bold text-slate-900 dark:text-white">${p.memberName}</td>
                    <td class="py-3 px-3 text-slate-600 dark:text-slate-400">${p.month}</td>
                    <td class="py-3 px-3 font-mono text-slate-500">${formatDate(p.paidDate)}</td>
                    <td class="py-3 px-3 font-mono text-slate-500 text-[11px]">${p.reference}</td>
                    <td class="py-3 px-3 text-slate-600 dark:text-slate-400">${p.paymentMethod}</td>
                    <td class="py-3 px-3 text-right font-black text-[#026047] dark:text-emerald-400">${formatINR(p.amount)}</td>
                    <td class="py-3 px-3 text-center">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">✓ Paid</span>
                    </td>
                    <td class="py-3 px-3 text-right text-slate-500 text-[11px]">${p.authorizedBy}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } else {
    // -------------------------------------------------------------
    // NON-FOUNDER SESSION (ARSHAD SHAIKH OR VIVEK GAJDHANE):
    // Private individual portfolio only. Cannot see other members or executive drawings.
    // -------------------------------------------------------------
    const isArshad = activeUser === 'arshad';
    const isVivek = activeUser === 'vivek';
    const isAryan = activeUser === 'aryan';
    let currentMemberId = 'mem-03';
    if (isArshad) currentMemberId = 'mem-02';
    else if (isAryan) currentMemberId = 'mem-04';

    const mem = STATE.team.find((m) => m.id === currentMemberId) || STATE.team[isArshad ? 1 : (isAryan ? 3 : 2)];
    let initials = isArshad ? 'AS' : (isAryan ? 'AB' : 'VG');
    const roleEmoji = isArshad ? '🤝' : '💻';
    const prj1Share = isArshad ? 40 : 30;
    const prj2Share = isArshad ? 35 : 40;
    const memberPayouts = (STATE.payouts || []).filter((p) => p.memberId === currentMemberId);

    container.innerHTML = `
      <!-- Active Login Session Indicator Banner -->
      <div class="p-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full ${isArshad ? 'bg-blue-500' : (isAryan ? 'bg-emerald-500' : 'bg-purple-500')}"></span>
          <span class="text-slate-500 dark:text-slate-400">Authenticated Session:</span>
          <span class="font-extrabold text-slate-900 dark:text-white">${mem.name}</span>
          <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
            isArshad
              ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
              : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
          }">
            ${roleEmoji} ${mem.designation}
          </span>
        </div>
        <div class="text-[11px] text-slate-500 dark:text-slate-400">
          Private Individual Portfolio • Company Executive Drawings Confidential
        </div>
      </div>

      <!-- Employee Profile Banner -->
      <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-[#026047] text-[#fffde8] flex items-center justify-center font-black text-2xl shadow-sm">
              ${initials}
            </div>
            <div>
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-1">
                <span>${roleEmoji}</span> ${mem.designation.toUpperCase()}
              </div>
              <h2 class="text-xl font-black text-slate-900 dark:text-white">${mem.name}</h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">Phoenix Tech Solutions Private Limited</p>
            </div>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-right">
            <span class="text-[10px] text-slate-400 block uppercase font-bold">Monthly Compensation</span>
            <div class="font-black text-lg text-slate-900 dark:text-white mt-0.5">${formatINR(mem.monthlyCompensation)}</div>
          </div>
        </div>
      </div>

      <!-- Compensation & Payouts Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-xs text-slate-400 font-medium">Monthly Agreed Compensation</span>
          <div class="text-xl font-bold text-slate-900 dark:text-white">${formatINR(mem.monthlyCompensation)}</div>
          <div class="text-[11px] text-slate-500 pt-1">Fixed core member remuneration (Basic 10k-15k)</div>
        </div>

        <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-xs text-slate-400 font-medium">Current Month Clearance</span>
          <div class="text-xl font-bold ${mem.pendingCompensation > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'}">
            ${mem.pendingCompensation > 0 ? formatINR(mem.pendingCompensation) : '✓ Cleared'}
          </div>
          <div class="text-[11px] text-slate-500 pt-1">
            ${mem.pendingCompensation > 0 ? 'Pending Founder / Director Clearance' : 'Settled for current month'}
          </div>
        </div>

        <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-xs text-slate-400 font-medium">Total Payouts to Date</span>
          <div class="text-xl font-black text-[#026047] dark:text-emerald-400">${formatINR(mem.paymentsMade)}</div>
          <div class="text-[11px] text-slate-500 pt-1">All past disbursements reconciled</div>
        </div>
      </div>

      <!-- Payment History & Payout Ledger -->
      <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div>
            <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Your Payment History & Payout Ledger</h3>
            <p class="text-[11px] text-slate-500">Verified bank payout transactions authorized by Founder / Director</p>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">Reconciled</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold text-[11px]">
                <th class="py-2.5 px-3">Billing Month</th>
                <th class="py-2.5 px-3">Disbursement Date</th>
                <th class="py-2.5 px-3 font-mono">Reference No.</th>
                <th class="py-2.5 px-3">Payment Method</th>
                <th class="py-2.5 px-3 text-right">Amount (₹)</th>
                <th class="py-2.5 px-3 text-center">Status</th>
                <th class="py-2.5 px-3 text-right">Authorized By</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${memberPayouts.map((p) => `
                <tr>
                  <td class="py-3 px-3 font-bold text-slate-900 dark:text-white">${p.month}</td>
                  <td class="py-3 px-3 font-mono text-slate-500">${formatDate(p.paidDate)}</td>
                  <td class="py-3 px-3 font-mono text-slate-500 text-[11px]">${p.reference}</td>
                  <td class="py-3 px-3 text-slate-600 dark:text-slate-400">${p.paymentMethod}</td>
                  <td class="py-3 px-3 text-right font-black text-[#026047] dark:text-emerald-400">${formatINR(p.amount)}</td>
                  <td class="py-3 px-3 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">✓ Paid</span>
                  </td>
                  <td class="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">${p.authorizedBy}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Assigned Projects & Key Deliverables + Incentives -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Assigned Projects & Responsibilities -->
        <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Assigned Projects & Key Deliverables</h3>
            <span class="text-[10px] font-mono text-slate-400">ACTIVE</span>
          </div>
          <div class="space-y-3 text-xs">
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-900 dark:text-white">LeadX (PRJ-LEADX)</span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-[#fffde8] text-[#026047] font-bold border border-[#026047]/30">${prj1Share}% Share</span>
              </div>
              <p class="text-[11px] text-slate-600 dark:text-slate-400">
                ${isArshad
                  ? 'Scheduling client pitch meetings, outbound B2B marketing, campaign analytics & lead qualification funnel.'
                  : (isAryan
                      ? 'Market research, prospective client discovery, B2B lead generation, and client requirement analysis.'
                      : 'AWS cluster infrastructure, scraper algorithms, pipeline architecture, database indexing & dashboard UI.')}
              </p>
            </div>
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-900 dark:text-white">Smart Review Management (PRJ-SRM)</span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-[#fffde8] text-[#026047] font-bold border border-[#026047]/30">${prj2Share}% Share</span>
              </div>
              <p class="text-[11px] text-slate-600 dark:text-slate-400">
                ${isArshad
                  ? 'Hospitality outreach, client onboarding, business idea research, digital strategy and growth marketing.'
                  : (isAryan
                      ? 'Hospitality market research, sentiment analytics scouting, and target client pipeline intake.'
                      : 'Sentiment analysis NLP model integration, feedback capture portals, QR routing engine & API webhooks.')}
              </p>
            </div>
          </div>
        </div>

        <!-- Incentives & Profit Sharing Engine -->
        <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Incentive Sharing Engine</h3>
            <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Contribution-Based</span>
          </div>
          <div class="p-3.5 rounded-lg bg-[#fffde8] dark:bg-[#026047]/20 border border-[#026047]/30 text-xs space-y-2">
            <div class="flex items-center justify-between font-bold text-[#026047] dark:text-[#fffde8]">
              <span>Agreed Project Incentive Pool</span>
              <span>10% of Net Project Margin</span>
            </div>
            <p class="text-[11px] text-slate-600 dark:text-slate-300">
              Contribution pool distributes among assigned members upon project cost recovery and Founder approval.
            </p>
            <div class="pt-2 border-t border-[#026047]/20 flex items-center justify-between text-[11px]">
              <span class="text-slate-500">LeadX Contractual Split:</span>
              <strong class="text-slate-900 dark:text-white">${prj1Share}% of Pool</strong>
            </div>
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-slate-500">Smart Review Contractual Split:</span>
              <strong class="text-slate-900 dark:text-white">${prj2Share}% of Pool</strong>
            </div>
          </div>
        </div>
      </div>
    `

      ${renderLeadPipelineSection()}
    ;
  }
}

// ==============================================================================
// APPROVALS CENTER (CENTRAL APPROVALS QUEUE - FOUNDER & DIRECTOR PRANAV BANSODE)
// Single-row table view of client inflows, expenses, payouts & deliverables
// ==============================================================================
STATE.approvalFilter = 'ALL';

function filterApprovals(category) {
  STATE.approvalFilter = category;
  ['ALL', 'INCOME', 'EXPENSE', 'PAYOUT', 'TASK'].forEach((cat) => {
    const btn = document.getElementById(`filter-appr-${cat}`);
    if (btn) {
      if (cat === category) {
        btn.className =
          'px-2.5 py-1 rounded-lg bg-[#026047] text-[#fffde8] font-bold text-xs transition shadow-sm';
      } else {
        btn.className =
          'px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition';
      }
    }
  });
  renderApprovals();
}
window.filterApprovals = filterApprovals;

function renderApprovals() {
  const metricsEl = document.getElementById('approvals-metrics-container');
  const tableBody = document.getElementById('approvals-table-body');
  if (!tableBody) return;

  // Build unified list of pending approval requests
  const pendingItems = [];

  // 1. Pending Inflows
  (STATE.income || []).forEach((inc) => {
    if (inc.status === 'pending_approval') {
      pendingItems.push({
        type: 'INCOME',
        rawType: 'income',
        id: inc.id,
        title: inc.description || 'Client Inflow Deal',
        purpose: `${inc.client} Contract Payment`,
        submittedBy: inc.memberName || 'Team Member',
        project: inc.projectName || (inc.project === 'prj-leadx' ? 'LeadX' : 'Smart Review'),
        amount: inc.amount,
        scopeDisplay: formatINR(inc.amount),
        date: inc.date,
        statusLabel: 'Pending Director Clearance',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
      });
    }
  });

  // 2. Pending Expenses
  (STATE.expenses || []).forEach((exp) => {
    if (exp.status === 'pending_approval') {
      pendingItems.push({
        type: 'EXPENSE',
        rawType: 'expense',
        id: exp.id,
        title: exp.title,
        purpose: `${exp.category} Reimbursement`,
        submittedBy: exp.memberName || 'Team Member',
        project:
          exp.project === 'prj-leadx'
            ? 'LeadX'
            : exp.project === 'prj-srm'
            ? 'Smart Review'
            : 'Company General',
        amount: exp.amount,
        scopeDisplay: formatINR(exp.amount),
        date: exp.date,
        statusLabel: 'Awaiting Sign-off',
        badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
      });
    }
  });

  // 3. Pending Compensation Payouts
  (STATE.team || []).forEach((mem) => {
    if ((mem.pendingCompensation || 0) > 0) {
      pendingItems.push({
        type: 'PAYOUT',
        rawType: 'payout',
        id: mem.id,
        title: `${mem.name} Monthly Compensation`,
        purpose: 'November 2026 Monthly Retainer',
        submittedBy: mem.name,
        project: mem.role,
        amount: mem.pendingCompensation,
        scopeDisplay: formatINR(mem.pendingCompensation),
        date: new Date().toISOString().split('T')[0],
        statusLabel: 'Disbursement Due',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
      });
    }
  });

  // 4. Pending Deliverable Tasks
  (STATE.assignedTasks || []).forEach((task) => {
    if (task.status === 'review_pending') {
      pendingItems.push({
        type: 'TASK',
        rawType: 'task',
        id: task.id,
        title: task.title,
        purpose: `Deliverable Review (${(task.priority || 'medium').toUpperCase()})`,
        submittedBy: task.assignedToName,
        project: task.projectName || 'LeadX',
        amount: 0,
        scopeDisplay: `Deliverable (${task.priority})`,
        date: task.dueDate || task.assignedDate,
        statusLabel: 'Review Pending',
        badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
      });
    }
  });

  // Update Summary Metrics
  if (metricsEl) {
    const totalPendingCount = pendingItems.length;
    const pendingInflowAmt = pendingItems
      .filter((i) => i.type === 'INCOME')
      .reduce((sum, i) => sum + i.amount, 0);
    const pendingExpenseAmt = pendingItems
      .filter((i) => i.type === 'EXPENSE')
      .reduce((sum, i) => sum + i.amount, 0);
    const pendingTaskCount = pendingItems.filter((i) => i.type === 'TASK').length;

    metricsEl.innerHTML = `
      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[11px] text-slate-500 font-medium">Total Pending Requests</span>
        <div class="text-xl font-black text-slate-900 dark:text-white mt-1">${totalPendingCount} Items</div>
        <div class="text-[10px] text-amber-600 mt-1 font-semibold">Requiring Founder Sign-off</div>
      </div>
      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[11px] text-slate-500 font-medium">Pending Client Inflows</span>
        <div class="text-xl font-black text-[#026047] dark:text-emerald-400 mt-1">${formatINR(pendingInflowAmt)}</div>
        <div class="text-[10px] text-slate-400 mt-1">Verified deals awaiting clearance</div>
      </div>
      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[11px] text-slate-500 font-medium">Pending Expenses & Payouts</span>
        <div class="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">${formatINR(pendingExpenseAmt)}</div>
        <div class="text-[10px] text-slate-400 mt-1">Outflow claims awaiting review</div>
      </div>
      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[11px] text-slate-500 font-medium">Pending Work Deliverables</span>
        <div class="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">${pendingTaskCount} Tasks</div>
        <div class="text-[10px] text-purple-500 mt-1">Submitted by Arshad & Vivek</div>
      </div>
    `;
  }

  // Filter items based on active category
  const filter = STATE.approvalFilter || 'ALL';
  const visibleItems =
    filter === 'ALL' ? pendingItems : pendingItems.filter((i) => i.type === filter);

  if (visibleItems.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="py-12 text-center text-slate-400 dark:text-slate-500">
          <div class="text-3xl mb-2">🎉</div>
          <div class="text-sm font-bold text-slate-700 dark:text-slate-300">No Pending Approvals in This Category</div>
          <p class="text-xs text-slate-400 mt-1">All company inflows, reimbursements and deliverable milestones are up to date and verified by Founder.</p>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = visibleItems
    .map(
      (item) => `
      <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
        <td class="py-3 px-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${item.badgeClass}">${item.type}</span>
        </td>
        <td class="py-3 px-3">
          <div class="font-bold text-slate-900 dark:text-white">${item.title}</div>
          <div class="text-[11px] text-slate-500">${item.purpose}</div>
        </td>
        <td class="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">${item.submittedBy}</td>
        <td class="py-3 px-3">
          <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]">${item.project}</span>
        </td>
        <td class="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">${item.scopeDisplay}</td>
        <td class="py-3 px-3 font-mono text-slate-500 text-[11px]">${item.date}</td>
        <td class="py-3 px-3 text-center">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            ${item.statusLabel}
          </span>
        </td>
        <td class="py-3 px-3 text-right whitespace-nowrap">
          <button onclick="approveApprovalItem('${item.rawType}', '${item.id}')"
            class="px-2.5 py-1 rounded-lg bg-[#026047] hover:bg-[#024d39] text-[#fffde8] font-bold text-[11px] transition inline-flex items-center gap-1 shadow-sm">
            <span>👑</span> Approve
          </button>
        </td>
      </tr>
    `
    )
    .join('') + renderLeadPipelineSection();
}
window.renderApprovals = renderApprovals;

function approveApprovalItem(type, id) {
  if (STATE.activeRole !== 'pranav') {
    showToast('Permission Denied: Only Founder & Director Pranav Bansode can sign off approvals.');
    return;
  }

  if (type === 'income') {
    const item = (STATE.income || []).find((i) => i.id === id);
    if (item) {
      item.status = 'received';
      item.approvedBy = 'Pranav Bansode (Founder)';
      item.approvedDate = new Date().toISOString().split('T')[0];
      STATE.auditLogs.unshift({
        id: 'log-' + Date.now(),
        action: 'INCOME_VERIFIED',
        details: `Founder approved client inflow ₹${item.amount.toLocaleString('en-IN')} from ${item.client} for ${item.projectName || item.project}`,
        performedBy: 'Pranav Bansode (Founder / Director)',
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      });
      showToast(`Approved: ${item.client} inflow of ${formatINR(item.amount)} verified!`);
    }
  } else if (type === 'expense') {
    const item = (STATE.expenses || []).find((e) => e.id === id);
    if (item) {
      item.status = 'approved';
      item.approvedBy = 'Pranav Bansode (Founder)';
      item.approvedDate = new Date().toISOString().split('T')[0];
      STATE.auditLogs.unshift({
        id: 'log-' + Date.now(),
        action: 'EXPENSE_APPROVED',
        details: `Founder approved expense ₹${item.amount.toLocaleString('en-IN')} for ${item.title}`,
        performedBy: 'Pranav Bansode (Founder / Director)',
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      });
      showToast(`Approved: Expense ${formatINR(item.amount)} approved!`);
    }
  } else if (type === 'payout') {
    if (typeof recordCompensationPayout === 'function') {
      recordCompensationPayout(id);
      return;
    }
  } else if (type === 'task') {
    const task = (STATE.assignedTasks || []).find((t) => t.id === id);
    if (task) {
      task.status = 'completed';
      task.completedDate = new Date().toISOString().split('T')[0];
      task.approvedBy = 'Pranav Bansode (Founder)';
      STATE.auditLogs.unshift({
        id: 'log-' + Date.now(),
        action: 'DELIVERABLE_APPROVED',
        details: `Founder approved deliverable: ${task.title} completed by ${task.assignedToName}`,
        performedBy: 'Pranav Bansode (Founder / Director)',
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      });
      saveAssignedTasksToStorage();
      showToast(`Approved: Deliverable "${task.title}" verified and completed!`);
    }
  }

  renderApprovals();
  renderSidebarNav(STATE.currentTab);
}
window.approveApprovalItem = approveApprovalItem;

function approveAllPendingRequests() {
  if (STATE.activeRole !== 'pranav') {
    showToast('Permission Denied: Only Founder & Director Pranav Bansode can sign off approvals.');
    return;
  }

  let count = 0;

  // 1. Inflows
  (STATE.income || []).forEach((i) => {
    if (i.status === 'pending_approval') {
      i.status = 'received';
      i.approvedBy = 'Pranav Bansode (Founder)';
      i.approvedDate = new Date().toISOString().split('T')[0];
      count++;
    }
  });

  // 2. Expenses
  (STATE.expenses || []).forEach((e) => {
    if (e.status === 'pending_approval') {
      e.status = 'approved';
      e.approvedBy = 'Pranav Bansode (Founder)';
      e.approvedDate = new Date().toISOString().split('T')[0];
      count++;
    }
  });

  // 3. Compensation Payouts
  (STATE.team || []).forEach((m) => {
    if ((m.pendingCompensation || 0) > 0) {
      const amt = m.pendingCompensation;
      STATE.payouts.unshift({
        id: 'pay-' + Date.now() + '-' + m.id,
        memberId: m.id,
        memberName: m.name,
        month: 'November 2026',
        amount: amt,
        paidDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'Bank Transfer (NEFT)',
        reference: `PTS-PAY-202611-${m.name.split(' ')[0].toUpperCase()}`,
        status: 'paid',
        authorizedBy: 'Pranav Bansode (Founder / Director)',
      });
      m.paymentsMade = (m.paymentsMade || 0) + amt;
      m.pendingCompensation = 0;
      count++;
    }
  });

  // 4. Tasks
  (STATE.assignedTasks || []).forEach((t) => {
    if (t.status === 'review_pending') {
      t.status = 'completed';
      t.completedDate = new Date().toISOString().split('T')[0];
      t.approvedBy = 'Pranav Bansode (Founder)';
      count++;
    }
  });

  if (count > 0) {
    saveAssignedTasksToStorage();
    STATE.auditLogs.unshift({
      id: 'log-' + Date.now(),
      action: 'BATCH_APPROVAL',
      details: `Founder Pranav Bansode batch approved ${count} pending corporate requests across inflows, expenses, comp and tasks in one row.`,
      performedBy: 'Pranav Bansode (Founder / Director)',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    });
    showToast(`⚡ Success: All ${count} pending requests approved in one row!`);
  } else {
    showToast('No pending approval requests to clear.');
  }

  renderApprovals();
  renderSidebarNav(STATE.currentTab);
}
window.approveAllPendingRequests = approveAllPendingRequests;

// ==============================================================================
// ASSIGN PROJECTS (FOUNDER VIEW - PRANAV BANSODE)
// Delegate project scopes, milestones and tasks to Arshad Shaikh & Vivek Gajdhane
// ==============================================================================
function renderAssignProjects() {
  const metricsEl = document.getElementById('assign-projects-metrics-container');
  const container = document.getElementById('assign-projects-container');
  if (!container) return;

  const memberFilter = document.getElementById('task-member-filter')?.value || 'ALL';
  const statusFilter = document.getElementById('task-status-filter')?.value || 'ALL';

  const allTasks = STATE.assignedTasks || [];

  // Update Metrics
  if (metricsEl) {
    const totalCount = allTasks.length;
    const inProgCount = allTasks.filter((t) => t.status === 'in_progress').length;
    const reviewCount = allTasks.filter((t) => t.status === 'review_pending').length;
    const completedCount = allTasks.filter((t) => t.status === 'completed').length;

    metricsEl.innerHTML = `
      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[11px] text-slate-500 font-medium">Total Delegated Work</span>
        <div class="text-xl font-black text-slate-900 dark:text-white mt-1">${totalCount} Tasks</div>
        <div class="text-[10px] text-slate-400 mt-1">LeadX & Smart Review</div>
      </div>
      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[11px] text-slate-500 font-medium">In Progress</span>
        <div class="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">${inProgCount} Tasks</div>
        <div class="text-[10px] text-blue-500 mt-1">Active team execution</div>
      </div>
      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[11px] text-slate-500 font-medium">Awaiting Review</span>
        <div class="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">${reviewCount} Tasks</div>
        <div class="text-[10px] text-amber-500 mt-1">Pending Founder Approval</div>
      </div>
      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[11px] text-slate-500 font-medium">Completed & Verified</span>
        <div class="text-xl font-black text-[#026047] dark:text-emerald-400 mt-1">${completedCount} Tasks</div>
        <div class="text-[10px] text-emerald-600 mt-1">100% Quality checked</div>
      </div>
    `;
  }

  // Filter Tasks
  let filtered = allTasks;
  if (memberFilter !== 'ALL') {
    filtered = filtered.filter((t) => t.assignedTo === memberFilter);
  }
  if (statusFilter !== 'ALL') {
    filtered = filtered.filter((t) => t.status === statusFilter);
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div class="text-3xl mb-2">📋</div>
        <div class="text-sm font-bold text-slate-700 dark:text-slate-300">No Tasks Match the Selected Filter</div>
        <p class="text-xs text-slate-400 mt-1">Click "+ Assign New Project / Task" above to delegate new deliverables to team members.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered
    .map((task) => {
      let priorityClass = 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
      if (task.priority === 'urgent')
        priorityClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
      else if (task.priority === 'high')
        priorityClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';

      let statusBadge = `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Assigned
        </span>
      `;
      if (task.status === 'in_progress') {
        statusBadge = `
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> In Progress
          </span>
        `;
      } else if (task.status === 'review_pending') {
        statusBadge = `
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <span class="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span> Review Pending
          </span>
        `;
      } else if (task.status === 'completed') {
        statusBadge = `
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span>✅</span> Completed & Verified
          </span>
        `;
      }

      return `
      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${priorityClass}">${task.priority}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">${task.projectName}</span>
            <span class="text-[11px] text-slate-400">Assigned: ${task.assignedDate}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[11px] text-slate-500">Due: <strong class="text-slate-900 dark:text-white">${task.dueDate}</strong></span>
            <button onclick="deleteAssignedTask('${task.id}')" class="p-1 rounded text-slate-400 hover:text-rose-600 transition" title="Delete Task">
              🗑️
            </button>
          </div>
        </div>

        <div>
          <h4 class="font-bold text-sm text-slate-900 dark:text-white">${task.title}</h4>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">${task.description}</p>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-[#026047] text-[#fffde8] flex items-center justify-center font-bold text-[10px]">
              ${task.assignedTo === 'mem-02' ? 'AS' : 'VG'}
            </div>
            <div>
              <span class="text-slate-500">Assigned To:</span>
              <strong class="text-slate-900 dark:text-white ml-1">${task.assignedToName}</strong>
            </div>
          </div>
          <div class="flex items-center gap-2">
            ${statusBadge}
            ${
              task.status === 'review_pending'
                ? `<button onclick="approveApprovalItem('task', '${task.id}')" class="px-2.5 py-1 rounded-lg bg-[#026047] hover:bg-[#024d39] text-[#fffde8] font-bold text-xs transition inline-flex items-center gap-1 shadow-sm">
                    <span>👑</span> Approve Deliverable
                  </button>`
                : ''
            }
          </div>
        </div>
      </div>
    `;
    })
    .join('') + renderLeadPipelineSection();
}
window.renderAssignProjects = renderAssignProjects;

function openAssignTaskModal() {
  const modal = document.getElementById('modal-assign-task');
  if (modal) {
    modal.classList.remove('hidden');
    const dueInput = document.getElementById('task-due-date');
    if (dueInput && !dueInput.value) {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      dueInput.value = d.toISOString().split('T')[0];
    }
  }
}
window.openAssignTaskModal = openAssignTaskModal;

function closeAssignTaskModal() {
  const modal = document.getElementById('modal-assign-task');
  if (modal) modal.classList.add('hidden');
}
window.closeAssignTaskModal = closeAssignTaskModal;

function submitAssignTask() {
  const title = document.getElementById('task-title')?.value.trim();
  const assignedTo = document.getElementById('task-assigned-to')?.value;
  const project = document.getElementById('task-project')?.value;
  const priority = document.getElementById('task-priority')?.value || 'medium';
  const dueDate = document.getElementById('task-due-date')?.value;
  const desc = document.getElementById('task-desc')?.value.trim();

  if (!title || !desc || !dueDate) {
    alert('Please fill out all task details.');
    return;
  }

  const assignedToName =
    assignedTo === 'mem-02' ? 'Arshad Shaikh' : 'Vivek Gajdhane';
  const projectName =
    project === 'prj-leadx'
      ? 'LeadX'
      : project === 'prj-srm'
      ? 'Smart Review Management'
      : 'General Operations';

  const newTask = {
    id: 'task-' + Date.now(),
    title: title,
    assignedTo: assignedTo,
    assignedToName: assignedToName,
    projectId: project,
    projectName: projectName,
    priority: priority,
    dueDate: dueDate,
    assignedDate: new Date().toISOString().split('T')[0],
    assignedBy: 'Pranav Bansode (Founder)',
    description: desc,
    status: 'assigned',
  };

  STATE.assignedTasks.unshift(newTask);

  // Sync insert to Supabase assigned_tasks table
  const sb = getSupabaseClient();
  if (sb) {
    const targetMemberUuid = MEMBER_UUID_MAP[assignedTo] || '00000000-0000-4000-8000-000000000002';
    const targetProjectUuid = PROJECT_UUID_MAP[project] || null;

    sb.from('assigned_tasks')
      .insert({
        title: title,
        description: desc || '',
        assigned_to: targetMemberUuid,
        project_id: targetProjectUuid,
        priority: priority || 'medium',
        status: 'assigned',
        due_date: dueDate || null
      })
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Supabase task insert error:', error.message);
          showToast(`⚠ Saved locally, but Supabase rejected write: ${error.message}`);
        } else if (data) {
          console.log('Task saved to Supabase DB, assigned_tasks ID:', data.id);
          newTask.id = data.id;
          showToast(`✅ Task successfully saved & synced to Supabase database!`);
        }
      });
  }

  STATE.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'TASK_ASSIGNED',
    details: `Founder assigned deliverable "${title}" to ${assignedToName} (${projectName})`,
    performedBy: 'Pranav Bansode (Founder / Director)',
    date: new Date().toISOString().replace('T', ' ').slice(0, 16),
  });

  closeAssignTaskModal();

  // Reset form inputs
  const titleInput = document.getElementById('task-title');
  if (titleInput) titleInput.value = '';
  const descInput = document.getElementById('task-desc');
  if (descInput) descInput.value = '';

  renderAssignProjects();
  renderSidebarNav(STATE.currentTab);
  saveAssignedTasksToStorage();
  showToast(`Deliverable successfully assigned to ${assignedToName}!`);
}
window.submitAssignTask = submitAssignTask;

function deleteAssignedTask(id) {
  if (!confirm('Are you sure you want to remove this delegated task?')) return;
  STATE.assignedTasks = (STATE.assignedTasks || []).filter((t) => t.id !== id);
  saveAssignedTasksToStorage();

  // Sync deletion to Supabase
  const sb = getSupabaseClient();
  if (sb && id && id.includes('-') && !id.startsWith('task-')) {
    sb.from('assigned_tasks').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Supabase delete error:', error.message);
    });
  }

  renderAssignProjects();
  renderSidebarNav(STATE.currentTab);
  showToast('Task removed from team workflow.');
}
window.deleteAssignedTask = deleteAssignedTask;

// ==============================================================================
// ALLOCATED WORK (EMPLOYEE VIEW - ARSHAD SHAIKH & VIVEK GAJDHANE)
// View tasks assigned by Founder Pranav Bansode & submit for director clearance
// ==============================================================================
function renderAllocatedWork() {
  const sessionPill = document.getElementById('allocated-work-session-pill');
  const metricsEl = document.getElementById('allocated-work-metrics');
  const container = document.getElementById('allocated-work-container');
  if (!container) return;

  const currentRole = STATE.activeRole || 'arshad';
  const currentMemberId = currentRole === 'arshad' ? 'mem-02' : (currentRole === 'aryan' ? 'mem-04' : 'mem-03');
  const currentMember =
    (STATE.team || []).find((m) => m.id === currentMemberId) || {
      name: currentRole === 'arshad' ? 'Arshad Shaikh' : (currentRole === 'aryan' ? 'Aryan Bhore' : 'Vivek Gajdhane'),
      designation: currentRole === 'arshad' ? 'Co-Founder / Marketing' : (currentRole === 'aryan' ? 'Research Lead' : 'Engineering & Architecture'),
    };
  const displayRole = currentMember.designation || currentMember.role || (currentRole === 'aryan' ? 'Research Lead' : 'Technical Department');

  if (sessionPill) {
    sessionPill.innerHTML = `
      <span>Allocated To: </span>
      <strong class="text-slate-900 dark:text-white font-black">${currentMember.name}</strong>
      <span class="text-[10px] text-slate-500 ml-1">(${displayRole})</span>
    `;
  }

  const myTasks = (STATE.assignedTasks || []).filter(
    (t) => t.assignedTo === currentMemberId
  );

  // Update Metrics
  if (metricsEl) {
    const totalCount = myTasks.length;
    const inProgCount = myTasks.filter((t) => t.status === 'in_progress').length;
    const reviewCount = myTasks.filter((t) => t.status === 'review_pending').length;
    const completedCount = myTasks.filter((t) => t.status === 'completed').length;

    metricsEl.innerHTML = `
      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[11px] text-slate-500 font-medium">My Assigned Work</span>
        <div class="text-xl font-black text-slate-900 dark:text-white mt-1">${totalCount} Tasks</div>
        <div class="text-[10px] text-slate-400 mt-1">Delegated by Founder Pranav</div>
      </div>
      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[11px] text-slate-500 font-medium">In Progress</span>
        <div class="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">${inProgCount} Tasks</div>
        <div class="text-[10px] text-blue-500 mt-1">Currently being worked on</div>
      </div>
      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[11px] text-slate-500 font-medium">Submitted for Approval</span>
        <div class="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">${reviewCount} Tasks</div>
        <div class="text-[10px] text-amber-500 mt-1">Awaiting Founder clearance</div>
      </div>
      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[11px] text-slate-500 font-medium">Approved & Verified</span>
        <div class="text-xl font-black text-[#026047] dark:text-emerald-400 mt-1">${completedCount} Tasks</div>
        <div class="text-[10px] text-emerald-600 mt-1">Founder Sign-off Granted</div>
      </div>
    `;
  }

  if (myTasks.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div class="text-3xl mb-2">🎉</div>
        <div class="text-sm font-bold text-slate-700 dark:text-slate-300">No Pending Tasks Assigned</div>
        <p class="text-xs text-slate-400 mt-1">You are all caught up! Work delegated to you by Founder Pranav Bansode will appear here automatically.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = myTasks
    .map((task) => {
      let priorityClass = 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
      if (task.priority === 'urgent')
        priorityClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
      else if (task.priority === 'high')
        priorityClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';

      let actionControl = '';
      if (task.status === 'assigned') {
        actionControl = `
          <button onclick="updateTaskStatus('${task.id}', 'in_progress')"
            class="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm">
            <span>▶️</span> Start Work
          </button>
        `;
      } else if (task.status === 'in_progress') {
        actionControl = `
          <button onclick="updateTaskStatus('${task.id}', 'review_pending')"
            class="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm">
            <span>📤</span> Submit for Founder Approval
          </button>
        `;
      } else if (task.status === 'review_pending') {
        actionControl = `
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold text-xs">
            <span class="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            <span>⏳ Awaiting Founder Pranav's Approval</span>
          </div>
        `;
      } else if (task.status === 'completed') {
        actionControl = `
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
            <span>✅</span> Completed & Verified by Director
          </div>
        `;
      }

      return `
      <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${priorityClass}">${task.priority}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">${task.projectName}</span>
            <span class="text-[11px] text-slate-400">Assigned: ${task.assignedDate}</span>
          </div>
          <div class="text-[11px] text-slate-500">
            Target Due Date: <strong class="text-slate-900 dark:text-white font-bold">${task.dueDate}</strong>
          </div>
        </div>

        <div>
          <h4 class="font-bold text-sm text-slate-900 dark:text-white">${task.title}</h4>
          <div class="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <div class="font-bold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Founder's Instructions:</div>
            ${task.description}
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
          <div class="flex items-center gap-2 text-slate-500">
            <span>Delegated By:</span>
            <span class="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-[#026047] dark:text-emerald-300 font-bold text-[11px]">👑 Pranav Bansode (Founder)</span>
          </div>
          <div>
            ${actionControl}
          </div>
        </div>
      </div>
    `;
    })
    .join('') + renderLeadPipelineSection();
}
window.renderAllocatedWork = renderAllocatedWork;

function updateTaskStatus(taskId, newStatus) {
  const task = (STATE.assignedTasks || []).find((t) => t.id === taskId);
  if (!task) return;

  task.status = newStatus;
  saveAssignedTasksToStorage();

  // Sync status update to Supabase
  const sb = getSupabaseClient();
  if (sb && task.id && task.id.includes('-') && !task.id.startsWith('task-')) {
    sb.from('assigned_tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', task.id)
      .then(({ error }) => {
        if (error) console.warn('Supabase update task status error:', error.message);
      });
  }

  if (newStatus === 'in_progress') {
    showToast(`Started work on: "${task.title}"`);
  } else if (newStatus === 'review_pending') {
    showToast(`Submitted "${task.title}" for Founder Pranav Bansode's approval!`);
    STATE.auditLogs.unshift({
      id: 'log-' + Date.now(),
      action: 'DELIVERABLE_SUBMITTED',
      details: `${task.assignedToName} submitted deliverable "${task.title}" for Founder review.`,
      performedBy: task.assignedToName,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    });
  }

  renderAllocatedWork();
  renderSidebarNav(STATE.currentTab);
}
window.updateTaskStatus = updateTaskStatus;

// ==============================================================================
// 3B. CLIENT LEADS & 4-STEP DELIVERY PIPELINE (ARYAN -> PRANAV -> VIVEK -> ARSHAD -> PRANAV)
// 1. Aryan scouts & inputs lead in portal -> Sent directly to Founder Pranav
// 2. Founder Pranav reviews & allocates work to Vivek (Tech)
// 3. Vivek finishes tech development -> Forwards to Arshad & auto-notifies Founder Pranav
// 4. Arshad reviews deal & Founder Pranav approves for final client delivery
// ==============================================================================

function renderLeadPipelineSection() {
  const currentRole = STATE.activeRole || 'pranav';
  const leads = STATE.leads || [];

  const totalLeads = leads.length;
  const awaitingAllocation = leads.filter((l) => l.status === 'submitted_to_founder').length;
  const inTechDev = leads.filter((l) => l.status === 'allocated_to_vivek').length;
  const awaitingFinalSignoff = leads.filter((l) => l.status === 'sent_to_arshad_notified_founder').length;
  const approvedCount = leads.filter((l) => l.status === 'approved_for_delivery').length;

  return `
    <div class="mt-6 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
      <!-- Section Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-[#026047] dark:text-emerald-300 text-base">🎯</span>
            <h3 class="text-base font-black text-slate-900 dark:text-white">Client Acquisition & 4-Step Delivery Pipeline</h3>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#fffde8] text-[#026047] border border-[#026047]/30">4-STAGE PIPELINE</span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            <strong>Stage 1:</strong> Aryan (Scout) ➔ <strong>Stage 2:</strong> Pranav (Allocate to Vivek) ➔ <strong>Stage 3:</strong> Vivek (Tech Dev ➔ Forward to Arshad & Notify Pranav) ➔ <strong>Stage 4:</strong> Pranav (Final Delivery Approval)
          </p>
        </div>
        <div class="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button onclick="openNewLeadModal()"
            class="px-3.5 py-1.5 rounded-xl bg-[#026047] text-[#fffde8] font-bold text-xs hover:bg-[#024d39] transition shadow-sm flex items-center gap-1.5 cursor-pointer">
            <span>+</span>
            <span>Submit Client Lead</span>
          </button>
        </div>
      </div>

      <!-- Pipeline Status Metric Pills -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <span class="text-[10px] text-slate-400 uppercase font-bold">Total Deals</span>
          <div class="text-lg font-black text-slate-900 dark:text-white mt-0.5">${totalLeads} Leads</div>
          <span class="text-[10px] text-slate-500 block mt-0.5">Scouted by Aryan</span>
        </div>
        <div class="p-3 rounded-xl ${awaitingAllocation > 0 ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-300' : 'bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800'}">
          <span class="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-bold">Stage 1: To Allocate</span>
          <div class="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">${awaitingAllocation} Leads</div>
          <span class="text-[10px] text-amber-700 dark:text-amber-300 block mt-0.5">Founder Pranav's Queue</span>
        </div>
        <div class="p-3 rounded-xl ${inTechDev > 0 ? 'bg-purple-50 dark:bg-purple-950/30 border border-purple-300' : 'bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800'}">
          <span class="text-[10px] text-purple-700 dark:text-purple-400 uppercase font-bold">Stage 2: Tech Dev</span>
          <div class="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5">${inTechDev} In Build</div>
          <span class="text-[10px] text-purple-600 dark:text-purple-300 block mt-0.5">Vivek's Workdesk</span>
        </div>
        <div class="p-3 rounded-xl ${awaitingFinalSignoff > 0 ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-300' : 'bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800'}">
          <span class="text-[10px] text-blue-700 dark:text-blue-400 uppercase font-bold">Stage 3: Review</span>
          <div class="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">${awaitingFinalSignoff} Pending</div>
          <span class="text-[10px] text-blue-600 dark:text-blue-300 block mt-0.5">Arshad & Founder</span>
        </div>
        <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300">
          <span class="text-[10px] text-[#026047] dark:text-emerald-400 uppercase font-bold">Stage 4: Delivered</span>
          <div class="text-lg font-black text-[#026047] dark:text-emerald-300 mt-0.5">${approvedCount} Signed Off</div>
          <span class="text-[10px] text-emerald-700 dark:text-emerald-400 block mt-0.5">Founder Approved</span>
        </div>
      </div>

      <!-- Leads Cards List -->
      <div class="space-y-4">
        ${leads.length === 0 ? `
          <div class="p-10 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <span class="text-3xl block mb-2">🎯</span>
            <div class="font-bold text-sm text-slate-700 dark:text-slate-300">No Client Leads in Pipeline</div>
            <p class="text-xs text-slate-400 mt-1">Aryan Bhore scouts new leads and submits them directly to Founder Pranav for technical allocation.</p>
            <button onclick="openNewLeadModal()" class="mt-3 px-3 py-1.5 rounded-lg bg-[#026047] text-[#fffde8] text-xs font-bold shadow-sm">
              + Submit First Lead
            </button>
          </div>
        ` : leads.map((lead) => renderSingleLeadCard(lead, currentRole)).join('')}
      </div>
    </div>
  `;
}
window.renderLeadPipelineSection = renderLeadPipelineSection;

function renderSingleLeadCard(lead, currentRole) {
  const isPranav = currentRole === 'pranav';
  const isVivek = currentRole === 'vivek';
  const isArshad = currentRole === 'arshad';
  const isAryan = currentRole === 'aryan';

  // 4 Stages:
  // 1. submitted_to_founder (Aryan -> Pranav)
  // 2. allocated_to_vivek (Pranav -> Vivek)
  // 3. sent_to_arshad_notified_founder (Vivek -> Arshad, Founder Notified)
  // 4. approved_for_delivery (Founder Pranav Final Sign-off)

  const s1Done = true; // submitted by Aryan
  const s2Done = lead.status === 'allocated_to_vivek' || lead.status === 'sent_to_arshad_notified_founder' || lead.status === 'approved_for_delivery';
  const s3Done = lead.status === 'sent_to_arshad_notified_founder' || lead.status === 'approved_for_delivery';
  const s4Done = lead.status === 'approved_for_delivery';

  let currentStageText = 'Stage 1: Awaiting Founder Allocation';
  let badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
  if (lead.status === 'allocated_to_vivek') {
    currentStageText = 'Stage 2: Technical Development (Vivek)';
    badgeColor = 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300';
  } else if (lead.status === 'sent_to_arshad_notified_founder') {
    currentStageText = 'Stage 3: Forwarded to Arshad • Founder Notified';
    badgeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300';
  } else if (lead.status === 'approved_for_delivery') {
    currentStageText = 'Stage 4: Approved for Delivery';
    badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300';
  }

  return `
    <div class="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4 hover:border-[#026047]/40 transition">
      <!-- Top Row: Lead Number, Client Name, Value & Stage Badge -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700 pb-3">
        <div class="flex items-center gap-2.5 flex-wrap">
          <span class="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">${lead.leadNumber || 'LEAD'}</span>
          <h4 class="font-black text-sm text-slate-900 dark:text-white">${lead.clientName}</h4>
          <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fffde8] text-[#026047] border border-[#026047]/30">${lead.productType}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-black text-[#026047] dark:text-emerald-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            Est: ${formatINR(lead.dealValue)}
          </span>
          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeColor}">
            ${currentStageText}
          </span>
        </div>
      </div>

      <!-- 4-Step Interactive Progress Stepper Bar -->
      <div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
          <!-- Step 1 -->
          <div class="flex items-center gap-2 p-2 rounded-lg ${s1Done ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 opacity-60'}">
            <span class="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${s1Done ? 'bg-[#026047] text-white' : 'bg-slate-300 text-slate-600'}">✓</span>
            <div>
              <div class="font-bold text-slate-900 dark:text-white">1. Aryan Scouted</div>
              <div class="text-[10px] text-slate-500">Lead Entered</div>
            </div>
          </div>
          <!-- Step 2 -->
          <div class="flex items-center gap-2 p-2 rounded-lg ${s2Done ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800' : (lead.status === 'submitted_to_founder' ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 animate-pulse' : 'bg-slate-100 opacity-60')}">
            <span class="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${s2Done ? 'bg-[#026047] text-white' : 'bg-amber-500 text-white'}">
              ${s2Done ? '✓' : '2'}
            </span>
            <div>
              <div class="font-bold text-slate-900 dark:text-white">2. Pranav Allocates</div>
              <div class="text-[10px] text-slate-500">${s2Done ? 'Assigned to Vivek' : 'Awaiting Pranav'}</div>
            </div>
          </div>
          <!-- Step 3 -->
          <div class="flex items-center gap-2 p-2 rounded-lg ${s3Done ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800' : (lead.status === 'allocated_to_vivek' ? 'bg-purple-50 dark:bg-purple-950/40 border border-purple-300 animate-pulse' : 'bg-slate-100 opacity-60')}">
            <span class="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${s3Done ? 'bg-[#026047] text-white' : 'bg-purple-500 text-white'}">
              ${s3Done ? '✓' : '3'}
            </span>
            <div>
              <div class="font-bold text-slate-900 dark:text-white">3. Vivek Tech Complete</div>
              <div class="text-[10px] text-slate-500">${s3Done ? 'Sent to Arshad' : 'In Dev by Vivek'}</div>
            </div>
          </div>
          <!-- Step 4 -->
          <div class="flex items-center gap-2 p-2 rounded-lg ${s4Done ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800' : (lead.status === 'sent_to_arshad_notified_founder' ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-300 animate-pulse' : 'bg-slate-100 opacity-60')}">
            <span class="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${s4Done ? 'bg-[#026047] text-white' : 'bg-blue-500 text-white'}">
              ${s4Done ? '✓' : '4'}
            </span>
            <div>
              <div class="font-bold text-slate-900 dark:text-white">4. Delivery Sign-off</div>
              <div class="text-[10px] text-slate-500">${s4Done ? 'Founder Approved' : 'Final Review'}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Details Summary & Requirements Box -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div class="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div class="flex justify-between text-slate-500">
            <span>Contact Person:</span>
            <strong class="text-slate-900 dark:text-white">${lead.contactPerson || '—'}</strong>
          </div>
          <div class="flex justify-between text-slate-500">
            <span>Phone / WhatsApp:</span>
            <span class="font-mono text-slate-900 dark:text-white">${lead.phone || '—'}</span>
          </div>
          <div class="flex justify-between text-slate-500">
            <span>Lead Scouted By:</span>
            <strong class="text-emerald-700 dark:text-emerald-400">${lead.submittedBy || 'Aryan Bhore'}</strong>
          </div>
          <p class="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <strong>Scope / Pain points:</strong> ${lead.requirements}
          </p>
        </div>

        <div class="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
          ${lead.founderInstructions ? `
            <div class="text-[11px]">
              <span class="font-bold text-amber-700 dark:text-amber-400">👑 Founder's Technical Scope (For Vivek):</span>
              <p class="text-slate-700 dark:text-slate-300 mt-0.5">${lead.founderInstructions}</p>
              <div class="text-[10px] text-slate-400 mt-1">Due Date: <strong>${lead.dueDate || '—'}</strong> • Priority: <strong>${lead.priority || 'high'}</strong></div>
            </div>
          ` : `
            <div class="text-slate-400 text-xs italic py-2">
              Awaiting Founder Pranav Bansode to review and assign technical development instructions to Vivek.
            </div>
          `}

          ${lead.deliverableUrl ? `
            <div class="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <span class="font-bold text-purple-700 dark:text-purple-300">💻 Vivek's Technical Deliverable:</span>
              <div class="mt-0.5"><a href="${lead.deliverableUrl}" target="_blank" class="text-blue-600 dark:text-blue-400 font-mono underline break-all">${lead.deliverableUrl}</a></div>
              <p class="text-slate-600 dark:text-slate-400 text-[10px] mt-0.5">${lead.techNotes || ''}</p>
              <div class="text-[10px] text-emerald-600 font-bold mt-1">✓ Sent to Arshad Shaikh • Founder Pranav Notified</div>
            </div>
          ` : ''}

          ${lead.arshadChecked ? `
            <div class="text-[10px] text-blue-700 dark:text-blue-400 font-bold">
              ✓ Arshad Shaikh verified client packaging & pricing alignment.
            </div>
          ` : ''}

          ${lead.approvedBy ? `
            <div class="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-[11px] font-bold text-[#026047] dark:text-emerald-300 flex items-center gap-1.5">
              <span>👑</span> Approved for Final Client Delivery by ${lead.approvedBy} on ${formatDate(lead.approvedAt)}
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Action Buttons Row (Interactive for each role in the 4 steps) -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700">
        <div class="text-xs text-slate-500">
          Current Assigned Action:
          <strong class="text-slate-900 dark:text-white">
            ${lead.status === 'submitted_to_founder' ? 'Founder Pranav allocates technical work to Vivek' : ''}
            ${lead.status === 'allocated_to_vivek' ? 'Vivek Gajdhane completes technical build & submits' : ''}
            ${lead.status === 'sent_to_arshad_notified_founder' ? 'Arshad reviews & Founder Pranav gives final sign-off' : ''}
            ${lead.status === 'approved_for_delivery' ? 'Project successfully delivered to client!' : ''}
          </strong>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <!-- Step 1 to 2: Pranav allocates to Vivek -->
          ${lead.status === 'submitted_to_founder' && isPranav ? `
            <button onclick="openAllocateLeadModal('${lead.id}')"
              class="px-3.5 py-1.5 rounded-xl bg-[#026047] text-[#fffde8] font-bold text-xs hover:bg-[#024d39] transition shadow-sm flex items-center gap-1 cursor-pointer">
              <span>👑</span> Allocate to Vivek (Tech)
            </button>
          ` : ''}

          <!-- Step 2 to 3: Vivek (or Founder) completes tech & forwards to Arshad, notifying Founder -->
          ${lead.status === 'allocated_to_vivek' && (isVivek || isPranav) ? `
            <button onclick="openTechForwardModal('${lead.id}')"
              class="px-3.5 py-1.5 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 transition shadow-sm flex items-center gap-1 cursor-pointer">
              <span>💻</span> Deliver Tech & Forward to Arshad
            </button>
          ` : ''}

          <!-- Step 3: Arshad verifies deal alignment -->
          ${lead.status === 'sent_to_arshad_notified_founder' && (isArshad || isPranav) && !lead.arshadChecked ? `
            <button onclick="confirmArshadCheck('${lead.id}')"
              class="px-3 py-1.5 rounded-xl bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition shadow-sm flex items-center gap-1 cursor-pointer">
              <span>🤝</span> Verify Deal Alignment
            </button>
          ` : ''}

          <!-- Step 4: Founder Pranav final delivery sign-off -->
          ${lead.status === 'sent_to_arshad_notified_founder' && isPranav ? `
            <button onclick="openDeliveryApprovalModal('${lead.id}')"
              class="px-3.5 py-1.5 rounded-xl bg-[#026047] text-[#fffde8] font-black text-xs hover:bg-[#024d39] transition shadow-sm flex items-center gap-1 cursor-pointer">
              <span>👑</span> Approve for Delivery
            </button>
          ` : ''}

          ${lead.status === 'approved_for_delivery' ? `
            <span class="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs flex items-center gap-1">
              <span>✓</span> Delivery Complete & Signed Off
            </span>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}
window.renderSingleLeadCard = renderSingleLeadCard;

// Modal Controls & Form Submissions
window.openNewLeadModal = function () {
  const modal = document.getElementById('modal-new-lead');
  if (modal) modal.classList.remove('hidden');
};

window.closeNewLeadModal = function () {
  const modal = document.getElementById('modal-new-lead');
  if (modal) modal.classList.add('hidden');
};

window.submitClientLead = function () {
  const clientName = document.getElementById('lead-client-name')?.value.trim();
  const contactPerson = document.getElementById('lead-contact-person')?.value.trim();
  const phone = document.getElementById('lead-phone')?.value.trim();
  const product = document.getElementById('lead-product')?.value;
  const dealValue = parseFloat(document.getElementById('lead-deal-value')?.value) || 0;
  const requirements = document.getElementById('lead-requirements')?.value.trim();

  if (!clientName || !requirements || !phone) {
    alert('Please fill out all required fields.');
    return;
  }

  const newLeadId = 'lead-' + Date.now();
  const leadNum = 'LEAD-2026-' + String((STATE.leads || []).length + 1).padStart(3, '0');

  const newLead = {
    id: newLeadId,
    leadNumber: leadNum,
    clientName: clientName,
    contactPerson: contactPerson,
    phone: phone,
    productType: product,
    dealValue: dealValue,
    requirements: requirements,
    submittedBy: STATE.activeRole === 'aryan' ? 'Aryan Bhore' : (STATE.activeRole === 'pranav' ? 'Pranav Bansode' : 'Aryan Bhore'),
    submittedAt: new Date().toISOString(),
    status: 'submitted_to_founder' // Step 1 complete -> Sent to Founder
  };

  STATE.leads.unshift(newLead);
  saveLeadsToStorage();

  // Audit Log
  STATE.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'LEAD_SUBMITTED',
    details: `${newLead.submittedBy} submitted new client lead "${clientName}" (${formatINR(dealValue)}) directly to Founder Pranav Bansode.`,
    performedBy: newLead.submittedBy,
    date: new Date().toISOString().replace('T', ' ').slice(0, 16)
  });

  closeNewLeadModal();

  // Reset form
  const form = document.querySelector('#modal-new-lead form');
  if (form) form.reset();

  showToast(`🎯 Lead "${clientName}" submitted! Routed directly to Founder Pranav Bansode for allocation.`);

  renderCurrentTab();
};

window.openAllocateLeadModal = function (leadId) {
  if (STATE.activeRole !== 'pranav') {
    alert('Only Founder Pranav Bansode can allocate project technical work.');
    return;
  }
  const lead = (STATE.leads || []).find((l) => l.id === leadId);
  if (!lead) return;

  const idInput = document.getElementById('allocate-lead-id');
  if (idInput) idInput.value = lead.id;

  const clientDisplay = document.getElementById('allocate-lead-client-display');
  if (clientDisplay) clientDisplay.textContent = `${lead.clientName} (${lead.productType} • ${formatINR(lead.dealValue)})`;

  const scoutDisplay = document.getElementById('allocate-lead-scout-display');
  if (scoutDisplay) scoutDisplay.textContent = `${lead.submittedBy || 'Aryan Bhore'}`;

  const dueInput = document.getElementById('allocate-due-date');
  if (dueInput && !dueInput.value) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    dueInput.value = d.toISOString().split('T')[0];
  }

  const modal = document.getElementById('modal-allocate-lead');
  if (modal) modal.classList.remove('hidden');
};

window.closeAllocateLeadModal = function () {
  const modal = document.getElementById('modal-allocate-lead');
  if (modal) modal.classList.add('hidden');
};

window.confirmAllocateLeadToVivek = function () {
  if (STATE.activeRole !== 'pranav') {
    alert('Security Gate: Only Founder & Director Pranav Bansode can allocate leads to Vivek.');
    return;
  }
  const leadId = document.getElementById('allocate-lead-id')?.value;
  const instructions = document.getElementById('allocate-founder-instructions')?.value.trim();
  const dueDate = document.getElementById('allocate-due-date')?.value;
  const priority = document.getElementById('allocate-priority')?.value || 'high';

  if (!instructions || !dueDate) {
    alert('Please provide instructions and due date for Vivek.');
    return;
  }

  const lead = (STATE.leads || []).find((l) => l.id === leadId);
  if (!lead) return;

  lead.status = 'allocated_to_vivek';
  lead.founderInstructions = instructions;
  lead.dueDate = dueDate;
  lead.priority = priority;
  lead.allocatedAt = new Date().toISOString();
  lead.allocatedTo = 'mem-03';
  lead.allocatedToName = 'Vivek Gajdhane';

  // Automatically create linked delegated task in STATE.assignedTasks for Vivek
  const newTask = {
    id: 'task-lead-' + Date.now(),
    title: `Develop ${lead.productType} for ${lead.clientName}`,
    assignedTo: 'mem-03',
    assignedToName: 'Vivek Gajdhane',
    projectId: lead.productType.includes('Smart Review') ? 'prj-srm' : 'prj-leadx',
    projectName: lead.productType,
    priority: priority,
    dueDate: dueDate,
    assignedDate: new Date().toISOString().split('T')[0],
    assignedBy: 'Pranav Bansode (Founder)',
    description: `[Allocated from Aryan's Lead ${lead.leadNumber}]: ${instructions}`,
    status: 'in_progress',
    leadId: lead.id
  };

  STATE.assignedTasks.unshift(newTask);
  saveAssignedTasksToStorage();
  saveLeadsToStorage();

  // Audit log
  STATE.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'LEAD_ALLOCATED',
    details: `Founder Pranav allocated technical development of "${lead.clientName}" to Vivek Gajdhane.`,
    performedBy: 'Pranav Bansode (Founder / Director)',
    date: new Date().toISOString().replace('T', ' ').slice(0, 16)
  });

  closeAllocateLeadModal();
  showToast(`🚀 Work allocated to Vivek Gajdhane! Vivek notified in his engineering workspace.`);

  renderCurrentTab();
  renderSidebarNav(STATE.currentTab);
};

window.openTechForwardModal = function (leadId) {
  const lead = (STATE.leads || []).find((l) => l.id === leadId);
  if (!lead) return;

  const idInput = document.getElementById('forward-lead-id');
  if (idInput) idInput.value = lead.id;

  const clientDisplay = document.getElementById('forward-lead-client-display');
  if (clientDisplay) clientDisplay.textContent = `${lead.clientName} (${lead.productType})`;

  const modal = document.getElementById('modal-tech-forward');
  if (modal) modal.classList.remove('hidden');
};

window.closeTechForwardModal = function () {
  const modal = document.getElementById('modal-tech-forward');
  if (modal) modal.classList.add('hidden');
};

window.confirmTechForward = function () {
  if (STATE.activeRole !== 'vivek' && STATE.activeRole !== 'pranav') {
    alert('Security Gate: Only Vivek Gajdhane or Founder Pranav can submit technical deliverables.');
    return;
  }
  const leadId = document.getElementById('forward-lead-id')?.value;
  const deliverableUrl = document.getElementById('forward-tech-deliverable-url')?.value.trim();
  const techNotes = document.getElementById('forward-tech-notes')?.value.trim();

  if (!deliverableUrl || !techNotes) {
    alert('Please enter deliverable URL and technical implementation summary.');
    return;
  }

  const lead = (STATE.leads || []).find((l) => l.id === leadId);
  if (!lead) return;

  lead.status = 'sent_to_arshad_notified_founder';
  lead.deliverableUrl = deliverableUrl;
  lead.techNotes = techNotes;
  lead.techCompletedAt = new Date().toISOString();
  lead.founderNotified = true;

  // Update linked task in STATE.assignedTasks
  const linkedTask = (STATE.assignedTasks || []).find((t) => t.leadId === lead.id || t.title.includes(lead.clientName));
  if (linkedTask) {
    linkedTask.status = 'review_pending';
    saveAssignedTasksToStorage();
  }

  saveLeadsToStorage();

  // Audit log
  STATE.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'TECH_DELIVERED_FORWARDED',
    details: `Vivek completed technical development for "${lead.clientName}". Forwarded to Arshad Shaikh; Founder Pranav notified.`,
    performedBy: 'Vivek Gajdhane (Technical Dept)',
    date: new Date().toISOString().replace('T', ' ').slice(0, 16)
  });

  closeTechForwardModal();
  showToast(`📤 Technical deliverables submitted to Arshad Shaikh! Founder Pranav Bansode notified.`);

  renderCurrentTab();
  renderSidebarNav(STATE.currentTab);
};

window.confirmArshadCheck = function (leadId) {
  if (STATE.activeRole !== 'arshad' && STATE.activeRole !== 'pranav') {
    alert('Security Gate: Only Arshad Shaikh (Co-Founder) or Founder Pranav can verify commercial deal alignment.');
    return;
  }
  const lead = (STATE.leads || []).find((l) => l.id === leadId);
  if (!lead) return;

  lead.arshadChecked = true;
  lead.arshadCheckedAt = new Date().toISOString();
  saveLeadsToStorage();

  STATE.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'LEAD_CLIENT_CHECK',
    details: `Arshad Shaikh verified commercial packaging & deal alignment for "${lead.clientName}".`,
    performedBy: 'Arshad Shaikh (Co-Founder)',
    date: new Date().toISOString().replace('T', ' ').slice(0, 16)
  });

  showToast(`🤝 Arshad confirmed deal alignment for "${lead.clientName}"! Awaiting Founder Pranav's final delivery approval.`);
  renderCurrentTab();
};

window.openDeliveryApprovalModal = function (leadId) {
  if (STATE.activeRole !== 'pranav') {
    alert('Only Founder & Director Pranav Bansode can grant final delivery sign-off.');
    return;
  }
  const lead = (STATE.leads || []).find((l) => l.id === leadId);
  if (!lead) return;

  const idInput = document.getElementById('delivery-lead-id');
  if (idInput) idInput.value = lead.id;

  const clientDisplay = document.getElementById('delivery-lead-client-display');
  if (clientDisplay) clientDisplay.textContent = `${lead.clientName} (${lead.productType} • ${formatINR(lead.dealValue)})`;

  const flowSummary = document.getElementById('delivery-lead-flow-summary');
  if (flowSummary) {
    flowSummary.innerHTML = `
      <div class="space-y-1 text-slate-600 dark:text-slate-300">
        <div>🎯 <strong>Lead Scouted:</strong> By ${lead.submittedBy || 'Aryan Bhore'} (${formatDate(lead.submittedAt)})</div>
        <div>👑 <strong>Technical Allocation:</strong> Assigned to Vivek with scope: "${lead.founderInstructions || 'Core deliverables'}"</div>
        <div>💻 <strong>Vivek's Deliverables:</strong> <a href="${lead.deliverableUrl || '#'}" target="_blank" class="text-blue-600 underline font-mono">${lead.deliverableUrl || 'Completed build'}</a></div>
        <div>🤝 <strong>Arshad Alignment:</strong> ${lead.arshadChecked ? '✓ Checked & Verified' : 'Standard packaging verified'}</div>
      </div>
    `;
  }

  const modal = document.getElementById('modal-delivery-approval');
  if (modal) modal.classList.remove('hidden');
};

window.closeDeliveryApprovalModal = function () {
  const modal = document.getElementById('modal-delivery-approval');
  if (modal) modal.classList.add('hidden');
};

window.confirmDeliveryApproval = function () {
  if (STATE.activeRole !== 'pranav') {
    alert('Security Gate: Only Founder & Director Pranav Bansode can grant final delivery sign-off.');
    return;
  }
  const leadId = document.getElementById('delivery-lead-id')?.value;
  const lead = (STATE.leads || []).find((l) => l.id === leadId);
  if (!lead) return;

  lead.status = 'approved_for_delivery';
  lead.approvedBy = 'Pranav Bansode (Founder & Director)';
  lead.approvedAt = new Date().toISOString();

  // Mark linked task completed
  const linkedTask = (STATE.assignedTasks || []).find((t) => t.leadId === lead.id || t.title.includes(lead.clientName));
  if (linkedTask) {
    linkedTask.status = 'completed';
    saveAssignedTasksToStorage();
  }

  // Also automatically enroll revenue deal in STATE.income if not exists
  const existsIncome = (STATE.income || []).some((i) => i.clientName === lead.clientName);
  if (!existsIncome && lead.dealValue > 0) {
    STATE.income.unshift({
      id: 'inc-deal-' + Date.now(),
      clientName: lead.clientName,
      projectId: lead.productType.includes('Smart Review') ? 'prj-srm' : 'prj-leadx',
      projectName: lead.productType,
      amount: lead.dealValue,
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'received',
      paymentMethod: 'Bank Wire / NEFT',
      invoiceNumber: 'INV-2026-' + String((STATE.income || []).length + 101),
      description: `Project delivery finalized & approved for client ${lead.clientName}`
    });
  }

  saveLeadsToStorage();

  STATE.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'DELIVERY_APPROVED',
    details: `Founder Pranav Bansode gave final delivery sign-off for client "${lead.clientName}" (${formatINR(lead.dealValue)}).`,
    performedBy: 'Pranav Bansode (Founder & Director)',
    date: new Date().toISOString().replace('T', ' ').slice(0, 16)
  });

  closeDeliveryApprovalModal();
  showToast(`👑 Final delivery approved for ${lead.clientName}! Revenue deal enrolled.`);

  renderCurrentTab();
  renderSidebarNav(STATE.currentTab);
};


// ==============================================================================
// 4. SALES DONE (PRODUCT REVENUE & CLIENT DEALS) - LIST PATTERN
// Master list pattern for all sales completed across LeadX & Smart Review products
// ==============================================================================
STATE.salesSearch = STATE.salesSearch || '';
STATE.salesProductFilter = STATE.salesProductFilter || 'ALL';
STATE.salesStatusFilter = STATE.salesStatusFilter || 'ALL';
STATE.expandedSaleIds = STATE.expandedSaleIds || {};

window.toggleSaleDetails = function (saleId) {
  STATE.expandedSaleIds[saleId] = !STATE.expandedSaleIds[saleId];
  renderSalesDone();
};

window.filterSalesProduct = function (prod) {
  STATE.salesProductFilter = prod;
  renderSalesDone();
};

window.filterSalesStatus = function (status) {
  STATE.salesStatusFilter = status;
  renderSalesDone();
};

window.handleSalesSearch = function (q) {
  STATE.salesSearch = (q || '').toLowerCase();
  renderSalesDone();
};

function renderSalesDone() {
  const container = document.getElementById('sales-done-container');
  if (!container) return;

  const allSales = STATE.income || [];

  // Metrics
  const totalSalesVal = allSales.reduce((sum, s) => sum + s.amount, 0);
  const receivedVal = allSales
    .filter((s) => s.status === 'received')
    .reduce((sum, s) => sum + s.amount, 0);
  const leadxSales = allSales.filter((s) => s.projectId === 'prj-leadx');
  const leadxVal = leadxSales.reduce((sum, s) => sum + s.amount, 0);
  const srmSales = allSales.filter((s) => s.projectId === 'prj-srm');
  const srmVal = srmSales.reduce((sum, s) => sum + s.amount, 0);

  // Filtering
  let visible = allSales;
  if (STATE.salesProductFilter !== 'ALL') {
    visible = visible.filter((s) => s.projectId === STATE.salesProductFilter);
  }
  if (STATE.salesStatusFilter !== 'ALL') {
    visible = visible.filter((s) => s.status === STATE.salesStatusFilter);
  }
  if (STATE.salesSearch) {
    visible = visible.filter((s) => {
      const text = `${s.id} ${s.clientName} ${s.projectName} ${s.source} ${s.createdBy} ${s.notes || ''}`.toLowerCase();
      return text.includes(STATE.salesSearch);
    });
  }

  container.innerHTML = `
    <!-- Sales KPI Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[11px] text-slate-400 font-semibold uppercase">Total Sales Closed</span>
        <div class="text-xl font-bold text-slate-900 dark:text-white mt-1">${formatINR(totalSalesVal)}</div>
        <span class="text-[10px] text-slate-500 mt-0.5 block">${allSales.length} Total Sales Contracts</span>
      </div>

      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[11px] text-slate-400 font-semibold uppercase">Reconciled in Bank</span>
        <div class="text-xl font-bold text-[#026047] dark:text-emerald-400 mt-1">${formatINR(receivedVal)}</div>
        <span class="text-[10px] text-[#026047] font-semibold mt-0.5 block">Verified Client Inflows</span>
      </div>

      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[11px] text-slate-400 font-semibold uppercase">LeadX Product Sales</span>
        <div class="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">${formatINR(leadxVal)}</div>
        <span class="text-[10px] text-blue-500 mt-0.5 block">${leadxSales.length} B2B Deals Closed</span>
      </div>

      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[11px] text-slate-400 font-semibold uppercase">Smart Review Sales</span>
        <div class="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">${formatINR(srmVal)}</div>
        <span class="text-[10px] text-purple-500 mt-0.5 block">${srmSales.length} Hospitality Deployments</span>
      </div>
    </div>

    <!-- Sales List Pattern Toolbar -->
    <div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      <div class="flex items-center gap-2 w-full sm:w-auto flex-wrap">
        <div class="relative flex-1 sm:w-64">
          <input
            type="text"
            placeholder="Search sales by client, product, deal..."
            value="${STATE.salesSearch || ''}"
            oninput="handleSalesSearch(this.value)"
            class="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#026047]"
          />
          <span class="absolute left-2.5 top-2 text-slate-400">🔍</span>
        </div>
        <div class="flex items-center gap-1">
          <button onclick="filterSalesProduct('ALL')" class="px-2.5 py-1 rounded-lg ${
            STATE.salesProductFilter === 'ALL'
              ? 'bg-[#026047] text-[#fffde8] font-bold shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          } transition text-xs">
            All Products (${allSales.length})
          </button>
          <button onclick="filterSalesProduct('prj-leadx')" class="px-2.5 py-1 rounded-lg ${
            STATE.salesProductFilter === 'prj-leadx'
              ? 'bg-[#026047] text-[#fffde8] font-bold shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          } transition text-xs">
            LeadX (${leadxSales.length})
          </button>
          <button onclick="filterSalesProduct('prj-srm')" class="px-2.5 py-1 rounded-lg ${
            STATE.salesProductFilter === 'prj-srm'
              ? 'bg-[#026047] text-[#fffde8] font-bold shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          } transition text-xs">
            Smart Review (${srmSales.length})
          </button>
        </div>
      </div>
      <div class="flex items-center gap-2 self-end sm:self-auto">
        <select onchange="filterSalesStatus(this.value)" class="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs">
          <option value="ALL" ${STATE.salesStatusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
          <option value="received" ${STATE.salesStatusFilter === 'received' ? 'selected' : ''}>Verified in Bank</option>
          <option value="pending_approval" ${STATE.salesStatusFilter === 'pending_approval' ? 'selected' : ''}>Pending Clearance</option>
        </select>
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-[#026047] dark:text-emerald-300 font-bold text-[11px]">
          <span>📋</span> List Pattern Active
        </span>
      </div>
    </div>

    <!-- Sales Master List Table -->
    <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold text-[11px]">
            <th class="py-2.5 px-3">Sale ID & Date</th>
            <th class="py-2.5 px-3">Product Sold</th>
            <th class="py-2.5 px-3">Client & Deal Scope</th>
            <th class="py-2.5 px-3">Closed By</th>
            <th class="py-2.5 px-3 text-right">Deal Amount (₹)</th>
            <th class="py-2.5 px-3 text-center">Status</th>
            <th class="py-2.5 px-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          ${
            visible.length === 0
              ? `<tr><td colspan="7" class="py-12 text-center text-slate-400 dark:text-slate-500">
                  <div class="text-3xl mb-1">🏷️</div>
                  <div class="font-bold text-slate-700 dark:text-slate-300 text-xs">No sales recorded yet</div>
                  <p class="text-[11px] text-slate-400 mt-0.5">Click "+ Record New Sale / Deal" above to log genuine client contracts for LeadX and Smart Review Management.</p>
                </td></tr>`
              : visible
                  .map((sale) => {
                    const isExp = !!STATE.expandedSaleIds[sale.id];
                    const isReceived = sale.status === 'received';
                    const isLeadX = sale.projectId === 'prj-leadx';
                    const productBadgeClass = isLeadX
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300';

                    return `
                    <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td class="py-3 px-3">
                        <div class="font-mono font-bold text-slate-900 dark:text-white uppercase">${sale.id}</div>
                        <div class="text-[10px] text-slate-400 font-mono">${sale.paymentDate}</div>
                      </td>

                      <td class="py-3 px-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${productBadgeClass}">${sale.projectName}</span>
                        <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">${sale.source}</div>
                      </td>

                      <td class="py-3 px-3">
                        <div class="font-bold text-slate-900 dark:text-white text-xs">${sale.clientName}</div>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xs mt-0.5">${sale.notes || 'Official product sale agreement'}</p>
                      </td>

                      <td class="py-3 px-3">
                        <div class="flex items-center gap-1.5">
                          <span class="w-5 h-5 rounded-full bg-[#026047] text-[#fffde8] flex items-center justify-center font-bold text-[9px]">
                            ${(sale.createdBy || 'PB').slice(0, 2).toUpperCase()}
                          </span>
                          <span class="font-medium text-slate-700 dark:text-slate-300 text-[11px]">${sale.createdBy}</span>
                        </div>
                      </td>

                      <td class="py-3 px-3 text-right">
                        <div class="font-bold text-sm text-[#026047] dark:text-emerald-400">${formatINR(sale.amount)}</div>
                        <span class="text-[9px] text-slate-400 block uppercase font-mono">${(sale.paymentMethod || 'bank_transfer').replace('_', ' ')}</span>
                      </td>

                      <td class="py-3 px-3 text-center">
                        ${
                          isReceived
                            ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Verified in Bank
                              </span>`
                            : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Awaiting Approval
                              </span>`
                        }
                      </td>

                      <td class="py-3 px-3 text-right whitespace-nowrap">
                        <div class="flex items-center justify-end gap-1.5">
                          <button onclick="toggleSaleDetails('${sale.id}')"
                            class="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition flex items-center gap-1">
                            <span>${isExp ? 'Hide' : 'Details'}</span>
                            <span class="text-[10px]">${isExp ? '▲' : '▼'}</span>
                          </button>
                          ${
                            isReceived
                              ? `<button onclick="openInvoiceModal('${sale.id}')"
                                  class="px-2.5 py-1 rounded-lg bg-[#026047] text-[#fffde8] font-bold text-xs hover:bg-[#024d39] transition flex items-center gap-1 shadow-sm" title="View Official Invoice">
                                  <span>📄</span> Invoice
                                </button>`
                              : STATE.activeRole === 'pranav'
                              ? `<button onclick="approveApprovalItem('income', '${sale.id}')"
                                  class="px-2.5 py-1 rounded-lg bg-[#026047] text-[#fffde8] font-bold text-xs hover:bg-[#024d39] transition flex items-center gap-1 shadow-sm">
                                  <span>👑</span> Approve
                                </button>`
                              : `<span class="text-[10px] text-slate-400 italic">Pending</span>`
                          }
                        </div>
                      </td>
                    </tr>

                    <!-- Expandable Sale Details Row -->
                    ${
                      isExp
                        ? `
                    <tr class="bg-slate-50/70 dark:bg-slate-800/30">
                      <td colspan="7" class="p-4">
                        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs">
                          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                            <div>
                              <div class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span>Sale Dossier: ${sale.clientName}</span>
                                <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">${sale.id}</span>
                              </div>
                              <p class="text-[11px] text-slate-500 mt-0.5">Agreement Type: ${sale.source} • Product: ${sale.projectName}</p>
                            </div>
                            <div class="text-right">
                              <span class="text-[11px] text-slate-400">Total Contract Value:</span>
                              <div class="text-base font-black text-[#026047] dark:text-emerald-400">${formatINR(sale.amount)}</div>
                            </div>
                          </div>

                          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                              <span class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Payment Verification</span>
                              <div class="font-semibold text-slate-800 dark:text-slate-200">Mode: ${(sale.paymentMethod || 'bank_transfer').replace('_', ' ').toUpperCase()}</div>
                              <div class="text-[10px] text-slate-500 mt-1">Settlement Date: ${sale.paymentDate}</div>
                              <div class="text-[10px] text-emerald-600 font-semibold mt-0.5">Account: Phoenix Tech Solutions Current A/c</div>
                            </div>

                            <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                              <span class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Contract & Scope Notes</span>
                              <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">${sale.notes || 'No notes specified.'}</p>
                              <div class="text-[10px] text-slate-400 mt-1">Closed By: ${sale.createdBy}</div>
                            </div>

                            <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                              <span class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Agreed Project Incentive Pool</span>
                              <div class="font-bold text-[#026047] dark:text-emerald-400">10% Net Margin Contribution</div>
                              <p class="text-[10px] text-slate-500 mt-1">Incentive splits amongst LeadX & Smart Review teams upon cost recovery.</p>
                              <div class="mt-2">
                                <button onclick="openInvoiceModal('${sale.id}')" class="px-2.5 py-1 rounded bg-[#026047] text-[#fffde8] text-[10px] font-bold hover:bg-[#024d39] transition">
                                  📄 Print / Save Invoice
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    `
                        : ''
                    }
                  `;
                  })
                  .join('')
          }
        </tbody>
      </table>
    </div>
  `;
}
window.renderSalesDone = renderSalesDone;

// ==============================================================================
// 3. PROJECTS (PROJECT MANAGEMENT & SCOPE OVERVIEW) - LIST FORMAT
// Structured master list with quick metrics, tech stacks, team shares & expandable details
// ==============================================================================
STATE.projectListSearch = STATE.projectListSearch || '';
STATE.projectListFilter = STATE.projectListFilter || 'ALL';
STATE.expandedProjectIds = STATE.expandedProjectIds || {};

window.toggleProjectDetails = function (projectId) {
  STATE.expandedProjectIds[projectId] = !STATE.expandedProjectIds[projectId];
  renderProjects();
};

window.filterProjectList = function (filter) {
  STATE.projectListFilter = filter;
  renderProjects();
};

window.handleProjectSearch = function (query) {
  STATE.projectListSearch = (query || '').toLowerCase();
  renderProjects();
};

STATE.projectSubView = STATE.projectSubView || 'list';
STATE.projectFinanceFilter = STATE.projectFinanceFilter || 'ALL';

window.setProjectSubView = function (subView, filter = null) {
  STATE.projectSubView = subView || 'list';
  if (filter) {
    STATE.projectFinanceFilter = filter;
  }
  renderProjects();
};

window.viewProjectFinance = function (projectId = 'ALL') {
  STATE.projectSubView = 'finance';
  STATE.projectFinanceFilter = projectId || 'ALL';
  renderProjects();
};

window.filterProjectFinance = function (filterId) {
  STATE.projectFinanceFilter = filterId || 'ALL';
  renderProjects();
};

function renderProjects() {
  const container = document.getElementById('projects-container');
  if (!container) return;

  const allProjects = STATE.projects || [];
  const isFinanceView = STATE.projectSubView === 'finance';

  const techDetails = {
    'prj-leadx': {
      itemNumber: '1',
      displayName: '1) LeadX',
      badge: 'Designed In-House B2B SaaS',
      category: 'B2B Client Growth & Automated Outreach Platform',
      architecture:
        'Proprietary distributed AWS EC2 crawler cluster, headless crawlers, queue workers & verified business database.',
      techStack: ['AWS Cloud EC2', 'Node.js Workers', 'PostgreSQL', 'Tailwind UI', 'RESTful Webhooks'],
    },
    'prj-srm': {
      itemNumber: '2',
      displayName: '2) Smart Review Management',
      badge: 'Designed In-House Hospitality AI',
      category: 'Customer Sentiment Intelligence & Feedback Interceptor',
      architecture:
        'Proprietary sentiment NLP model, dynamic table QR routing and real-time merchant escalation funnel.',
      techStack: [
        'Python Sentiment Engine',
        'Fastify Microservices',
        'Supabase DB',
        'Dynamic QR Funnel',
        'WhatsApp Webhook',
      ],
    },
  };

  if (isFinanceView) {
    // ==========================================
    // SUB-VIEW: PROJECT FINANCIALS & MARGINS (ONE-IN-ONE)
    // ==========================================
    let targetProjects = allProjects;
    if (STATE.projectFinanceFilter && STATE.projectFinanceFilter !== 'ALL') {
      targetProjects = allProjects.filter((p) => p.id === STATE.projectFinanceFilter);
    }

    container.innerHTML = `
      <!-- Top Section Header & Sub-Tab Switcher (One In One) -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div class="flex items-center gap-2">
          <div class="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button onclick="setProjectSubView('list')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
              <span>📁</span> Products List (${allProjects.length})
            </button>
            <button onclick="setProjectSubView('finance')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-[#026047] text-[#fffde8] shadow-sm cursor-pointer">
              <span>📊</span> Project Financials & P&L
            </button>
          </div>
        </div>
        <div class="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button onclick="openNewIncomeModal()" class="px-3 py-1.5 rounded-lg bg-[#026047] text-[#fffde8] font-bold text-xs hover:bg-[#024d39] transition shadow-sm cursor-pointer">
            + Enroll Inflow
          </button>
          <button onclick="openNewExpenseModal()" class="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs transition shadow-sm cursor-pointer">
            + Add Cost
          </button>
        </div>
      </div>

      <!-- Financials Sub-Toolbar -->
      <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div class="flex items-center gap-2 flex-wrap">
          <button onclick="setProjectSubView('list')" class="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer">
            <span>←</span> Back to Products List
          </button>
          <span class="text-slate-400 text-[11px] font-semibold ml-1">Filter Project:</span>
          <div class="inline-flex items-center gap-1">
            <button onclick="filterProjectFinance('ALL')" class="px-2.5 py-1 rounded-lg ${STATE.projectFinanceFilter === 'ALL' ? 'bg-[#026047] text-[#fffde8] font-bold shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'} transition text-xs cursor-pointer">
              All Products (${allProjects.length})
            </button>
            <button onclick="filterProjectFinance('prj-leadx')" class="px-2.5 py-1 rounded-lg ${STATE.projectFinanceFilter === 'prj-leadx' ? 'bg-[#026047] text-[#fffde8] font-bold shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'} transition text-xs cursor-pointer">
              1) LeadX
            </button>
            <button onclick="filterProjectFinance('prj-srm')" class="px-2.5 py-1 rounded-lg ${STATE.projectFinanceFilter === 'prj-srm' ? 'bg-[#026047] text-[#fffde8] font-bold shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'} transition text-xs cursor-pointer">
              2) Smart Review
            </button>
          </div>
        </div>
        <div class="text-[11px] text-slate-500 font-semibold">
          Live P&L, direct costs and partner splits
        </div>
      </div>

      <!-- Financial Cards -->
      <div class="space-y-6">
        ${targetProjects.map((p) => {
          const fin = getProjectFinancials(p.id);
          const netProfit = fin.received - fin.expenses;
          const isProfit = netProfit >= 0;
          const projectIncome = (STATE.income || []).filter((i) => i.projectId === p.id);
          const projectExpenses = (STATE.expenses || []).filter((e) => e.projectId === p.id);

          return `
            <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <!-- Project Header -->
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-lg font-black text-slate-900 dark:text-white">${p.name}</h3>
                    <span class="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#fffde8] text-[#026047] border border-[#026047]/30">${p.code}</span>
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">${p.description}</p>
                </div>
                <div class="flex items-center gap-2 self-start sm:self-auto">
                  <button onclick="openNewIncomeModal()" class="px-3 py-1.5 rounded-lg bg-[#026047] text-[#fffde8] font-bold text-xs hover:bg-[#024d39] cursor-pointer">
                    + Enroll Inflow
                  </button>
                  <button onclick="openNewExpenseModal()" class="px-3 py-1.5 rounded-lg bg-rose-700 text-white font-bold text-xs hover:bg-rose-800 cursor-pointer">
                    + Add Cost
                  </button>
                </div>
              </div>

              <!-- 4 Key Financial Metrics -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <!-- Total Revenue Inflow -->
                <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span class="text-[10px] text-slate-400 uppercase font-bold">Total Revenue Inflow</span>
                  <div class="text-base font-black text-[#026047] dark:text-emerald-400 mt-1">${formatINR(fin.received)}</div>
                  <span class="text-[10px] text-emerald-600 font-semibold block mt-1">Verified Received</span>
                </div>

                <!-- Direct Project Costs -->
                <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span class="text-[10px] text-slate-400 uppercase font-bold">Direct Project Costs</span>
                  <div class="text-base font-black text-rose-600 dark:text-rose-400 mt-1">${formatINR(fin.expenses)}</div>
                  <span class="text-[10px] text-rose-500 font-semibold block mt-1">Approved Outflows</span>
                </div>

                <!-- Net Project Margin -->
                <div class="p-3.5 rounded-xl ${isProfit ? 'bg-[#fffde8] dark:bg-[#026047]/20 border border-[#026047]/30' : 'bg-rose-50 dark:bg-rose-950/20 border border-rose-300'}">
                  <span class="text-[10px] ${isProfit ? 'text-[#026047] dark:text-[#fffde8]' : 'text-rose-700'} uppercase font-bold">Net Project Margin</span>
                  <div class="text-base font-black ${isProfit ? 'text-[#026047] dark:text-emerald-300' : 'text-rose-600'} mt-1">${formatINR(netProfit)}</div>
                  <span class="text-[10px] text-slate-500 font-semibold block mt-1">${netProfit === 0 ? '100% Cost Recovery' : (netProfit > 0 ? 'Profitable' : 'Deficit')}</span>
                </div>

                <!-- Pending Expected Inflow -->
                <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span class="text-[10px] text-slate-400 uppercase font-bold">Pending Invoices</span>
                  <div class="text-base font-black text-amber-600 dark:text-amber-400 mt-1">${formatINR(fin.pending)}</div>
                  <span class="text-[10px] text-amber-600 font-semibold block mt-1">${fin.pending > 0 ? 'Awaiting Clearance' : 'All Cleared'}</span>
                </div>
              </div>

              <!-- Team Revenue Allocation Pills -->
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
                <span class="font-bold text-slate-700 dark:text-slate-300">Contractual Profit Share Allocation:</span>
                <div class="flex items-center gap-2">
                  ${(p.membersAllocation || []).map((m) => `
                    <span class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                      ${m.name}: <strong class="text-[#026047] dark:text-emerald-400">${m.share}%</strong>
                    </span>
                  `).join('')}
                </div>
              </div>

              <!-- Inflow & Expense Transaction Sub-Tables -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                <!-- Inflows Sub-Table -->
                <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span class="text-xs font-bold text-slate-900 dark:text-white uppercase">Client Revenue Transactions</span>
                    <span class="text-[10px] text-emerald-700 font-semibold">Inflows</span>
                  </div>
                  <div class="space-y-2">
                    ${projectIncome.length === 0 ? '<div class="text-slate-400 text-xs py-2">No income recorded for this project yet.</div>' : projectIncome.map((inc) => `
                      <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div class="font-bold text-slate-900 dark:text-white">${inc.clientName}</div>
                          <div class="text-[10px] text-slate-500">${formatDate(inc.paymentDate)} • ${inc.paymentMethod}</div>
                        </div>
                        <div class="flex items-center gap-2">
                          <span class="font-black text-[#026047] dark:text-emerald-400">${formatINR(inc.amount)}</span>
                          ${inc.status === 'received'
                            ? `<button onclick="openInvoiceModal('${inc.id}')" title="Official Invoice" class="px-2 py-0.5 rounded bg-[#026047]/10 hover:bg-[#026047] text-[#026047] hover:text-[#fffde8] font-bold text-[10px] transition cursor-pointer">Invoice</button>`
                            : '<span class="text-amber-600 text-[10px] font-bold">Pending</span>'
                          }
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>

                <!-- Direct Costs Sub-Table -->
                <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span class="text-xs font-bold text-slate-900 dark:text-white uppercase">Direct Project Costs</span>
                    <span class="text-[10px] text-rose-600 font-semibold">Outflows</span>
                  </div>
                  <div class="space-y-2">
                    ${projectExpenses.length === 0 ? '<div class="text-slate-400 text-xs py-2">No direct costs recorded.</div>' : projectExpenses.map((exp) => `
                      <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div class="font-bold text-slate-900 dark:text-white">${exp.title}</div>
                          <div class="text-[10px] text-slate-500">${formatDate(exp.date)} • Paid by ${exp.paidBy}</div>
                        </div>
                        <div class="text-right">
                          <span class="font-black text-rose-600 dark:text-rose-400">${formatINR(exp.amount)}</span>
                          <span class="block text-[10px] text-emerald-700 font-semibold">✓ Approved</span>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>

            </div>
          `;
        }).join('')}
      </div>
    `;
    return;
  }

  // ==========================================
  // SUB-VIEW: PRODUCTS LIST (ONE-IN-ONE)
  // ==========================================
  let visibleProjects = allProjects;
  if (STATE.projectListFilter !== 'ALL') {
    visibleProjects = visibleProjects.filter((p) => {
      const details = techDetails[p.id] || {};
      if (STATE.projectListFilter === 'B2B')
        return p.id === 'prj-leadx' || (details.category && details.category.includes('B2B'));
      if (STATE.projectListFilter === 'AI')
        return p.id === 'prj-srm' || (details.category && details.category.includes('Sentiment'));
      return true;
    });
  }

  if (STATE.projectListSearch) {
    visibleProjects = visibleProjects.filter((p) => {
      const details = techDetails[p.id] || {};
      const haystack = `${p.name} ${p.code} ${p.description} ${details.category} ${(
        details.techStack || []
      ).join(' ')}`.toLowerCase();
      return haystack.includes(STATE.projectListSearch);
    });
  }

  container.innerHTML = `
    <!-- Top Section Header & Sub-Tab Switcher (One In One) -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div class="flex items-center gap-2">
        <div class="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button onclick="setProjectSubView('list')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-[#026047] text-[#fffde8] shadow-sm cursor-pointer">
            <span>📁</span> Products List (${allProjects.length})
          </button>
          <button onclick="setProjectSubView('finance')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
            <span>📊</span> Project Financials & P&L
          </button>
        </div>
      </div>
      <div class="flex items-center gap-2 self-start sm:self-auto flex-wrap">
        <button onclick="viewProjectFinance('ALL')"
          class="px-3.5 py-1.5 rounded-2xl bg-[#ffffea] text-[#026047] border border-[#026047]/30 font-bold text-xs hover:bg-[#fff9c2] transition flex items-center gap-1.5 shadow-sm cursor-pointer">
          <span>📊</span> View Financials
        </button>
        <button onclick="openNewProjectModal()"
          class="px-3.5 py-1.5 rounded-lg bg-[#026047] text-[#fffde8] font-bold text-xs hover:bg-[#024d39] transition cursor-pointer">
          + New Product
        </button>
      </div>
    </div>

    <!-- Search & Filter Toolbar -->
    <div class="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
      <div class="flex items-center gap-2 w-full sm:w-auto flex-wrap">
        <div class="relative flex-1 sm:w-64">
          <input
            type="text"
            placeholder="Search our designed products..."
            value="${STATE.projectListSearch || ''}"
            oninput="handleProjectSearch(this.value)"
            class="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#026047]"
          />
          <span class="absolute left-2.5 top-2 text-slate-400">🔍</span>
        </div>
        <div class="flex items-center gap-1">
          <button onclick="filterProjectList('ALL')" class="px-2.5 py-1 rounded-lg ${
            STATE.projectListFilter === 'ALL'
              ? 'bg-[#026047] text-[#fffde8] font-bold shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          } transition text-xs cursor-pointer">
            All Products (${allProjects.length})
          </button>
          <button onclick="filterProjectList('B2B')" class="px-2.5 py-1 rounded-lg ${
            STATE.projectListFilter === 'B2B'
              ? 'bg-[#026047] text-[#fffde8] font-bold shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          } transition text-xs cursor-pointer">
            1) LeadX
          </button>
          <button onclick="filterProjectList('AI')" class="px-2.5 py-1 rounded-lg ${
            STATE.projectListFilter === 'AI'
              ? 'bg-[#026047] text-[#fffde8] font-bold shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          } transition text-xs cursor-pointer">
            2) Smart Review
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2 self-start sm:self-auto flex-wrap">
        <button onclick="viewProjectFinance('ALL')"
          class="px-3.5 py-1.5 rounded-2xl bg-[#ffffea] text-[#026047] border border-[#026047]/30 font-bold text-xs hover:bg-[#fff9c2] transition flex items-center gap-1.5 shadow-sm cursor-pointer">
          <span>📊</span> View Financials
        </button>
      </div>
    </div>

    <!-- Designed Products Minimal List -->
    <div class="space-y-3">
      ${
        visibleProjects.length === 0
          ? `<div class="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
               <span class="text-3xl block mb-2">🔍</span>
               <p class="font-semibold text-slate-600 dark:text-slate-300">No designed products match your search or filter.</p>
               <button onclick="filterProjectList('ALL'); handleProjectSearch('');" class="mt-3 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300">Reset Filters</button>
             </div>`
          : visibleProjects
              .map((p, idx) => {
                const isLeadX = p.id === 'prj-leadx';
                const itemNum = isLeadX ? '01' : '02';
                const displayName = isLeadX ? '1) LeadX' : '2) Smart Review Management';
                const numBg = 'bg-[#026047]';
                const fin = getProjectFinancials(p.id);
                const netProfit = fin.received - fin.expenses;
                const isProfit = netProfit >= 0;

                return `
                <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 hover:border-[#026047] transition">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl ${numBg} text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0">
                      ${itemNum}
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <h3 class="text-sm font-bold text-slate-900 dark:text-white">${displayName}</h3>
                        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#fffde8] text-[#026047] border border-[#026047]/30">${p.code}</span>
                      </div>
                      <div class="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>Inflow: <strong class="text-[#026047] dark:text-emerald-400">${formatINR(fin.received)}</strong></span>
                        <span>•</span>
                        <span>Costs: <strong class="text-rose-600 dark:text-rose-400">${formatINR(fin.expenses)}</strong></span>
                        <span>•</span>
                        <span>Net: <strong class="${isProfit ? 'text-[#026047] dark:text-emerald-400' : 'text-rose-600'}">${formatINR(netProfit)}</strong></span>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button onclick="viewProjectFinance('${p.id}')"
                      class="px-3.5 py-1.5 rounded-2xl bg-[#ffffea] text-[#026047] border border-[#026047]/30 font-bold text-xs hover:bg-[#fff9c2] transition flex items-center gap-1.5 shadow-sm cursor-pointer">
                      <span>📊</span> View Financials
                    </button>
                  </div>
                </div>`;
              })
              .join('')
      }
    </div>
  `;
}
window.renderProjects = renderProjects;

function renderProjectFinance() {
  STATE.projectSubView = 'finance';
  renderProjects();
}
window.renderProjectFinance = renderProjectFinance;

window.openNewProjectModal = function () {
  if (STATE.activeRole !== 'pranav') {
    alert('Restricted: Only Pranav Bansode (Founder / Director) can create new company projects.');
    return;
  }
  const modal = document.getElementById('modal-new-project');
  if (modal) modal.classList.remove('hidden');
};

window.closeNewProjectModal = function () {
  const modal = document.getElementById('modal-new-project');
  if (modal) modal.classList.add('hidden');
};

window.submitNewProject = function () {
  const name = document.getElementById('prj-name').value;
  const desc = document.getElementById('prj-desc').value;
  const incentive = parseFloat(document.getElementById('prj-incentive').value) || 10;

  if (!name.trim()) return alert('Project name is required.');

  const code = 'PRJ-' + name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

  STATE.projects.push({
    id: 'prj-' + Date.now(),
    code,
    name,
    description: desc || 'Company initiative.',
    status: 'active',
    revenueReceived: 0,
    directExpenses: 0,
    allocatedOverhead: 0,
    incentivePercentage: incentive,
    assignedMembers: ['mem-01', 'mem-02', 'mem-03'],
    membersAllocation: [
      { memberId: 'mem-01', name: 'Pranav Bansode', share: 33.3 },
      { memberId: 'mem-02', name: 'Arshad Shaikh', share: 33.3 },
      { memberId: 'mem-03', name: 'Vivek Gajdhane', share: 33.4 },
    ],
    createdAt: new Date().toISOString().split('T')[0],
  });

  closeNewProjectModal();
  updateProjectSelectOptions();
  renderProjects();
  renderDashboard();
  showToast(`Project ${name} created and connected to Finance Dashboard.`);
};

function renderIncome() {
  renderFounderDashboard();
}

// ==============================================================================
// INVOICE GENERATION & DOWNLOAD
// ==============================================================================
function generateInvoiceCardHTML(inc) {
  const invNumber = 'PTS-INV-' + (inc.id || '01').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const approvalDate = inc.approvedAt || formatDate(inc.paymentDate);
  const approver = inc.approvedBy || 'Pranav Bansode (Founder / Director)';

  return `
    <div id="printable-invoice" class="bg-white text-slate-800 p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6 font-sans">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div class="flex items-center gap-3">
          <img src="logo-icon-ivory.png" alt="Phoenix Tech Logo" class="h-12 w-12 object-contain p-2 rounded-xl bg-[#026047] shrink-0" />
          <div>
            <h2 class="text-lg font-black tracking-wider text-[#026047] uppercase leading-tight">Phoenix Tech Solutions</h2>
            <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Private Limited</div>
            <div class="text-[10px] text-slate-400">Corporate Finance & Client Revenue Desk</div>
          </div>
        </div>
        <div class="sm:text-right">
          <span class="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
            ✓ Paid & Verified
          </span>
          <div class="text-xs font-mono font-bold text-slate-800 mt-2">${invNumber}</div>
          <div class="text-[11px] text-slate-500">Date: ${formatDate(inc.paymentDate)}</div>
        </div>
      </div>

      <!-- Parties & Meta -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
        <div class="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
          <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Billed To (Client):</span>
          <div class="text-sm font-bold text-slate-900">${inc.clientName}</div>
          <div class="text-slate-600">Associated Project: <strong class="text-slate-900">${inc.projectName}</strong></div>
          <div class="text-slate-500 text-[11px]">Revenue Category: ${inc.source || 'Client Inflow'}</div>
          ${inc.createdBy ? `<div class="text-[10px] text-slate-400">Enrolled By: ${inc.createdBy}</div>` : ''}
        </div>
        <div class="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1 sm:text-right">
          <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Authorization & Clearance:</span>
          <div class="text-slate-700">Payment Channel: <strong class="uppercase font-mono text-slate-900">${inc.paymentMethod || 'Bank Transfer'}</strong></div>
          <div class="text-slate-700">Clearance Status: <strong class="text-emerald-700">Direct Inflow Confirmed</strong></div>
          <div class="text-slate-700">Approval Stamp: <strong class="text-slate-900">${approvalDate}</strong></div>
          <div class="text-[11px] text-slate-500">Authorized By: <strong class="text-slate-900">${approver}</strong></div>
        </div>
      </div>

      <!-- Line Items Table -->
      <div class="overflow-x-auto border border-slate-200 rounded-lg">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-bold">
            <tr>
              <th class="py-2.5 px-3">Description</th>
              <th class="py-2.5 px-3 text-center">Project Ref</th>
              <th class="py-2.5 px-3 text-right">Inflow Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr>
              <td class="py-3 px-3">
                <div class="font-bold text-slate-900">${inc.projectName} - Client Revenue Deliverable</div>
                <div class="text-[11px] text-slate-500 mt-0.5">${inc.notes || 'Recorded and verified client contract milestone revenue.'}</div>
              </td>
              <td class="py-3 px-3 text-center font-mono font-medium text-slate-600">${inc.projectId || 'PRJ'}</td>
              <td class="py-3 px-3 text-right font-mono font-bold text-[#026047] text-sm">${formatINR(inc.amount)}</td>
            </tr>
          </tbody>
          <tfoot class="bg-slate-50/80 border-t border-slate-200 font-bold">
            <tr>
              <td colspan="2" class="py-2.5 px-3 text-right text-slate-700">Total Settlement Received:</td>
              <td class="py-2.5 px-3 text-right text-[#026047] text-base">${formatINR(inc.amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Verification Footer & Seal -->
      <div class="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pt-4 border-t border-slate-200 text-xs">
        <div class="max-w-xs text-[10px] text-slate-500 leading-relaxed">
          <p class="font-semibold text-slate-700">Official Computer-Generated Invoice Receipt</p>
          <p>Issued by Phoenix Tech Solutions Private Limited. Verified in executive ledger. No physical signature required.</p>
        </div>
        <div class="text-right flex flex-col items-end">
          <div class="p-2 px-3 rounded-lg border-2 border-dashed border-[#026047]/40 bg-[#026047]/5 text-center inline-block">
            <div class="text-[9px] uppercase font-mono font-bold text-[#026047] tracking-wider">✓ DIGITALLY AUTHORIZED</div>
            <div class="text-xs font-black text-slate-900 tracking-wide">PRANAV BANSODE</div>
            <div class="text-[9px] text-slate-500 font-semibold">Founder & Director</div>
          </div>
          <span class="text-[9px] text-slate-400 mt-1 block">Phoenix Tech Solutions Private Limited</span>
        </div>
      </div>
    </div>
  `;
}

window.openInvoiceModal = function (id) {
  const inc = STATE.income.find((i) => i.id === id);
  if (!inc) return;

  STATE.currentInvoiceId = id;
  const container = document.getElementById('invoice-render-content');
  if (container) {
    container.innerHTML = generateInvoiceCardHTML(inc);
  }
  const modal = document.getElementById('modal-invoice');
  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
};

window.closeInvoiceModal = function () {
  const modal = document.getElementById('modal-invoice');
  if (modal) modal.classList.add('hidden');
};

window.printCurrentInvoice = function () {
  if (!STATE.currentInvoiceId) return;
  const inc = STATE.income.find((i) => i.id === STATE.currentInvoiceId);
  if (!inc) return;

  const invoiceBody = generateInvoiceCardHTML(inc);
  const printWin = window.open('', '_blank', 'width=850,height=950');
  if (!printWin) {
    alert('Please allow popups to open the print view, or click "Download Invoice" to save the file directly.');
    return;
  }
  printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${inc.clientName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: white; padding: 24px; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  ${invoiceBody}
  <script>
    setTimeout(() => {
      window.print();
    }, 400);
  </script>
</body>
</html>`);
  printWin.document.close();
};

window.downloadCurrentInvoice = function () {
  if (!STATE.currentInvoiceId) return;
  const inc = STATE.income.find((i) => i.id === STATE.currentInvoiceId);
  if (!inc) return;

  const invoiceBody = generateInvoiceCardHTML(inc);
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${inc.clientName} - ${inc.id}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #f8fafc; padding: 2rem; }
    @media print {
      body { background: white; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body class="max-w-3xl mx-auto">
  <div class="no-print mb-4 flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
    <div>
      <span class="text-xs font-bold text-slate-800">Phoenix Tech Solutions Private Limited</span>
      <span class="text-[11px] text-slate-500 block">Official Verified Payment Invoice Receipt</span>
    </div>
    <button onclick="window.print()" style="background:#026047;color:#fffde8;padding:7px 16px;font-size:12px;font-weight:bold;border-radius:8px;border:none;cursor:pointer;">
      Print / Save as PDF
    </button>
  </div>
  ${invoiceBody}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice-${inc.clientName.replace(/[^a-zA-Z0-9]/g, '_')}-${inc.id}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Invoice for ${inc.clientName} downloaded successfully!`);
};

window.approveIncome = function (id) {
  if (STATE.activeRole !== 'pranav') {
    alert('Restricted: Only Pranav Bansode (Founder / Director) has authorization to approve income entries.');
    return;
  }
  const inc = STATE.income.find((i) => i.id === id);
  if (!inc) return;

  inc.status = 'received';
  inc.approvedBy = 'Pranav Bansode (Founder / Director)';
  inc.approvedAt = new Date().toISOString().replace('T', ' ').slice(0, 16);

  const prj = STATE.projects.find((p) => p.id === inc.projectId);
  if (prj) {
    prj.revenueReceived += inc.amount;
  }

  STATE.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'APPROVE_INCOME',
    details: `Approved income of ${formatINR(inc.amount)} from ${inc.clientName} (${inc.projectName})`,
    performedBy: 'Pranav Bansode (Founder / Director)',
    date: new Date().toISOString().replace('T', ' ').slice(0, 16),
  });

  renderIncome();
  renderDashboard();
  renderProjects();
  renderReports();
  showToast(`Income of ${formatINR(inc.amount)} approved by Founder/Director. Available Company Cash updated!`);

  // Immediate option to view and download official invoice
  setTimeout(() => {
    openInvoiceModal(inc.id);
  }, 350);
};

window.markIncomeReceived = window.approveIncome;

window.openNewIncomeModal = function () {
  const modal = document.getElementById('modal-new-income');
  if (modal) modal.classList.remove('hidden');
};

window.closeNewIncomeModal = function () {
  const modal = document.getElementById('modal-new-income');
  if (modal) modal.classList.add('hidden');
};

window.submitNewIncome = function () {
  const client = document.getElementById('inc-client').value.trim();
  const project = document.getElementById('inc-project').value;
  const amount = parseFloat(document.getElementById('inc-amount').value) || 0;
  const method = document.getElementById('inc-method').value;

  if (!client || amount <= 0) return alert('Valid client name and positive amount are required.');

  const prjObj = STATE.projects.find((p) => p.id === project) || STATE.projects[0];
  const userMap = {
    pranav: 'Pranav Bansode (Founder / Director)',
    arshad: 'Arshad Shaikh (Co-Founder)',
    vivek: 'Vivek Gajdhane (Technical)',
    aryan: 'Aryan Bhore (Research Lead)',
  };
  const enrolledBy = userMap[STATE.activeRole] || 'Team Member';

  STATE.income.unshift({
    id: 'inc-' + Date.now(),
    source: 'Client Inflow',
    projectId: prjObj.id,
    projectName: prjObj.name,
    clientName: client,
    amount,
    paymentDate: new Date().toISOString().split('T')[0],
    status: 'pending_approval',
    paymentMethod: method,
    createdBy: enrolledBy,
    notes: `Enrolled by ${enrolledBy}. Awaiting Founder/Director approval.`,
  });

  STATE.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'ENROLL_INCOME',
    details: `Enrolled income ${formatINR(amount)} from ${client} for ${prjObj.name} (Pending Approval)`,
    performedBy: enrolledBy,
    date: new Date().toISOString().replace('T', ' ').slice(0, 16),
  });

  closeNewIncomeModal();
  document.getElementById('inc-client').value = '';
  document.getElementById('inc-amount').value = '';

  renderIncome();
  renderDashboard();
  renderProjects();
  renderReports();
  showToast(`Income of ${formatINR(amount)} enrolled! Requires approval by Founder/Director before cash is credited.`);
};

// ==============================================================================
// D. EXPENSE MANAGEMENT
// ==============================================================================
function renderExpenses() {
  renderExpenseManagement();
}

function formatExpenseCategory(cat) {
  const map = {
    marketing_business: 'Marketing & Business',
    technical_infrastructure: 'Technical Infra',
    software_tools: 'Software & Tools',
    team_compensation: 'Compensation',
    administrative: 'Administrative',
    direct_project_cost: 'Direct Project Cost',
    other: 'Other',
  };
  return map[cat] || cat;
}

function renderExpenseManagement() {
  const currentRole = STATE.activeRole || 'pranav';
  const metricsContainer = document.getElementById('expense-metrics-container');
  const tableBody = document.getElementById('expense-table-body');
  const projectFilter = document.getElementById('expense-project-filter');
  const statusFilter = document.getElementById('expense-status-filter');

  const selectedProject = projectFilter ? projectFilter.value : 'ALL';
  const selectedStatus = statusFilter ? statusFilter.value : 'ALL';

  let list = STATE.expenses.filter((e) => {
    if (selectedProject !== 'ALL' && e.projectId !== selectedProject.toLowerCase()) {
      return false;
    }
    if (selectedStatus === 'PENDING' && e.status !== 'pending_approval') return false;
    if (selectedStatus === 'APPROVED' && e.status !== 'approved') return false;
    return true;
  });

  // Role-based filtering:
  // Pranav (Founder) sees all company expenses.
  // Arshad sees only marketing expenses submitted by Arshad.
  // Vivek sees only engineering/infrastructure expenses submitted by Vivek.
  if (currentRole === 'arshad') {
    list = list.filter((e) => e.paidBy.toLowerCase().includes('arshad'));
  } else if (currentRole === 'vivek') {
    list = list.filter((e) => e.paidBy.toLowerCase().includes('vivek'));
  } else if (currentRole === 'aryan') {
    list = list.filter((e) => e.paidBy.toLowerCase().includes('aryan'));
  }

  // 1. Expense Summary Metrics Cards
  if (metricsContainer) {
    if (currentRole === 'pranav') {
      const approvedTotal = STATE.expenses
        .filter((e) => e.status === 'approved')
        .reduce((sum, e) => sum + e.amount, 0);
      const pendingCount = STATE.expenses.filter((e) => e.status === 'pending_approval').length;
      const leadXExp = STATE.expenses
        .filter((e) => e.projectId === 'prj-leadx' && e.status === 'approved')
        .reduce((sum, e) => sum + e.amount, 0);

      metricsContainer.innerHTML = `
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-xs text-slate-400 font-medium">Total Approved Outflows</span>
          <div class="text-xl font-bold text-rose-600 dark:text-rose-400">${formatINR(approvedTotal)}</div>
          <div class="text-[11px] text-slate-500 pt-0.5">Approved operational expenses</div>
        </div>
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-xs text-slate-400 font-medium">Pending Director Approvals</span>
          <div class="text-xl font-bold text-amber-600 dark:text-amber-400">${pendingCount} Requests</div>
          <div class="text-[11px] text-slate-500 pt-0.5">Awaiting Founder authorization</div>
        </div>
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-xs text-slate-400 font-medium">LeadX Direct Cost Allocation</span>
          <div class="text-xl font-bold text-slate-900 dark:text-white">${formatINR(leadXExp)}</div>
          <div class="text-[11px] text-slate-500 pt-0.5">Cluster & scraper infrastructure</div>
        </div>
      `;
    } else if (currentRole === 'arshad') {
      const myExpenses = STATE.expenses.filter((e) => e.paidBy.toLowerCase().includes('arshad'));
      const approved = myExpenses.filter((e) => e.status === 'approved').reduce((s, e) => s + e.amount, 0);
      const pending = myExpenses.filter((e) => e.status === 'pending_approval').reduce((s, e) => s + e.amount, 0);

      metricsContainer.innerHTML = `
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-xs text-slate-400 font-medium">My Submitted Marketing Expenses</span>
          <div class="text-xl font-bold text-slate-900 dark:text-white">${formatINR(approved + pending)}</div>
          <div class="text-[11px] text-slate-500 pt-0.5">B2B funnels & pilot collateral</div>
        </div>
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-xs text-slate-400 font-medium">Approved by Founder Pranav</span>
          <div class="text-xl font-bold text-emerald-600 dark:text-emerald-400">${formatINR(approved)}</div>
          <div class="text-[11px] text-slate-500 pt-0.5">Cleared corporate disbursements</div>
        </div>
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-xs text-slate-400 font-medium">Awaiting Founder Approval</span>
          <div class="text-xl font-bold text-amber-600 dark:text-amber-400">${formatINR(pending)}</div>
          <div class="text-[11px] text-slate-500 pt-0.5">Pending Director clearance</div>
        </div>
      `;
    } else if (currentRole === 'aryan') {
      const myExpenses = STATE.expenses.filter((e) => e.paidBy.toLowerCase().includes('aryan'));
      const approved = myExpenses.filter((e) => e.status === 'approved').reduce((s, e) => s + e.amount, 0);
      const pending = myExpenses.filter((e) => e.status === 'pending_approval').reduce((s, e) => s + e.amount, 0);

      metricsContainer.innerHTML = `
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-xs text-slate-400 font-medium">My Research & Outreach Outflows</span>
          <div class="text-xl font-bold text-slate-900 dark:text-white">${formatINR(approved + pending)}</div>
          <div class="text-[11px] text-slate-500 pt-0.5">Client prospect discovery & travel</div>
        </div>
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-xs text-slate-400 font-medium">Approved by Founder Pranav</span>
          <div class="text-xl font-bold text-emerald-600 dark:text-emerald-400">${formatINR(approved)}</div>
          <div class="text-[11px] text-slate-500 pt-0.5">Reconciled research disbursements</div>
        </div>
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-xs text-slate-400 font-medium">Awaiting Founder Approval</span>
          <div class="text-xl font-bold text-amber-600 dark:text-amber-400">${formatINR(pending)}</div>
          <div class="text-[11px] text-slate-500 pt-0.5">Pending Director clearance</div>
        </div>
      `;
    } else {
      const myExpenses = STATE.expenses.filter((e) => e.paidBy.toLowerCase().includes('vivek'));
      const approved = myExpenses.filter((e) => e.status === 'approved').reduce((s, e) => s + e.amount, 0);
      const pending = myExpenses.filter((e) => e.status === 'pending_approval').reduce((s, e) => s + e.amount, 0);

      metricsContainer.innerHTML = `
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-xs text-slate-400 font-medium">My Technical Infrastructure Outflows</span>
          <div class="text-xl font-bold text-slate-900 dark:text-white">${formatINR(approved + pending)}</div>
          <div class="text-[11px] text-slate-500 pt-0.5">AWS, database & developer tooling</div>
        </div>
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-xs text-slate-400 font-medium">Approved by Founder Pranav</span>
          <div class="text-xl font-bold text-emerald-600 dark:text-emerald-400">${formatINR(approved)}</div>
          <div class="text-[11px] text-slate-500 pt-0.5">Authorized server billing</div>
        </div>
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-xs text-slate-400 font-medium">Awaiting Founder Approval</span>
          <div class="text-xl font-bold text-amber-600 dark:text-amber-400">${formatINR(pending)}</div>
          <div class="text-[11px] text-slate-500 pt-0.5">Pending Director clearance</div>
        </div>
      `;
    }
  }

  // 2. Expense Table Rows
  if (tableBody) {
    if (list.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-slate-400 italic">No expense entries found matching filter. Click '+ Record Expense' to submit.</td></tr>`;
      return;
    }

    tableBody.innerHTML = list
      .map(
        (exp) => `
      <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
        <td class="py-3 px-3 font-mono text-slate-500">${formatDate(exp.date)}</td>
        <td class="py-3 px-3 font-semibold text-slate-900 dark:text-white">
          <div class="flex items-center gap-1.5">
            <span>${exp.paidBy}</span>
          </div>
        </td>
        <td class="py-3 px-3">
          <div class="font-bold text-slate-800 dark:text-slate-200">${exp.title}</div>
          <div class="text-[11px] text-slate-400">${exp.description}</div>
        </td>
        <td class="py-3 px-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            ${exp.projectName || 'General'}
          </span>
        </td>
        <td class="py-3 px-3 text-right font-black text-rose-600 dark:text-rose-400">
          ${formatINR(exp.amount)}
        </td>
        <td class="py-3 px-3 text-center">
          ${
            exp.status === 'approved'
              ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">✓ Approved</span>`
              : `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">⏳ Pending Approval</span>`
          }
        </td>
        <td class="py-3 px-3 text-right">
          ${
            currentRole === 'pranav'
              ? exp.status === 'approved'
                ? `<div class="flex items-center justify-end gap-1.5">
                    <span class="text-[10px] text-slate-400">Authorized</span>
                    <button onclick="reverseExpense('${exp.id}')" class="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-600 hover:text-rose-700 text-[10px] font-bold transition" title="Reverse this expense with audit reason">
                      Reverse
                    </button>
                  </div>`
                : `<button onclick="approveExpense('${exp.id}')" class="px-2.5 py-1 rounded-lg bg-[#026047] hover:bg-[#024d39] text-[#fffde8] text-xs font-bold shadow-sm transition">
                    👑 Approve
                  </button>`
              : exp.status === 'approved'
              ? `<span class="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">✓ Approved by Founder Pranav</span>`
              : `<span class="text-amber-600 dark:text-amber-400 text-[11px] font-medium">Pending Founder Sign-off</span>`
          }
        </td>
      </tr>
    `
      )
      .join('');
  }
}
window.renderExpenseManagement = renderExpenseManagement;

window.approveExpense = function (id) {
  if (STATE.activeRole !== 'pranav') {
    alert('Security Gate: Only Pranav Bansode (Founder / Director) has authorization to approve company expenses.');
    return;
  }
  const exp = STATE.expenses.find((e) => e.id === id);
  if (!exp) return;

  exp.status = 'approved';
  exp.approvedBy = 'Pranav Bansode (Founder / Director)';

  if (exp.projectId) {
    const prj = STATE.projects.find((p) => p.id === exp.projectId);
    if (prj) prj.directExpenses += exp.amount;
  }

  STATE.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'APPROVE_EXPENSE',
    details: `Approved ${exp.title} (${formatINR(exp.amount)}) by ${exp.paidBy}`,
    performedBy: 'Pranav Bansode (Founder / Director)',
    date: new Date().toISOString().replace('T', ' ').slice(0, 16),
  });

  renderExpenses();
  renderDashboard();
  renderProjects();
  renderReports();
  showToast(`Expense ${exp.title} approved! Interconnected Dashboard updated.`);
};

window.rejectExpense = function (id) {
  if (STATE.activeRole !== 'pranav') {
    alert('Security Gate: Only Pranav Bansode (Founder / Director) has authorization to reject company expenses.');
    return;
  }
  const exp = STATE.expenses.find((e) => e.id === id);
  if (!exp) return;

  exp.status = 'rejected';
  exp.rejectedBy = 'Pranav Bansode (Founder / Director)';

  STATE.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'REJECT_EXPENSE',
    details: `Rejected ${exp.title} (${formatINR(exp.amount)}) submitted by ${exp.paidBy}`,
    performedBy: 'Pranav Bansode (Founder / Director)',
    date: new Date().toISOString().replace('T', ' ').slice(0, 16),
  });

  renderExpenses();
  renderDashboard();
  showToast(`Expense ${exp.title} rejected.`);
};

window.reverseExpense = function (id) {
  if (STATE.activeRole !== 'pranav') {
    alert('Security Gate: Only Pranav Bansode (Founder / Director) has authorization to reverse company expenses.');
    return;
  }
  const reason = prompt('FINANCIAL AUDIT: State reason for reversing this approved expense:');
  if (!reason || !reason.trim()) return alert('Reversal cancelled: Audit reason required.');

  const idx = STATE.expenses.findIndex((e) => e.id === id);
  if (idx !== -1) {
    const exp = STATE.expenses[idx];
    exp.status = 'reversed';
    exp.isReversal = true;

    STATE.auditLogs.unshift({
      id: 'log-' + Date.now(),
      action: 'REVERSE_EXPENSE',
      details: `Reversed ${exp.title} (${formatINR(exp.amount)}) - Reason: ${reason}`,
      performedBy: 'Pranav Bansode',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    });

    renderExpenses();
    renderDashboard();
    renderProjects();
    renderReports();
    showToast(`Expense reversed and logged. Dashboard updated.`);
  }
};

window.openNewExpenseModal = function () {
  const modal = document.getElementById('modal-new-expense');
  if (modal) modal.classList.remove('hidden');
};

window.closeNewExpenseModal = function () {
  const modal = document.getElementById('modal-new-expense');
  if (modal) modal.classList.add('hidden');
};

window.submitNewExpense = function () {
  const title = document.getElementById('exp-title').value;
  const category = document.getElementById('exp-category').value;
  const project = document.getElementById('exp-project').value;
  const amount = parseFloat(document.getElementById('exp-amount').value) || 0;
  const desc = document.getElementById('exp-desc').value;

  if (!title || amount <= 0) return alert('Valid title and amount required.');

  let paidBy = 'Pranav Bansode';
  if (STATE.activeRole === 'arshad') paidBy = 'Arshad Shaikh';
  if (STATE.activeRole === 'vivek') paidBy = 'Vivek Gajdhane';
  if (STATE.activeRole === 'aryan') paidBy = 'Aryan Bhore';

  const prjObj = STATE.projects.find((p) => p.id === project) || null;

  // Auto-approve if Founder, else pending
  const isAutoApproved = STATE.activeRole === 'pranav';

  STATE.expenses.unshift({
    id: 'exp-' + Date.now(),
    title,
    category,
    projectId: prjObj ? prjObj.id : null,
    projectName: prjObj ? prjObj.name : 'General',
    amount,
    date: new Date().toISOString().split('T')[0],
    paidBy,
    description: desc || 'Company operational expense.',
    status: isAutoApproved ? 'approved' : 'pending_approval',
    approvedBy: isAutoApproved ? 'Pranav Bansode' : null,
  });

  if (isAutoApproved && prjObj) {
    prjObj.directExpenses += amount;
  }

  closeNewExpenseModal();
  renderExpenses();
  renderDashboard();
  renderProjects();
  renderReports();
  showToast(isAutoApproved ? 'Expense approved and recorded. Dashboard updated.' : 'Expense submitted for Founder approval.');
};

// Legacy view bridges
window.renderDashboard = renderFounderDashboard;
window.renderProjects = renderProjects;
window.renderExpenses = renderExpenseManagement;
window.renderTeam = () => renderEmployeeDashboard(STATE.selectedEmployeeId || 'mem-01');
window.renderProfitSharing = () => renderEmployeeDashboard('mem-02');
window.renderReserves = renderFinancialSummary;
window.renderReports = renderFinancialSummary;

window.exportFinancialReport = function (format) {
  if (format === 'csv') {
    let csv = 'Report,Metric,Value (INR)\n';
    const m = calculateMetrics();
    csv += `Summary,Total Money Received,${m.totalMoneyReceived}\n`;
    csv += `Summary,Total Business Expenses,${m.totalBusinessExpenses}\n`;
    csv += `Summary,Net Business Profit,${m.netBusinessProfit}\n`;
    csv += `Summary,Available Company Cash,${m.availableCompanyCash}\n`;
    csv += `Summary,Pending Client Payments,${m.pendingClientPayments}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Phoenix_Tech_Solution_Finance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('Financial CSV report downloaded.');
  } else if (format === 'print') {
    window.print();
  }
};

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className =
    'fixed bottom-6 right-6 z-50 bg-[#026047] text-[#fffde8] text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 border border-[#fffde8]/20';
  toast.innerHTML = `<span>✓</span> <span>${msg}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

