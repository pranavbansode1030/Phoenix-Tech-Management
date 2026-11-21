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
const PHOENIX_SUPABASE_KEY = 'sb_publishable_W_QNdDR7wpYjgmZJQ_Bjsw_iS3TxZPA';
const PHOENIX_SUPABASE_ANON = 'sb_publishable_W_QNdDR7wpYjgmZJQ_Bjsw_iS3TxZPA';
const APP_STATE_STORAGE_KEY = 'phoenix_erp_state_v1';

function getSupabaseClient() {
  if (window.PhoenixSupabase && typeof window.PhoenixSupabase.getClient === 'function') {
    const c = window.PhoenixSupabase.getClient();
    if (c) return c;
  }
  if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
    return window.supabase.createClient(PHOENIX_SUPABASE_URL, PHOENIX_SUPABASE_KEY);
  }
  return null;
}

async function deleteFromSupabase(table, filterCol, filterVal) {
  if (!filterVal) return;
  const sb = getSupabaseClient();
  if (!sb) return;
  try {
    const { error } = await sb.from(table).delete().eq(filterCol, filterVal);
    if (error && !error.message.includes('schema cache')) {
      console.warn(`[Supabase Delete Note] ${table}.${filterCol}=${filterVal}:`, error.message);
    }
  } catch (err) {
    console.warn(`[Supabase Delete Exception] ${table}.${filterCol}=${filterVal}:`, err);
  }
}

async function deleteFromSupabaseLike(table, filterCol, pattern) {
  if (!pattern) return;
  const sb = getSupabaseClient();
  if (!sb) return;
  try {
    const { error } = await sb.from(table).delete().ilike(filterCol, pattern);
    if (error && !error.message.includes('schema cache')) {
      console.warn(`[Supabase DeleteLike Note] ${table}.${filterCol} ilike ${pattern}:`, error.message);
    }
  } catch (err) {
    console.warn(`[Supabase DeleteLike Exception] ${table}.${filterCol}:`, err);
  }
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

const MEMBER_DEPARTMENT_MAP = {
  'mem-01': 'Executive & Founder Oversight',
  'mem-02': 'Commercial & Marketing Department',
  'mem-03': 'Technical Department',
  'mem-04': 'Research & Scouting Department',
  'pranav': 'Executive & Founder Oversight',
  'arshad': 'Commercial & Marketing Department',
  'vivek': 'Technical Department',
  'aryan': 'Research & Scouting Department'
};

function getDepartmentName(memberIdOrRole) {
  if (!memberIdOrRole) return 'Technical Department';
  return MEMBER_DEPARTMENT_MAP[memberIdOrRole] || 'Technical Department';
}
window.getDepartmentName = getDepartmentName;

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
  if (STATE.activeRole !== 'pranav' && STATE.activeRole !== 'arshad') {
    showToast(`Security Gate: Only Executive Leadership (Founder Pranav or Co-Founder & CTO Arshad) can ${actionDesc}.`);
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
    if (Array.isArray(STATE.leads)) {
      STATE.leads = STATE.leads.filter(
        (l) =>
          l.id !== 'lead-01' &&
          l.id !== 'lead-02' &&
          !/apex health/i.test(l.clientName || '') &&
          !/metropolis gym/i.test(l.clientName || '')
      );
    }
    if (Array.isArray(STATE.assignedTasks)) {
      STATE.assignedTasks = STATE.assignedTasks.filter(
        (t) =>
          t.leadId !== 'lead-01' &&
          t.leadId !== 'lead-02' &&
          !/apex health/i.test(t.title || '') &&
          !/metropolis gym/i.test(t.title || '')
      );
    }
  } catch (e) {
    console.warn('App state load error:', e);
  }
}

function recordAuditLog(action, details, performedBy) {
  const newLog = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    action,
    details,
    performedBy,
    date: new Date().toISOString().replace('T', ' ').slice(0, 16)
  };
  STATE.auditLogs.unshift(newLog);
  if (STATE.auditLogs.length > 200) STATE.auditLogs.length = 200;
  saveAppStateToStorage();
  syncAuditLogToSupabase(newLog);
}

function syncAuditLogToSupabase(log) {
  const sb = getSupabaseClient();
  if (!sb) return;
  try {
    sb.from('audit_logs')
      .insert({
        action: log.action || 'LOG_ENTRY',
        entity: log.entity || 'erp_action',
        entity_id: null,
        performed_by: log.performedBy || 'System',
        details: typeof log.details === 'object' ? log.details : { message: String(log.details || '') },
      })
      .then(({ error }) => {
        if (error) console.warn('Supabase audit log sync note:', error.message);
      })
      .catch((err) => console.warn('Supabase audit log sync catch:', err));
  } catch (e) {
    console.warn('Supabase audit log exception:', e);
  }
}

function syncLeadToSupabase(lead) {
  if (!lead) return;
  const sb = getSupabaseClient();
  if (!sb) return;
  try {
    // 1. Permanently record lead synchronization in Supabase audit_logs
    syncAuditLogToSupabase({
      action: 'LEAD_' + String(lead.status || 'SYNC').toUpperCase(),
      entity: 'client_lead',
      performedBy: lead.submittedBy || 'Aryan Bhore (Research Lead)',
      details: {
        id: lead.id,
        leadNumber: lead.leadNumber,
        clientName: lead.clientName,
        contactPerson: lead.contactPerson,
        phone: lead.phone,
        productType: lead.productType,
        dealValue: lead.dealValue,
        status: lead.status,
        submittedAt: lead.submittedAt,
        founderInstructions: lead.founderInstructions || null,
        allocatedToName: lead.allocatedToName || null,
      },
    });

    // 2. Also upsert to client_leads table if table is provisioned
    sb.from('client_leads')
      .upsert({
        id: lead.id,
        lead_number: lead.leadNumber || ('LEAD-' + lead.id),
        client_name: lead.clientName,
        contact_person: lead.contactPerson || '',
        phone: lead.phone || '',
        product_type: lead.productType || 'LeadX Platform',
        deal_value: Number(lead.dealValue) || 0,
        requirements: lead.requirements || '',
        submitted_by: lead.submittedBy || 'Aryan Bhore',
        submitted_at: lead.submittedAt || new Date().toISOString(),
        status: lead.status || 'submitted_to_founder',
        stage: lead.stage || 'lead_created',
        founder_instructions: lead.founderInstructions || null,
        due_date: lead.dueDate || null,
        priority: lead.priority || 'high',
        allocated_to_name: lead.allocatedToName || null,
        allocated_at: lead.allocatedAt || null,
      })
      .then(({ error }) => {
        if (error && !error.message.includes('schema cache')) {
          console.warn('Supabase lead upsert note:', error.message);
        }
      })
      .catch(() => {});
  } catch (e) {
    console.warn('Supabase lead sync exception:', e);
  }
}

function syncAssignedTaskToSupabase(task) {
  if (!task) return;
  const sb = getSupabaseClient();
  if (!sb) return;
  try {
    const targetMemberUuid = MEMBER_UUID_MAP[task.assignedTo] || '00000000-0000-4000-8000-000000000003';
    const targetProjectUuid = PROJECT_UUID_MAP[task.projectId] || null;

    sb.from('assigned_tasks')
      .insert({
        title: task.title,
        description: task.description || '',
        assigned_to: targetMemberUuid,
        project_id: targetProjectUuid,
        priority: task.priority || 'high',
        status: task.status || 'assigned',
        due_date: task.dueDate || null,
      })
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.warn('Supabase task insert note:', error.message);
        } else if (data && data.id) {
          task.id = data.id;
          saveAssignedTasksToStorage();
        }
      })
      .catch((err) => console.warn('Supabase task insert catch:', err));
  } catch (e) {
    console.warn('Supabase task sync exception:', e);
  }
}

function syncIncomeToSupabase(inc) {
  if (!inc) return;
  const sb = getSupabaseClient();
  if (!sb) return;
  try {
    const targetProjectUuid = inc.projectId && PROJECT_UUID_MAP[inc.projectId] ? PROJECT_UUID_MAP[inc.projectId] : null;
    sb.from('income_records')
      .insert({
        source: inc.source || inc.clientName || 'Client Inflow',
        client_name: inc.clientName || 'Client',
        project_id: targetProjectUuid,
        amount: Number(inc.amount) || 0,
        gst_amount: Number(inc.gstAmount) || 0,
        total_with_gst: (Number(inc.amount) || 0) + (Number(inc.gstAmount) || 0),
        payment_date: inc.paymentDate || inc.date || new Date().toISOString().split('T')[0],
        status: inc.status === 'received' ? 'received' : 'pending',
        payment_method: inc.paymentMethod || 'bank_transfer',
        invoice_no: inc.invoiceNo || null,
        notes: inc.notes || inc.description || '',
      })
      .then(({ error }) => {
        if (error) console.warn('Supabase income sync note:', error.message);
      })
      .catch(() => {});
  } catch (e) {
    console.warn('Supabase income sync exception:', e);
  }
}

function syncExpenseToSupabase(exp) {
  if (!exp) return;
  const sb = getSupabaseClient();
  if (!sb) return;
  try {
    const targetProjectUuid = exp.projectId && PROJECT_UUID_MAP[exp.projectId] ? PROJECT_UUID_MAP[exp.projectId] : null;
    const catMap = {
      marketing_business: 'marketing_business',
      marketing: 'marketing_business',
      technical_infrastructure: 'technical_infrastructure',
      software_tools: 'software_tools',
      team_compensation: 'team_compensation',
      administrative: 'administrative',
      direct_project_cost: 'direct_project_cost',
    };
    const validCat = catMap[exp.category] || 'other';

    sb.from('expense_records')
      .insert({
        title: exp.title,
        category: validCat,
        project_id: targetProjectUuid,
        amount: Number(exp.amount) || 0,
        gst_amount: Number(exp.gstAmount) || 0,
        total_payment: (Number(exp.amount) || 0) + (Number(exp.gstAmount) || 0),
        date: exp.date || new Date().toISOString().split('T')[0],
        paid_by: exp.paidBy || 'Team Member',
        description: exp.description || '',
        status: exp.status === 'approved' ? 'approved' : 'pending_approval',
      })
      .then(({ error }) => {
        if (error) console.warn('Supabase expense sync note:', error.message);
      })
      .catch(() => {});
  } catch (e) {
    console.warn('Supabase expense sync exception:', e);
  }
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

// ==============================================================================
// IPHONE / IOS NOTIFICATION SOUND & POPUP SYSTEM (Web Audio API Synthesizer)
// ==============================================================================
let _iosAudioCtx = null;

function getIPhoneAudioContext() {
  if (!_iosAudioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      _iosAudioCtx = new AudioContext();
    }
  }
  if (_iosAudioCtx && _iosAudioCtx.state === 'suspended') {
    _iosAudioCtx.resume().catch(() => {});
  }
  return _iosAudioCtx;
}

// Unlock audio context on user interaction
window.addEventListener('click', function unlockAudio() {
  getIPhoneAudioContext();
  window.removeEventListener('click', unlockAudio);
}, { once: true });

function playIPhoneNotificationSound() {
  try {
    const ctx = getIPhoneAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    // Authentic iPhone Tri-tone chime: G#5 (830.61 Hz), C6 (1046.50 Hz), E6 (1318.51 Hz)
    const tones = [
      { freq: 830.61, start: now + 0.00, dur: 0.09, gain: 0.28 },
      { freq: 1046.50, start: now + 0.09, dur: 0.09, gain: 0.32 },
      { freq: 1318.51, start: now + 0.18, dur: 0.35, gain: 0.36 }
    ];

    tones.forEach((tone) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(tone.freq, tone.start);

      // Smooth attack and natural iOS chime exponential decay
      gainNode.gain.setValueAtTime(0.001, tone.start);
      gainNode.gain.exponentialRampToValueAtTime(tone.gain, tone.start + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, tone.start + tone.dur);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(tone.start);
      osc.stop(tone.start + tone.dur);
    });
  } catch (err) {
    console.debug('Audio chime playback omitted:', err);
  }
}
window.playIPhoneNotificationSound = playIPhoneNotificationSound;

function showIPhoneNotificationPopup({ title, message, type = 'info', actor = '' }) {
  // Play authentic iPhone chime
  playIPhoneNotificationSound();

  // Create floating iOS Dynamic Island style banner
  const containerId = 'iphone-notification-banner-container';
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none flex flex-col items-center gap-2 w-full max-w-md px-4';
    document.body.appendChild(container);
  }

  const card = document.createElement('div');
  card.className = 'pointer-events-auto w-full rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 text-white backdrop-blur-xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.45)] p-3.5 transform transition-all duration-300 -translate-y-4 opacity-0 scale-95 cursor-pointer hover:bg-slate-900 select-none';

  const typeEmoji = type === 'lead' ? '🎯' : type === 'task' ? '📋' : type === 'approval' ? '👑' : type === 'payout' ? '💳' : '🔔';

  card.innerHTML = `
    <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
      <div class="flex items-center gap-1.5">
        <span class="w-4 h-4 rounded-full bg-[#026047] text-[#fffde8] flex items-center justify-center text-[9px] font-black">PT</span>
        <span class="font-extrabold tracking-wider text-slate-300 uppercase text-[10px]">PHOENIX PORTAL</span>
        ${actor ? `&bull; <span class="text-slate-400 font-medium">${escapeHtml(actor)}</span>` : ''}
      </div>
      <span class="font-medium text-[10px] text-slate-400">now</span>
    </div>
    <div class="flex items-start gap-2.5">
      <span class="text-lg shrink-0 mt-0.5">${typeEmoji}</span>
      <div class="min-w-0 flex-1">
        <h4 class="text-xs font-bold text-white truncate leading-tight">${escapeHtml(title)}</h4>
        <p class="text-[11px] text-slate-300 mt-0.5 leading-snug line-clamp-2">${escapeHtml(message)}</p>
      </div>
    </div>
  `;

  // Tap to dismiss
  card.onclick = () => {
    card.classList.add('-translate-y-4', 'opacity-0', 'scale-95');
    setTimeout(() => card.remove(), 250);
  };

  container.appendChild(card);

  // Trigger smooth slide down with bounce
  requestAnimationFrame(() => {
    card.classList.remove('-translate-y-4', 'opacity-0', 'scale-95');
    card.classList.add('translate-y-0', 'opacity-100', 'scale-100');
  });

  // Auto-dismiss after 4.5 seconds
  setTimeout(() => {
    if (card.parentNode) {
      card.classList.add('-translate-y-4', 'opacity-0', 'scale-95');
      setTimeout(() => card.remove(), 250);
    }
  }, 4500);
}
window.showIPhoneNotificationPopup = showIPhoneNotificationPopup;

// ==============================================================================
// REAL-TIME WORKFLOW NOTIFICATIONS (BELL DROPDOWN & REAL-TIME ALERTS)
// ==============================================================================
function loadNotificationsFromStorage() {
  try {
    const raw = localStorage.getItem('phoenix_notifications');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Notifications load error:', e);
  }
  return [];
}

function saveNotificationsToStorage() {
  try {
    localStorage.setItem('phoenix_notifications', JSON.stringify((STATE.notifications || []).slice(0, 60)));
  } catch (e) {
    console.warn('Notifications save error:', e);
  }
}

function isNotificationTarget(targetRole, userRole) {
  if (!targetRole || targetRole === 'all') return true;
  if (targetRole === 'founders') return userRole === 'pranav' || userRole === 'arshad';
  if (Array.isArray(targetRole)) return targetRole.includes(userRole);
  if (typeof targetRole === 'string' && targetRole.includes(',')) {
    return targetRole.split(',').map((s) => s.trim()).includes(userRole);
  }
  return targetRole === userRole;
}

function createNotification({ type, title, message, targetRole = 'all', leadId = null, actor = '', actorRole = null }) {
  const callerRole = actorRole || STATE.activeRole;
  const newNotif = {
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    type,
    title,
    message,
    targetRole, // 'all', 'founders', 'pranav', 'vivek', 'arshad', 'aryan'
    leadId,
    actor,
    actorRole: callerRole, // Track who triggered this action to exclude them from notifications
    timestamp: new Date().toISOString(),
    readBy: callerRole ? [callerRole] : []
  };

  if (!Array.isArray(STATE.notifications)) STATE.notifications = [];
  STATE.notifications.unshift(newNotif);
  if (STATE.notifications.length > 60) STATE.notifications.length = 60;
  saveNotificationsToStorage();

  const active = STATE.activeRole;
  // Notify founder & co-founder, excluding the actor who performed the action
  const isRelevant = isNotificationTarget(targetRole, active) && (!callerRole || active !== callerRole);
  if (isRelevant) {
    showIPhoneNotificationPopup({ title, message, type, actor });
  }

  recordAuditLog(
    'WORKFLOW_NOTIFICATION',
    `[${typeof targetRole === 'string' ? targetRole.toUpperCase() : 'TARGET'}] ${title}: ${message}`,
    actor || 'Workflow System'
  );

  renderNotificationBell();
}

window.createNotification = createNotification;

function renderNotificationBell() {
  const badge = document.getElementById('notification-badge');
  const list = document.getElementById('notification-list');
  const activeRole = STATE.activeRole;

  // Filter notifications so actor does not see self-action, and respects targetRole
  const relevant = (STATE.notifications || []).filter((n) => {
    if (n.actorRole && n.actorRole === activeRole) return false;
    return isNotificationTarget(n.targetRole, activeRole);
  });

  const unreadCount = relevant.filter(
    (n) => !(n.readBy || []).includes(activeRole)
  ).length;

  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  if (list) {
    if (relevant.length === 0) {
      list.innerHTML = `
        <div class="py-8 text-center text-slate-400">
          <div class="text-2xl mb-1">🔔</div>
          <div class="text-xs font-bold text-slate-600 dark:text-slate-300">No New Notifications</div>
          <p class="text-[10px] text-slate-400 mt-0.5">Workflow updates from other team members will appear here.</p>
        </div>
      `;
    } else {
      list.innerHTML = relevant
        .map((n) => {
          const isRead = (n.readBy || []).includes(activeRole);
          return `
            <div class="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition ${isRead ? 'opacity-70' : 'bg-emerald-50/50 dark:bg-emerald-950/30 font-medium'}">
              <div class="flex items-center justify-between gap-1 text-[11px] mb-0.5">
                <span class="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  ${!isRead ? '<span class="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>' : ''}
                  ${escapeHtml(n.title)}
                </span>
                <span class="text-[9px] text-slate-400 font-mono">${formatDate(n.timestamp)}</span>
              </div>
              <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">${escapeHtml(n.message)}</p>
              ${n.actor ? `<div class="text-[9px] text-[#026047] dark:text-emerald-400 font-bold mt-1">Action by: ${escapeHtml(n.actor)}</div>` : ''}
            </div>
          `;
        })
        .join('');
    }
  }
}
window.renderNotificationBell = renderNotificationBell;

function toggleNotificationDropdown() {
  const dd = document.getElementById('notification-dropdown');
  if (!dd) return;
  const isHidden = dd.classList.contains('hidden');
  if (isHidden) {
    dd.classList.remove('hidden');
    renderNotificationBell();
  } else {
    dd.classList.add('hidden');
  }
}
window.toggleNotificationDropdown = toggleNotificationDropdown;

function markAllNotificationsAsRead() {
  const activeRole = STATE.activeRole;
  (STATE.notifications || []).forEach((n) => {
    if (!n.readBy) n.readBy = [];
    if (!n.readBy.includes(activeRole)) n.readBy.push(activeRole);
  });
  saveNotificationsToStorage();
  renderNotificationBell();
}
window.markAllNotificationsAsRead = markAllNotificationsAsRead;

document.addEventListener('click', (e) => {
  const wrapper = document.getElementById('topbar-notifications-wrapper');
  const dd = document.getElementById('notification-dropdown');
  if (wrapper && dd && !wrapper.contains(e.target)) {
    dd.classList.add('hidden');
  }
});

function loadLeadsFromStorage() {
  try {
    const raw = localStorage.getItem('phoenix_leads_pipeline');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter(
          (l) =>
            l.id !== 'lead-01' &&
            l.id !== 'lead-02' &&
            !/apex health/i.test(l.clientName || '') &&
            !/metropolis gym/i.test(l.clientName || '')
        );
        try {
          localStorage.setItem('phoenix_leads_pipeline', JSON.stringify(filtered));
        } catch (_) {}
        return filtered.map(normalizeLead);
      }
    }
  } catch (e) {
    console.warn('Leads storage load error:', e);
  }
  return [];
}

function loadAssignedTasksFromStorage() {
  try {
    const stored = localStorage.getItem('phoenix_assigned_tasks');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        STATE.assignedTasks = parsed.filter(
          (t) =>
            t.leadId !== 'lead-01' &&
            t.leadId !== 'lead-02' &&
            !/apex health/i.test(t.title || '') &&
            !/metropolis gym/i.test(t.title || '')
        );
        try {
          localStorage.setItem('phoenix_assigned_tasks', JSON.stringify(STATE.assignedTasks));
        } catch (_) {}
      }
    }
  } catch (e) {
    console.warn('Storage load error:', e);
  }
}

let _isSyncingTasks = false;
let _lastSyncTime = 0;

