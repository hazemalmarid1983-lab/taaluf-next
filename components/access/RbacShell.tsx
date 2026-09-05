'use client';

import type { ReactNode } from 'react';
import { PermissionsProvider } from '@/components/access/PermissionsProvider';
import RoleSwitcher from '@/components/access/RoleSwitcher';

export default function RbacShell({ children }: { children: ReactNode }) {
  return (
    <PermissionsProvider>
      {children}
      <RoleSwitcher />
    </PermissionsProvider>
  );
}
