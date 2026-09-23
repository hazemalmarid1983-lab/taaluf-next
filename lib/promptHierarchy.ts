/**
 * نظام درجات المساعدة السلوكية وتلاشي الدعم (Prompt Hierarchy & Fading).
 * يغذّي رصد المحاولات وتقارير الجلسة في الغرفة الصفية المنزلية.
 */

import type { TrialResult } from './homeClassroomEngine';

/** المستويات الخمسة + عدم الاستجابة */
export type PromptHierarchyLevel =
  | 'independent'
  | 'verbal_partial'
  | 'verbal'
  | 'gestural'
  | 'model'
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
  'verbal_partial',
  'verbal',
  'gestural',
  'model',
  'partial_physical',
  'full_physical',
  'no_response',
];

export const PROMPT_HIERARCHY_LEVELS: PromptHierarchyOption[] = [
  {
    level: 'independent',
    emoji: '●',
    labelAr: 'استقلال تام',
    labelEn: 'Full independence',
    hintAr: 'أنجز دون أي مساعدة',
    hintEn: 'Completed with no prompt',
    tone: 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-emerald-300',
    quick: true,
  },
  {
    level: 'verbal_partial',
    emoji: '●',
    labelAr: 'مساعدة لفظية جزئية (كلمة واحدة)',
    labelEn: 'Partial verbal (one word)',
    hintAr: 'كلمة واحدة فقط',
    hintEn: 'A single word cue',
    tone: 'border-orange-500 bg-orange-50 text-orange-950 ring-orange-300',
    quick: true,
  },
  {
    level: 'verbal',
    emoji: '●',
    labelAr: 'مساعدة لفظية كلية (الجملة كاملة)',
    labelEn: 'Full verbal (whole sentence)',
    hintAr: 'نطق الجملة كاملة',
    hintEn: 'The full spoken sentence',
    tone: 'border-orange-600 bg-orange-100 text-orange-950 ring-orange-400',
    quick: true,
  },
  {
    level: 'gestural',
    emoji: '●',
    labelAr: 'مساعدة بالإيماءة',
    labelEn: 'Gestural prompt',
    hintAr: 'إشارة أو نظرة دون كلام',
    hintEn: 'A point or look without words',
    tone: 'border-blue-600 bg-blue-50 text-blue-950 ring-blue-300',
    quick: true,
  },
  {
    level: 'model',
    emoji: '●',
    labelAr: 'مساعدة نمذجة',
    labelEn: 'Model prompt',
    hintAr: 'تنفيذ النموذج أمام الطفل',
    hintEn: 'Demonstrate the action first',
    tone: 'border-teal-600 bg-teal-50 text-teal-950 ring-teal-300',
    quick: true,
  },
  {
    level: 'partial_physical',
    emoji: '●',
    labelAr: 'مساعدة جسدية جزئية (توجيه كوع)',
    labelEn: 'Partial physical (elbow guide)',
    hintAr: 'توجيه الكوع أو الساعد',
    hintEn: 'Guide the elbow or forearm',
    tone: 'border-amber-600 bg-amber-50 text-amber-950 ring-amber-300',
    quick: true,
  },
  {
    level: 'full_physical',
    emoji: '●',
    labelAr: 'مساعدة جسدية كاملة (يد فوق يد)',
    labelEn: 'Full physical (hand over hand)',
    hintAr: 'يد فوق يد حتى الإنجاز',
    hintEn: 'Hand-over-hand until done',
    tone: 'border-red-600 bg-red-50 text-red-950 ring-red-300',
    quick: true,
  },
  {
    level: 'no_response',
    emoji: '●',
    labelAr: 'عدم استجابة',
    labelEn: 'No response',
    hintAr: 'لم يبدأ الاستجابة',
    hintEn: 'Did not begin a response',
    tone: 'border-red-900 bg-red-100 text-red-950 ring-red-800',
    quick: true,
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
    case 'verbal_partial':
    case 'gestural':
    case 'verbal':
    case 'model':
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
    level === 'verbal_partial' ||
    level === 'verbal' ||
    level === 'gestural' ||
    level === 'model' ||
    level === 'partial_physical' ||
    level === 'full_physical'
  );
}

export function emptyPromptBreakdown(): PromptBreakdown {
  return {
    independent: 0,
    verbal_partial: 0,
    gestural: 0,
    verbal: 0,
    model: 0,
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
  if (breakdown.verbal_partial > 0) {
    parts.push(
      isAr
        ? `${breakdown.verbal_partial} بلفظ جزئي`
        : `${breakdown.verbal_partial} partial verbal`
    );
  }
  if (breakdown.verbal > 0) {
    parts.push(
      isAr
        ? `${breakdown.verbal} بلفظ كلي`
        : `${breakdown.verbal} full verbal`
    );
  }
  if (breakdown.model > 0) {
    parts.push(
      isAr
        ? `${breakdown.model} بنمذجة`
        : `${breakdown.model} model`
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
    breakdown.verbal_partial +
    breakdown.gestural +
    breakdown.verbal +
    breakdown.model +
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
      return 'bg-emerald-500';
    case 'verbal_partial':
    case 'verbal':
      return 'bg-orange-500';
    case 'gestural':
      return 'bg-blue-600';
    case 'model':
      return 'bg-teal-600';
    case 'partial_physical':
      return 'bg-amber-500';
    case 'full_physical':
      return 'bg-red-600';
    default:
      return 'bg-red-900';
  }
}
