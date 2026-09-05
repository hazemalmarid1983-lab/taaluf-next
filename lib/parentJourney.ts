/**
 * رحلة ولي الأمر التكيفية.
 * مسار أسري مستقل (بدون أخصائي) أو مسار مدمج مع أخصائي — دون كسر محرك الحساب.
 */

import { ASSESSMENT_DRAFT_KEY, type AssessmentDraft } from '@/lib/assessmentGate';
import { loadStoredAssessments } from '@/lib/assessmentHelpers';
import { CONSENT_STORAGE_KEY } from '@/lib/consentConstants';

export const PARENT_ROUTES = {
  home: '/parent',
  consent: '/consent',
  register: '/parent/register-child',
  pathways: '/dashboard/pathways',
  screening: '/dashboard/screening',
  learningScreening: '/dashboard/screening-learning',
  academicAssessment: '/dashboard/academic-assessment',
  academicCard: '/dashboard/academic-card',
  results: '/dashboard/results',
  pay: '/parent/pay-assessment',
  followUp: '/parent/follow-up',
  questionnaire: '/dashboard/parent-assessment',
  games: '/dashboard/games',
  homeClassroom: '/dashboard/home-classroom',
  toolsBank: '/dashboard/tools-bank',
  assessment: '/parent/assessment',
  report: '/parent/assessment?view=results',
  booking: '/parent/booking',
  messages: '/dashboard/messages',
  goals: '/dashboard/goals',
  community: '/parent/community',
} as const;

export const FULL_PATH_STORAGE_KEY = 'taaluf.fullPath.unlocked';
export const STAFF_FOLLOWUP_KEY = 'taaluf.staffFollowup.unlocked';
export const LAST_PURCHASE_KEY = 'taaluf.lastPurchase';
export const JOURNEY_MODE_KEY = 'taaluf.journeyMode.v1';
export const ACTIVE_CHILD_KEY = 'taaluf.activeStudent';
export const ACTIVE_CHILD_KEY_ALIAS = 'taaluf_current_child';
export const SCREENING_RESULT_KEY = 'taaluf.screening.v1';
export const SCREENING_RESULT_KEY_ALIAS = 'taaluf_screening_results';
export const GAMES_SKIPPED_KEY = 'taaluf.games.skipped';

export type JourneyMode = 'independent_parent' | 'specialist_guided';

