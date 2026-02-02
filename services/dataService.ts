import { Transaction, TransactionStatus, TransactionType } from '../types';
import { MOCK_TRANSACTIONS } from '../constants';

const STORAGE_PREFIX = 'taxpulse_data_';
const N8N_API_URL = import.meta.env.VITE_N8N_API_URL; // defined in .env

// --- CONFIGURATION: MAP YOUR GOOGLE SHEET COLUMNS HERE ---
// Replace the values on the right with the EXACT header names from your n8n output / Google Sheet
const COLUMN_MAP = {
  date: 'invoice_date',        // e.g., 'Ημερομηνία'
  clientName: 'counterparty',  // e.g., 'Επωνυμία'
  description: 'reason',       // e.g., 'Αιτιολογία'
  amount: 'net_value',         // e.g., 'Καθαρή Αξία'
  vatAmount: 'vat_value',      // e.g., 'ΦΠΑ'
  grossAmount: 'total_value',  // e.g., 'Συνολική Αξία'
  mark: 'mark_id',             // e.g., 'MARK'
  afm: 'vat_number',           // e.g., 'ΑΦΜ'
  type: 'type',               // e.g., 'Είδος' (Values should be 'INCOME' or 'EXPENSE')
};

// Helper function to convert n8n/Sheet row to App Transaction
const mapRowToTransaction = (row: any): Transaction => {
  // Determine Type (Income/Expense) based on your logic
  // Example: If your sheet says "Esoda" or "Exoda", normalize it here
  let type = TransactionType.EXPENSE;
  const rowType = row[COLUMN_MAP.type]?.toString().toUpperCase() || '';
  if (rowType.includes('INCOME') || rowType.includes('ESODA') || rowType.includes('ΕΣΟΔΑ')) {
    type = TransactionType.INCOME;
  }

  // Determine Status based on if MARK exists
  let status = TransactionStatus.MANUAL_REVIEW;
  if (row[COLUMN_MAP.mark] && row[COLUMN_MAP.mark].length > 5) {
    status = TransactionStatus.OFFICIAL;
  }

  return {
    id: row.id || Math.random().toString(36).substr(2, 9), // Use ID from sheet or generate one
    date: row[COLUMN_MAP.date] || new Date().toISOString(),
    clientName: row[COLUMN_MAP.clientName] || 'Unknown Client',
    description: row[COLUMN_MAP.description] || 'No description',
    amount: parseFloat(row[COLUMN_MAP.amount]) || 0,
    vatAmount: parseFloat(row[COLUMN_MAP.vatAmount]) || 0,
    grossAmount: parseFloat(row[COLUMN_MAP.grossAmount]) || 0,
    afm: row[COLUMN_MAP.afm],
    mark: row[COLUMN_MAP.mark],
    type: type,
    status: status,
  };
};

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getStoredTransactions = async (userId: string): Promise<Transaction[]> => {
  // 1. If N8N URL is configured, fetch from real backend
  if (N8N_API_URL) {
    try {
      const response = await fetch(`${N8N_API_URL}/transactions?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch from n8n');
      
      const rawData = await response.json();
      
      // Convert the raw Google Sheet data using our mapper
      if (Array.isArray(rawData)) {
        return rawData.map(mapRowToTransaction);
      }
      return [];
    } catch (error) {
      console.error("API Error, falling back to offline mode if cached", error);
    }
  }

  // 2. Fallback: LocalStorage Logic
  await delay(300); 
  const key = `${STORAGE_PREFIX}${userId}`;
  const stored = localStorage.getItem(key);
  
  if (!stored) {
    const seededData = MOCK_TRANSACTIONS;
    localStorage.setItem(key, JSON.stringify(seededData));
    return seededData;
  }
  
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const saveTransactionUpdate = async (userId: string, updatedTx: Transaction): Promise<void> => {
  if (N8N_API_URL) {
    try {
      // When sending BACK to n8n, you might want to send the App structure
      // or map it back to Google Sheet columns. Sending App structure is usually safer.
      const response = await fetch(`${N8N_API_URL}/update-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updatedTx }),
      });
      if (!response.ok) throw new Error('Failed to update via n8n');
      return;
    } catch (error) {
      console.error("API Update Error", error);
      throw error;
    }
  }

  // Local Storage Fallback
  await delay(300);
  const key = `${STORAGE_PREFIX}${userId}`;
  const current = await getStoredTransactions(userId);
  const newData = current.map(t => t.id === updatedTx.id ? updatedTx : t);
  localStorage.setItem(key, JSON.stringify(newData));
};

export const syncNewTransactions = async (userId: string, newTx: Transaction): Promise<void> => {
  const current = await getStoredTransactions(userId);
  const newData = [newTx, ...current];
  localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(newData));
};