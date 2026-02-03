// Authentication Service
const AUTH_STORAGE_KEY = 'taxpulse_auth';
const SESSION_STORAGE_KEY = 'taxpulse_session';

export interface User {
  username: string;
  fullName: string;
  loginTime: string;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

// Hardcoded credentials (you can change these or move to environment variables)
const VALID_CREDENTIALS = {
  username: 'admin',
  password: 'TaxPulse2026!', // Change this to your desired password
};

// Alternative: Multiple users
const VALID_USERS = [
  { username: 'admin', password: 'TaxPulse2026!', fullName: 'Administrator' },
  { username: 'theo', password: 'Theo2026!', fullName: 'Theo' },
];

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const session = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!session) return false;
  
  try {
    const user = JSON.parse(session);
    return !!user.username;
  } catch (e) {
    return false;
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  const session = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!session) return null;
  
  try {
    return JSON.parse(session);
  } catch (e) {
    return null;
  }
};

// Login
export const login = (credentials: AuthCredentials): { success: boolean; error?: string; user?: User } => {
  console.log('🔐 Login attempt:', credentials.username);
  
  // Find matching user
  const validUser = VALID_USERS.find(
    u => u.username === credentials.username && u.password === credentials.password
  );
  
  if (!validUser) {
    console.log('❌ Login failed: Invalid credentials');
    return {
      success: false,
      error: 'Λάθος όνομα χρήστη ή κωδικός',
    };
  }
  
  // Create user session
  const user: User = {
    username: validUser.username,
    fullName: validUser.fullName,
    loginTime: new Date().toISOString(),
  };
  
  // Save to localStorage
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  
  console.log('✅ Login successful:', validUser.username);
  
  return {
    success: true,
    user,
  };
};

// Logout
export const logout = (): void => {
  console.log('👋 Logging out');
  localStorage.removeItem(SESSION_STORAGE_KEY);
};

// Get greeting based on time of day
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour < 12) return 'Καλημέρα';
  if (hour < 18) return 'Καλησπέρα';
  return 'Καληνύχτα';
};
