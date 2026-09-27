/**
 * السجل السريري للطفل على الخادم — مصدر الحقيقة للأهداف والجلسات ومجسات التعميم والصيانة.
 * مستند مستقل لكل طفل فوق تخزين الـ hub (Vercel Blob في الإنتاج، ملفات محلياً)،
 * وفهرس لكل مستخدم بالأطفال المرتبطين به.
 * التخزين غير تبادلي (non-transactional): الكتابات تُسلسل داخل العملية فقط.
 */

import type { GeneralizationProbe } from '@/lib/generalizationIndex';
import type { TrackedGoal } from '@/lib/goalsEngine';
import { readHubJsonFile, writeHubJsonFile } from '@/lib/hubPersistence';
import type { IoaRecord } from '@/types/clinical';

export const CLINICAL_RECORDS_DIR = 'clinical-records';
export const MAX_GOALS_PER_CHILD = 200;
export const MAX_IOA_RECORDS_PER_CHILD = 2000;

const SAFE_ID = /^[A-Za-z0-9_-]{1,80}$/;
const RESERVED_CHILD_IDS = new Set(['local', 'child_local']);

export class ClinicalStoreError extends Error {
  constructor(public code: 'INVALID_ID' | 'RESERVED_CHILD_ID') {
    super(code);
  }
}

export function isValidStoreId(id: unknown): id is string {
  return typeof id === 'string' && SAFE_ID.test(id);
}

export function assertChildId(childId: unknown): string {
  if (!isValidStoreId(childId)) throw new ClinicalStoreError('INVALID_ID');
  if (RESERVED_CHILD_IDS.has(childId)) throw new ClinicalStoreError('RESERVED_CHILD_ID');
  return childId;
}

export type ClinicalAssessmentSummary = {
  id: string;
  savedAt: string;
  source: 'specialist' | 'parent' | 'screening';
  percentage?: number;
  classification?: string;
  recordedBy: string;
};

export type ClinicalChildRecord = {
  version: 1;
  childId: string;
  childName?: string;
  parentUserIds: string[];
  specialistUserIds: string[];
  goals: TrackedGoal[];
  generalizationProbes: GeneralizationProbe[];
  assessments: ClinicalAssessmentSummary[];
  /** سجلات اتفاق الملاحظين */
  ioaRecords: IoaRecord[];
  /** أهداف حُذفت على الخادم — لا تُعاد من نسخة متصفح قديمة */
  deletedGoalIds: string[];
  createdAt: string;
  updatedAt: string;
};

type UserIndex = { childIds: string[] };

function childFile(childId: string) {
  return `${CLINICAL_RECORDS_DIR}/children/${assertChildId(childId)}.json`;
}

function userFile(userId: string) {
  if (!isValidStoreId(userId)) throw new ClinicalStoreError('INVALID_ID');
  return `${CLINICAL_RECORDS_DIR}/users/${userId}.json`;
}

const queues = new Map<string, Promise<unknown>>();

/** يسلسل عمليات القراءة-التعديل-الكتابة على نفس الملف داخل العملية */
export function withFileLock<T>(file: string, task: () => Promise<T>): Promise<T> {
  const previous = queues.get(file) ?? Promise.resolve();
  const run = previous.then(task, task);
  queues.set(
    file,
    run.catch(() => undefined)
  );
  return run;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function array<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function emptyChildRecord(childId: string, now: string): ClinicalChildRecord {
  return {
    version: 1,
    childId: assertChildId(childId),
    parentUserIds: [],
    specialistUserIds: [],
    goals: [],
    generalizationProbes: [],
    assessments: [],
    ioaRecords: [],
    deletedGoalIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function parseChildRecord(raw: string | null, childId: string): ClinicalChildRecord | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<ClinicalChildRecord>;
    if (p?.childId !== childId) return null;
    const record: ClinicalChildRecord = {
      version: 1,
      childId,
      parentUserIds: strings(p.parentUserIds),
      specialistUserIds: strings(p.specialistUserIds),
      goals: array<TrackedGoal>(p.goals),
      generalizationProbes: array<GeneralizationProbe>(p.generalizationProbes),
      assessments: array<ClinicalAssessmentSummary>(p.assessments),
      ioaRecords: array<IoaRecord>(p.ioaRecords),
      deletedGoalIds: strings(p.deletedGoalIds),
      createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date(0).toISOString(),
      updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date(0).toISOString(),
    };
    if (typeof p.childName === 'string' && p.childName.trim()) record.childName = p.childName.trim();
    return record;
  } catch {
    return null;
  }
}

export async function loadChildRecord(childId: string): Promise<ClinicalChildRecord | null> {
  return parseChildRecord(await readHubJsonFile(childFile(childId)), childId);
}

async function writeChildRecord(record: ClinicalChildRecord): Promise<void> {
  await writeHubJsonFile(childFile(record.childId), JSON.stringify(record));
}

/**
 * تعديل ذري (داخل العملية) لسجل الطفل. mutate تعيد السجل الجديد أو null لعدم الحفظ.
 */
export function updateChildRecord<R extends { record: ClinicalChildRecord | null; result: unknown }>(
  childId: string,
  mutate: (current: ClinicalChildRecord | null) => Promise<R> | R
): Promise<R['result']> {
  const file = childFile(childId);
  return withFileLock(file, async () => {
    const current = await loadChildRecord(childId);
    const { record, result } = await mutate(current);
    if (record) {
      record.goals = record.goals.slice(0, MAX_GOALS_PER_CHILD);
      await writeChildRecord(record);
    }
    return result;
  });
}

export async function listChildIdsForUser(userId: string): Promise<string[]> {
  if (!isValidStoreId(userId)) return [];
  try {
    const raw = await readHubJsonFile(userFile(userId));
    if (!raw) return [];
    return strings((JSON.parse(raw) as UserIndex).childIds);
  } catch {
    return [];
  }
}

export function indexChildForUser(userId: string, childId: string): Promise<void> {
  const file = userFile(userId);
  assertChildId(childId);
  return withFileLock(file, async () => {
    const ids = await listChildIdsForUser(userId);
    if (ids.includes(childId)) return;
    const next: UserIndex = { childIds: [childId, ...ids].slice(0, 50) };
    await writeHubJsonFile(file, JSON.stringify(next));
  });
}
