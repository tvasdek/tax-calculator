// Transaction Types
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum TransactionStatus {
  OFFICIAL = 'OFFICIAL',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD format
  clientName: string;
  description: string;
  amount: number; // NET amount
  vatAmount: number; // FPA
  grossAmount: number; // AMOUNT-EUR
  afm: string;
  mark: string;
  type: TransactionType;
  status: TransactionStatus;
  invoiceLink?: string; // NEW: Link to invoice (AADE for expenses, SharePoint for income)
  isNew?: boolean; // Flag for new transactions
}

export interface TaxProjection {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  taxableIncome: number;
  estimatedTax: number;
  currentYearTax: number;
  advancePayment: number;
  telosEpitideumatos: number;
  incomeCount: number;
  expenseCount: number;
}

export interface MonthlyStats {
  month: string;
  income: number;
  expenses: number;
}

export type ViewState = 'DASHBOARD' | 'TRANSACTIONS';