export function isFullPathUnlocked() {
  try {
    return localStorage.getItem(FULL_PATH_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function unlockFullPath() {
  localStorage.setItem(FULL_PATH_STORAGE_KEY, 'true');
}

export function isStaffFollowupUnlocked() {
  try {
    return localStorage.getItem(STAFF_FOLLOWUP_KEY) === 'true';
  } catch {
    return false;
  }
}

export function unlockStaffFollowup() {
  localStorage.setItem(STAFF_FOLLOWUP_KEY, 'true');
}

export function rememberLastPurchase(product: string) {
  localStorage.setItem(LAST_PURCHASE_KEY, product);
}

export function readLastPurchase(): string | null {
  try {
    return localStorage.getItem(LAST_PURCHASE_KEY);
  } catch {
    return null;
  }
}

export function readJourneyMode(): JourneyMode | null {
  try {
    const v = localStorage.getItem(JOURNEY_MODE_KEY);
    return v === 'independent_parent' || v === 'specialist_guided' ? v : null;
  } catch {
    return null;
  }
}

export function setJourneyMode(mode: JourneyMode) {
  localStorage.setItem(JOURNEY_MODE_KEY, mode);
}

export function skipOptionalGames() {
  localStorage.setItem(GAMES_SKIPPED_KEY, 'true');
}

export function didSkipOptionalGames() {
  try {
    return localStorage.getItem(GAMES_SKIPPED_KEY) === 'true';
  } catch {
    return false;
  }
}

export const PARENT_PATH_STEPS = [
  {
    id: 'child',
    label: 'تسجيل الطفل',
    labelKey: 'stepChild' as const,
    href: PARENT_ROUTES.register,
  },
  {
    id: 'screening',
    label: 'الفرز المجاني',
    labelKey: 'stepScreening' as const,
    href: PARENT_ROUTES.pathways,
  },
  {
    id: 'results',
    label: 'النتيجة',
    labelKey: 'stepResults' as const,
    href: PARENT_ROUTES.pathways,
  },
  {
    id: 'choose',
    label: 'اختر المسار',
    labelKey: 'stepChoose' as const,
    href: PARENT_ROUTES.pay,
  },
] as const;

export type ParentPathStepId = (typeof PARENT_PATH_STEPS)[number]['id'];

export type ParentChild = {
  id: string;
  name: string;
  age?: number;
  dob?: string;
};

export function readActiveChild(): ParentChild | null {
  const primary = readJson<ParentChild | null>(ACTIVE_CHILD_KEY, null);
  const alias = readJson<ParentChild | null>(ACTIVE_CHILD_KEY_ALIAS, null);
  const raw = primary?.id ? primary : alias;
  if (!raw?.id || raw.id === 'local') return null;
  return {
    id: raw.id,
    name: raw.name || 'طفل مسجل',
    age: raw.age,
    dob: raw.dob,
  };
}

export function saveActiveChild(child: ParentChild) {
  const payload = JSON.stringify(child);
  localStorage.setItem(ACTIVE_CHILD_KEY, payload);
  localStorage.setItem(ACTIVE_CHILD_KEY_ALIAS, payload);
}

/** يفرّغ الملف النشط في المتصفح لبدء تسجيل طفل آخر دون حذف موافقة المنصة */
export function clearActiveChildSession() {
  localStorage.removeItem(ACTIVE_CHILD_KEY);
  localStorage.removeItem(ACTIVE_CHILD_KEY_ALIAS);
  localStorage.removeItem(SCREENING_RESULT_KEY);
  localStorage.removeItem(SCREENING_RESULT_KEY_ALIAS);
  localStorage.removeItem(JOURNEY_MODE_KEY);
  localStorage.removeItem(GAMES_SKIPPED_KEY);
}

export type ParentNextCopyId =
  | 'consent'
  | 'registerChild'
  | 'startScreening'
  | 'staffFollowup'
  | 'choosePath'
  | 'parentSurvey'
  | 'optionalGames'
  | 'familyReport'
  | 'requiredGames'
  | 'specialistAssessment'
  | 'pathComplete';

export type ParentNextStep = {
  title: string;
  body: string;
  href: string;
  cta: string;
  kind: 'onboarding' | 'path' | 'done';
  copyId: ParentNextCopyId;
};

export type ParentJourneyFlags = {
  consented: boolean;
  hasChild: boolean;
  hasScreening: boolean;
  hasFullAccess: boolean;
  hasStaffFollowup: boolean;
  hasParentQ: boolean;
  hasGames: boolean;
  hasReport: boolean;
  selectedMode?: JourneyMode | null;
  gamesSkipped?: boolean;
};

export type ParentJourneyStep = {
  id: string;
  title: string;
  description: string;
  path: string;
  isRequired: boolean;
  isCompleted: boolean;
};

export type ParentJourneyState = ParentJourneyFlags & {
  child: ParentChild | null;
  doneMap: Record<ParentPathStepId, boolean>;
  completedCount: number;
  progressPct: number;
  next: ParentNextStep;
  selectedMode: JourneyMode | null;
  adaptiveSteps: ParentJourneyStep[];
  reportMeta: ReturnType<typeof getReportMetadataByJourney>;
};

/**
 * خطوات ما بعد اختيار المسار — مسارات حقيقية داخل التطبيق.
 */
export function buildParentJourneySteps(
  mode: JourneyMode,
  flags?: Pick<
    ParentJourneyFlags,
    'consented' | 'hasParentQ' | 'hasGames' | 'hasReport' | 'gamesSkipped'
  >
): ParentJourneyStep[] {
  const f = flags || {
    consented: false,
    hasParentQ: false,
    hasGames: false,
    hasReport: false,
    gamesSkipped: false,
  };
  const gamesDone = Boolean(f.hasGames || f.gamesSkipped);

  if (mode === 'independent_parent') {
    return [
      {
        id: 'consent',
        title: 'الموافقات الثلاث والشروط',
        description: 'قبول الشروط العامة، التقييم التربوي، وسياسة حماية البيانات.',
        path: PARENT_ROUTES.consent,
        isRequired: true,
        isCompleted: Boolean(f.consented),
      },
      {
        id: 'parent_survey',
        title: 'استبيان ملاحظات الأهل (20 بنداً)',
        description: 'رصد السلوكيات والملاحظات اليومية للطفل في البيئة المنزلية.',
        path: PARENT_ROUTES.questionnaire,
        isRequired: true,
        isCompleted: Boolean(f.hasParentQ),
      },
      {
        id: 'interactive_games',
        title: 'مركز الأنشطة',
        description:
          'الغرفة الحسية وسلسلة مطابقة الصور — اختياري إن تعذّر على الطفل.',
        path: PARENT_ROUTES.games,
        isRequired: false,
        isCompleted: gamesDone,
      },
      {
        id: 'actionable_report',
        title: 'التقرير التوجيهي والخطة المنزلية',
        description: 'نتائج التقييم الأسري والرادار والتوصيات المنزلية.',
        path: PARENT_ROUTES.report,
        isRequired: true,
        isCompleted: Boolean(f.hasParentQ && gamesDone),
      },
    ];
  }

  return [
    {
      id: 'consent',
      title: 'الموافقات الرسمية',
      description: 'إقرار الموافقات التربوية وحماية البيانات.',
      path: PARENT_ROUTES.consent,
      isRequired: true,
      isCompleted: Boolean(f.consented),
    },
    {
      id: 'parent_survey',
      title: 'استبيان الأهل المساند',
      description: 'تزويد الأخصائي ببيانات الملاحظة المنزلية.',
      path: PARENT_ROUTES.questionnaire,
      isRequired: true,
      isCompleted: Boolean(f.hasParentQ),
    },
    {
      id: 'interactive_games',
      title: 'مركز الأنشطة',
      description: 'الغرفة الحسية وسلسلة مطابقة الصور والتعريف الصوتي.',
      path: PARENT_ROUTES.games,
      isRequired: true,
      isCompleted: Boolean(f.hasGames),
    },
    {
      id: 'specialist_session',
      title: 'تقييم الأخصائي الميداني (40 معياراً)',
      description: 'إكمال الجلسة التقييمية المباشرة أو عبر بوابة المختص.',
      path: PARENT_ROUTES.assessment,
      isRequired: true,
      isCompleted: Boolean(f.hasReport),
    },
    {
      id: 'full_report',
      title: 'التقرير التقييمي الشامل',
      description: 'التقرير المدمج الثلاثي، أهداف SMART، وPDF رسمي.',
      path: PARENT_ROUTES.report,
      isRequired: true,
      isCompleted: Boolean(f.hasReport),
    },
  ];
}

export function getReportMetadataByJourney(mode: JourneyMode | null) {
  if (mode === 'independent_parent') {
    return {
      reportTitle: 'التقرير التوجيهي الأسري للبيئة المنزلية',
      reportBadge: 'تقييم أسري مستقل',
      fusionMode: 'family' as const,
      disclaimerText:
        'هذا التقرير مبني على ملاحظات الأسرة والألعاب التفاعلية وهو أداة توجيهية منزلية مساعدة لحين إجراء تقييم شامل مع أخصائي مؤهل.',
    };
  }

  return {
    reportTitle: 'تقرير التقييم التربوي المدمج الشامل',
    reportBadge: 'تقييم مدمج متكامل (أخصائي + أهل + ألعاب)',
    fusionMode: 'comprehensive' as const,
    disclaimerText:
      'تقرير مدمج شامل صادر عن دمج تقييم الأخصائي، ملاحظات ولي الأمر، والألعاب التفاعلية وفق معايير Canon 4.0.',
  };
}

export function resolveParentNextStep(
  flags: ParentJourneyFlags
): ParentNextStep {
  if (!flags.consented) {
    return {
      kind: 'onboarding',
      title: 'أكمل الموافقة قبل البدء',
      body: 'نحتاج موافقتك لحماية بيانات طفلك قبل أي تقييم.',
      href: PARENT_ROUTES.consent,
      cta: 'أوافق وأبدأ',
      copyId: 'consent',
    };
  }
  if (!flags.hasChild) {
    return {
      kind: 'onboarding',
      title: 'سجّل بيانات طفلك أولاً',
      body: 'خطوة سريعة لتخصيص المسار حسب عمر الطفل.',
      href: PARENT_ROUTES.register,
      cta: 'تسجيل الطفل',
      copyId: 'registerChild',
    };
  }
  if (!flags.hasScreening) {
    return {
      kind: 'path',
      title: 'ابدأ الفرز الأولي مجاناً',
      body: '12 سؤالاً فقط · حوالي 5 دقائق · بدون دفع.',
      href: PARENT_ROUTES.pathways,
      cta: 'ابدأ الفرز المجاني',
      copyId: 'startScreening',
    };
  }
  if (!flags.hasFullAccess && flags.hasStaffFollowup) {
    return {
      kind: 'path',
      title: 'متابعة أونلاين مع كادر المنصة',
      body: 'تواصل مع المختص عبر الرسائل أو احجز موعداً لإكمال التقييم.',
      href: PARENT_ROUTES.followUp,
      cta: 'لوحة المتابعة',
      copyId: 'staffFollowup',
    };
  }
  if (!flags.hasFullAccess) {
    return {
      kind: 'path',
      title: 'اختر المسار بعد النتيجة',
      body: 'أكمل تقييماً أسرياً مستقلاً، أو تابعاً أونلاين مع كادر المنصة وأخصائي.',
      href: PARENT_ROUTES.pay,
      cta: 'عرض الخيارات',
      copyId: 'choosePath',
    };
  }
  if (!flags.hasParentQ) {
    return {
      kind: 'path',
      title: 'أكمل استبيان الأهل',
      body: 'أسئلة يومية تساعدنا على فهم طفلك بدقة أكبر.',
      href: PARENT_ROUTES.questionnaire,
      cta: 'ابدأ الاستبيان الآن',
      copyId: 'parentSurvey',
    };
  }

  const independent = flags.selectedMode === 'independent_parent';
  const gamesDone = Boolean(flags.hasGames || flags.gamesSkipped);

  if (independent) {
    if (!gamesDone) {
      return {
        kind: 'path',
        title: 'جرّب مركز الأنشطة',
        body: 'اختياري — الغرفة الحسية ومطابقة الصور يدعمان الصورة التربوية، ويمكن تخطيهما إلى التقرير الأسري.',
        href: PARENT_ROUTES.games,
        cta: 'افتح المركز',
        copyId: 'optionalGames',
      };
    }
    return {
      kind: 'done',
      title: 'التقرير التوجيهي الأسري جاهز',
      body: 'بُني من ملاحظاتك والألعاب إن وُجدت — دون الحاجة لأخصائي في هذه المرحلة.',
      href: PARENT_ROUTES.report,
      cta: 'اطلع على التقرير',
      copyId: 'familyReport',
    };
  }

  if (!flags.hasGames) {
    return {
      kind: 'path',
      title: 'جرّب مركز الأنشطة',
      body: 'الغرفة الحسية ومطابقة الصور يدعمان الصورة التربوية لطفلك.',
      href: PARENT_ROUTES.games,
      cta: 'افتح المركز',
      copyId: 'requiredGames',
    };
  }
  if (!flags.hasReport) {
    return {
      kind: 'path',
      title: 'أكمل التقييم التربوي',
      body: '40 معياراً لبناء التقرير المدمج وخطة العمل.',
      href: PARENT_ROUTES.assessment,
      cta: 'ابدأ التقييم',
      copyId: 'specialistAssessment',
    };
  }
  return {
    kind: 'done',
    title: 'التقييم مكتمل',
    body: 'راجع النتائج وخطة العمل المنزلية. لا حاجة لبدء تقييم جديد.',
    href: PARENT_ROUTES.report,
    cta: 'اطلع على التقرير',
    copyId: 'pathComplete',
  };
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function readParentJourneyState(
  studentNameFromEntitlements?: string
): ParentJourneyState {
  const consented = localStorage.getItem(CONSENT_STORAGE_KEY) === 'true';
  const active = readActiveChild();

  let child: ParentChild | null = null;
  if (active?.id) {
    child = {
      id: active.id,
      name: active.name || studentNameFromEntitlements || 'طفلك',
      age: active.age,
      dob: active.dob,
    };
  }

  const childId = child?.id;
  const hasChild = Boolean(childId);

  const screening = readJson<{ childId?: string; result?: unknown } | null>(
    'taaluf.screening.v1',
    null
  );
  const hasScreening = Boolean(
    screening?.result &&
      (!childId ||
        !screening.childId ||
        screening.childId === childId ||
        screening.childId === 'child_local')
  );

  const parentAssess = readJson<Array<{ childId?: string }>>(
    'taaluf.parentAssessment.v1',
    []
  );
  const hasParentQ = Array.isArray(parentAssess)
    ? childId
      ? parentAssess.some((row) => row?.childId === childId)
      : parentAssess.length > 0
    : false;

  const games = readJson<Array<{ childId?: string }>>(
    'taaluf.gameSessions.v1',
    []
  );
  const hasGames = Array.isArray(games)
    ? childId
      ? games.some((row) => row?.childId === childId)
      : games.length > 0
    : false;

  const assessments = loadStoredAssessments();
  const draft = readJson<AssessmentDraft | null>(ASSESSMENT_DRAFT_KEY, null);
  const hasCompletedDraft = Boolean(
    childId &&
      draft?.childId === childId &&
      draft.status === 'completed_pending_report' &&
      draft.scores &&
      Object.keys(draft.scores).length > 0
  );
  const storedReport = childId
    ? assessments.some((a) => a.studentId === childId) || hasCompletedDraft
    : false;

  const selectedMode = readJourneyMode();
  const gamesSkipped = didSkipOptionalGames();
  const hasStaffFollowup = isStaffFollowupUnlocked();
  const hasFullAccess =
    isFullPathUnlocked() || hasParentQ || hasGames || storedReport;

  const hasReport =
    selectedMode === 'independent_parent'
      ? Boolean(hasParentQ && (hasGames || gamesSkipped))
      : storedReport;

  const flags: ParentJourneyFlags = {
    consented,
    hasChild,
    hasScreening,
    hasFullAccess,
    hasStaffFollowup,
    hasParentQ,
    hasGames,
    hasReport,
    selectedMode,
    gamesSkipped,
  };

  const doneMap: Record<ParentPathStepId, boolean> = {
    child: hasChild,
    screening: hasScreening,
    results: hasScreening,
    choose: hasFullAccess || hasStaffFollowup,
  };

  const adaptiveSteps = selectedMode
    ? buildParentJourneySteps(selectedMode, flags)
    : [];
  const onboardingDone = PARENT_PATH_STEPS.filter((s) => doneMap[s.id]).length;
  const adaptiveDone = adaptiveSteps.filter((s) => s.isCompleted).length;
  const adaptiveTotal = adaptiveSteps.length;
  const completedCount = onboardingDone + adaptiveDone;
  const totalSteps = PARENT_PATH_STEPS.length + adaptiveTotal;
  const progressPct = Math.round((completedCount / totalSteps) * 100);

  return {
    ...flags,
    child,
    doneMap,
    completedCount,
    progressPct,
    next: resolveParentNextStep(flags),
    selectedMode,
    adaptiveSteps,
    reportMeta: getReportMetadataByJourney(selectedMode),
  };
}
