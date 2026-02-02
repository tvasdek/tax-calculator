export enum TransactionStatus {
  OFFICIAL = 'OFFICIAL',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface Transaction {
  id: string;
  date: string; // ISO Date string
  clientName: string;
  description: string;
  amount: number; // Net amount
  vatAmount: number;
  grossAmount: number;
  type: TransactionType;
  status: TransactionStatus;
  afm?: string;
  mark?: string;
  category?: string;
}

export interface TaxProjection {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  taxableIncome: number;
  estimatedTax: number;
  expenseCount: number;
  incomeCount: number;
  
  // ADD THESE THREE LINES:
  currentYearTax?: number;      // 20% tax on profit
  advancePayment?: number;       // 80% advance payment  
  telosEpitideumatos?: number;   // €800 fixed fee
}

export interface MonthlyStats {
  month: string; // "Jan", "Feb" etc
  income: number;
  expenses: number;
}

export type ViewState = 'DASHBOARD' | 'TRANSACTIONS';