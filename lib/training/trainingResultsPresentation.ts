/**
 * عرض نتائج التدريب — تنسيق وقراءة فقط (لا مصدر بيانات).
 */

import { calculateSessionMetrics } from '@/lib/training/engine/metrics';
import type { TrainingSessionMetrics } from '@/lib/training/engine/types';
import type { TrainingSessionRuntime } from '@/lib/training/engine/types';
import type { TrackedGoal } from '@/lib/goalsEngine';
import { trainingGoalCurrentIncrement } from '@/lib/training/goalFeedback';
import {
  findMediaInChapter,
  loadChapterById,
} from '@/lib/training/loadChapter';
import {
  PROMPT_HIERARCHY_LEVELS,
  promptOptionByLevel,
  type PromptHierarchyLevel,
} from '@/lib/promptHierarchy';
import type { TrainingPromptLevel } from '@/lib/training/types';

export const TRAINING_SESSION_ID_IN_NOTES = 'trainingSessionId=';

export type ActiveStudentProfile = {
  id: string;
  name?: string;
};

export function readActiveStudentProfile(): ActiveStudentProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('taaluf.activeStudent');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id?: string; name?: string };
    const id = parsed?.id?.trim();
    if (!id) return null;
    return { id, name: parsed.name?.trim() || undefined };
  } catch {
    return null;
  }
}

export function isCompletedTrainingSession(
  session: TrainingSessionRuntime
): boolean {
  return session.status === 'completed' && Boolean(session.endedAt);
}

export function filterCompletedSessionsForChild(
  sessions: TrainingSessionRuntime[],
  childId: string
): TrainingSessionRuntime[] {
  return sessions
    .filter(
      (session) =>
        session.childId === childId && isCompletedTrainingSession(session)
    )
    .sort((a, b) => {
      const aTime = Date.parse(a.endedAt ?? a.startedAt);
      const bTime = Date.parse(b.endedAt ?? b.startedAt);
      return bTime - aTime;
    });
}

export function canViewTrainingSession(
  session: TrainingSessionRuntime | null | undefined,
  activeChildId: string | null
): session is TrainingSessionRuntime {
  if (!session || !activeChildId) return false;
  if (session.childId !== activeChildId) return false;
  return isCompletedTrainingSession(session);
}

export function resolveSessionMetrics(
  session: TrainingSessionRuntime
): TrainingSessionMetrics {
  return calculateSessionMetrics(session.trials);
}

export function resolveMediaTitleAr(
  chapterId: string,
  mediaId: string
): string {
  try {
    const chapter = loadChapterById(chapterId);
    const media = findMediaInChapter(chapter, mediaId);
    return media?.titleAr ?? mediaId;
  } catch {
    return mediaId;
  }
}

export function formatTrainingDate(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ar-EG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export function formatResponseTimeMs(ms: number | undefined | null): string {
  if (ms === undefined || ms === null || !Number.isFinite(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function promptLevelLabelAr(level: TrainingPromptLevel): string {
  const human = promptOptionByLevel(level as PromptHierarchyLevel);
  if (human) return human.labelAr;
  if (level === 'visual_hint') return 'تلميح بصري (رقمي)';
  if (level === 'reduced_choices') return 'خيارات مخفّضة (رقمي)';
  if (level === 'direct_visual_assistance') return 'مساعدة بصرية مباشرة (رقمي)';
  return level;
}

export function promptBreakdownEntries(
  metrics: TrainingSessionMetrics
): { level: TrainingPromptLevel; labelAr: string; count: number }[] {
  return (Object.entries(metrics.promptBreakdown) as [TrainingPromptLevel, number][])
    .filter(([, count]) => count > 0)
    .map(([level, count]) => ({
      level,
      labelAr: promptLevelLabelAr(level),
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/** للاختبار — ترتيب PROMPT_HIERARCHY لا يُستخدم للفلترة */
export function allKnownPromptLabelsIncludeNoResponse(): boolean {
  return PROMPT_HIERARCHY_LEVELS.some((item) => item.level === 'no_response');
}

export type ParsedTrainingGoalNotes = {
  trainingSessionId: string;
  independence?: number;
  accuracy?: number;
};

export function parseTrainingGoalSessionNotes(
  notes: string | undefined
): ParsedTrainingGoalNotes | null {
  if (!notes?.includes(TRAINING_SESSION_ID_IN_NOTES)) return null;
  const idMatch = notes.match(/trainingSessionId=([^;\s]+)/);
  if (!idMatch?.[1]) return null;
  const independenceMatch = notes.match(/independence=(\d+)%/);
  const accuracyMatch = notes.match(/accuracy=(\d+)%/);
  return {
    trainingSessionId: idMatch[1],
    independence: independenceMatch
      ? Number(independenceMatch[1])
      : undefined,
    accuracy: accuracyMatch ? Number(accuracyMatch[1]) : undefined,
  };
}

export type GoalImpactPresentation = {
  goalId: string;
  goalTitle: string;
  recordedProgressAfter: number | null;
  incrementDisplay: string | null;
};

export function resolveGoalImpactsForSession(
  session: TrainingSessionRuntime,
  goals: TrackedGoal[]
): GoalImpactPresentation[] {
  if (!session.goalIds?.length) return [];

  return session.goalIds
    .map((goalId) => {
      const goal = goals.find((item) => item.id === goalId);
      if (!goal) {
        return {
          goalId,
          goalTitle: goalId,
          recordedProgressAfter: null,
          incrementDisplay: null,
        };
      }

      const entry = goal.sessions.find((s) => {
        const parsed = parseTrainingGoalSessionNotes(s.notes);
        return parsed?.trainingSessionId === session.id;
      });

      if (!entry) {
        return {
          goalId: goal.id,
          goalTitle: goal.title,
          recordedProgressAfter: null,
          incrementDisplay: null,
        };
      }

      const parsed = parseTrainingGoalSessionNotes(entry.notes);
      let incrementDisplay: string | null = null;
      if (parsed?.independence !== undefined) {
        const inc = trainingGoalCurrentIncrement(parsed.independence);
        incrementDisplay = `+${inc}`;
      }

      return {
        goalId: goal.id,
        goalTitle: goal.title,
        recordedProgressAfter:
          typeof entry.progress === 'number' ? entry.progress : null,
        incrementDisplay,
      };
    })
    .filter(Boolean);
}

export function resolveGoalTitles(
  goalIds: string[] | undefined,
  goals: TrackedGoal[]
): string[] {
  if (!goalIds?.length) return [];
  return goalIds.map((id) => goals.find((g) => g.id === id)?.title ?? id);
}
