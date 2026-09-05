/**
 * نظام درجات المساعدة السلوكية وتلاشي الدعم (Prompt Hierarchy & Fading).
 * يغذّي رصد المحاولات وتقارير الجلسة في الغرفة الصفية المنزلية.
 */

import type { TrialResult } from './homeClassroomEngine';

/** المستويات الخمسة + عدم الاستجابة */
export type PromptHierarchyLevel =
  | 'independent'
  | 'gestural'
  | 'verbal'
  | 'partial_physical'
  | 'full_physical'
  | 'no_response';

/** للتوافق مع الجلسات القديمة */
export type LegacyPromptLevel =
  | 'verbal_gestural'
  | 'physical_prompt';

export type PromptLevel = PromptHierarchyLevel;

export type PromptBreakdown = Record<PromptHierarchyLevel, number>;

export type PromptHierarchyOption = {
  level: PromptHierarchyLevel;
  emoji: string;
  labelAr: string;
  labelEn: string;
  hintAr: string;
  hintEn: string;
  tone: string;
  /** للعرض السريع بعد النشاط — أزرار مبسطة */
  quick?: boolean;
};

/** ترتيب الشدة: الأقل = أعلى استقلالية */
export const PROMPT_HIERARCHY_ORDER: PromptHierarchyLevel[] = [
  'independent',
  'gestural',
  'verbal',
  'partial_physical',
  'full_physical',
  'no_response',
];

export const PROMPT_HIERARCHY_LEVELS: PromptHierarchyOption[] = [
  {
    level: 'independent',
    emoji: '🟢',
    labelAr: 'مستقل',
    labelEn: 'Independent',
    hintAr: 'بدون أي مساعدة',
    hintEn: 'No prompt needed',
    tone: 'border-emerald-500/70 bg-emerald-50 text-emerald-900 ring-emerald-300',
    quick: true,
  },
  {
    level: 'gestural',
    emoji: '🟡',
    labelAr: 'إيمائي',
    labelEn: 'Gestural',
    hintAr: 'إشارة أو نظرة توجيهية',
    hintEn: 'Point or visual cue',
    tone: 'border-amber-400/70 bg-amber-50 text-amber-900 ring-amber-300',
    quick: true,
  },
  {
    level: 'verbal',
    emoji: '🟠',
    labelAr: 'لفظي',
    labelEn: 'Verbal',
    hintAr: 'تكرار الأمر أو تلميح لفظي',
    hintEn: 'Repeat cue or verbal hint',
    tone: 'border-orange-400/70 bg-orange-50 text-orange-900 ring-orange-300',
    quick: true,
  },
  {
    level: 'partial_physical',
    emoji: '🔵',
    labelAr: 'جسدي جزئي',
    labelEn: 'Partial physical',
    hintAr: 'لمس خفيف أو توجيه جزئي لليد',
    hintEn: 'Light touch or partial hand guide',
    tone: 'border-sky-500/70 bg-sky-50 text-sky-900 ring-sky-300',
    quick: true,
  },
  {
    level: 'full_physical',
    emoji: '✋',
    labelAr: 'جسدي كامل',
    labelEn: 'Full physical',
    hintAr: 'يد فوق يد حتى الإنجاز',
    hintEn: 'Hand-over-hand until done',
    tone: 'border-indigo-500/70 bg-indigo-50 text-indigo-900 ring-indigo-300',
    quick: false,
  },
  {
    level: 'no_response',
    emoji: '⭕',
    labelAr: 'لم يستجب',
    labelEn: 'No response',
    hintAr: 'تشتت أو رفض',
    hintEn: 'Distracted or refused',
    tone: 'border-rose-400/70 bg-rose-50 text-rose-900 ring-rose-300',
    quick: false,
  },
];

/** أزرار الرصد السريع بعد النشاط */
export const PROMPT_QUICK_LEVELS = PROMPT_HIERARCHY_LEVELS.filter(
  (item) => item.quick
);

/** @deprecated استخدم PROMPT_HIERARCHY_LEVELS */
export const PROMPT_LEVELS = PROMPT_HIERARCHY_LEVELS;

export function promptOptionByLevel(level: PromptHierarchyLevel) {
  return PROMPT_HIERARCHY_LEVELS.find((item) => item.level === level);
}

