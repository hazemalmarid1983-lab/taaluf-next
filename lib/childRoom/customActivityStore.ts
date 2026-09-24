/**
 * وسائل الأهداف الخاصة داخل غرفة الطفل — محفوظة على الخادم.
 */

import {
  buildLocalActivity,
  trainingMediaForGoal,
} from '@/lib/activityGenerator';
import type { HomeClassroomGoal } from '@/lib/homeClassroomEngine';
import { readHubJsonFile, writeHubJsonFile } from '@/lib/hubPersistence';

export const CUSTOM_ACTIVITIES_FILE = 'child-room-custom-activities.json';

export type RoomCustomActivity = {
  id: string;
  childId: string;
  goalText: string;
  mediaId: string;
  activity: HomeClassroomGoal;
  createdAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

export function parseCustomActivities(raw: string | null): RoomCustomActivity[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { activities?: unknown[] };
    if (!Array.isArray(parsed.activities)) return [];
    return parsed.activities.flatMap((item) => {
      if (!isRecord(item)) return [];
      const goalText = String(item.goalText || '').trim();
      const childId = String(item.childId || '').trim();
      if (!goalText || !childId) return [];
      const activity = isRecord(item.activity)
        ? (item.activity as unknown as HomeClassroomGoal)
        : buildLocalActivity(goalText);
      return [
        {
          id: String(item.id || activity.id),
          childId,
          goalText,
          mediaId: String(item.mediaId || trainingMediaForGoal(goalText)),
          activity,
          createdAt: String(item.createdAt || new Date().toISOString()),
        },
      ];
    });
  } catch {
    return [];
  }
}

export function latestCustomForChild(
  activities: RoomCustomActivity[],
  childId: string
): RoomCustomActivity | null {
  return (
    activities
      .filter((item) => item.childId === childId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0] ?? null
  );
}

export function addCustomActivity(
  activities: RoomCustomActivity[],
  input: {
    childId: string;
    goalText: string;
    activity?: HomeClassroomGoal;
  }
): { ok: true; activities: RoomCustomActivity[]; activity: RoomCustomActivity } | { ok: false; error: string } {
  const childId = input.childId.trim();
  const goalText = input.goalText.trim();
  if (!childId) return { ok: false, error: 'CHILD_REQUIRED' };
  if (goalText.length < 5) return { ok: false, error: 'GOAL_TEXT_REQUIRED' };
  if (goalText.length > 300) return { ok: false, error: 'GOAL_TEXT_TOO_LONG' };
  const generated = input.activity || buildLocalActivity(goalText);
  const row: RoomCustomActivity = {
    id: generated.id || `custom_${Date.now().toString(36)}`,
    childId,
    goalText,
    mediaId: trainingMediaForGoal(goalText),
    activity: { ...generated, sourceGoalText: goalText, origin: 'generated' },
    createdAt: new Date().toISOString(),
  };
  return { ok: true, activities: [row, ...activities].slice(0, 200), activity: row };
}

export async function loadCustomActivities(): Promise<RoomCustomActivity[]> {
  return parseCustomActivities(await readHubJsonFile(CUSTOM_ACTIVITIES_FILE));
}

export async function saveCustomActivities(activities: RoomCustomActivity[]): Promise<void> {
  await writeHubJsonFile(CUSTOM_ACTIVITIES_FILE, JSON.stringify({ activities }));
}
