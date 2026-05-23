/**
 * Authentication Context
 * Provides auth state and actions throughout the app using useFrappeAuth
 */

import { API_ENDPOINTS } from '@/constants/api';
import * as TokenStorage from '@/services/auth/tokenStorage';
import type { LoginResponse, SessionInfoResponse } from '@/types/api';
import { useRouter, useSegments } from 'expo-router';
import { useFrappeAuth, useFrappePostCall } from 'frappe-react-sdk';
import React, { createContext, useCallback, useEffect, useState } from 'react';

// ============================================
// Types
// ============================================

interface User {
  email: string;
  fullName: string;
  roles: string[];
  primaryRole: string;
  context: LoginResponse['context'];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// ============================================
// Context
// ============================================

export const AuthContext = createContext<AuthContextType | null>(null);

// ============================================
// Helper: Get route for role
// ============================================

function getRouteForRole(primaryRole: string): string {
  switch (primaryRole) {
    case 'ESF Store Manager':
      return '/(store-employee)/home';
    case 'ESF Farm Owner':
      return '/(farm-owner)/home';
    case 'ESF Investor':
      return '/(investor)/home';
    default:
      return '/(store-employee)/home';
  }
}

// ============================================
// Provider
// ============================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const segments = useSegments();

  // Frappe SDK auth hook
  const {
    login: frappeLogin,
    logout: frappeLogout,
  } = useFrappeAuth();

  // Frappe SDK post call for get_session_info
  const { call: callSessionInfo } = useFrappePostCall<SessionInfoResponse>(
    API_ENDPOINTS.AUTH.SESSION_INFO
  );

  // Initialize and restore session on mount
  useEffect(() => {
    restoreSession();
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (__DEV__) {
      console.log('[Auth] Navigation check - isLoading:', isLoading, 'user:', !!user, 'segments:', segments);
    }
    if (isLoading) return;

    const firstSegment = segments[0] as string;
    const inAuthGroup = firstSegment === 'auth';
    const inSplash = !firstSegment || firstSegment === 'index';
    const inProtectedGroup =
      firstSegment === '(store-employee)' ||
      firstSegment === '(farm-owner)' ||
      firstSegment === '(investor)' ||
      firstSegment === '(tabs)';

    if (!user && inProtectedGroup) {
      console.log('[Auth] Redirecting to login (not authenticated)');
      router.replace('/auth/login');
    } else if (user && (inAuthGroup || inSplash)) {
      const route = getRouteForRole(user.primaryRole);
      console.log('[Auth] Redirecting to dashboard:', route);
      router.replace(route as never);
    }
  }, [user, segments, isLoading, router]);

  /**
   * Helper: fetch session info and update user state
   */
  const fetchAndSetUser = useCallback(async (): Promise<User | null> => {
    const response = await callSessionInfo({}) as unknown as { message: SessionInfoResponse };
    const sessionInfo = response.message;

    const userData: User = {
      email: sessionInfo.user,
      fullName: sessionInfo.full_name,
      roles: sessionInfo.roles,
      primaryRole: sessionInfo.primary_role,
      context: sessionInfo.context,
    };

    await TokenStorage.saveUserData({
      user: sessionInfo.user,
      fullName: sessionInfo.full_name,
      roles: sessionInfo.roles,
      primaryRole: sessionInfo.primary_role,
      context: sessionInfo.context,
    });

    setUser(userData);
    return userData;
  }, [callSessionInfo]);

  /**
   * Restore session from stored credentials
   * Cookie-based: re-login with stored credentials, then fetch session info
   */
  const restoreSession = useCallback(async () => {
    console.log('[Auth] Restoring session...');
    try {
      setIsLoading(true);

      // Check if we have stored credentials
      const hasCredentials = await TokenStorage.hasStoredCredentials();
      if (!hasCredentials) {
        console.log('[Auth] No stored credentials');
        setUser(null);
        return;
      }

      // Load cached user data for immediate display
      const storedUser = await TokenStorage.getUserData();
      if (storedUser) {
        setUser({
          email: storedUser.user,
          fullName: storedUser.fullName,
          roles: storedUser.roles,
          primaryRole: storedUser.primaryRole,
          context: storedUser.context as LoginResponse['context'],
        });
      }

      // Re-login with stored credentials to establish cookie session
      const credentials = await TokenStorage.getCredentials();
      if (credentials) {
        try {
          const loginResponse = await frappeLogin({
            username: credentials.username,
            password: credentials.password,
          });
          console.log('[Auth] Re-login successful, fetching session info...');
          await fetchAndSetUser();
        } catch (error) {
          console.log('[Auth] Re-login failed, clearing credentials');
          await TokenStorage.clearAll();
          setUser(null);
        }
      }
    } catch (error) {
      console.error('[Auth] Failed to restore session:', error);
      setUser(null);
    } finally {
      console.log('[Auth] Session restore complete');
      setIsLoading(false);
    }
  }, [frappeLogin, fetchAndSetUser]);

  /**
   * Login with username and password
   * Step 1: useFrappeAuth.login (POST /api/method/login, sets session cookie)
   * Step 2: Call get_session_info (get roles, context, etc.)
   */
  const login = useCallback(async (username: string, password: string) => {
    console.log('[Auth] Login attempt:', username);
    setIsLoading(true);
    try {
      // Login via useFrappeAuth (sets session cookie)
      const loginResult = await frappeLogin({ username, password });
      console.log('[Auth] Login OK:', JSON.stringify(loginResult));

      // Set user from login response
      const userData: User = {
        email: username,
        fullName: loginResult?.full_name ?? username,
        roles: [],
        primaryRole: '',
        context: {} as LoginResponse['context'],
      };
      setUser(userData);

      // Save credentials for session restore on app restart
      await TokenStorage.saveCredentials(username, password);

      // Navigate to dashboard
      const route = getRouteForRole(userData.primaryRole);
      console.log('[Auth] Navigating to:', route);
      router.replace(route as never);
    } catch (error) {
      console.error('[Auth] Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router, frappeLogin, fetchAndSetUser]);

  /**
   * Logout and clear session
   */
  const logout = useCallback(async () => {
    console.log('[Auth] Logging out...');
    setIsLoading(true);
    try {
      await frappeLogout();
      await TokenStorage.clearAll();
      setUser(null);
      router.replace('/auth/login');
    } finally {
      setIsLoading(false);
    }
  }, [router, frappeLogout]);

  /**
   * Refresh session info from server
   */
  const refreshSession = useCallback(async () => {
    if (!user) return;

    try {
      await fetchAndSetUser();
    } catch (error) {
      console.error('[Auth] Failed to refresh session:', error);
      await logout();
    }
  }, [user, logout, fetchAndSetUser]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
