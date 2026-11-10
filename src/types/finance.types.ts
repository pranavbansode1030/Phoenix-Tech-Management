/**
 * Phoenix Tech Solution - Internal Finance Management System
 * Core Domain Types & Data Models
 * 
 * 3-Member Core Team:
 *  - Pranav Bansode (Founder / Director - Strategy, Finance & Final Decisions)
 *  - Arshad Shaikh (Co-Founder - Meetings, Marketing, Idea Research, Planning)
 *  - Vivek Gajdhane (Technical Department - Frontend, Backend, Implementation)
 */

export type UserRole = 'founder_director' | 'co_founder' | 'technical';

export interface TeamMember {
  id: string;
  name: string;
  role: UserRole;
  designation: string;
  responsibilities: string[];
  monthlyCompensation: number; // Configurable by Founder
  pendingCompensation: number;
  paymentsMade: number;
  incentivesEarned: number;
}

export type ProjectStatus = 'active' | 'completed' | 'pipeline' | 'on_hold';

export interface Project {
  id: string;
  code: string;
  name: string; // Initially "LeadX" & "Smart Review Management"
  description: string;
  status: ProjectStatus;
  revenueReceived: number; // Actual cash received
  directExpenses: number;
  allocatedOverhead: number;
  incentivePercentage: number; // Defined by Founder
  assignedMembers: string[]; // Member IDs
  createdAt: string;
}

export type PaymentMethod = 'bank_transfer' | 'upi' | 'cheque' | 'card' | 'other';
export type PaymentStatus = 'received' | 'pending' | 'partial';

export interface IncomeRecord {
  id: string;
  source: string;
  projectId: string;
  projectName: string;
  clientName: string;
  amount: number;
  gstAmount: number;
  totalWithGst: number;
  paymentDate: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdBy: string;
}

export type ExpenseCategory =
  | 'marketing_business'
  | 'technical_infrastructure'
  | 'software_tools'
  | 'team_compensation'
  | 'administrative'
  | 'direct_project_cost'
  | 'other';

export type ExpenseStatus = 'pending_approval' | 'approved' | 'rejected' | 'reversed';

export interface ExpenseRecord {
  id: string;
  title: string;
  category: ExpenseCategory;
  projectId?: string;
  projectName?: string;
  amount: number;
  gstAmount: number;
  totalPayment: number;
  date: string;
  paidBy: string; // Who paid / submitted
  description: string;
  status: ExpenseStatus;
  approvedBy?: string;
  receiptUrl?: string;
  isReversal?: boolean;
}

export type ReserveType = 'emergency' | 'operational' | 'product_dev' | 'tax';

export interface CompanyReserve {
  id: string;
  type: ReserveType;
  name: string;
  description: string;
  currentBalance: number;
  targetAmount: number;
  monthlyAllocation: number;
}

export interface ProjectIncentiveAllocation {
  id: string;
  projectId: string;
  projectName: string;
  eligibleContribution: number;
  incentivePool: number;
  allocations: {
    memberId: string;
    memberName: string;
    sharePercentage: number;
    amount: number;
    status: 'draft' | 'approved' | 'paid';
  }[];
  isApproved: boolean;
  approvedBy?: string;
}

export interface DashboardMetrics {
  totalMoneyReceived: number;
  totalBusinessExpenses: number;
  availableCompanyCash: number; // Unencumbered (Received - Expenses - Reserves - Taxes)
  pendingClientPayments: number;
  totalCompanyReserves: number;
  netBusinessProfit: number;
}
