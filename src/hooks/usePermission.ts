import { useAuth } from './useAuth';
import type { DocPermission } from '@/types/api';

const NO_PERMISSION: DocPermission = { read: false, write: false, create: false, delete: false };

/**
 * Check permissions for a specific doctype.
 *
 * Usage:
 *   const { can } = usePermission('Farm');
 *   if (can.create) { ... }
 *
 *   const { canRead, canWrite } = usePermission('Garden');
 */
export function usePermission(doctype: string) {
  const { sessionInfo } = useAuth();
  const perm = sessionInfo?.permissions?.[doctype] ?? NO_PERMISSION;

  return {
    can: perm,
    canRead: perm.read,
    canWrite: perm.write,
    canCreate: perm.create,
    canDelete: perm.delete,
  };
}

/**
 * Check if the current user has a specific role.
 *
 * Usage:
 *   const isFarmOwner = useHasRole('ESF Farm Owner');
 */
export function useHasRole(role: string): boolean {
  const { sessionInfo } = useAuth();
  return sessionInfo?.roles?.includes(role) ?? false;
}

/**
 * Get the primary role of the current user.
 */
export function usePrimaryRole() {
  const { sessionInfo } = useAuth();
  return sessionInfo?.primary_role ?? null;
}
