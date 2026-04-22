/**
 * Authentication Context
 * Provides auth state and actions throughout the app
 */

import React, { createContext, useCallback, useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import type { LoginResponse } from '@/types/api';
import * as AuthService from '@/services/auth/authService';

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

  // Initialize auth service on mount
  useEffect(() => {
    AuthService.initializeAuth();
    restoreSession();
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    console.log('[Auth] Navigation check - isLoading:', isLoading, 'user:', !!user, 'segments:', segments);
    if (isLoading) return;

    const firstSegment = segments[0] as string;
    const inAuthGroup = firstSegment === 'auth';
    const inSplash = !firstSegment || firstSegment === 'index';
    const inProtectedGroup =
      firstSegment === '(store-employee)' ||
      firstSegment === '(farm-owner)' ||
      firstSegment === '(investor)' ||
      firstSegment === '(tabs)';

    console.log('[Auth] firstSegment:', firstSegment, 'inAuth:', inAuthGroup, 'inSplash:', inSplash, 'inProtected:', inProtectedGroup);

    if (!user && inProtectedGroup) {
      // Not authenticated, redirect to login
      console.log('[Auth] Redirecting to login (not authenticated)');
      router.replace('/auth/login');
    } else if (user && (inAuthGroup || inSplash)) {
      // Authenticated, redirect to appropriate dashboard
      const route = AuthService.getRouteForRole(user.primaryRole);
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
      const restoredUser = await AuthService.restoreSession();
      console.log('[Auth] Restored user:', restoredUser);
      setUser(restoredUser);
    } catch (error) {
      console.error('[Auth] Failed to restore session:', error);
      setUser(null);
    } finally {
      console.log('[Auth] Session restore complete, setting isLoading=false');
      setIsLoading(false);
    }
  }, []);

  /**
   * Login with username and password
   */
  const login = useCallback(async (username: string, password: string) => {
    console.log('[Auth] Login attempt:', username);
    setIsLoading(true);
    try {
      const response = await AuthService.login(username, password);
      console.log('[Auth] Login response:', response);

      const userData: User = {
        email: response.user,
        fullName: response.full_name,
        roles: response.roles,
        primaryRole: response.primary_role,
        context: response.context,
      };

      setUser(userData);
      console.log('[Auth] User set, navigating to dashboard...');

      // Navigate to appropriate dashboard
      const route = AuthService.getRouteForRole(response.primary_role);
      console.log('[Auth] Route:', route);
      router.replace(route as never);
    } catch (error) {
      console.error('[Auth] Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  /**
   * Logout and clear session
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
      router.replace('/auth/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  /**
   * Refresh session info from server
   */
  const refreshSession = useCallback(async () => {
    if (!user) return;

    try {
      const sessionInfo = await AuthService.getSessionInfo();
      setUser({
        email: sessionInfo.user,
        fullName: sessionInfo.full_name,
        roles: sessionInfo.roles,
        primaryRole: sessionInfo.primary_role,
        context: sessionInfo.context,
      });
    } catch (error) {
      console.error('[Auth] Failed to refresh session:', error);
      // If refresh fails, might need to re-login
      await logout();
    }
  }, [user, logout]);

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
