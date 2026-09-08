/**
 * تخزين خطط التدريب — localStorage / TRAINING_STORAGE.plans
 */

import { TRAINING_STORAGE } from '@/lib/tracks/storageKeys';
import type { TrainingPlan } from '@/lib/training/types';
import {
  getTrainingStorageAdapter,
  readJsonArray,
  writeJsonArray,
} from '@/lib/training/storage/adapter';
import { TRAINING_STORAGE_LIMITS } from '@/lib/training/storage/constants';
import {
  sanitizeTrainingPlan,
  validateTrainingPlan,
} from '@/lib/training/storage/validateStored';

const KEY = TRAINING_STORAGE.plans;

function readAll(): TrainingPlan[] {
  return readJsonArray(
    getTrainingStorageAdapter(),
    KEY,
    sanitizeTrainingPlan
  );
}

function writeAll(plans: TrainingPlan[]) {
  writeJsonArray(
    getTrainingStorageAdapter(),
    KEY,
    plans,
    TRAINING_STORAGE_LIMITS.plans
  );
}

export function listTrainingPlans(childId?: string): TrainingPlan[] {
  const all = readAll();
  if (!childId) return all;
  return all.filter((plan) => plan.childId === childId);
}

export function getTrainingPlan(id: string): TrainingPlan | null {
  return readAll().find((plan) => plan.id === id) ?? null;
}

export function saveTrainingPlan(plan: TrainingPlan): TrainingPlan {
  const validation = validateTrainingPlan(plan);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }

  const plans = readAll();
  const index = plans.findIndex((item) => item.id === plan.id);
  if (index >= 0) {
    plans[index] = plan;
  } else {
    plans.unshift(plan);
  }
  writeAll(plans);
  return plan;
}

export function deleteTrainingPlan(id: string): boolean {
  const plans = readAll();
  const next = plans.filter((plan) => plan.id !== id);
  if (next.length === plans.length) return false;
  writeAll(next);
  return true;
}

export function clearTrainingPlans() {
  getTrainingStorageAdapter().removeItem(KEY);
}

export const MULTIPLE_ACTIVE_TRAINING_PLANS = 'MULTIPLE_ACTIVE_TRAINING_PLANS';

export function getLatestCompletedTrainingPlan(childId: string): TrainingPlan | null {
  const completed = listTrainingPlans(childId)
    .filter((plan) => plan.status === 'completed')
    .sort(
      (a, b) =>
        Date.parse(b.startDate || '') - Date.parse(a.startDate || '')
    );
  return completed[0] ?? null;
}

export function getActiveTrainingPlan(childId: string): TrainingPlan | null {
  const active = listTrainingPlans(childId).filter((plan) => plan.status === 'active');
  if (active.length === 0) return null;
  if (active.length > 1) {
    throw new Error(`${MULTIPLE_ACTIVE_TRAINING_PLANS}:${childId}`);
  }
  return active[0];
}
