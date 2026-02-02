import { Transaction, TransactionStatus, TransactionType } from './types';

export const TAX_RATE = 0.2; // Simplified 20% tax rate for OE
export const CURRENT_YEAR = 2024;

const generateId = () => Math.random().toString(36).substr(2, 9);

export const MOCK_TRANSACTIONS: Transaction[] = [
  // Income - Official
  {
    id: generateId(),
    date: '2024-01-15',
    clientName: 'Tech Solutions SA',
    description: 'Software Development Services - Jan',
    amount: 5000,
    vatAmount: 1200,
    grossAmount: 6200,
    type: TransactionType.INCOME,
    status: TransactionStatus.OFFICIAL,
    mark: '123456789',
    afm: '099999999',
  },
  {
    id: generateId(),
    date: '2024-02-15',
    clientName: 'Tech Solutions SA',
    description: 'Software Development Services - Feb',
    amount: 5000,
    vatAmount: 1200,
    grossAmount: 6200,
    type: TransactionType.INCOME,
    status: TransactionStatus.OFFICIAL,
    mark: '123456790',
  },
  {
    id: generateId(),
    date: '2024-03-10',
    clientName: 'Global Corp',
    description: 'Consulting Project Alpha',
    amount: 8500,
    vatAmount: 2040,
    grossAmount: 10540,
    type: TransactionType.INCOME,
    status: TransactionStatus.OFFICIAL,
    mark: '123456791',
  },
  
  // Expenses - Official
  {
    id: generateId(),
    date: '2024-01-05',
    clientName: 'O.T.E. SA',
    description: 'Internet & Telephony',
    amount: 120,
    vatAmount: 28.8,
    grossAmount: 148.8,
    type: TransactionType.EXPENSE,
    status: TransactionStatus.OFFICIAL,
    mark: '987654321',
  },
  {
    id: generateId(),
    date: '2024-02-01',
    clientName: 'Plaisio Computers',
    description: 'Office Equipment - Monitors',
    amount: 600,
    vatAmount: 144,
    grossAmount: 744,
    type: TransactionType.EXPENSE,
    status: TransactionStatus.OFFICIAL,
    mark: '987654322',
  },

  // Expenses - Manual Review (From Email Workflow)
  {
    id: generateId(),
    date: '2024-03-25',
    clientName: 'Unknown Vendor',
    description: 'Lunch meeting with client?',
    amount: 85.50,
    vatAmount: 10,
    grossAmount: 95.50,
    type: TransactionType.EXPENSE,
    status: TransactionStatus.MANUAL_REVIEW,
  },
  {
    id: generateId(),
    date: '2024-03-28',
    clientName: 'Amazon Web Services',
    description: 'Server Costs',
    amount: 240.00,
    vatAmount: 0,
    grossAmount: 240.00,
    type: TransactionType.EXPENSE,
    status: TransactionStatus.MANUAL_REVIEW,
  }
];