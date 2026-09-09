/**
 * ربط جلسة التدريب المكتملة بـ TrackedGoal — بدون Goal engine جديد.
 */

import type { GoalSession, TrackedGoal } from '@/lib/goalsEngine';
import { loadGoalsLocal, upsertGoalLocal } from '@/lib/goalsStore';
import type { TrainingSessionMetrics } from '@/lib/training/engine/types';
import type { TrainingSessionRuntime } from '@/lib/training/engine/types';

const TRAINING_SESSION_NOTE_PREFIX = 'trainingSessionId=';

/** زيادة current بنفس روح صفحة الأهداف (mood-based increments) */
export function trainingGoalCurrentIncrement(independence: number): number {
  if (independence >= 70) return 5;
  if (independence >= 40) return 2;
  return 1;
}

function buildTrainingGoalSessionEntry(
  session: TrainingSessionRuntime,
  metrics: TrainingSessionMetrics,
  newCurrent: number
): GoalSession {
  return {
    at: session.endedAt ?? new Date().toISOString(),
    activity: `تدريب: ${session.mediaId}`,
    notes: `${TRAINING_SESSION_NOTE_PREFIX}${session.id}; independence=${metrics.independence}%; accuracy=${metrics.accuracy}%`,
    progress: newCurrent,
  };
}

function goalAlreadyHasTrainingSession(goal: TrackedGoal, sessionId: string): boolean {
  return (goal.sessions || []).some((entry) =>
    entry.notes?.includes(`${TRAINING_SESSION_NOTE_PREFIX}${sessionId}`)
  );
}

export function applyTrainingSessionToTrackedGoals(
  session: TrainingSessionRuntime,
  metrics: TrainingSessionMetrics
): TrackedGoal[] {
  if (session.status !== 'completed') return [];
  if (!session.goalIds?.length) return [];

  const updatedGoals: TrackedGoal[] = [];
  const increment = trainingGoalCurrentIncrement(metrics.independence);

  for (const goalId of session.goalIds) {
    const goal = loadGoalsLocal(session.childId).find((item) => item.id === goalId);
    if (!goal) continue;
    if (goalAlreadyHasTrainingSession(goal, session.id)) continue;

    const newCurrent = Math.min(100, goal.current + increment);
    const updated: TrackedGoal = {
      ...goal,
      current: newCurrent,
      lastUpdate: session.endedAt ?? new Date().toISOString(),
      sessions: [
        ...goal.sessions,
        buildTrainingGoalSessionEntry(session, metrics, newCurrent),
      ],
    };
    upsertGoalLocal(updated);
    updatedGoals.push(updated);
  }

  return updatedGoals;
}
