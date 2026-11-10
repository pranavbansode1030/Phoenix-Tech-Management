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

(function (window, document) {
  'use strict';

// ==============================================================================
// SUPABASE CLIENT & LIVE DATABASE SYNC
// ==============================================================================
const PHOENIX_SUPABASE_URL = 'https://mvdknbfisgrwewljqnxw.supabase.co';
const PHOENIX_SUPABASE_ANON = 'sb_publishable_W_QNdDR7wpYjgmZJQ_Bjsw_iS3TxZPA';
const APP_STATE_STORAGE_KEY = 'phoenix_erp_state_v1';

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

const MEMBER_NAME_MAP = {
  'mem-01': 'Pranav Bansode',
  'mem-02': 'Arshad Shaikh',
  'mem-03': 'Vivek Gajdhane',
  'mem-04': 'Aryan Bhore'
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

function safeId(id) {
  return String(id || '').replace(/[^a-zA-Z0-9_-]/g, '');
}

function sanitizeUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  try {
    const parsed = new URL(raw, window.location.origin);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch (e) {
    // Reject malformed URLs
  }
  return '';
}

function csvSafe(val) {
  let str = String(val === null || val === undefined ? '' : val);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

function requireAuth(actionDesc = 'perform this action') {
  if (!STATE.isAuthenticated || !STATE.activeRole) {
    showToast(`Authentication required to ${actionDesc}.`);
    return false;
  }
  return true;
}

function requireFounder(actionDesc = 'perform this executive action') {
  if (!requireAuth(actionDesc)) return false;
  if (STATE.activeRole !== 'pranav') {
    showToast(`Security Gate: Only Founder & Director Pranav Bansode can ${actionDesc}.`);
    return false;
  }
  return true;
}

function getCurrentMemberId() {
  if (STATE.activeRole === 'pranav') return 'mem-01';
  if (STATE.activeRole === 'arshad') return 'mem-02';
  if (STATE.activeRole === 'vivek') return 'mem-03';
  if (STATE.activeRole === 'aryan') return 'mem-04';
  return null;
}

function matchesDateFilter(dateStr) {
  const filter = STATE.dateFilter || 'current_month';
  if (filter === 'all_time' || !dateStr) return true;
  const isoDay = String(dateStr).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDay)) return true;

  if (filter === 'current_month') {
    return isoDay.startsWith('2026-11');
  }
  if (filter === 'previous_month') {
    return isoDay.startsWith('2026-10');
  }
  if (filter === 'last_3_months') {
    return isoDay >= '2026-09-01' && isoDay <= '2026-11-30';
  }
  if (filter === 'current_fy') {
    return isoDay >= '2026-04-01' && isoDay <= '2027-03-31';
  }
  return true;
}

function normalizeLead(lead) {
  if (!lead || typeof lead !== 'object') return lead;
  const canonicalStatus = lead.status || lead.stage || 'submitted_to_founder';
  return {
    ...lead,
    status: canonicalStatus,
    stage: canonicalStatus,
    founderInstructions: lead.founderInstructions || lead.founderNotes || '',
    deliverableUrl: lead.deliverableUrl || lead.techDeliverableUrl || '',
    approvedAt: lead.approvedAt || lead.finalDeliveryApprovedAt || null
  };
}

function saveAppStateToStorage() {
  try {
    const payload = {
      projects: STATE.projects,
      income: STATE.income,
      expenses: STATE.expenses,
      reserves: STATE.reserves,
      drawings: STATE.drawings,
      payouts: STATE.payouts,
      auditLogs: STATE.auditLogs,
      teamFinancials: (STATE.team || []).map((m) => ({
        id: m.id,
        pendingCompensation: m.pendingCompensation || 0,
        paymentsMade: m.paymentsMade || 0,
        drawingsYTD: m.drawingsYTD || 0
      }))
    };
    localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('App state save error:', e);
  }
}

function loadAppStateFromStorage() {
  try {
    const raw = localStorage.getItem(APP_STATE_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;
    if (Array.isArray(parsed.projects) && parsed.projects.length > 0) STATE.projects = parsed.projects;
    if (Array.isArray(parsed.income)) STATE.income = parsed.income;
    if (Array.isArray(parsed.expenses)) STATE.expenses = parsed.expenses;
    if (Array.isArray(parsed.reserves) && parsed.reserves.length > 0) STATE.reserves = parsed.reserves;
    if (Array.isArray(parsed.drawings)) STATE.drawings = parsed.drawings;
    if (Array.isArray(parsed.payouts)) STATE.payouts = parsed.payouts;
    if (Array.isArray(parsed.auditLogs) && parsed.auditLogs.length > 0) STATE.auditLogs = parsed.auditLogs;
    if (Array.isArray(parsed.teamFinancials)) {
      parsed.teamFinancials.forEach((tf) => {
        const mem = STATE.team.find((m) => m.id === tf.id);
        if (mem) {
          mem.pendingCompensation = Number(tf.pendingCompensation) || 0;
          mem.paymentsMade = Number(tf.paymentsMade) || 0;
          mem.drawingsYTD = Number(tf.drawingsYTD) || 0;
        }
      });
    }
  } catch (e) {
    console.warn('App state load error:', e);
  }
}

function recordAuditLog(action, details, performedBy) {
  STATE.auditLogs.unshift({
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    action,
    details,
    performedBy,
    date: new Date().toISOString().replace('T', ' ').slice(0, 16)
  });
  if (STATE.auditLogs.length > 200) STATE.auditLogs.length = 200;
  saveAppStateToStorage();
}

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
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeLead);
      }
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
  if (!STATE.isAuthenticated) return;
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
      STATE.assignedTasks = data.map((row) => {
        const mappedMember = UUID_MEMBER_MAP[row.assigned_to] || 'mem-02';
        const mappedProject = UUID_PROJECT_MAP[row.project_id] || 'general';
        const prj = STATE.projects.find((p) => p.id === mappedProject);
        return {
          id: row.id,
          title: row.title,
          description: row.description || '',
          assignedTo: mappedMember,
          assignedToName: MEMBER_NAME_MAP[mappedMember] || 'Team Member',
          projectId: mappedProject,
          projectName: prj ? prj.name : 'General Operations',
          priority: row.priority || 'medium',
          status: row.status || 'assigned',
          dueDate: row.due_date || '',
          assignedDate: (row.created_at || '').split('T')[0] || new Date().toISOString().split('T')[0],
          assignedBy: 'Pranav Bansode (Founder)',
          completedDate: row.completed_at ? row.completed_at.split('T')[0] : null
        };
      });
      saveAssignedTasksToStorage();

      if (STATE.currentTab === 'assign-projects') renderAssignProjects();
      if (STATE.currentTab === 'allocated-work') renderAllocatedWork();
      if (STATE.currentTab === 'approvals') renderApprovals();
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
  if (isNaN(d.getTime())) return escapeHtml(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Master State
const STATE = {
  isAuthenticated: false,
  activeRole: null,
  currentTab: 'dashboard-overview',
  selectedEmployeeId: 'mem-01',
  dateFilter: 'current_month',
  theme: localStorage.getItem('phoenix_theme') || 'light',
  loginAttempts: 0,
  loginLockoutUntil: 0,

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
      status: 'allocated_to_vivek',
      stage: 'allocated_to_vivek',
      founderInstructions: 'Vivek, please set up the review interceptor backend, database schema and QR redirect links by Friday.',
      dueDate: '2026-11-16',
      priority: 'high',
      allocatedTo: 'mem-03',
      allocatedToName: 'Vivek Gajdhane',
      allocatedAt: '2026-11-09',
      techNotes: '',
      deliverableUrl: '',
      techCompletedAt: null,
      arshadChecked: false,
      approvedAt: null
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
      status: 'submitted_to_founder',
      stage: 'submitted_to_founder',
      founderInstructions: '',
      dueDate: '',
      priority: 'high',
      allocatedTo: null,
      allocatedAt: null,
      techNotes: '',
      deliverableUrl: '',
      techCompletedAt: null,
      arshadChecked: false,
      approvedAt: null
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
  // Received Money (Directly from Income Tab - only actual received cash in active date range)
  const receivedRecords = STATE.income.filter(
    (i) => i.status === 'received' && matchesDateFilter(i.paymentDate)
  );
  const totalMoneyReceived = receivedRecords.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  // Pending client payments (awaiting clearance or Founder approval)
  const pendingRecords = STATE.income.filter(
    (i) => (i.status === 'pending' || i.status === 'pending_approval') && matchesDateFilter(i.paymentDate)
  );
  const pendingClientPayments = pendingRecords.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  // Approved Expenses
  const approvedExpenses = STATE.expenses.filter(
    (e) => e.status === 'approved' && matchesDateFilter(e.date)
  );
  const totalBusinessExpenses = approvedExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Salaries paid (filtered by date)
  const teamSalariesPaid = (STATE.payouts || [])
    .filter((p) => p.status === 'paid' && matchesDateFilter(p.paidDate))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Founder Drawings (filtered by date)
  const founderDrawingsTotal = (STATE.drawings || [])
    .filter((d) => matchesDateFilter(d.date))
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  // Reserves Earmarked
  const totalCompanyReserves = (STATE.reserves || []).reduce(
    (sum, r) => sum + (Number(r.currentBalance) || 0),
    0
  );

  // Net Business Profit (Revenue - Approved Operating Expenses - Salaries Paid)
  const netBusinessProfit = totalMoneyReceived - totalBusinessExpenses - teamSalariesPaid;

  // Unencumbered Available Company Cash
  const totalOutflows = totalBusinessExpenses + teamSalariesPaid + founderDrawingsTotal + totalCompanyReserves;
  const availableCompanyCash = Math.max(0, totalMoneyReceived - totalOutflows);

  return {
    totalMoneyReceived,
    pendingClientPayments,
    totalBusinessExpenses,
    teamSalariesPaid,
    founderDrawingsTotal,
    totalCompanyReserves,
    availableCompanyCash,
    netBusinessProfit,
  };
}

// Interconnected Project Calculation Helper
function getProjectFinancials(projectId) {
  const received = STATE.income
    .filter((i) => i.projectId === projectId && i.status === 'received' && matchesDateFilter(i.paymentDate))
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const pending = STATE.income
    .filter(
      (i) =>
        i.projectId === projectId &&
        (i.status === 'pending' || i.status === 'pending_approval') &&
        matchesDateFilter(i.paymentDate)
    )
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const expenses = STATE.expenses
    .filter((e) => e.projectId === projectId && e.status === 'approved' && matchesDateFilter(e.date))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const net = received - expenses;

  return { received, pending, expenses, net };
}

// Dynamic Project Dropdowns Sync (Interconnects Projects -> Income, Expense & Task forms)
function updateProjectSelectOptions() {
  const incSel = document.getElementById('inc-project');
  const expSel = document.getElementById('exp-project');
  const expFilterSel = document.getElementById('expense-project-filter');
  const taskProjSel = document.getElementById('task-project');

  if (incSel) {
    incSel.innerHTML = STATE.projects
      .map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} (${escapeHtml(p.code)})</option>`)
      .join('');
  }

  if (expSel) {
    expSel.innerHTML = `
      ${STATE.projects.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} (${escapeHtml(p.code)})</option>`).join('')}
      <option value="">General Company (Overhead)</option>
    `;
  }

  if (expFilterSel) {
    const prev = expFilterSel.value || 'ALL';
    expFilterSel.innerHTML = `
      <option value="ALL">All Projects</option>
      ${STATE.projects.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('')}
      <option value="GENERAL">General Operations</option>
    `;
    if ([...expFilterSel.options].some((o) => o.value === prev)) {
      expFilterSel.value = prev;
    }
  }

  if (taskProjSel) {
    const prev = taskProjSel.value || 'prj-leadx';
    taskProjSel.innerHTML = `
      ${STATE.projects.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('')}
      <option value="general">General Operations</option>
    `;
    if ([...taskProjSel.options].some((o) => o.value === prev)) {
      taskProjSel.value = prev;
    }
  }
}

// UI Initialization & Authentication Gate
document.addEventListener('DOMContentLoaded', () => {
  loadAppStateFromStorage();
  loadAssignedTasksFromStorage();
  setupTheme();
  setupDateFilter();
  updateProjectSelectOptions();

  // Ensure Login Portal screen is presented first on page load
  const urlParams = new URLSearchParams(window.location.search);
  const allowAutoLogin = urlParams.get('autologin') === 'true';
  const sessionUser = allowAutoLogin ? sessionStorage.getItem('phoenix_session_user') : null;

  if (
    sessionUser &&
    (sessionUser === 'pranav' || sessionUser === 'arshad' || sessionUser === 'vivek' || sessionUser === 'aryan')
  ) {
    loginAsUser(sessionUser, false);
    syncTasksFromSupabase();
  } else {
    STATE.isAuthenticated = false;
    STATE.activeRole = null;
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
        <span>🛠️</span> Tech & Infrastructure
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
  if (!requireAuth('switch views')) return;

  if (tabId === 'project-finance') {
    STATE.projectSubView = 'finance';
    tabId = 'projects';
  } else if (tabId === 'projects' && subView) {
    STATE.projectSubView = subView;
  }
  let normalized = normalizeTabId(tabId);

  // Security Gate: Non-founders cannot access executive financial tabs
  if (
    STATE.activeRole !== 'pranav' &&
    (normalized === 'dashboard-overview' ||
      normalized === 'founder-dashboard' ||
      normalized === 'approvals' ||
      normalized === 'assign-projects' ||
      normalized === 'sales-done' ||
      normalized === 'project-finance' ||
      normalized === 'financial-summary')
  ) {
    showToast('Confidential Section: Executive controls are reserved for Founder & Director Pranav Bansode.');
    normalized = 'employee-dashboard';
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
window.switchTab = switchTab;

function updateRoleDisplay() {
  if (!STATE.activeRole) return;
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
      btnIncome.onclick = window.openNewIncomeModal;
    }
    if (btnExpense) btnExpense.classList.remove('hidden');

  } else if (STATE.activeRole === 'arshad') {
    if (nameEl) nameEl.textContent = 'Arshad Shaikh';
    if (avatarText) avatarText.textContent = 'AS';
    if (crownBadge) {
      crownBadge.textContent = '🤝';
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
    if (currentRoleLabel) currentRoleLabel.innerHTML = '🤝 Co-Founder';
    if (topbarPill) {
      topbarPill.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        <span class="font-extrabold text-blue-700 dark:text-blue-300">Arshad Shaikh</span>
        <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">🤝 Co-Founder</span>
      `;
    }
    if (btnCsv) btnCsv.classList.add('hidden');
    if (btnIncome) {
      btnIncome.classList.remove('hidden');
      btnIncome.textContent = '+ Enroll Deal';
      btnIncome.onclick = window.openNewIncomeModal;
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
      if (!STATE.isAuthenticated) return;
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
  if (!STATE.isAuthenticated || STATE.activeRole !== 'pranav') return;
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

      <!-- Available Company Cash (Unencumbered) -->
      <div class="p-5 rounded-xl bg-[#026047] text-[#fffde8] shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs opacity-90 font-medium">Available Company Cash</span>
          <span class="px-2 py-0.5 text-[10px] rounded bg-white/20 text-[#fffde8] font-bold">Unencumbered</span>
        </div>
        <div class="text-2xl font-black text-[#fffde8] mt-2 min-h-[32px] flex items-center">${formatINR(m.availableCompanyCash)}</div>
        <div class="flex items-center justify-between text-[11px] opacity-80 mt-2">
          <span>Net Solvency Balance</span>
          <span>${m.availableCompanyCash >= 0 ? 'Solvent' : 'Deficit'}</span>
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

  // Company Verified Inflow Table (Respecting active date filter)
  const incomeTable = document.getElementById('income-table-body');
  if (incomeTable) {
    const filteredIncome = STATE.income.filter((inc) => matchesDateFilter(inc.paymentDate));
    if (filteredIncome.length === 0) {
      incomeTable.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-400 italic">No client inflows recorded for the selected period. Click "+ Enroll Income" to record revenue.</td></tr>`;
      return;
    }

    incomeTable.innerHTML = filteredIncome.map((inc) => {
      const sid = safeId(inc.id);
      const isReceived = inc.status === 'received';
      const isRejected = inc.status === 'rejected';
      const isPending = inc.status === 'pending_approval' || inc.status === 'pending';
      const badge = isReceived
        ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">✓ Settled &amp; Verified</span>'
        : isRejected
        ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">✕ Rejected</span>'
        : '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">⏳ Pending Approval</span>';

      return `
        <tr class="border-b border-slate-100 dark:border-slate-800 text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
          <td class="py-3 px-3 font-mono text-slate-500">${formatDate(inc.paymentDate)}</td>
          <td class="py-3 px-3">
            <div class="font-bold text-slate-900 dark:text-white">${escapeHtml(inc.clientName)}</div>
            <div class="text-[11px] text-slate-500">${escapeHtml(inc.source || 'Client Inflow')}</div>
            ${inc.createdBy ? `<div class="text-[10px] text-slate-400">Enrolled by: ${escapeHtml(inc.createdBy)}</div>` : ''}
          </td>
          <td class="py-3 px-3">
            <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">${escapeHtml(inc.projectName)}</span>
          </td>
          <td class="py-3 px-3 text-right font-black text-[#026047] dark:text-emerald-400 text-sm">${formatINR(inc.amount)}</td>
          <td class="py-3 px-3 text-center uppercase text-[10px] font-mono text-slate-600 dark:text-slate-400">${escapeHtml(inc.paymentMethod)}</td>
          <td class="py-3 px-3 text-center">${badge}</td>
          <td class="py-3 px-3 text-right">
            ${
              isPending
                ? `<div class="flex items-center justify-end gap-1">
                     <button onclick="approveIncome('${sid}')" class="px-2.5 py-1 rounded-md bg-[#026047] text-[#fffde8] font-bold text-xs hover:bg-[#024d39] shadow-sm transition">Approve</button>
                     <button onclick="rejectIncome('${sid}')" class="px-2 py-1 rounded-md border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-[10px] transition">Reject</button>
                   </div>`
                : isReceived
                ? `<div class="flex items-center justify-end gap-1.5">
                     <button onclick="openInvoiceModal('${sid}')" class="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px] transition">
                       View Invoice
                     </button>
                     <button onclick="downloadInvoiceDirect('${sid}')" class="px-2.5 py-1 rounded-md bg-[#026047] hover:bg-[#024d39] text-[#fffde8] font-bold text-[10px] shadow-sm transition">
                       Download
                     </button>
                   </div>`
                : '<span class="text-[10px] text-slate-400 italic">Closed</span>'
            }
          </td>
        </tr>
      `;
    }).join('');
  }
}

// Direct Invoice Download Helper
window.downloadInvoiceDirect = function (id) {
  if (!requireAuth('download invoices')) return;
  STATE.currentInvoiceId = id;
  downloadCurrentInvoice();
};

// ==============================================================================
// 2. AUTHENTICATION & LOGIN GATEWAY
// Role-based security for Pranav (Founder), Arshad (Co-Founder), Vivek & Aryan
// ==============================================================================

function loginAsUser(role, showToastMsg = true) {
  if (role !== 'pranav' && role !== 'arshad' && role !== 'vivek' && role !== 'aryan') {
    return;
  }
  STATE.isAuthenticated = true;
  STATE.activeRole = role;
  STATE.loginAttempts = 0;
  STATE.loginLockoutUntil = 0;
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

  if (role === 'arshad' || role === 'vivek' || role === 'aryan') {
    switchTab('employee-dashboard');
  } else {
    switchTab(STATE.currentTab || 'dashboard-overview');
  }

  syncTasksFromSupabase();

  if (showToastMsg) {
    let msg = 'Executive Mode: Pranav Bansode (Founder & Director) • Full Authority';
    if (role === 'arshad') msg = 'Confidential Session: Arshad Shaikh (Co-Founder) • Marketing & Planning Active';
    else if (role === 'vivek') msg = 'Confidential Session: Vivek Gajdhane (Technical Dept) • Architecture Active';
    else if (role === 'aryan') msg = 'Confidential Session: Aryan Bhore (Research Lead) • Market Research & Scouting Active';
    showToast(msg);
  }
}

// ==============================================================================
// UNIQUE CREDENTIALS MAPPING FOR ALL AUTHORIZED MEMBERS (OFFLINE FALLBACK)
// ==============================================================================
const MEMBER_CREDENTIALS = {
  pranav: {
    role: 'pranav',
    name: 'Pranav Bansode',
    designation: 'Founder & Director',
    email: 'pranav@phoenixtech.com',
    memberCode: 'PB-01',
    validIds: ['pb-01', 'pb01', 'pranav', 'pranav bansode', 'pranav.bansode', 'pranav@phoenixtech.com'],
    validPasswords: ['1001', 'pranav@1001', 'pb@2026', 'founder1001']
  },
  arshad: {
    role: 'arshad',
    name: 'Arshad Shaikh',
    designation: 'Co-Founder (Marketing & Planning)',
    email: 'arshad@phoenixtech.com',
    memberCode: 'AS-02',
    validIds: ['as-02', 'as02', 'arshad', 'arshad shaikh', 'arshad.shaikh', 'arshad@phoenixtech.com'],
    validPasswords: ['2002', 'arshad@2002', 'as@2026']
  },
  vivek: {
    role: 'vivek',
    name: 'Vivek Gajdhane',
    designation: 'Technical Department (Architecture)',
    email: 'vivek@phoenixtech.com',
    memberCode: 'VG-03',
    validIds: ['vg-03', 'vg03', 'vivek', 'vivek gajdhane', 'vivek.gajdhane', 'vivek@phoenixtech.com'],
    validPasswords: ['3003', 'vivek@3003', 'vg@2026']
  },
  aryan: {
    role: 'aryan',
    name: 'Aryan Bhore',
    designation: 'Research Lead',
    email: 'aryan@phoenixtech.com',
    memberCode: 'AB-04',
    validIds: ['ab-04', 'ab04', 'aryan', 'aryan bhore', 'aryan.bhore', 'aryan@phoenixtech.com'],
    validPasswords: ['4004', 'aryan@4004', 'ab@2026']
  }
};

function showLoginError(message) {
  const errBox = document.getElementById('common-login-error');
  const errText = document.getElementById('common-login-error-text');
  if (errBox && errText) {
    errText.textContent = message;
    errBox.classList.remove('hidden');
  } else {
    alert(message);
  }
}

function recordFailedLoginAttempt() {
  STATE.loginAttempts = (STATE.loginAttempts || 0) + 1;
  if (STATE.loginAttempts >= 5) {
    STATE.loginLockoutUntil = Date.now() + 30000;
  }
}

function resolveRoleFromDbUser(matchedDbUser) {
  const mIdUpper = (matchedDbUser.member_id || '').toUpperCase();
  const uRole = (matchedDbUser.role || '').toLowerCase();
  const uName = (matchedDbUser.name || '').toLowerCase();
  if (mIdUpper === 'PB-01' || uRole === 'founder_director' || uName === 'pranav bansode') return 'pranav';
  if (mIdUpper === 'AS-02' || uRole === 'co_founder' || uName === 'arshad shaikh') return 'arshad';
  if (mIdUpper === 'AB-04' || uRole === 'lead_acquisition' || uName === 'aryan bhore') return 'aryan';
  if (mIdUpper === 'VG-03' || uRole === 'technical' || uName === 'vivek gajdhane') return 'vivek';
  return uRole.includes('founder') ? 'pranav' : 'vivek';
}

window.handleCommonLogin = async function () {
  const idInput = document.getElementById('common-login-id');
  const passInput = document.getElementById('common-login-password');
  const errBox = document.getElementById('common-login-error');
  const submitBtn = document.getElementById('common-login-btn');
  const submitBtnText = document.getElementById('common-login-btn-text');

  if (errBox) errBox.classList.add('hidden');

  if (STATE.loginLockoutUntil && Date.now() < STATE.loginLockoutUntil) {
    const secs = Math.ceil((STATE.loginLockoutUntil - Date.now()) / 1000);
    showLoginError(`Too many failed sign-in attempts. Please wait ${secs}s before retrying.`);
    return;
  }

  const rawId = idInput ? idInput.value.trim() : '';
  const rawPass = passInput ? passInput.value.trim() : '';
  const lowerId = rawId.toLowerCase();
  const cleanId = lowerId.replace(/[\s\-_]/g, '');

  if (!rawId || !rawPass) {
    showLoginError('Please enter both your Member ID / Email and Password.');
    return;
  }

  if (submitBtn) submitBtn.disabled = true;
  if (submitBtnText) submitBtnText.textContent = 'Verifying Credentials...';

  try {
    // 1. SUPABASE DATABASE AUTHENTICATION (Targeted query on public.users)
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const escapeLike = (s) => String(s).replace(/[\\%_]/g, '\\$&');
        let matchedDbUser = null;

        // Normalize common member code format (e.g., pb01 -> PB-01)
        const normalizedCode = /^([a-z]{2})(\d{2})$/i.test(cleanId)
          ? cleanId.slice(0, 2).toUpperCase() + '-' + cleanId.slice(2)
          : rawId.toUpperCase();

        const lookupField = lowerId.includes('@') ? 'email' : 'member_id';
        const lookupVal = lowerId.includes('@') ? lowerId : normalizedCode;

        let { data: rows, error: dbErr } = await sb
          .from('users')
          .select('id, member_id, name, email, password, role, designation, status')
          .ilike(lookupField, escapeLike(lookupVal))
          .limit(1);

        if (!dbErr && (!rows || rows.length === 0) && !lowerId.includes('@')) {
          const nameRes = await sb
            .from('users')
            .select('id, member_id, name, email, password, role, designation, status')
            .ilike('name', escapeLike(rawId))
            .limit(1);
          if (!nameRes.error && nameRes.data && nameRes.data.length > 0) {
            rows = nameRes.data;
          }
        }

        if (!dbErr && Array.isArray(rows) && rows.length > 0) {
          matchedDbUser = rows[0];
        }

        if (matchedDbUser) {
          if (matchedDbUser.status && matchedDbUser.status.toLowerCase() !== 'active') {
            recordFailedLoginAttempt();
            showLoginError(`Account for ${matchedDbUser.name} is currently inactive. Contact Founder Pranav Bansode.`);
            return;
          }

          const savedPassword = (matchedDbUser.password || '').trim();
          if (savedPassword && savedPassword === rawPass) {
            const targetRole = resolveRoleFromDbUser(matchedDbUser);
            if (errBox) errBox.classList.add('hidden');
            loginAsUser(targetRole, false);
            recordAuditLog('USER_LOGIN', `Authenticated via database as ${matchedDbUser.name} (${matchedDbUser.member_id})`, matchedDbUser.name);
            showToast(`Welcome, ${matchedDbUser.name}! Signed in via Supabase Database.`);
            return;
          } else {
            recordFailedLoginAttempt();
            showLoginError(`Incorrect password for ${matchedDbUser.name}. Please verify your credentials.`);
            return;
          }
        }
      } catch (dbErr) {
        console.warn('[Phoenix Auth] Supabase users table lookup skipped:', dbErr.message);
      }
    }

    // 2. SUPABASE AUTH SERVICE (auth.users)
    try {
      const sbClient = getSupabaseClient();
      if (sbClient && sbClient.auth && lowerId.includes('@')) {
        const { data: authData, error: authError } = await sbClient.auth.signInWithPassword({
          email: lowerId,
          password: rawPass
        });

        if (!authError && authData && authData.user) {
          const uEmail = (authData.user.email || '').toLowerCase();
          let matchedRole = 'vivek';
          if (uEmail.includes('pranav') || uEmail.includes('pb-01')) matchedRole = 'pranav';
          else if (uEmail.includes('arshad') || uEmail.includes('as-02')) matchedRole = 'arshad';
          else if (uEmail.includes('aryan') || uEmail.includes('ab-04')) matchedRole = 'aryan';

          if (errBox) errBox.classList.add('hidden');
          loginAsUser(matchedRole, false);
          recordAuditLog('USER_LOGIN', `Authenticated via Supabase Auth (${uEmail})`, uEmail);
          showToast('Welcome! Authenticated via Supabase.');
          return;
        }
      }
    } catch (sbErr) {
      console.warn('[Phoenix Auth] Supabase Auth check skipped:', sbErr.message);
    }

    // 3. OFFLINE / LOCAL SYNCHRONIZED CREDENTIAL VERIFICATION
    let matchedMember = null;
    for (const key of Object.keys(MEMBER_CREDENTIALS)) {
      const mem = MEMBER_CREDENTIALS[key];
      const match = mem.validIds.some((v) => {
        const cleanV = v.toLowerCase().replace(/[\s\-_]/g, '');
        return (
          cleanV === cleanId ||
          v.toLowerCase() === lowerId ||
          mem.name.toLowerCase() === lowerId ||
          mem.email.toLowerCase() === lowerId
        );
      });
      if (match) {
        matchedMember = mem;
        break;
      }
    }

    if (!matchedMember) {
      recordFailedLoginAttempt();
      showLoginError(`User "${rawId}" not found. Authorized IDs: PB-01 (Pranav), AS-02 (Arshad), VG-03 (Vivek), AB-04 (Aryan).`);
      return;
    }

    if (!matchedMember.validPasswords.includes(rawPass)) {
      recordFailedLoginAttempt();
      showLoginError(`Incorrect password for ${matchedMember.name}. Please verify your PIN or password.`);
      return;
    }

    if (errBox) errBox.classList.add('hidden');
    loginAsUser(matchedMember.role);
    recordAuditLog('USER_LOGIN', `Authenticated session as ${matchedMember.name} (${matchedMember.memberCode})`, matchedMember.name);
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

window.logoutUser = function () {
  const prevRole = STATE.activeRole;
  sessionStorage.removeItem('phoenix_session_user');
  STATE.isAuthenticated = false;
  STATE.activeRole = null;
  STATE.currentTab = 'dashboard-overview';

  if (window.PhoenixSupabase && typeof window.PhoenixSupabase.logout === 'function') {
    window.PhoenixSupabase.logout().catch(() => {});
  }

  [
    'modal-new-project',
    'modal-new-income',
    'modal-new-expense',
    'modal-assign-task',
    'modal-invoice',
    'modal-new-lead',
    'modal-allocate-lead',
    'modal-tech-forward',
    'modal-delivery-approval',
    'modal-new-drawing',
    'modal-allocate-reserve'
  ].forEach((mId) => {
    const m = document.getElementById(mId);
    if (m) m.classList.add('hidden');
  });

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

  if (prevRole) {
    showToast('Signed out safely. Please sign in with your Unique ID & Password.');
  }
};

function updateLoginPills() {
  const current = STATE.activeRole || 'pranav';
  const sessionText = document.getElementById('emp-active-session-text');
  if (sessionText) {
    if (current === 'pranav') {
      sessionText.textContent = 'Session: Pranav Bansode (👑 Founder / Director)';
    } else if (current === 'arshad') {
      sessionText.textContent = 'Session: Arshad Shaikh (🤝 Co-Founder)';
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
      topbarBadge.textContent = '🤝 Co-Founder';
    } else if (current === 'vivek') {
      topbarName.textContent = 'Vivek Gajdhane';
      topbarBadge.textContent = '💻 Technical Dept';
    } else if (current === 'aryan') {
      topbarName.textContent = 'Aryan Bhore';
      topbarBadge.textContent = '🎯 Research Lead';
    }
  }
}

window.queueCompensationPayout = function (memberId) {
  if (!requireFounder('queue monthly compensation')) return;
  const mem = STATE.team.find((m) => m.id === memberId);
  if (!mem || mem.monthlyCompensation <= 0) return;

  mem.pendingCompensation = mem.monthlyCompensation;
  recordAuditLog('COMPENSATION_QUEUED', `Queued monthly retainer of ${formatINR(mem.monthlyCompensation)} for ${mem.name}`, 'Pranav Bansode (Founder / Director)');
  saveAppStateToStorage();
  renderEmployeeDashboard(STATE.selectedEmployeeId);
  renderSidebarNav(STATE.currentTab);
  showToast(`Queued ${formatINR(mem.monthlyCompensation)} retainer for ${mem.name} in Approvals.`);
};

window.recordCompensationPayout = function (memberId) {
  if (!requireFounder('authorize compensation disbursements')) return;
  const mem = STATE.team.find((m) => m.id === memberId);
  if (!mem) return;

  const amount = mem.pendingCompensation > 0 ? mem.pendingCompensation : mem.monthlyCompensation;
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

  recordAuditLog('COMPENSATION_PAYOUT', `Authorized monthly compensation payout of ${formatINR(amount)} to ${mem.name}`, 'Pranav Bansode (Founder / Director)');
  saveAppStateToStorage();

  renderEmployeeDashboard(STATE.selectedEmployeeId);
  if (STATE.currentTab === 'approvals') renderApprovals();
  if (STATE.currentTab === 'dashboard-overview') renderFounderDashboard();
  renderSidebarNav(STATE.currentTab);
  showToast(`Monthly compensation of ${formatINR(amount)} disbursed to ${mem.name}.`);
};

window.openNewDrawingModal = function () {
  if (!requireFounder('record executive drawings')) return;
  const modal = document.getElementById('modal-new-drawing');
  if (modal) modal.classList.remove('hidden');
};

window.closeNewDrawingModal = function () {
  const modal = document.getElementById('modal-new-drawing');
  if (modal) modal.classList.add('hidden');
};

window.submitNewDrawing = function () {
  if (!requireFounder('record executive drawings')) return;
  const purposeEl = document.getElementById('draw-purpose');
  const amountEl = document.getElementById('draw-amount');
  const purpose = purposeEl ? purposeEl.value.trim() : '';
  const amount = parseFloat(amountEl ? amountEl.value : '0') || 0;

  if (!purpose || amount <= 0) {
    alert('Please provide a valid purpose and positive amount.');
    return;
  }

  const ref = 'PTS-DRAW-' + String(Date.now()).slice(-6);
  STATE.drawings.unshift({
    id: 'draw-' + Date.now(),
    date: new Date().toISOString().split('T')[0],
    purpose,
    reference: ref,
    amount
  });

  const pranav = STATE.team.find((m) => m.id === 'mem-01');
  if (pranav) {
    pranav.drawingsYTD = (pranav.drawingsYTD || 0) + amount;
  }

  recordAuditLog('FOUNDER_DRAWING', `Recorded executive drawing of ${formatINR(amount)} (${purpose})`, 'Pranav Bansode (Founder / Director)');
  saveAppStateToStorage();

  if (purposeEl) purposeEl.value = '';
  if (amountEl) amountEl.value = '';
  window.closeNewDrawingModal();

  renderEmployeeDashboard('mem-01');
  if (STATE.currentTab === 'dashboard-overview') renderFounderDashboard();
  showToast(`Executive drawing of ${formatINR(amount)} recorded.`);
};

function renderEmployeeDashboard(memberId) {
  if (!requireAuth('view workspace dossier')) return;
  const container = document.getElementById('employee-dossier-container');
  if (!container) return;

  const activeUser = STATE.activeRole;
  updateLoginPills();

  if (activeUser === 'pranav') {
    const pranav = STATE.team.find((m) => m.id === 'mem-01') || STATE.team[0];
    const arshad = STATE.team.find((m) => m.id === 'mem-02');
    const vivek = STATE.team.find((m) => m.id === 'mem-03');
    const aryan = STATE.team.find((m) => m.id === 'mem-04');
    const m = calculateMetrics();
    const totalDrawingsYTD = (STATE.drawings || []).reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    const renderTeamCard = (member, badgeText, badgeColors, initials, scopeText, allocHtml) => {
      const mId = safeId(member.id);
      return `
        <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl bg-[#026047] text-[#fffde8] flex items-center justify-center font-black text-base shrink-0">
                ${escapeHtml(initials)}
              </div>
              <div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <h4 class="text-sm font-black text-slate-900 dark:text-white">${escapeHtml(member.name)}</h4>
                  <span class="px-2 py-0.5 rounded text-[9px] font-bold ${badgeColors}">${escapeHtml(badgeText)}</span>
                </div>
                <p class="text-[11px] text-slate-500">${escapeHtml(scopeText)}</p>
              </div>
            </div>
            ${member.pendingCompensation > 0
              ? `<button onclick="recordCompensationPayout('${mId}')" class="px-2.5 py-1.5 rounded-lg bg-[#026047] hover:bg-[#024d39] text-[#fffde8] text-[11px] font-bold shadow-sm flex items-center gap-1 transition shrink-0">
                  <span>👑</span> Clear (${formatINR(member.pendingCompensation, false)})
                </button>`
              : `<button onclick="queueCompensationPayout('${mId}')" class="px-2.5 py-1 rounded-lg border border-[#026047]/30 bg-emerald-50 dark:bg-emerald-950/50 text-[#026047] dark:text-emerald-300 hover:bg-emerald-100 text-[10px] font-bold transition shrink-0">
                  + Queue Retainer
                </button>`
            }
          </div>

          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span class="text-[10px] text-slate-400 uppercase font-semibold">Monthly</span>
              <div class="font-bold text-xs text-slate-900 dark:text-white mt-0.5">${formatINR(member.monthlyCompensation, false)}</div>
            </div>
            <div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span class="text-[10px] text-slate-400 uppercase font-semibold">Pending</span>
              <div class="font-bold text-xs ${member.pendingCompensation > 0 ? 'text-amber-600' : 'text-emerald-600'} mt-0.5">
                ${member.pendingCompensation > 0 ? formatINR(member.pendingCompensation, false) : '₹0'}
              </div>
            </div>
            <div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span class="text-[10px] text-slate-400 uppercase font-semibold">Paid YTD</span>
              <div class="font-bold text-xs text-[#026047] dark:text-emerald-400 mt-0.5">${formatINR(member.paymentsMade, false)}</div>
            </div>
          </div>

          <div class="space-y-1.5 text-xs">
            <span class="text-[10px] text-slate-400 font-bold uppercase">Deliverables &amp; Scope</span>
            ${allocHtml}
          </div>
        </div>
      `;
    };

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
          Executive Authority: Team Oversight &amp; Payout Governance
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
                <span>👑</span> FOUNDER &amp; DIRECTOR
              </div>
              <h2 class="text-xl font-black text-[#fffde8]">${escapeHtml(pranav.name)}</h2>
              <p class="text-xs text-[#fffde8]/80">Sole Signatory &bull; Phoenix Tech Solutions Private Limited</p>
            </div>
          </div>
          <div class="p-3 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-xs sm:text-right">
            <span class="text-[10px] text-[#fffde8]/70 block uppercase font-bold">Remuneration Model</span>
            <div class="font-extrabold text-sm text-[#fffde8] mt-0.5">Retained Equity &amp; Executive Drawings</div>
            <div class="text-[11px] text-emerald-300 mt-1">Non-Salaried &bull; 100% Director Governance</div>
          </div>
        </div>
      </div>

      <!-- Founder Drawings & Capital Position -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">1. Founder Drawings &amp; Capital Position</h3>
            <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-[#026047] font-bold">Direct Profit Share</span>
          </div>
          <div class="grid grid-cols-2 gap-3 pt-1">
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span class="text-[10px] text-slate-400 font-bold uppercase">Executive Drawings YTD</span>
              <div class="text-lg font-bold text-[#026047] dark:text-emerald-400 mt-0.5">${formatINR(totalDrawingsYTD)}</div>
            </div>
            <div class="p-3 rounded-lg bg-[#fffde8] dark:bg-[#026047]/20 border border-[#026047]/30">
              <span class="text-[10px] text-[#026047] dark:text-emerald-300 font-bold uppercase">Unencumbered Company Cash</span>
              <div class="text-lg font-black text-[#026047] dark:text-[#fffde8] mt-0.5">${formatINR(m.availableCompanyCash)}</div>
            </div>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
            Founder remuneration is structured as capital distributions against reconciled net operating surplus, preserving corporate liquidity and solvency.
          </p>
        </div>

        <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">2. Strategic Project Governance</h3>
            <span class="text-[10px] font-mono text-slate-400">LEADX &amp; SMART REVIEW</span>
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
            <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">3. Executive Drawings &amp; Payout Ledger</h3>
            <p class="text-[11px] text-slate-500">Confidential director disbursements against audited operating profits</p>
          </div>
          <button onclick="openNewDrawingModal()" class="px-3 py-1 rounded-lg bg-[#026047] text-[#fffde8] text-xs font-bold hover:bg-[#024d39] transition">
            + Record Drawing
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold text-[11px]">
                <th class="py-2.5 px-3">Date</th>
                <th class="py-2.5 px-3">Purpose &amp; Description</th>
                <th class="py-2.5 px-3 font-mono">Reference</th>
                <th class="py-2.5 px-3 text-right">Amount (₹)</th>
                <th class="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${(STATE.drawings || []).length === 0
                ? '<tr><td colspan="5" class="py-6 text-center text-slate-400 italic">No executive drawings recorded yet.</td></tr>'
                : (STATE.drawings || []).map((d) => `
                  <tr>
                    <td class="py-3 px-3 font-mono text-slate-500">${formatDate(d.date)}</td>
                    <td class="py-3 px-3 font-semibold text-slate-900 dark:text-white">${escapeHtml(d.purpose)}</td>
                    <td class="py-3 px-3 font-mono text-slate-500 text-[11px]">${escapeHtml(d.reference)}</td>
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

      <!-- 4. DETAILED OVERVIEW: CORE TEAM MEMBERS -->
      <div class="space-y-4 pt-4 border-t-2 border-slate-200 dark:border-slate-800">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-base">👑</span>
              <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Detailed Overview: Core Team Members
              </h3>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Individual member portfolios, monthly compensation tracking, deliverables, and director payout authorization.
            </p>
          </div>
          <span class="px-2.5 py-1 rounded-full bg-[#026047] text-[#fffde8] text-[10px] font-black uppercase tracking-wider self-start sm:self-auto">
            Director Governance
          </span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          ${renderTeamCard(
            arshad,
            '🤝 CO-FOUNDER',
            'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300',
            'AS',
            'Marketing, Meetings & Business Planning',
            `<div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-[11px] space-y-1.5 border border-slate-100 dark:border-slate-800">
               <div><strong>LeadX (40% Split):</strong> Client pitch meetings &amp; B2B pipeline.</div>
               <div class="pt-1 border-t border-slate-200 dark:border-slate-700"><strong>Smart Review (35% Split):</strong> Hospitality outreach &amp; digital strategy.</div>
             </div>`
          )}
          ${renderTeamCard(
            vivek,
            '💻 TECHNICAL DEPT',
            'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300',
            'VG',
            'Development, Architecture & Implementation',
            `<div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-[11px] space-y-1.5 border border-slate-100 dark:border-slate-800">
               <div><strong>LeadX (30% Split):</strong> AWS scrapers, cluster architecture &amp; portal UI.</div>
               <div class="pt-1 border-t border-slate-200 dark:border-slate-700"><strong>Smart Review (40% Split):</strong> Sentiment NLP, QR routing &amp; APIs.</div>
             </div>`
          )}
          ${aryan ? renderTeamCard(
            aryan,
            '🎯 RESEARCH LEAD',
            'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300',
            'AB',
            'Market Research, Scouting & Lead Qualification',
            `<div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-[11px] space-y-1.5 border border-slate-100 dark:border-slate-800">
               <div><strong>Pipeline Entry:</strong> B2B client discovery &amp; requirement scoping.</div>
               <div class="pt-1 border-t border-slate-200 dark:border-slate-700"><strong>Routing:</strong> Submits qualified deals directly to Founder Pranav.</div>
             </div>`
          ) : ''}
        </div>

        <!-- Combined Team Compensation Payout Ledger -->
        <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div>
              <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Historical Team Compensation Ledger</h3>
              <p class="text-[11px] text-slate-500">Disbursements authorized by Founder &amp; Director</p>
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
                ${(STATE.payouts || []).length === 0
                  ? '<tr><td colspan="8" class="py-6 text-center text-slate-400 italic">No compensation disbursements recorded yet.</td></tr>'
                  : (STATE.payouts || []).map((p) => `
                    <tr>
                      <td class="py-3 px-3 font-bold text-slate-900 dark:text-white">${escapeHtml(p.memberName)}</td>
                      <td class="py-3 px-3 text-slate-600 dark:text-slate-400">${escapeHtml(p.month)}</td>
                      <td class="py-3 px-3 font-mono text-slate-500">${formatDate(p.paidDate)}</td>
                      <td class="py-3 px-3 font-mono text-slate-500 text-[11px]">${escapeHtml(p.reference)}</td>
                      <td class="py-3 px-3 text-slate-600 dark:text-slate-400">${escapeHtml(p.paymentMethod)}</td>
                      <td class="py-3 px-3 text-right font-black text-[#026047] dark:text-emerald-400">${formatINR(p.amount)}</td>
                      <td class="py-3 px-3 text-center">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">✓ Paid</span>
                      </td>
                      <td class="py-3 px-3 text-right text-slate-500 text-[11px]">${escapeHtml(p.authorizedBy)}</td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } else {
    // NON-FOUNDER SESSION: Private individual portfolio only.
    const isArshad = activeUser === 'arshad';
    const isAryan = activeUser === 'aryan';
    const currentMemberId = isArshad ? 'mem-02' : (isAryan ? 'mem-04' : 'mem-03');

    const mem = STATE.team.find((m) => m.id === currentMemberId) || STATE.team[isArshad ? 1 : (isAryan ? 3 : 2)];
    const initials = isArshad ? 'AS' : (isAryan ? 'AB' : 'VG');
    const roleEmoji = isArshad ? '🤝' : (isAryan ? '🎯' : '💻');
    const badgeColorClass = isArshad
      ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
      : isAryan
      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
      : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300';
    const prj1Share = isArshad ? '40% Share' : (isAryan ? 'Lead Pipeline' : '30% Share');
    const prj2Share = isArshad ? '35% Share' : (isAryan ? 'Lead Pipeline' : '40% Share');
    const memberPayouts = (STATE.payouts || []).filter((p) => p.memberId === currentMemberId);

    container.innerHTML = `
      <!-- Active Login Session Indicator Banner -->
      <div class="p-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full ${isArshad ? 'bg-blue-500' : (isAryan ? 'bg-emerald-500' : 'bg-purple-500')}"></span>
          <span class="text-slate-500 dark:text-slate-400">Authenticated Session:</span>
          <span class="font-extrabold text-slate-900 dark:text-white">${escapeHtml(mem.name)}</span>
          <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${badgeColorClass}">
            ${roleEmoji} ${escapeHtml(mem.designation)}
          </span>
        </div>
        <div class="text-[11px] text-slate-500 dark:text-slate-400">
          Private Individual Portfolio &bull; Company Executive Drawings Confidential
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
                <span>${roleEmoji}</span> ${escapeHtml(mem.designation.toUpperCase())}
              </div>
              <h2 class="text-xl font-black text-slate-900 dark:text-white">${escapeHtml(mem.name)}</h2>
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
          <div class="text-[11px] text-slate-500 pt-1">Fixed core member remuneration</div>
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
            <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Your Payment History &amp; Payout Ledger</h3>
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
              ${memberPayouts.length === 0
                ? '<tr><td colspan="7" class="py-6 text-center text-slate-400 italic">No disbursements recorded for your account yet.</td></tr>'
                : memberPayouts.map((p) => `
                  <tr>
                    <td class="py-3 px-3 font-bold text-slate-900 dark:text-white">${escapeHtml(p.month)}</td>
                    <td class="py-3 px-3 font-mono text-slate-500">${formatDate(p.paidDate)}</td>
                    <td class="py-3 px-3 font-mono text-slate-500 text-[11px]">${escapeHtml(p.reference)}</td>
                    <td class="py-3 px-3 text-slate-600 dark:text-slate-400">${escapeHtml(p.paymentMethod)}</td>
                    <td class="py-3 px-3 text-right font-black text-[#026047] dark:text-emerald-400">${formatINR(p.amount)}</td>
                    <td class="py-3 px-3 text-center">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">✓ Paid</span>
                    </td>
                    <td class="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">${escapeHtml(p.authorizedBy)}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Assigned Projects & Key Deliverables + Incentives -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Assigned Projects &amp; Key Deliverables</h3>
            <span class="text-[10px] font-mono text-slate-400">ACTIVE</span>
          </div>
          <div class="space-y-3 text-xs">
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-900 dark:text-white">LeadX (PRJ-LEADX)</span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-[#fffde8] text-[#026047] font-bold border border-[#026047]/30">${prj1Share}</span>
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
                <span class="text-[10px] px-2 py-0.5 rounded bg-[#fffde8] text-[#026047] font-bold border border-[#026047]/30">${prj2Share}</span>
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
              <span class="text-slate-500">LeadX Allocation:</span>
              <strong class="text-slate-900 dark:text-white">${prj1Share}</strong>
            </div>
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-slate-500">Smart Review Allocation:</span>
              <strong class="text-slate-900 dark:text-white">${prj2Share}</strong>
            </div>
          </div>
        </div>
      </div>

      ${renderLeadPipelineSection()}
    `;
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

function getProjectDisplayName(projectId, fallbackName, generalLabel = 'Company General') {
  if (fallbackName) return fallbackName;
  if (!projectId) return generalLabel;
  const prj = (STATE.projects || []).find((p) => p.id === projectId);
  return prj ? prj.name : generalLabel;
}

function renderApprovals() {
  const metricsEl = document.getElementById('approvals-metrics-container');
  const tableBody = document.getElementById('approvals-table-body');
  const leadPipeEl = document.getElementById('approvals-lead-pipeline');
  const approveAllBtn = document.getElementById('btn-approve-all-pending');
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
        title: inc.source || 'Client Inflow Deal',
        purpose: `${inc.clientName || 'Client'} Contract Payment`,
        submittedBy: inc.createdBy || 'Team Member',
        project: getProjectDisplayName(inc.projectId, inc.projectName, 'LeadX'),
        amount: Number(inc.amount) || 0,
        scopeDisplay: formatINR(inc.amount),
        date: inc.paymentDate || '',
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
        purpose: `${formatExpenseCategory(exp.category)} Reimbursement`,
        submittedBy: exp.paidBy || 'Team Member',
        project: getProjectDisplayName(exp.projectId, exp.projectName, 'Company General'),
        amount: Number(exp.amount) || 0,
        scopeDisplay: formatINR(exp.amount),
        date: exp.date || '',
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
        purpose: 'Monthly Agreed Retainer',
        submittedBy: mem.name,
        project: mem.role,
        amount: Number(mem.pendingCompensation) || 0,
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
        date: task.dueDate || task.assignedDate || '',
        statusLabel: 'Review Pending',
        badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
      });
    }
  });

  if (approveAllBtn) {
    const hasPending = pendingItems.length > 0;
    approveAllBtn.disabled = !hasPending;
    approveAllBtn.classList.toggle('opacity-50', !hasPending);
    approveAllBtn.classList.toggle('cursor-not-allowed', !hasPending);
  }

  // Update Summary Metrics
  if (metricsEl) {
    const totalPendingCount = pendingItems.length;
    const pendingInflowAmt = pendingItems
      .filter((i) => i.type === 'INCOME')
      .reduce((sum, i) => sum + i.amount, 0);
    const pendingExpenseAmt = pendingItems
      .filter((i) => i.type === 'EXPENSE' || i.type === 'PAYOUT')
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
        <span class="text-[11px] text-slate-500 font-medium">Pending Expenses &amp; Payouts</span>
        <div class="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">${formatINR(pendingExpenseAmt)}</div>
        <div class="text-[10px] text-slate-400 mt-1">Outflow claims awaiting review</div>
      </div>
      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[11px] text-slate-500 font-medium">Pending Work Deliverables</span>
        <div class="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">${pendingTaskCount} Tasks</div>
        <div class="text-[10px] text-purple-500 mt-1">Submitted by team members</div>
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
  } else {
    tableBody.innerHTML = visibleItems
      .map((item) => {
        const itemId = safeId(item.id);
        const rType = safeId(item.rawType);
        return `
      <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
        <td class="py-3 px-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${item.badgeClass}">${escapeHtml(item.type)}</span>
        </td>
        <td class="py-3 px-3">
          <div class="font-bold text-slate-900 dark:text-white">${escapeHtml(item.title)}</div>
          <div class="text-[11px] text-slate-500">${escapeHtml(item.purpose)}</div>
        </td>
        <td class="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">${escapeHtml(item.submittedBy)}</td>
        <td class="py-3 px-3">
          <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]">${escapeHtml(item.project)}</span>
        </td>
        <td class="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">${escapeHtml(item.scopeDisplay)}</td>
        <td class="py-3 px-3 font-mono text-slate-500 text-[11px]">${escapeHtml(item.date)}</td>
        <td class="py-3 px-3 text-center">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            ${escapeHtml(item.statusLabel)}
          </span>
        </td>
        <td class="py-3 px-3 text-right whitespace-nowrap">
          <div class="inline-flex items-center gap-1.5">
            <button onclick="approveApprovalItem('${rType}', '${itemId}')"
              class="px-2.5 py-1 rounded-lg bg-[#026047] hover:bg-[#024d39] text-[#fffde8] font-bold text-[11px] transition inline-flex items-center gap-1 shadow-sm">
              <span>👑</span> Approve
            </button>
            <button onclick="rejectApprovalItem('${rType}', '${itemId}')"
              class="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-[11px] transition inline-flex items-center"
              title="${item.rawType === 'task' ? 'Return to In Progress' : 'Reject Request'}">
              ${item.rawType === 'task' ? '↺ Return' : '✕ Reject'}
            </button>
          </div>
        </td>
      </tr>
    `;
      })
      .join('');
  }

  if (leadPipeEl) {
    leadPipeEl.innerHTML = renderLeadPipelineSection();
  }
}
window.renderApprovals = renderApprovals;

function completeTaskRecord(task) {
  task.status = 'completed';
  task.completedDate = new Date().toISOString().split('T')[0];
  task.approvedBy = 'Pranav Bansode (Founder)';

  const sb = getSupabaseClient();
  if (sb && task.id && task.id.includes('-') && !task.id.startsWith('task-')) {
    sb.from('assigned_tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', task.id)
      .then(({ error }) => {
        if (error) console.warn('Supabase task completion sync note:', error.message);
      });
  }
}

function approveApprovalItem(type, id) {
  if (!requireFounder('sign off approvals')) return;

  if (type === 'income') {
    const item = (STATE.income || []).find((i) => i.id === id);
    if (!item || item.status === 'received') return;

    item.status = 'received';
    item.approvedBy = 'Pranav Bansode (Founder / Director)';
    item.approvedDate = new Date().toISOString().split('T')[0];
    item.approvedAt = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const prj = (STATE.projects || []).find((p) => p.id === item.projectId);
    if (prj) prj.revenueReceived = (prj.revenueReceived || 0) + (Number(item.amount) || 0);

    recordAuditLog(
      'INCOME_VERIFIED',
      `Founder approved client inflow ₹${(Number(item.amount) || 0).toLocaleString('en-IN')} from ${item.clientName} for ${item.projectName || item.projectId}`,
      'Pranav Bansode (Founder / Director)'
    );
    saveAppStateToStorage();
    showToast(`Approved: ${item.clientName} inflow of ${formatINR(item.amount)} verified!`);
  } else if (type === 'expense') {
    const item = (STATE.expenses || []).find((e) => e.id === id);
    if (!item || item.status === 'approved') return;

    item.status = 'approved';
    item.approvedBy = 'Pranav Bansode (Founder / Director)';
    item.approvedDate = new Date().toISOString().split('T')[0];

    if (item.projectId) {
      const prj = (STATE.projects || []).find((p) => p.id === item.projectId);
      if (prj) prj.directExpenses = (prj.directExpenses || 0) + (Number(item.amount) || 0);
    }

    recordAuditLog(
      'EXPENSE_APPROVED',
      `Founder approved expense ₹${(Number(item.amount) || 0).toLocaleString('en-IN')} for ${item.title}`,
      'Pranav Bansode (Founder / Director)'
    );
    saveAppStateToStorage();
    showToast(`Approved: Expense ${formatINR(item.amount)} approved!`);
  } else if (type === 'payout') {
    if (typeof window.recordCompensationPayout === 'function') {
      window.recordCompensationPayout(id);
      return;
    }
  } else if (type === 'task') {
    const task = (STATE.assignedTasks || []).find((t) => t.id === id);
    if (!task || task.status === 'completed') return;

    completeTaskRecord(task);
    recordAuditLog(
      'DELIVERABLE_APPROVED',
      `Founder approved deliverable: ${task.title} completed by ${task.assignedToName}`,
      'Pranav Bansode (Founder / Director)'
    );
    saveAssignedTasksToStorage();
    saveAppStateToStorage();
    showToast(`Approved: Deliverable "${task.title}" verified and completed!`);
  }

  renderApprovals();
  renderFounderDashboard();
  renderProjects();
  renderReports();
  renderSidebarNav(STATE.currentTab);
}
window.approveApprovalItem = approveApprovalItem;

function rejectApprovalItem(type, id) {
  if (!requireFounder('reject pending requests')) return;

  if (type === 'income') {
    window.rejectIncome(id);
    return;
  } else if (type === 'expense') {
    window.rejectExpense(id);
    return;
  } else if (type === 'payout') {
    const mem = (STATE.team || []).find((m) => m.id === id);
    if (!mem || !mem.pendingCompensation) return;
    const prevAmt = mem.pendingCompensation;
    mem.pendingCompensation = 0;
    recordAuditLog(
      'COMPENSATION_CANCELLED',
      `Founder cancelled queued compensation payout of ${formatINR(prevAmt)} for ${mem.name}`,
      'Pranav Bansode (Founder / Director)'
    );
    saveAppStateToStorage();
    showToast(`Cleared queued payout for ${mem.name}.`);
  } else if (type === 'task') {
    const task = (STATE.assignedTasks || []).find((t) => t.id === id);
    if (!task || task.status !== 'review_pending') return;
    task.status = 'in_progress';
    saveAssignedTasksToStorage();

    const sb = getSupabaseClient();
    if (sb && task.id && task.id.includes('-') && !task.id.startsWith('task-')) {
      sb.from('assigned_tasks')
        .update({ status: 'in_progress', completed_at: null })
        .eq('id', task.id)
        .then(({ error }) => {
          if (error) console.warn('Supabase task return sync note:', error.message);
        });
    }

    recordAuditLog(
      'DELIVERABLE_RETURNED',
      `Founder returned deliverable "${task.title}" to ${task.assignedToName} for revisions.`,
      'Pranav Bansode (Founder / Director)'
    );
    saveAppStateToStorage();
    showToast(`Returned "${task.title}" to ${task.assignedToName} for revisions.`);
  }

  renderApprovals();
  renderFounderDashboard();
  renderSidebarNav(STATE.currentTab);
}
window.rejectApprovalItem = rejectApprovalItem;

function approveAllPendingRequests() {
  if (!requireFounder('batch approve pending requests')) return;

  let count = 0;

  // 1. Inflows
  (STATE.income || []).forEach((i) => {
    if (i.status === 'pending_approval') {
      i.status = 'received';
      i.approvedBy = 'Pranav Bansode (Founder / Director)';
      i.approvedDate = new Date().toISOString().split('T')[0];
      i.approvedAt = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const prj = (STATE.projects || []).find((p) => p.id === i.projectId);
      if (prj) prj.revenueReceived = (prj.revenueReceived || 0) + (Number(i.amount) || 0);
      count++;
    }
  });

  // 2. Expenses
  (STATE.expenses || []).forEach((e) => {
    if (e.status === 'pending_approval') {
      e.status = 'approved';
      e.approvedBy = 'Pranav Bansode (Founder / Director)';
      e.approvedDate = new Date().toISOString().split('T')[0];
      if (e.projectId) {
        const prj = (STATE.projects || []).find((p) => p.id === e.projectId);
        if (prj) prj.directExpenses = (prj.directExpenses || 0) + (Number(e.amount) || 0);
      }
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
      completeTaskRecord(t);
      count++;
    }
  });

  if (count > 0) {
    saveAssignedTasksToStorage();
    recordAuditLog(
      'BATCH_APPROVAL',
      `Founder Pranav Bansode batch approved ${count} pending corporate requests across inflows, expenses, comp and tasks.`,
      'Pranav Bansode (Founder / Director)'
    );
    saveAppStateToStorage();
    showToast(`⚡ Success: All ${count} pending requests approved!`);
  } else {
    showToast('No pending approval requests to clear.');
  }

  renderApprovals();
  renderFounderDashboard();
  renderProjects();
  renderReports();
  renderSidebarNav(STATE.currentTab);
}
window.approveAllPendingRequests = approveAllPendingRequests;

// ==============================================================================
// ASSIGN PROJECTS (FOUNDER VIEW - PRANAV BANSODE)
// Delegate project scopes, milestones and tasks to Arshad Shaikh & Vivek Gajdhane
// ==============================================================================
function getInitials(name, fallback = 'TM') {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return fallback;
}

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
        <div class="text-[10px] text-slate-400 mt-1">LeadX &amp; Smart Review</div>
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
        <span class="text-[11px] text-slate-500 font-medium">Completed &amp; Verified</span>
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
  } else {
    container.innerHTML = filtered
      .map((task) => {
        const tId = safeId(task.id);
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
              <span>✅</span> Completed &amp; Verified
            </span>
          `;
        }

        const initials = getInitials(task.assignedToName, task.assignedTo === 'mem-02' ? 'AS' : 'VG');

        return `
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${priorityClass}">${escapeHtml(task.priority)}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">${escapeHtml(task.projectName)}</span>
              <span class="text-[11px] text-slate-400">Assigned: ${escapeHtml(task.assignedDate)}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[11px] text-slate-500">Due: <strong class="text-slate-900 dark:text-white">${escapeHtml(task.dueDate)}</strong></span>
              <button onclick="deleteAssignedTask('${tId}')" class="p-1 rounded text-slate-400 hover:text-rose-600 transition" title="Delete Task">
                🗑️
              </button>
            </div>
          </div>

          <div>
            <h4 class="font-bold text-sm text-slate-900 dark:text-white">${escapeHtml(task.title)}</h4>
            <p class="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">${escapeHtml(task.description)}</p>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-[#026047] text-[#fffde8] flex items-center justify-center font-bold text-[10px]">
                ${escapeHtml(initials)}
              </div>
              <div>
                <span class="text-slate-500">Assigned To:</span>
                <strong class="text-slate-900 dark:text-white ml-1">${escapeHtml(task.assignedToName)}</strong>
              </div>
            </div>
            <div class="flex items-center gap-2">
              ${statusBadge}
              ${
                task.status === 'review_pending'
                  ? `<button onclick="approveApprovalItem('task', '${tId}')" class="px-2.5 py-1 rounded-lg bg-[#026047] hover:bg-[#024d39] text-[#fffde8] font-bold text-xs transition inline-flex items-center gap-1 shadow-sm">
                      <span>👑</span> Approve Deliverable
                    </button>`
                  : ''
              }
            </div>
          </div>
        </div>
      `;
      })
      .join('');
  }
}
window.renderAssignProjects = renderAssignProjects;

function openAssignTaskModal() {
  if (!requireFounder('delegate project tasks')) return;
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
  if (!requireFounder('assign deliverables to team members')) return;
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

  const assignedToName = MEMBER_NAME_MAP[assignedTo] || 'Vivek Gajdhane';
  const prjObj = (STATE.projects || []).find((p) => p.id === project);
  const projectName = prjObj ? prjObj.name : 'General Operations';

  const newTask = {
    id: 'task-' + Date.now(),
    title,
    assignedTo,
    assignedToName,
    projectId: project,
    projectName,
    priority,
    dueDate,
    assignedDate: new Date().toISOString().split('T')[0],
    assignedBy: 'Pranav Bansode (Founder)',
    description: desc,
    status: 'assigned',
  };

  STATE.assignedTasks.unshift(newTask);

  // Sync insert to Supabase assigned_tasks table if UUID mapped
  const sb = getSupabaseClient();
  if (sb && MEMBER_UUID_MAP[assignedTo]) {
    const targetMemberUuid = MEMBER_UUID_MAP[assignedTo];
    const targetProjectUuid = PROJECT_UUID_MAP[project] || null;

    sb.from('assigned_tasks')
      .insert({
        title,
        description: desc || '',
        assigned_to: targetMemberUuid,
        project_id: targetProjectUuid,
        priority: priority || 'medium',
        status: 'assigned',
        due_date: dueDate || null,
      })
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.warn('Supabase task insert note:', error.message);
        } else if (data && data.id) {
          newTask.id = data.id;
          saveAssignedTasksToStorage();
        }
      });
  }

  recordAuditLog(
    'TASK_ASSIGNED',
    `Founder assigned deliverable "${title}" to ${assignedToName} (${projectName})`,
    'Pranav Bansode (Founder / Director)'
  );
  saveAssignedTasksToStorage();
  saveAppStateToStorage();

  closeAssignTaskModal();
  const titleInput = document.getElementById('task-title');
  if (titleInput) titleInput.value = '';
  const descInput = document.getElementById('task-desc');
  if (descInput) descInput.value = '';

  renderAssignProjects();
  renderSidebarNav(STATE.currentTab);
  showToast(`Deliverable successfully assigned to ${assignedToName}!`);
}
window.submitAssignTask = submitAssignTask;

