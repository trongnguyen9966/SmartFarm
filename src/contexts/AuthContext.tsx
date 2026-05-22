/**
 * Authentication Context
 * Provides auth state and actions throughout the app using Frappe SDK
 */

import React, { createContext, useCallback, useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useFrappe } from '@/providers/FrappeProvider';
import type { LoginResponse, SessionInfoResponse } from '@/types/api';
import { API_ENDPOINTS } from '@/constants/api';
import * as TokenStorage from '@/services/auth/tokenStorage';

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

  // Get Frappe SDK context
  const { app, setToken, call } = useFrappe();

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
   * Restore session from stored credentials
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

      // Get stored tokens and set them in Frappe SDK
      const tokens = await TokenStorage.getTokens();
      if (tokens) {
        const tokenString = `${tokens.apiKey}:${tokens.apiSecret}`;
        setToken(tokenString);
      }

      // Get stored user data
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

      // Try to validate session with server
      try {
        const sessionInfo = await call<SessionInfoResponse>(
          API_ENDPOINTS.AUTH.SESSION_INFO,
          {}
        );

        // Update stored user data with fresh info
        await TokenStorage.saveUserData({
          user: sessionInfo.user,
          fullName: sessionInfo.full_name,
          roles: sessionInfo.roles,
          primaryRole: sessionInfo.primary_role,
          context: sessionInfo.context,
        });

        setUser({
          email: sessionInfo.user,
          fullName: sessionInfo.full_name,
          roles: sessionInfo.roles,
          primaryRole: sessionInfo.primary_role,
          context: sessionInfo.context,
        });
      } catch (error) {
        console.log('[Auth] Session validation failed, using cached data');
        // Keep using cached data for offline access
      }
    } catch (error) {
      console.error('[Auth] Failed to restore session:', error);
      setUser(null);
    } finally {
      console.log('[Auth] Session restore complete');
      setIsLoading(false);
    }
  }, [setToken, call]);

  /**
   * Login with username and password using Frappe SDK
   */
  const login = useCallback(async (username: string, password: string) => {
    console.log('[Auth] Login attempt with Frappe SDK:', username);
    setIsLoading(true);
    try {
      // Call login endpoint using Frappe SDK
      const response = await call<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
        usr: username,
        pwd: password,
      });

      console.log('[Auth] Login successful:', response.user);

      // Set token in Frappe SDK for future requests
      const tokenString = `${response.api_key}:${response.api_secret}`;
      setToken(tokenString);

      // Save tokens securely
      await TokenStorage.saveTokens({
        apiKey: response.api_key,
        apiSecret: response.api_secret,
      });

      // Save user data
      await TokenStorage.saveUserData({
        user: response.user,
        fullName: response.full_name,
        roles: response.roles,
        primaryRole: response.primary_role,
        context: response.context,
      });

      const userData: User = {
        email: response.user,
        fullName: response.full_name,
        roles: response.roles,
        primaryRole: response.primary_role,
        context: response.context,
      };

      setUser(userData);

      // Navigate to appropriate dashboard
      const route = getRouteForRole(response.primary_role);
      console.log('[Auth] Navigating to:', route);
      router.replace(route as never);
    } catch (error) {
      console.error('[Auth] Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router, setToken, call]);

  /**
   * Logout and clear session
   */
  const logout = useCallback(async () => {
    console.log('[Auth] Logging out...');
    setIsLoading(true);
    try {
      // Clear token from Frappe SDK
      setToken(null);
      // Clear stored data
      await TokenStorage.clearAll();
      setUser(null);
      router.replace('/auth/login');
    } finally {
      setIsLoading(false);
    }
  }, [router, setToken]);

  /**
   * Refresh session info from server
   */
  const refreshSession = useCallback(async () => {
    if (!user) return;

    try {
      const sessionInfo = await call<SessionInfoResponse>(
        API_ENDPOINTS.AUTH.SESSION_INFO,
        {}
      );

      await TokenStorage.saveUserData({
        user: sessionInfo.user,
        fullName: sessionInfo.full_name,
        roles: sessionInfo.roles,
        primaryRole: sessionInfo.primary_role,
        context: sessionInfo.context,
      });

      setUser({
        email: sessionInfo.user,
        fullName: sessionInfo.full_name,
        roles: sessionInfo.roles,
        primaryRole: sessionInfo.primary_role,
        context: sessionInfo.context,
      });
    } catch (error) {
      console.error('[Auth] Failed to refresh session:', error);
      await logout();
    }
  }, [user, logout, call]);

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
