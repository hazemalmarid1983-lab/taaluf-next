import { evaluateComprehensiveAssessment } from '@/lib/academicAssessmentEngine';
import {
  evaluateLearningScreening,
  type LearningScreeningResult,
} from '@/lib/learningScreeningEngine';
import { getPreviousAssessment } from '@/lib/assessmentHelpers';
import { PARENT_ROUTES } from '@/lib/parentJourney';
import {
  bandLabelAr,
  normalizeScreeningResult,
  type ScreeningResult,
} from '@/lib/screeningEngine';
import type { ComprehensiveAssessmentReport } from '@/lib/academicAssessmentEngine';
import {
  SENSORY_SANCTUARY_LOCAL_KEY,
  sensoryChipDetail,
} from '@/lib/sensorySanctuary';
import {
  SENSORY_MATCHING_LOCAL_KEY,
  sensoryMatchingChipDetail,
} from '@/lib/sensoryMatching';

export const DEV_SCREENING_KEY = 'taaluf.screening.v1';
export const ACADEMIC_SCREENING_KEY = 'taaluf.learningScreening.v1';
export const ACADEMIC_SCREENING_ALIAS = 'taaluf_learning_screening_answers';
export const ACADEMIC_FULL_ANSWERS_KEY = 'taaluf_comprehensive_academic_answers';
export const ACADEMIC_FULL_REPORT_KEY = 'taaluf_comprehensive_academic_report';

export type PathwayLevel = 'none' | 'low' | 'moderate' | 'high';

export type PathwayDomainChip = {
  label: string;
  value: string;
};

export type PathwaySnapshot = {
  available: boolean;
  kind: 'developmental' | 'academic';
  source: 'none' | 'screening' | 'assessment' | 'comprehensive';
  title: string;
  summary: string;
  scoreText: string;
  level: PathwayLevel;
  href: string;
  domains: PathwayDomainChip[];
  savedAt?: string;
};

export type PathwayGameChip = {
  id: string;
  pathway: 'developmental' | 'academic';
  title: string;
  detail: string;
  completedAt?: string;
};

export type ChildPathwayRecord = {
  childId?: string;
  childName: string;
  developmental: PathwaySnapshot;
  academic: PathwaySnapshot;
  games: PathwayGameChip[];
};

type StoredWithChild = {
  childId?: string;
  savedAt?: string;
  completedAt?: string;
};

function readJson<T>(key: string): T | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function matchesChild(storedId: string | undefined, childId?: string) {
  if (!childId) return true;
  if (!storedId) return true;
  return storedId === childId || storedId === 'child_local';
}

function activeChild() {
  const primary = readJson<{ id?: string; name?: string }>(
    'taaluf.activeStudent'
  );
  const alias = readJson<{ id?: string; name?: string }>(
    'taaluf_current_child'
  );
  const raw = primary?.id ? primary : alias;
  if (!raw?.id || raw.id === 'local') return null;
  return { id: String(raw.id), name: raw.name || 'الطفل' };
}

function screeningLevel(band?: ScreeningResult['band']): PathwayLevel {
  if (band === 'elevated') return 'high';
  if (band === 'moderate') return 'moderate';
  if (band === 'balanced') return 'low';
  return 'none';
}

function academicLevel(
  level?: LearningScreeningResult['overallRiskLevel']
): PathwayLevel {
  if (level === 'high' || level === 'moderate' || level === 'low') return level;
  return 'none';
}

function comprehensiveLevel(
  report?: ComprehensiveAssessmentReport | null
): PathwayLevel {
  if (!report) return 'none';
  const ranks: PathwayLevel[] = ['none', 'low', 'moderate', 'high'];
  let top: PathwayLevel = 'none';
  Object.values(report.domains).forEach((d) => {
    const mapped: PathwayLevel =
      d.severity === 'severe'
        ? 'high'
        : d.severity === 'moderate'
          ? 'moderate'
          : d.severity === 'mild'
            ? 'low'
            : 'low';
    if (ranks.indexOf(mapped) > ranks.indexOf(top)) top = mapped;
  });
  return top;
}

