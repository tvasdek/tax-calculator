import { Transaction, TransactionType } from '../types';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  transaction?: Transaction;
  timestamp: Date;
  read: boolean;
}

const STORAGE_KEY = 'taxpulse_notifications';

// Request browser notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('❌ Browser notifications not supported');
    return false;
  }

  console.log('🔔 Current notification permission:', Notification.permission);

  if (Notification.permission === 'granted') {
    console.log('✅ Notification permission already granted');
    return true;
  }

  if (Notification.permission !== 'denied') {
    console.log('❓ Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('📋 Permission result:', permission);
    return permission === 'granted';
  }

  console.log('🚫 Notification permission denied');
  return false;
};

// Show browser notification
export const showBrowserNotification = (notification: Notification) => {
  if (Notification.permission !== 'granted') {
    console.log('⚠️ Cannot show notification - permission not granted');
    return;
  }

  if (notification.transaction) {
    const tx = notification.transaction;
    const amount = new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency: 'EUR',
    }).format(tx.grossAmount);

    console.log('📢 Showing browser notification:', tx.clientName);

    const browserNotif = new Notification('TaxPulse OE - Νέα Συναλλαγή', {
      body: `${tx.type === TransactionType.INCOME ? '💰 Έσοδο' : '💳 Έξοδο'}: ${tx.clientName} - ${amount}`,
      icon: '/favicon.ico',
      tag: notification.id,
      requireInteraction: false,
    });

    setTimeout(() => browserNotif.close(), 8000);

    browserNotif.onclick = () => {
      window.focus();
      browserNotif.close();
    };
  }
};

// Create notification from transaction
export const createNotificationFromTransaction = (tx: Transaction): Notification => {
  const amount = new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
  }).format(tx.grossAmount);

  return {
    id: `notif-${tx.id}-${Date.now()}`,
    message: `Νέο ${tx.type === TransactionType.INCOME ? 'Έσοδο' : 'Έξοδο'}: ${amount} από ${tx.clientName}`,
    type: 'info',
    transaction: tx,
    timestamp: new Date(),
    read: false,
  };
};

// Load notifications from localStorage
export const loadNotifications = (): Notification[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map((n: any) => ({
      ...n,
      timestamp: new Date(n.timestamp),
    }));
  } catch (e) {
    console.error('Failed to load notifications:', e);
    return [];
  }
};

// Save notifications to localStorage
export const saveNotifications = (notifications: Notification[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.error('Failed to save notifications:', e);
  }
};

// Add new notification
export const addNotification = (notification: Notification): Notification[] => {
  const current = loadNotifications();
  
  // Prevent duplicates
  const exists = current.some(n => n.id === notification.id);
  if (exists) return current;
  
  const updated = [notification, ...current].slice(0, 50); // Keep last 50
  saveNotifications(updated);
  
  // Show browser notification
  showBrowserNotification(notification);
  
  return updated;
};

// Mark notification as read
export const markNotificationAsRead = (notificationId: string): Notification[] => {
  const notifications = loadNotifications();
  const updated = notifications.map(n =>
    n.id === notificationId ? { ...n, read: true } : n
  );
  saveNotifications(updated);
  return updated;
};

// Mark all as read
export const markAllAsRead = (): Notification[] => {
  const notifications = loadNotifications();
  const updated = notifications.map(n => ({ ...n, read: true }));
  saveNotifications(updated);
  return updated;
};

// Clear all notifications
export const clearAllNotifications = (): Notification[] => {
  localStorage.removeItem(STORAGE_KEY);
  return [];
};

// Get unread count
export const getUnreadCount = (): number => {
  const notifications = loadNotifications();
  return notifications.filter(n => !n.read).length;
};

// Setup webhook listener (for when n8n pushes notifications)
export const setupWebhookListener = (
  onNewTransaction: (transaction: Transaction) => void
) => {
  // This will listen for postMessage events from n8n or service worker
  const handleMessage = (event: MessageEvent) => {
    // Validate origin if needed
    // if (event.origin !== 'https://your-n8n-domain.com') return;
    
    if (event.data.type === 'NEW_TRANSACTION' && event.data.transaction) {
      console.log('📨 Received new transaction via webhook:', event.data.transaction);
      onNewTransaction(event.data.transaction);
    }
  };

  window.addEventListener('message', handleMessage);

  // Return cleanup function
  return () => {
    window.removeEventListener('message', handleMessage);
  };
};

// Create a stable key for transaction comparison
const createTransactionKey = (t: Transaction): string => {
  // Use date + client + amount + type as a unique identifier
  // This is more stable than the ID which includes a timestamp
  return `${t.date}-${t.clientName}-${t.grossAmount}-${t.type}`;
};

// Manual refresh - fetch latest transactions
export const manualRefresh = async (
  currentTransactions: Transaction[],
  webhookUrl: string
): Promise<{ transactions: Transaction[], newCount: number, newTransactions: Transaction[] }> => {
  try {
    console.log('🔄 Manual refresh triggered...');
    console.log('📊 Current transactions:', currentTransactions.length);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getTransactions',
        userId: 'oe-user',
      }),
    });

    if (!response.ok) {
      throw new Error(`Refresh failed: ${response.status}`);
    }

    const data = await response.json();
    let allTransactions: Transaction[] = [];

    if (Array.isArray(data)) {
      allTransactions = data;
    } else if (data.transactions && Array.isArray(data.transactions)) {
      allTransactions = data.transactions;
    }

    console.log('📥 Fetched transactions:', allTransactions.length);

    // Build a Set of current transaction keys for comparison
    // Use date + client + amount + type as the key (not ID which has timestamp)
    const currentKeys = new Set(
      currentTransactions.map(t => createTransactionKey(t))
    );

    console.log('🔑 Current transaction keys:', currentKeys.size);

    // Find truly new transactions
    const brandNew = allTransactions.filter(t => {
      const key = createTransactionKey(t);
      const isNew = !currentKeys.has(key);
      
      if (isNew) {
        console.log('✨ NEW transaction found:', {
          key,
          client: t.clientName,
          amount: t.grossAmount,
          date: t.date
        });
      }
      
      return isNew;
    });

    console.log(`✅ Refresh complete. Found ${brandNew.length} new transaction(s)`);

    return {
      transactions: allTransactions,
      newCount: brandNew.length,
      newTransactions: brandNew,
    };
  } catch (error) {
    console.error('❌ Manual refresh error:', error);
    throw error;
  }
};