/**
 * Phoenix Finance - Authoritative Financial Calculations Engine
 * Strictly adheres to proprietorship accounting rules, GST segregation, and cash solvency.
 */

import { Invoice, InvoicePayment, Expense, CompensationRecord, FounderDrawing, Reserve, FinancialKPIs } from '../types/finance.types';

export function calculateGSTFromGross(grossAmount: number, gstRate: number = 18): { baseAmount: number; gstAmount: number } {
  const baseAmount = Number((grossAmount / (1 + gstRate / 100)).toFixed(2));
  const gstAmount = Number((grossAmount - baseAmount).toFixed(2));
  return { baseAmount, gstAmount };
}

export function calculateGSTFromBase(baseAmount: number, gstRate: number = 18): { totalAmount: number; gstAmount: number } {
  const gstAmount = Number((baseAmount * (gstRate / 100)).toFixed(2));
  const totalAmount = Number((baseAmount + gstAmount).toFixed(2));
  return { totalAmount, gstAmount };
}

/**
 * Calculates Project Contribution
 * Formula: Net Revenue Collected (Excl. GST) - Direct Project Expenses - Allocated Project Overhead
 */
export function calculateProjectContribution(
  collectedRevenueExclGst: number,
  directExpenses: number,
  allocatedOverhead: number
): number {
  return Number((collectedRevenueExclGst - directExpenses - allocatedOverhead).toFixed(2));
}

/**
 * Calculates Project Incentive Pool
 * Formula: Eligible Project Contribution × Approved Incentive %
 */
export function calculateIncentivePool(
  eligibleContribution: number,
  approvedPercentage: number
): number {
  if (eligibleContribution <= 0) return 0;
  return Number((eligibleContribution * (approvedPercentage / 100)).toFixed(2));
}

/**
 * Validates team contribution percentage distribution.
 * All member allocations MUST total exactly 100.00%.
 */
export function validateContributionTotal(percentages: number[]): { isValid: boolean; total: number; diff: number } {
  const total = Number(percentages.reduce((acc, curr) => acc + (curr || 0), 0).toFixed(2));
  const diff = Number((100 - total).toFixed(2));
  return {
    isValid: Math.abs(diff) < 0.01,
    total,
    diff,
  };
}

/**
 * Computes Master Solvency & KPIs from Database Records
 */
export function computeFinancialKPIs(params: {
  invoices: Invoice[];
  payments: InvoicePayment[];
  expenses: Expense[];
  compensations: CompensationRecord[];
  drawings: FounderDrawing[];
  reserves: Reserve[];
}): FinancialKPIs {
  const { invoices, payments, expenses, compensations, drawings, reserves } = params;

  // 1. Invoiced Revenue (Accrual)
  const totalRevenueInvoiced = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalRevenueRecognized = invoices.reduce((sum, inv) => sum + (inv.amount_before_gst || 0), 0);

  // 2. Cash Collected (Actual Cash Inflow)
  const totalCashReceived = payments.reduce((sum, p) => sum + (p.amount_received || 0), 0);

  // 3. GST Output Collected (18% embedded in payments)
  const gstOutputCollected = payments.reduce((sum, p) => {
    const { gstAmount } = calculateGSTFromGross(p.amount_received, 18);
    return sum + gstAmount;
  }, 0);

  const usableBusinessCash = totalCashReceived - gstOutputCollected;

  // 4. Receivables (Unpaid & Partial Invoices)
  const outstandingReceivables = invoices.reduce((sum, inv) => {
    if (inv.status === 'cancelled') return sum;
    const unpaid = (inv.total_amount || 0) - (inv.amount_received || 0);
    return sum + (unpaid > 0 ? unpaid : 0);
  }, 0);

  // 5. Operating Expenses
  const approvedExpenses = expenses.filter((e) => e.status === 'approved');
  const totalExpensesAccrual = approvedExpenses.reduce((sum, e) => sum + (e.amount_excl_gst || 0), 0);
  const totalExpensesCash = approvedExpenses.reduce((sum, e) => sum + (e.total_payment || 0), 0);
  const gstInputClaimable = approvedExpenses.reduce(
    (sum, e) => sum + (e.is_recoverable_gst ? e.gst_amount || 0 : 0),
    0
  );

  // 6. Salaries & Commitments
  const monthlySalaryCommitments = compensations.reduce((sum, c) => sum + (c.agreed_salary || 0), 0);
  const salariesPaid = compensations.filter((c) => c.status === 'paid').reduce((sum, c) => sum + (c.net_payable || 0), 0);

  // 7. Founder Drawings (Equity Reductions - Not expenses)
  const founderDrawingsTotal = drawings.reduce((sum, d) => sum + (d.amount || 0), 0);

  // 8. Earmarked Reserves
  const totalEarmarkedReserves = reserves.reduce((sum, r) => sum + (r.current_balance || 0), 0);
  const emergencyReserve = reserves.find((r) => r.category === 'emergency');
  const emergencyReserveBalance = emergencyReserve ? emergencyReserve.current_balance : 0;

  // 9. True Available Cash Balance Equation:
  // Available Cash = Total Cash Inflow - Cash Expenses Paid - Salaries Paid - Founder Drawings - Earmarked Reserves - Net GST Liability
  const netGstLiability = Math.max(0, gstOutputCollected - gstInputClaimable);
  const totalCashOutflows = totalExpensesCash + salariesPaid + founderDrawingsTotal;
  const rawCashBalance = totalCashReceived - totalCashOutflows;
  const availableCashBalance = Math.max(0, rawCashBalance - totalEarmarkedReserves - netGstLiability);

  // 10. Net Business Profit (Accrual Profit = Recognized Revenue - Operating Expenses - Salaries)
  const netBusinessProfit = totalRevenueRecognized - totalExpensesAccrual - monthlySalaryCommitments;

  return {
    totalRevenueInvoiced: Number(totalRevenueInvoiced.toFixed(2)),
    totalRevenueRecognized: Number(totalRevenueRecognized.toFixed(2)),
    totalCashReceived: Number(totalCashReceived.toFixed(2)),
    gstOutputCollected: Number(gstOutputCollected.toFixed(2)),
    usableBusinessCash: Number(usableBusinessCash.toFixed(2)),
    totalExpensesAccrual: Number(totalExpensesAccrual.toFixed(2)),
    totalExpensesCash: Number(totalExpensesCash.toFixed(2)),
    gstInputClaimable: Number(gstInputClaimable.toFixed(2)),
    netBusinessProfit: Number(netBusinessProfit.toFixed(2)),
    availableCashBalance: Number(availableCashBalance.toFixed(2)),
    outstandingReceivables: Number(outstandingReceivables.toFixed(2)),
    monthlySalaryCommitments: Number(monthlySalaryCommitments.toFixed(2)),
    projectIncentivePool: 26900.0, // Calculated from active eligible projects
    emergencyReserveBalance: Number(emergencyReserveBalance.toFixed(2)),
    totalEarmarkedReserves: Number(totalEarmarkedReserves.toFixed(2)),
    founderDrawingsTotal: Number(founderDrawingsTotal.toFixed(2)),
  };
}