export function readDevelopmentalPathway(childId?: string): PathwaySnapshot {
  const empty: PathwaySnapshot = {
    available: false,
    kind: 'developmental',
    source: 'none',
    title: 'المسار النمائي والتواصلي',
    summary: 'لم يُحفظ فرز نمائي بعد.',
    scoreText: '—',
    level: 'none',
    href: PARENT_ROUTES.screening,
    domains: [],
  };

  const payload = readJson<
    StoredWithChild & { result?: ScreeningResult }
  >(DEV_SCREENING_KEY);
  if (payload?.result?.domainScores && matchesChild(payload.childId, childId)) {
    const result = normalizeScreeningResult(payload.result);
    return {
      available: true,
      kind: 'developmental',
      source: 'screening',
      title: 'المسار النمائي والتواصلي',
      summary: `فرز أولي: ${bandLabelAr(result.band)}`,
      scoreText: `${result.overall}%`,
      level: screeningLevel(result.band),
      href: PARENT_ROUTES.screening,
      domains: result.domainScores.map((d) => ({
        label: d.label_ar,
        value: `${d.scorePercent}%`,
      })),
      savedAt: payload.savedAt,
    };
  }

  if (childId) {
    const prev = getPreviousAssessment(childId);
    if (prev) {
      return {
        available: true,
        kind: 'developmental',
        source: 'assessment',
        title: 'المسار النمائي والتواصلي',
        summary: `تقييم تربوي: ${prev.classification}`,
        scoreText: `${prev.percentage}%`,
        level:
          prev.percentage >= 50
            ? 'high'
            : prev.percentage >= 25
              ? 'moderate'
              : 'low',
        href: '/dashboard/assessments/new?view=results',
        domains: Object.entries(prev.domainAverages || {}).map(
          ([label, value]) => ({
            label,
            value: String(value),
          })
        ),
        savedAt: prev.savedAt,
      };
    }
  }

  return empty;
}

export function readAcademicPathway(childId?: string): PathwaySnapshot {
  const empty: PathwaySnapshot = {
    available: false,
    kind: 'academic',
    source: 'none',
    title: 'المسار الأكاديمي والدعم المدرسي',
    summary: 'لم يُحفظ فرز أكاديمي بعد.',
    scoreText: '—',
    level: 'none',
    href: PARENT_ROUTES.learningScreening,
    domains: [],
  };

  const fullAnswers = readJson<Record<string, number>>(ACADEMIC_FULL_ANSWERS_KEY);
  const fullReport = readJson<ComprehensiveAssessmentReport>(
    ACADEMIC_FULL_REPORT_KEY
  );
  const computedFull =
    fullReport?.domains || (fullAnswers && Object.keys(fullAnswers).length)
      ? fullReport ||
        evaluateComprehensiveAssessment(fullAnswers || {}, 'الطالب / الطالبة')
      : null;

  if (computedFull) {
    return {
      available: true,
      kind: 'academic',
      source: 'comprehensive',
      title: 'المسار الأكاديمي والدعم المدرسي',
      summary: computedFull.primaryDiagnosisAr,
      scoreText: `${computedFull.overallPercentage}%`,
      level: comprehensiveLevel(computedFull),
      href: PARENT_ROUTES.academicAssessment,
      domains: Object.values(computedFull.domains).map((d) => ({
        label: d.label,
        value: `${d.score}/${d.maxScore}`,
      })),
      savedAt: computedFull.assessmentDate,
    };
  }

  const screeningPayload = readJson<
    StoredWithChild & {
      answers?: Record<string, number>;
      result?: LearningScreeningResult;
    }
  >(ACADEMIC_SCREENING_KEY);
  const aliasAnswers = readJson<Record<string, number>>(ACADEMIC_SCREENING_ALIAS);

  if (
    screeningPayload &&
    matchesChild(screeningPayload.childId, childId) &&
    (screeningPayload.result?.domainResults || screeningPayload.answers)
  ) {
    const result =
      screeningPayload.result ||
      evaluateLearningScreening(screeningPayload.answers || {});
    return {
      available: true,
      kind: 'academic',
      source: 'screening',
      title: 'المسار الأكاديمي والدعم المدرسي',
      summary: result.overallRiskText,
      scoreText: `${result.totalScore}/${result.maxTotalScore}`,
      level: academicLevel(result.overallRiskLevel),
      href: PARENT_ROUTES.learningScreening,
      domains: Object.values(result.domainResults).map((d) => ({
        label: d.label,
        value: `${d.score}/${d.maxScore}`,
      })),
      savedAt: screeningPayload.savedAt || result.completedAt,
    };
  }

  if (aliasAnswers && Object.keys(aliasAnswers).length && !childId) {
    const result = evaluateLearningScreening(aliasAnswers);
    return {
      available: true,
      kind: 'academic',
      source: 'screening',
      title: 'المسار الأكاديمي والدعم المدرسي',
      summary: result.overallRiskText,
      scoreText: `${result.totalScore}/${result.maxTotalScore}`,
      level: academicLevel(result.overallRiskLevel),
      href: PARENT_ROUTES.learningScreening,
      domains: Object.values(result.domainResults).map((d) => ({
        label: d.label,
        value: `${d.score}/${d.maxScore}`,
      })),
      savedAt: result.completedAt,
    };
  }

  return empty;
}

