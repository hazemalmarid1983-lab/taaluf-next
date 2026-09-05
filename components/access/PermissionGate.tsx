'use client';

import type { Permission } from '@/lib/permissions';
import { hasAnyPermission, hasPermission } from '@/lib/permissions';
import { usePermissionsOptional } from '@/components/access/PermissionsProvider';

/**
 * يعرض المحتوى فقط عند امتلاك الصلاحية المطلوبة.
 */
export default function PermissionGate({
  permission,
  permissions,
  match = 'all',
  fallback = null,
  children,
}: {
  permission?: Permission;
  permissions?: Permission[];
  match?: 'all' | 'any';
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const ctx = usePermissionsOptional();
  if (!ctx) return <>{children}</>;

  const required = permissions ?? (permission ? [permission] : []);
  const allowed =
    match === 'any'
      ? hasAnyPermission(ctx.role, required)
      : required.every((p) => hasPermission(ctx.role, p));

  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
