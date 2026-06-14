/**
 * Authentication Context
 * Provides auth state and actions throughout the app using frappe-react-sdk hooks
 */

import * as TokenStorage from '@/services/auth/tokenStorage';
import type { SessionInfoResponse } from '@/types/api';
import { USER_ROLES } from '@/constants/api';
import { useRouter, useSegments } from 'expo-router';
import { useFrappeAuth, useFrappeGetDoc, useFrappePostCall } from 'frappe-react-sdk';
import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';

const ESF_ROLES = Object.values(USER_ROLES) as string[];

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
  sessionInfo: SessionInfoResponse | null;
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

function getRouteForRole(_primaryRole: string | undefined): string {
  return '/(main)/home';
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
  const [sessionInfo, setSessionInfo] = useState<SessionInfoResponse | null>(null);

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

  // frappe-react-sdk: call API to get User document
  const { call: getUser } = useFrappePostCall<{ message: UserInfo }>(
    'frappe.client.get'
  );

  // frappe-react-sdk: call API to get user session info
  const { call: getSessionInfo } = useFrappePostCall<{ message: any }>(
    'esf.api.auth.get_session_info'
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

  // Fallback: build sessionInfo from userInfo.roles when getSessionInfo API is unavailable
  // Fires whenever userInfo loads (e.g. after session restore or fresh login)
  useEffect(() => {
    if (sessionInfo) return; // already set from API
    if (!userInfo?.roles?.length) return;

    const roles = userInfo.roles.map(r => r.role);
    const primaryRole = roles.find(r => ESF_ROLES.includes(r));
    if (!primaryRole) return;

    console.log('[Auth] Fallback sessionInfo from userInfo.roles | primary_role:', primaryRole);
    setSessionInfo({
      user: userInfo.name || '',
      full_name: userInfo.full_name || '',
      roles,
      primary_role: primaryRole as SessionInfoResponse['primary_role'],
      permissions: {},
      context: {},
    });
  }, [userInfo, sessionInfo]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading) return;

    const firstSegment = segments[0] as string;
    const inAuthGroup = firstSegment === 'auth';
    const inSplash = !firstSegment || firstSegment === 'index';
    const inProtectedGroup = firstSegment === '(main)';

    if (!isAuthenticated && inProtectedGroup) {
      console.log('[Auth] Redirecting to login (not authenticated)');
      router.replace('/auth/login');
    } else if (isAuthenticated && (inAuthGroup || inSplash)) {
      const route = getRouteForRole(sessionInfo?.primary_role);
      console.log('[Auth] Redirecting to dashboard:', route);
      router.replace(route as never);
    }
  }, [isAuthenticated, segments, isLoading, router, sessionInfo]);

  /**
   * Login with username and password
   */
  const login = useCallback(async (username: string, password: string, rememberMe = false) => {
    console.log('[Auth] Login attempt:', username);
    try {
      const result = await frappeLogin({ username, password });
      console.log('[Auth] Login OK:', result);

      // Set user_id cookie manually for React Native polyfill
      // (HTTP Set-Cookie headers don't populate document.cookie in RN)
      document.cookie = `user_id=${username}`;
      getUserCookie();
      updateCurrentUser();

      // Fetch User document with roles
      const userResult = await getUser({
        doctype: 'User',
        name: username,
      });
      console.log('[Auth] User data:', userResult);

      // Fetch user session info and store it
      const sessionResult = await getSessionInfo({});
      console.log('[Auth] Session info RAW:', sessionResult);
      // useFrappePostCall wraps response in { message: T }, unwrap it
      const sessionData = ((sessionResult as any)?.message ?? sessionResult) as SessionInfoResponse;
      if (sessionData?.primary_role || sessionData?.roles?.length) {
        setSessionInfo(sessionData);
        console.log('[Auth] Session roles:', sessionData.roles, '| primary_role:', sessionData.primary_role);
      }

      if (rememberMe) {
        await TokenStorage.saveCredentials(username, password);
      } else {
        await TokenStorage.clearCredentials();
      }
    } catch (err) {
      console.error('[Auth] Login error:', err);
      throw err;
    }
  }, [frappeLogin, getUserCookie, updateCurrentUser, getUser, getSessionInfo]);

  /**
   * Logout and clear session
   */
  const logout = useCallback(async () => {
    console.log('[Auth] Logging out...');
    try {
      await frappeLogout();
      document.cookie = 'user_id=; max-age=0';
      setSessionInfo(null);
      await TokenStorage.clearTokens();
      await TokenStorage.clearUserData();
      router.replace('/auth/login');
    } catch (err) {
      console.error('[Auth] Logout error:', err);
      document.cookie = 'user_id=; max-age=0';
      setSessionInfo(null);
      await TokenStorage.clearTokens();
      await TokenStorage.clearUserData();
      router.replace('/auth/login');
    }
  }, [router, frappeLogout]);

  const value: AuthContextType = {
    currentUser: currentUser ?? null,
    userInfo: userInfo ?? null,
    sessionInfo,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
