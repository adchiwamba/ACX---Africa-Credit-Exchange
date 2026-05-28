import { UserProfile, UserRole, LoanRequest, LoanStatus, Investment, Repayment } from '../types';

// Mock Initial Data
export const MOCK_USERS: UserProfile[] = [
  {
    uid: 'borrower_1',
    email: 'borrower@example.com',
    displayName: 'ACX Portal',
    role: UserRole.BORROWER,
    creditScore: 720,
    kycStatus: 'VERIFIED',
    currency: 'USD',
    preferredCurrencies: ['USD', 'EUR'],
    balance: 5000,
    country: 'Zimbabwe',
    languages: ['English', 'Shona'],
    is2FAEnabled: false
  },
  {
    uid: 'lender_1',
    email: 'lender@example.com',
    displayName: 'Alpha Capital',
    role: UserRole.LENDER,
    creditScore: 800,
    kycStatus: 'VERIFIED',
    currency: 'USD',
    preferredCurrencies: ['USD', 'GBP'],
    balance: 250000,
    country: 'Kenya',
    languages: ['English'],
    is2FAEnabled: true,
    organizationDetails: {
      companySize: '50-100',
      contactPerson: 'Jane Doe',
      industry: 'Fintech'
    }
  },
  {
    uid: 'admin_1',
    email: 'admin@acx.africa',
    displayName: 'ACX Admin',
    role: UserRole.ADMIN,
    creditScore: 850,
    kycStatus: 'VERIFIED',
    currency: 'USD',
    preferredCurrencies: ['USD'],
    balance: 0,
    country: 'United States',
    languages: ['English'],
    is2FAEnabled: true
  }
];

export const MOCK_LOANS: LoanRequest[] = [
  {
    id: 'loan_1',
    borrowerId: 'borrower_1',
    amount: 50000,
    currency: 'USD',
    purpose: 'Inventory Expansion',
    durationMonths: 12,
    interestRate: 8.5,
    status: LoanStatus.APPROVED,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    creditScoreSnapshot: 710,
    alternativeDataMetrics: {
      socialTrust: 0.8,
      transactionVolume: 120000
    }
  },
  {
    id: 'loan_2',
    borrowerId: 'borrower_1',
    amount: 12000,
    currency: 'USD',
    purpose: 'Equipment Upgrade',
    durationMonths: 6,
    interestRate: 7.2,
    status: LoanStatus.FUNDED,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    fundedAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
    creditScoreSnapshot: 720,
    alternativeDataMetrics: {
      socialTrust: 0.85,
      transactionVolume: 130000
    }
  },
  {
    id: 'loan_3',
    borrowerId: 'borrower_1',
    amount: 25000,
    currency: 'USD',
    purpose: 'Digital Transformation',
    durationMonths: 24,
    interestRate: 10.5,
    status: LoanStatus.PENDING,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    creditScoreSnapshot: 680,
    alternativeDataMetrics: {
      socialTrust: 0.75,
      transactionVolume: 80000
    }
  },
  {
    id: 'loan_4',
    borrowerId: 'borrower_1',
    amount: 75000,
    currency: 'USD',
    purpose: 'Retail Expansion Phase II',
    durationMonths: 36,
    interestRate: 12.0,
    status: LoanStatus.COMPLETED,
    createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
    creditScoreSnapshot: 750,
    alternativeDataMetrics: {
      socialTrust: 0.9,
      transactionVolume: 250000
    }
  }
];

export const MOCK_INVESTMENTS: Investment[] = [
  {
    id: 'inv_1',
    lenderId: 'lender_1',
    loanId: 'loan_2',
    amount: 12000,
    createdAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const MOCK_REPAYMENTS: Repayment[] = [
  {
    id: 'rep_1',
    loanId: 'loan_2',
    amount: 2000,
    dueDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    paidDate: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'PAID'
  },
  {
    id: 'rep_2',
    loanId: 'loan_2',
    amount: 2000,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'PENDING'
  }
];
