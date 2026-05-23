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
  const { currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated || !currentUser) {
    throw new Error('useCurrentUser requires an authenticated user');
  }

  return currentUser;
}