function readGameChip(
  key: string,
  pathway: PathwayGameChip['pathway'],
  title: string,
  childId?: string
): PathwayGameChip | null {
  const raw = readJson<{
    childId?: string;
    completedAt?: string;
    domain?: string;
    metrics?: Record<string, number>;
  }>(key);
  if (!raw || !matchesChild(raw.childId, childId)) return null;
  const accuracy =
    key === SENSORY_SANCTUARY_LOCAL_KEY
      ? sensoryChipDetail(raw.metrics || {})
      : key === SENSORY_MATCHING_LOCAL_KEY
        ? sensoryMatchingChipDetail(raw.metrics || {})
        : raw.metrics?.accuracyRate != null
          ? `${Math.round(Number(raw.metrics.accuracyRate))}% دقة`
          : raw.metrics?.jointAttentionRate != null
            ? `${Math.round(Number(raw.metrics.jointAttentionRate))}% انتباه مشترك`
            : raw.domain || 'جلسة مكتملة';
  return {
    id: key,
    pathway,
    title,
    detail: accuracy,
    completedAt: raw.completedAt,
  };
}

export function readPathwayGames(childId?: string): PathwayGameChip[] {
  return [
    readGameChip(
      'taaluf_game_emotion_mirror',
      'developmental',
      'مرآة المشاعر',
      childId
    ),
    readGameChip(
      'taaluf_game_bubble_seeker',
      'developmental',
      'صائد الفقاعات',
      childId
    ),
    readGameChip(
      'taaluf_game_memory_train',
      'academic',
      'قطار الذاكرة',
      childId
    ),
    readGameChip(
      'taaluf_game_letter_hunter',
      'academic',
      'صائد الحروف',
      childId
    ),
    readGameChip(
      SENSORY_SANCTUARY_LOCAL_KEY,
      'developmental',
      'الغرفة الحسية · بحيرة الأسماك',
      childId
    ),
    readGameChip(
      SENSORY_MATCHING_LOCAL_KEY,
      'developmental',
      'مطابقة الصور والتعريف الصوتي',
      childId
    ),
  ].filter((g): g is PathwayGameChip => Boolean(g));
}

export function readChildPathwayRecord(childId?: string): ChildPathwayRecord {
  const active = activeChild();
  const id = childId || active?.id;
  return {
    childId: id,
    childName: active?.name || 'الطفل',
    developmental: readDevelopmentalPathway(id),
    academic: readAcademicPathway(id),
    games: readPathwayGames(id),
  };
}
