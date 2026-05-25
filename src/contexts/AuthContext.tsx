/**
 * Authentication Context
 * Provides auth state and actions throughout the app using frappe-react-sdk hooks
 */

import * as TokenStorage from '@/services/auth/tokenStorage';
import { useRouter, useSegments } from 'expo-router';
import { useFrappeAuth, useFrappeGetDoc } from 'frappe-react-sdk';
import React, { createContext, useCallback, useEffect, useRef } from 'react';

// ============================================
// Types
// ============================================

interface UserInfo {
  name: string;
  email: string;
  full_name: string;
  user_type: string;
  roles: Array<{ role: string }>;
}

interface AuthContextType {
  currentUser: string | null;
  userInfo: UserInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateCurrentUser: () => void;
}

// ============================================
// Context
// ============================================

export const AuthContext = createContext<AuthContextType | null>(null);

// ============================================
// Helper: Get route for role
// ============================================

function getRouteForRole(roles: Array<{ role: string }>): string {
  const roleNames = roles.map((r) => r.role);
  if (roleNames.includes('ESF Farm Owner')) return '/(farm-owner)/home';
  if (roleNames.includes('ESF Investor')) return '/(investor)/home';
  // return '/(store-employee)/home';
  return '/(farm-owner)/home';
}

// ============================================
// Provider
// ============================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const segments = useSegments();
  const hasRestoredSession = useRef(false);

  // frappe-react-sdk: auth state (single source of truth)
  const {
    currentUser,
    isValidating,
    isLoading: frappeIsLoading,
    login: frappeLogin,
    logout: frappeLogout,
    updateCurrentUser,
    getUserCookie,
    error,
  } = useFrappeAuth();

  // frappe-react-sdk: fetch User doc when currentUser is available
  const { data: userInfo } = useFrappeGetDoc<UserInfo>(
    'User',
    currentUser ?? undefined,
  );

  const isLoading = frappeIsLoading || isValidating;
  const isAuthenticated = !!currentUser;

  if (__DEV__) {
    console.log('[Auth] State:', {
      currentUser,
      fullName: userInfo?.full_name,
      isLoading,
      error: error?.message,
    });
  }

  // Restore session from stored credentials on mount
  useEffect(() => {
    if (hasRestoredSession.current) return;
    hasRestoredSession.current = true;

    const restoreSession = async () => {
      try {
        const hasCredentials = await TokenStorage.hasStoredCredentials();
        if (!hasCredentials) {
          console.log('[Auth] No stored credentials');
          return;
        }

        const credentials = await TokenStorage.getCredentials();
        if (credentials) {
          console.log('[Auth] Restoring session...');
          await frappeLogin({
            username: credentials.username,
            password: credentials.password,
          });
          document.cookie = `user_id=${credentials.username}`;
          getUserCookie();
          updateCurrentUser();
          console.log('[Auth] Session restored');
        }
      } catch (err) {
        console.log('[Auth] Session restore failed, clearing credentials');
        await TokenStorage.clearAll();
      }
    };

    restoreSession();
  }, [frappeLogin, getUserCookie, updateCurrentUser]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading) return;

    const firstSegment = segments[0] as string;
    const inAuthGroup = firstSegment === 'auth';
    const inSplash = !firstSegment || firstSegment === 'index';
    const inProtectedGroup =
      firstSegment === '(store-employee)' ||
      firstSegment === '(farm-owner)' ||
      firstSegment === '(investor)' ||
      firstSegment === '(tabs)';

    if (!isAuthenticated && inProtectedGroup) {
      console.log('[Auth] Redirecting to login (not authenticated)');
      router.replace('/auth/login');
    } else if (isAuthenticated && (inAuthGroup || inSplash)) {
      const route = getRouteForRole(userInfo?.roles ?? []);
      console.log('[Auth] Redirecting to dashboard:', route);
      router.replace(route as never);
    }
  }, [isAuthenticated, segments, isLoading, router, userInfo]);

  /**
   * Login with username and password
   */
  const login = useCallback(async (username: string, password: string, rememberMe = false) => {
    console.log('[Auth] Login attempt:', username);
    try {
      const result = await frappeLogin({ username, password });
      console.log('[Auth] Login OK:', JSON.stringify(result));

      // Set user_id cookie manually for React Native polyfill
      // (HTTP Set-Cookie headers don't populate document.cookie in RN)
      document.cookie = `user_id=${username}`;
      getUserCookie();
      updateCurrentUser();

      if (rememberMe) {
        await TokenStorage.saveCredentials(username, password);
      } else {
        await TokenStorage.clearCredentials();
      }
    } catch (err) {
      console.error('[Auth] Login error:', err);
      throw err;
    }
  }, [frappeLogin, getUserCookie, updateCurrentUser]);

  /**
   * Logout and clear session
   */
  const logout = useCallback(async () => {
    console.log('[Auth] Logging out...');
    try {
      await frappeLogout();
      document.cookie = 'user_id=; max-age=0';
      // Only clear session data, keep saved credentials for "remember me"
      await TokenStorage.clearTokens();
      await TokenStorage.clearUserData();
      router.replace('/auth/login');
    } catch (err) {
      console.error('[Auth] Logout error:', err);
      document.cookie = 'user_id=; max-age=0';
      await TokenStorage.clearTokens();
      await TokenStorage.clearUserData();
      router.replace('/auth/login');
    }
  }, [router, frappeLogout]);

  const value: AuthContextType = {
    currentUser: currentUser ?? null,
    userInfo: userInfo ?? null,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
