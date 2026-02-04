import { Transaction, TransactionStatus, TransactionType } from '../types';

const STORAGE_PREFIX = 'taxpulse_data_';
const LAST_SEEN_PREFIX = 'taxpulse_last_seen_';
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

// Helper to create a stable transaction key
const createTransactionKey = (t: Transaction): string => {
  return `${t.date}-${t.clientName}-${t.grossAmount}-${t.type}`;
};

// Get last seen transaction keys
const getLastSeenTransactionKeys = (userId: string): Set<string> => {
  const key = `${LAST_SEEN_PREFIX}${userId}`;
  const stored = localStorage.getItem(key);
  
  if (!stored) return new Set();
  
  try {
    const parsed = JSON.parse(stored);
    return new Set(parsed);
  } catch (e) {
    console.error('Failed to parse last seen keys:', e);
    return new Set();
  }
};

// Save last seen transaction keys
const saveLastSeenTransactionKeys = (userId: string, keys: string[]) => {
  const key = `${LAST_SEEN_PREFIX}${userId}`;
  localStorage.setItem(key, JSON.stringify(keys));
};

// Helper to parse and normalize dates
const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr.split('T')[0];
  }
  
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    try {
      const [part1, part2, year] = dateStr.split('/');
      if (parseInt(part1) <= 12) {
        const month = part1.padStart(2, '0');
        const day = part2.padStart(2, '0');
        return `${year}-${month}-${day}`;
      } else {
        const day = part1.padStart(2, '0');
        const month = part2.padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      console.warn('Failed to parse date:', dateStr, e);
      return new Date().toISOString().split('T')[0];
    }
  }
  
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch (e) {
    console.warn('Failed to parse date:', dateStr, e);
  }
  
  return new Date().toISOString().split('T')[0];
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getStoredTransactions = async (userId: string): Promise<Transaction[]> => {
  if (N8N_WEBHOOK_URL) {
    try {
      console.log('📡 Fetching transactions from n8n webhook...');
      
      // Get last seen transaction keys BEFORE fetching
      const lastSeenKeys = getLastSeenTransactionKeys(userId);
      console.log('🔑 Last seen transaction count:', lastSeenKeys.size);
      
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
      console.log('✅ Received response from n8n');
      
      // Handle different response structures
      let dataArray = [];
      
      if (Array.isArray(data)) {
        dataArray = data;
      } else if (data.transactions && Array.isArray(data.transactions)) {
        dataArray = data.transactions;
      } else if (data.data && Array.isArray(data.data)) {
        dataArray = data.data;
      } else if (typeof data === 'object' && data !== null) {
        dataArray = [data];
      }
      
      console.log('📊 Data array length:', dataArray.length);
      
      if (dataArray.length > 0) {
        const mapped: Transaction[] = dataArray.map((item: any, index: number): Transaction => {
          // Check what fields are available
          const hasTransactionFields = item.id && item.type && item.status;
          const hasSheetFields = item.DATE || item.CLIENT || item['AMOUNT-EUR'];
          
          if (hasTransactionFields) {
            // n8n already formatted it
            return {
              id: item.id || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              date: normalizeDate(item.date || ''),
              clientName: item.clientName || 'Unknown',
              description: item.description || '',
              amount: parseFloat(item.amount) || 0,
              vatAmount: parseFloat(item.vatAmount) || 0,
              grossAmount: parseFloat(item.grossAmount) || 0,
              afm: item.afm || '',
              mark: item.mark || '',
              invoiceLink: item.invoiceLink || '', // NEW: Include invoice link
              type: item.type || TransactionType.EXPENSE,
              status: item.status || TransactionStatus.MANUAL_REVIEW,
            };
          } else if (hasSheetFields) {
            // Raw Google Sheets data
            const aadeValue = item.AADE?.toString().toUpperCase() || '';
            let status = TransactionStatus.MANUAL_REVIEW;
            
            if (item.MARK && item.MARK.length > 5) {
              status = TransactionStatus.OFFICIAL;
            } else if (aadeValue === 'MANUAL_REVIEW_REQUIRED') {
              status = TransactionStatus.MANUAL_REVIEW;
            } else if (aadeValue === 'OFFICIAL') {
              status = TransactionStatus.OFFICIAL;
            }
            
            return {
              id: item['A/A']?.toString() || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              date: normalizeDate(item.DATE || ''),
              clientName: item.CLIENT || 'Unknown',
              description: item.DESCRIPTION || '',
              amount: parseFloat(item.NET) || 0,
              vatAmount: parseFloat(item.FPA) || 0,
              grossAmount: parseFloat(item['AMOUNT-EUR']) || 0,
              afm: item.AFM || '',
              mark: item.MARK || '',
              invoiceLink: item.INVOICE_LINK || '', // NEW: Map invoice link
              type: TransactionType.EXPENSE,
              status: status,
            };
          } else {
            // Unknown format
            console.warn('Unknown item format:', item);
            return {
              id: `tx-unknown-${index}`,
              date: normalizeDate(new Date().toISOString()),
              clientName: 'Unknown Format',
              description: JSON.stringify(item),
              amount: 0,
              vatAmount: 0,
              grossAmount: 0,
              afm: '',
              mark: '',
              type: TransactionType.EXPENSE,
              status: TransactionStatus.MANUAL_REVIEW,
            };
          }
        });
        
        console.log(`✅ Successfully processed ${mapped.length} transactions`);
        
        // Sort by date descending (newest first)
        mapped.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Mark new transactions by comparing with last seen
        const currentKeys: string[] = [];
        let newCount = 0;
        
        const markedTransactions = mapped.map(t => {
          const key = createTransactionKey(t);
          currentKeys.push(key);
          
          const isNew = !lastSeenKeys.has(key);
          if (isNew) {
            newCount++;
            console.log('✨ NEW transaction detected:', key);
          }
          
          return {
            ...t,
            isNew, // Mark as new if not in last seen
          };
        });
        
        console.log(`🎉 Found ${newCount} new transaction(s) out of ${mapped.length} total`);
        
        // Save current transaction keys as "last seen" for next time
        saveLastSeenTransactionKeys(userId, currentKeys);
        
        console.log('📊 Sample of sorted data (first 3 - newest):');
        markedTransactions.slice(0, 3).forEach((t, i) => {
          console.log(`Transaction ${i}:`, {
            date: t.date,
            client: t.clientName,
            amount: t.grossAmount,
            isNew: t.isNew
          });
        });
        
        // Cache in localStorage
        const cacheKey = `${STORAGE_PREFIX}${userId}`;
        localStorage.setItem(cacheKey, JSON.stringify(markedTransactions));
        localStorage.setItem(`${cacheKey}_timestamp`, new Date().toISOString());
        
        return markedTransactions;
      }
      
      console.warn('⚠️ No transactions found in response');
      return [];
    } catch (error) {
      console.error('❌ API Fetch Error:', error);
      throw error;
    }
  }

  console.log('💾 Loading from local storage (no n8n URL configured)');
  await delay(300);
  const key = `${STORAGE_PREFIX}${userId}`;
  const stored = localStorage.getItem(key);
  
  if (!stored) return [];
  
  try {
    const parsed = JSON.parse(stored);
    // Sort local data too
    parsed.sort((a: Transaction, b: Transaction) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    return parsed;
  } catch (e) {
    console.error('Failed to parse stored transactions:', e);
    return [];
  }
};

export const saveTransactionUpdate = async (userId: string, updatedTx: Transaction): Promise<void> => {
  const updateWebhookUrl = N8N_WEBHOOK_URL?.replace('/get-all-transactions', '/update-transaction');
  
  if (updateWebhookUrl && N8N_WEBHOOK_URL) {
    try {
      console.log('════════════════════════════════════');
      console.log('💾 SAVING TRANSACTION UPDATE');
      console.log('ID:', updatedTx.id);
      console.log('Client:', updatedTx.clientName);
      console.log('Amount:', updatedTx.grossAmount);
      console.log('Status:', updatedTx.status);
      console.log('URL:', updateWebhookUrl);
      console.log('════════════════════════════════════');
      
      const response = await fetch(updateWebhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateTransaction',
          userId: userId,
          transaction: updatedTx,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ n8n returned error:', response.status, errorText);
        throw new Error(`Failed to update via n8n: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Transaction updated successfully:', result);
      
      // Update local cache
      const cacheKey = `${STORAGE_PREFIX}${userId}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const current = JSON.parse(cached);
          const updated = current.map((t: Transaction) => 
            t.id === updatedTx.id ? updatedTx : t
          );
          localStorage.setItem(cacheKey, JSON.stringify(updated));
          console.log('✅ Local cache updated');
        } catch (e) {
          console.warn('Failed to update cache:', e);
        }
      }
      
      return;
    } catch (error) {
      console.error('❌ Update failed:', error);
      throw error;
    }
  }

  // Fallback: Local Storage only (no n8n)
  console.log('💾 Saving to local storage only (no n8n URL configured)');
  await delay(300);
  const key = `${STORAGE_PREFIX}${userId}`;
  const stored = localStorage.getItem(key);
  
  if (stored) {
    try {
      const current = JSON.parse(stored);
      const updated = current.map((t: Transaction) => 
        t.id === updatedTx.id ? updatedTx : t
      );
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update local storage:', e);
    }
  }
};

export const deleteTransaction = async (userId: string, transactionId: string): Promise<void> => {
  const deleteWebhookUrl = N8N_WEBHOOK_URL?.replace('/get-all-transactions', '/delete-transaction');
  
  if (deleteWebhookUrl && N8N_WEBHOOK_URL) {
    try {
      console.log('════════════════════════════════════');
      console.log('🗑️ DELETING TRANSACTION');
      console.log('ID:', transactionId);
      console.log('URL:', deleteWebhookUrl);
      console.log('════════════════════════════════════');
      
      const response = await fetch(deleteWebhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deleteTransaction',
          userId: userId,
          transactionId: transactionId,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ n8n returned error:', response.status, errorText);
        throw new Error(`Failed to delete via n8n: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Transaction deleted successfully:', result);
      
      // Update local cache
      const cacheKey = `${STORAGE_PREFIX}${userId}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const current = JSON.parse(cached);
          const updated = current.filter((t: Transaction) => t.id !== transactionId);
          localStorage.setItem(cacheKey, JSON.stringify(updated));
          console.log('✅ Local cache updated');
        } catch (e) {
          console.warn('Failed to update cache:', e);
        }
      }
      
      return;
    } catch (error) {
      console.error('❌ Delete failed:', error);
      throw error;
    }
  }

  // Fallback: Local Storage only
  console.log('🗑️ Deleting from local storage only');
  const key = `${STORAGE_PREFIX}${userId}`;
  const stored = localStorage.getItem(key);
  
  if (stored) {
    try {
      const current = JSON.parse(stored);
      const updated = current.filter((t: Transaction) => t.id !== transactionId);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete from local storage:', e);
    }
  }
};

/**
 * Create a new transaction
 */
export const createTransaction = async (
  userId: string,
  transactionData: {
    date: string; // YYYY-MM-DD
    clientName: string;
    description: string;
    grossAmount: number;
    vatAmount: number;
    type: TransactionType;
    afm?: string;
    status: TransactionStatus;
    invoiceLink?: string;
  }
): Promise<Transaction> => {
  console.log('🆕 Creating transaction:', transactionData);

  // If N8N webhook is available, use it
  if (N8N_WEBHOOK_URL) {
    try {
      const createWebhookUrl = N8N_WEBHOOK_URL.replace(
        '/get-all-transactions',
        '/create-transaction'
      );

      console.log('📤 Sending to n8n:', createWebhookUrl);

      const response = await fetch(createWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create transaction: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Transaction created:', result);

      if (!result.success || !result.transaction) {
        throw new Error('Invalid response from server');
      }

      // Update local cache
      const cacheKey = `${STORAGE_PREFIX}${userId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const current = JSON.parse(cached);
          const updated = [result.transaction, ...current];
          localStorage.setItem(cacheKey, JSON.stringify(updated));
          console.log('✅ Local cache updated with new transaction');
        } catch (e) {
          console.warn('Failed to update cache:', e);
        }
      }

      return result.transaction;
    } catch (error) {
      console.error('❌ Create failed:', error);
      throw error;
    }
  }

  // Fallback: Create temp transaction for local storage only
  console.log('⚠️ N8N not available, creating local transaction only');
  const tempTransaction: Transaction = {
    id: `temp-${Date.now()}`,
    date: transactionData.date,
    clientName: transactionData.clientName,
    description: transactionData.description,
    amount: transactionData.grossAmount - transactionData.vatAmount,
    vatAmount: transactionData.vatAmount,
    grossAmount: transactionData.grossAmount,
    afm: transactionData.afm || '',
    mark: '',
    invoiceLink: transactionData.invoiceLink || '',
    type: transactionData.type,
    status: transactionData.status,
  };

  // Save to local storage
  const key = `${STORAGE_PREFIX}${userId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      const current = JSON.parse(stored);
      const updated = [tempTransaction, ...current];
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save to local storage:', e);
    }
  }

  return tempTransaction;
};