async function syncTasksFromSupabase(force = false) {
  if (!STATE.isAuthenticated) return;
  const now = Date.now();
  if (!force && _isSyncingTasks) return;
  if (!force && now - _lastSyncTime < 4000) return;
  _isSyncingTasks = true;
  _lastSyncTime = now;
  loadAssignedTasksFromStorage();
  const sb = getSupabaseClient();
  if (!sb) {
    _isSyncingTasks = false;
    return;
  }
  try {
    const { data, error } = await sb
      .from('assigned_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch tasks error:', error.message);
      _isSyncingTasks = false;
      return;
    }

    if (data && data.length > 0) {
      let tombstone = [];
      try {
        tombstone = JSON.parse(localStorage.getItem('phoenix_deleted_tasks') || '[]');
      } catch (e) { tombstone = []; }
      const deletedSet = new Set(tombstone);

      // Clean up orphaned deleted tasks in Supabase in a single batch
      const toDeleteFromRemote = data.filter((row) =>
        deletedSet.has(row.id) ||
        deletedSet.has(row.title) ||
        /apex health/i.test(row.title || '') ||
        /metropolis gym/i.test(row.title || '')
      );
      if (toDeleteFromRemote.length > 0) {
        const idsToDelete = toDeleteFromRemote.map((r) => r.id);
        sb.from('assigned_tasks').delete().in('id', idsToDelete).then(() => {}).catch(() => {});
      }

      const activeRows = data.filter((row) =>
        !deletedSet.has(row.id) &&
        !deletedSet.has(row.title) &&
        !/apex health/i.test(row.title || '') &&
        !/metropolis gym/i.test(row.title || '')
      );
      STATE.assignedTasks = activeRows.map((row) => {
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
  } finally {
    _isSyncingTasks = false;
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
      designation: 'Co-Founder & CTO',
      responsibilities: [
        'Chief Technology Officer oversight',
        'Lead review, approvals & tech allocation',
        'Commercial deals & client sales',
        'Technical architecture review'
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
  leads: loadLeadsFromStorage(),
  notifications: loadNotificationsFromStorage(),

  // 2. Initial Projects (Live in-progress initiatives & completed products)
  projects: [
    {
      id: 'prj-godownpro',
      code: 'PRP-GodownPro',
      name: 'GodownPro',
      description: 'Inventory warehouse automation & B2B stock tracking engine.',
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
      createdAt: '2026-09-01',
    },
    {
      id: 'prj-leadx',
      code: 'PRJ-LEADX',
      name: 'LeadX',
      description: 'B2B client acquisition, automated lead capture and outreach pipeline platform.',
      status: 'completed',
      revenueReceived: 185000,
      directExpenses: 22000,
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
      status: 'completed',
      revenueReceived: 95000,
      directExpenses: 14000,
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
  renderNotificationBell();

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

// ==============================================================================
// USER-ISOLATED PROFILE, PREFERENCE & COLOR THEME SYSTEM
// Any user changes (theme, portfolio focus, private notes, date filters)
// are strictly limited to their own profile and completely invisible to others.
// ==============================================================================

function getUserTheme(role) {
  const r = role || STATE.activeRole || 'pranav';
  try {
    const saved = localStorage.getItem(`phoenix_theme_${r}`);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch (_) {}
  // Default to clean light mode for every user
  return 'light';
}

function setUserTheme(role, theme) {
  const r = role || STATE.activeRole || 'pranav';
  try {
    localStorage.setItem(`phoenix_theme_${r}`, theme);
  } catch (_) {}
  if (!STATE.activeRole || STATE.activeRole === r) {
    STATE.theme = theme;
  }
}

function applyThemeForUser(role) {
  const r = role || STATE.activeRole || 'pranav';
  const theme = getUserTheme(r);
  STATE.theme = theme;
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  return theme;
}

function setupTheme() {
  if (STATE.isAuthenticated && STATE.activeRole) {
    applyThemeForUser(STATE.activeRole);
  } else {
    // Keep login screen neutral light
    document.documentElement.classList.remove('dark');
    STATE.theme = 'light';
  }
}

window.toggleTheme = function () {
  const currentRole = STATE.activeRole || 'pranav';
  const currentTheme = getUserTheme(currentRole);
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setUserTheme(currentRole, newTheme);
  applyThemeForUser(currentRole);
  const userName = (MEMBER_CREDENTIALS[currentRole] && MEMBER_CREDENTIALS[currentRole].name) ? MEMBER_CREDENTIALS[currentRole].name : currentRole;
  showToast(`Color theme set to ${newTheme} mode for ${userName}'s profile only.`);
};

function getUserDateFilter(role) {
  const r = role || STATE.activeRole || 'pranav';
  try {
    const val = localStorage.getItem(`phoenix_date_filter_${r}`);
    if (val) return val;
  } catch (_) {}
  return 'current_month';
}

function setUserDateFilter(role, filterVal) {
  const r = role || STATE.activeRole || 'pranav';
  try {
    localStorage.setItem(`phoenix_date_filter_${r}`, filterVal);
  } catch (_) {}
  STATE.dateFilter = filterVal;
}

function getUserProfile(role) {
  const r = role || STATE.activeRole || 'pranav';
  try {
    const saved = localStorage.getItem(`phoenix_profile_${r}`);
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return {};
}

function saveUserProfile(role, data) {
  const r = role || STATE.activeRole || 'pranav';
  try {
    const current = getUserProfile(r);
    const merged = { ...current, ...data };
    localStorage.setItem(`phoenix_profile_${r}`, JSON.stringify(merged));
    return merged;
  } catch (_) {}
  return data;
}

window.openPortfolioSettingsModal = function () {
  const role = STATE.activeRole || 'pranav';
  const modal = document.getElementById('modal-user-portfolio-settings');
  if (!modal) return;

  const currentTheme = getUserTheme(role);
  const lightRadio = document.getElementById('theme-pref-light');
  const darkRadio = document.getElementById('theme-pref-dark');
  if (lightRadio && darkRadio) {
    if (currentTheme === 'dark') {
      darkRadio.checked = true;
    } else {
      lightRadio.checked = true;
    }
  }

  const profileData = getEmployeeProfile(role);
  const bioInput = document.getElementById('user-profile-bio');
  const notesInput = document.getElementById('user-profile-notes');
  if (bioInput) bioInput.value = profileData.bio || '';
  if (notesInput) notesInput.value = profileData.notes || '';

  const emailInput = document.getElementById('user-profile-email');
  const phoneInput = document.getElementById('user-profile-phone');
  const panInput = document.getElementById('user-profile-pan');
  const bankNameInput = document.getElementById('user-profile-bank-name');
  const bankAccountInput = document.getElementById('user-profile-bank-account');
  const ifscInput = document.getElementById('user-profile-ifsc');

  if (emailInput) emailInput.value = profileData.email || '';
  if (phoneInput) phoneInput.value = profileData.phone || '';
  if (panInput) panInput.value = profileData.pan || '';
  if (bankNameInput) bankNameInput.value = profileData.bankName || '';
  if (bankAccountInput) bankAccountInput.value = profileData.bankAccount || '';
  if (ifscInput) ifscInput.value = profileData.ifsc || '';

  modal.classList.remove('hidden');
};

window.closePortfolioSettingsModal = function () {
  const modal = document.getElementById('modal-user-portfolio-settings');
  if (modal) modal.classList.add('hidden');
};

window.submitPortfolioSettings = function () {
  const role = STATE.activeRole || 'pranav';
  const darkRadio = document.getElementById('theme-pref-dark');
  const chosenTheme = darkRadio && darkRadio.checked ? 'dark' : 'light';
  setUserTheme(role, chosenTheme);
  applyThemeForUser(role);

  const bioInput = document.getElementById('user-profile-bio');
  const notesInput = document.getElementById('user-profile-notes');
  const bio = bioInput ? bioInput.value.trim() : '';
  const notes = notesInput ? notesInput.value.trim() : '';

  const emailInput = document.getElementById('user-profile-email');
  const phoneInput = document.getElementById('user-profile-phone');
  const panInput = document.getElementById('user-profile-pan');
  const bankNameInput = document.getElementById('user-profile-bank-name');
  const bankAccountInput = document.getElementById('user-profile-bank-account');
  const ifscInput = document.getElementById('user-profile-ifsc');

  const email = emailInput ? emailInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const pan = panInput ? panInput.value.trim().toUpperCase() : '';
  const bankName = bankNameInput ? bankNameInput.value.trim() : '';
  const bankAccount = bankAccountInput ? bankAccountInput.value.trim() : '';
  const ifsc = ifscInput ? ifscInput.value.trim().toUpperCase() : '';

  saveUserProfile(role, { bio, notes, email, phone, pan, bankName, bankAccount, ifsc });

  closePortfolioSettingsModal();
  const userName = (MEMBER_CREDENTIALS[role] && MEMBER_CREDENTIALS[role].name) ? MEMBER_CREDENTIALS[role].name : role;
  showToast(`Settings updated! Credentials & details saved strictly for ${userName}.`);
  if (STATE.currentTab === 'employee-dashboard') {
    renderEmployeeDashboard(getCurrentMemberId());
  } else if (STATE.currentTab === 'my-profile') {
    renderMyProfileTab();
  } else {
    renderCurrentTab();
  }
};

// ==============================================================================
// EMPLOYEE OFFICIAL DOCUMENTS & "MY PROFILE" SYSTEM
// Joining Date, Salary Slips, Offer Letter, Company Policies, Emp ID & Credentials
// Blank initial credentials (Email, Phone, PAN, Bank Details) with self-editing
// ==============================================================================

const EMPLOYEE_PROFILE_DOCS = {
  pranav: {
    empId: 'PB-01',
    name: 'Pranav Bansode',
    role: 'pranav',
    designation: 'Founder & Director',
    department: 'Executive Governance & Sole Direction',
    joiningDate: '01 January 2026',
    confirmationDate: '01 January 2026',
    email: '',
    phone: '',
    pan: '',
    bankName: '',
    bankAccount: '',
    ifsc: '',
    salaryModel: 'Executive Equity & Drawings (Non-Salaried Sole Signatory)',
    monthlySalary: 0,
    basicSalary: 0,
    hra: 0,
    specialAllowance: 0,
    professionalTax: 0,
    netMonthly: 0,
    offerLetterRef: 'PTS/DIR/2026/001'
  },
  arshad: {
    empId: 'AS-02',
    name: 'Arshad Shaikh',
    role: 'arshad',
    designation: 'Co-Founder & CTO',
    department: 'Executive Technical & Commercial Architecture',
    joiningDate: '15 January 2026',
    confirmationDate: '15 April 2026',
    email: '',
    phone: '',
    pan: '',
    bankName: '',
    bankAccount: '',
    ifsc: '',
    salaryModel: 'Fixed Retainer + Deal Sourcing Pool',
    monthlySalary: 15000,
    basicSalary: 7500,
    hra: 4500,
    specialAllowance: 3000,
    professionalTax: 200,
    netMonthly: 14800,
    offerLetterRef: 'PTS/HR/2026/OFF-02'
  },
  vivek: {
    empId: 'VG-03',
    name: 'Vivek Gajdhane',
    role: 'vivek',
    designation: 'Technical Department Lead',
    department: 'Technical Department',
    joiningDate: '01 February 2026',
    confirmationDate: '01 May 2026',
    email: '',
    phone: '',
    pan: '',
    bankName: '',
    bankAccount: '',
    ifsc: '',
    salaryModel: 'Fixed Technical Retainer + Incentive Pool',
    monthlySalary: 10000,
    basicSalary: 5000,
    hra: 3000,
    specialAllowance: 2000,
    professionalTax: 200,
    netMonthly: 9800,
    offerLetterRef: 'PTS/HR/2026/OFF-03'
  },
  aryan: {
    empId: 'AB-04',
    name: 'Aryan Bhore',
    role: 'aryan',
    designation: 'Research Lead',
    department: 'Research & Scouting Department',
    joiningDate: '15 February 2026',
    confirmationDate: '15 May 2026',
    email: '',
    phone: '',
    pan: '',
    bankName: '',
    bankAccount: '',
    ifsc: '',
    salaryModel: 'Fixed Research Retainer + Deal Commission',
    monthlySalary: 12000,
    basicSalary: 6000,
    hra: 3600,
    specialAllowance: 2400,
    professionalTax: 200,
    netMonthly: 11800,
    offerLetterRef: 'PTS/HR/2026/OFF-04'
  }
};

function getEmployeeProfile(roleOrId) {
  let r = roleOrId || STATE.activeRole || 'pranav';
  if (r === 'mem-01' || r === 'pb-01') r = 'pranav';
  else if (r === 'mem-02' || r === 'as-02') r = 'arshad';
  else if (r === 'mem-03' || r === 'vg-03') r = 'vivek';
  else if (r === 'mem-04' || r === 'ab-04') r = 'aryan';
  const base = EMPLOYEE_PROFILE_DOCS[r] || EMPLOYEE_PROFILE_DOCS.pranav;
  const userSaved = getUserProfile(r);
  return { ...base, ...userSaved };
}
window.getEmployeeProfile = getEmployeeProfile;

function numberToWordsINR(num) {
  const n = Math.floor(Number(num) || 0);
  if (n <= 0) return 'Zero Rupees Only';
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(val) {
    if (val < 20) return units[val];
    const t = Math.floor(val / 10);
    const u = val % 10;
    return tens[t] + (u ? ' ' + units[u] : '');
  }

  function convertThreeDigits(val) {
    let str = '';
    const h = Math.floor(val / 100);
    const rest = val % 100;
    if (h) str += units[h] + ' Hundred';
    if (rest) str += (str ? ' and ' : '') + convertTwoDigits(rest);
    return str;
  }

  const crore = Math.floor(n / 10000000);
  let rem = n % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;
  const hundreds = rem;

  let words = '';
  if (crore) words += convertThreeDigits(crore) + ' Crore ';
  if (lakh) words += convertThreeDigits(lakh) + ' Lakh ';
  if (thousand) words += convertThreeDigits(thousand) + ' Thousand ';
  if (hundreds) words += convertThreeDigits(hundreds);
  return words.trim() + ' Rupees Only';
}

window.printElementContent = function (elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const printWindow = window.open('', '_blank', 'width=900,height=750');
  if (!printWindow) {
    window.print();
    return;
  }
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Phoenix Tech Solutions - Official Corporate Document</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <style>
          @media print {
            body { padding: 0; background: white !important; color: black !important; }
            @page { margin: 1.5cm; }
          }
        </style>
      </head>
      <body class="bg-white p-8 font-sans text-slate-900">
        ${el.innerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 400);
};

// Legacy route helper for Employee Workspace vs Profile
window.switchEmployeeSubView = function (subView) {
  switchTab(subView === 'profile' ? 'my-profile' : 'employee-dashboard');
};

window.openOfferLetterModal = function (role) {
  const targetRole = role || STATE.activeRole || 'pranav';
  const profile = getEmployeeProfile(targetRole);
  const modal = document.getElementById('modal-offer-letter');
  const body = document.getElementById('offer-letter-print-body');
  if (!modal || !body) return;

  const isDirector = targetRole === 'pranav';

  body.innerHTML = `
    <!-- Company Letterhead Header -->
    <div class="border-b-2 border-[#026047] pb-4 flex items-start justify-between">
      <div>
        <div class="flex items-center gap-2.5">
          <img src="logo-emerald-transparent.png" class="h-9 w-9 object-contain shrink-0" onerror="this.src='logo-black-transparent.png'" alt="Phoenix Tech" />
          <span class="text-base font-black text-[#026047] uppercase tracking-wider">Phoenix Tech Solutions Pvt. Ltd.</span>
        </div>
        <p class="text-[10px] text-slate-500 mt-1 leading-tight">
          CIN: U72900PN2026PTC123456 &bull; Reg. Office: 11-B, Lane No, opposite Etasha Society, Bharat Colony, Sayad Nagar, Hadapsar, Pune, Maharashtra 411028<br/>
          Email: contact@phoenixtech.com &bull; Corporate Portal: portal.phoenixtech.com
        </p>
      </div>
      <div class="text-right">
        <span class="px-2 py-0.5 rounded bg-emerald-50 text-[#026047] font-mono text-[10px] font-bold border border-emerald-200">
          REF: ${escapeHtml(profile.offerLetterRef)}
        </span>
        <div class="text-[10px] text-slate-500 mt-1">Issue Date: <strong>${escapeHtml(profile.joiningDate)}</strong></div>
      </div>
    </div>

    <!-- Letter Subject & Salutation -->
    <div class="space-y-3 pt-2">
      <div>
        <div class="text-[11px] text-slate-500">To:</div>
        <div class="font-extrabold text-sm text-slate-900">${escapeHtml(profile.name)}</div>
        <div class="text-[11px] text-slate-600">Employee Code: <strong class="font-mono">${escapeHtml(profile.empId)}</strong> &bull; PAN: <span class="font-mono">${escapeHtml(profile.pan)}</span></div>
        <div class="text-[11px] text-slate-600">${escapeHtml(profile.email)}</div>
      </div>

      <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900">
        Subject: ${isDirector ? 'Executive Charter of Directorship & Founding Authority' : `Formal Letter of Appointment - ${escapeHtml(profile.designation)}`}
      </div>

      <p class="leading-relaxed">
        Dear <strong>${escapeHtml(profile.name)}</strong>,
      </p>

      <p class="leading-relaxed">
        ${isDirector
          ? 'This corporate charter affirms your position as Founder & Director with 100% executive oversight, sole financial signatory powers, and strategic ownership of Phoenix Tech Solutions Private Limited.'
          : `We are pleased to formally offer you the position of <strong>${escapeHtml(profile.designation)}</strong> in the <strong>${escapeHtml(profile.department)}</strong> at <strong>Phoenix Tech Solutions Private Limited</strong>. Your professional contributions will be integral to the commercial growth and technical innovation of our products including LeadX and Smart Review Management.`
        }
      </p>

      <!-- Terms & Compensation Table -->
      <div class="rounded-xl border border-slate-200 overflow-hidden">
        <table class="w-full text-[11px]">
          <thead class="bg-slate-100 font-bold text-slate-700">
            <tr>
              <th class="p-2 text-left">Terms & Conditions</th>
              <th class="p-2 text-left">Corporate Specification</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr>
              <td class="p-2 font-medium text-slate-500">Official Designation</td>
              <td class="p-2 font-bold text-slate-900">${escapeHtml(profile.designation)}</td>
            </tr>
            <tr>
              <td class="p-2 font-medium text-slate-500">Department / Unit</td>
              <td class="p-2 font-bold text-slate-900">${escapeHtml(profile.department)}</td>
            </tr>
            <tr>
              <td class="p-2 font-medium text-slate-500">Date of Joining</td>
              <td class="p-2 font-bold text-slate-900">${escapeHtml(profile.joiningDate)}</td>
            </tr>
            <tr>
              <td class="p-2 font-medium text-slate-500">Confirmation Date</td>
              <td class="p-2 font-bold text-slate-900">${escapeHtml(profile.confirmationDate)}</td>
            </tr>
            <tr>
              <td class="p-2 font-medium text-slate-500">Remuneration Model</td>
              <td class="p-2 font-bold text-slate-900">${escapeHtml(profile.salaryModel)}</td>
            </tr>
            ${!isDirector ? `
            <tr>
              <td class="p-2 font-medium text-slate-500">Monthly Compensation</td>
              <td class="p-2 font-extrabold text-[#026047]">${formatINR(profile.monthlySalary)} / Month (${numberToWordsINR(profile.monthlySalary)})</td>
            </tr>
            ` : `
            <tr>
              <td class="p-2 font-medium text-slate-500">Drawings & Governance</td>
              <td class="p-2 font-extrabold text-[#026047]">Sole Executive Drawings &amp; Retained Earnings</td>
            </tr>
            `}
            <tr>
              <td class="p-2 font-medium text-slate-500">Place of Work</td>
              <td class="p-2 text-slate-900">Pune, Maharashtra / Hybrid Work Environment</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
        <p><strong>1. Code of Conduct:</strong> You agree to abide by the Company’s employment policies, NDA, client IP covenants, and ethical guidelines at all times.</p>
        <p><strong>2. Confidentiality:</strong> All technical schemas, source codes, customer pipelines, and financial records remain the exclusive proprietary property of Phoenix Tech Solutions Pvt Ltd.</p>
        <p><strong>3. Notice Period:</strong> Standard 30-day formal written notice period applies to either party following confirmation.</p>
      </div>

      <!-- Formal Signatures -->
      <div class="pt-6 grid grid-cols-2 gap-8 border-t border-slate-200 mt-6">
        <div>
          <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Authorized Signatory</div>
          <div class="mt-2 font-serif font-black text-sm text-[#026047] italic">Pranav Bansode</div>
          <div class="text-xs font-bold text-slate-900">Pranav Bansode</div>
          <div class="text-[10px] text-slate-500">Founder &amp; Director &bull; Sole Signatory</div>
          <div class="text-[9px] text-emerald-600 font-semibold mt-0.5">Digitally Approved on Portal</div>
        </div>
        <div class="text-right">
          <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Candidate Acceptance</div>
          <div class="mt-2 font-serif font-black text-sm text-slate-700 italic">${escapeHtml(profile.name)}</div>
          <div class="text-xs font-bold text-slate-900">${escapeHtml(profile.name)}</div>
          <div class="text-[10px] text-slate-500">Emp Code: ${escapeHtml(profile.empId)}</div>
          <div class="text-[9px] text-slate-400 mt-0.5">Accepted &amp; Digitally Verified</div>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
};

window.closeOfferLetterModal = function () {
  const modal = document.getElementById('modal-offer-letter');
  if (modal) modal.classList.add('hidden');
};

window.openSalarySlipModal = function (role, month) {
  const targetRole = role || STATE.activeRole || 'pranav';
  const profile = getEmployeeProfile(targetRole);
  const modal = document.getElementById('modal-salary-slip');
  const body = document.getElementById('salary-slip-print-body');
  const select = document.getElementById('salary-slip-month-select');
  if (!modal || !body) return;

  const currentMonth = month || (select ? select.value : 'November 2026');
  if (select) select.value = currentMonth;

  const isDirector = targetRole === 'pranav';

  body.innerHTML = `
    <!-- Company Payslip Header -->
    <div class="border-b-2 border-[#026047] pb-3 flex items-start justify-between">
      <div>
        <div class="flex items-center gap-2.5">
          <img src="logo-emerald-transparent.png" class="h-8 w-8 object-contain shrink-0" onerror="this.src='logo-black-transparent.png'" alt="Phoenix Tech" />
          <span class="text-sm font-black text-[#026047] uppercase tracking-wider">Phoenix Tech Solutions Private Limited</span>
        </div>
        <p class="text-[10px] text-slate-500 mt-0.5">
          CIN: U72900PN2026PTC123456 &bull; 11-B, Lane No, opposite Etasha Society, Bharat Colony, Sayad Nagar, Hadapsar, Pune, Maharashtra 411028
        </p>
      </div>
      <div class="text-right">
        <div class="text-xs font-black text-slate-900 uppercase tracking-wide">Monthly Salary Slip</div>
        <div class="text-xs font-bold text-[#026047] mt-0.5">${escapeHtml(currentMonth)}</div>
      </div>
    </div>

    <!-- Employee Information Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
      <div>
        <span class="text-slate-400 block text-[9px] uppercase font-bold">Employee Name</span>
        <strong class="text-slate-900 text-xs">${escapeHtml(profile.name)}</strong>
      </div>
      <div>
        <span class="text-slate-400 block text-[9px] uppercase font-bold">Employee Code</span>
        <strong class="font-mono text-slate-900">${escapeHtml(profile.empId)}</strong>
      </div>
      <div>
        <span class="text-slate-400 block text-[9px] uppercase font-bold">Designation</span>
        <strong class="text-slate-900">${escapeHtml(profile.designation)}</strong>
      </div>
      <div>
        <span class="text-slate-400 block text-[9px] uppercase font-bold">Department</span>
        <strong class="text-slate-900">${escapeHtml(profile.department)}</strong>
      </div>
      <div>
        <span class="text-slate-400 block text-[9px] uppercase font-bold">Date of Joining</span>
        <span class="text-slate-700 font-medium">${escapeHtml(profile.joiningDate)}</span>
      </div>
      <div>
        <span class="text-slate-400 block text-[9px] uppercase font-bold">Bank Name</span>
        <span class="text-slate-700 font-medium">${escapeHtml(profile.bankName)}</span>
      </div>
      <div>
        <span class="text-slate-400 block text-[9px] uppercase font-bold">Bank A/C No.</span>
        <span class="font-mono text-slate-700">${escapeHtml(profile.bankAccount)}</span>
      </div>
      <div>
        <span class="text-slate-400 block text-[9px] uppercase font-bold">IFSC / PAN</span>
        <span class="font-mono text-slate-700">${escapeHtml(profile.ifsc)} &bull; ${escapeHtml(profile.pan)}</span>
      </div>
    </div>

    ${isDirector ? `
    <!-- Director Governance Box -->
    <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
      <div class="flex items-center justify-between">
        <span class="font-black text-sm text-[#026047]">Executive Remuneration: Founder &amp; Sole Signatory</span>
        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#026047] text-[#fffde8]">Equity / Drawings Model</span>
      </div>
      <p class="text-[11px] text-slate-600 leading-relaxed">
        Pranav Bansode exercises executive drawings from company retained capital in accordance with Sole Signatory Board resolutions. Salaried payroll deductions (TDS/PT) do not apply to directorship capital drawings.
      </p>
      <div class="pt-2 flex items-center justify-between font-bold text-xs border-t border-emerald-200">
        <span>Executive Drawings Authorized:</span>
        <span class="text-[#026047] font-black text-sm">Active &bull; Retained Profit Position</span>
      </div>
    </div>
    ` : `
    <!-- Earnings & Deductions Breakup Table -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Earnings -->
      <div class="rounded-xl border border-slate-200 overflow-hidden">
        <div class="bg-slate-100 p-2 font-bold text-xs text-slate-700 flex justify-between">
          <span>Earnings Description</span>
          <span>Amount (INR)</span>
        </div>
        <div class="p-2.5 space-y-2 text-[11px]">
          <div class="flex justify-between">
            <span class="text-slate-600">Basic Pay (50%)</span>
            <span class="font-mono font-bold text-slate-900">${formatINR(profile.basicSalary)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-600">House Rent Allowance (HRA - 30%)</span>
            <span class="font-mono font-bold text-slate-900">${formatINR(profile.hra)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-600">Special Retainer Allowance (20%)</span>
            <span class="font-mono font-bold text-slate-900">${formatINR(profile.specialAllowance)}</span>
          </div>
          <div class="pt-2 border-t border-slate-200 flex justify-between font-bold text-xs">
            <span class="text-slate-900">Total Gross Earnings</span>
            <span class="text-[#026047] font-black">${formatINR(profile.monthlySalary)}</span>
          </div>
        </div>
      </div>

      <!-- Deductions -->
      <div class="rounded-xl border border-slate-200 overflow-hidden">
        <div class="bg-slate-100 p-2 font-bold text-xs text-slate-700 flex justify-between">
          <span>Deductions Description</span>
          <span>Amount (INR)</span>
        </div>
        <div class="p-2.5 space-y-2 text-[11px]">
          <div class="flex justify-between">
            <span class="text-slate-600">Professional Tax (PT - Maharashtra)</span>
            <span class="font-mono font-bold text-slate-900">${formatINR(profile.professionalTax)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-600">TDS / Income Tax</span>
            <span class="font-mono font-bold text-slate-900">₹0.00</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-600">Other Deductions</span>
            <span class="font-mono font-bold text-slate-900">₹0.00</span>
          </div>
          <div class="pt-2 border-t border-slate-200 flex justify-between font-bold text-xs">
            <span class="text-slate-900">Total Deductions</span>
            <span class="text-rose-600 font-black">${formatINR(profile.professionalTax)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Net Pay Banner -->
    <div class="p-3.5 rounded-xl bg-[#026047]/10 border border-[#026047]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <span class="text-[10px] text-slate-500 uppercase font-black">Net Salary Payable (Transferred via NEFT)</span>
        <div class="text-base font-black text-[#026047]">${formatINR(profile.netMonthly)}</div>
        <div class="text-[10px] text-slate-600 italic">In Words: ${numberToWordsINR(profile.netMonthly)}</div>
      </div>
      <div class="sm:text-right">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#026047] text-[#fffde8]">✓ Direct Deposit Paid</span>
        <div class="text-[9px] text-slate-400 mt-1">Ref: PTS-PAY-${profile.empId}-${currentMonth.replace(/\s+/g, '').toUpperCase()}</div>
      </div>
    </div>
    `}

    <!-- Footer Authorization -->
    <div class="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
      <div>
        This is a system-generated payslip authorized under company seal.<br/>
        <strong>Sole Signatory:</strong> Pranav Bansode (Founder &amp; Director)
      </div>
      <div class="text-right font-serif font-black text-xs text-[#026047] italic">
        Pranav Bansode<br/>
        <span class="font-sans font-normal text-[9px] text-slate-400 not-italic">Executive Authorized Seal</span>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
};

window.updateSalarySlipMonth = function (month) {
  openSalarySlipModal(STATE.activeRole, month);
};

window.closeSalarySlipModal = function () {
  const modal = document.getElementById('modal-salary-slip');
  if (modal) modal.classList.add('hidden');
};

window.openCompanyPoliciesModal = function () {
  const modal = document.getElementById('modal-company-policies');
  const body = document.getElementById('company-policies-print-body');
  if (!modal || !body) return;

  body.innerHTML = `
    <!-- Company Policies Document -->
    <div class="border-b-2 border-[#026047] pb-3 flex items-start justify-between">
      <div>
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-[#026047] text-[#fffde8] font-black text-xs flex items-center justify-center">PT</div>
          <span class="text-sm font-black text-[#026047] uppercase tracking-wider">Phoenix Tech Solutions Private Limited</span>
        </div>
        <p class="text-[10px] text-slate-500 mt-0.5">Corporate Governance &bull; Employment &amp; Compliance Manual 2026</p>
      </div>
      <div class="text-right">
        <span class="px-2 py-0.5 rounded bg-emerald-50 text-[#026047] text-[10px] font-mono font-bold border border-emerald-200">DOC: PTS-POL-2026-v2</span>
      </div>
    </div>

    <div class="space-y-4 text-xs text-slate-700 dark:text-slate-300">
      <!-- Policy 1 -->
      <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
        <h4 class="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
          <span>🏛️</span> 1. Code of Business Conduct &amp; Professional Integrity
        </h4>
        <p class="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
          All team members must maintain highest ethical standards during client outreach, product demonstrations, and technical deliveries. Representing Phoenix Tech Solutions requires honesty, punctuality, and zero tolerance for deceptive practices or unauthorized representation.
        </p>
      </div>

      <!-- Policy 2 -->
      <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
        <h4 class="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
          <span>🔒</span> 2. Non-Disclosure Agreement (NDA) &amp; Client Data Protection
        </h4>
        <p class="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
          All client databases, prospect requirements, pricing agreements, API keys, source code, and Supabase credentials are strictly confidential. Sharing internal company data or client information with unauthorized third parties constitutes a violation of confidentiality and will result in immediate termination and legal action.
        </p>
      </div>

      <!-- Policy 3 -->
      <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
        <h4 class="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
          <span>💡</span> 3. Intellectual Property (IP) &amp; Technical Ownership
        </h4>
        <p class="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
          All features, architectures, marketing funnels, and codebases developed for LeadX, Smart Review Management, and custom client implementations remain the 100% exclusive intellectual property of Phoenix Tech Solutions Private Limited. Team members assign all rights, titles, and interests in any work created during employment to the Company.
        </p>
      </div>

      <!-- Policy 4 -->
      <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
        <h4 class="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
          <span>💳</span> 4. Expense Reimbursement &amp; Corporate Outflows
        </h4>
        <p class="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
          Only legitimate operational expenses (server hosting, outreach tooling, approved client travel) are eligible for reimbursement. All expense submissions must be recorded on the portal and require formal authorization by Founder &amp; Director Pranav Bansode prior to payout.
        </p>
      </div>

      <!-- Policy 5 -->
      <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
        <h4 class="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
          <span>⚖️</span> 5. Sole Signatory &amp; Executive Authority
        </h4>
        <p class="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
          Pranav Bansode is the sole registered signatory authorized to enter into contracts, approve client proposals, disburse salaries/drawings, and execute commercial commitments on behalf of Phoenix Tech Solutions Private Limited.
        </p>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
};

window.closeCompanyPoliciesModal = function () {
  const modal = document.getElementById('modal-company-policies');
  if (modal) modal.classList.add('hidden');
};

// ==============================================================================
// OFFICIAL CORPORATE DOCUMENTS REGISTRY & PAPER FORMAT GENERATOR
// ==============================================================================
STATE.currentDocFolder = null; // null = root documents list, 'salary_slips_folder' = inside salary slips

const EMPLOYEE_DOCUMENTS_STRUCTURE = {
  aryan: {
    root: [
      { id: 'offer_letter', name: 'Offer Letter - Aryan Bhore.pdf', type: 'pdf', dateModified: '2/15/2026 10:30 AM' },
      { id: 'salary_slips_folder', name: 'Salary Slips', isFolder: true, itemCount: 3, dateModified: '11/1/2026 11:00 AM' },
      { id: 'company_policies', name: 'Company Policies & Code of Conduct.docx', type: 'word', dateModified: '1/15/2026 9:00 AM' },
      { id: 'nda_agreement', name: 'Non-Disclosure Agreement (NDA).docx', type: 'word', dateModified: '2/15/2026 10:45 AM' },
      { id: 'joining_record', name: 'Employee Joining Record - Aryan Bhore.pdf', type: 'pdf', dateModified: '2/15/2026 11:00 AM' }
    ],
    salary_slips_folder: [
      { id: 'salary_slip_nov', name: 'Salary Slip - November 2026.pdf', type: 'pdf', dateModified: '11/1/2026 11:00 AM', month: 'November 2026' },
      { id: 'salary_slip_oct', name: 'Salary Slip - October 2026.pdf', type: 'pdf', dateModified: '10/1/2026 10:30 AM', month: 'October 2026' },
      { id: 'salary_slip_sep', name: 'Salary Slip - September 2026.pdf', type: 'pdf', dateModified: '9/1/2026 10:15 AM', month: 'September 2026' }
    ]
  },
  vivek: {
    root: [
      { id: 'offer_letter', name: 'Offer Letter - Vivek Gajdhane.pdf', type: 'pdf', dateModified: '2/1/2026 10:00 AM' },
      { id: 'salary_slips_folder', name: 'Salary Slips', isFolder: true, itemCount: 3, dateModified: '11/1/2026 11:00 AM' },
      { id: 'company_policies', name: 'Company Policies & Code of Conduct.docx', type: 'word', dateModified: '1/15/2026 9:00 AM' },
      { id: 'nda_agreement', name: 'Non-Disclosure Agreement (NDA).docx', type: 'word', dateModified: '2/1/2026 10:30 AM' },
      { id: 'joining_record', name: 'Employee Joining Record - Vivek Gajdhane.pdf', type: 'pdf', dateModified: '2/1/2026 11:00 AM' }
    ],
    salary_slips_folder: [
      { id: 'salary_slip_nov', name: 'Salary Slip - November 2026.pdf', type: 'pdf', dateModified: '11/1/2026 11:00 AM', month: 'November 2026' },
      { id: 'salary_slip_oct', name: 'Salary Slip - October 2026.pdf', type: 'pdf', dateModified: '10/1/2026 10:30 AM', month: 'October 2026' },
      { id: 'salary_slip_sep', name: 'Salary Slip - September 2026.pdf', type: 'pdf', dateModified: '9/1/2026 10:15 AM', month: 'September 2026' }
    ]
  },
  arshad: {
    root: [
      { id: 'offer_letter', name: 'Offer Letter - Arshad Shaikh.pdf', type: 'pdf', dateModified: '1/20/2026 10:00 AM' },
      { id: 'salary_slips_folder', name: 'Salary Slips', isFolder: true, itemCount: 3, dateModified: '11/1/2026 11:00 AM' },
      { id: 'company_policies', name: 'Company Policies & Code of Conduct.docx', type: 'word', dateModified: '1/15/2026 9:00 AM' },
      { id: 'nda_agreement', name: 'Non-Disclosure Agreement (NDA).docx', type: 'word', dateModified: '1/20/2026 10:30 AM' },
      { id: 'joining_record', name: 'Employee Joining Record - Arshad Shaikh.pdf', type: 'pdf', dateModified: '1/20/2026 11:00 AM' }
    ],
    salary_slips_folder: [
      { id: 'salary_slip_nov', name: 'Salary Slip - November 2026.pdf', type: 'pdf', dateModified: '11/1/2026 11:00 AM', month: 'November 2026' },
      { id: 'salary_slip_oct', name: 'Salary Slip - October 2026.pdf', type: 'pdf', dateModified: '10/1/2026 10:30 AM', month: 'October 2026' },
      { id: 'salary_slip_sep', name: 'Salary Slip - September 2026.pdf', type: 'pdf', dateModified: '9/1/2026 10:15 AM', month: 'September 2026' }
    ]
  },
  pranav: {
    root: [
      { id: 'charter_directorship', name: 'Charter of Directorship & Founding Authority.pdf', type: 'pdf', dateModified: '1/10/2026 10:00 AM' },
      { id: 'coi_moa', name: 'Certificate of Incorporation & MOA-AOA.pdf', type: 'pdf', dateModified: '1/12/2026 11:30 AM' },
      { id: 'salary_slips_folder', name: 'Salary Slips & Executive Drawings', isFolder: true, itemCount: 3, dateModified: '11/1/2026 11:00 AM' },
      { id: 'company_policies', name: 'Corporate Policies & Governance Code.docx', type: 'word', dateModified: '1/15/2026 9:00 AM' },
      { id: 'signatory_register', name: 'Sole Signatory Executive Authority Register.pdf', type: 'pdf', dateModified: '1/15/2026 10:00 AM' },
      { id: 'joining_record', name: 'Director Statutory Master Record - Pranav Bansode.pdf', type: 'pdf', dateModified: '1/10/2026 10:00 AM' }
    ],
    salary_slips_folder: [
      { id: 'salary_slip_nov', name: 'Executive Drawings Slip - November 2026.pdf', type: 'pdf', dateModified: '11/1/2026 11:00 AM', month: 'November 2026' },
      { id: 'salary_slip_oct', name: 'Executive Drawings Slip - October 2026.pdf', type: 'pdf', dateModified: '10/1/2026 10:30 AM', month: 'October 2026' },
      { id: 'salary_slip_sep', name: 'Executive Drawings Slip - September 2026.pdf', type: 'pdf', dateModified: '9/1/2026 10:15 AM', month: 'September 2026' }
    ]
  }
};

// Backwards compatibility alias
const EMPLOYEE_DOCUMENTS_LIST = {
  aryan: [...EMPLOYEE_DOCUMENTS_STRUCTURE.aryan.root, ...EMPLOYEE_DOCUMENTS_STRUCTURE.aryan.salary_slips_folder],
  vivek: [...EMPLOYEE_DOCUMENTS_STRUCTURE.vivek.root, ...EMPLOYEE_DOCUMENTS_STRUCTURE.vivek.salary_slips_folder],
  arshad: [...EMPLOYEE_DOCUMENTS_STRUCTURE.arshad.root, ...EMPLOYEE_DOCUMENTS_STRUCTURE.arshad.salary_slips_folder],
  pranav: [...EMPLOYEE_DOCUMENTS_STRUCTURE.pranav.root, ...EMPLOYEE_DOCUMENTS_STRUCTURE.pranav.salary_slips_folder]
};

window.openDocumentsFolder = function (folderId) {
  STATE.currentDocFolder = folderId;
  renderMyProfileTab();
};

window.closeDocumentsFolder = function () {
  STATE.currentDocFolder = null;
  renderMyProfileTab();
};


let CURRENT_PAPER_METADATA = {
  id: '',
  title: 'Document',
  filename: 'Document.doc',
  type: 'pdf',
  role: 'aryan'
};

window.downloadDocumentAsWord = function (elementId, filename) {
  const element = document.getElementById(elementId);
  if (!element) return;
  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${escapeHtml(filename || 'Document')}</title>
      <style>
        @page {
          size: 21cm 29.7cm;
          margin: 2cm 2cm 2cm 2cm;
          mso-page-orientation: portrait;
        }
        body {
          font-family: Arial, Calibri, 'Segoe UI', sans-serif;
          font-size: 11pt;
          line-height: 1.5;
          color: #0f172a;
          background: #ffffff;
        }
        h1, h2, h3, h4 { color: #026047; margin-bottom: 6pt; }
        p { margin-bottom: 8pt; }
        table { border-collapse: collapse; width: 100%; margin-top: 12pt; margin-bottom: 12pt; }
        th, td { border: 1px solid #cbd5e1; padding: 6pt 8pt; text-align: left; font-size: 10pt; }
        th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; }
        .text-emerald { color: #026047; }
        .stamp-box { border: 2px dashed #026047; padding: 8pt 12pt; color: #026047; font-weight: bold; font-size: 9pt; display: inline-block; margin-top: 10pt; }
      </style>
    </head>
    <body>
      ${element.innerHTML}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const baseName = (filename || 'Phoenix-Corporate-Document').replace(/\.pdf$/i, '').replace(/\.docx?$/i, '');
  const outName = `${baseName}.doc`;
  a.download = outName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Downloading "${outName}" as Microsoft Word document`);
};

window.downloadCurrentPaperAsWord = function () {
  const fname = CURRENT_PAPER_METADATA.filename || 'Phoenix-Corporate-Document';
  downloadDocumentAsWord('paper-sheet-printable-area', fname);
};

window.closePaperDocumentModal = function () {
  const modal = document.getElementById('modal-paper-document');
  if (modal) modal.classList.add('hidden');
};

window.openPaperDocumentModal = function (docId, role) {
  const targetRole = role || STATE.activeRole || 'pranav';
  const profile = getEmployeeProfile(targetRole);
  const isFounder = targetRole === 'pranav';
  const docList = EMPLOYEE_DOCUMENTS_LIST[targetRole] || EMPLOYEE_DOCUMENTS_LIST.aryan;
  const docMeta = docList.find((d) => d.id === docId) || docList[0];

  const modal = document.getElementById('modal-paper-document');
  const paperArea = document.getElementById('paper-sheet-printable-area');
  const titleEl = document.getElementById('paper-doc-title');
  const subtitleEl = document.getElementById('paper-doc-subtitle');
  const badgeEl = document.getElementById('paper-doc-badge');
  const iconEl = document.getElementById('paper-doc-type-icon');
  const footerMetaEl = document.getElementById('paper-doc-footer-meta');

  if (!modal || !paperArea) return;

  CURRENT_PAPER_METADATA = {
    id: docId,
    title: docMeta.name,
    filename: docMeta.name,
    type: docMeta.type,
    role: targetRole
  };

  if (titleEl) titleEl.textContent = docMeta.name;
  if (subtitleEl) subtitleEl.textContent = `Phoenix Tech Solutions Private Limited • ${profile.name} (${profile.empId})`;
  if (iconEl) iconEl.textContent = docMeta.type === 'word' ? '📝' : '📄';
  if (badgeEl) {
    badgeEl.textContent = docMeta.type === 'word' ? 'Word (.doc) Document' : 'PDF Document';
    badgeEl.className = docMeta.type === 'word'
      ? 'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-950 text-blue-300 border border-blue-800 shrink-0'
      : 'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0';
  }
  if (footerMetaEl) {
    footerMetaEl.textContent = `CIN: U72900PN2026PTC123456 • Phoenix Portal Verified • Sole Signatory: Pranav Bansode`;
  }

  // Generate Paper Sheet Content
  let sheetHtml = '';

  // Header Letterhead Template
  const letterheadHtml = `
    <!-- Letterhead -->
    <div class="border-b-2 border-[#026047] pb-5 flex items-start justify-between">
      <div>
        <div class="flex items-center gap-3">
          <img src="logo-emerald-transparent.png" class="h-10 w-10 object-contain shrink-0" onerror="this.src='logo-black-transparent.png'" alt="Phoenix Tech" />
          <div>
            <h1 class="text-lg font-black text-[#026047] tracking-wider uppercase">Phoenix Tech Solutions Private Limited</h1>
            <p class="text-[10px] text-slate-500 font-medium">CIN: U72900PN2026PTC123456 &bull; Reg. Under Companies Act, 2013 (Govt. of India)</p>
          </div>
        </div>
        <p class="text-[11px] text-slate-600 mt-2 leading-tight">
          Registered Office: 11-B, Lane No, opposite Etasha Society, Bharat Colony, Sayad Nagar, Hadapsar, Pune, Maharashtra 411028<br/>
          Official Portal: portal.phoenixtech.com &bull; Corporate Email: contact@phoenixtech.com
        </p>
      </div>
      <div class="text-right">
        <div class="inline-block px-3 py-1 rounded bg-emerald-50 text-[#026047] font-mono text-[10px] font-bold border border-emerald-200">
          REF: ${escapeHtml(profile.offerLetterRef || 'PTS-DOC-2026')}
        </div>
        <div class="text-[10px] text-slate-500 mt-1">Date: <strong>${escapeHtml(docMeta.dateModified.split(' ')[0])}</strong></div>
        <div class="text-[9px] text-emerald-600 font-semibold mt-0.5">&bull; Official Corporate Record</div>
      </div>
    </div>
  `;

  // Signatures & Corporate Rubber Stamp Footer
  const signatureFooterHtml = `
    <div class="pt-8 border-t border-slate-200 mt-8 grid grid-cols-2 gap-8 text-xs">
      <div>
        <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">For Phoenix Tech Solutions Private Limited</div>
        <div class="mt-3">
          <div class="font-serif italic font-black text-base text-[#026047]">Pranav Bansode</div>
          <div class="font-bold text-slate-900 mt-0.5">Pranav Bansode</div>
          <div class="text-[10px] text-slate-500">Founder &amp; Director &bull; Sole Signatory</div>
          <div class="text-[9px] text-emerald-600 font-semibold mt-0.5">DIN: 09845123 &bull; Digital Signature Verified</div>
        </div>
        <!-- Realistic Corporate Rubber Stamp -->
        <div class="mt-3 inline-block px-3 py-1.5 rounded-lg border-2 border-dashed border-[#026047]/60 text-[#026047] text-[10px] font-black uppercase tracking-wider rotate-[-2deg] bg-emerald-50/50">
          ★ PHOENIX TECH SOLUTIONS PVT. LTD. ★<br/>AUTHORIZED SIGNATORY &bull; PUNE
        </div>
      </div>
      <div class="text-right">
        <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">${isFounder ? 'Statutory Registry' : 'Employee Acceptance'}</div>
        <div class="mt-3">
          <div class="font-serif italic font-black text-base text-slate-700">${escapeHtml(profile.name)}</div>
          <div class="font-bold text-slate-900 mt-0.5">${escapeHtml(profile.name)}</div>
          <div class="text-[10px] text-slate-500">Employee ID: ${escapeHtml(profile.empId)}</div>
          <div class="text-[9px] text-slate-400 mt-0.5">Signed &amp; Stored in Corporate HR Cloud</div>
        </div>
      </div>
    </div>
  `;

  if (docId === 'offer_letter' || docId === 'charter_directorship') {
    sheetHtml = `
      ${letterheadHtml}
      <div class="space-y-4 pt-3 text-xs leading-relaxed text-slate-800">
        <div>
          <div class="text-[11px] text-slate-500">To:</div>
          <div class="font-extrabold text-sm text-slate-900">${escapeHtml(profile.name)}</div>
          <div class="text-[11px] text-slate-600">Employee Code: <strong class="font-mono">${escapeHtml(profile.empId)}</strong> &bull; PAN: <span class="font-mono">${escapeHtml(profile.pan)}</span></div>
          <div class="text-[11px] text-slate-600">${escapeHtml(profile.email)}</div>
        </div>

        <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900">
          Subject: ${isFounder ? 'Executive Charter of Directorship & Founding Authority' : `Formal Letter of Appointment - ${escapeHtml(profile.designation)}`}
        </div>

        <p>Dear <strong>${escapeHtml(profile.name)}</strong>,</p>

        <p>
          ${isFounder
            ? 'This corporate charter affirms your position as Founder & Director with 100% executive oversight, sole financial signatory powers, and strategic ownership of Phoenix Tech Solutions Private Limited.'
            : `We are pleased to formally offer you the position of <strong>${escapeHtml(profile.designation)}</strong> in the <strong>${escapeHtml(profile.department)}</strong> at <strong>Phoenix Tech Solutions Private Limited</strong>. Your professional contributions will be integral to the commercial growth and technical innovation of our products including LeadX and Smart Review Management.`
          }
        </p>

        <!-- Specification Table -->
        <div class="rounded-xl border border-slate-200 overflow-hidden my-3">
          <table class="w-full text-[11px]">
            <thead class="bg-slate-100 font-bold text-slate-700">
              <tr>
                <th class="p-2.5 text-left border-b border-slate-200">Terms &amp; Conditions</th>
                <th class="p-2.5 text-left border-b border-slate-200">Corporate Specification</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr>
                <td class="p-2 font-medium text-slate-500">Official Designation</td>
                <td class="p-2 font-bold text-slate-900">${escapeHtml(profile.designation)}</td>
              </tr>
              <tr>
                <td class="p-2 font-medium text-slate-500">Department / Unit</td>
                <td class="p-2 font-bold text-slate-900">${escapeHtml(profile.department)}</td>
              </tr>
              <tr>
                <td class="p-2 font-medium text-slate-500">Date of Joining</td>
                <td class="p-2 font-bold text-slate-900">${escapeHtml(profile.joiningDate)}</td>
              </tr>
              <tr>
                <td class="p-2 font-medium text-slate-500">Confirmation Date</td>
                <td class="p-2 font-bold text-slate-900">${escapeHtml(profile.confirmationDate)}</td>
              </tr>
              <tr>
                <td class="p-2 font-medium text-slate-500">Remuneration Model</td>
                <td class="p-2 font-bold text-slate-900">${escapeHtml(profile.salaryModel)}</td>
              </tr>
              ${!isFounder ? `
              <tr>
                <td class="p-2 font-medium text-slate-500">Monthly Compensation</td>
                <td class="p-2 font-extrabold text-[#026047]">${formatINR(profile.monthlySalary)} / Month (${numberToWordsINR(profile.monthlySalary)})</td>
              </tr>
              ` : `
              <tr>
                <td class="p-2 font-medium text-slate-500">Drawings &amp; Governance</td>
                <td class="p-2 font-extrabold text-[#026047]">Sole Executive Drawings &amp; Retained Earnings</td>
              </tr>
              `}
              <tr>
                <td class="p-2 font-medium text-slate-500">Place of Work</td>
                <td class="p-2 text-slate-900">Pune, Maharashtra / Hybrid Work Environment</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
          <p><strong>1. Code of Conduct:</strong> You agree to abide by the Company’s employment policies, NDA, client IP covenants, and ethical guidelines at all times.</p>
          <p><strong>2. Confidentiality:</strong> All technical schemas, source codes, customer pipelines, and financial records remain the exclusive proprietary property of Phoenix Tech Solutions Pvt Ltd.</p>
          <p><strong>3. Notice Period:</strong> Standard 30-day formal written notice period applies to either party following confirmation.</p>
        </div>

        ${signatureFooterHtml}
      </div>
    `;
  } else if (docId.startsWith('salary_slip')) {
    const slipMonth = docMeta.month || 'November 2026';
    const basic = Math.round(profile.monthlySalary * 0.5);
    const hra = Math.round(profile.monthlySalary * 0.3);
    const retainer = Math.round(profile.monthlySalary * 0.2);
    const ptax = 200;
    const net = isFounder ? 0 : (profile.monthlySalary - ptax);

    sheetHtml = `
      ${letterheadHtml}
      <div class="space-y-4 pt-3 text-xs leading-relaxed text-slate-800">
        <div class="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h2 class="text-sm font-black text-slate-900 uppercase tracking-wide">Monthly Salary Slip &bull; Statement of Earnings</h2>
            <p class="text-[11px] text-slate-500">Billing Period: <strong>${escapeHtml(slipMonth)}</strong></p>
          </div>
          <div class="text-right">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-[#026047]">Disbursed &amp; Reconciled</span>
          </div>
        </div>

        <!-- Employee Info Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
          <div>
            <span class="text-slate-400 block text-[9px] uppercase font-bold">Employee Name</span>
            <strong class="text-slate-900 text-xs">${escapeHtml(profile.name)}</strong>
          </div>
          <div>
            <span class="text-slate-400 block text-[9px] uppercase font-bold">Employee ID / PAN</span>
            <strong class="font-mono text-slate-900">${escapeHtml(profile.empId)}</strong> / <span class="font-mono">${escapeHtml(profile.pan)}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[9px] uppercase font-bold">Department</span>
            <strong class="text-slate-900">${escapeHtml(profile.department)}</strong>
          </div>
          <div>
            <span class="text-slate-400 block text-[9px] uppercase font-bold">Designation</span>
            <strong class="text-slate-900">${escapeHtml(profile.designation)}</strong>
          </div>
          <div>
            <span class="text-slate-400 block text-[9px] uppercase font-bold">Bank Name</span>
            <strong class="text-slate-900">${escapeHtml(profile.bankName)}</strong>
          </div>
          <div>
            <span class="text-slate-400 block text-[9px] uppercase font-bold">Account / IFSC</span>
            <span class="font-mono text-slate-900">${escapeHtml(profile.bankAccount)}</span> (${escapeHtml(profile.ifsc)})
          </div>
          <div>
            <span class="text-slate-400 block text-[9px] uppercase font-bold">Days in Month / Worked</span>
            <strong class="text-slate-900">30 / 30 Days</strong>
          </div>
          <div>
            <span class="text-slate-400 block text-[9px] uppercase font-bold">Payment Method</span>
            <strong class="text-slate-900">Direct Bank NEFT</strong>
          </div>
        </div>

        <!-- Breakdown Table -->
        <div class="grid grid-cols-2 gap-4">
          <div class="rounded-xl border border-slate-200 overflow-hidden">
            <table class="w-full text-[11px]">
              <thead class="bg-slate-100 font-bold text-slate-700">
                <tr>
                  <th class="p-2 text-left border-b border-slate-200">Earnings</th>
                  <th class="p-2 text-right border-b border-slate-200">Amount (₹)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr>
                  <td class="p-2 text-slate-600">Basic Salary (50%)</td>
                  <td class="p-2 text-right font-mono font-bold">${formatINR(basic, false)}</td>
                </tr>
                <tr>
                  <td class="p-2 text-slate-600">House Rent Allowance (30%)</td>
                  <td class="p-2 text-right font-mono font-bold">${formatINR(hra, false)}</td>
                </tr>
                <tr>
                  <td class="p-2 text-slate-600">Special Retainer (20%)</td>
                  <td class="p-2 text-right font-mono font-bold">${formatINR(retainer, false)}</td>
                </tr>
                <tr class="bg-slate-50 font-bold">
                  <td class="p-2 text-slate-900">Gross Earnings</td>
                  <td class="p-2 text-right font-mono text-[#026047]">${formatINR(profile.monthlySalary, false)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="rounded-xl border border-slate-200 overflow-hidden">
            <table class="w-full text-[11px]">
              <thead class="bg-slate-100 font-bold text-slate-700">
                <tr>
                  <th class="p-2 text-left border-b border-slate-200">Deductions</th>
                  <th class="p-2 text-right border-b border-slate-200">Amount (₹)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr>
                  <td class="p-2 text-slate-600">Professional Tax (PT)</td>
                  <td class="p-2 text-right font-mono font-bold">₹200.00</td>
                </tr>
                <tr>
                  <td class="p-2 text-slate-600">Tax Deducted at Source (TDS)</td>
                  <td class="p-2 text-right font-mono font-bold">₹0.00</td>
                </tr>
                <tr>
                  <td class="p-2 text-slate-600">Provident Fund (Opt-out)</td>
                  <td class="p-2 text-right font-mono font-bold">₹0.00</td>
                </tr>
                <tr class="bg-slate-50 font-bold">
                  <td class="p-2 text-slate-900">Total Deductions</td>
                  <td class="p-2 text-right font-mono text-red-600">₹200.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Net Payable Box -->
        <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
          <div>
            <div class="text-[10px] text-[#026047] font-bold uppercase tracking-wider">Net Amount Disbursed to Bank</div>
            <div class="text-xs text-slate-600 mt-0.5">${numberToWordsINR(net)}</div>
          </div>
          <div class="text-xl font-black text-[#026047]">${formatINR(net)}</div>
        </div>

        ${signatureFooterHtml}
      </div>
    `;
  } else if (docId === 'company_policies') {
    sheetHtml = `
      ${letterheadHtml}
      <div class="space-y-4 pt-3 text-xs leading-relaxed text-slate-800">
        <div class="border-b border-slate-200 pb-2">
          <h2 class="text-sm font-black text-slate-900 uppercase tracking-wide">Corporate Code of Conduct &amp; Operating Policies</h2>
          <p class="text-[11px] text-slate-500">Standard Specification: <strong>PTS-POL-2026</strong> &bull; Effective: January 1, 2026</p>
        </div>

        <div class="space-y-3 text-[11px] text-slate-700">
          <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <h3 class="font-bold text-slate-900 text-xs mb-1">1. Proprietary Information &amp; Intellectual Property</h3>
            <p>All algorithms, models, scraper architectures, database schemas, client funnels, and marketing collateral developed by employees or contractors are the exclusive, sole intellectual property of Phoenix Tech Solutions Private Limited.</p>
          </div>

          <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <h3 class="font-bold text-slate-900 text-xs mb-1">2. Client Data Security &amp; Confidentiality</h3>
            <p>Under no circumstances may client data, lead contacts, pricing quotes, or proposal architectures be shared outside the corporate portal or stored on unauthorized personal devices.</p>
          </div>

          <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <h3 class="font-bold text-slate-900 text-xs mb-1">3. Non-Compete &amp; Anti-Solicitation Covenant</h3>
            <p>During the period of engagement and for twelve (12) months following separation, personnel agree not to engage directly or indirectly with active Phoenix clients or solicit existing corporate partners.</p>
          </div>

          <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <h3 class="font-bold text-slate-900 text-xs mb-1">4. Sole Signatory Executive Governance</h3>
            <p>Pranav Bansode is the sole registered signatory authorized to enter into contracts, approve client proposals, disburse salaries/drawings, and execute commercial commitments on behalf of Phoenix Tech Solutions Private Limited.</p>
          </div>
        </div>

        ${signatureFooterHtml}
      </div>
    `;
  } else if (docId === 'nda_agreement') {
    sheetHtml = `
      ${letterheadHtml}
      <div class="space-y-4 pt-3 text-xs leading-relaxed text-slate-800">
        <div class="border-b border-slate-200 pb-2">
          <h2 class="text-sm font-black text-slate-900 uppercase tracking-wide">Non-Disclosure Agreement (NDA) &amp; Confidentiality Deed</h2>
          <p class="text-[11px] text-slate-500">Between: Phoenix Tech Solutions Pvt Ltd and <strong>${escapeHtml(profile.name)}</strong></p>
        </div>

        <p>This Non-Disclosure Agreement governs confidential information disclosed between Phoenix Tech Solutions Private Limited and the undersigned employee:</p>

        <div class="space-y-2 text-[11px] text-slate-700">
          <p><strong>1. Scope:</strong> "Confidential Information" encompasses proprietary software code, API endpoints, customer databases, sales pipeline metrics, pricing algorithms, and corporate business plans.</p>
          <p><strong>2. Duty of Care:</strong> The employee agrees to hold all confidential information in strict trust and not disclose such information to any third party without express prior written approval from Founder Pranav Bansode.</p>
          <p><strong>3. Term:</strong> The obligations of confidentiality shall remain in full force during employment and continue for a period of two (2) years following separation.</p>
          <p><strong>4. Governing Jurisdiction:</strong> This Agreement shall be construed and governed in accordance with the laws of India, under the jurisdiction of courts in Pune, Maharashtra.</p>
        </div>

        ${signatureFooterHtml}
      </div>
    `;
  } else {
    // Joining Record / Master Statutory Dossier / Founder Corporate Records
    sheetHtml = `
      ${letterheadHtml}
      <div class="space-y-4 pt-3 text-xs leading-relaxed text-slate-800">
        <div class="border-b border-slate-200 pb-2">
          <h2 class="text-sm font-black text-slate-900 uppercase tracking-wide">Statutory Personnel Master Record &bull; Corporate Registry</h2>
          <p class="text-[11px] text-slate-500">Document: <strong>${escapeHtml(docMeta.name)}</strong></p>
        </div>

        <!-- Master Data Table -->
        <div class="rounded-xl border border-slate-200 overflow-hidden my-3">
          <table class="w-full text-[11px]">
            <tbody class="divide-y divide-slate-100">
              <tr>
                <td class="p-2.5 font-bold text-slate-500 w-1/3 bg-slate-50">Personnel Full Name</td>
                <td class="p-2.5 font-extrabold text-slate-900">${escapeHtml(profile.name)}</td>
              </tr>
              <tr>
                <td class="p-2.5 font-bold text-slate-500 bg-slate-50">Employee Code / DIN</td>
                <td class="p-2.5 font-mono font-bold text-slate-900">${escapeHtml(profile.empId)}</td>
              </tr>
              <tr>
                <td class="p-2.5 font-bold text-slate-500 bg-slate-50">Designation &amp; Department</td>
                <td class="p-2.5 text-slate-900">${escapeHtml(profile.designation)} &bull; ${escapeHtml(profile.department)}</td>
              </tr>
              <tr>
                <td class="p-2.5 font-bold text-slate-500 bg-slate-50">Tax Identity (PAN)</td>
                <td class="p-2.5 font-mono text-slate-900">${escapeHtml(profile.pan)} (Verified Indian Tax ID)</td>
              </tr>
              <tr>
                <td class="p-2.5 font-bold text-slate-500 bg-slate-50">Payroll Bank Account</td>
                <td class="p-2.5 font-mono text-slate-900">${escapeHtml(profile.bankName)} &bull; ${escapeHtml(profile.bankAccount)} (${escapeHtml(profile.ifsc)})</td>
              </tr>
              <tr>
                <td class="p-2.5 font-bold text-slate-500 bg-slate-50">Official Email &amp; Phone</td>
                <td class="p-2.5 text-slate-900">${escapeHtml(profile.email)} &bull; ${escapeHtml(profile.phone)}</td>
              </tr>
              <tr>
                <td class="p-2.5 font-bold text-slate-500 bg-slate-50">Date of Joining / Confirmation</td>
                <td class="p-2.5 text-slate-900">${escapeHtml(profile.joiningDate)} &bull; Confirmed: ${escapeHtml(profile.confirmationDate)}</td>
              </tr>
              <tr>
                <td class="p-2.5 font-bold text-slate-500 bg-slate-50">Company CIN &amp; Jurisdiction</td>
                <td class="p-2.5 text-slate-900">U72900PN2026PTC123456 &bull; Registrar of Companies (RoC Pune)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="text-[11px] text-slate-500 leading-relaxed">
          This record confirms that the personnel credentials above are verified, authenticated, and cataloged in the statutory register of Phoenix Tech Solutions Private Limited in compliance with Section 88 of the Companies Act, 2013.
        </p>

        ${signatureFooterHtml}
      </div>
    `;
  }

  paperArea.innerHTML = sheetHtml;
  modal.classList.remove('hidden');
};

function renderMyProfileSection(role) {
  const r = role || STATE.activeRole || 'pranav';
  const profile = getEmployeeProfile(r);
  const isFounder = r === 'pranav';
  const struct = EMPLOYEE_DOCUMENTS_STRUCTURE[r] || EMPLOYEE_DOCUMENTS_STRUCTURE.aryan;
  const isInFolder = STATE.currentDocFolder === 'salary_slips_folder';
  const displayedItems = isInFolder ? (struct.salary_slips_folder || []) : (struct.root || []);

  return `
    <div class="space-y-6">
      <!-- 1. Header Profile & Identification Card -->
      <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-[#026047] text-[#fffde8] flex items-center justify-center font-black text-2xl shadow-sm">
              ${profile.empId.slice(0, 2)}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-black text-slate-900 dark:text-white">${escapeHtml(profile.name)}</h2>
                <span class="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  EMP ID: ${escapeHtml(profile.empId)}
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${escapeHtml(profile.designation)} &bull; ${escapeHtml(profile.department)}</p>
            </div>
          </div>
        </div>

        <!-- Official Personnel Credentials Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <span class="text-[10px] text-slate-400 font-bold uppercase block">Date of Joining</span>
            <div class="font-extrabold text-slate-900 dark:text-white mt-0.5">${escapeHtml(profile.joiningDate || '—')}</div>
            <div class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Confirmed: ${escapeHtml(profile.confirmationDate || '—')}</div>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Official Email</span>
              <button onclick="openPortfolioSettingsModal()" class="text-[10px] text-[#026047] dark:text-emerald-400 font-bold hover:underline cursor-pointer">Edit</button>
            </div>
            <div class="font-mono font-bold text-slate-900 dark:text-white mt-0.5 truncate">${profile.email ? escapeHtml(profile.email) : '<span class="text-slate-400 italic font-normal">—</span>'}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">${profile.phone ? escapeHtml(profile.phone) : '<span class="italic font-normal">—</span>'}</div>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Tax &amp; Identity (PAN)</span>
              <button onclick="openPortfolioSettingsModal()" class="text-[10px] text-[#026047] dark:text-emerald-400 font-bold hover:underline cursor-pointer">Edit</button>
            </div>
            <div class="font-mono font-bold text-slate-900 dark:text-white mt-0.5">${profile.pan ? escapeHtml(profile.pan) : '<span class="text-slate-400 italic font-normal">—</span>'}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Permanent Account Number</div>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Payroll Bank Account</span>
              <button onclick="openPortfolioSettingsModal()" class="text-[10px] text-[#026047] dark:text-emerald-400 font-bold hover:underline cursor-pointer">Edit</button>
            </div>
            <div class="font-bold text-slate-900 dark:text-white mt-0.5">${profile.bankName ? escapeHtml(profile.bankName) : '<span class="text-slate-400 italic font-normal">—</span>'}</div>
            <div class="font-mono text-[10px] text-slate-500 truncate">${(profile.bankAccount || profile.ifsc) ? `${escapeHtml(profile.bankAccount || '—')} (${escapeHtml(profile.ifsc || '—')})` : '<span class="text-slate-400 italic font-normal">—</span>'}</div>
          </div>
        </div>
      </div>

      <!-- 2. Official Documents: Windows File Explorer List View -->
      <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div class="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            ${isInFolder ? `
              <button onclick="closeDocumentsFolder()" class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs">
                <span>←</span> Back to Official Documents
              </button>
              <span class="text-slate-400 text-xs">/</span>
              <span class="text-amber-500 text-base">📁</span>
              <h3 class="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">${isFounder ? 'Salary Slips & Executive Drawings' : 'Salary Slips'}</h3>
            ` : `
              <span class="text-amber-500 text-base">📁</span>
              <h3 class="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Official Personnel Documents</h3>
            `}
          </div>
          <span class="text-[11px] text-slate-400 font-mono">${isInFolder ? `${displayedItems.length} monthly slips` : `Total Items: ${displayedItems.length}`}</span>
        </div>

        <div class="divide-y divide-slate-100 dark:divide-slate-800/80">
          ${displayedItems.map((doc) => {
            if (doc.isFolder) {
              return `
                <div onclick="openDocumentsFolder('${doc.id}')"
                  class="flex items-center justify-between px-4 sm:px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer group">
                  <div class="flex items-center gap-3.5 min-w-0 pr-4">
                    <!-- Warm Amber Folder Icon matching Windows Explorer list format -->
                    <svg class="w-5 h-5 shrink-0 text-amber-500 fill-amber-400/90" viewBox="0 0 24 24">
                      <path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h3.379c.464 0 .91.184 1.238.513l.883.882c.328.329.774.513 1.238.513H19.5a2.25 2.25 0 012.25 2.25v.75m-19.5 0v5.25A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25v-5.25m-19.5 0h19.5" />
                    </svg>
                    <span class="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#026047] dark:group-hover:text-emerald-400">
                      ${escapeHtml(doc.name)}
                    </span>
                    <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/20 shrink-0">
                      Folder (${doc.itemCount} months)
                    </span>
                  </div>
                  <div class="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 font-normal shrink-0 tracking-tight">
                    Date modified: ${escapeHtml(doc.dateModified)}
                  </div>
                </div>
              `;
            } else {
              return `
                <div onclick="openPaperDocumentModal('${doc.id}', '${r}')"
                  class="flex items-center justify-between px-4 sm:px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer group">
                  <div class="flex items-center gap-3.5 min-w-0 pr-4">
                    <span class="text-base shrink-0">${doc.type === 'word' ? '📝' : '📄'}</span>
                    <span class="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#026047] dark:group-hover:text-emerald-400">
                      ${escapeHtml(doc.name)}
                    </span>
                  </div>
                  <div class="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 font-normal shrink-0 tracking-tight">
                    Date modified: ${escapeHtml(doc.dateModified)}
                  </div>
                </div>
              `;
            }
          }).join('')}
        </div>
      </div>

      <!-- 3. Corporate Statutory Details Card -->
      <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
        <div class="flex items-center justify-between">
          <span class="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>🏛️</span> Phoenix Tech Solutions Private Limited &bull; Statutory Registry
          </span>
          <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Registered Entity (MCA)</span>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Corporate Identification Number (CIN): <strong class="font-mono text-slate-700 dark:text-slate-300">U72900PN2026PTC123456</strong> &bull;
          Registered Office: 11-B, Lane No, opposite Etasha Society, Bharat Colony, Sayad Nagar, Hadapsar, Pune, Maharashtra 411028 &bull;
          Sole Executive Signatory: <strong class="text-slate-700 dark:text-slate-300">Pranav Bansode (Founder &amp; Director)</strong>
        </p>
      </div>
    </div>
  `;
}
window.renderMyProfileSection = renderMyProfileSection;

function renderMyProfileTab() {
  const container = document.getElementById('my-profile-container');
  if (!container) return;
  const activeUser = STATE.activeRole || 'pranav';
  container.innerHTML = renderMyProfileSection(activeUser);
}
window.renderMyProfileTab = renderMyProfileTab;

function setupNavigation() {
  renderSidebarNav(STATE.currentTab);
}

function renderSidebarNav(activeTab) {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;

  const currentRole = STATE.activeRole || 'pranav';
  activeTab = normalizeTabId(activeTab || STATE.currentTab || ((currentRole === 'pranav' || currentRole === 'arshad') ? 'dashboard-overview' : 'employee-dashboard'));

  // Calculate live counters for pending items
  const pendingInflowsCount = (STATE.income || []).filter((i) => i.status === 'pending' || i.status === 'pending_approval').length;
  const pendingExpensesCount = (STATE.expenses || []).filter((e) => e.status === 'pending_approval').length;
  const pendingPayoutsCount = (STATE.team || []).filter((m) => (m.pendingCompensation || 0) > 0).length;
  const pendingTasksCount = (STATE.assignedTasks || []).filter((t) => {
    if (t.status !== 'review_pending') return false;
    const linkedLead = t.leadId ? (STATE.leads || []).find((l) => l.id === t.leadId) : null;
    if (linkedLead && (linkedLead.status === 'forwarded_to_arshad' || linkedLead.status === 'commercial_in_progress' || linkedLead.status === 'allocated_to_vivek' || linkedLead.status === 'tech_in_progress')) return false;
    return true;
  }).length;
  const pendingLeadsCount = (STATE.leads || []).filter((l) => l.status === 'submitted_to_founder' || l.status === 'submitted_to_arshad' || l.status === 'awaiting_founder_market_approval').length;
  const totalPendingApprovals = pendingInflowsCount + pendingExpensesCount + pendingPayoutsCount + pendingTasksCount + pendingLeadsCount;

  // Real-time notification bell sync
  if (typeof renderNotificationBell === 'function') {
    renderNotificationBell();
  }

  const currentMemberId = currentRole === 'arshad' ? 'mem-02' : (currentRole === 'aryan' ? 'mem-04' : 'mem-03');
  const myAssignedTasksCount = (STATE.assignedTasks || []).filter((t) => t.assignedTo === currentMemberId && t.status !== 'completed').length;
  const aryanAllocatedCount = (STATE.leads || []).filter(
    (l) => (l.submittedByMemberId === 'mem-04' || (l.submittedBy || '').toLowerCase().includes('aryan')) && l.status !== 'rejected'
  ).length;

  if (currentRole === 'pranav') {
    // Founder: Strictly high-level tracking of all work, projects and sales
    nav.innerHTML = `
      <!-- Section: Executive Governance -->
      <div class="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#fffde8]/60 flex items-center gap-1.5">
        <span>🏛️</span> Executive Tracking
      </div>

      <button data-nav="dashboard-overview" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${activeTab === 'dashboard-overview' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">1. Dashboard Overview</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Finances, Inflows &amp; Solvency</div>
        </div>
      </button>

      <!-- Section: Products & Delivery Tracking -->
      <div class="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#fffde8]/60 flex items-center gap-1.5 border-t border-[#024d39]/80 mt-1">
        <span>🚀</span> Projects &amp; Delivery Tracking
      </div>

      <button data-nav="projects" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${activeTab === 'projects' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">2. Live Projects Tracker</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Track all active company projects</div>
        </div>
      </button>

      <button data-nav="completed-projects" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${activeTab === 'completed-projects' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">🏆</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">3. Completed Projects</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Delivered systems, repos &amp; sign-offs</div>
        </div>
      </button>

      <button data-nav="sales-done" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${activeTab === 'sales-done' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">4. Sales Done</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Closed client deals &amp; revenue</div>
        </div>
      </button>

      <button data-nav="employee-dashboard" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${activeTab === 'employee-dashboard' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">👥</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">5. Employee Work Tracker</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Track all employee tasks &amp; deliverables</div>
        </div>
      </button>

      <!-- Section: Financial Controls -->
      <div class="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#fffde8]/60 flex items-center gap-1.5 border-t border-[#024d39]/80 mt-1">
        <span>💼</span> Financial Controls
      </div>

      <button data-nav="financial-summary" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${activeTab === 'financial-summary' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">6. Financial Summary</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Monthly Performance &amp; P&L</div>
        </div>
      </button>
    `;
  } else if (currentRole === 'arshad') {
    // Arshad: Co-Founder & CTO (approvals, commercial operations, project assignments)
    nav.innerHTML = `
      <!-- Section: Executive Hub -->
      <div class="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#fffde8]/60 flex items-center gap-1.5">
        <span>🤝</span> Co-Founder &amp; CTO Hub
      </div>

      <button data-nav="dashboard-overview" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${activeTab === 'dashboard-overview' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">1. Dashboard Overview</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Company Finances &amp; Solvency</div>
        </div>
      </button>

      <button data-nav="approvals" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${activeTab === 'approvals' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">👑</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold flex items-center justify-between">
            <span>2. Approval Queue</span>
            <span class="px-1.5 py-0.5 rounded-full text-[9px] font-black ${totalPendingApprovals > 0 ? 'bg-amber-400 text-slate-900 animate-pulse' : 'bg-white/20 text-white'}">${totalPendingApprovals}</span>
          </div>
          <div class="text-[9px] opacity-75 truncate font-normal">Leads, Inflows &amp; Tech Clearances</div>
        </div>
      </button>

      <button data-nav="employee-dashboard" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${activeTab === 'employee-dashboard' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">💼</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">3. Commercial &amp; CTO Workspace</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Departmental Scope &amp; Deliverables</div>
        </div>
      </button>

      <button data-nav="assign-projects" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${activeTab === 'assign-projects' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">📌</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">4. Assign Projects / Delegate</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Delegate work to Vivek &amp; Aryan</div>
        </div>
      </button>

      <!-- Section: Products & Sales Execution -->
      <div class="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#fffde8]/60 flex items-center gap-1.5 border-t border-[#024d39]/80 mt-1">
        <span>🚀</span> Commercial &amp; Project Delivery
      </div>

      <button data-nav="projects" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${activeTab === 'projects' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">5. Live Projects Tracker</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Products, Scopes &amp; Live Financials</div>
        </div>
      </button>

      <button data-nav="completed-projects" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${activeTab === 'completed-projects' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">🏆</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">6. Completed Projects</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Delivered client solutions</div>
        </div>
      </button>

      <button data-nav="sales-done" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${activeTab === 'sales-done' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">7. Sales Done</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Closed client deals &amp; sales</div>
        </div>
      </button>

      <button data-nav="expense-management" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${activeTab === 'expense-management' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">8. Expense Management</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Approvals &amp; Cost Control</div>
        </div>
      </button>

      <button data-nav="financial-summary" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${activeTab === 'financial-summary' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">9. Financial Summary</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Monthly Performance &amp; P&L</div>
        </div>
      </button>
    `;
  } else if (currentRole === 'aryan') {
    // Aryan: Research Lead (Pipeline, Intake, Intel)
    nav.innerHTML = `
      <!-- Section: Research & Intelligence -->
      <div class="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#fffde8]/60 flex items-center gap-1.5">
        <span>🎯</span> Research Department
      </div>

      <button data-nav="employee-dashboard" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${activeTab === 'employee-dashboard' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">🎯</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-black">1. Workspace &amp; Market Intel</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Scouting Pipeline &amp; Client Deals</div>
        </div>
      </button>

      <button data-nav="allocated-work" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${activeTab === 'allocated-work' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">📌</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-black flex items-center justify-between">
            <span>2. Lead Pipeline &amp; Intake</span>
            <span class="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white/20 text-white">${aryanAllocatedCount}</span>
          </div>
          <div class="text-[9px] opacity-75 truncate font-normal">Active Leads Scouted</div>
        </div>
      </button>

      <button data-nav="sales-done" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${activeTab === 'sales-done' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">💼</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">3. Executed Deals &amp; Sales</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Closed Client Deals</div>
        </div>
      </button>

      <!-- Section: Products & Scout Expenses -->
      <div class="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#fffde8]/60 flex items-center gap-1.5 border-t border-[#024d39]/80 mt-1">
        <span>📁</span> Products &amp; Scout Expenses
      </div>

      <button data-nav="projects" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${activeTab === 'projects' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">📁</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">4. Client Solutions</div>
          <div class="text-[9px] opacity-75 truncate font-normal">LeadX &amp; Smart Review Scopes</div>
        </div>
      </button>

      <button data-nav="expense-management" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${activeTab === 'expense-management' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">💳</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">5. Scout Expenses</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Outreach &amp; Prospecting Costs</div>
        </div>
      </button>
    `;
  } else {
    // Vivek: Engineering Workspace with Allocated Work
    nav.innerHTML = `
      <!-- Section: Engineering & Systems -->
      <div class="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#fffde8]/60 flex items-center gap-1.5">
        <span>💻</span> Technical Department
      </div>

      <button data-nav="employee-dashboard" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${activeTab === 'employee-dashboard' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">💻</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-black">1. Workspace &amp; Deliverables</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Architecture &amp; Tech Deliverables</div>
        </div>
      </button>

      <button data-nav="allocated-work" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${activeTab === 'allocated-work' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">📌</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-black flex items-center justify-between">
            <span>2. Allocated Tasks &amp; Repo</span>
            <span class="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white/20 text-white">${myAssignedTasksCount}</span>
          </div>
          <div class="text-[9px] opacity-75 truncate font-normal">Assigned Technical Tasks</div>
        </div>
      </button>

      <!-- Section: Tech & Infrastructure -->
      <div class="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#fffde8]/60 flex items-center gap-1.5 border-t border-[#024d39]/80 mt-1">
        <span>🛠️</span> Tech &amp; Infrastructure
      </div>

      <button data-nav="projects" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${activeTab === 'projects' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">📁</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">3. Live Projects Tracker</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Architecture &amp; Systems Stack</div>
        </div>
      </button>

      <button data-nav="expense-management" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${activeTab === 'expense-management' ? 'bg-[#fffde8] text-[#026047] font-bold shadow-sm' : 'text-[#fffde8] opacity-80 hover:opacity-100 hover:bg-[#024d39]'} transition-all text-left">
        <span class="text-sm">💳</span>
        <div class="flex-1 min-w-0">
          <div class="truncate font-bold">4. Infrastructure Expenses</div>
          <div class="text-[9px] opacity-75 truncate font-normal">Cloud, Server &amp; Tooling Costs</div>
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

  if (tabId === 'my-profile' || tabId === 'profile') {
    tabId = 'my-profile';
  } else if (tabId === 'employee-dashboard' || tabId === 'workspace') {
    tabId = 'employee-dashboard';
  }

  if (tabId === 'project-finance') {
    STATE.projectSubView = 'finance';
    tabId = 'projects';
  } else if (tabId === 'projects' && subView) {
    STATE.projectSubView = subView;
  }
  let normalized = normalizeTabId(tabId);

  // Security Gate: Non-executive users cannot access executive financial tabs
  if (
    STATE.activeRole !== 'pranav' &&
    STATE.activeRole !== 'arshad' &&
    (normalized === 'dashboard-overview' ||
      normalized === 'founder-dashboard' ||
      normalized === 'approvals' ||
      normalized === 'assign-projects' ||
      normalized === 'project-finance' ||
      normalized === 'financial-summary')
  ) {
    showToast('Confidential Section: Executive controls are reserved for Leadership.');
    normalized = 'employee-dashboard';
  }

  // Founder has tracking role and does not have allocated-work or approval queue
  if (STATE.activeRole === 'pranav' && (normalized === 'allocated-work' || normalized === 'approvals')) {
    normalized = 'dashboard-overview';
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

window.toggleProfileDropdown = function () {
  const dd = document.getElementById('topbar-profile-dropdown');
  if (dd) dd.classList.toggle('hidden');
};

window.closeProfileDropdown = function () {
  const dd = document.getElementById('topbar-profile-dropdown');
  if (dd) dd.classList.add('hidden');
};

window.openMyProfileFromTop = function () {
  closeProfileDropdown();
  switchTab('my-profile');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

document.addEventListener('click', (e) => {
  const profileWrapper = document.getElementById('topbar-profile-wrapper');
  const profileDropdown = document.getElementById('topbar-profile-dropdown');
  if (profileWrapper && profileDropdown && !profileWrapper.contains(e.target)) {
    profileDropdown.classList.add('hidden');
  }
});

function updateRoleDisplay() {
  if (!STATE.activeRole) return;
  const nameEl = document.getElementById('founder-name');
  const avatarText = document.getElementById('founder-avatar-text');
  const crownBadge = document.getElementById('founder-crown-badge');
  const desigBadge = document.getElementById('founder-designation-badge');
  const authBox = document.getElementById('founder-authority-box');
  const currentRoleLabel = document.getElementById('current-role-label');
  const topbarPill = document.getElementById('topbar-founder-pill');

  // Topbar round profile avatar and dropdown synchronization
  const topAvatarCircle = document.getElementById('topbar-avatar-circle');
  const topProfileName = document.getElementById('topbar-profile-name');
  const topProfileRole = document.getElementById('topbar-profile-role-badge');
  const dropAvatar = document.getElementById('topbar-dropdown-avatar');
  const dropName = document.getElementById('topbar-dropdown-name');
  const dropRole = document.getElementById('topbar-dropdown-role');
  const dropEmpId = document.getElementById('topbar-dropdown-empid');

  const profileData = {
    pranav: { initials: 'PB', name: 'Pranav Bansode', role: 'Founder & Director', empId: 'PB-01', bg: 'bg-[#026047]' },
    arshad: { initials: 'AS', name: 'Arshad Shaikh', role: 'Co-Founder & CTO', empId: 'AS-02', bg: 'bg-blue-600' },
    aryan: { initials: 'AB', name: 'Aryan Bhore', role: 'Research Lead', empId: 'AB-04', bg: 'bg-emerald-600' },
    vivek: { initials: 'VG', name: 'Vivek Gajdhane', role: 'Technical Lead', empId: 'VG-03', bg: 'bg-purple-600' }
  };
  const activeProf = profileData[STATE.activeRole] || profileData.pranav;

  if (topAvatarCircle) {
    topAvatarCircle.textContent = activeProf.initials;
    topAvatarCircle.className = `w-8 h-8 rounded-full ${activeProf.bg} text-[#fffde8] flex items-center justify-center font-black text-xs shadow-xs`;
  }
  if (topProfileName) topProfileName.textContent = activeProf.name;
  if (topProfileRole) topProfileRole.textContent = activeProf.role;

  if (dropAvatar) {
    dropAvatar.textContent = activeProf.initials;
    dropAvatar.className = `w-11 h-11 rounded-full ${activeProf.bg} text-[#fffde8] flex items-center justify-center font-black text-base shadow-sm`;
  }
  if (dropName) dropName.textContent = activeProf.name;
  if (dropRole) dropRole.textContent = activeProf.role;
  if (dropEmpId) dropEmpId.textContent = `EMP ID: ${activeProf.empId}`;

  // Topbar quick action buttons
  const btnCsv = document.getElementById('btn-topbar-csv');
  const btnIncome = document.getElementById('btn-topbar-income');
  const btnExpense = document.getElementById('btn-topbar-expense');
  const btnSignOut = document.getElementById('btn-topbar-signout');

  if (STATE.activeRole === 'pranav') {
    if (btnSignOut) btnSignOut.classList.add('hidden');
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
      authBox.classList.remove('hidden');
      authBox.innerHTML = `
        <div class="flex items-center justify-between text-[#fffde8] font-bold">
          <span class="opacity-75 text-[9px] uppercase tracking-wider">Executive Tracking</span>
          <span class="flex items-center gap-1 text-[9px] text-emerald-300">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Sole Director
          </span>
        </div>
        <p class="text-[10px] text-[#fffde8]/80 leading-tight">
          High-Level Tracking • Solvency Reserves • Solvency Health
        </p>
      `;
    }
    if (currentRoleLabel) currentRoleLabel.innerHTML = '👑 Founder / Director';
    if (topbarPill) {
      topbarPill.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-[#026047] dark:bg-emerald-400 animate-pulse"></span>
        <span class="font-extrabold text-[#026047] dark:text-emerald-300">Pranav Bansode</span>
        <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">(Founder &amp; Director)</span>
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
    if (btnSignOut) btnSignOut.classList.add('hidden');
    if (nameEl) nameEl.textContent = 'Arshad Shaikh';
    if (avatarText) avatarText.textContent = 'AS';
    if (crownBadge) {
      crownBadge.textContent = '🤝';
      crownBadge.className = 'absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold shadow ring-1 ring-blue-300';
    }
    if (desigBadge) {
      desigBadge.innerHTML = 'CO-FOUNDER & CTO';
      desigBadge.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#fffde8]/20 text-[#fffde8] border border-[#fffde8]/40';
    }
    if (authBox) {
      authBox.classList.remove('hidden');
      authBox.innerHTML = `
        <div class="flex items-center justify-between text-[#fffde8] font-bold">
          <span class="opacity-75 text-[9px] uppercase tracking-wider">Executive Operations</span>
          <span class="text-[9px] text-blue-300">Approvals &amp; Commercial</span>
        </div>
        <p class="text-[10px] text-[#fffde8]/80 leading-tight">
          CTO Oversight • Lead Clearances • Deal Closures &amp; Sales
        </p>
      `;
    }
    if (currentRoleLabel) currentRoleLabel.innerHTML = '🤝 Co-Founder & CTO';
    if (topbarPill) {
      topbarPill.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        <span class="font-extrabold text-blue-700 dark:text-blue-300">Arshad Shaikh</span>
        <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">(Co-Founder &amp; CTO)</span>
      `;
    }
    if (btnCsv) btnCsv.classList.remove('hidden');
    if (btnIncome) {
      btnIncome.classList.remove('hidden');
      btnIncome.textContent = '+ Income';
      btnIncome.onclick = window.openNewIncomeModal;
    }
    if (btnExpense) btnExpense.classList.remove('hidden');

  } else if (STATE.activeRole === 'aryan') {
    if (btnSignOut) btnSignOut.classList.add('hidden');
    if (nameEl) nameEl.textContent = 'Research Lead - Aryan Bhore';
    if (avatarText) avatarText.textContent = 'AB';
    if (crownBadge) {
      crownBadge.textContent = '🎯';
      crownBadge.className = 'absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shadow ring-1 ring-emerald-300';
    }
    if (desigBadge) {
      desigBadge.innerHTML = '';
      desigBadge.className = 'hidden';
    }
    if (authBox) {
      authBox.innerHTML = '';
      authBox.className = 'hidden';
    }
    if (currentRoleLabel) currentRoleLabel.innerHTML = '🎯 Research Lead';
    if (topbarPill) {
      topbarPill.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="font-extrabold text-emerald-700 dark:text-emerald-300">Aryan Bhore</span>
        <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">(Research Lead)</span>
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
    if (btnSignOut) btnSignOut.classList.add('hidden');
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
      authBox.classList.remove('hidden');
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
        <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">(Technical Dept)</span>
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
      setUserDateFilter(STATE.activeRole, e.target.value);
      renderCurrentTab();
      const userName = (MEMBER_CREDENTIALS[STATE.activeRole] && MEMBER_CREDENTIALS[STATE.activeRole].name) ? MEMBER_CREDENTIALS[STATE.activeRole].name : (STATE.activeRole || 'User');
      showToast(`Filter applied for ${userName}: ${e.target.options[e.target.selectedIndex].text}`);
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
  if (tabId === 'completed-projects' || tabId === 'completed') return 'completed-projects';
  if (tabId === 'my-profile' || tabId === 'profile' || tabId === 'documents') {
    return 'my-profile';
  }
  if (tabId === 'team' || tabId === 'profit-sharing' || tabId === 'employee-dashboard' || tabId === 'workspace')
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
    case 'my-profile':
      renderMyProfileTab();
      break;
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
    case 'completed-projects':
      renderCompletedProjects();
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

  // 1. Apply user's personal isolated color theme (never leak to other users)
  applyThemeForUser(role);

  // 2. Apply user's personal date filter
  STATE.dateFilter = getUserDateFilter(role);
  const dateFilterEl = document.getElementById('date-filter');
  if (dateFilterEl) dateFilterEl.value = STATE.dateFilter;

  updateRoleDisplay();
  updateLoginPills();

  if (role === 'arshad' || role === 'vivek' || role === 'aryan') {
    switchTab('employee-dashboard');
  } else {
    switchTab('dashboard-overview');
  }

  syncTasksFromSupabase();
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
    designation: 'Co-Founder & CTO',
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
    // 0. FAST IN-MEMORY VERIFICATION (Instant <1ms Sign-In for Official Members)
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

    if (matchedMember && matchedMember.validPasswords.includes(rawPass)) {
      if (errBox) errBox.classList.add('hidden');
      loginAsUser(matchedMember.role, false);
      recordAuditLog('USER_LOGIN', `Authenticated via credentials as ${matchedMember.name} (${matchedMember.memberCode})`, matchedMember.name);
      showToast(`Welcome, ${matchedMember.name}! Signed in successfully.`);
      return;
    }

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
          return;
        }
      }
    } catch (sbErr) {
      console.warn('[Phoenix Auth] Supabase Auth check skipped:', sbErr.message);
    }

    // 3. FINAL VERIFICATION / ERROR REPORTING
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

  // Ensure topbar profile dropdown is closed
  const dd = document.getElementById('topbar-profile-dropdown');
  if (dd) dd.classList.add('hidden');

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
    'modal-allocate-reserve',
    'modal-user-portfolio-settings',
    'modal-offer-letter',
    'modal-salary-slip',
    'modal-company-policies',
    'modal-paper-document'
  ].forEach((mId) => {
    const m = document.getElementById(mId);
    if (m) m.classList.add('hidden');
  });

  // Revert to neutral light theme so the login portal is completely clean
  document.documentElement.classList.remove('dark');
  STATE.theme = 'light';

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

  showToast('You have been signed out successfully.');
};

window.handleLogout = function () {
  const dd = document.getElementById('topbar-profile-dropdown');
  if (dd) dd.classList.add('hidden');
  window.logoutUser();
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
  if (topbarName) {
    if (current === 'pranav') {
      topbarName.textContent = 'Pranav Bansode';
      if (topbarBadge) {
        topbarBadge.textContent = '👑 Founder / Director';
        topbarBadge.classList.remove('hidden');
      }
    } else if (current === 'arshad') {
      topbarName.textContent = 'Arshad Shaikh';
      if (topbarBadge) {
        topbarBadge.textContent = '🤝 Co-Founder';
        topbarBadge.classList.remove('hidden');
      }
    } else if (current === 'vivek') {
      topbarName.textContent = 'Vivek Gajdhane';
      if (topbarBadge) {
        topbarBadge.textContent = '💻 Technical Dept';
        topbarBadge.classList.remove('hidden');
      }
    } else if (current === 'aryan') {
      topbarName.textContent = 'Research Lead - Aryan Bhore';
      if (topbarBadge) {
        topbarBadge.textContent = '';
        topbarBadge.classList.add('hidden');
      }
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

function renderFounderEmployeeWorkTracker() {
  const tasks = STATE.assignedTasks || [];
  const leads = STATE.leads || [];

  const members = [
    {
      id: 'mem-04',
      name: 'Aryan Bhore',
      role: 'aryan',
      designation: 'Research Lead',
      avatar: 'AB',
      currentFocus: 'Scouting new enterprise leads, client discovery, and intake requirements.',
      activeTasks: tasks.filter((t) => t.assignedTo === 'mem-04' && t.status !== 'completed'),
      activeLeads: leads.filter((l) => (l.submittedByMemberId === 'mem-04' || (l.submittedBy || '').toLowerCase().includes('aryan')) && l.status !== 'published_to_market' && l.status !== 'rejected')
    },
    {
      id: 'mem-03',
      name: 'Vivek Gajdhane',
      role: 'vivek',
      designation: 'Technical Department Lead',
      avatar: 'VG',
      currentFocus: 'Full-stack engineering, GodownPro warehouse inventory engine & client technical deliverables.',
      activeTasks: tasks.filter((t) => (t.assignedTo === 'mem-03' || !t.assignedTo) && t.status !== 'completed'),
      activeLeads: leads.filter((l) => l.status === 'allocated_to_vivek' || l.status === 'tech_in_progress')
    },
    {
      id: 'mem-02',
      name: 'Arshad Shaikh',
      role: 'arshad',
      designation: 'Co-Founder & CTO',
      avatar: 'AS',
      currentFocus: 'Technical Quality Check (Final QC) sign-offs, commercial deals, and sales execution.',
      activeTasks: tasks.filter((t) => t.assignedTo === 'mem-02' && t.status !== 'completed'),
      activeLeads: leads.filter((l) => l.status === 'forwarded_to_arshad' || l.status === 'forwarded_to_arshad_qc' || l.status === 'commercial_in_progress' || l.status === 'awaiting_founder_market_approval' || l.status === 'awaiting_founder_delivery')
    }
  ];

  return `
    <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-base">📡</span>
            <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Real-Time Employee Work &amp; Current Task Tracker
            </h3>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Live departmental tracker showing exactly what each employee is currently working on.
          </p>
        </div>
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#026047] dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider self-start sm:self-auto">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Activity Feed
        </span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        ${members.map((m) => {
          const hasWork = m.activeTasks.length > 0 || m.activeLeads.length > 0;
          return `
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between">
              <div class="space-y-2.5">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-xl bg-[#026047] text-[#fffde8] font-black text-xs flex items-center justify-center shrink-0">
                      ${escapeHtml(m.avatar)}
                    </div>
                    <div>
                      <h4 class="text-xs font-black text-slate-900 dark:text-white leading-tight">${escapeHtml(m.name)}</h4>
                      <span class="text-[10px] text-slate-500 block">${escapeHtml(m.designation)}</span>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[9px] font-bold ${hasWork ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}">
                    ${hasWork ? 'Active On Tasks' : 'Available'}
                  </span>
                </div>

                <!-- Current Operational Task / Focus -->
                <div class="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <span class="text-[9px] text-slate-400 uppercase font-bold block mb-1">Current Active Focus:</span>
                  <p class="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    ${escapeHtml(m.currentFocus)}
                  </p>
                </div>

                <!-- Live Assigned Tasks & Deliverables -->
                <div class="space-y-1.5">
                  <span class="text-[9px] text-slate-400 uppercase font-bold block">Assigned Work in Progress (${m.activeTasks.length + m.activeLeads.length}):</span>
                  ${m.activeTasks.length === 0 && m.activeLeads.length === 0
                    ? `<div class="text-[11px] text-slate-400 italic py-1">No active assigned tickets; executing core departmental responsibilities.</div>`
                    : `
                      <div class="space-y-1.5 max-h-40 overflow-y-auto">
                        ${m.activeTasks.slice(0, 3).map((t) => `
                          <div class="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px]">
                            <div class="font-bold text-slate-800 dark:text-slate-200 truncate">${escapeHtml(t.title)}</div>
                            <div class="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                              <span class="font-mono text-emerald-600 dark:text-emerald-400">${escapeHtml(t.projectName || 'Initiative')}</span>
                              <span class="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold uppercase text-[9px]">${escapeHtml(t.status)}</span>
                            </div>
                          </div>
                        `).join('')}
                        ${m.activeLeads.slice(0, 2).map((l) => `
                          <div class="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px]">
                            <div class="font-bold text-slate-800 dark:text-slate-200 truncate">Lead: ${escapeHtml(l.clientName)}</div>
                            <div class="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                              <span>${escapeHtml(l.productType || 'Custom Solution')}</span>
                              <span class="font-black text-[#026047] dark:text-emerald-400">${formatINR(l.dealValue)}</span>
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    `
                  }
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

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
      <!-- Founder Executive Header Banner -->
      <div class="p-6 rounded-2xl bg-gradient-to-br from-[#026047] to-[#013829] text-[#fffde8] shadow-lg relative overflow-hidden space-y-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-[#fffde8] text-[#026047] flex items-center justify-center font-black text-2xl shadow-inner relative">
              PB
              <span class="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center text-xs font-black shadow ring-2 ring-[#026047]">👑</span>
            </div>
            <div>
              <h2 class="text-xl font-black text-[#fffde8]">${escapeHtml(pranav.name)}</h2>
              <p class="text-xs text-[#fffde8]/80 mt-0.5">Founder &amp; Sole Executive Director &bull; Phoenix Tech Solutions Private Limited</p>
            </div>
          </div>
          <div class="flex flex-col sm:items-end gap-2">
            <div class="p-3 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-xs sm:text-right">
              <span class="text-[10px] text-[#fffde8]/70 block uppercase font-bold">Remuneration Model</span>
              <div class="font-extrabold text-sm text-[#fffde8] mt-0.5">Retained Equity &amp; Executive Drawings</div>
              <div class="text-[11px] text-emerald-300 mt-1">Non-Salaried &bull; 100% Director Governance</div>
            </div>
          </div>
        </div>
        ${(() => {
          const fp = getUserProfile('pranav');
          if (fp.bio || fp.notes) {
            return `
            <div class="p-3 rounded-xl bg-white/10 border border-white/20 text-xs space-y-1">
              ${fp.bio ? `<div><span class="opacity-75">Executive Focus:</span> <strong class="text-white">${escapeHtml(fp.bio)}</strong></div>` : ''}
              ${fp.notes ? `<div class="text-[11px] opacity-80 italic"><span class="font-bold not-italic opacity-100">Private Reminders:</span> ${escapeHtml(fp.notes)}</div>` : ''}
            </div>`;
          }
          return '';
        })()}
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

      <!-- Real-Time Employee Active Work Tracker -->
      ${renderFounderEmployeeWorkTracker()}

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
      <!-- Employee Profile Banner -->
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-2xl bg-[#026047] text-[#fffde8] flex items-center justify-center font-black text-2xl shadow-sm">
                ${initials}
              </div>
              <div>
                <h2 class="text-xl font-black text-slate-900 dark:text-white">${escapeHtml(mem.name)}</h2>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${escapeHtml(mem.designation)} &bull; Phoenix Tech Solutions Private Limited</p>
              </div>
            </div>
          </div>
        ${(() => {
          const up = getUserProfile(activeUser);
          if (up.bio || up.notes) {
            return `
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              ${up.bio ? `<div class="font-bold text-slate-800 dark:text-slate-200"><span class="text-slate-400 font-normal">Personal Focus:</span> ${escapeHtml(up.bio)}</div>` : ''}
              ${up.notes ? `<div class="text-[11px] text-slate-600 dark:text-slate-400 italic"><span class="font-bold not-italic text-slate-500">Private Notes:</span> ${escapeHtml(up.notes)}</div>` : ''}
            </div>`;
          }
          return '';
        })()}
      </div>

      ${
        isAryan
          ? (() => {
              const activeLeadDeals = (STATE.leads || []).filter((l) => l.status !== 'rejected');
              const totalLeadPricing = activeLeadDeals.reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0);
              const totalTasksAssigned = (STATE.assignedTasks || []).length;
              const inProgressTasks = (STATE.assignedTasks || []).filter((t) => t.status !== 'completed').length;
              const realTimeClosedVal = (STATE.income || [])
                .filter((i) => i.status === 'received' && matchesDateFilter(i.paymentDate))
                .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

              return `
      <!-- Aryan Deal & Lead Pipeline Metrics (Real-Time Live Calculation) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-400 font-medium">Active Deals &amp; Assigned Tasks</span>
            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-[#026047] dark:bg-emerald-950 dark:text-emerald-300">
              Connected
            </span>
          </div>
          <div class="text-xl font-bold text-slate-900 dark:text-white">
            ${activeLeadDeals.length} Active Deals <span class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">(${totalTasksAssigned} Tasks Assigned)</span>
          </div>
          <div class="text-[11px] text-slate-500 pt-1">${totalTasksAssigned} total assigned tasks connected to ${activeLeadDeals.length} active client deals</div>
        </div>

        <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-400 font-medium">Pipeline Deal Value</span>
            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-[#026047] dark:bg-emerald-950 dark:text-emerald-300 animate-pulse">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live Real-Time
            </span>
          </div>
          <div class="text-xl font-bold text-[#026047] dark:text-emerald-400">
            ${formatINR(totalLeadPricing)}
          </div>
          <div class="text-[11px] text-slate-500 pt-1">Real-time aggregate valuation of all lead pricing (${activeLeadDeals.length} active leads)</div>
        </div>

        <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-xs text-slate-400 font-medium">Delivered / Received Inflow</span>
          <div class="text-xl font-black text-[#026047] dark:text-emerald-400">
            ${formatINR(realTimeClosedVal)}
          </div>
          <div class="text-[11px] text-slate-500 pt-1">Reconciled company revenue from closed deals</div>
        </div>
      </div>`;
            })()
          : (() => {
              const myTasks = (STATE.assignedTasks || []).filter((t) => t.assignedTo === currentMemberId);
              const inProgressTasks = myTasks.filter((t) => t.status === 'in_progress').length;
              const completedTasks = myTasks.filter((t) => t.status === 'completed').length;

              return `
      <!-- Department Operational Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-400 font-medium">${isArshad ? 'Commercial Scopes &amp; Tasks' : 'Technical Tasks &amp; Scopes'}</span>
            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${badgeColorClass}">
              Active
            </span>
          </div>
          <div class="text-xl font-bold text-slate-900 dark:text-white">
            ${myTasks.length} Assigned Deliverables
          </div>
          <div class="text-[11px] text-slate-500 pt-1">Departmental tasks allocated by Founder Pranav</div>
        </div>

        <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-400 font-medium">In-Progress Execution</span>
            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              In Delivery
            </span>
          </div>
          <div class="text-xl font-bold text-amber-600 dark:text-amber-400">
            ${inProgressTasks} In Development
          </div>
          <div class="text-[11px] text-slate-500 pt-1">Active workflows currently in execution</div>
        </div>

        <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-xs text-slate-400 font-medium">Completed &amp; Published Deals</span>
          <div class="text-xl font-black text-[#026047] dark:text-emerald-400">
            ${completedTasks} Cleared
          </div>
          <div class="text-[11px] text-slate-500 pt-1">Milestones verified and approved by Founder</div>
        </div>
      </div>`;
            })()
      }

      ${
        isAryan
          ? (() => {
              const aryanLeads = (STATE.leads || []).filter(
                (l) => l.submittedByMemberId === 'mem-04' || (l.submittedBy || '').toLowerCase().includes('aryan')
              );
              const aryanLeadIds = new Set(aryanLeads.map((l) => l.id));
              const linkedTasks = (STATE.assignedTasks || []).filter(
                (t) =>
                  (t.leadId && aryanLeadIds.has(t.leadId)) ||
                  (t.description || '').toLowerCase().includes("aryan's lead")
              );
              const allocatedCount = aryanLeads.filter(
                (l) => l.allocatedTo || l.status === 'allocated_to_vivek' || l.status === 'sent_to_arshad_notified_founder'
              ).length;
              const inProgressCount = aryanLeads.filter(
                (l) => l.status === 'allocated_to_vivek' || l.status === 'sent_to_arshad_notified_founder'
              ).length;
              const deliveredCount = aryanLeads.filter((l) => l.status === 'approved_for_delivery').length;

              return `
      <!-- Allocated Work & Created Leads Section in Aryan's Profile -->
      <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-black bg-[#026047] text-[#fffde8] uppercase tracking-wider">Allocated Work</span>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">Work Allocated to Others &amp; Created Leads</h3>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Client leads created by Aryan Bhore and technical / execution work allocated across the team.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="openNewLeadModal()" class="px-3 py-1.5 rounded-lg bg-[#026047] hover:bg-[#024d39] text-[#fffde8] font-bold text-xs transition flex items-center gap-1.5 shadow-sm">
              <span>+</span> Submit New Lead
            </button>
            <button onclick="switchTab('allocated-work')" class="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition">
              Full View &rarr;
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <span class="text-[10px] text-slate-400 uppercase font-bold block">Leads Created</span>
            <span class="text-lg font-black text-slate-900 dark:text-white">${aryanLeads.length}</span>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <span class="text-[10px] text-slate-400 uppercase font-bold block">Allocated to Tech</span>
            <span class="text-lg font-black text-blue-600 dark:text-blue-400">${allocatedCount}</span>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <span class="text-[10px] text-slate-400 uppercase font-bold block">In Progress</span>
            <span class="text-lg font-black text-amber-600 dark:text-amber-400">${inProgressCount}</span>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <span class="text-[10px] text-slate-400 uppercase font-bold block">Delivered &amp; Done</span>
            <span class="text-lg font-black text-[#026047] dark:text-emerald-400">${deliveredCount}</span>
          </div>
        </div>

        <div class="space-y-3">
          ${
            aryanLeads.length === 0
              ? '<div class="p-8 text-center text-slate-400 italic">No client leads created yet. Click "+ Submit New Lead" to record prospective deals.</div>'
              : aryanLeads
                  .map((lead) => {
                    let stageBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Submitted to Founder</span>';
                    if (lead.status === 'allocated_to_vivek') {
                      stageBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Allocated to Technical Dept</span>';
                    } else if (lead.status === 'sent_to_arshad_notified_founder' || lead.status === 'forwarded_to_arshad') {
                      stageBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Tech Done • Commercial Dept Check</span>';
                    } else if (lead.status === 'approved_for_delivery' || lead.status === 'published_to_market') {
                      stageBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">✓ Published in Market</span>';
                    }

                    return `
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">${escapeHtml(lead.leadNumber)}</span>
                  ${stageBadge}
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fffde8] text-[#026047] border border-[#026047]/30">${escapeHtml(lead.productType)}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="font-black text-sm text-[#026047] dark:text-emerald-400">${formatINR(lead.dealValue)}</span>
                  <button onclick="openEditPricingModal('${lead.id}')" class="px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-300 transition flex items-center gap-1 shadow-xs" title="Edit Lead Pricing">
                    <span>✏️</span> Edit Price
                  </button>
                  <button onclick="deleteLead('${lead.id}')" class="px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 hover:border-rose-500 text-rose-600 dark:text-rose-400 transition flex items-center gap-1 shadow-xs" title="Delete Lead from Portal & Database">
                    <span>🗑️</span> Delete
                  </button>
                </div>
              </div>

              <div>
                <h4 class="font-bold text-sm text-slate-900 dark:text-white">${escapeHtml(lead.clientName)}</h4>
                <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Contact: <span class="text-slate-700 dark:text-slate-300 font-medium">${escapeHtml(lead.contactPerson || 'Direct')}</span>
                  ${lead.phone ? ` • <span class="font-mono">${escapeHtml(lead.phone)}</span>` : ''}
                  ${lead.email ? ` • <span class="font-mono">${escapeHtml(lead.email)}</span>` : ''}
                </div>
              </div>

              <div class="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
                <div class="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-1">
                  <span><strong>Work Allocation:</strong> ${lead.allocatedToName ? `<span class="font-bold text-blue-600 dark:text-blue-400">💻 ${escapeHtml(formatDepartmentAllocation(lead.allocatedToName))}</span>` : '<span class="text-slate-400">Awaiting Founder Technical Allocation</span>'}</span>
                  <span>${lead.dueDate ? `Target Due: <strong class="text-slate-700 dark:text-slate-300">${formatDate(lead.dueDate)}</strong>` : `Created: ${formatDate(lead.submittedAt)}`}</span>
                </div>
                <div class="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  <span class="font-bold text-slate-500 dark:text-slate-400">Scope:</span> ${escapeHtml(lead.requirements)}
                </div>
                ${lead.founderInstructions ? `
                <div class="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span class="font-bold text-[#026047] dark:text-emerald-400">Founder Allocation Scope:</span> ${escapeHtml(lead.founderInstructions)}
                </div>` : ''}
                ${lead.deliverableUrl ? `
                <div class="text-[11px] pt-1">
                  <a href="${escapeHtml(lead.deliverableUrl)}" target="_blank" class="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline">
                    <span>🔗</span> View Technical Deliverable / PR
                  </a>
                </div>` : ''}
              </div>
            </div>
            `;
                  })
                  .join('')
          }
        </div>
      </div>
      `;
            })()
          : `
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
                  : 'AWS cluster infrastructure, scraper algorithms, pipeline architecture, database indexing & dashboard UI.'}
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
                  : 'Sentiment analysis NLP model integration, feedback capture portals, QR routing engine & API webhooks.'}
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
      </div>`
      }
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
  ['ALL', 'INCOME', 'EXPENSE', 'PAYOUT', 'TASK', 'LEAD'].forEach((cat) => {
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
    // If task is linked to a lead that is in technical progress or forwarded to Commercial (Arshad), do NOT list in Founder approvals
    const linkedLead = task.leadId ? (STATE.leads || []).find((l) => l.id === task.leadId) : null;
    if (linkedLead && (linkedLead.status === 'forwarded_to_arshad' || linkedLead.status === 'commercial_in_progress' || linkedLead.status === 'allocated_to_vivek' || linkedLead.status === 'tech_in_progress')) {
      return;
    }
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

  // 5. Client Deals Awaiting Market Approval & Publication Clearance (Only after Commercial packaging is submitted)
  (STATE.leads || []).forEach((lead) => {
    if (lead.status === 'awaiting_founder_market_approval') {
      pendingItems.push({
        type: 'MARKET_PUBLISH',
        rawType: 'lead_market',
        id: lead.id,
        title: lead.clientName,
        purpose: `Market Publication Clearance • ${lead.productType || 'LeadX'} (Price: ${formatINR(lead.dealValue)})`,
        submittedBy: 'Arshad Shaikh (Commercial Packaging)',
        project: lead.productType || 'LeadX Platform',
        amount: Number(lead.dealValue) || 0,
        scopeDisplay: formatINR(lead.dealValue),
        date: lead.commercialCompletedAt ? lead.commercialCompletedAt.split('T')[0] : (lead.submittedAt ? lead.submittedAt.split('T')[0] : ''),
        statusLabel: 'Awaiting Market Sign-off',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
      });
    } else if (lead.status === 'submitted_to_founder' || lead.status === 'submitted_to_arshad') {
      pendingItems.push({
        type: 'LEAD',
        rawType: 'lead',
        id: lead.id,
        title: lead.clientName,
        purpose: `Lead ${lead.leadNumber || ''} • ${lead.productType || 'LeadX Platform'} (Price: ${formatINR(lead.dealValue)})`,
        submittedBy: lead.submittedBy || 'Aryan Bhore',
        project: lead.productType || 'LeadX Platform',
        amount: Number(lead.dealValue) || 0,
        scopeDisplay: formatINR(lead.dealValue),
        date: lead.submittedAt ? lead.submittedAt.split('T')[0] : (lead.date || ''),
        statusLabel: 'Awaiting Arshad CTO Clearance',
        badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
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
    const pendingLeadCount = pendingItems.filter((i) => i.type === 'LEAD').length;
    const pendingLeadAmt = pendingItems
      .filter((i) => i.type === 'LEAD')
      .reduce((sum, i) => sum + i.amount, 0);

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
        <span class="text-[11px] text-slate-500 font-medium">Pending Client Leads</span>
        <div class="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">${pendingLeadCount} Leads</div>
        <div class="text-[10px] text-emerald-500 mt-1">${formatINR(pendingLeadAmt)} to allocate</div>
      </div>
      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[11px] text-slate-500 font-medium">Pending Work Deliverables</span>
        <div class="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">${pendingTaskCount} Tasks</div>
        <div class="text-[10px] text-purple-500 mt-1">Submitted by team members</div>
      </div>
    `;
  }

  // Unified pending approvals master clearance queue (category filters removed per founder requirement)
  const visibleItems = pendingItems;

  if (visibleItems.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="py-12 text-center text-slate-400 dark:text-slate-500">
          <div class="text-3xl mb-2">🎉</div>
          <div class="text-sm font-bold text-slate-700 dark:text-slate-300">No Pending Approvals</div>
          <p class="text-xs text-slate-400 mt-1">All company inflows, reimbursements, client leads and deliverable milestones are up to date and verified by Founder.</p>
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
            <button onclick="${item.rawType === 'lead_market' ? `openDeliveryApprovalModal('${itemId}')` : (item.rawType === 'lead' ? `openAllocateLeadModal('${itemId}')` : `approveApprovalItem('${rType}', '${itemId}')`)}"
              class="px-2.5 py-1 rounded-lg bg-[#026047] hover:bg-[#024d39] text-[#fffde8] font-bold text-[11px] transition inline-flex items-center gap-1 shadow-sm">
              <span>👑</span> ${item.rawType === 'lead_market' ? 'Publish in Market' : (item.rawType === 'lead' ? 'Allocate to Tech' : 'Approve')}
            </button>
            <button onclick="rejectApprovalItem('${rType}', '${itemId}')"
              class="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-[11px] transition inline-flex items-center"
              title="${item.rawType === 'task' ? 'Return to In Progress' : (item.rawType === 'lead' || item.rawType === 'lead_market' ? 'Reject Lead' : 'Reject Request')}">
              ${item.rawType === 'task' ? '↺ Return' : '✕ Reject'}
            </button>
            <button onclick="deleteApprovalItem('${rType}', '${itemId}')"
              class="px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-rose-950 font-bold text-[11px] transition inline-flex items-center gap-1"
              title="Permanently Delete from Portal &amp; Database">
              <span>🗑️</span> Delete
            </button>
          </div>
        </td>
      </tr>
    `;
      })
      .join('');
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

  if (type === 'lead_market') {
    openDeliveryApprovalModal(id);
    return;
  }

  if (type === 'lead') {
    openAllocateLeadModal(id);
    return;
  }

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
    syncIncomeToSupabase(item);
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
    syncExpenseToSupabase(item);
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
  } else if (type === 'lead' || type === 'lead_market') {
    const lead = (STATE.leads || []).find((l) => l.id === id);
    if (!lead) return;

    const defaultReason = 'Scope / commercial requirements do not meet criteria';
    const reasonPrompt = prompt(
      `Please provide a 1-line reason for declining lead "${lead.clientName}":\n(This will inform the team departments and be recorded in the historical archive)`,
      'Scope / commercial requirements do not meet criteria'
    );
    if (reasonPrompt === null) {
      // Founder pressed Cancel
      return;
    }
    const rejectionReason = (reasonPrompt || '').trim() || defaultReason;
    lead.rejectionReason = rejectionReason;
    lead.status = 'rejected';
    lead.stage = 'rejected';
    lead.rejectedAt = new Date().toISOString();
    lead.rejectedBy = 'Executive & Founder Oversight';
    saveLeadsToStorage();
    syncLeadToSupabase(lead);

    // Remove any linked assigned task so it is cleared from assigned tasks section
    const linkedTask = (STATE.assignedTasks || []).find((t) => t.leadId === lead.id);
    if (linkedTask) {
      STATE.assignedTasks = (STATE.assignedTasks || []).filter((t) => t.leadId !== lead.id);
      saveAssignedTasksToStorage();
      const sb = getSupabaseClient();
      if (sb && linkedTask.id) {
        sb.from('assigned_tasks').delete().eq('id', linkedTask.id).catch(() => {});
      }
    }

    recordAuditLog(
      'LEAD_REJECTED',
      `Founder declined lead "${lead.clientName}" (${formatINR(lead.dealValue)}) submitted by Research Department. Reason: ${rejectionReason}`,
      'Pranav Bansode (Founder / Director)'
    );
    saveAppStateToStorage();

    // Point 1: Notify Founder & Co-Founder + rest of portal users (actorRole: 'pranav' excludes Founder)
    createNotification({
      type: 'LEAD_REJECTED',
      title: `❌ Lead Declined: ${lead.clientName}`,
      message: `Founder declined lead (${lead.productType}). Reason: ${rejectionReason}`,
      targetRole: 'all',
      leadId: lead.id,
      actor: 'Founder & Director',
      actorRole: 'pranav'
    });

    showToast(`Lead "${lead.clientName}" declined. Reason recorded in historical archive.`);
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

  const departmentName = getDepartmentName(assignedTo);
  const prjObj = (STATE.projects || []).find((p) => p.id === project);
  const projectName = prjObj ? prjObj.name : 'General Operations';

  const newTask = {
    id: 'task-' + Date.now(),
    title,
    assignedTo,
    assignedToName: departmentName,
    department: departmentName,
    projectId: project,
    projectName,
    priority,
    dueDate,
    assignedDate: new Date().toISOString().split('T')[0],
    assignedBy: 'Executive & Founder Oversight',
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
    `Founder allocated deliverable "${title}" to ${departmentName} (${projectName})`,
    'Executive & Founder Oversight'
  );
  saveAssignedTasksToStorage();
  saveAppStateToStorage();

  createNotification({
    type: 'TASK_ASSIGNED',
    title: `📌 Task Allocated: ${title}`,
    message: `Founder allocated task "${title}" to ${departmentName}.`,
    targetRole: 'all',
    leadId: null,
    actor: 'Founder & Director',
    actorRole: 'pranav'
  });

  closeAssignTaskModal();
  const titleInput = document.getElementById('task-title');
  if (titleInput) titleInput.value = '';
  const descInput = document.getElementById('task-desc');
  if (descInput) descInput.value = '';

  renderAssignProjects();
  renderSidebarNav(STATE.currentTab);
  showToast(`Deliverable successfully allocated to ${departmentName}!`);
}
window.submitAssignTask = submitAssignTask;

function formatDepartmentAllocation(allocatedToName) {
  if (!allocatedToName) return 'Technical Dept';
  const str = String(allocatedToName).trim();
  const lower = str.toLowerCase();
  if (lower.includes('awaiting')) return str;
  if (lower.includes('vivek') || lower.includes('tech')) return 'Technical Dept';
  if (lower.includes('arshad') || lower.includes('commercial') || lower.includes('business')) return 'Commercial / Business Planning Dept';
  if (lower.includes('aryan') || lower.includes('research')) return 'Research Dept';
  return str;
}
window.formatDepartmentAllocation = formatDepartmentAllocation;

function isUuidString(str) {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

async function deleteAssignedTask(id) {
  if (!requireAuth('delete delegated tasks')) return;
  const task = (STATE.assignedTasks || []).find((t) => t.id === id);
  if (!confirm(`Are you sure you want to permanently delete task "${task ? task.title : id}"?\nIt will be permanently removed from the portal and database.`)) return;

  STATE.assignedTasks = (STATE.assignedTasks || []).filter((t) => t.id !== id);
  saveAssignedTasksToStorage();

  // Record tombstone to prevent resurrection
  try {
    const tombstones = JSON.parse(localStorage.getItem('phoenix_deleted_tasks') || '[]');
    tombstones.push(id);
    if (task && task.title) tombstones.push(task.title);
    localStorage.setItem('phoenix_deleted_tasks', JSON.stringify([...new Set(tombstones)]));
  } catch (_) {}

  // Delete from Supabase tables
  if (id && isUuidString(id)) {
    await deleteFromSupabase('assigned_tasks', 'id', id);
  }
  if (task && task.title) {
    await deleteFromSupabase('assigned_tasks', 'title', task.title);
    await deleteFromSupabaseLike('assigned_tasks', 'title', '%' + task.title + '%');
  }

  saveAppStateToStorage();
  const actor = MEMBER_NAME_MAP[getCurrentMemberId()] || (STATE.activeRole === 'pranav' ? 'Pranav Bansode (Founder)' : 'Authenticated User');
  recordAuditLog(
    'TASK_DELETED',
    `User permanently deleted task "${task ? task.title : id}".`,
    actor
  );
  renderAssignProjects();
  if (STATE.currentTab === 'allocated-work') renderAllocatedWork();
  if (STATE.currentTab === 'approvals') renderApprovals();
  renderSidebarNav(STATE.currentTab);
  showToast('Task permanently removed from portal and database.');
}
window.deleteAssignedTask = deleteAssignedTask;

window.deleteLead = async function (leadId) {
  if (!requireAuth('delete leads')) return;
  const lead = (STATE.leads || []).find((l) => l.id === leadId);
  if (!lead) return;

  if (!confirm(`Are you sure you want to permanently delete lead "${lead.clientName}"?\nIt will be permanently removed from the portal and database.`)) {
    return;
  }

  // 1. Remove from STATE.leads & store tombstones
  STATE.leads = (STATE.leads || []).filter((l) => l.id !== leadId);
  saveLeadsToStorage();

  try {
    const leadTombstones = JSON.parse(localStorage.getItem('phoenix_deleted_leads') || '[]');
    leadTombstones.push(leadId);
    if (lead.leadNumber) leadTombstones.push(lead.leadNumber);
    if (lead.clientName) leadTombstones.push(lead.clientName);
    localStorage.setItem('phoenix_deleted_leads', JSON.stringify([...new Set(leadTombstones)]));
  } catch (_) {}

  // 2. Remove any linked assigned task & tombstone them
  const linkedTasks = (STATE.assignedTasks || []).filter((t) => t.leadId === leadId || (lead.leadNumber && (t.description || '').includes(lead.leadNumber)));
  if (linkedTasks.length > 0) {
    STATE.assignedTasks = (STATE.assignedTasks || []).filter((t) => t.leadId !== leadId && (!lead.leadNumber || !(t.description || '').includes(lead.leadNumber)));
    saveAssignedTasksToStorage();

    try {
      const taskTombstones = JSON.parse(localStorage.getItem('phoenix_deleted_tasks') || '[]');
      linkedTasks.forEach((t) => {
        taskTombstones.push(t.id);
        if (t.title) taskTombstones.push(t.title);
      });
      localStorage.setItem('phoenix_deleted_tasks', JSON.stringify([...new Set(taskTombstones)]));
    } catch (_) {}

    for (const t of linkedTasks) {
      if (t.id && isUuidString(t.id)) await deleteFromSupabase('assigned_tasks', 'id', t.id);
      if (t.title) await deleteFromSupabase('assigned_tasks', 'title', t.title);
    }
  }

  // 3. Delete across all related Supabase tables
  await deleteFromSupabase('client_leads', 'id', leadId);
  if (lead.leadNumber) {
    await deleteFromSupabase('client_leads', 'lead_number', lead.leadNumber);
    await deleteFromSupabaseLike('assigned_tasks', 'description', '%' + lead.leadNumber + '%');
    await deleteFromSupabaseLike('audit_logs', 'details', '%' + lead.leadNumber + '%');
  }
  if (lead.clientName) {
    await deleteFromSupabase('client_leads', 'client_name', lead.clientName);
    await deleteFromSupabase('income_records', 'client_name', lead.clientName);
    await deleteFromSupabaseLike('assigned_tasks', 'title', '%' + lead.clientName + '%');
    await deleteFromSupabaseLike('audit_logs', 'details', '%' + lead.clientName + '%');
  }

  // 4. Remove linked notifications
  if (Array.isArray(STATE.notifications)) {
    STATE.notifications = STATE.notifications.filter((n) => n.leadId !== leadId);
    saveNotificationsToStorage();
    renderNotificationBell();
  }

  // 5. Audit log & UI refresh
  saveAppStateToStorage();
  const actor = MEMBER_NAME_MAP[getCurrentMemberId()] || (STATE.activeRole === 'pranav' ? 'Pranav Bansode (Founder)' : 'Authenticated User');
  recordAuditLog(
    'LEAD_DELETED',
    `User permanently deleted lead "${lead.clientName}" (${formatINR(lead.dealValue)}).`,
    actor
  );

  showToast(`🗑️ Lead "${lead.clientName}" permanently deleted from portal and database.`);
  renderCurrentTab();
  if (STATE.activeRole === 'aryan' || STATE.currentTab === 'employee-dashboard') renderEmployeeDashboard(getCurrentMemberId());
  if (STATE.currentTab === 'allocated-work') renderAllocatedWork();
  if (STATE.currentTab === 'approvals') renderApprovals();
  renderSidebarNav(STATE.currentTab);
};

window.deleteIncome = async function (id) {
  if (!requireAuth('delete income records')) return;
  const inc = (STATE.income || []).find((i) => i.id === id);
  if (!inc) return;

  if (!confirm(`Are you sure you want to permanently delete income record for "${inc.clientName || inc.source}" (${formatINR(inc.amount)})?\nIt will be permanently removed from the portal and database.`)) {
    return;
  }

  STATE.income = (STATE.income || []).filter((i) => i.id !== id);
  saveAppStateToStorage();

  try {
    const incTombstones = JSON.parse(localStorage.getItem('phoenix_deleted_income') || '[]');
    incTombstones.push(id);
    if (inc.invoiceNumber) incTombstones.push(inc.invoiceNumber);
    if (inc.clientName) incTombstones.push(inc.clientName);
    localStorage.setItem('phoenix_deleted_income', JSON.stringify([...new Set(incTombstones)]));
  } catch (_) {}

  if (id && isUuidString(id)) {
    await deleteFromSupabase('income_records', 'id', id);
  }
  if (inc.clientName) {
    await deleteFromSupabase('income_records', 'client_name', inc.clientName);
  }
  if (inc.invoiceNumber) {
    await deleteFromSupabase('income_records', 'invoice_no', inc.invoiceNumber);
  }

  const actor = MEMBER_NAME_MAP[getCurrentMemberId()] || (STATE.activeRole === 'pranav' ? 'Pranav Bansode (Founder)' : 'Authenticated User');
  recordAuditLog(
    'INCOME_DELETED',
    `User permanently deleted income entry of ${formatINR(inc.amount)} for ${inc.clientName || inc.source}.`,
    actor
  );

  showToast(`🗑️ Income record permanently removed from portal and database.`);
  renderDashboard();
  renderProjects();
  if (STATE.currentTab === 'sales-done') renderSalesDone();
  if (STATE.currentTab === 'approvals') renderApprovals();
  renderSidebarNav(STATE.currentTab);
};

window.deleteExpense = async function (id) {
  if (!requireAuth('delete expense records')) return;
  const exp = (STATE.expenses || []).find((e) => e.id === id);
  if (!exp) return;

  if (!confirm(`Are you sure you want to permanently delete expense "${exp.title}" (${formatINR(exp.amount)})?\nIt will be permanently removed from the portal and database.`)) {
    return;
  }

  STATE.expenses = (STATE.expenses || []).filter((e) => e.id !== id);
  saveAppStateToStorage();

  try {
    const expTombstones = JSON.parse(localStorage.getItem('phoenix_deleted_expenses') || '[]');
    expTombstones.push(id);
    if (exp.title) expTombstones.push(exp.title);
    localStorage.setItem('phoenix_deleted_expenses', JSON.stringify([...new Set(expTombstones)]));
  } catch (_) {}

  if (id && isUuidString(id)) {
    await deleteFromSupabase('expense_records', 'id', id);
  }
  if (exp.title) {
    await deleteFromSupabase('expense_records', 'title', exp.title);
  }

  const actor = MEMBER_NAME_MAP[getCurrentMemberId()] || (STATE.activeRole === 'pranav' ? 'Pranav Bansode (Founder)' : 'Authenticated User');
  recordAuditLog(
    'EXPENSE_DELETED',
    `User permanently deleted expense entry of ${formatINR(exp.amount)} for ${exp.title}.`,
    actor
  );

  showToast(`🗑️ Expense record permanently removed from portal and database.`);
  renderDashboard();
  renderExpenses();
  if (STATE.currentTab === 'approvals') renderApprovals();
  renderSidebarNav(STATE.currentTab);
};

window.deleteApprovalItem = function (type, id) {
  if (type === 'lead' || type === 'lead_market') {
    window.deleteLead(id);
  } else if (type === 'task') {
    deleteAssignedTask(id);
  } else if (type === 'income') {
    window.deleteIncome(id);
  } else if (type === 'expense') {
    window.deleteExpense(id);
  } else {
    window.deleteLead(id);
  }
};

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
  const isAryan = currentRole === 'aryan';
  const currentMemberId = getCurrentMemberId();
  const currentMember = (STATE.team || []).find((m) => m.id === currentMemberId) || {
    name: MEMBER_NAME_MAP[currentMemberId] || 'Team Member',
    designation: 'Team Department',
  };
  const displayRole =
    currentMember.designation ||
    currentMember.role ||
    (isAryan ? 'Research Lead' : 'Technical Department');

  // Header badges & titles
  const badgeEl = document.getElementById('allocated-work-badge');
  const titleEl = document.getElementById('allocated-work-title');
  const subtitleEl = document.getElementById('allocated-work-subtitle');

  if (isAryan) {
    if (badgeEl) badgeEl.textContent = 'Allocated Work';
    if (titleEl) titleEl.textContent = 'Work Allocated to Others & Created Leads';
    if (subtitleEl) subtitleEl.textContent = 'Client leads created by Aryan Bhore and technical / execution work allocated across the team.';
    if (sessionPill) {
      sessionPill.innerHTML = `
        <span>Allocated Work: </span>
        <strong class="text-slate-900 dark:text-white font-black">Aryan Bhore</strong>
        <span class="text-[10px] text-slate-500 ml-1">(Research Lead • Created Leads &amp; Work Allocated to Others)</span>
      `;
    }

    const allAryanLeads = (STATE.leads || []).filter(
      (l) => l.submittedByMemberId === 'mem-04' || (l.submittedBy || '').toLowerCase().includes('aryan')
    );
    // Point 1: If rejected by founder, vanished from Aryan's active lead box!
    const aryanLeads = allAryanLeads.filter((l) => l.status !== 'rejected');
    const aryanRejectedLeads = allAryanLeads.filter((l) => l.status === 'rejected');
    const aryanLeadIds = new Set(allAryanLeads.map((l) => l.id));
    const linkedTasks = (STATE.assignedTasks || []).filter(
      (t) =>
        (t.leadId && aryanLeadIds.has(t.leadId)) ||
        (t.assignedBy || '').toLowerCase().includes('aryan') ||
        (t.description || '').toLowerCase().includes("aryan's lead")
    );
    const myDirectTasks = (STATE.assignedTasks || []).filter((t) => t.assignedTo === 'mem-04');

    const totalLeadsCount = aryanLeads.length;
    const allocatedToOthersCount = aryanLeads.filter(
      (l) => l.allocatedTo || l.status === 'allocated_to_vivek' || l.status === 'sent_to_arshad_notified_founder'
    ).length;
    const inProgCount = aryanLeads.filter(
      (l) => l.status === 'allocated_to_vivek' || l.status === 'sent_to_arshad_notified_founder'
    ).length;
    const completedCount = allAryanLeads.filter((l) => l.status === 'published_to_market' || l.status === 'approved_for_delivery').length;

    if (metricsEl) {
      metricsEl.innerHTML = `
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span class="text-[11px] text-slate-500 font-medium">Active Leads</span>
          <div class="text-xl font-black text-slate-900 dark:text-white mt-1">${totalLeadsCount} Leads</div>
          <div class="text-[10px] text-slate-400 mt-1">In Pipeline (${aryanRejectedLeads.length} Declined in Archive)</div>
        </div>
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span class="text-[11px] text-slate-500 font-medium">Allocated to Tech</span>
          <div class="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">${allocatedToOthersCount} Allocated</div>
          <div class="text-[10px] text-blue-500 mt-1">Delegated to Vivek / Tech Dept</div>
        </div>
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span class="text-[11px] text-slate-500 font-medium">In Progress &amp; Review</span>
          <div class="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">${inProgCount} In Delivery</div>
          <div class="text-[10px] text-amber-500 mt-1">Under development / validation</div>
        </div>
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span class="text-[11px] text-slate-500 font-medium">Published Deals</span>
          <div class="text-xl font-black text-[#026047] dark:text-emerald-400 mt-1">${completedCount} Closed</div>
          <div class="text-[10px] text-emerald-600 mt-1">Market Launch Approved</div>
        </div>
      `;
    }

    if (aryanLeads.length === 0 && myDirectTasks.length === 0) {
      let emptyMsg = `
        <div class="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div class="text-3xl">🎯</div>
          <div class="text-sm font-bold text-slate-700 dark:text-slate-300">No Active Leads in Pipeline</div>
          <p class="text-xs text-slate-400 max-w-md mx-auto">Active leads scouted by Aryan will appear here. Declined leads are preserved in the historical archive below.</p>
          <div>
            <button onclick="openNewLeadModal()" class="px-4 py-2 rounded-xl bg-[#026047] hover:bg-[#024d39] text-[#fffde8] font-bold text-xs transition shadow-sm inline-flex items-center gap-1.5">
              <span>+</span> Submit First Lead
            </button>
          </div>
        </div>
      `;

      if (allAryanLeads.length > 0) {
        emptyMsg += `
          <div class="mt-6 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div class="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                <span>📋</span> Lead History &amp; Closed Logs (${allAryanLeads.length} Total Scouted)
              </div>
              <div class="text-[10px] text-slate-400 font-mono">
                ${aryanRejectedLeads.length} Declined &bull; ${completedCount} Published
              </div>
            </div>
            <div class="space-y-1.5">
              ${allAryanLeads.map((l) => {
                let histBadge = '<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">Under Review</span>';
                if (l.status === 'rejected') {
                  histBadge = '<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">Declined by Founder</span>';
                } else if (l.status === 'published_to_market' || l.status === 'approved_for_delivery') {
                  histBadge = '<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">✓ Published in Market</span>';
                }
                return `
                  <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs">
                    <div>
                      <span class="font-bold text-slate-900 dark:text-white">${escapeHtml(l.clientName)}</span>
                      <span class="text-[10px] text-slate-400 ml-1.5 font-mono">${escapeHtml(l.productType)} &bull; ${formatINR(l.dealValue)}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      ${histBadge}
                      <span class="text-[9px] text-slate-400 font-mono">${formatDate(l.submittedAt)}</span>
                      <button onclick="deleteLead('${l.id}')" class="p-1 text-slate-400 hover:text-rose-600 text-xs transition" title="Delete Lead Permanently">🗑️</button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }

      container.innerHTML = emptyMsg;
      return;
    }

    const cardsHtml = aryanLeads
      .map((lead) => {
        let stageBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Awaiting Founder Approval</span>';
        if (lead.status === 'allocated_to_vivek') {
          stageBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Allocated to Technical Dept</span>';
        } else if (lead.status === 'tech_in_progress') {
          stageBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 animate-pulse">Tech In Progress (Technical Dept)</span>';
        } else if (lead.status === 'forwarded_to_arshad' || lead.status === 'sent_to_arshad_notified_founder') {
          stageBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Forwarded to Commercial Dept</span>';
        } else if (lead.status === 'commercial_in_progress') {
          stageBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 animate-pulse">Commercial Packaging</span>';
        } else if (lead.status === 'awaiting_founder_market_approval') {
          stageBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse">Awaiting Market Clearance</span>';
        } else if (lead.status === 'published_to_market' || lead.status === 'approved_for_delivery') {
          stageBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">✓ Published in Market</span>';
        }

        return `
        <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">${escapeHtml(lead.leadNumber)}</span>
              ${stageBadge}
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fffde8] text-[#026047] border border-[#026047]/30">${escapeHtml(lead.productType)}</span>
              <span class="text-[11px] text-slate-400">Created: ${formatDate(lead.submittedAt)}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-black text-sm text-[#026047] dark:text-emerald-400">${formatINR(lead.dealValue)}</span>
              <button onclick="openEditPricingModal('${lead.id}')" class="px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-300 transition flex items-center gap-1 shadow-xs" title="Edit Lead Pricing">
                <span>✏️</span> Edit Price
              </button>
              <button onclick="deleteLead('${lead.id}')" class="px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 hover:border-rose-500 text-rose-600 dark:text-rose-400 transition flex items-center gap-1 shadow-xs" title="Delete Lead from Portal & Database">
                <span>🗑️</span> Delete
              </button>
            </div>
          </div>

          <div>
            <h4 class="font-bold text-sm text-slate-900 dark:text-white">${escapeHtml(lead.clientName)}</h4>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Contact Person: <span class="text-slate-700 dark:text-slate-300 font-medium">${escapeHtml(lead.contactPerson || 'Direct')}</span>
              ${lead.phone ? ` • <span class="font-mono">${escapeHtml(lead.phone)}</span>` : ''}
              ${lead.email ? ` • <span class="font-mono">${escapeHtml(lead.email)}</span>` : ''}
            </div>
          </div>

          <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
            <div class="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-200/60 dark:border-slate-700/60 pb-1">
              <span><strong>Work Allocation:</strong> ${lead.allocatedToName ? `<span class="font-bold text-blue-600 dark:text-blue-400">💻 ${escapeHtml(formatDepartmentAllocation(lead.allocatedToName))}</span>` : '<span class="text-slate-400">Awaiting Founder Approval</span>'}</span>
              <span>Target Due: <strong class="text-slate-900 dark:text-white font-bold">${lead.dueDate ? formatDate(lead.dueDate) : 'Pending'}</strong></span>
            </div>
            <div class="text-[11px] leading-relaxed">
              <span class="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] block">Aryan's Scouted Scope:</span>
              ${escapeHtml(lead.requirements)}
            </div>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
            <div class="flex items-center gap-2 text-slate-500">
              <span>Lead Scouted By:</span>
              <span class="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-[#026047] dark:text-emerald-300 font-bold text-[11px]">🎯 Research Department</span>
            </div>
            <div>
              ${
                lead.deliverableUrl
                  ? `<a href="${escapeHtml(lead.deliverableUrl)}" target="_blank" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition inline-flex items-center gap-1.5 shadow-sm">
                      <span>🔗</span> View Technical Deliverable
                    </a>`
                  : lead.allocatedTo && lead.status !== 'submitted_to_founder'
                  ? `<span class="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium text-xs">💻 Allocated to ${escapeHtml(formatDepartmentAllocation(lead.allocatedToName))}</span>`
                  : `<span class="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-medium text-xs">⏳ Awaiting Founder Clearance</span>`
              }
            </div>
          </div>
        </div>
        `;
      })
      .join('');

    let historySection = '';
    if (allAryanLeads.length > 0) {
      historySection = `
        <div class="mt-6 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div class="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
              <span>📋</span> Historical Lead Archive (${allAryanLeads.length} Total Scouted)
            </div>
            <div class="text-[10px] text-slate-400 font-mono">
              ${aryanRejectedLeads.length} Declined &bull; ${completedCount} Published
            </div>
          </div>
          <div class="space-y-1.5">
            ${allAryanLeads.map((l) => {
              let histBadge = '<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 shrink-0">Under Review</span>';
              if (l.status === 'rejected') {
                histBadge = '<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 shrink-0">Declined by Founder</span>';
              } else if (l.status === 'published_to_market' || l.status === 'approved_for_delivery') {
                histBadge = '<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">✓ Published in Market</span>';
              } else if (l.status === 'allocated_to_vivek' || l.status === 'tech_in_progress') {
                histBadge = '<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 shrink-0">In Tech Engineering</span>';
              } else if (l.status === 'forwarded_to_arshad' || l.status === 'commercial_in_progress') {
                histBadge = '<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 shrink-0">Commercial Packaging</span>';
              }
              return `
                <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs gap-2">
                  <div class="min-w-0 flex-1 truncate">
                    <span class="font-bold text-slate-900 dark:text-white">${escapeHtml(l.clientName)}</span>
                    <span class="text-[10px] text-slate-400 ml-1.5 font-mono">${escapeHtml(l.productType)} &bull; ${formatINR(l.dealValue)}</span>
                    ${l.status === 'rejected' && l.rejectionReason ? `
                      <span class="text-[10px] text-rose-600 dark:text-rose-400 font-medium ml-2 truncate" title="Rejection Reason: ${escapeHtml(l.rejectionReason)}">
                        &bull; Reason: ${escapeHtml(l.rejectionReason)}
                      </span>` : ''}
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    ${histBadge}
                    <span class="text-[9px] text-slate-400 font-mono">${formatDate(l.submittedAt)}</span>
                    <button onclick="deleteLead('${l.id}')" class="p-1 text-slate-400 hover:text-rose-600 text-xs transition" title="Delete Lead Permanently">🗑️</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = cardsHtml + historySection;
    return;
  }

  // NON-ARYAN (VIVEK, ARSHAD): Regular allocated work flow
  if (badgeEl) badgeEl.textContent = 'My Tasks';
  if (titleEl) titleEl.textContent = 'Allocated Work & Deliverables';
  if (subtitleEl) subtitleEl.textContent = 'Tasks, milestones and project scopes assigned to you by Founder & Director Pranav Bansode.';

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
        if (task.leadId) {
          const linkedLead = (STATE.leads || []).find((l) => l.id === task.leadId);
          if (linkedLead && (linkedLead.status === 'submitted_to_founder' || linkedLead.status === 'rejected')) {
            const isRej = linkedLead.status === 'rejected';
            actionControl = `
              <button disabled title="${isRej ? 'Lead Rejected by Founder' : 'Awaiting Founder Approval'}"
                class="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-500 font-bold text-xs cursor-not-allowed flex items-center gap-1.5 shadow-sm opacity-70">
                <span>${isRej ? '⛔' : '🔒'}</span> Start Work (${isRej ? 'Lead Rejected' : 'Awaiting Founder Approval'})
              </button>
            `;
          } else if (task.status === 'assigned' || (linkedLead && linkedLead.status === 'allocated_to_vivek')) {
            actionControl = `
              <button onclick="startVivekTechWork('${safeId(task.leadId)}')"
                class="px-3.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm">
                <span>🚀</span> Start Tech Work
              </button>
            `;
          } else if (task.status === 'in_progress' || (linkedLead && linkedLead.status === 'tech_in_progress')) {
            actionControl = `
              <button onclick="openTechForwardModal('${safeId(task.leadId)}')"
                class="px-3.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm">
                <span>📤</span> Complete &amp; Forward to Arshad
              </button>
            `;
          } else if (task.status === 'review_pending' || (linkedLead && (linkedLead.status === 'forwarded_to_arshad' || linkedLead.status === 'awaiting_founder_market_approval'))) {
            actionControl = `
              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-xs">
                <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span>⏳ Forwarded to Arshad &bull; Commercial Review</span>
              </div>
            `;
          } else if (task.status === 'completed' || (linkedLead && (linkedLead.status === 'published_to_market' || linkedLead.status === 'approved_for_delivery'))) {
            actionControl = `
              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <span>🏆</span> Published in Market for Sale
              </div>
            `;
          }
        } else if (task.status === 'assigned') {
          actionControl = `
            <button onclick="updateTaskStatus('${tId}', 'in_progress')"
              class="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm">
              <span>▶️</span> Start Work
            </button>
          `;
        } else if (task.status === 'in_progress') {
          if (task.assignedTo === 'mem-03' || STATE.activeRole === 'vivek') {
            actionControl = `
              <button onclick="forwardVivekTaskToArshad('${tId}')"
                class="px-3.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm">
                <span>📤</span> Complete &amp; Forward to Arshad
              </button>
            `;
          } else {
            actionControl = `
              <button onclick="updateTaskStatus('${tId}', 'review_pending')"
                class="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm">
                <span>📤</span> Submit for Founder Approval
              </button>
            `;
          }
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
            <div class="flex items-center gap-2">
              ${actionControl}
              <button onclick="deleteAssignedTask('${tId}')" class="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition" title="Delete Task from Portal &amp; Database">
                🗑️
              </button>
            </div>
          </div>
        </div>
      `;
      })
      .join('');
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
  return '';
}
window.renderLeadPipelineSection = renderLeadPipelineSection;

function renderSingleLeadCard(rawLead, currentRole) {
  const lead = normalizeLead(rawLead);
  const lid = safeId(lead.id);
  const isPranav = currentRole === 'pranav';
  const isVivek = currentRole === 'vivek';
  const isArshad = currentRole === 'arshad';

  const s1Done = true;
  const s2Done = [
    'forwarded_to_arshad',
    'commercial_in_progress',
    'awaiting_founder_market_approval',
    'published_to_market',
    'approved_for_delivery',
    'sent_to_arshad_notified_founder'
  ].includes(lead.status);
  const s2Active = lead.status === 'allocated_to_vivek' || lead.status === 'tech_in_progress';

  const s3Done = [
    'awaiting_founder_market_approval',
    'published_to_market',
    'approved_for_delivery'
  ].includes(lead.status);
  const s3Active = lead.status === 'forwarded_to_arshad' || lead.status === 'commercial_in_progress' || lead.status === 'sent_to_arshad_notified_founder';

  const s4Done = lead.status === 'published_to_market' || lead.status === 'approved_for_delivery';
  const s4Active = lead.status === 'awaiting_founder_market_approval';

  let currentStageText = 'Stage 1: Awaiting Arshad CTO Clearance';
  let badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
  if (lead.status === 'rejected') {
    currentStageText = 'Declined by Leadership';
    badgeColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300';
  } else if (lead.status === 'allocated_to_vivek') {
    currentStageText = 'Stage 2: Approved by CTO • Technical Dept Assigned';
    badgeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300';
  } else if (lead.status === 'tech_in_progress') {
    currentStageText = 'Stage 2: Technical Dept In Progress';
    badgeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 animate-pulse';
  } else if (lead.status === 'forwarded_to_arshad' || lead.status === 'sent_to_arshad_notified_founder') {
    currentStageText = 'Stage 3: Forwarded to Commercial & Marketing Dept';
    badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
  } else if (lead.status === 'commercial_in_progress') {
    currentStageText = 'Stage 3: Commercial & Marketing Dept Packaging In Progress';
    badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 animate-pulse';
  } else if (lead.status === 'awaiting_founder_market_approval') {
    currentStageText = 'Stage 4: Commercial Ready • Awaiting Market Publication';
    badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 animate-pulse';
  } else if (lead.status === 'published_to_market' || lead.status === 'approved_for_delivery') {
    currentStageText = 'Stage 4: Approved & Published in Market';
    badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300';
  }

  const safeDeliverable = lead.deliverableUrl ? sanitizeUrl(lead.deliverableUrl) : '';

  let actionButtons = '';
  // Routing: Arshad approves lead and allocates to Vivek
  if (lead.status === 'submitted_to_founder' || lead.status === 'submitted_to_arshad') {
    if (isVivek) {
      actionButtons = `
        <button disabled
          class="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed text-xs font-bold flex items-center gap-1.5 opacity-60 border border-slate-300 dark:border-slate-700 shadow-none"
          title="Awaiting Arshad CTO's Approval before technical development can start">
          <span>🔒</span> Start Work (Awaiting Arshad CTO Approval)
        </button>
      `;
    } else if (isArshad || isPranav) {
      actionButtons = `
        <button onclick="approveLeadByArshad('${lid}')"
          class="px-3.5 py-1.5 rounded-xl bg-[#026047] hover:bg-[#024d39] text-[#fffde8] font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer">
          <span>🤝</span> Approve Lead &amp; Allocate to Vivek
        </button>
        <button onclick="rejectApprovalItem('lead', '${lid}')"
          class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer">
          <span>✕</span> Reject Lead
        </button>
      `;
    }
  } else if (lead.status === 'allocated_to_vivek' && (isVivek || isPranav || isArshad)) {
    actionButtons = `
      <button onclick="startVivekTechWork('${lid}')"
        class="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer">
        <span>🚀</span> Start Tech Work
      </button>
    `;
  } else if (lead.status === 'tech_in_progress' && (isVivek || isPranav || isArshad)) {
    actionButtons = `
      <button onclick="openTechForwardModal('${lid}')"
        class="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer">
        <span>📤</span> Complete &amp; Forward to Arshad
      </button>
    `;
  } else if ((lead.status === 'forwarded_to_arshad' || (lead.status === 'sent_to_arshad_notified_founder' && !lead.arshadChecked)) && (isArshad || isPranav)) {
    actionButtons = `
      <button onclick="startArshadCommercialWork('${lid}')"
        class="px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer">
        <span>🤝</span> Start Commercial Packaging
      </button>
    `;
  } else if (lead.status === 'commercial_in_progress' && (isArshad || isPranav)) {
    actionButtons = `
      <button onclick="openArshadSubmitModal('${lid}')"
        class="px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer">
        <span>👑</span> Complete &amp; Submit for Market Clearance
      </button>
    `;
  } else if ((lead.status === 'awaiting_founder_market_approval' || lead.status === 'sent_to_arshad_notified_founder') && (isPranav || isArshad)) {
    actionButtons = `
      <button onclick="openDeliveryApprovalModal('${lid}')"
        class="px-3.5 py-1.5 rounded-xl bg-[#026047] hover:bg-[#024d39] text-[#fffde8] font-black text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer">
        <span>🏆</span> Verify &amp; Publish in Market for Sale
      </button>
    `;
  } else if (lead.status === 'published_to_market' || lead.status === 'approved_for_delivery') {
    actionButtons = `
      <span class="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5">
        <span>🏆</span> Published in Market for Sale
      </span>
    `;
  } else if (lead.status === 'rejected') {
    actionButtons = `
      <span class="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-xs flex items-center gap-1">
        <span>✕</span> Declined by Founder
      </span>
    `;
  }

  // Point 7: Founder can permanently delete/remove lead from portal and database
  if (isPranav) {
    actionButtons += `
      <button onclick="deleteLead('${lid}')"
        class="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-500 dark:bg-slate-800 dark:hover:bg-rose-950 transition text-xs font-bold flex items-center gap-1 cursor-pointer"
        title="Permanently Delete Lead from Portal and Database">
        <span>🗑️</span> Delete
      </button>
    `;
  }

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
          <button onclick="openEditPricingModal('${lid}')" title="Click to edit deal pricing (e.g. 4,999/-)"
            class="text-xs font-black text-[#026047] dark:text-emerald-400 bg-white dark:bg-slate-900 hover:bg-[#ffffea] hover:border-[#026047] dark:hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 shadow-sm cursor-pointer group">
            <span class="text-[11px]">🏷️</span>
            <span>Est: ${formatINR(lead.dealValue)}</span>
            <span class="text-[10px] text-slate-400 group-hover:text-[#026047] transition">✏️ Edit</span>
          </button>
          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeColor}">
            ${escapeHtml(currentStageText)}
          </span>
        </div>
      </div>

      <!-- 4-Step Interactive Progress Stepper Bar -->
      <div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
          <!-- Step 1: Aryan Scouted -->
          <div class="flex items-center gap-2 p-2 rounded-lg ${s1Done ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 opacity-60'}">
            <span class="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${s1Done ? 'bg-[#026047] text-white' : 'bg-slate-300 text-slate-600'}">✓</span>
            <div>
              <div class="font-bold text-slate-900 dark:text-white">1. Aryan Scouted</div>
              <div class="text-[10px] text-slate-500">Lead Created</div>
            </div>
          </div>
          <!-- Step 2: Vivek Tech -->
          <div class="flex items-center gap-2 p-2 rounded-lg ${s2Done ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800' : (s2Active ? 'bg-purple-50 dark:bg-purple-950/40 border border-purple-300 animate-pulse' : 'bg-slate-100 opacity-60')}">
            <span class="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${s2Done ? 'bg-[#026047] text-white' : (s2Active ? 'bg-purple-600 text-white' : 'bg-slate-300 text-slate-600')}">
              ${s2Done ? '✓' : '2'}
            </span>
            <div>
              <div class="font-bold text-slate-900 dark:text-white">2. Vivek Engineering</div>
              <div class="text-[10px] text-slate-500">${s2Done ? 'Tech Completed' : (lead.status === 'tech_in_progress' ? 'Dev In Progress' : 'Directly Assigned')}</div>
            </div>
          </div>
          <!-- Step 3: Arshad Commercial -->
          <div class="flex items-center gap-2 p-2 rounded-lg ${s3Done ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800' : (s3Active ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-300 animate-pulse' : 'bg-slate-100 opacity-60')}">
            <span class="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${s3Done ? 'bg-[#026047] text-white' : (s3Active ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600')}">
              ${s3Done ? '✓' : '3'}
            </span>
            <div>
              <div class="font-bold text-slate-900 dark:text-white">3. Arshad Commercial</div>
              <div class="text-[10px] text-slate-500">${s3Done ? 'Packaging Done' : (lead.status === 'commercial_in_progress' ? 'Packaging In Progress' : 'Pending Review')}</div>
            </div>
          </div>
          <!-- Step 4: Founder Market Clearance -->
          <div class="flex items-center gap-2 p-2 rounded-lg ${s4Done ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800' : (s4Active ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 animate-pulse' : 'bg-slate-100 opacity-60')}">
            <span class="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${s4Done ? 'bg-[#026047] text-white' : (s4Active ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-600')}">
              ${s4Done ? '✓' : '4'}
            </span>
            <div>
              <div class="font-bold text-slate-900 dark:text-white">4. Market Clearance</div>
              <div class="text-[10px] text-slate-500">${s4Done ? 'Published in Market' : (s4Active ? 'Ready for Clearance' : 'Pending Verification')}</div>
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
            <strong class="text-emerald-700 dark:text-emerald-400">🎯 Research & Scouting Department</strong>
          </div>
          <p class="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <strong>Scope / Client Pain Points:</strong> ${escapeHtml(lead.requirements)}
          </p>
        </div>

        <div class="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div class="text-[11px] text-blue-700 dark:text-blue-400 font-bold flex items-center justify-between">
            <span>💻 Assigned Department: Technical Department</span>
            <span class="text-[10px] font-mono text-slate-400">Target: ${escapeHtml(lead.dueDate || '1 Week')}</span>
          </div>

          ${lead.deliverableUrl ? `
            <div class="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <span class="font-bold text-purple-700 dark:text-purple-300">💻 Technical Department Deliverable:</span>
              <div class="mt-0.5">
                ${safeDeliverable
                  ? `<a href="${escapeHtml(safeDeliverable)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 font-mono underline break-all">${escapeHtml(lead.deliverableUrl)}</a>`
                  : `<span class="text-rose-600 font-mono">[Blocked unsafe URL] ${escapeHtml(lead.deliverableUrl)}</span>`
                }
              </div>
              <p class="text-slate-600 dark:text-slate-400 text-[10px] mt-0.5"><strong>Tech Note:</strong> ${escapeHtml(lead.techNotes || '')}</p>
              <div class="text-[10px] text-emerald-600 font-bold mt-1">✓ Forwarded to Commercial & Marketing Department • Founders Notified</div>
            </div>
          ` : ''}

          ${lead.commercialNotes ? `
            <div class="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <span class="font-bold text-blue-700 dark:text-blue-300">🤝 Commercial & Marketing Department Terms:</span>
              <p class="text-slate-600 dark:text-slate-400 text-[10px] mt-0.5">${escapeHtml(lead.commercialNotes)}</p>
              <div class="text-[10px] text-blue-600 font-bold mt-1">✓ Verified for Go-To-Market Release</div>
            </div>
          ` : ''}

          ${lead.approvedBy ? `
            <div class="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-[11px] font-bold text-[#026047] dark:text-emerald-300 flex items-center gap-1.5">
              <span>👑</span> Approved &amp; Published in Market by ${escapeHtml(lead.approvedBy)} on ${escapeHtml(formatDate(lead.approvedAt))}
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Action Buttons Row (Interactive for each role in the 4 steps) -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700">
        <div class="text-xs text-slate-500">
          Current Assigned Action:
          <strong class="text-slate-900 dark:text-white">
            ${lead.status === 'allocated_to_vivek' ? 'Technical Department begins engineering' : ''}
            ${lead.status === 'tech_in_progress' ? 'Technical Department completes build & forwards to Commercial Dept' : ''}
            ${lead.status === 'forwarded_to_arshad' ? 'Commercial & Marketing Department reviews deal & prepares packaging' : ''}
            ${lead.status === 'commercial_in_progress' ? 'Commercial & Marketing Department finalizes packaging & submits to Founder' : ''}
            ${lead.status === 'awaiting_founder_market_approval' ? 'Founder verifies pipeline & publishes in market' : ''}
            ${lead.status === 'published_to_market' || lead.status === 'approved_for_delivery' ? 'Project published in market for sale!' : ''}
          </strong>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          ${actionButtons}
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

window.setLeadDealPrice = function (val) {
  const el = document.getElementById('lead-deal-value');
  if (el) el.value = val;
};

window.openEditPricingModal = function (leadId) {
  const lead = (STATE.leads || []).find((l) => l.id === leadId);
  if (!lead) return;
  const modal = document.getElementById('modal-edit-lead-price');
  const idEl = document.getElementById('edit-pricing-lead-id');
  const nameEl = document.getElementById('edit-pricing-client-name');
  const inputEl = document.getElementById('edit-pricing-input');
  if (!modal || !idEl || !inputEl) {
    const raw = prompt(
      `Edit Pricing for "${lead.clientName}":\nEnter price (e.g. 4999 or 4999/-):`,
      lead.dealValue || 4999
    );
    if (raw === null) return;
    const cleaned = parseFloat(raw.replace(/[^0-9.]/g, ''));
    if (isNaN(cleaned) || cleaned <= 0) {
      alert('Invalid price entered.');
      return;
    }
    lead.dealValue = cleaned;
    saveLeadsToStorage();
    saveAppStateToStorage();
    showToast(`✓ Pricing updated to ${formatINR(cleaned)}!`);
    renderCurrentTab();
    return;
  }
  idEl.value = lead.id;
  if (nameEl) nameEl.textContent = `${lead.clientName} (${lead.productType || 'Lead'})`;
  inputEl.value = lead.dealValue || 4999;
  modal.classList.remove('hidden');
};

window.closeEditPricingModal = function () {
  const modal = document.getElementById('modal-edit-lead-price');
  if (modal) modal.classList.add('hidden');
};

window.setEditPricePreset = function (amt) {
  const inputEl = document.getElementById('edit-pricing-input');
  if (inputEl) inputEl.value = amt;
};

window.saveEditedLeadPricing = function () {
  const id = document.getElementById('edit-pricing-lead-id')?.value;
  const rawVal = document.getElementById('edit-pricing-input')?.value;
  const newPrice = parseFloat(rawVal);
  if (!id || isNaN(newPrice) || newPrice <= 0) {
    alert('Please enter a valid price amount (e.g. 4999).');
    return;
  }
  const lead = (STATE.leads || []).find((l) => l.id === id);
  if (!lead) return;
  const oldPrice = lead.dealValue || 0;
  lead.dealValue = newPrice;
  saveLeadsToStorage();
  recordAuditLog(
    'LEAD_PRICING_UPDATED',
    `Updated pricing for "${lead.clientName}" from ${formatINR(oldPrice)} to ${formatINR(newPrice)}`,
    getCurrentUserName()
  );
  saveAppStateToStorage();
  syncLeadToSupabase(lead);
  closeEditPricingModal();
  showToast(`✓ Pricing updated to ${formatINR(newPrice)} for "${lead.clientName}"!`);
  renderCurrentTab();
};

window.editLeadPricing = window.openEditPricingModal;

window.submitClientLead = function () {
  if (!requireAuth('submit client leads')) return;
  const clientName = document.getElementById('lead-client-name')?.value.trim();
  const contactPerson = document.getElementById('lead-contact-person')?.value.trim();
  const phone = document.getElementById('lead-phone')?.value.trim();
  const product = document.getElementById('lead-product')?.value;
  const dealValue = parseFloat(document.getElementById('lead-deal-value')?.value) || 0;
  const requirements = document.getElementById('lead-requirements')?.value.trim();

  if (!clientName || !requirements || !phone || dealValue <= 0) {
    alert('Please fill out all required lead fields and enter a valid deal price (e.g. 4999).');
    return;
  }

  const submitter = MEMBER_NAME_MAP[getCurrentMemberId()] || 'Aryan Bhore';
  const newLeadId = 'lead-' + Date.now();
  const leadNum = 'LEAD-2026-' + String((STATE.leads || []).length + 1).padStart(3, '0');

  // Point 1: When research team creates lead, it goes directly to Arshad (Co-Founder & CTO); Founder receives tracking notification only
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
    submittedByMemberId: getCurrentMemberId(),
    submittedAt: new Date().toISOString(),
    status: 'submitted_to_arshad',
    stage: 'submitted_to_arshad',
    allocatedTo: 'mem-03',
    allocatedToName: 'Technical Department',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  });

  STATE.leads.unshift(newLead);
  saveLeadsToStorage();
  recordAuditLog(
    'LEAD_SUBMITTED_TO_ARSHAD',
    `Research Department scouted lead "${clientName}" (${formatINR(dealValue)}) — sent directly to Arshad Shaikh (Co-Founder & CTO) for clearance.`,
    'Research Department'
  );
  saveAppStateToStorage();
  syncLeadToSupabase(newLead);

  // 1. Actionable notification to Arshad (Co-Founder & CTO) for review and approval
  createNotification({
    type: 'LEAD_PENDING_APPROVAL',
    title: `🎯 New Lead Awaiting Approval: ${clientName}`,
    message: `Research Department scouted "${clientName}" (${formatINR(dealValue)}). Routed directly to you for approval & technical allocation.`,
    targetRole: 'arshad',
    leadId: newLead.id,
    actor: 'Research Department',
    actorRole: 'aryan'
  });

  // 2. Informative notification to Founder Pranav for tracking only
  createNotification({
    type: 'LEAD_CREATED_TRACKING',
    title: `ℹ️ New Research Lead: ${clientName}`,
    message: `Aryan scouted "${clientName}" (${formatINR(dealValue)}). Routed directly to Arshad (Co-Founder & CTO) for approval.`,
    targetRole: 'pranav',
    leadId: newLead.id,
    actor: 'Research Department',
    actorRole: 'aryan'
  });

  closeNewLeadModal();
  const form = document.querySelector('#modal-new-lead form');
  if (form) form.reset();

  showToast(`🎯 Lead "${clientName}" sent directly to Arshad (Co-Founder & CTO) for approval.`);
  renderCurrentTab();
  if (STATE.currentTab === 'approvals') renderApprovals();
  renderSidebarNav(STATE.currentTab);
};

window.approveLeadByArshad = function (leadId) {
  if (!requireFounder('approve client leads')) return;
  const lead = (STATE.leads || []).find((l) => l.id === leadId);
  if (!lead) return;

  lead.status = 'allocated_to_vivek';
  lead.stage = 'allocated_to_vivek';
  lead.approvedByArshad = true;
  lead.arshadApprovedAt = new Date().toISOString();
  lead.allocatedAt = new Date().toISOString();
  lead.allocatedTo = 'mem-03';
  lead.allocatedToName = 'Technical Department';

  const existingTask = (STATE.assignedTasks || []).find((t) => t.leadId === lead.id);
  if (!existingTask) {
    const newTask = {
      id: 'task-lead-' + Date.now(),
      title: `Develop ${lead.productType} for ${lead.clientName}`,
      assignedTo: 'mem-03',
      assignedToName: 'Technical Department',
      department: 'Technical Department',
      projectId: (lead.productType || '').includes('Smart Review') ? 'prj-srm' : 'prj-leadx',
      projectName: lead.productType,
      priority: lead.priority || 'high',
      dueDate: lead.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      assignedDate: new Date().toISOString().split('T')[0],
      assignedBy: 'Arshad Shaikh (Co-Founder & CTO)',
      description: `[Scope from Research Department]: ${lead.requirements}`,
      status: 'assigned',
      leadId: lead.id,
    };
    STATE.assignedTasks.unshift(newTask);
    saveAssignedTasksToStorage();
    syncAssignedTaskToSupabase(newTask);
  }

  saveLeadsToStorage();
  recordAuditLog(
    'LEAD_APPROVED_BY_ARSHAD',
    `Arshad Shaikh (Co-Founder & CTO) approved lead "${lead.clientName}" (${formatINR(lead.dealValue)}) and allocated technical development to Vivek.`,
    'Arshad Shaikh (Co-Founder & CTO)'
  );
  saveAppStateToStorage();
  syncLeadToSupabase(lead);

  // Notify Vivek that technical work is assigned
  createNotification({
    type: 'TASK_ALLOCATED',
    title: `🚀 Technical Allocation: ${lead.clientName}`,
    message: `Arshad approved lead "${lead.clientName}". Assigned to Technical Department for development.`,
    targetRole: 'vivek',
    leadId: lead.id,
    actor: 'Arshad Shaikh (Co-Founder & CTO)',
    actorRole: 'arshad'
  });

  // Notify Founder Pranav for tracking
  createNotification({
    type: 'LEAD_APPROVED_TRACKING',
    title: `ℹ️ Lead Approved & Allocated: ${lead.clientName}`,
    message: `Arshad approved lead "${lead.clientName}" (${formatINR(lead.dealValue)}) and allocated technical development to Vivek.`,
    targetRole: 'pranav',
    leadId: lead.id,
    actor: 'Arshad Shaikh (Co-Founder & CTO)',
    actorRole: 'arshad'
  });

  showToast(`🤝 Lead "${lead.clientName}" approved by Arshad! Work assigned to Vivek.`);
  renderCurrentTab();
  if (STATE.currentTab === 'approvals') renderApprovals();
  renderSidebarNav(STATE.currentTab);
};

window.approveLeadByFounder = window.approveLeadByArshad;

window.startVivekTechWork = function (leadId) {
  if (!requireAuth('start technical development')) return;
  const lead = (STATE.leads || []).find((l) => l.id === leadId);
  if (!lead) return;

  // Vivek cannot start work before Arshad CTO approval
  if (lead.status === 'submitted_to_founder' || lead.status === 'submitted_to_arshad') {
    alert('Security Gate: Arshad Shaikh (Co-Founder & CTO) must verify and approve this lead before technical development can start.');
    return;
  }
  if (lead.status === 'rejected') {
    alert('Security Gate: This lead was rejected by Founder Pranav and cannot be started.');
    return;
  }

  lead.status = 'tech_in_progress';
  lead.stage = 'tech_in_progress';
  lead.techStartedAt = new Date().toISOString();

  const linkedTask = (STATE.assignedTasks || []).find((t) => t.leadId === lead.id);
  if (linkedTask) {
    linkedTask.status = 'in_progress';
    saveAssignedTasksToStorage();
    syncAssignedTaskToSupabase(linkedTask);
  }

  saveLeadsToStorage();
  recordAuditLog(
    'TECH_WORK_STARTED',
    `Technical Department started engineering for "${lead.clientName}". Founder & Co-Founder notified.`,
    'Technical Department'
  );
  saveAppStateToStorage();
  syncLeadToSupabase(lead);

  // Point 1: Whenever starting to work on project, notify founder and co-founder
  createNotification({
    type: 'TECH_STARTED',
    title: `💻 Tech Started: ${lead.clientName}`,
    message: `Technical Department commenced engineering development for "${lead.clientName}".`,
    targetRole: 'founders',
    leadId: lead.id,
    actor: 'Technical Department',
    actorRole: 'vivek'
  });

  showToast(`🚀 Tech work started for "${lead.clientName}"! Founder & Co-Founder notified.`);
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
  lead.allocatedToName = 'Technical Department';

  const newTask = {
    id: 'task-lead-' + Date.now(),
    title: `Develop ${lead.productType} for ${lead.clientName}`,
    assignedTo: 'mem-03',
    assignedToName: 'Technical Department',
    department: 'Technical Department',
    projectId: (lead.productType || '').includes('Smart Review') ? 'prj-srm' : 'prj-leadx',
    projectName: lead.productType,
    priority,
    dueDate,
    assignedDate: new Date().toISOString().split('T')[0],
    assignedBy: 'Executive & Founder Oversight',
    description: `[Allocated from Research Department Lead ${lead.leadNumber}]: ${instructions}`,
    status: 'in_progress',
    leadId: lead.id,
  };

  STATE.assignedTasks.unshift(newTask);
  saveAssignedTasksToStorage();
  saveLeadsToStorage();
  recordAuditLog(
    'LEAD_ALLOCATED',
    `Founder allocated technical development of "${lead.clientName}" to Technical Department.`,
    'Pranav Bansode (Founder / Director)'
  );
  saveAppStateToStorage();
  syncLeadToSupabase(lead);
  syncAssignedTaskToSupabase(newTask);

  if (instrEl) instrEl.value = '';
  closeAllocateLeadModal();
  showToast('🚀 Work allocated to Technical Department! Notification sent.');
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

  lead.status = 'forwarded_to_arshad';
  lead.stage = 'forwarded_to_arshad';
  lead.deliverableUrl = safeUrl;
  lead.techNotes = techNotes;
  lead.techCompletedAt = new Date().toISOString();
  lead.founderNotified = true;

  // Technical Department deliverable is completed; does NOT go to Founder's approval queue
  const linkedTask = (STATE.assignedTasks || []).find((t) => t.leadId === lead.id && (t.assignedTo === 'mem-03' || !t.assignedTo || t.assignedTo === 'mem-01'));
  if (linkedTask) {
    linkedTask.status = 'completed';
    linkedTask.completedDate = new Date().toISOString().split('T')[0];
    linkedTask.approvedBy = 'Technical Engineering Handover';
    linkedTask.notes = `Technical deliverables completed by Vivek Gajdhane and forwarded directly to Arshad Shaikh for Final QC (Quality Check). Deliverable: ${safeUrl}`;
    saveAssignedTasksToStorage();
    syncAssignedTaskToSupabase(linkedTask);
  }

  // Create Final QC deliverable directly assigned to Arshad (Co-Founder & CTO)
  const existingArshadTask = (STATE.assignedTasks || []).find((t) => t.leadId === lead.id && t.assignedTo === 'mem-02');
  if (!existingArshadTask) {
    const arshadTask = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      title: `Final QC (Quality Check): ${lead.clientName}`,
      description: `Technical work completed by Vivek Gajdhane. Deliverable URL: ${safeUrl}. Arshad Shaikh (Co-Founder & CTO) to perform Final QC verification and forward to Founder Pranav for Final Delivery.`,
      assignedTo: 'mem-02',
      assignedToName: 'Arshad Shaikh',
      assignedBy: 'Technical Department (Vivek Gajdhane)',
      department: 'Executive Technical & Commercial Architecture',
      projectId: lead.projectId || 'prj-godownpro',
      projectName: lead.productType || 'Technology Solution',
      priority: 'HIGH',
      status: 'assigned',
      leadId: lead.id,
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: lead.expectedCloseDate || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
    };
    STATE.assignedTasks.unshift(arshadTask);
    saveAssignedTasksToStorage();
    syncAssignedTaskToSupabase(arshadTask);
  }

  saveLeadsToStorage();
  recordAuditLog(
    'TECH_DELIVERED_FORWARDED_QC',
    `Vivek Gajdhane completed technical build for "${lead.clientName}". Forwarded directly to Arshad Shaikh for Final QC (Quality Check); Founder notified.`,
    'Technical Department'
  );
  saveAppStateToStorage();
  syncLeadToSupabase(lead);

  // Founder and Arshad receive notification of QC handover
  createNotification({
    type: 'TECH_FORWARDED_FOR_QC',
    title: `🔍 Final QC Required: ${lead.clientName}`,
    message: `Vivek Gajdhane completed technical work and forwarded to Arshad Shaikh for Final Quality Check (QC).`,
    targetRole: 'founders',
    leadId: lead.id,
    actor: 'Technical Department',
    actorRole: 'vivek'
  });

  if (urlEl) urlEl.value = '';
  if (notesEl) notesEl.value = '';
  closeTechForwardModal();
  showToast('🔍 Technical deliverables forwarded to Arshad Shaikh for Final QC (Quality Check).');

  renderCurrentTab();
  renderSidebarNav(STATE.currentTab);
};

window.forwardVivekTaskToArshad = function (taskId) {
  if (!requireAuth('forward technical deliverable')) return;
  const task = (STATE.assignedTasks || []).find((t) => t.id === taskId);
  if (!task) return;

  task.status = 'completed';
  task.completedDate = new Date().toISOString().split('T')[0];
  task.approvedBy = 'Technical Handover to Commercial';
  saveAssignedTasksToStorage();
  syncAssignedTaskToSupabase(task);

  const nextTask = {
    id: 'task-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    title: `Commercial Review & Packaging: ${task.title}`,
    description: `Technical Department completed build for "${task.title}". Commercial & Marketing Department to conduct commercial review and client outreach.`,
    assignedTo: 'mem-02',
    assignedToName: 'Arshad Shaikh',
    assignedBy: 'Technical Department (Vivek Gajdhane)',
    department: 'Commercial & Marketing Department',
    projectId: task.projectId || 'prj-leadx',
    projectName: task.projectName || 'LeadX Platform',
    priority: task.priority || 'HIGH',
    status: 'assigned',
    assignedDate: new Date().toISOString().split('T')[0],
    dueDate: task.dueDate || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  };
  STATE.assignedTasks.unshift(nextTask);
  saveAssignedTasksToStorage();
  syncAssignedTaskToSupabase(nextTask);

  createNotification({
    type: 'TECH_FORWARDED_TO_ARSHAD',
    title: `Technical Deliverable Forwarded`,
    message: `Technical Department completed "${task.title}" and forwarded directly to Commercial & Marketing Department (Arshad Shaikh).`,
    targetRole: 'founders',
    actor: 'Technical Department',
    actorRole: 'vivek'
  });

  showToast(`Work completed and forwarded directly to Commercial Department (Arshad).`);
  renderCurrentTab();
  renderSidebarNav(STATE.currentTab);
};

window.startArshadCommercialWork = function (leadId) {
  if (!requireAuth('start commercial packaging')) return;
  const lead = (STATE.leads || []).find((l) => l.id === leadId);
  if (!lead) return;

  lead.status = 'commercial_in_progress';
  lead.stage = 'commercial_in_progress';
  lead.commercialStartedAt = new Date().toISOString();

  const arshadTask = (STATE.assignedTasks || []).find((t) => t.leadId === lead.id && t.assignedTo === 'mem-02');
  if (arshadTask) {
    arshadTask.status = 'in_progress';
    saveAssignedTasksToStorage();
    syncAssignedTaskToSupabase(arshadTask);
  }

  saveLeadsToStorage();
  recordAuditLog(
    'COMMERCIAL_WORK_STARTED',
    `Commercial & Marketing Department started packaging & deal alignment for "${lead.clientName}". Founder & Co-Founder notified.`,
    'Commercial & Marketing Department'
  );
  saveAppStateToStorage();
  syncLeadToSupabase(lead);

  // Point 1: Whenever starting to work on project, notify founder and co-founder
  createNotification({
    type: 'COMMERCIAL_STARTED',
    title: `🤝 Packaging Started: ${lead.clientName}`,
    message: `Commercial & Marketing Department started review & pricing alignment for "${lead.clientName}".`,
    targetRole: 'founders',
    leadId: lead.id,
    actor: 'Commercial & Marketing Department',
    actorRole: 'arshad'
  });

  showToast(`🤝 Commercial packaging started for "${lead.clientName}"! Founder notified.`);
  renderCurrentTab();
  renderSidebarNav(STATE.currentTab);
};

window.openArshadSubmitModal = function (leadId) {
  const lead = (STATE.leads || []).find((l) => l.id === leadId);
  if (!lead) return;

  const idEl = document.getElementById('arshad-submit-lead-id');
  if (idEl) idEl.value = lead.id;

  const displayEl = document.getElementById('arshad-submit-client-display');
  if (displayEl) displayEl.textContent = `${lead.clientName} (${lead.productType} • ${formatINR(lead.dealValue)})`;

  const notesEl = document.getElementById('arshad-commercial-notes');
  if (notesEl) notesEl.value = lead.commercialNotes || '';

  const modal = document.getElementById('modal-arshad-submit-founder');
  if (modal) modal.classList.remove('hidden');
};

window.closeArshadSubmitModal = function () {
  const modal = document.getElementById('modal-arshad-submit-founder');
  if (modal) modal.classList.add('hidden');
};

window.confirmArshadSubmitToFounder = function () {
  const leadId = document.getElementById('arshad-submit-lead-id')?.value;
  const notesEl = document.getElementById('arshad-commercial-notes');
  const commercialNotes = notesEl ? notesEl.value.trim() : '';

  const lead = (STATE.leads || []).find((l) => l.id === leadId);
  if (!lead) return;

  lead.status = 'awaiting_founder_market_approval';
  lead.stage = 'awaiting_founder_market_approval';
  lead.commercialNotes = commercialNotes || 'Final QC passed. Code quality, architecture & delivery readiness verified.';
  lead.commercialCompletedAt = new Date().toISOString();
  lead.qcSignedOffBy = 'Arshad Shaikh (Co-Founder & CTO)';
  lead.qcSignedOffAt = new Date().toISOString();
  lead.arshadChecked = true;

  const arshadTask = (STATE.assignedTasks || []).find((t) => t.leadId === lead.id && t.assignedTo === 'mem-02');
  if (arshadTask) {
    arshadTask.status = 'review_pending';
    saveAssignedTasksToStorage();
    syncAssignedTaskToSupabase(arshadTask);
  }

  saveLeadsToStorage();
  recordAuditLog(
    'QC_SIGNED_OFF_FORWARDED_TO_FOUNDER',
    `Arshad Shaikh (Co-Founder & CTO) signed off Final QC for "${lead.clientName}" and forwarded to Founder Pranav Bansode for Final Delivery.`,
    'Arshad Shaikh (Co-Founder & CTO)'
  );
  saveAppStateToStorage();
  syncLeadToSupabase(lead);

  createNotification({
    type: 'QC_SIGNED_OFF_TO_FOUNDER',
    title: `🏆 QC Passed: ${lead.clientName}`,
    message: `Arshad Shaikh verified Final QC for "${lead.clientName}" (${formatINR(lead.dealValue)}). Forwarded to Founder Pranav for Final Delivery.`,
    targetRole: 'all',
    leadId: lead.id,
    actor: 'Arshad Shaikh',
    actorRole: 'arshad'
  });

  if (notesEl) notesEl.value = '';
  closeArshadSubmitModal();
  showToast(`🏆 Final QC signed off for "${lead.clientName}"! Forwarded to Founder for Final Delivery.`);

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
  if (!requireFounder('grant market clearance & publish sign-off')) return;
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
      <div class="space-y-1.5 text-slate-600 dark:text-slate-300">
        <div>🎯 <strong>1. Research &amp; Scouting:</strong> ${escapeHtml(lead.submittedBy || 'Research & Scouting Department')} (${escapeHtml(formatDate(lead.submittedAt))})</div>
        <div>💻 <strong>2. Technical Engineering:</strong> ${
          safeUrl
            ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-mono">${escapeHtml(lead.deliverableUrl)}</a>`
            : `<span class="text-slate-500 font-mono">${escapeHtml(lead.deliverableUrl || 'Completed build')}</span>`
        } <span class="text-xs text-slate-500">(${escapeHtml(lead.techNotes || 'Verified build')})</span></div>
        <div>🔍 <strong>3. Final QC (Quality Check) Sign-off:</strong> ${escapeHtml(lead.commercialNotes || 'Verified & signed off by Arshad Shaikh (Co-Founder & CTO)')}</div>
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
  if (!requireFounder('grant market clearance & publish approval')) return;
  const leadId = document.getElementById('delivery-lead-id')?.value;
  const lead = (STATE.leads || []).find((l) => l.id === leadId);
  if (!lead || lead.status === 'published_to_market') return;

  const founderNotesEl = document.getElementById('delivery-founder-notes');
  const founderNotes = founderNotesEl ? founderNotesEl.value.trim() : '';

  lead.status = 'published_to_market';
  lead.stage = 'published_to_market';
  lead.approvedBy = 'Pranav Bansode (Founder & Director)';
  lead.approvedAt = new Date().toISOString();
  if (founderNotes) lead.deliveryNotes = founderNotes;

  const linkedTask = (STATE.assignedTasks || []).find((t) => t.leadId === lead.id);
  if (linkedTask) {
    completeTaskRecord(linkedTask);
    saveAssignedTasksToStorage();
  }

  const projectId = (lead.productType || '').includes('Smart Review') ? 'prj-srm' : 'prj-leadx';
  const existsIncome = (STATE.income || []).some((i) => i.leadId === lead.id);
  if (!existsIncome && Number(lead.dealValue) > 0) {
    const dealAmt = Number(lead.dealValue) || 0;
    const newInc = {
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
      notes: founderNotes || `Project published in market for client ${lead.clientName}`,
    };
    STATE.income.unshift(newInc);
    syncIncomeToSupabase(newInc);

    const prj = (STATE.projects || []).find((p) => p.id === projectId);
    if (prj) prj.revenueReceived = (prj.revenueReceived || 0) + dealAmt;
  }

  saveLeadsToStorage();
  recordAuditLog(
    'DELIVERY_APPROVED',
    `Founder Pranav Bansode verified & approved "${lead.clientName}" (${formatINR(lead.dealValue)}) to publish in market for sales.`,
    'Pranav Bansode (Founder / Director)'
  );
  saveAppStateToStorage();
  syncLeadToSupabase(lead);

  // Point 3 & 5: Minimal notification to all users EXCEPT Founder Pranav
  createNotification({
    type: 'MARKET_PUBLISH_APPROVED',
    title: `🎉 Deal Published: ${lead.clientName}`,
    message: `Founder approved & published "${lead.clientName}" in market for sales (${formatINR(lead.dealValue)})!`,
    targetRole: 'all',
    leadId: lead.id,
    actor: 'Pranav Bansode',
    actorRole: 'pranav'
  });

  if (founderNotesEl) founderNotesEl.value = '';
  closeDeliveryApprovalModal();
  showToast(`🚀 Final Delivery authorized for "${lead.clientName}"! Client solution delivered & revenue enrolled.`);

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
        <span class="text-[11px] text-slate-400 font-semibold uppercase">Completed Deliveries</span>
        <div class="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">${activeSales.filter((s) => s.status === 'received').length}</div>
        <span class="text-[10px] text-purple-500 mt-0.5 block">Handed Over &amp; Reconciled</span>
      </div>

      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[11px] text-slate-400 font-semibold uppercase">Pending Settlements</span>
        <div class="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">${formatINR(activeSales.filter((s) => s.status !== 'received').reduce((sum, s) => sum + (Number(s.amount) || 0), 0))}</div>
        <span class="text-[10px] text-amber-500 mt-0.5 block">Pipeline Realization</span>
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
          } transition text-xs cursor-pointer">
            All Sales (${allSales.length})
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
                              ? `<button onclick="downloadInvoicePDF('${sId}')"
                                  class="px-2.5 py-1 rounded-lg bg-[#026047] text-[#fffde8] font-bold text-xs hover:bg-[#024d39] transition flex items-center gap-1 shadow-sm cursor-pointer" title="Direct 1-Click Invoice PDF Download">
                                  <span>📥</span> Download PDF
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
                          <button onclick="deleteIncome('${sId}')"
                            class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition" title="Delete Sale from Portal &amp; Database">
                            🗑️
                          </button>
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

  // SUB-VIEW: LIVE PRODUCTS LIST (Active in-progress initiatives like PRP-GodownPro)
  const liveProjects = allProjects.filter((p) => p.status !== 'completed');
  let visibleProjects = liveProjects;

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
        <span class="px-2 py-0.5 rounded text-[10px] font-black bg-[#026047] text-[#fffde8] uppercase tracking-wider">Live Projects</span>
        <h2 class="text-base font-bold text-slate-900 dark:text-white">Active In-Progress Products</h2>
        <span class="text-xs text-slate-400 font-semibold">(${liveProjects.length} In-Progress)</span>
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
            placeholder="Search active live products..."
            value="${escapeHtml(STATE.projectListSearch || '')}"
            oninput="handleProjectSearch(this.value)"
            class="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#026047]"
          />
          <span class="absolute left-2.5 top-2 text-slate-400">🔍</span>
        </div>
        <div class="flex items-center gap-1">
          <button onclick="filterProjectList('ALL')" class="px-2.5 py-1 rounded-lg bg-[#026047] text-[#fffde8] font-bold shadow-sm transition text-xs cursor-pointer">
            All Live Products (${liveProjects.length})
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

// ==============================================================================
// COMPLETED PROJECTS & DELIVERABLES TRACKER
// Archival ledger of delivered solutions, sign-offs, repos & recognized value
// ==============================================================================
function renderCompletedProjects() {
  const container = document.getElementById('completed-projects-container');
  if (!container) return;

  const completedLeads = (STATE.leads || []).filter(
    (l) => l.status === 'published_to_market' || l.status === 'approved_for_delivery' || l.stage === 'published_to_market'
  );

  const completedArchived = [
    {
      id: 'comp-prj-01',
      code: 'PTS-DELIV-001',
      name: 'LeadX Enterprise Core Engine v1.0',
      clientName: 'Apex Capital Solutions',
      category: 'B2B Client Acquisition Engine',
      completedAt: '2026-10-18',
      dealValue: 185000,
      techLead: 'Vivek Gajdhane (Technical Lead)',
      commercialLead: 'Arshad Shaikh (Co-Founder & CTO)',
      repoUrl: 'https://github.com/phoenixtech/leadx-core',
      demoUrl: 'https://leadx.phoenixtech.com',
      notes: 'Full production deployment completed with automated lead capture & verified deliverable handover.',
      badge: 'Delivered & Handed Over'
    },
    {
      id: 'comp-prj-02',
      code: 'PTS-DELIV-002',
      name: 'Smart Review Management Sentiment Funnel',
      clientName: 'Grand Horizon Hospitality Group',
      category: 'Customer Intelligence & Review Interception',
      completedAt: '2026-11-04',
      dealValue: 95000,
      techLead: 'Vivek Gajdhane (Technical Lead)',
      commercialLead: 'Arshad Shaikh (Co-Founder & CTO)',
      repoUrl: 'https://github.com/phoenixtech/srm-sentiment-engine',
      demoUrl: 'https://srm.phoenixtech.com',
      notes: 'Private feedback interception gateway deployed, QR integration validated, and staff dashboard operational.',
      badge: 'Delivered & Handed Over'
    }
  ];

  const dynamicCompleted = completedLeads.map((l) => ({
    id: l.id,
    code: l.leadNumber || 'PTS-DEAL',
    name: `${l.clientName} - ${l.productType || 'Custom Solution'}`,
    clientName: l.clientName,
    category: l.productType || 'Custom Tech Development',
    completedAt: l.approvedAt ? l.approvedAt.split('T')[0] : (l.submittedAt ? l.submittedAt.split('T')[0] : '2026-11-15'),
    dealValue: Number(l.dealValue) || 0,
    techLead: 'Vivek Gajdhane (Technical Lead)',
    commercialLead: 'Arshad Shaikh (Co-Founder & CTO)',
    repoUrl: l.deliverableUrl || 'https://github.com/phoenixtech/client-delivery',
    demoUrl: l.demoUrl || '',
    notes: l.deliveryNotes || l.techNotes || 'Successfully engineered, packaged, and published in market.',
    badge: 'Delivered & Handed Over'
  }));

  const allCompleted = [...completedArchived, ...dynamicCompleted];
  const totalRevenue = allCompleted.reduce((sum, p) => sum + (Number(p.dealValue) || 0), 0);

  container.innerHTML = `
    <!-- Top Summary Banner -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Completed Deliverables</span>
        <div class="text-2xl font-black text-[#026047] dark:text-emerald-400 mt-1">${allCompleted.length}</div>
        <span class="text-[10px] text-emerald-600 font-semibold block mt-0.5">100% Verified Handover</span>
      </div>
      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Delivered Contract Sum</span>
        <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">${formatINR(totalRevenue)}</div>
        <span class="text-[10px] text-slate-500 font-medium block mt-0.5">Recognized Closed Revenue</span>
      </div>
      <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Technical Sign-off</span>
        <div class="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">100%</div>
        <span class="text-[10px] text-purple-500 font-semibold block mt-0.5">CTO & Technical Architect Verified</span>
      </div>
    </div>

    <!-- Completed Projects Vertical List -->
    <div class="space-y-3">
      ${allCompleted.map((p, idx) => `
        <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-[#026047] transition space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-[#026047] text-[#fffde8] font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                0${idx + 1}
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-sm font-extrabold text-slate-900 dark:text-white">${escapeHtml(p.name)}</h3>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#fffde8] text-[#026047] border border-[#026047]/30">
                    ${escapeHtml(p.code)}
                  </span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    ✅ ${escapeHtml(p.badge)}
                  </span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Client: <strong class="text-slate-700 dark:text-slate-300">${escapeHtml(p.clientName)}</strong> &bull; Completed on: ${escapeHtml(p.completedAt)}
                </p>
              </div>
            </div>
            <div class="text-right sm:self-center">
              <span class="text-[10px] text-slate-400 uppercase font-bold block">Contract Value</span>
              <span class="text-base font-black text-[#026047] dark:text-emerald-400">${formatINR(p.dealValue)}</span>
            </div>
          </div>

          <!-- Technical & Commercial Sign-off Details -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-bold block">Technical Architecture Sign-off</span>
              <div class="font-bold text-slate-800 dark:text-slate-200 mt-0.5">${escapeHtml(p.techLead)}</div>
              ${p.repoUrl ? `
                <div class="mt-1 flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-mono text-[11px] truncate">
                  <span>🔗 Repo:</span>
                  <a href="${escapeHtml(sanitizeUrl(p.repoUrl))}" target="_blank" rel="noopener noreferrer" class="hover:underline truncate">${escapeHtml(p.repoUrl)}</a>
                </div>
              ` : ''}
            </div>
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-bold block">Commercial & CTO Sign-off</span>
              <div class="font-bold text-slate-800 dark:text-slate-200 mt-0.5">${escapeHtml(p.commercialLead)}</div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug truncate">
                ${escapeHtml(p.notes)}
              </p>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
window.renderCompletedProjects = renderCompletedProjects;

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
          <img src="logo-emerald-transparent.png" alt="Phoenix Tech Logo" class="h-12 w-12 object-contain shrink-0" onerror="this.src='logo-black-transparent.png'" />
          <div>
            <h2 class="text-lg font-black tracking-wider text-[#026047] uppercase leading-tight">Phoenix Tech Solutions</h2>
            <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Private Limited</div>
            <div class="text-[10px] text-slate-500 mt-0.5">11-B, Lane No, opposite Etasha Society, Bharat Colony, Sayad Nagar, Hadapsar, Pune, Maharashtra 411028</div>
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

window.downloadInvoicePDF = function (invoiceId) {
  if (!requireAuth('download invoices')) return;
  const id = invoiceId || STATE.currentInvoiceId;
  if (!id) return;
  const inc = (STATE.income || []).find((i) => i.id === id);
  if (!inc || inc.status !== 'received') {
    showToast('Only approved & received invoices can be downloaded.');
    return;
  }

  showToast(`Generating direct PDF invoice for ${inc.clientName}...`);

  const container = document.createElement('div');
  container.id = 'temp-pdf-invoice-container';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // standard A4 pixel width at 96dpi
  container.style.background = '#ffffff';
  container.style.padding = '20px';
  container.innerHTML = generateInvoiceCardHTML(inc);
  document.body.appendChild(container);

  const cleanClient = inc.clientName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `PTS-Invoice-${cleanClient}-${safeId(inc.id)}.pdf`;

  if (window.html2pdf) {
    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    window.html2pdf()
      .set(opt)
      .from(container.firstElementChild || container)
      .save()
      .then(() => {
        if (container.parentNode) document.body.removeChild(container);
        showToast(`✅ Direct PDF invoice downloaded: ${filename}`);
      })
      .catch((err) => {
        console.error('html2pdf generation error, using printable view fallback:', err);
        if (container.parentNode) document.body.removeChild(container);
        window.printCurrentInvoice();
      });
  } else {
    if (container.parentNode) document.body.removeChild(container);
    window.printCurrentInvoice();
  }
};
window.downloadCurrentInvoice = window.downloadInvoicePDF;

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

  const newInc = {
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
  };
  STATE.income.unshift(newInc);
  syncIncomeToSupabase(newInc);

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

        const deleteExpBtn = `
          <button onclick="deleteExpense('${expId}')" class="p-1 rounded text-slate-400 hover:text-rose-600 transition" title="Delete Expense from Portal &amp; Database">
            🗑️
          </button>
        `;

        let actionCell = `<div class="flex items-center justify-end gap-1.5"><span class="text-amber-600 dark:text-amber-400 text-[11px] font-medium">Pending Sign-off</span>${deleteExpBtn}</div>`;
        if (currentRole === 'pranav') {
          if (exp.status === 'approved') {
            actionCell = `
              <div class="flex items-center justify-end gap-1.5">
                <span class="text-[10px] text-slate-400">Authorized</span>
                <button onclick="reverseExpense('${expId}')" class="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-600 hover:text-rose-700 text-[10px] font-bold transition" title="Reverse this expense with audit reason">
                  Reverse
                </button>
                ${deleteExpBtn}
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
                ${deleteExpBtn}
              </div>`;
          } else {
            actionCell = `<div class="flex items-center justify-end gap-1.5"><span class="text-[11px] text-slate-400 italic">${exp.status === 'rejected' ? 'Rejected' : 'Reversed'}</span>${deleteExpBtn}</div>`;
          }
        } else if (exp.status === 'approved') {
          actionCell = `<div class="flex items-center justify-end gap-1.5"><span class="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">✓ Approved</span>${deleteExpBtn}</div>`;
        } else if (exp.status === 'rejected') {
          actionCell = `<div class="flex items-center justify-end gap-1.5"><span class="text-rose-600 dark:text-rose-400 text-[11px] font-medium">✕ Rejected</span>${deleteExpBtn}</div>`;
        } else if (exp.status === 'reversed') {
          actionCell = `<div class="flex items-center justify-end gap-1.5"><span class="text-slate-500 text-[11px] font-medium">↺ Entry Reversed</span>${deleteExpBtn}</div>`;
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

  const newExp = {
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
  };
  STATE.expenses.unshift(newExp);
  syncExpenseToSupabase(newExp);

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

 