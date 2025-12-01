import { isTauri, localDb, initDatabase } from './tauri-db';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'staff';
  onboardingCompleted?: number;
  profileImageUrl?: string | null;
  twoStepComplete?: boolean;
}

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

const TAURI_SESSION_KEY = 'tauri_auth_session';

function getTauriSession(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(TAURI_SESSION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to parse Tauri session:', e);
  }
  return null;
}

function setTauriSession(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TAURI_SESSION_KEY, JSON.stringify(user));
}

function clearTauriSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TAURI_SESSION_KEY);
}

async function ensureDatabaseReady(): Promise<boolean> {
  if (!isTauri()) return true;
  try {
    await initDatabase();
    return true;
  } catch (error) {
    console.error('Database not ready:', error);
    return false;
  }
}

export async function login(username: string, password: string): Promise<AuthResult> {
  if (isTauri()) {
    try {
      const dbReady = await ensureDatabaseReady();
      if (!dbReady) {
        return { success: false, error: 'Database not ready. Please restart the app.' };
      }
      
      const user = await localDb.validatePassword(username, password);
      if (user) {
        const authUser: User = {
          id: user.id,
          username: user.username,
          role: user.role as 'admin' | 'staff',
          onboardingCompleted: user.onboardingCompleted,
          profileImageUrl: user.profileImageUrl,
          twoStepComplete: true,
        };
        setTauriSession(authUser);
        return { success: true, user: authUser };
      }
      return { success: false, error: 'Invalid username or password' };
    } catch (error) {
      console.error('Tauri login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });

    if (response.ok) {
      const userData = await response.json();
      return { success: true, user: userData };
    } else {
      const data = await response.json();
      return { success: false, error: data.message || 'Invalid username or password' };
    }
  } catch (error) {
    console.error('Web login error:', error);
    return { success: false, error: 'Login failed. Please try again.' };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  if (isTauri()) {
    const session = getTauriSession();
    if (session) {
      return { ...session, twoStepComplete: true };
    }
    return null;
  }

  try {
    const response = await fetch('/api/auth/me', { credentials: 'include' });
    if (response.ok) {
      const userData = await response.json();
      if (userData.twoStepComplete && userData.id) {
        return userData;
      }
    }
  } catch (error) {
    console.error('Check auth error:', error);
  }
  return null;
}

export async function logout(): Promise<boolean> {
  if (isTauri()) {
    clearTauriSession();
    return true;
  }

  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    return response.ok;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}

export async function initializeTauriAuth(): Promise<boolean> {
  if (!isTauri()) return true;
  
  try {
    console.log('Initializing Tauri authentication...');
    const dbReady = await ensureDatabaseReady();
    if (!dbReady) {
      console.error('Failed to initialize database');
      return false;
    }
    
    const users = await localDb.getAllUsers();
    if (users.length === 0) {
      console.log('No users found, creating default admin user...');
      await localDb.createUser({
        username: 'admin',
        password: 'Admin@123',
        role: 'admin',
      });
      console.log('Default admin user created');
    }
    console.log('Tauri authentication initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Tauri auth:', error);
    return false;
  }
}
