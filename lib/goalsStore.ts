import type { TrackedGoal } from '@/lib/goalsEngine';

const KEY = 'taaluf.goals.v1';

export function loadGoalsLocal(childId?: string): TrackedGoal[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]') as TrackedGoal[];
    if (!Array.isArray(list)) return [];
    return childId ? list.filter((g) => g.childId === childId) : list;
  } catch {
    return [];
  }
}

export function saveGoalsLocal(goals: TrackedGoal[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(goals.slice(0, 200)));
}

export function upsertGoalLocal(goal: TrackedGoal) {
  const all = loadGoalsLocal();
  const next = [goal, ...all.filter((g) => g.id !== goal.id)];
  saveGoalsLocal(next);
  return goal;
}