export function normalizePromptLevel(
  level: string
): PromptHierarchyLevel {
  switch (level) {
    case 'independent':
    case 'gestural':
    case 'verbal':
    case 'partial_physical':
    case 'full_physical':
    case 'no_response':
      return level;
    case 'verbal_gestural':
      return 'gestural';
    case 'physical_prompt':
      return 'full_physical';
    default:
      return 'no_response';
  }
}

export function isIndependentLevel(level: PromptHierarchyLevel) {
  return level === 'independent';
}

export function isPromptedLevel(level: PromptHierarchyLevel) {
  return (
    level === 'gestural' ||
    level === 'verbal' ||
    level === 'partial_physical' ||
    level === 'full_physical'
  );
}

export function emptyPromptBreakdown(): PromptBreakdown {
  return {
    independent: 0,
    gestural: 0,
    verbal: 0,
    partial_physical: 0,
    full_physical: 0,
    no_response: 0,
  };
}

export function countPromptBreakdown(
  trials: Pick<TrialResult, 'promptLevel'>[]
): PromptBreakdown {
  const counts = emptyPromptBreakdown();
  trials.forEach((trial) => {
    const level = normalizePromptLevel(trial.promptLevel);
    counts[level] += 1;
  });
  return counts;
}

export function trialPromptSequence(
  trials: Pick<TrialResult, 'promptLevel'>[]
): PromptHierarchyLevel[] {
  return trials.map((trial) => normalizePromptLevel(trial.promptLevel));
}

export function independencePercentage(
  trials: Pick<TrialResult, 'promptLevel'>[]
) {
  if (!trials.length) return 0;
  const independent = trials.filter((trial) =>
    isIndependentLevel(normalizePromptLevel(trial.promptLevel))
  ).length;
  return Math.round((independent / trials.length) * 100);
}

export function promptedCount(trials: Pick<TrialResult, 'promptLevel'>[]) {
  return trials.filter((trial) =>
    isPromptedLevel(normalizePromptLevel(trial.promptLevel))
  ).length;
}

export function noResponseCount(trials: Pick<TrialResult, 'promptLevel'>[]) {
  return trials.filter(
    (trial) => normalizePromptLevel(trial.promptLevel) === 'no_response'
  ).length;
}

export type IndependenceComparison = {
  current: number;
  previous: number | null;
  delta: number | null;
  direction: 'improved' | 'declined' | 'steady' | 'first';
};

export function compareIndependence(
  currentTrials: Pick<TrialResult, 'promptLevel'>[],
  previousTrials?: Pick<TrialResult, 'promptLevel'>[] | null
): IndependenceComparison {
  const current = independencePercentage(currentTrials);
  if (!previousTrials?.length) {
    return { current, previous: null, delta: null, direction: 'first' };
  }
  const previous = independencePercentage(previousTrials);
  const delta = current - previous;
  let direction: IndependenceComparison['direction'] = 'steady';
  if (delta > 0) direction = 'improved';
  if (delta < 0) direction = 'declined';
  return { current, previous, delta, direction };
}

export function summarizePromptLevels(
  breakdown: PromptBreakdown,
  isAr: boolean
) {
  const parts: string[] = [];
  if (breakdown.independent > 0) {
    parts.push(
      isAr
        ? `${breakdown.independent} مستقلة`
        : `${breakdown.independent} independent`
    );
  }
  if (breakdown.gestural > 0) {
    parts.push(
      isAr
        ? `${breakdown.gestural} بمساعدة إيمائية`
        : `${breakdown.gestural} gestural`
    );
  }
  if (breakdown.verbal > 0) {
    parts.push(
      isAr
        ? `${breakdown.verbal} بمساعدة لفظية`
        : `${breakdown.verbal} verbal`
    );
  }
  if (breakdown.partial_physical > 0) {
    parts.push(
      isAr
        ? `${breakdown.partial_physical} بمساعدة جسدية جزئية`
        : `${breakdown.partial_physical} partial physical`
    );
  }
  if (breakdown.full_physical > 0) {
    parts.push(
      isAr
        ? `${breakdown.full_physical} بمساعدة جسدية كاملة`
        : `${breakdown.full_physical} full physical`
    );
  }
  if (breakdown.no_response > 0) {
    parts.push(
      isAr
        ? `${breakdown.no_response} بلا استجابة`
        : `${breakdown.no_response} no response`
    );
  }
  return parts.join(isAr ? '، ' : ', ');
}

