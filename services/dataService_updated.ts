import { Transaction, TransactionStatus, TransactionType } from '../types';
import { MOCK_TRANSACTIONS } from '../constants';

const STORAGE_PREFIX = 'taxpulse_data_';
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

// --- CONFIGURATION: Matches your actual Google Sheet columns ---
// Based on your screenshot: A/A, DATE, CLIENT, DESCRIPTION, AMOUNT-EUR, AMOUNT-USD, NET, FPA, EE/US, MARK, AFM, AADE, INVOICE-LINK
const COLUMN_MAP = {
  id: 'A/A',
  date: 'DATE',
  clientName: 'CLIENT',
  description: 'DESCRIPTION',
  amountEur: 'AMOUNT-EUR',
  amountUsd: 'AMOUNT-USD',
  net: 'NET',
  fpa: 'FPA',
  eeUs: 'EE/US',
  mark: 'MARK',
  afm: 'AFM',
  aade: 'AADE',
  invoiceLink: 'INVOICE-LINK'
};

// Helper function to convert Google Sheet row to App Transaction
const mapRowToTransaction = (row: any): Transaction => {
  // Determine Type - all expenses for now (you mentioned expense sheet)
  // If you later add income to this sheet or have a separate income sheet, adjust here
  const type = TransactionType.EXPENSE;

  // Determine Status based on AADE column and MARK
  let status = TransactionStatus.MANUAL_REVIEW;
  const aadeValue = row[COLUMN_MAP.aade]?.toString().toUpperCase() || '';
  
  if (row[COLUMN_MAP.mark] && row[COLUMN_MAP.mark].length > 5) {
    status = TransactionStatus.OFFICIAL;
  } else if (aadeValue === 'MANUAL_REVIEW_REQUIRED') {
    status = TransactionStatus.MANUAL_REVIEW;
  } else if (aadeValue === 'OFFICIAL') {
    status = TransactionStatus.OFFICIAL;
  }

  return {
    id: row[COLUMN_MAP.id]?.toString() || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: row[COLUMN_MAP.date] || new Date().toISOString(),
    clientName: row[COLUMN_MAP.clientName] || 'Unknown Client',
    description: row[COLUMN_MAP.description] || 'No description',
    amount: parseFloat(row[COLUMN_MAP.net]) || 0,
    vatAmount: parseFloat(row[COLUMN_MAP.fpa]) || 0,
    grossAmount: parseFloat(row[COLUMN_MAP.amountEur]) || 0,
    afm: row[COLUMN_MAP.afm] || '',
    mark: row[COLUMN_MAP.mark] || '',
    type: type,
    status: status,
  };
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getStoredTransactions = async (userId: string): Promise<Transaction[]> => {
  // Try to fetch from n8n webhook
  if (N8N_WEBHOOK_URL) {
    try {
      console.log('📡 Fetching transactions from n8n webhook...');
      
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getTransactions',
          userId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`n8n webhook returned status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Received response from n8n:', data);
      
      // Handle the response structure
      let dataArray = [];
      if (data.transactions && Array.isArray(data.transactions)) {
        dataArray = data.transactions;
      } else if (Array.isArray(data)) {
        dataArray = data;
      } else if (data.data && Array.isArray(data.data)) {
        dataArray = data.data;
      }
      
      if (dataArray.length > 0) {
        // If n8n already formatted the data in the correct structure, use it directly
        // Otherwise, map it using our mapper
        const firstItem = dataArray[0];
        
        let mapped: Transaction[];
        if (firstItem.id && firstItem.amount !== undefined && firstItem.type) {
          // Data is already in Transaction format from n8n
          console.log('✅ Data already formatted by n8n');
          mapped = dataArray as Transaction[];
        } else {
          // Data needs mapping from Google Sheet format
          console.log('🔄 Mapping Google Sheet data to Transaction format');
          mapped = dataArray.map(mapRowToTransaction);
        }
        
        console.log(`✅ Successfully processed ${mapped.length} transactions`);
        
        // Cache in localStorage for offline access
        const cacheKey = `${STORAGE_PREFIX}${userId}`;
        localStorage.setItem(cacheKey, JSON.stringify(mapped));
        localStorage.setItem(`${cacheKey}_timestamp`, new Date().toISOString());
        
        return mapped;
      }
      
      console.warn('⚠️ No transactions found in response');
      return [];
      
    } catch (error) {
      console.error('❌ n8n API Error:', error);
      console.log('📦 Attempting to load from cache...');
      
      // Try to load from cache
      const cached = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
      const cacheTimestamp = localStorage.getItem(`${STORAGE_PREFIX}${userId}_timestamp`);
      
      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          console.log(`📦 Loaded ${cachedData.length} transactions from cache (last updated: ${cacheTimestamp || 'unknown'})`);
          return cachedData;
        } catch (e) {
          console.error('❌ Failed to parse cached data:', e);
        }
      }
      
      console.log('⚠️ No cached data available');
    }
  } else {
    console.warn('⚠️ N8N_WEBHOOK_URL not configured, using fallback data');
  }

  // Fallback to mock data if no n8n URL or all else fails
  await delay(300);
  const key = `${STORAGE_PREFIX}${userId}`;
  const stored = localStorage.getItem(key);
  
  if (!stored) {
    console.log('📝 Using mock transactions (no cached data)');
    const seededData = MOCK_TRANSACTIONS;
    localStorage.setItem(key, JSON.stringify(seededData));
    return seededData;
  }
  
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('❌ Failed to parse stored data, using mock:', e);
    return MOCK_TRANSACTIONS;
  }
};

export const saveTransactionUpdate = async (userId: string, updatedTx: Transaction): Promise<void> => {
  if (N8N_WEBHOOK_URL) {
    try {
      console.log('💾 Saving transaction update via n8n...');
      
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateTransaction',
          userId,
          transaction: updatedTx,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update via n8n: ${response.status}`);
      }
      
      console.log('✅ Transaction updated on server');
      
      // Update local cache
      const current = await getStoredTransactions(userId);
      const newData = current.map(t => t.id === updatedTx.id ? updatedTx : t);
      localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(newData));
      
      return;
    } catch (error) {
      console.error('❌ API Update Error:', error);
      throw error;
    }
  }

  // Local Storage Fallback
  console.log('💾 Saving to local storage (no n8n URL configured)');
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
  console.log('✅ New transaction synced locally');
};

// Utility function to check connection status
export const checkN8nConnection = async (): Promise<{ connected: boolean; message: string }> => {
  if (!N8N_WEBHOOK_URL) {
    return { connected: false, message: 'N8N_WEBHOOK_URL not configured in environment variables' };
  }
  
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ping' }),
    });
    
    if (response.ok) {
      return { connected: true, message: 'Connected to n8n successfully' };
    }
    
    return { connected: false, message: `n8n returned status: ${response.status}` };
  } catch (error) {
    return { connected: false, message: `Connection failed: ${error}` };
  }
};
