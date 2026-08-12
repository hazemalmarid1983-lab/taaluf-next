/**
 * بوابة منع فتح أكثر من تقييم نشط/مكتمل للطفل الواحد.
 */

import {
  loadStoredAssessments,
  type StoredAssessment,
} from '@/lib/assessmentHelpers';

export const ASSESSMENT_DRAFT_KEY = 'taaluf.assessment.draft.v1';

export type AssessmentDraft = {
  childId: string;
  scores: Record<string, number>;
  notes?: Record<string, string>;
  step?: number;
  updatedAt: string;
  status: 'in_progress' | 'completed_pending_report';
};

export type ActiveAssessmentInfo = {
  active: boolean;
  reason?: 'draft' | 'completed';
  message: string;
  latest?: StoredAssessment | null;
  draft?: AssessmentDraft | null;
};

const ACTIVE_TOAST =
  'لديك تقييم قيد المعالجة، يرجى إكماله أو عرض تقريره أولاً.';

function readDraft(): AssessmentDraft | null {
  try {
    const raw = localStorage.getItem(ASSESSMENT_DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as AssessmentDraft;
    if (!d?.childId) return null;
    return d;
  } catch {
    return null;
  }
}

export function saveAssessmentDraft(draft: AssessmentDraft) {
  localStorage.setItem(ASSESSMENT_DRAFT_KEY, JSON.stringify(draft));
}

export function clearAssessmentDraft(childId?: string) {
  const d = readDraft();
  if (!childId || !d || d.childId === childId) {
    localStorage.removeItem(ASSESSMENT_DRAFT_KEY);
  }
}

export function getLatestAssessmentForChild(
  childId: string
): StoredAssessment | null {
  if (!childId) return null;
  const list = loadStoredAssessments().filter((a) => a.studentId === childId);
  return list[0] || null;
}

/**
 * يمنع فتح تقييم جديد إذا وُجدت مسودة قيد المعالجة أو تقييم مكتمل لنفس الطفل.
 */
export function hasActiveAssessment(childId: string): ActiveAssessmentInfo {
  if (!childId || childId === 'local') {
    return { active: false, message: '' };
  }

  const draft = readDraft();
  if (
    draft &&
    draft.childId === childId &&
    (draft.status === 'in_progress' ||
      draft.status === 'completed_pending_report')
  ) {
    return {
      active: true,
      reason: 'draft',
      message: ACTIVE_TOAST,
      draft,
      latest: getLatestAssessmentForChild(childId),
    };
  }

  const latest = getLatestAssessmentForChild(childId);
  if (latest) {
    return {
      active: true,
      reason: 'completed',
      message: ACTIVE_TOAST,
      latest,
      draft,
    };
  }

  return { active: false, message: '' };
}

/** استبيان الأهل: يمنع التكرار إن اكتمل أو بقيت مسودة. */
export function hasActiveParentQuestionnaire(childId: string): ActiveAssessmentInfo {
  if (!childId || childId === 'local') {
    return { active: false, message: '' };
  }

  try {
    const draftRaw = localStorage.getItem('taaluf.parentAssessment.draft');
    if (draftRaw) {
      const draft = JSON.parse(draftRaw) as Record<string, number>;
      if (draft && Object.keys(draft).length > 0) {
        return {
          active: true,
          reason: 'draft',
          message: ACTIVE_TOAST,
        };
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const parentAssess = JSON.parse(
      localStorage.getItem('taaluf.parentAssessment.v1') || '[]'
    );
    if (Array.isArray(parentAssess)) {
      const mine = parentAssess.find(
        (p: { childId?: string }) => p?.childId === childId
      );
      if (mine) {
        return {
          active: true,
          reason: 'completed',
          message: ACTIVE_TOAST,
        };
      }
    }
  } catch {
    /* ignore */
  }

  return { active: false, message: '' };
}

export function recommendationForLevel(
  recommendation: string,
  score: number | null | undefined,
  levelLabel?: string
): string {
  if (score == null || Number.isNaN(Number(score))) return '';
  if (score === 0) {
    return `المستوى مستقر${levelLabel ? ` (${levelLabel})` : ''}. استمر في تعزيز المهارة ومراقبتها دورياً. ${recommendation}`;
  }
  if (score === 1) {
    return `بناءً على اختيار «${levelLabel || 'متوسط'}»: ركّز على دعم خفيف ومتابعة أسبوعية. ${recommendation}`;
  }
  if (score === 2) {
    return `بناءً على اختيار «${levelLabel || 'شديد'}»: طبّق الخطة التربوية بشكل منتظم. ${recommendation}`;
  }
  return `بناءً على اختيار «${levelLabel || 'شديد جداً'}»: أولوية تدخل فورية مع متابعة لصيقة. ${recommendation}`;
}