/** توصية تلاشي المساعدة للجلسة التالية */
export function buildPromptFadingCue(
  breakdown: PromptBreakdown,
  comparison: IndependenceComparison
) {
  const total =
    breakdown.independent +
    breakdown.gestural +
    breakdown.verbal +
    breakdown.partial_physical +
    breakdown.full_physical +
    breakdown.no_response;

  if (total === 0) {
    return {
      cueAr: 'سجّلي المحاولات الخمس في الجلسة القادمة لبناء خط أساس للتلاشي.',
      cueEn: 'Record all five trials next session to establish a fading baseline.',
    };
  }

  if (breakdown.independent >= 4) {
    return {
      cueAr:
        'الطفل مستقل في أغلب المحاولات — في الجلسة التالية قلّلي المساعدة مبكراً وانتقلي لهدف أصعب أو بيئة جديدة.',
      cueEn:
        'The child was mostly independent — next session fade prompts early and generalise to a harder goal or new setting.',
    };
  }

  if (breakdown.full_physical >= 2 || breakdown.partial_physical >= 3) {
    return {
      cueAr:
        'اعتمدت الجلسة على مساعدة جسدية — في الجلسة التالية ابدئي بمساعدة إيمائية أو لفظية فقط، واحتفظي بالجسدية للمحاولة الأخيرة إن لزم.',
      cueEn:
        'This session relied on physical prompts — next session start with gestural or verbal cues only, and save physical help for the last trial if needed.',
    };
  }

  if (breakdown.gestural >= 2 && breakdown.independent <= 1) {
    return {
      cueAr:
        'الطفل يحتاج إشارات بصرية — في الجلسة التالية قدّمي الإشارة ثم انتظري 3 ثوانٍ قبل أي تلميح لفظي (تلاشي من إيمائي إلى مستقل).',
      cueEn:
        'The child needed gestural cues — next session give the gesture, wait 3 seconds, then add verbal only if needed (fade gesture toward independence).',
    };
  }

  if (breakdown.verbal >= 2) {
    return {
      cueAr:
        'المساعدة اللفظية كانت كافية — في الجلسة التالية قلّلي التكرار اللفظي: قولي الأمر مرة واحدة ثم صمتي 4 ثوانٍ قبل الإشارة.',
      cueEn:
        'Verbal prompts were enough — next session reduce verbal repetition: state the cue once, then wait 4 seconds before gesturing.',
    };
  }

  if (comparison.direction === 'improved' && comparison.delta !== null) {
    return {
      cueAr: `تحسّن الاستقلالية بنسبة ${comparison.delta}% — واصلي بنفس مستوى المساعدة ثم اسحبيه خطوة واحدة في الجلسة التالية.`,
      cueEn: `Independence improved by ${comparison.delta}% — keep the same prompt level, then fade one step next session.`,
    };
  }

  if (comparison.direction === 'declined') {
    return {
      cueAr:
        'تراجعت الاستقلالية — في الجلسة التالية أعيدي مستوى المساعدة الذي نجح في الجلسة السابقة، ثم اسحبيه ببطء.',
      cueEn:
        'Independence declined — next session return to the prompt level that worked before, then fade slowly.',
    };
  }

  return {
    cueAr:
      'واصلي التلاشي التدريجي: قدّمي أقل مساعدة ممكنة في المحاولة الأولى، ثم زيدي خطوة واحدة فقط عند التردد.',
    cueEn:
      'Continue gradual fading: use the least prompt on trial one, then increase by one step only if the child hesitates.',
  };
}

export function barSegmentColor(level: PromptHierarchyLevel) {
  switch (level) {
    case 'independent':
      return 'bg-emerald-400';
    case 'gestural':
      return 'bg-amber-400';
    case 'verbal':
      return 'bg-orange-400';
    case 'partial_physical':
      return 'bg-sky-500';
    case 'full_physical':
      return 'bg-indigo-500';
    default:
      return 'bg-rose-400';
  }
}
