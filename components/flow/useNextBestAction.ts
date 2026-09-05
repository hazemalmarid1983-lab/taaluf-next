'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  resolveAdminNextAction,
  resolveClientNextActionForRole,
  resolveHubNextAction,
  resolveParentNextAction,
  resolveSpecialistNextAction,
  type UnifiedNextAction,
} from '@/lib/nextBestActionFlow';
import type { HubActor, ClinicalHubSnapshot } from '@/lib/clinicalHub';
import { mouOverallStatus } from '@/lib/clinicalHub';

export function useParentNextAction(studentName?: string) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return useMemo(() => {
    if (!ready) return null;
    return resolveParentNextAction(studentName);
  }, [ready, studentName]);
}

export function useSpecialistNextAction(childId?: string, childName?: string) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return useMemo(() => {
    if (!ready) return null;
    return resolveSpecialistNextAction(childId, childName);
  }, [ready, childId, childName]);
}

export function useRoleNextAction(
  role: string | undefined,
  options?: { studentName?: string; childId?: string; childName?: string }
) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return useMemo(() => {
    if (!ready || !role) return null;
    if (role === 'parent') return resolveParentNextAction(options?.studentName);
    if (role === 'specialist' || role === 'teacher') {
      return resolveSpecialistNextAction(options?.childId, options?.childName);
    }
    if (role === 'admin') return resolveAdminNextAction();
    return resolveClientNextActionForRole(role, options);
  }, [ready, role, options?.studentName, options?.childId, options?.childName]);
}

export function useHubNextAction(
  actor: HubActor | null,
  snapshot: ClinicalHubSnapshot | null
): UnifiedNextAction | null {
  return useMemo(() => {
    if (!actor || !snapshot) return null;
    return resolveHubNextAction({
      actor,
      mou: snapshot.mou,
      posts: snapshot.posts,
    });
  }, [actor, snapshot]);
}

export function useAdminHubNextAction(snapshot: ClinicalHubSnapshot | null) {
  return useMemo(() => {
    if (!snapshot) return resolveAdminNextAction();
    const pending = snapshot.posts.filter((p) => p.status === 'pending').length;
    return resolveAdminNextAction({
      mouStatus: mouOverallStatus(snapshot.mou),
      pendingHubPosts: pending,
    });
  }, [snapshot]);
}
