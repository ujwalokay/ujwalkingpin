/* auth-client.ts - Offline-only authentication using local SQLite database */

import { localDb, initDatabase, isTauri } from './tauri-db';

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
  try {
    if (!isTauri()) {
      console.log('[Auth] Not in Tauri mode, database not needed');
      return false;
    }
    const result = await initDatabase();
    if (!result) {
      console.error('[Auth] Database initialization returned null');
      return false;
    }
    return true;
  } catch (error) {
    console.error('[Auth] Database not ready:', error);
    return false;
  }
}

export async function login(username: string, password: string): Promise<AuthResult> {
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
      
      // Log login activity (only in Tauri mode)
      if (isTauri()) {
        try {
          await localDb.createActivityLog({
            userId: user.id,
            username: user.username,
            userRole: user.role,
            action: 'login',
            entityType: null,
            entityId: null,
            details: `${user.role} logged in (desktop app)`
          });
        } catch (logError) {
          console.error('Failed to log login activity:', logError);
        }
      }
      
      return { success: true, user: authUser };
    }
    return { success: false, error: 'Invalid username or password' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed. Please try again.' };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const session = getTauriSession();
  if (session) {
    return { ...session, twoStepComplete: true };
  }
  return null;
}

export async function logout(): Promise<boolean> {
  // Log logout activity before clearing session (only in Tauri mode)
  try {
    const session = getTauriSession();
    if (session && isTauri()) {
      const dbReady = await ensureDatabaseReady();
      if (dbReady) {
        await localDb.createActivityLog({
          userId: session.id,
          username: session.username,
          userRole: session.role,
          action: 'logout',
          entityType: null,
          entityId: null,
          details: `${session.role} logged out (desktop app)`
        });
      }
    }
  } catch (logError) {
    console.error('Failed to log logout activity:', logError);
  }
  
  clearTauriSession();
  return true;
}

export async function initializeTauriAuth(): Promise<boolean> {
  try {
    console.log('Initializing offline authentication...');
    
    // Add timeout to prevent hanging forever
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error('Database initialization timeout after 10 seconds')), 10000);
    });
    
    const initPromise = (async () => {
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
      } else {
        // Check if admin user exists and reset password to ensure it works
        const adminUser = users.find((u: any) => u.username === 'admin');
        if (adminUser) {
          console.log('Admin user found, resetting password to default...');
          await localDb.updateUser(adminUser.id, { password: 'Admin@123' });
          console.log('Admin password reset to Admin@123');
        }
      }
      console.log('Offline authentication initialized successfully');
      return true;
    })();
    
    return await Promise.race([initPromise, timeoutPromise]);
  } catch (error) {
    console.error('Failed to initialize authentication:', error);
    return false;
  }
}
