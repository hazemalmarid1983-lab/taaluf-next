import type { AssessmentResult } from '@/types/taalof';

export {
  familyResultFromStoredSources,
  fuseAssessmentSources,
  calculateFusion,
  domainSourcesFromFusion,
  loadStoredGameScores,
  loadStoredParentScores,
  SOURCE_LABEL_AR,
  SOURCE_WEIGHTS,
  gameResultToCriteriaScores,
} from '@/lib/fusion';

/** اقتراح تاريخ التقييم القادم حسب شدة التصنيف */
export function suggestNextAssessmentDate(
  classificationLabel: string,
  from = new Date()
): string {
  const d = new Date(from);
  const label = classificationLabel.trim();
  if (label === 'شديد جداً') d.setDate(d.getDate() + 14);
  else if (label === 'شديد') d.setMonth(d.getMonth() + 1);
  else if (label === 'متوسط') d.setMonth(d.getMonth() + 2);
  else if (label === 'خفيف') d.setMonth(d.getMonth() + 3);
  else d.setMonth(d.getMonth() + 6); // طبيعي أو غير معروف
  return d.toISOString().slice(0, 10);
}

export type StoredAssessment = {
  id: string;
  studentId: string;
  studentName?: string;
  savedAt: string;
  percentage: number;
  classification: string;
  totalScore: number;
  maxScore: number;
  domainAverages: Record<string, number>;
  scores: Array<{
    criterionId: string;
    score: number;
    specialistNotes?: string;
    evidence?: string[];
  }>;
  nextAssessmentDate?: string;
  aiAnalysis?: unknown;
};

const STORE_KEY = 'taaluf.assessments.v1';

export function loadStoredAssessments(): StoredAssessment[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveStoredAssessment(row: StoredAssessment) {
  const list = loadStoredAssessments().filter((a) => a.id !== row.id);
  localStorage.setItem(STORE_KEY, JSON.stringify([row, ...list].slice(0, 80)));
}

export function persistLocalAssessment(
  row: Omit<StoredAssessment, 'id' | 'savedAt'> & {
    id?: string;
    savedAt?: string;
  }
): StoredAssessment {
  const previous = getPreviousAssessment(row.studentId);
  const reuseLatest =
    !row.id &&
    !!previous &&
    Date.now() - new Date(previous.savedAt).getTime() < 2 * 60 * 60 * 1000;
  const stored: StoredAssessment = {
    ...row,
    id: row.id || (reuseLatest && previous ? previous.id : `local_${Date.now()}`),
    savedAt:
      row.savedAt ||
      (reuseLatest && previous
        ? previous.savedAt
        : new Date().toISOString()),
  };
  saveStoredAssessment(stored);
  return stored;
}

export function listStudentAssessmentsChronological(
  studentId: string
): StoredAssessment[] {
  return loadStoredAssessments()
    .filter((a) => a.studentId === studentId)
    .sort(
      (a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()
    );
}

export function getPreviousAssessment(
  studentId: string
): StoredAssessment | null {
  if (!studentId) return null;
  const list = loadStoredAssessments().filter((a) => a.studentId === studentId);
  return list[0] || null;
}

/** درجة أعلى = حاجة أكبر → انخفاض النسبة = تحسن */
export function compareWithPrevious(
  current: AssessmentResult,
  previous: StoredAssessment | null
) {
  if (!previous) return null;
  const delta = current.percentage - previous.percentage;
  return {
    previousPercentage: previous.percentage,
    previousClassification: previous.classification,
    previousDate: previous.savedAt,
    delta,
    improved: delta < 0,
    declined: delta > 0,
    unchanged: delta === 0,
  };
}

export const LEVEL_THEME: Record<
  number,
  { track: string; thumb: string; badge: string; label: string }
> = {
  0: {
    track: 'bg-emerald-500',
    thumb: 'border-emerald-600',
    badge: 'bg-emerald-600 text-white',
    label: 'مستقر',
  },
  1: {
    track: 'bg-sky-500',
    thumb: 'border-sky-600',
    badge: 'bg-sky-600 text-white',
    label: 'متوسط',
  },
  2: {
    track: 'bg-orange-500',
    thumb: 'border-orange-600',
    badge: 'bg-orange-500 text-white',
    label: 'شديد',
  },
  3: {
    track: 'bg-rose-600',
    thumb: 'border-rose-700',
    badge: 'bg-rose-600 text-white',
    label: 'شديد جداً',
  },
};
