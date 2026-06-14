import { useAuth } from './useAuth';
import type { DocPermission } from '@/types/api';
import { ROLE_FEATURES, FEATURE_DOCTYPE_MAP } from '@/constants/api';

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

/**
 * Get all enabled feature keys for the current user based on their roles.
 * Menu tiles use this to decide which items to render.
 *
 * Usage:
 *   const features = useFeatures();
 *   const visible = allItems.filter(item => features.includes(item.key));
 */
export function useFeatures(): string[] {
  const { sessionInfo } = useAuth();
  if (!sessionInfo) return [];

  // Build roles list — fall back to [primary_role] if roles array is empty/missing
  const roles: string[] = sessionInfo.roles?.length
    ? sessionInfo.roles
    : sessionInfo.primary_role ? [sessionInfo.primary_role] : [];

  if (!roles.length) return [];

  // Step 1: collect all feature keys for user's roles
  const features = new Set<string>();
  for (const role of roles) {
    (ROLE_FEATURES[role] ?? []).forEach(f => features.add(f));
  }

  // Step 2: filter by DocType read permission (if server returned permissions)
  const permissions = sessionInfo.permissions;
  if (permissions && Object.keys(permissions).length > 0) {
    return Array.from(features).filter(key => {
      const doctype = FEATURE_DOCTYPE_MAP[key];
      if (!doctype) return true; // no DocType mapping → always visible
      // Only hide if server explicitly returned read: false for this doctype
      const perm = permissions[doctype];
      return perm === undefined || perm.read !== false;
    });
  }

  // No permissions from server → show all role-based features
  return Array.from(features);
}
