'use client';

import { readActiveChild, saveActiveChild, SCREENING_RESULT_KEY } from '@/lib/parentJourney';
import { saveSelectedTier, type SubscriptionTierId } from '@/lib/subscriptionTiers';
import type { ChildJourneyRecord, JourneyPlanId } from '@/lib/childRoom/journeyStore';

export const JOURNEY_HYDRATED_EVENT = 'taaluf-journey-hydrated';
const PARENT_KEY = 'taaluf.parentAssessment.v1';
const GAMES_KEY = 'taaluf.gameSessions.v1';

export async function publishChildJourney(body: {
  childId: string;
  childName?: string;
  planId?: SubscriptionTierId;
  screening?: Record<string, unknown>;
  parentAssessment?: Record<string, unknown>;
  childResponse?: Record<string, unknown>;
}): Promise<void> {
  if (!body.childId || body.childId === 'child_local') return;
  await fetch('/api/child-journey', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

export function applyJourneyRecord(record: ChildJourneyRecord, setActive: boolean) {
  if (typeof window === 'undefined') return;
  if (setActive && record.childId) {
    saveActiveChild({
      id: record.childId,
      name: record.childName || record.childId,
    });
  }
  if (record.planId) saveSelectedTier(record.planId as JourneyPlanId);
  if (record.screening) {
    localStorage.setItem(SCREENING_RESULT_KEY, JSON.stringify(record.screening));
  }
  if (record.parentAssessments.length > 0) {
    localStorage.setItem(PARENT_KEY, JSON.stringify(record.parentAssessments));
  }
  if (record.childResponses.length > 0) {
    localStorage.setItem(GAMES_KEY, JSON.stringify(record.childResponses));
  }
  window.dispatchEvent(new Event(JOURNEY_HYDRATED_EVENT));
}

export async function applyServerJourney(): Promise<void> {
  const response = await fetch('/api/child-journey').catch(() => null);
  if (!response?.ok) return;
  const data = (await response.json().catch(() => null)) as {
    journeys?: ChildJourneyRecord[];
  } | null;
  const journeys = data?.journeys || [];
  if (!journeys.length) return;
  const local = readActiveChild();
  const match = local?.id ? journeys.find((row) => row.childId === local.id) : null;
  const chosen = match || (!local?.id ? journeys[0] : null);
  if (!chosen) return;
  applyJourneyRecord(chosen, !local?.id || local.id === chosen.childId);
}
