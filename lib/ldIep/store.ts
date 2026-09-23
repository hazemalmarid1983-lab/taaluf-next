/**
 * تخزين الخطة التربوية الفردية (IEP) — مسار صعوبات التعلم
 */

import { LD_STORAGE } from '@/lib/tracks/storageKeys';
import type { LdIndividualEducationPlan } from './types';

function readAll(): LdIndividualEducationPlan[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(LD_STORAGE.iep);
    return raw ? (JSON.parse(raw) as LdIndividualEducationPlan[]) : [];
  } catch {
    return [];
  }
}

function writeAll(plans: LdIndividualEducationPlan[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LD_STORAGE.iep, JSON.stringify(plans));
}

export function listLdIepPlans(childId?: string): LdIndividualEducationPlan[] {
  const all = readAll();
  if (!childId) return all;
  return all.filter((p) => p.childId === childId);
}

export function getActiveLdIep(childId: string): LdIndividualEducationPlan | null {
  const plans = readAll().filter(
    (p) => p.childId === childId && p.status === 'active'
  );
  return plans.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
}

export function saveLdIep(plan: LdIndividualEducationPlan): LdIndividualEducationPlan {
  const plans = readAll();
  const idx = plans.findIndex((p) => p.id === plan.id);
  const updated = { ...plan, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    plans[idx] = updated;
  } else {
    plans.push(updated);
  }
  writeAll(plans);
  return updated;
}

export function archiveLdIep(id: string) {
  const plans = readAll();
  const idx = plans.findIndex((p) => p.id === id);
  if (idx >= 0) {
    plans[idx] = {
      ...plans[idx],
      status: 'archived',
      updatedAt: new Date().toISOString(),
    };
    writeAll(plans);
  }
}
