/**
 * useAuth Hook
 * Provides access to authentication context
 */

import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

/**
 * Hook to get current user (throws if not authenticated)
 */
export function useCurrentUser() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    throw new Error('useCurrentUser requires an authenticated user');
  }

  return user;
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(role: string): boolean {
  const { user } = useAuth();
  return user?.roles.includes(role) ?? false;
}

/**
 * Hook to get user's primary role
 */
export function usePrimaryRole(): string | null {
  const { user } = useAuth();
  return user?.primaryRole ?? null;
}

/**
 * Hook to get user context (stores, farm_owner, etc.)
 */
export function useUserContext() {
  const { user } = useAuth();
  return user?.context ?? null;
}
