/**
 * سجل رحلة الطفل على الخادم: الباقة، الفرز، تقييم ولي الأمر، واستجابات الطفل.
 * المتصفح يحتفظ بنسخة بعد القراءة حتى تبقى بوابة الغرفة متزامنة.
 */

import { readHubJsonFile, writeHubJsonFile } from '@/lib/hubPersistence';

export const CHILD_JOURNEY_FILE = 'child-journeys.json';

export type JourneyPlanId = 'free_screening' | 'child_room' | 'clinical';

export type ChildJourneyRecord = {
  childId: string;
  childName?: string;
  parentUserId?: string;
  planId: JourneyPlanId;
  screening?: Record<string, unknown> | null;
  parentAssessments: Array<Record<string, unknown>>;
  childResponses: Array<Record<string, unknown>>;
  updatedAt: string;
};

type JourneyFile = { journeys: ChildJourneyRecord[] };

export type JourneyPatch = {
  childId: string;
  childName?: string;
  parentUserId?: string;
  planId?: JourneyPlanId;
  screening?: Record<string, unknown>;
  parentAssessment?: Record<string, unknown>;
  childResponse?: Record<string, unknown>;
  now?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function asJourneyPlan(value: unknown): JourneyPlanId | null {
  if (value === 'clinical' || value === 'child_room' || value === 'free_screening') {
    return value;
  }
  return null;
}

function asRows(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).slice(0, 40);
}

export function parseJourneyFile(raw: string | null): ChildJourneyRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as JourneyFile;
    if (!Array.isArray(parsed?.journeys)) return [];
    return parsed.journeys
      .map((row) => {
        if (!isRecord(row) || typeof row.childId !== 'string' || !row.childId.trim()) {
          return null;
        }
        const planId = asJourneyPlan(row.planId) ?? 'free_screening';
        const record: ChildJourneyRecord = {
          childId: row.childId.trim(),
          planId,
          parentAssessments: asRows(row.parentAssessments),
          childResponses: asRows(row.childResponses),
          updatedAt:
            typeof row.updatedAt === 'string' ? row.updatedAt : new Date(0).toISOString(),
        };
        if (typeof row.childName === 'string' && row.childName.trim()) {
          record.childName = row.childName.trim();
        }
        if (typeof row.parentUserId === 'string' && row.parentUserId.trim()) {
          record.parentUserId = row.parentUserId.trim();
        }
        if (isRecord(row.screening)) record.screening = row.screening;
        return record;
      })
      .filter((row): row is ChildJourneyRecord => Boolean(row));
  } catch {
    return [];
  }
}

export function mergeJourneyRecord(
  current: ChildJourneyRecord | null,
  patch: JourneyPatch
): ChildJourneyRecord {
  const childId = patch.childId.trim();
  const now = patch.now || new Date().toISOString();
  const base: ChildJourneyRecord = current ?? {
    childId,
    planId: 'free_screening',
    parentAssessments: [],
    childResponses: [],
    updatedAt: now,
  };
  const next: ChildJourneyRecord = {
    ...base,
    childId,
    planId: patch.planId ?? base.planId,
    parentAssessments: base.parentAssessments,
    childResponses: base.childResponses,
    updatedAt: now,
  };
  if (patch.childName?.trim()) next.childName = patch.childName.trim();
  if (patch.parentUserId?.trim() && !next.parentUserId) {
    next.parentUserId = patch.parentUserId.trim();
  }
  if (patch.screening) next.screening = patch.screening;
  if (patch.parentAssessment) {
    next.parentAssessments = [patch.parentAssessment, ...base.parentAssessments].slice(0, 40);
  }
  if (patch.childResponse) {
    next.childResponses = [patch.childResponse, ...base.childResponses].slice(0, 40);
  }
  return next;
}

export function upsertJourney(
  journeys: ChildJourneyRecord[],
  patch: JourneyPatch
): ChildJourneyRecord[] {
  const childId = patch.childId.trim();
  if (!childId) return journeys;
  const index = journeys.findIndex((row) => row.childId === childId);
  const next = mergeJourneyRecord(index >= 0 ? journeys[index] : null, patch);
  const copy = [...journeys];
  if (index >= 0) copy[index] = next;
  else copy.unshift(next);
  return copy.slice(0, 400);
}

export async function loadChildJourneys(): Promise<ChildJourneyRecord[]> {
  return parseJourneyFile(await readHubJsonFile(CHILD_JOURNEY_FILE));
}

export async function saveChildJourneys(journeys: ChildJourneyRecord[]): Promise<void> {
  await writeHubJsonFile(CHILD_JOURNEY_FILE, JSON.stringify({ journeys }));
}

export function journeysForParent(
  journeys: ChildJourneyRecord[],
  parentUserId: string
): ChildJourneyRecord[] {
  return journeys
    .filter((row) => row.parentUserId === parentUserId)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}
