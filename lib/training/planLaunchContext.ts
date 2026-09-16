/**
 * سياق إطلاق النشاط من خطة التدريب — sessionStorage فقط.
 * لا يُستخدم لإنشاء جلسات أو محاولات.
 */

import type { TrainingDifficulty } from '@/lib/training/types';

const LAUNCH_KEY = 'taaluf.training.launch.v1';

export type TrainingPlanLaunchContext = {
  planId: string;
  chapterId: string;
  mediaId: string;
  difficulty: TrainingDifficulty;
  order: number;
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function setTrainingPlanLaunchContext(context: TrainingPlanLaunchContext): void {
  if (!isBrowser()) return;
  sessionStorage.setItem(LAUNCH_KEY, JSON.stringify(context));
}

export function peekTrainingPlanLaunchContext(): TrainingPlanLaunchContext | null {
  if (!isBrowser()) return null;
  const raw = sessionStorage.getItem(LAUNCH_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as TrainingPlanLaunchContext;
    if (
      typeof parsed.planId !== 'string' ||
      typeof parsed.chapterId !== 'string' ||
      typeof parsed.mediaId !== 'string' ||
      typeof parsed.order !== 'number' ||
      (parsed.difficulty !== 1 && parsed.difficulty !== 2 && parsed.difficulty !== 3)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function consumeTrainingPlanLaunchContext(): TrainingPlanLaunchContext | null {
  const context = peekTrainingPlanLaunchContext();
  if (context && isBrowser()) {
    sessionStorage.removeItem(LAUNCH_KEY);
  }
  return context;
}

export function clearTrainingPlanLaunchContext(): void {
  if (!isBrowser()) return;
  sessionStorage.removeItem(LAUNCH_KEY);
}

/** قراءة planId وصعوبة مُخصّصة عند بدء النشاط */
export function readPlanLaunchForSessionBegin(): {
  planId?: string;
  sessionDifficulty?: TrainingDifficulty;
} {
  const launch = consumeTrainingPlanLaunchContext();
  if (!launch) return {};
  return {
    planId: launch.planId,
    sessionDifficulty: launch.difficulty,
  };
}
