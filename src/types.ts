/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  BORROWER = 'BORROWER',
  LENDER = 'LENDER',
  INVESTOR = 'INVESTOR',
  BANK = 'BANK',
  RETAILER = 'RETAILER',
  ADMIN = 'ADMIN'
}

export enum LoanStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  FUNDED = 'FUNDED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  DELINQUENT = 'DELINQUENT',
  DEFAULTED = 'DEFAULTED'
}

export interface BorrowerProfileData {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  idNumber: string;
  taxNumber: string;
  nationality: string;
  maritalStatus: string;
  email: string;
  address: string;
  gpsData: string;
  phone: string;
  employer: string;
  industry: string;
  employmentStatus: string;
  jobTitle: string;
  yearsEmployed: number;
  payrollNumber: string;
  grossSalary: number;
  netSalary: number;
  incomeFrequency: string;
  mortgageRent: number;
  monthlyExpenses: number;
  debtRatio: number;
  savingsBehavior: string;
  insuranceCoverage: string;
  mobileMoneyUsage: string;
  utilityPaymentHistory: string;
  eCommerceActivity: string;
  deviceConsistency: string;
  isSME: boolean;
  businessName: string;
  businessReg: string;
  businessTurnover: number;
  desiredAmount: number;
  preferredTenure: number;
  loanPurpose: string;
}

export interface VerificationResult {
  status: 'MATCH' | 'MISMATCH' | 'PENDING' | 'ERROR' | 'NONE';
  value?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  password?: string;
  physicalAddress?: string;
  latitude?: number;
  longitude?: number;
  role: UserRole;
  creditScore: number;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  currency: string;
  preferredCurrencies: string[];
  balance: number;
  country?: string;
  phoneCode?: string;
  languages?: string[];
  photoURL?: string;
  organizationDetails?: {
    companySize: string;
    contactPerson: string;
    industry: string;
    taxId?: string;
    yieldPools?: Record<string, { principal: number; timestamp: string }>;
  };
  borrowerDetails?: {
    profile: BorrowerProfileData;
    uploads: Record<string, boolean>;
    verificationResults?: Record<string, VerificationResult>;
    scoreResult: CreditScoreResult | null;
    lastUpdated?: string;
  };
  is2FAEnabled: boolean;
  inventory?: StockItem[];
  isBlacklisted?: boolean;
  delinquencyStage?: 'NONE' | 'INITIAL' | 'WRITTEN' | 'FINAL' | 'BLACKLISTED';
}

export interface CreditScoreResult {
  score: number;
  reasoning: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  ratingCategory: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'C';
  factors: {
    factor: string;
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    score: number;
  }[];
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  description: string;
  stockQuantity: number;
  lowStockThreshold: number;
  barcode?: string;
  image?: string;
}

export interface LoanRequest {
  id: string;
  borrowerId: string;
  lenderId?: string;
  amount: number;
  currency: string;
  purpose: string;
  durationMonths: number;
  interestRate: number;
  status: LoanStatus;
  createdAt: string;
  approvedAt?: string;
  fundedAt?: string;
  creditScoreSnapshot: number;
  alternativeDataMetrics: Record<string, unknown>;
}

export interface Investment {
  id: string;
  lenderId: string;
  loanId: string;
  amount: number;
  createdAt: string;
}

export enum AuditEventType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOAN_APPLIED = 'LOAN_APPLIED',
  LOAN_APPROVED = 'LOAN_APPROVED',
  LOAN_REJECTED = 'LOAN_REJECTED',
  KYC_UPDATED = 'KYC_UPDATED',
  CREDIT_SCORED = 'CREDIT_SCORED',
  REPAYMENT_MADE = 'REPAYMENT_MADE',
  DELINQUENCY_WARNING_ISSUED = 'DELINQUENCY_WARNING_ISSUED',
  BORROWER_BLACKLISTED = 'BORROWER_BLACKLISTED',
  SYSTEM_CONFIG_CHANGED = 'SYSTEM_CONFIG_CHANGED'
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  eventType: AuditEventType;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface Repayment {
  id: string;
  loanId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
}

export enum WarningType {
  INITIAL_REMINDER = 'INITIAL_REMINDER',
  WRITTEN = 'WRITTEN',
  FINAL_DEMAND = 'FINAL_DEMAND'
}

export interface DefaultWarning {
  id: string;
  borrowerId: string;
  loanId: string;
  type: WarningType;
  issuedAt: string;
  content: string;
}

export interface BlacklistRecord {
  id: string;
  borrowerId: string;
  borrowerName: string;
  reason: string;
  comments: string;
  blacklistedBy: string; // Lender ID or name
  createdAt: string;
  severity: 'MODERATE' | 'HIGH' | 'CRITICAL';
  isPublic: boolean;
}
