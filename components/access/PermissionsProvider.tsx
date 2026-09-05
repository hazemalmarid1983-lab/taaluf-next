'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';
import {
  hasPermission,
  mapSessionRoleToClinical,
  parseMockClinicalRole,
  RBAC_MOCK_STORAGE_KEY,
  type ClinicalRole,
  type Permission,
} from '@/lib/permissions';

type PermissionsContextValue = {
  role: ClinicalRole;
  sessionRole: string | undefined;
  mockRole: ClinicalRole | null;
  isMockActive: boolean;
  has: (permission: Permission) => boolean;
  setMockRole: (role: ClinicalRole | null) => void;
  clearMockRole: () => void;
};

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [mockRole, setMockRoleState] = useState<ClinicalRole | null>(null);

  useEffect(() => {
    try {
      const stored = parseMockClinicalRole(
        sessionStorage.getItem(RBAC_MOCK_STORAGE_KEY)
      );
      if (stored) setMockRoleState(stored);
    } catch {
      /* private mode */
    }
  }, []);

  const sessionRole = session?.user?.role;
  const mapped = mapSessionRoleToClinical(sessionRole);
  const role = mockRole ?? mapped;

  const setMockRole = useCallback((next: ClinicalRole | null) => {
    setMockRoleState(next);
    try {
      if (next) sessionStorage.setItem(RBAC_MOCK_STORAGE_KEY, next);
      else sessionStorage.removeItem(RBAC_MOCK_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const clearMockRole = useCallback(() => setMockRole(null), [setMockRole]);

  const value = useMemo(
    () => ({
      role,
      sessionRole,
      mockRole,
      isMockActive: mockRole !== null,
      has: (permission: Permission) => hasPermission(role, permission),
      setMockRole,
      clearMockRole,
    }),
    [role, sessionRole, mockRole, setMockRole, clearMockRole]
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  return ctx;
}

/** نسخة آمنة خارج المزود — للمكوّنات التي قد تُعرض قبل التحميل */
export function usePermissionsOptional() {
  return useContext(PermissionsContext);
}