function deleteAssignedTask(id) {
  if (!requireFounder('remove delegated tasks')) return;
  if (!confirm('Are you sure you want to remove this delegated task?')) return;
  STATE.assignedTasks = (STATE.assignedTasks || []).filter((t) => t.id !== id);
  saveAssignedTasksToStorage();

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
// ALLOCATED WORK (EMPLOYEE VIEW - ARSHAD SHAIKH, VIVEK GAJDHANE, ARYAN BHORE)
// ==============================================================================
function renderAllocatedWork() {
  const sessionPill = document.getElementById('allocated-work-session-pill');
  const metricsEl = document.getElementById('allocated-work-metrics');
  const container = document.getElementById('allocated-work-container');
  const leadPipeEl = document.getElementById('allocated-lead-pipeline');
  if (!container) return;

  const currentRole = STATE.activeRole || 'arshad';
  const currentMemberId = getCurrentMemberId();
  const currentMember = (STATE.team || []).find((m) => m.id === currentMemberId) || {
    name: MEMBER_NAME_MAP[currentMemberId] || 'Team Member',
    designation: 'Team Department',
  };
  const displayRole =
    currentMember.designation ||
    currentMember.role ||
    (currentRole === 'aryan' ? 'Research Lead' : 'Technical Department');

  if (sessionPill) {
    sessionPill.innerHTML = `
      <span>Allocated To: </span>
      <strong class="text-slate-900 dark:text-white font-black">${escapeHtml(currentMember.name)}</strong>
      <span class="text-[10px] text-slate-500 ml-1">(${escapeHtml(displayRole)})</span>
    `;
  }

  const myTasks = (STATE.assignedTasks || []).filter((t) => t.assignedTo === currentMemberId);

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
        <span class="text-[11px] text-slate-500 font-medium">Approved &amp; Verified</span>
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
  } else {
    container.innerHTML = myTasks
      .map((task) => {
        const tId = safeId(task.id);
        let priorityClass = 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
        if (task.priority === 'urgent')
          priorityClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
        else if (task.priority === 'high')
          priorityClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';

        let actionControl = '';
        if (task.status === 'assigned') {
          actionControl = `
            <button onclick="updateTaskStatus('${tId}', 'in_progress')"
              class="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm">
              <span>▶️</span> Start Work
            </button>
          `;
        } else if (task.status === 'in_progress') {
          actionControl = `
            <button onclick="updateTaskStatus('${tId}', 'review_pending')"
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
              <span>✅</span> Completed &amp; Verified by Director
            </div>
          `;
        }

        return `
        <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${priorityClass}">${escapeHtml(task.priority)}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">${escapeHtml(task.projectName)}</span>
              <span class="text-[11px] text-slate-400">Assigned: ${escapeHtml(task.assignedDate)}</span>
            </div>
            <div class="text-[11px] text-slate-500">
              Target Due Date: <strong class="text-slate-900 dark:text-white font-bold">${escapeHtml(task.dueDate)}</strong>
            </div>
          </div>

          <div>
            <h4 class="font-bold text-sm text-slate-900 dark:text-white">${escapeHtml(task.title)}</h4>
            <div class="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <div class="font-bold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Founder's Instructions:</div>
              ${escapeHtml(task.description)}
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
      .join('');
  }

  if (leadPipeEl) {
    leadPipeEl.innerHTML = renderLeadPipelineSection();
  }
}
window.renderAllocatedWork = renderAllocatedWork;

function updateTaskStatus(taskId, newStatus) {
  if (!requireAuth('update task progress')) return;
  const task = (STATE.assignedTasks || []).find((t) => t.id === taskId);
  if (!task) return;

  const callerMemberId = getCurrentMemberId();
  if (STATE.activeRole !== 'pranav' && task.assignedTo !== callerMemberId) {
    showToast('Permission Denied: You can only update tasks assigned to you.');
    return;
  }

  const allowedTransitions = {
    assigned: ['in_progress'],
    in_progress: ['review_pending'],
    review_pending: STATE.activeRole === 'pranav' ? ['completed', 'in_progress'] : [],
    completed: [],
  };
  if (!(allowedTransitions[task.status] || []).includes(newStatus)) {
    showToast('Invalid workflow transition.');
    return;
  }

  task.status = newStatus;
  saveAssignedTasksToStorage();

  const sb = getSupabaseClient();
  if (sb && task.id && task.id.includes('-') && !task.id.startsWith('task-')) {
    sb.from('assigned_tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
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
    recordAuditLog(
      'DELIVERABLE_SUBMITTED',
      `${task.assignedToName} submitted deliverable "${task.title}" for Founder review.`,
      task.assignedToName
    );
  }
  saveAppStateToStorage();

  renderAllocatedWork();
  if (STATE.currentTab === 'approvals') renderApprovals();
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
            <h3 class="text-base font-black text-slate-900 dark:text-white">Client Acquisition &amp; 4-Step Delivery Pipeline</h3>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#fffde8] text-[#026047] border border-[#026047]/30">4-STAGE PIPELINE</span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            <strong>Stage 1:</strong> Aryan (Scout) ➔ <strong>Stage 2:</strong> Pranav (Allocate to Vivek) ➔ <strong>Stage 3:</strong> Vivek (Tech Dev ➔ Forward to Arshad &amp; Notify Pranav) ➔ <strong>Stage 4:</strong> Pranav (Final Delivery Approval)
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
          <span class="text-[10px] text-blue-600 dark:text-blue-300 block mt-0.5">Arshad &amp; Founder</span>
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

function renderSingleLeadCard(rawLead, currentRole) {
  const lead = normalizeLead(rawLead);
  const lid = safeId(lead.id);
  const isPranav = currentRole === 'pranav';
  const isVivek = currentRole === 'vivek';
  const isArshad = currentRole === 'arshad';

  const s1Done = true;
  const s2Done =
    lead.status === 'allocated_to_vivek' ||
    lead.status === 'sent_to_arshad_notified_founder' ||
    lead.status === 'approved_for_delivery';
  const s3Done =
    lead.status === 'sent_to_arshad_notified_founder' ||
    lead.status === 'approved_for_delivery';
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

  const safeDeliverable = lead.deliverableUrl ? sanitizeUrl(lead.deliverableUrl) : '';

  return `
    <div class="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4 hover:border-[#026047]/40 transition">
      <!-- Top Row: Lead Number, Client Name, Value & Stage Badge -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700 pb-3">
        <div class="flex items-center gap-2.5 flex-wrap">
          <span class="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">${escapeHtml(lead.leadNumber || 'LEAD')}</span>
          <h4 class="font-black text-sm text-slate-900 dark:text-white">${escapeHtml(lead.clientName)}</h4>
          <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fffde8] text-[#026047] border border-[#026047]/30">${escapeHtml(lead.productType)}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-black text-[#026047] dark:text-emerald-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            Est: ${formatINR(lead.dealValue)}
          </span>
          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeColor}">
            ${escapeHtml(currentStageText)}
          </span>
        </div>
      </div>

      <!-- 4-Step Interactive Progress Stepper Bar -->
      <div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
          <div class="flex items-center gap-2 p-2 rounded-lg ${s1Done ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 opacity-60'}">
            <span class="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${s1Done ? 'bg-[#026047] text-white' : 'bg-slate-300 text-slate-600'}">✓</span>
            <div>
              <div class="font-bold text-slate-900 dark:text-white">1. Aryan Scouted</div>
              <div class="text-[10px] text-slate-500">Lead Entered</div>
            </div>
          </div>
          <div class="flex items-center gap-2 p-2 rounded-lg ${s2Done ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800' : (lead.status === 'submitted_to_founder' ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 animate-pulse' : 'bg-slate-100 opacity-60')}">
            <span class="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${s2Done ? 'bg-[#026047] text-white' : 'bg-amber-500 text-white'}">
              ${s2Done ? '✓' : '2'}
            </span>
            <div>
              <div class="font-bold text-slate-900 dark:text-white">2. Pranav Allocates</div>
              <div class="text-[10px] text-slate-500">${s2Done ? 'Assigned to Vivek' : 'Awaiting Pranav'}</div>
            </div>
          </div>
          <div class="flex items-center gap-2 p-2 rounded-lg ${s3Done ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800' : (lead.status === 'allocated_to_vivek' ? 'bg-purple-50 dark:bg-purple-950/40 border border-purple-300 animate-pulse' : 'bg-slate-100 opacity-60')}">
            <span class="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${s3Done ? 'bg-[#026047] text-white' : 'bg-purple-500 text-white'}">
              ${s3Done ? '✓' : '3'}
            </span>
            <div>
              <div class="font-bold text-slate-900 dark:text-white">3. Vivek Tech Complete</div>
              <div class="text-[10px] text-slate-500">${s3Done ? 'Sent to Arshad' : 'In Dev by Vivek'}</div>
            </div>
          </div>
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
            <strong class="text-slate-900 dark:text-white">${escapeHtml(lead.contactPerson || '—')}</strong>
          </div>
          <div class="flex justify-between text-slate-500">
            <span>Phone / WhatsApp:</span>
            <span class="font-mono text-slate-900 dark:text-white">${escapeHtml(lead.phone || '—')}</span>
          </div>
          <div class="flex justify-between text-slate-500">
            <span>Lead Scouted By:</span>
            <strong class="text-emerald-700 dark:text-emerald-400">${escapeHtml(lead.submittedBy || 'Aryan Bhore')}</strong>
          </div>
          <p class="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <strong>Scope / Pain points:</strong> ${escapeHtml(lead.requirements)}
          </p>
        </div>

        <div class="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
          ${lead.founderInstructions ? `
            <div class="text-[11px]">
              <span class="font-bold text-amber-700 dark:text-amber-400">👑 Founder's Technical Scope (For Vivek):</span>
              <p class="text-slate-700 dark:text-slate-300 mt-0.5">${escapeHtml(lead.founderInstructions)}</p>
              <div class="text-[10px] text-slate-400 mt-1">Due Date: <strong>${escapeHtml(lead.dueDate || '—')}</strong> • Priority: <strong>${escapeHtml(lead.priority || 'high')}</strong></div>
            </div>
          ` : `
            <div class="text-slate-400 text-xs italic py-2">
              Awaiting Founder Pranav Bansode to review and assign technical development instructions to Vivek.
            </div>
          `}

          ${lead.deliverableUrl ? `
            <div class="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <span class="font-bold text-purple-700 dark:text-purple-300">💻 Vivek's Technical Deliverable:</span>
              <div class="mt-0.5">
                ${safeDeliverable
                  ? `<a href="${escapeHtml(safeDeliverable)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 font-mono underline break-all">${escapeHtml(lead.deliverableUrl)}</a>`
                  : `<span class="text-rose-600 font-mono">[Blocked unsafe URL] ${escapeHtml(lead.deliverableUrl)}</span>`
                }
              </div>
              <p class="text-slate-600 dark:text-slate-400 text-[10px] mt-0.5">${escapeHtml(lead.techNotes || '')}</p>
              <div class="text-[10px] text-emerald-600 font-bold mt-1">✓ Sent to Arshad Shaikh • Founder Pranav Notified</div>
            </div>
          ` : ''}

          ${lead.arshadChecked ? `
            <div class="text-[10px] text-blue-700 dark:text-blue-400 font-bold">
              ✓ Arshad Shaikh verified client packaging &amp; pricing alignment.
            </div>
          ` : ''}

          ${lead.approvedBy ? `
            <div class="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-[11px] font-bold text-[#026047] dark:text-emerald-300 flex items-center gap-1.5">
              <span>👑</span> Approved for Final Client Delivery by ${escapeHtml(lead.approvedBy)} on ${escapeHtml(formatDate(lead.approvedAt))}
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
            ${lead.status === 'allocated_to_vivek' ? 'Vivek Gajdhane completes technical build &amp; submits' : ''}
            ${lead.status === 'sent_to_arshad_notified_founder' ? 'Arshad reviews &amp; Founder Pranav gives final sign-off' : ''}
            ${lead.status === 'approved_for_delivery' ? 'Project successfully delivered to client!' : ''}
          </strong>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          ${lead.status === 'submitted_to_founder' && isPranav ? `
            <button onclick="openAllocateLeadModal('${lid}')"
              class="px-3.5 py-1.5 rounded-xl bg-[#026047] text-[#fffde8] font-bold text-xs hover:bg-[#024d39] transition shadow-sm flex items-center gap-1 cursor-pointer">
              <span>👑</span> Allocate to Vivek (Tech)
            </button>
          ` : ''}

          ${lead.status === 'allocated_to_vivek' && (isVivek || isPranav) ? `
            <button onclick="openTechForwardModal('${lid}')"
              class="px-3.5 py-1.5 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 transition shadow-sm flex items-center gap-1 cursor-pointer">
              <span>💻</span> Deliver Tech &amp; Forward to Arshad
            </button>
          ` : ''}

          ${lead.status === 'sent_to_arshad_notified_founder' && (isArshad || isPranav) && !lead.arshadChecked ? `
            <button onclick="confirmArshadCheck('${lid}')"
              class="px-3 py-1.5 rounded-xl bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition shadow-sm flex items-center gap-1 cursor-pointer">
              <span>🤝</span> Verify Deal Alignment
            </button>
          ` : ''}

          ${lead.status === 'sent_to_arshad_notified_founder' && isPranav ? `
            <button onclick="openDeliveryApprovalModal('${lid}')"
              class="px-3.5 py-1.5 rounded-xl bg-[#026047] text-[#fffde8] font-black text-xs hover:bg-[#024d39] transition shadow-sm flex items-center gap-1 cursor-pointer">
              <span>👑</span> Approve for Delivery
            </button>
          ` : ''}

          ${lead.status === 'approved_for_delivery' ? `
            <span class="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs flex items-center gap-1">
              <span>✓</span> Delivery Complete &amp; Signed Off
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
  if (!requireAuth('submit client leads')) return;
  const modal = document.getElementById('modal-new-lead');
  if (modal) modal.classList.remove('hidden');
};

window.closeNewLeadModal = function () {
  const modal = document.getElementById('modal-new-lead');
  if (modal) modal.classList.add('hidden');
};

window.submitClientLead = function () {
  if (!requireAuth('submit client leads')) return;
  const clientName = document.getElementById('lead-client-name')?.value.trim();
  const contactPerson = document.getElementById('lead-contact-person')?.value.trim();
  const phone = document.getElementById('lead-phone')?.value.trim();
  const product = document.getElementById('lead-product')?.value;
  const dealValue = parseFloat(document.getElementById('lead-deal-value')?.value) || 0;
  const requirements = document.getElementById('lead-requirements')?.value.trim();

  if (!clientName || !requirements || !phone || dealValue < 0) {
    alert('Please fill out all required lead fields.');
    return;
  }

  const submitter = MEMBER_NAME_MAP[getCurrentMemberId()] || 'Aryan Bhore';
  const newLeadId = 'lead-' + Date.now();
  const leadNum = 'LEAD-2026-' + String((STATE.leads || []).length + 1).padStart(3, '0');

  const newLead = normalizeLead({
    id: newLeadId,
    leadNumber: leadNum,
    clientName,
    contactPerson,
    phone,
    productType: product || 'LeadX Platform',
    dealValue,
    requirements,
    submittedBy: submitter,
    submittedAt: new Date().toISOString(),
    status: 'submitted_to_founder',
  });

  STATE.leads.unshift(newLead);
  saveLeadsToStorage();
  recordAuditLog(
    'LEAD_SUBMITTED',
    `${newLead.submittedBy} submitted new client lead "${clientName}" (${formatINR(dealValue)}) directly to Founder Pranav Bansode.`,
    newLead.submittedBy
  );
  saveAppStateToStorage();

  closeNewLeadModal();
  const form = document.querySelector('#modal-new-lead form');
  if (form) form.reset();

  showToast(`🎯 Lead "${clientName}" submitted! Routed directly to Founder Pranav Bansode for allocation.`);
  renderCurrentTab();
  renderSidebarNav(STATE.currentTab);
};

window.openAllocateLeadModal = function (leadId) {
  if (!requireFounder('allocate project technical work')) return;
  const lead = (STATE.leads || []).find((l) => l.id === leadId);
  if (!lead) return;

  const idInput = document.getElementById('allocate-lead-id');
  if (idInput) idInput.value = lead.id;

  const clientDisplay = document.getElementById('allocate-lead-client-display');
  if (clientDisplay) clientDisplay.textContent = `${lead.clientName} (${lead.productType} • ${formatINR(lead.dealValue)})`;

  const scoutDisplay = document.getElementById('allocate-lead-scout-display');
  if (scoutDisplay) scoutDisplay.textContent = `${lead.submittedBy || 'Aryan Bhore'}`;

  const instrInput = document.getElementById('allocate-founder-instructions');
  if (instrInput) instrInput.value = lead.founderInstructions || '';

  const dueInput = document.getElementById('allocate-due-date');
  if (dueInput) {
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
  if (!requireFounder('allocate leads to Vivek')) return;
  const leadId = document.getElementById('allocate-lead-id')?.value;
  const instrEl = document.getElementById('allocate-founder-instructions');
  const instructions = instrEl ? instrEl.value.trim() : '';
  const dueDate = document.getElementById('allocate-due-date')?.value;
  const priority = document.getElementById('allocate-priority')?.value || 'high';

  if (!instructions || !dueDate) {
    alert('Please provide instructions and due date for Vivek.');
    return;
  }

  const lead = (STATE.leads || []).find((l) => l.id === leadId);
  if (!lead) return;

  lead.status = 'allocated_to_vivek';
  lead.stage = 'allocated_to_vivek';
  lead.founderInstructions = instructions;
  lead.dueDate = dueDate;
  lead.priority = priority;
  lead.allocatedAt = new Date().toISOString();
  lead.allocatedTo = 'mem-03';
  lead.allocatedToName = 'Vivek Gajdhane';

  const newTask = {
    id: 'task-lead-' + Date.now(),
    title: `Develop ${lead.productType} for ${lead.clientName}`,
    assignedTo: 'mem-03',
    assignedToName: 'Vivek Gajdhane',
    projectId: (lead.productType || '').includes('Smart Review') ? 'prj-srm' : 'prj-leadx',
    projectName: lead.productType,
    priority,
    dueDate,
    assignedDate: new Date().toISOString().split('T')[0],
    assignedBy: 'Pranav Bansode (Founder)',
    description: `[Allocated from Aryan's Lead ${lead.leadNumber}]: ${instructions}`,
    status: 'in_progress',
    leadId: lead.id,
  };

  STATE.assignedTasks.unshift(newTask);
  saveAssignedTasksToStorage();
  saveLeadsToStorage();
  recordAuditLog(
    'LEAD_ALLOCATED',
    `Founder Pranav allocated technical development of "${lead.clientName}" to Vivek Gajdhane.`,
    'Pranav Bansode (Founder / Director)'
  );
  saveAppStateToStorage();

  if (instrEl) instrEl.value = '';
  closeAllocateLeadModal();
  showToast('🚀 Work allocated to Vivek Gajdhane! Vivek notified in his engineering workspace.');
  renderCurrentTab();
  renderSidebarNav(STATE.currentTab);
};

window.openTechForwardModal = function (leadId) {
  if (!requireAuth('submit technical deliverables')) return;
  if (STATE.activeRole !== 'vivek' && STATE.activeRole !== 'pranav') {
    alert('Security Gate: Only Vivek Gajdhane or Founder Pranav can submit technical deliverables.');
    return;
  }
  const lead = (STATE.leads || []).find((l) => l.id === leadId);
  if (!lead) return;

  const idInput = document.getElementById('forward-lead-id');
  if (idInput) idInput.value = lead.id;

  const clientDisplay = document.getElementById('forward-lead-client-display');
  if (clientDisplay) clientDisplay.textContent = `${lead.clientName} (${lead.productType})`;

  const urlInput = document.getElementById('forward-tech-deliverable-url');
  if (urlInput) urlInput.value = '';
  const notesInput = document.getElementById('forward-tech-notes');
  if (notesInput) notesInput.value = '';

  const modal = document.getElementById('modal-tech-forward');
  if (modal) modal.classList.remove('hidden');
};

window.closeTechForwardModal = function () {
  const modal = document.getElementById('modal-tech-forward');
  if (modal) modal.classList.add('hidden');
};

window.confirmTechForward = function () {
  if (!requireAuth('submit technical deliverables')) return;
  if (STATE.activeRole !== 'vivek' && STATE.activeRole !== 'pranav') {
    alert('Security Gate: Only Vivek Gajdhane or Founder Pranav can submit technical deliverables.');
    return;
  }
  const leadId = document.getElementById('forward-lead-id')?.value;
  const urlEl = document.getElementById('forward-tech-deliverable-url');
  const notesEl = document.getElementById('forward-tech-notes');
  const deliverableUrl = urlEl ? urlEl.value.trim() : '';
  const techNotes = notesEl ? notesEl.value.trim() : '';

  if (!deliverableUrl || !techNotes) {
    alert('Please enter deliverable URL and technical implementation summary.');
    return;
  }

  const safeUrl = sanitizeUrl(deliverableUrl);
  if (!safeUrl) {
    alert('Security Validation: Please enter a valid http:// or https:// deliverable URL.');
    return;
  }

  const lead = (STATE.leads || []).find((l) => l.id === leadId);
  if (!lead) return;

  lead.status = 'sent_to_arshad_notified_founder';
  lead.stage = 'sent_to_arshad_notified_founder';
  lead.deliverableUrl = safeUrl;
  lead.techNotes = techNotes;
  lead.techCompletedAt = new Date().toISOString();
  lead.founderNotified = true;

  const linkedTask = (STATE.assignedTasks || []).find((t) => t.leadId === lead.id);
  if (linkedTask) {
    linkedTask.status = 'review_pending';
    saveAssignedTasksToStorage();
  }

  saveLeadsToStorage();
  recordAuditLog(
    'TECH_DELIVERED_FORWARDED',
    `Vivek completed technical development for "${lead.clientName}". Forwarded to Arshad Shaikh; Founder Pranav notified.`,
    MEMBER_NAME_MAP[getCurrentMemberId()] || 'Vivek Gajdhane (Technical Dept)'
  );
  saveAppStateToStorage();

  if (urlEl) urlEl.value = '';
  if (notesEl) notesEl.value = '';
  closeTechForwardModal();
  showToast('📤 Technical deliverables submitted to Arshad Shaikh! Founder Pranav Bansode notified.');

  renderCurrentTab();
  renderSidebarNav(STATE.currentTab);
};

window.confirmArshadCheck = function (leadId) {
  if (!requireAuth('verify commercial deal alignment')) return;
  if (STATE.activeRole !== 'arshad' && STATE.activeRole !== 'pranav') {
    alert('Security Gate: Only Arshad Shaikh (Co-Founder) or Founder Pranav can verify commercial deal alignment.');
    return;
  }
  const lead = (STATE.leads || []).find((l) => l.id === leadId);
  if (!lead) return;

  lead.arshadChecked = true;
  lead.arshadCheckedAt = new Date().toISOString();
  saveLeadsToStorage();
  recordAuditLog(
    'LEAD_CLIENT_CHECK',
    `Arshad Shaikh verified commercial packaging & deal alignment for "${lead.clientName}".`,
    MEMBER_NAME_MAP[getCurrentMemberId()] || 'Arshad Shaikh (Co-Founder)'
  );
  saveAppStateToStorage();

  showToast(`🤝 Arshad confirmed deal alignment for "${lead.clientName}"! Awaiting Founder Pranav's final delivery approval.`);
  renderCurrentTab();
};

window.openDeliveryApprovalModal = function (leadId) {
  if (!requireFounder('grant final delivery sign-off')) return;
  const lead = (STATE.leads || []).find((l) => l.id === leadId);
  if (!lead) return;

  const idInput = document.getElementById('delivery-lead-id');
  if (idInput) idInput.value = lead.id;

  const clientDisplay = document.getElementById('delivery-lead-client-display');
  if (clientDisplay) clientDisplay.textContent = `${lead.clientName} (${lead.productType} • ${formatINR(lead.dealValue)})`;

  const notesInput = document.getElementById('delivery-founder-notes');
  if (notesInput) notesInput.value = '';

  const safeUrl = lead.deliverableUrl ? sanitizeUrl(lead.deliverableUrl) : '';
  const flowSummary = document.getElementById('delivery-lead-flow-summary');
  if (flowSummary) {
    flowSummary.innerHTML = `
      <div class="space-y-1 text-slate-600 dark:text-slate-300">
        <div>🎯 <strong>Lead Scouted:</strong> By ${escapeHtml(lead.submittedBy || 'Aryan Bhore')} (${escapeHtml(formatDate(lead.submittedAt))})</div>
        <div>👑 <strong>Technical Allocation:</strong> Assigned to Vivek with scope: "${escapeHtml(lead.founderInstructions || 'Core deliverables')}"</div>
        <div>💻 <strong>Vivek's Deliverables:</strong> ${
          safeUrl
            ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-mono">${escapeHtml(lead.deliverableUrl)}</a>`
            : `<span class="text-slate-500 font-mono">${escapeHtml(lead.deliverableUrl || 'Completed build')}</span>`
        }</div>
        <div>🤝 <strong>Arshad Alignment:</strong> ${lead.arshadChecked ? '✓ Checked &amp; Verified' : 'Standard packaging verified'}</div>
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
  if (!requireFounder('grant final delivery sign-off')) return;
  const leadId = document.getElementById('delivery-lead-id')?.value;
  const lead = (STATE.leads || []).find((l) => l.id === leadId);
  if (!lead || lead.status === 'approved_for_delivery') return;

  const founderNotesEl = document.getElementById('delivery-founder-notes');
  const founderNotes = founderNotesEl ? founderNotesEl.value.trim() : '';

  lead.status = 'approved_for_delivery';
  lead.stage = 'approved_for_delivery';
  lead.approvedBy = 'Pranav Bansode (Founder & Director)';
  lead.approvedAt = new Date().toISOString();
  if (founderNotes) lead.deliveryNotes = founderNotes;

  const linkedTask = (STATE.assignedTasks || []).find((t) => t.leadId === lead.id);
  if (linkedTask) {
    linkedTask.status = 'completed';
    linkedTask.completedDate = new Date().toISOString().split('T')[0];
    linkedTask.approvedBy = 'Pranav Bansode (Founder)';
    saveAssignedTasksToStorage();
  }

  const projectId = (lead.productType || '').includes('Smart Review') ? 'prj-srm' : 'prj-leadx';
  const existsIncome = (STATE.income || []).some((i) => i.leadId === lead.id);
  if (!existsIncome && Number(lead.dealValue) > 0) {
    const dealAmt = Number(lead.dealValue) || 0;
    STATE.income.unshift({
      id: 'inc-deal-' + Date.now(),
      leadId: lead.id,
      source: 'Client Inflow',
      clientName: lead.clientName,
      projectId,
      projectName: lead.productType,
      amount: dealAmt,
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'received',
      paymentMethod: 'bank_transfer',
      createdBy: 'Pranav Bansode (Founder / Director)',
      approvedBy: 'Pranav Bansode (Founder / Director)',
      approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      invoiceNumber: 'INV-2026-' + String((STATE.income || []).length + 101),
      notes: founderNotes || `Project delivery finalized & approved for client ${lead.clientName}`,
    });

    const prj = (STATE.projects || []).find((p) => p.id === projectId);
    if (prj) prj.revenueReceived = (prj.revenueReceived || 0) + dealAmt;
  }

  saveLeadsToStorage();
  recordAuditLog(
    'DELIVERY_APPROVED',
    `Founder Pranav Bansode gave final delivery sign-off for client "${lead.clientName}" (${formatINR(lead.dealValue)}).`,
    'Pranav Bansode (Founder / Director)'
  );
  saveAppStateToStorage();

  if (founderNotesEl) founderNotesEl.value = '';
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

  const allSales = (STATE.income || []).filter((s) => matchesDateFilter(s.paymentDate));
  const activeSales = allSales.filter((s) => s.status !== 'rejected');

  // Metrics
  const totalSalesVal = activeSales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const receivedVal = activeSales
    .filter((s) => s.status === 'received')
    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const leadxSales = activeSales.filter((s) => s.projectId === 'prj-leadx');
  const leadxVal = leadxSales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const srmSales = activeSales.filter((s) => s.projectId === 'prj-srm');
  const srmVal = srmSales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

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
        <span class="text-[10px] text-slate-500 mt-0.5 block">${activeSales.length} Active Sales Contracts</span>
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
            value="${escapeHtml(STATE.salesSearch || '')}"
            oninput="handleSalesSearch(this.value)"
            class="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#026047]"
          />
          <span class="absolute left-2.5 top-2 text-slate-400">🔍</span>
        </div>
        <div class="flex items-center gap-1 flex-wrap">
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
          <option value="rejected" ${STATE.salesStatusFilter === 'rejected' ? 'selected' : ''}>Rejected</option>
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
            <th class="py-2.5 px-3">Sale ID &amp; Date</th>
            <th class="py-2.5 px-3">Product Sold</th>
            <th class="py-2.5 px-3">Client &amp; Deal Scope</th>
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
                    const sId = safeId(sale.id);
                    const isExp = !!STATE.expandedSaleIds[sale.id];
                    const isReceived = sale.status === 'received';
                    const isRejected = sale.status === 'rejected';
                    const isLeadX = sale.projectId === 'prj-leadx';
                    const productBadgeClass = isLeadX
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300';

                    const statusBadgeHtml = isReceived
                      ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Verified in Bank
                        </span>`
                      : isRejected
                      ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          ✕ Rejected
                        </span>`
                      : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Awaiting Approval
                        </span>`;

                    return `
                    <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td class="py-3 px-3">
                        <div class="font-mono font-bold text-slate-900 dark:text-white uppercase">${escapeHtml(sale.id)}</div>
                        <div class="text-[10px] text-slate-400 font-mono">${escapeHtml(sale.paymentDate)}</div>
                      </td>

                      <td class="py-3 px-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${productBadgeClass}">${escapeHtml(sale.projectName)}</span>
                        <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">${escapeHtml(sale.source || 'Client Inflow')}</div>
                      </td>

                      <td class="py-3 px-3">
                        <div class="font-bold text-slate-900 dark:text-white text-xs">${escapeHtml(sale.clientName)}</div>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xs mt-0.5">${escapeHtml(sale.notes || 'Official product sale agreement')}</p>
                      </td>

                      <td class="py-3 px-3">
                        <div class="flex items-center gap-1.5">
                          <span class="w-5 h-5 rounded-full bg-[#026047] text-[#fffde8] flex items-center justify-center font-bold text-[9px]">
                            ${escapeHtml((sale.createdBy || 'PB').slice(0, 2).toUpperCase())}
                          </span>
                          <span class="font-medium text-slate-700 dark:text-slate-300 text-[11px]">${escapeHtml(sale.createdBy || 'Pranav Bansode')}</span>
                        </div>
                      </td>

                      <td class="py-3 px-3 text-right">
                        <div class="font-bold text-sm text-[#026047] dark:text-emerald-400">${formatINR(sale.amount)}</div>
                        <span class="text-[9px] text-slate-400 block uppercase font-mono">${escapeHtml((sale.paymentMethod || 'bank_transfer').replace(/_/g, ' '))}</span>
                      </td>

                      <td class="py-3 px-3 text-center">
                        ${statusBadgeHtml}
                      </td>

                      <td class="py-3 px-3 text-right whitespace-nowrap">
                        <div class="flex items-center justify-end gap-1.5">
                          <button onclick="toggleSaleDetails('${sId}')"
                            class="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition flex items-center gap-1">
                            <span>${isExp ? 'Hide' : 'Details'}</span>
                            <span class="text-[10px]">${isExp ? '▲' : '▼'}</span>
                          </button>
                          ${
                            isReceived
                              ? `<button onclick="openInvoiceModal('${sId}')"
                                  class="px-2.5 py-1 rounded-lg bg-[#026047] text-[#fffde8] font-bold text-xs hover:bg-[#024d39] transition flex items-center gap-1 shadow-sm" title="View Official Invoice">
                                  <span>📄</span> Invoice
                                </button>`
                              : isRejected
                              ? `<span class="text-[10px] text-rose-500 italic">Closed</span>`
                              : STATE.activeRole === 'pranav'
                              ? `<button onclick="approveIncome('${sId}')"
                                  class="px-2.5 py-1 rounded-lg bg-[#026047] text-[#fffde8] font-bold text-xs hover:bg-[#024d39] transition flex items-center gap-1 shadow-sm">
                                  <span>👑</span> Approve
                                </button>
                                <button onclick="rejectIncome('${sId}')"
                                  class="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs transition">
                                  ✕
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
                                <span>Sale Dossier: ${escapeHtml(sale.clientName)}</span>
                                <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">${escapeHtml(sale.id)}</span>
                              </div>
                              <p class="text-[11px] text-slate-500 mt-0.5">Agreement Type: ${escapeHtml(sale.source || 'Client Inflow')} • Product: ${escapeHtml(sale.projectName)}</p>
                            </div>
                            <div class="text-right">
                              <span class="text-[11px] text-slate-400">Total Contract Value:</span>
                              <div class="text-base font-black text-[#026047] dark:text-emerald-400">${formatINR(sale.amount)}</div>
                            </div>
                          </div>

                          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                              <span class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Payment Verification</span>
                              <div class="font-semibold text-slate-800 dark:text-slate-200">Mode: ${escapeHtml((sale.paymentMethod || 'bank_transfer').replace(/_/g, ' ').toUpperCase())}</div>
                              <div class="text-[10px] text-slate-500 mt-1">Settlement Date: ${escapeHtml(sale.paymentDate)}</div>
                              <div class="text-[10px] text-emerald-600 font-semibold mt-0.5">Account: Phoenix Tech Solutions Current A/c</div>
                            </div>

                            <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                              <span class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Contract &amp; Scope Notes</span>
                              <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">${escapeHtml(sale.notes || 'No notes specified.')}</p>
                              <div class="text-[10px] text-slate-400 mt-1">Closed By: ${escapeHtml(sale.createdBy || 'Pranav Bansode')}</div>
                            </div>

                            <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                              <span class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Agreed Project Incentive Pool</span>
                              <div class="font-bold text-[#026047] dark:text-emerald-400">10% Net Margin Contribution</div>
                              <p class="text-[10px] text-slate-500 mt-1">Incentive splits amongst LeadX &amp; Smart Review teams upon cost recovery.</p>
                              ${
                                isReceived
                                  ? `<div class="mt-2">
                                      <button onclick="openInvoiceModal('${sId}')" class="px-2.5 py-1 rounded bg-[#026047] text-[#fffde8] text-[10px] font-bold hover:bg-[#024d39] transition">
                                        📄 Print / Save Invoice
                                      </button>
                                    </div>`
                                  : ''
                              }
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
    let targetProjects = allProjects;
    if (STATE.projectFinanceFilter && STATE.projectFinanceFilter !== 'ALL') {
      targetProjects = allProjects.filter((p) => p.id === STATE.projectFinanceFilter);
    }

    const dynamicFilterBtns = allProjects
      .map((p, idx) => {
        const pId = safeId(p.id);
        const active = STATE.projectFinanceFilter === p.id;
        return `
          <button onclick="filterProjectFinance('${pId}')" class="px-2.5 py-1 rounded-lg ${
            active
              ? 'bg-[#026047] text-[#fffde8] font-bold shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          } transition text-xs cursor-pointer">
            ${idx + 1}) ${escapeHtml(p.name)}
          </button>`;
      })
      .join('');

    container.innerHTML = `
      <!-- Top Section Header & Sub-Tab Switcher (One In One) -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div class="flex items-center gap-2">
          <div class="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button onclick="setProjectSubView('list')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
              <span>📁</span> Products List (${allProjects.length})
            </button>
            <button onclick="setProjectSubView('finance')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-[#026047] text-[#fffde8] shadow-sm cursor-pointer">
              <span>📊</span> Project Financials &amp; P&amp;L
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
          <div class="inline-flex items-center gap-1 flex-wrap">
            <button onclick="filterProjectFinance('ALL')" class="px-2.5 py-1 rounded-lg ${STATE.projectFinanceFilter === 'ALL' ? 'bg-[#026047] text-[#fffde8] font-bold shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'} transition text-xs cursor-pointer">
              All Products (${allProjects.length})
            </button>
            ${dynamicFilterBtns}
          </div>
        </div>
        <div class="text-[11px] text-slate-500 font-semibold">
          Live P&amp;L, direct costs and partner splits
        </div>
      </div>

      <!-- Financial Cards -->
      <div class="space-y-6">
        ${targetProjects.map((p) => {
          const fin = getProjectFinancials(p.id);
          const netProfit = fin.received - fin.expenses;
          const isProfit = netProfit >= 0;
          const projectIncome = (STATE.income || []).filter(
            (i) => i.projectId === p.id && matchesDateFilter(i.paymentDate)
          );
          const projectExpenses = (STATE.expenses || []).filter(
            (e) => e.projectId === p.id && matchesDateFilter(e.date)
          );

          return `
            <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <!-- Project Header -->
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-lg font-black text-slate-900 dark:text-white">${escapeHtml(p.name)}</h3>
                    <span class="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#fffde8] text-[#026047] border border-[#026047]/30">${escapeHtml(p.code)}</span>
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">${escapeHtml(p.description)}</p>
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
                <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span class="text-[10px] text-slate-400 uppercase font-bold">Total Revenue Inflow</span>
                  <div class="text-base font-black text-[#026047] dark:text-emerald-400 mt-1">${formatINR(fin.received)}</div>
                  <span class="text-[10px] text-emerald-600 font-semibold block mt-1">Verified Received</span>
                </div>

                <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span class="text-[10px] text-slate-400 uppercase font-bold">Direct Project Costs</span>
                  <div class="text-base font-black text-rose-600 dark:text-rose-400 mt-1">${formatINR(fin.expenses)}</div>
                  <span class="text-[10px] text-rose-500 font-semibold block mt-1">Approved Outflows</span>
                </div>

                <div class="p-3.5 rounded-xl ${isProfit ? 'bg-[#fffde8] dark:bg-[#026047]/20 border border-[#026047]/30' : 'bg-rose-50 dark:bg-rose-950/20 border border-rose-300'}">
                  <span class="text-[10px] ${isProfit ? 'text-[#026047] dark:text-[#fffde8]' : 'text-rose-700'} uppercase font-bold">Net Project Margin</span>
                  <div class="text-base font-black ${isProfit ? 'text-[#026047] dark:text-emerald-300' : 'text-rose-600'} mt-1">${formatINR(netProfit)}</div>
                  <span class="text-[10px] text-slate-500 font-semibold block mt-1">${netProfit === 0 ? '100% Cost Recovery' : (netProfit > 0 ? 'Profitable' : 'Deficit')}</span>
                </div>

                <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span class="text-[10px] text-slate-400 uppercase font-bold">Pending Invoices</span>
                  <div class="text-base font-black text-amber-600 dark:text-amber-400 mt-1">${formatINR(fin.pending)}</div>
                  <span class="text-[10px] text-amber-600 font-semibold block mt-1">${fin.pending > 0 ? 'Awaiting Clearance' : 'All Cleared'}</span>
                </div>
              </div>

              <!-- Team Revenue Allocation Pills -->
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
                <span class="font-bold text-slate-700 dark:text-slate-300">Contractual Profit Share Allocation:</span>
                <div class="flex items-center gap-2 flex-wrap">
                  ${(p.membersAllocation || []).map((m) => `
                    <span class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                      ${escapeHtml(m.name)}: <strong class="text-[#026047] dark:text-emerald-400">${m.share}%</strong>
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
                    ${projectIncome.length === 0 ? '<div class="text-slate-400 text-xs py-2">No income recorded for this project yet.</div>' : projectIncome.map((inc) => {
                      const iId = safeId(inc.id);
                      const statusEl = inc.status === 'received'
                        ? `<button onclick="openInvoiceModal('${iId}')" title="Official Invoice" class="px-2 py-0.5 rounded bg-[#026047]/10 hover:bg-[#026047] text-[#026047] hover:text-[#fffde8] font-bold text-[10px] transition cursor-pointer">Invoice</button>`
                        : inc.status === 'rejected'
                        ? '<span class="text-rose-600 text-[10px] font-bold">✕ Rejected</span>'
                        : '<span class="text-amber-600 text-[10px] font-bold">Pending</span>';
                      return `
                      <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div class="font-bold text-slate-900 dark:text-white">${escapeHtml(inc.clientName)}</div>
                          <div class="text-[10px] text-slate-500">${escapeHtml(formatDate(inc.paymentDate))} • ${escapeHtml(inc.paymentMethod || 'bank_transfer')}</div>
                        </div>
                        <div class="flex items-center gap-2">
                          <span class="font-black text-[#026047] dark:text-emerald-400">${formatINR(inc.amount)}</span>
                          ${statusEl}
                        </div>
                      </div>`;
                    }).join('')}
                  </div>
                </div>

                <!-- Direct Costs Sub-Table -->
                <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span class="text-xs font-bold text-slate-900 dark:text-white uppercase">Direct Project Costs</span>
                    <span class="text-[10px] text-rose-600 font-semibold">Outflows</span>
                  </div>
                  <div class="space-y-2">
                    ${projectExpenses.length === 0 ? '<div class="text-slate-400 text-xs py-2">No direct costs recorded.</div>' : projectExpenses.map((exp) => {
                      const statusEl = exp.status === 'approved'
                        ? '<span class="block text-[10px] text-emerald-700 font-semibold">✓ Approved</span>'
                        : exp.status === 'rejected'
                        ? '<span class="block text-[10px] text-rose-600 font-semibold">✕ Rejected</span>'
                        : exp.status === 'reversed'
                        ? '<span class="block text-[10px] text-slate-500 font-semibold">↺ Reversed</span>'
                        : '<span class="block text-[10px] text-amber-600 font-semibold">⏳ Pending</span>';
                      return `
                      <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div class="font-bold text-slate-900 dark:text-white">${escapeHtml(exp.title)}</div>
                          <div class="text-[10px] text-slate-500">${escapeHtml(formatDate(exp.date))} • Paid by ${escapeHtml(exp.paidBy)}</div>
                        </div>
                        <div class="text-right">
                          <span class="font-black text-rose-600 dark:text-rose-400">${formatINR(exp.amount)}</span>
                          ${statusEl}
                        </div>
                      </div>`;
                    }).join('')}
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

  // SUB-VIEW: PRODUCTS LIST
  let visibleProjects = allProjects;
  if (STATE.projectListFilter !== 'ALL') {
    visibleProjects = visibleProjects.filter((p) => {
      const details = techDetails[p.id] || {};
      const cat = details.category || p.description || '';
      if (STATE.projectListFilter === 'B2B')
        return p.id === 'prj-leadx' || cat.includes('B2B');
      if (STATE.projectListFilter === 'AI')
        return p.id === 'prj-srm' || cat.includes('Sentiment');
      return true;
    });
  }

  if (STATE.projectListSearch) {
    visibleProjects = visibleProjects.filter((p) => {
      const details = techDetails[p.id] || {};
      const haystack = `${p.name} ${p.code} ${p.description} ${details.category || ''} ${(
        details.techStack || []
      ).join(' ')}`.toLowerCase();
      return haystack.includes(STATE.projectListSearch);
    });
  }

  container.innerHTML = `
    <!-- Top Section Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div class="flex items-center gap-2">
        <span class="px-2 py-0.5 rounded text-[10px] font-black bg-[#026047] text-[#fffde8] uppercase tracking-wider">Products</span>
        <h2 class="text-base font-bold text-slate-900 dark:text-white">Designed Products &amp; Platforms</h2>
        <span class="text-xs text-slate-400 font-semibold">(${allProjects.length} Active)</span>
      </div>
      <div class="flex items-center gap-2 self-start sm:self-auto flex-wrap">
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
            value="${escapeHtml(STATE.projectListSearch || '')}"
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
                  const pId = safeId(p.id);
                  const itemNum = String(idx + 1).padStart(2, '0');
                  const displayName = `${idx + 1}) ${escapeHtml(p.name)}`;
                  const fin = getProjectFinancials(p.id);
                  const netProfit = fin.received - fin.expenses;
                  const isProfit = netProfit >= 0;

                  return `
                <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 hover:border-[#026047] transition">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-[#026047] text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0">
                      ${itemNum}
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <h3 class="text-sm font-bold text-slate-900 dark:text-white">${displayName}</h3>
                        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#fffde8] text-[#026047] border border-[#026047]/30">${escapeHtml(p.code)}</span>
                      </div>
                      <div class="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span>Inflow: <strong class="text-[#026047] dark:text-emerald-400">${formatINR(fin.received)}</strong></span>
                        <span>•</span>
                        <span>Costs: <strong class="text-rose-600 dark:text-rose-400">${formatINR(fin.expenses)}</strong></span>
                        <span>•</span>
                        <span>Net: <strong class="${isProfit ? 'text-[#026047] dark:text-emerald-400' : 'text-rose-600'}">${formatINR(netProfit)}</strong></span>
                      </div>
                    </div>
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
  if (!requireFounder('create new company projects')) return;
  const modal = document.getElementById('modal-new-project');
  if (modal) modal.classList.remove('hidden');
};

window.closeNewProjectModal = function () {
  const modal = document.getElementById('modal-new-project');
  if (modal) modal.classList.add('hidden');
};

window.submitNewProject = function () {
  if (!requireFounder('create new company projects')) return;
  const nameEl = document.getElementById('prj-name');
  const descEl = document.getElementById('prj-desc');
  const incEl = document.getElementById('prj-incentive');

  const name = nameEl ? nameEl.value.trim() : '';
  const desc = descEl ? descEl.value.trim() : '';
  const incentive = Math.max(0, Math.min(100, parseFloat(incEl ? incEl.value : '10') || 10));

  if (!name) return alert('Project name is required.');

  const slug = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || String(Date.now()).slice(-4);
  const code = 'PRJ-' + slug;

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

  recordAuditLog(
    'PROJECT_CREATED',
    `Created new product/project "${name}" (${code}, ${incentive}% incentive pool)`,
    'Pranav Bansode (Founder / Director)'
  );
  saveAppStateToStorage();

  if (nameEl) nameEl.value = '';
  if (descEl) descEl.value = '';

  closeNewProjectModal();
  updateProjectSelectOptions();
  renderProjects();
  renderDashboard();
  renderReports();
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
  const approvalDate = inc.approvedAt || inc.approvedDate || formatDate(inc.paymentDate);
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
            <div class="text-[10px] text-slate-400">Corporate Finance &amp; Client Revenue Desk</div>
          </div>
        </div>
        <div class="sm:text-right">
          <span class="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
            ✓ Paid &amp; Verified
          </span>
          <div class="text-xs font-mono font-bold text-slate-800 mt-2">${escapeHtml(invNumber)}</div>
          <div class="text-[11px] text-slate-500">Date: ${escapeHtml(formatDate(inc.paymentDate))}</div>
        </div>
      </div>

      <!-- Parties & Meta -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
        <div class="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
          <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Billed To (Client):</span>
          <div class="text-sm font-bold text-slate-900">${escapeHtml(inc.clientName)}</div>
          <div class="text-slate-600">Associated Project: <strong class="text-slate-900">${escapeHtml(inc.projectName)}</strong></div>
          <div class="text-slate-500 text-[11px]">Revenue Category: ${escapeHtml(inc.source || 'Client Inflow')}</div>
          ${inc.createdBy ? `<div class="text-[10px] text-slate-400">Enrolled By: ${escapeHtml(inc.createdBy)}</div>` : ''}
        </div>
        <div class="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1 sm:text-right">
          <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Authorization &amp; Clearance:</span>
          <div class="text-slate-700">Payment Channel: <strong class="uppercase font-mono text-slate-900">${escapeHtml((inc.paymentMethod || 'Bank Transfer').replace(/_/g, ' '))}</strong></div>
          <div class="text-slate-700">Clearance Status: <strong class="text-emerald-700">Direct Inflow Confirmed</strong></div>
          <div class="text-slate-700">Approval Stamp: <strong class="text-slate-900">${escapeHtml(approvalDate)}</strong></div>
          <div class="text-[11px] text-slate-500">Authorized By: <strong class="text-slate-900">${escapeHtml(approver)}</strong></div>
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
                <div class="font-bold text-slate-900">${escapeHtml(inc.projectName)} - Client Revenue Deliverable</div>
                <div class="text-[11px] text-slate-500 mt-0.5">${escapeHtml(inc.notes || 'Recorded and verified client contract milestone revenue.')}</div>
              </td>
              <td class="py-3 px-3 text-center font-mono font-medium text-slate-600">${escapeHtml(inc.projectId || 'PRJ')}</td>
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
            <div class="text-[9px] text-slate-500 font-semibold">Founder &amp; Director</div>
          </div>
          <span class="text-[9px] text-slate-400 mt-1 block">Phoenix Tech Solutions Private Limited</span>
        </div>
      </div>
    </div>
  `;
}

window.openInvoiceModal = function (id) {
  if (!requireAuth('view official invoices')) return;
  const inc = (STATE.income || []).find((i) => i.id === id);
  if (!inc) return;
  if (inc.status !== 'received') {
    showToast('Official invoice can only be generated after Founder approval clears the payment.');
    return;
  }

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
  if (!requireAuth('print invoices')) return;
  if (!STATE.currentInvoiceId) return;
  const inc = (STATE.income || []).find((i) => i.id === STATE.currentInvoiceId);
  if (!inc || inc.status !== 'received') return;

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
  <title>Invoice - ${escapeHtml(inc.clientName)}</title>
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
  if (!requireAuth('download invoices')) return;
  if (!STATE.currentInvoiceId) return;
  const inc = (STATE.income || []).find((i) => i.id === STATE.currentInvoiceId);
  if (!inc || inc.status !== 'received') return;

  const invoiceBody = generateInvoiceCardHTML(inc);
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${escapeHtml(inc.clientName)} - ${escapeHtml(inc.id)}</title>
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
  a.download = `Invoice-${inc.clientName.replace(/[^a-zA-Z0-9]/g, '_')}-${safeId(inc.id)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Invoice for ${inc.clientName} downloaded successfully!`);
};

window.approveIncome = function (id) {
  if (!requireFounder('approve client inflows')) return;
  const inc = (STATE.income || []).find((i) => i.id === id);
  if (!inc) return;
  if (inc.status === 'received') {
    showToast(`Income from ${inc.clientName} is already verified.`);
    return;
  }

  inc.status = 'received';
  inc.approvedBy = 'Pranav Bansode (Founder / Director)';
  inc.approvedAt = new Date().toISOString().replace('T', ' ').slice(0, 16);

  const prj = (STATE.projects || []).find((p) => p.id === inc.projectId);
  if (prj) {
    prj.revenueReceived = (prj.revenueReceived || 0) + (Number(inc.amount) || 0);
  }

  recordAuditLog(
    'APPROVE_INCOME',
    `Approved income of ${formatINR(inc.amount)} from ${inc.clientName} (${inc.projectName})`,
    'Pranav Bansode (Founder / Director)'
  );
  saveAppStateToStorage();

  renderIncome();
  renderDashboard();
  renderProjects();
  if (STATE.currentTab === 'sales-done') renderSalesDone();
  if (STATE.currentTab === 'approvals') renderApprovals();
  renderReports();
  renderSidebarNav(STATE.currentTab);
  showToast(`Income of ${formatINR(inc.amount)} approved by Founder/Director. Available Company Cash updated!`);

  setTimeout(() => {
    openInvoiceModal(inc.id);
  }, 250);
};

window.rejectIncome = function (id) {
  if (!requireFounder('reject client inflows')) return;
  const inc = (STATE.income || []).find((i) => i.id === id);
  if (!inc || inc.status === 'rejected') return;

  if (inc.status === 'received' && inc.projectId) {
    const prj = (STATE.projects || []).find((p) => p.id === inc.projectId);
    if (prj) prj.revenueReceived = Math.max(0, (prj.revenueReceived || 0) - (Number(inc.amount) || 0));
  }

  inc.status = 'rejected';
  inc.rejectedBy = 'Pranav Bansode (Founder / Director)';

  recordAuditLog(
    'REJECT_INCOME',
    `Rejected client inflow ${formatINR(inc.amount)} from ${inc.clientName} (${inc.projectName})`,
    'Pranav Bansode (Founder / Director)'
  );
  saveAppStateToStorage();

  renderDashboard();
  renderProjects();
  if (STATE.currentTab === 'sales-done') renderSalesDone();
  if (STATE.currentTab === 'approvals') renderApprovals();
  renderReports();
  renderSidebarNav(STATE.currentTab);
  showToast(`Inflow entry for ${inc.clientName} rejected.`);
};

window.markIncomeReceived = window.approveIncome;

window.openNewIncomeModal = function () {
  if (!requireAuth('enroll client inflows')) return;
  const modal = document.getElementById('modal-new-income');
  if (modal) modal.classList.remove('hidden');
};

window.closeNewIncomeModal = function () {
  const modal = document.getElementById('modal-new-income');
  if (modal) modal.classList.add('hidden');
};

window.submitNewIncome = function () {
  if (!requireAuth('submit client inflows')) return;
  const clientEl = document.getElementById('inc-client');
  const projectEl = document.getElementById('inc-project');
  const amountEl = document.getElementById('inc-amount');
  const methodEl = document.getElementById('inc-method');

  const client = clientEl ? clientEl.value.trim() : '';
  const project = projectEl ? projectEl.value : '';
  const amount = parseFloat(amountEl ? amountEl.value : '0');
  const method = methodEl ? methodEl.value : 'bank_transfer';

  if (!client || !Number.isFinite(amount) || amount <= 0) {
    return alert('Valid client name and positive amount are required.');
  }

  const prjObj = (STATE.projects || []).find((p) => p.id === project) || (STATE.projects || [])[0];
  const enrolledBy = MEMBER_NAME_MAP[getCurrentMemberId()] || 'Team Member';

  STATE.income.unshift({
    id: 'inc-' + Date.now(),
    source: 'Client Inflow',
    projectId: prjObj ? prjObj.id : 'prj-leadx',
    projectName: prjObj ? prjObj.name : 'LeadX',
    clientName: client,
    amount,
    paymentDate: new Date().toISOString().split('T')[0],
    status: 'pending_approval',
    paymentMethod: method,
    createdBy: enrolledBy,
    notes: `Enrolled by ${enrolledBy}. Awaiting Founder/Director approval.`,
  });

  recordAuditLog(
    'ENROLL_INCOME',
    `Enrolled income ${formatINR(amount)} from ${client} for ${prjObj ? prjObj.name : 'Company'} (Pending Approval)`,
    enrolledBy
  );
  saveAppStateToStorage();

  closeNewIncomeModal();
  if (clientEl) clientEl.value = '';
  if (amountEl) amountEl.value = '';

  renderIncome();
  renderDashboard();
  renderProjects();
  if (STATE.currentTab === 'sales-done') renderSalesDone();
  if (STATE.currentTab === 'approvals') renderApprovals();
  renderReports();
  renderSidebarNav(STATE.currentTab);
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
  return map[cat] || escapeHtml(cat || 'Other');
}

function renderExpenseManagement() {
  const currentRole = STATE.activeRole || 'pranav';
  const metricsContainer = document.getElementById('expense-metrics-container');
  const tableBody = document.getElementById('expense-table-body');
  const projectFilter = document.getElementById('expense-project-filter');
  const statusFilter = document.getElementById('expense-status-filter');

  const selectedProject = projectFilter ? projectFilter.value : 'ALL';
  const selectedStatus = statusFilter ? statusFilter.value : 'ALL';

  const dateScopedExpenses = (STATE.expenses || []).filter((e) => matchesDateFilter(e.date));

  let list = dateScopedExpenses.filter((e) => {
    if (selectedProject === 'GENERAL') {
      if (e.projectId) return false;
    } else if (selectedProject !== 'ALL' && e.projectId !== selectedProject) {
      return false;
    }
    if (selectedStatus === 'PENDING' && e.status !== 'pending_approval') return false;
    if (selectedStatus === 'APPROVED' && e.status !== 'approved') return false;
    if (selectedStatus === 'REJECTED' && e.status !== 'rejected') return false;
    if (selectedStatus === 'REVERSED' && e.status !== 'reversed') return false;
    return true;
  });

  // Role-based scoping: Founder sees all; team members see their own expenses.
  if (currentRole === 'arshad') {
    list = list.filter((e) => (e.paidBy || '').toLowerCase().includes('arshad'));
  } else if (currentRole === 'vivek') {
    list = list.filter((e) => (e.paidBy || '').toLowerCase().includes('vivek'));
  } else if (currentRole === 'aryan') {
    list = list.filter((e) => (e.paidBy || '').toLowerCase().includes('aryan'));
  }

  // 1. Expense Summary Metrics Cards
  if (metricsContainer) {
    if (currentRole === 'pranav') {
      const approvedTotal = dateScopedExpenses
        .filter((e) => e.status === 'approved')
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const pendingCount = dateScopedExpenses.filter((e) => e.status === 'pending_approval').length;
      const leadXExp = dateScopedExpenses
        .filter((e) => e.projectId === 'prj-leadx' && e.status === 'approved')
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

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
          <div class="text-[11px] text-slate-500 pt-0.5">Cluster &amp; scraper infrastructure</div>
        </div>
      `;
    } else {
      const roleMeta = {
        arshad: {
          key: 'arshad',
          submittedLabel: 'My Submitted Marketing Expenses',
          submittedSub: 'B2B funnels &amp; pilot collateral',
          approvedSub: 'Cleared corporate disbursements',
        },
        aryan: {
          key: 'aryan',
          submittedLabel: 'My Research &amp; Outreach Outflows',
          submittedSub: 'Client prospect discovery &amp; travel',
          approvedSub: 'Reconciled research disbursements',
        },
        vivek: {
          key: 'vivek',
          submittedLabel: 'My Technical Infrastructure Outflows',
          submittedSub: 'AWS, database &amp; developer tooling',
          approvedSub: 'Authorized server billing',
        },
      }[currentRole] || {
        key: currentRole,
        submittedLabel: 'My Submitted Expenses',
        submittedSub: 'Operational expenses',
        approvedSub: 'Cleared disbursements',
      };

      const myExpenses = dateScopedExpenses.filter((e) =>
        (e.paidBy || '').toLowerCase().includes(roleMeta.key)
      );
      const approved = myExpenses
        .filter((e) => e.status === 'approved')
        .reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const pending = myExpenses
        .filter((e) => e.status === 'pending_approval')
        .reduce((s, e) => s + (Number(e.amount) || 0), 0);

      metricsContainer.innerHTML = `
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-xs text-slate-400 font-medium">${roleMeta.submittedLabel}</span>
          <div class="text-xl font-bold text-slate-900 dark:text-white">${formatINR(approved + pending)}</div>
          <div class="text-[11px] text-slate-500 pt-0.5">${roleMeta.submittedSub}</div>
        </div>
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-xs text-slate-400 font-medium">Approved by Founder Pranav</span>
          <div class="text-xl font-bold text-emerald-600 dark:text-emerald-400">${formatINR(approved)}</div>
          <div class="text-[11px] text-slate-500 pt-0.5">${roleMeta.approvedSub}</div>
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
      .map((exp) => {
        const expId = safeId(exp.id);
        let statusBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">⏳ Pending Approval</span>`;
        if (exp.status === 'approved') {
          statusBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">✓ Approved</span>`;
        } else if (exp.status === 'rejected') {
          statusBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">✕ Rejected</span>`;
        } else if (exp.status === 'reversed') {
          statusBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">↺ Reversed</span>`;
        }

        let actionCell = `<span class="text-amber-600 dark:text-amber-400 text-[11px] font-medium">Pending Founder Sign-off</span>`;
        if (currentRole === 'pranav') {
          if (exp.status === 'approved') {
            actionCell = `
              <div class="flex items-center justify-end gap-1.5">
                <span class="text-[10px] text-slate-400">Authorized</span>
                <button onclick="reverseExpense('${expId}')" class="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-600 hover:text-rose-700 text-[10px] font-bold transition" title="Reverse this expense with audit reason">
                  Reverse
                </button>
              </div>`;
          } else if (exp.status === 'pending_approval') {
            actionCell = `
              <div class="flex items-center justify-end gap-1.5">
                <button onclick="approveExpense('${expId}')" class="px-2.5 py-1 rounded-lg bg-[#026047] hover:bg-[#024d39] text-[#fffde8] text-xs font-bold shadow-sm transition">
                  👑 Approve
                </button>
                <button onclick="rejectExpense('${expId}')" class="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-bold transition">
                  ✕ Reject
                </button>
              </div>`;
          } else {
            actionCell = `<span class="text-[11px] text-slate-400 italic">${exp.status === 'rejected' ? 'Rejected' : 'Reversed'}</span>`;
          }
        } else if (exp.status === 'approved') {
          actionCell = `<span class="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">✓ Approved by Founder Pranav</span>`;
        } else if (exp.status === 'rejected') {
          actionCell = `<span class="text-rose-600 dark:text-rose-400 text-[11px] font-medium">✕ Rejected by Founder</span>`;
        } else if (exp.status === 'reversed') {
          actionCell = `<span class="text-slate-500 text-[11px] font-medium">↺ Entry Reversed</span>`;
        }

        return `
      <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
        <td class="py-3 px-3 font-mono text-slate-500">${escapeHtml(formatDate(exp.date))}</td>
        <td class="py-3 px-3 font-semibold text-slate-900 dark:text-white">
          <div class="flex items-center gap-1.5">
            <span>${escapeHtml(exp.paidBy)}</span>
          </div>
        </td>
        <td class="py-3 px-3">
          <div class="font-bold text-slate-800 dark:text-slate-200">${escapeHtml(exp.title)}</div>
          <div class="text-[11px] text-slate-400">${escapeHtml(exp.description)}</div>
        </td>
        <td class="py-3 px-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            ${escapeHtml(exp.projectName || 'General')}
          </span>
        </td>
        <td class="py-3 px-3 text-right font-black text-rose-600 dark:text-rose-400">
          ${formatINR(exp.amount)}
        </td>
        <td class="py-3 px-3 text-center">
          ${statusBadge}
        </td>
        <td class="py-3 px-3 text-right whitespace-nowrap">
          ${actionCell}
        </td>
      </tr>
    `;
      })
      .join('');
  }
}
window.renderExpenseManagement = renderExpenseManagement;

window.approveExpense = function (id) {
  if (!requireFounder('approve company expenses')) return;
  const exp = (STATE.expenses || []).find((e) => e.id === id);
  if (!exp) return;
  if (exp.status === 'approved') {
    showToast(`Expense "${exp.title}" is already approved.`);
    return;
  }

  exp.status = 'approved';
  exp.approvedBy = 'Pranav Bansode (Founder / Director)';
  exp.approvedAt = new Date().toISOString().split('T')[0];

  if (exp.projectId) {
    const prj = (STATE.projects || []).find((p) => p.id === exp.projectId);
    if (prj) prj.directExpenses = (prj.directExpenses || 0) + (Number(exp.amount) || 0);
  }

  recordAuditLog(
    'APPROVE_EXPENSE',
    `Approved ${exp.title} (${formatINR(exp.amount)}) by ${exp.paidBy}`,
    'Pranav Bansode (Founder / Director)'
  );
  saveAppStateToStorage();

  renderExpenses();
  renderDashboard();
  renderProjects();
  renderReports();
  renderSidebarNav(STATE.currentTab);
  showToast(`Expense ${exp.title} approved! Interconnected Dashboard updated.`);
};

window.rejectExpense = function (id) {
  if (!requireFounder('reject company expenses')) return;
  const exp = (STATE.expenses || []).find((e) => e.id === id);
  if (!exp || exp.status === 'rejected' || exp.status === 'reversed') return;

  if (exp.status === 'approved' && exp.projectId) {
    const prj = (STATE.projects || []).find((p) => p.id === exp.projectId);
    if (prj) prj.directExpenses = Math.max(0, (prj.directExpenses || 0) - (Number(exp.amount) || 0));
  }

  exp.status = 'rejected';
  exp.rejectedBy = 'Pranav Bansode (Founder / Director)';

  recordAuditLog(
    'REJECT_EXPENSE',
    `Rejected ${exp.title} (${formatINR(exp.amount)}) submitted by ${exp.paidBy}`,
    'Pranav Bansode (Founder / Director)'
  );
  saveAppStateToStorage();

  renderExpenses();
  renderDashboard();
  renderProjects();
  renderReports();
  renderSidebarNav(STATE.currentTab);
  showToast(`Expense ${exp.title} rejected.`);
};

window.reverseExpense = function (id) {
  if (!requireFounder('reverse company expenses')) return;
  const exp = (STATE.expenses || []).find((e) => e.id === id);
  if (!exp || exp.status !== 'approved') return;

  const reason = prompt('FINANCIAL AUDIT: State reason for reversing this approved expense:');
  if (!reason || !reason.trim()) return alert('Reversal cancelled: Audit reason required.');

  exp.status = 'reversed';
  exp.isReversal = true;
  exp.reversalReason = reason.trim();

  if (exp.projectId) {
    const prj = (STATE.projects || []).find((p) => p.id === exp.projectId);
    if (prj) prj.directExpenses = Math.max(0, (prj.directExpenses || 0) - (Number(exp.amount) || 0));
  }

  recordAuditLog(
    'REVERSE_EXPENSE',
    `Reversed ${exp.title} (${formatINR(exp.amount)}) - Reason: ${reason.trim()}`,
    'Pranav Bansode (Founder / Director)'
  );
  saveAppStateToStorage();

  renderExpenses();
  renderDashboard();
  renderProjects();
  renderReports();
  renderSidebarNav(STATE.currentTab);
  showToast('Expense reversed and logged. Dashboard updated.');
};

window.openNewExpenseModal = function () {
  if (!requireAuth('record company expenses')) return;
  const modal = document.getElementById('modal-new-expense');
  if (modal) modal.classList.remove('hidden');
};

window.closeNewExpenseModal = function () {
  const modal = document.getElementById('modal-new-expense');
  if (modal) modal.classList.add('hidden');
};

window.submitNewExpense = function () {
  if (!requireAuth('submit company expenses')) return;
  const titleEl = document.getElementById('exp-title');
  const categoryEl = document.getElementById('exp-category');
  const projectEl = document.getElementById('exp-project');
  const amountEl = document.getElementById('exp-amount');
  const descEl = document.getElementById('exp-desc');

  const title = titleEl ? titleEl.value.trim() : '';
  const category = categoryEl ? categoryEl.value : 'other';
  const project = projectEl ? projectEl.value : 'GENERAL';
  const amount = parseFloat(amountEl ? amountEl.value : '0');
  const desc = descEl ? descEl.value.trim() : '';

  if (!title || !Number.isFinite(amount) || amount <= 0) {
    return alert('Valid expense title and positive amount required.');
  }

  const paidBy = MEMBER_NAME_MAP[getCurrentMemberId()] || 'Team Member';
  const prjObj =
    project && project !== 'GENERAL'
      ? (STATE.projects || []).find((p) => p.id === project) || null
      : null;

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
    approvedBy: isAutoApproved ? 'Pranav Bansode (Founder / Director)' : null,
  });

  if (isAutoApproved && prjObj) {
    prjObj.directExpenses = (prjObj.directExpenses || 0) + amount;
  }

  recordAuditLog(
    isAutoApproved ? 'APPROVE_EXPENSE' : 'SUBMIT_EXPENSE',
    `${paidBy} logged expense "${title}" (${formatINR(amount)}) for ${prjObj ? prjObj.name : 'Company General'} (${isAutoApproved ? 'Approved' : 'Pending Approval'})`,
    paidBy
  );
  saveAppStateToStorage();

  if (titleEl) titleEl.value = '';
  if (amountEl) amountEl.value = '';
  if (descEl) descEl.value = '';

  closeNewExpenseModal();
  renderExpenses();
  renderDashboard();
  renderProjects();
  renderReports();
  renderSidebarNav(STATE.currentTab);
  showToast(isAutoApproved ? 'Expense approved and recorded. Dashboard updated.' : 'Expense submitted for Founder approval.');
};

// ==============================================================================
// E. FINANCIAL SUMMARY, RESERVES & EXECUTIVE AUDIT LOG
// ==============================================================================
function renderFinancialSummary() {
  if (STATE.activeRole !== 'pranav') return;

  const kpisEl = document.getElementById('financial-summary-kpis');
  const pnlEl = document.getElementById('project-wise-pnl-container');
  const monthlyEl = document.getElementById('monthly-performance-container');
  const reservesEl = document.getElementById('reserves-breakdown-container');
  const auditEl = document.getElementById('audit-logs-container');

  const m = calculateMetrics();
  const totalDisbursements = m.totalBusinessExpenses + m.teamSalariesPaid + m.founderDrawingsTotal;
  const marginPct =
    m.totalMoneyReceived > 0 ? ((m.netBusinessProfit / m.totalMoneyReceived) * 100).toFixed(1) : '0.0';

  if (kpisEl) {
    kpisEl.innerHTML = `
      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[11px] font-semibold uppercase text-slate-400">Net Received Revenue</span>
        <div class="text-xl font-black text-[#026047] dark:text-emerald-400 mt-1">${formatINR(m.totalMoneyReceived)}</div>
        <div class="text-[10px] text-slate-500 mt-1">Verified inflows • Pending: ${formatINR(m.pendingClientPayments)}</div>
      </div>
      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[11px] font-semibold uppercase text-slate-400">Total Company Outflows</span>
        <div class="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">${formatINR(totalDisbursements)}</div>
        <div class="text-[10px] text-slate-500 mt-1">Ops ${formatINR(m.totalBusinessExpenses, false)} • Pay ${formatINR(m.teamSalariesPaid + m.founderDrawingsTotal, false)}</div>
      </div>
      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[11px] font-semibold uppercase text-slate-400">Net Operating Profit</span>
        <div class="text-xl font-black ${m.netBusinessProfit >= 0 ? 'text-[#026047] dark:text-emerald-400' : 'text-rose-600'} mt-1">${formatINR(m.netBusinessProfit)}</div>
        <div class="text-[10px] text-slate-500 mt-1">Operating Margin: <strong>${marginPct}%</strong></div>
      </div>
      <div class="p-4 rounded-xl bg-[#fffde8] dark:bg-[#026047]/20 border border-[#026047]/30 shadow-sm">
        <span class="text-[11px] font-bold uppercase text-[#026047] dark:text-emerald-300">Unencumbered Liquid Cash</span>
        <div class="text-xl font-black text-[#026047] dark:text-emerald-300 mt-1">${formatINR(m.availableCompanyCash)}</div>
        <div class="text-[10px] text-[#026047]/80 dark:text-emerald-200/80 mt-1">Earmarked Reserves: <strong>${formatINR(m.totalCompanyReserves)}</strong></div>
      </div>
    `;
  }

  if (pnlEl) {
    const projects = STATE.projects || [];
    if (projects.length === 0) {
      pnlEl.innerHTML = `<div class="py-6 text-center text-xs text-slate-400">No projects registered.</div>`;
    } else {
      pnlEl.innerHTML = `
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold text-[11px]">
              <th class="py-2 px-3">Project / Product</th>
              <th class="py-2 px-3 text-right">Verified Revenue</th>
              <th class="py-2 px-3 text-right">Direct Expenses</th>
              <th class="py-2 px-3 text-right">Gross Profit</th>
              <th class="py-2 px-3 text-right">Margin</th>
              <th class="py-2 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            ${projects
              .map((p) => {
                const fin = getProjectFinancials(p.id);
                const profit = fin.received - fin.expenses;
                const pMargin = fin.received > 0 ? ((profit / fin.received) * 100).toFixed(1) + '%' : '—';
                const pId = safeId(p.id);
                return `
                  <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td class="py-2.5 px-3">
                      <div class="font-bold text-slate-900 dark:text-white">${escapeHtml(p.name)}</div>
                      <span class="text-[10px] font-mono text-slate-400">${escapeHtml(p.code)}</span>
                    </td>
                    <td class="py-2.5 px-3 text-right font-bold text-[#026047] dark:text-emerald-400">${formatINR(fin.received)}</td>
                    <td class="py-2.5 px-3 text-right font-semibold text-rose-600 dark:text-rose-400">${formatINR(fin.expenses)}</td>
                    <td class="py-2.5 px-3 text-right font-black ${profit >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'}">${formatINR(profit)}</td>
                    <td class="py-2.5 px-3 text-right font-mono text-[11px]">${pMargin}</td>
                    <td class="py-2.5 px-3 text-right">
                      <button onclick="switchTab('projects'); viewProjectFinance('${pId}');" class="px-2.5 py-1 rounded bg-[#ffffea] text-[#026047] border border-[#026047]/30 text-[10px] font-bold hover:bg-[#fff9c2]">
                        View P&amp;L
                      </button>
                    </td>
                  </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      `;
    }
  }

  if (monthlyEl) {
    const monthlyMap = {};
    const ensureMonth = (dStr) => {
      const key = String(dStr || '').slice(0, 7) || '2026-11';
      if (!monthlyMap[key]) monthlyMap[key] = { inflow: 0, expenses: 0, payroll: 0 };
      return monthlyMap[key];
    };

    (STATE.income || [])
      .filter((i) => i.status === 'received' && matchesDateFilter(i.paymentDate))
      .forEach((i) => {
        ensureMonth(i.paymentDate).inflow += Number(i.amount) || 0;
      });
    (STATE.expenses || [])
      .filter((e) => e.status === 'approved' && matchesDateFilter(e.date))
      .forEach((e) => {
        ensureMonth(e.date).expenses += Number(e.amount) || 0;
      });
    (STATE.payouts || [])
      .filter((p) => p.status === 'paid' && matchesDateFilter(p.paidDate))
      .forEach((p) => {
        ensureMonth(p.paidDate).payroll += Number(p.amount) || 0;
      });
    (STATE.drawings || [])
      .filter((d) => !d.reversed && matchesDateFilter(d.date))
      .forEach((d) => {
        ensureMonth(d.date).payroll += Number(d.amount) || 0;
      });

    const months = Object.keys(monthlyMap).sort().reverse();
    if (months.length === 0) {
      monthlyEl.innerHTML = `<div class="py-6 text-center text-xs text-slate-400">No verified monthly financial activity in the selected period yet.</div>`;
    } else {
      monthlyEl.innerHTML = `
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold text-[11px]">
              <th class="py-2 px-3">Accounting Period</th>
              <th class="py-2 px-3 text-right">Verified Inflow</th>
              <th class="py-2 px-3 text-right">Approved Expenses</th>
              <th class="py-2 px-3 text-right">Payouts &amp; Drawings</th>
              <th class="py-2 px-3 text-right">Net Monthly Cashflow</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            ${months
              .map((mo) => {
                const row = monthlyMap[mo];
                const net = row.inflow - row.expenses - row.payroll;
                return `
                  <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td class="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">${escapeHtml(mo)}</td>
                    <td class="py-2.5 px-3 text-right font-bold text-[#026047] dark:text-emerald-400">${formatINR(row.inflow)}</td>
                    <td class="py-2.5 px-3 text-right text-rose-600 dark:text-rose-400">${formatINR(row.expenses)}</td>
                    <td class="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400">${formatINR(row.payroll)}</td>
                    <td class="py-2.5 px-3 text-right font-black ${net >= 0 ? 'text-[#026047] dark:text-emerald-400' : 'text-rose-600'}">${formatINR(net)}</td>
                  </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      `;
    }
  }

  if (reservesEl) {
    reservesEl.innerHTML = (STATE.reserves || [])
      .map((r) => {
        const bal = Number(r.currentBalance) || 0;
        const tgt = Number(r.targetAmount) || 1;
        const pct = Math.min(100, Math.round((bal / tgt) * 100));
        return `
          <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
            <div class="flex items-start justify-between gap-2">
              <div class="font-bold text-xs text-slate-900 dark:text-white">${escapeHtml(r.name)}</div>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#fffde8] text-[#026047] border border-[#026047]/30">${pct}%</span>
            </div>
            <div class="text-lg font-black text-[#026047] dark:text-emerald-400">${formatINR(bal)}</div>
            <div class="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full bg-[#026047] transition-all" style="width: ${pct}%"></div>
            </div>
            <div class="flex justify-between text-[10px] text-slate-500">
              <span>Target: ${formatINR(tgt, false)}</span>
            </div>
            <p class="text-[10px] text-slate-500 leading-snug">${escapeHtml(r.description)}</p>
          </div>`;
      })
      .join('');
  }

  if (auditEl) {
    const logs = (STATE.auditLogs || []).slice(0, 30);
    if (logs.length === 0) {
      auditEl.innerHTML = `<div class="py-6 text-center text-xs text-slate-400">No corporate audit events recorded yet.</div>`;
    } else {
      auditEl.innerHTML = `
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold text-[11px]">
              <th class="py-2 px-3">Timestamp</th>
              <th class="py-2 px-3">Action</th>
              <th class="py-2 px-3">Details</th>
              <th class="py-2 px-3">Authorized / Triggered By</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            ${logs
              .map(
                (log) => `
                <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td class="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">${escapeHtml(log.date)}</td>
                  <td class="py-2 px-3 whitespace-nowrap">
                    <span class="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-[#026047] dark:text-emerald-300">${escapeHtml(log.action)}</span>
                  </td>
                  <td class="py-2 px-3 text-slate-700 dark:text-slate-300">${escapeHtml(log.details)}</td>
                  <td class="py-2 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">${escapeHtml(log.performedBy)}</td>
                </tr>`
              )
              .join('')}
          </tbody>
        </table>
      `;
    }
  }
}
window.renderFinancialSummary = renderFinancialSummary;

window.openAllocateReserveModal = function () {
  if (!requireFounder('allocate funds to company reserves')) return;
  const modal = document.getElementById('modal-allocate-reserve');
  if (modal) modal.classList.remove('hidden');
};

window.closeAllocateReserveModal = function () {
  const modal = document.getElementById('modal-allocate-reserve');
  if (modal) modal.classList.add('hidden');
};

window.submitAllocateReserve = function () {
  if (!requireFounder('allocate funds to company reserves')) return;
  const selectEl = document.getElementById('reserve-select');
  const amountEl = document.getElementById('reserve-amount');
  const reserveId = selectEl ? selectEl.value : '';
  const amount = parseFloat(amountEl ? amountEl.value : '0');

  if (!reserveId || !Number.isFinite(amount) || amount <= 0) {
    return alert('Please select a reserve fund and enter a positive amount.');
  }

  const m = calculateMetrics();
  if (amount > m.availableCompanyCash) {
    return alert(
      `Insufficient Unencumbered Cash (${formatINR(m.availableCompanyCash)}) to earmark ${formatINR(amount)} to reserves.`
    );
  }

  const reserve = (STATE.reserves || []).find((r) => r.id === reserveId);
  if (!reserve) return;

  reserve.currentBalance = (Number(reserve.currentBalance) || 0) + amount;
  recordAuditLog(
    'RESERVE_ALLOCATED',
    `Earmarked ${formatINR(amount)} into ${reserve.name}`,
    'Pranav Bansode (Founder / Director)'
  );
  saveAppStateToStorage();

  if (amountEl) amountEl.value = '';
  closeAllocateReserveModal();
  renderFinancialSummary();
  renderFounderDashboard();
  showToast(`Earmarked ${formatINR(amount)} to ${reserve.name}.`);
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
  if (!requireFounder('export financial statements')) return;
  if (format === 'csv') {
    const m = calculateMetrics();
    const rows = [
      ['Section', 'Item', 'Category / Status', 'Date', 'Value (INR)'],
      ['Summary', 'Total Money Received', 'Verified Inflow', STATE.dateFilter || 'nov_2026', m.totalMoneyReceived],
      ['Summary', 'Total Business Expenses', 'Approved Outflow', STATE.dateFilter || 'nov_2026', m.totalBusinessExpenses],
      ['Summary', 'Team Compensation Paid', 'Disbursed Payouts', STATE.dateFilter || 'nov_2026', m.teamSalariesPaid],
      ['Summary', 'Founder Drawings', 'Equity Draw', STATE.dateFilter || 'nov_2026', m.founderDrawingsTotal],
      ['Summary', 'Net Business Profit', 'Operating Profit', STATE.dateFilter || 'nov_2026', m.netBusinessProfit],
      ['Summary', 'Total Earmarked Reserves', 'Corporate Reserves', STATE.dateFilter || 'nov_2026', m.totalCompanyReserves],
      ['Summary', 'Available Company Cash', 'Unencumbered Liquid Cash', STATE.dateFilter || 'nov_2026', m.availableCompanyCash],
      ['Summary', 'Pending Client Payments', 'Receivables', STATE.dateFilter || 'nov_2026', m.pendingClientPayments],
    ];

    (STATE.projects || []).forEach((p) => {
      const fin = getProjectFinancials(p.id);
      rows.push(['Project P&L', `${p.name} (${p.code})`, 'Net Margin', STATE.dateFilter || 'nov_2026', fin.received - fin.expenses]);
    });

    (STATE.income || []).forEach((inc) => {
      rows.push(['Client Deal', `${inc.clientName} - ${inc.projectName}`, inc.status, inc.paymentDate, inc.amount]);
    });

    const csv = rows.map((r) => r.map((cell) => csvSafe(cell)).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Phoenix_Tech_Solution_Finance_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    recordAuditLog('EXPORT_CSV', 'Exported corporate financial ledger CSV', 'Pranav Bansode (Founder / Director)');
    showToast('Financial CSV report downloaded.');
  } else if (format === 'print') {
    window.print();
  }
};

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className =
    'fixed bottom-6 right-6 z-50 bg-[#026047] text-[#fffde8] text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 border border-[#fffde8]/20';
  toast.innerHTML = `<span>✓</span> <span>${escapeHtml(msg)}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
window.showToast = showToast;
})(window, document);

