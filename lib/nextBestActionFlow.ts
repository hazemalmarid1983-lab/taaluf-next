/**
 * محرك الإجراء التالي الأفضل (NBA) الموحّد — جميع الأدوار.
 * يكتشف مرحلة المستخدم ويوجّهه بخطوة واحدة واضحة.
 */

import {
  buildAdaptiveFlowContext,
  getNextRecommendedAction,
  type NextRecommendedAction,
} from '@/lib/adaptiveClinicalFlow';
import { loadStoredAssessments } from '@/lib/assessmentHelpers';
import { homePathForRole } from '@/lib/access';
import {
  HUB_ONBOARDING_POST_ID,
  mouOverallStatus,
  type HubActor,
  type HubPost,
  type MouOverallStatus,
  type MouState,
} from '@/lib/clinicalHub';
import {
  type AdvisorGuideState,
} from '@/lib/advisorPlatformGuide';
import { loadGoalsLocal } from '@/lib/goalsStore';
import { safePostLoginPath } from '@/lib/loginPortal';
import { loadSensoryHubSessions } from '@/lib/sensoryHubSession';
import {
  readActiveChild,
  readParentJourneyState,
  type ParentNextCopyId,
  type ParentNextStep,
} from '@/lib/parentJourney';

export type FlowStage = 'onboarding' | 'operational' | 'complete';

export type UnifiedNextAction = {
  id: string;
  stage: FlowStage;
  priority: 'critical' | 'high' | 'medium' | 'low';
  emoji: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  reasonAr?: string;
  reasonEn?: string;
  href: string;
  ctaAr: string;
  ctaEn: string;
  progressPct?: number;
  stepLabelAr?: string;
  stepLabelEn?: string;
  /** عند true يُوجَّه المستخدم مباشرة بعد الدخول */
  autoRedirect?: boolean;
  secondaryHref?: string;
  secondaryCtaAr?: string;
  secondaryCtaEn?: string;
};

const PARENT_AUTO_REDIRECT: ParentNextCopyId[] = [
  'consent',
  'registerChild',
  'startScreening',
];

const PRIORITY_MAP = {
  high: 'critical',
  medium: 'high',
  low: 'medium',
} as const;

export const SPECIALIST_FIRST_ASSESSMENT_HREF = '/dashboard/assessments/new';

/** True when the specialist has not completed any stored assessment yet. */
export function specialistNeedsFirstAssessment(
  assessments: { studentId?: string }[] = []
): boolean {
  return assessments.length === 0;
}

function specialistFirstAssessmentAction(): UnifiedNextAction {
  return {
    id: 'specialist_assessment',
    stage: 'onboarding',
    priority: 'critical',
    emoji: '📋',
    titleAr: 'أكملي التقييم الأول',
    titleEn: 'Complete the first assessment',
    bodyAr: 'التقييم يبني الخطة الفردية ويحدّد الأولويات.',
    bodyEn: 'Assessment builds the IEP and sets priorities.',
    reasonAr: 'لا يوجد تقييم مسجّل بعد.',
    reasonEn: 'No assessment recorded yet.',
    href: SPECIALIST_FIRST_ASSESSMENT_HREF,
    ctaAr: 'ابدأ التقييم الأول',
    ctaEn: 'Start first assessment',
    stepLabelAr: 'مسار الأخصائي',
    stepLabelEn: 'Specialist workflow',
    autoRedirect: true,
  };
}

/** Post-login destination for specialists (testable without window). */
export function resolveSpecialistLoginDestination(
  callbackUrl: string | null | undefined,
  hasAnyAssessment: boolean
): string {
  const fallback = homePathForRole('specialist');
  const safeCallback = safePostLoginPath(callbackUrl, fallback);

  if (
    callbackUrl &&
    safeCallback !== fallback &&
    !isGenericHome(safeCallback)
  ) {
    return safeCallback;
  }

  if (!hasAnyAssessment) {
    return SPECIALIST_FIRST_ASSESSMENT_HREF;
  }

  return fallback;
}

function parentStage(kind: ParentNextStep['kind']): FlowStage {
  if (kind === 'onboarding') return 'onboarding';
  if (kind === 'done') return 'complete';
  return 'operational';
}

function parentCopyOverrides(copyId: ParentNextCopyId): Partial<UnifiedNextAction> {
  if (copyId === 'pathComplete' || copyId === 'familyReport') {
    return {
      id: 'parent_today_session',
      stage: 'complete',
      emoji: '🏡',
      titleAr: 'ابدأ جلسة اليوم',
      titleEn: "Start today's session",
      bodyAr: '5–10 دقائق في الغرفة المنزلية — نشاط واحد مع تعزيز فوري.',
      bodyEn: '5–10 minutes in the home classroom — one activity with immediate reinforcement.',
      href: '/dashboard/home-classroom',
      ctaAr: 'ابدأ جلسة اليوم',
      ctaEn: "Start today's session",
      secondaryHref: '/parent/assessment?view=results',
      secondaryCtaAr: 'عرض التقرير',
      secondaryCtaEn: 'View report',
    };
  }
  return {};
}

export function resolveParentNextAction(
  studentNameFromEntitlements?: string
): UnifiedNextAction {
  const journey = readParentJourneyState(studentNameFromEntitlements);
  const { next } = journey;
  const overrides = parentCopyOverrides(next.copyId);

  return {
    id: overrides.id || `parent_${next.copyId}`,
    stage: overrides.stage || parentStage(next.kind),
    priority:
      next.kind === 'onboarding'
        ? 'critical'
        : next.kind === 'done'
          ? 'medium'
          : 'high',
    emoji:
      next.copyId === 'consent'
        ? '📝'
        : next.copyId === 'registerChild'
          ? '👶'
          : next.copyId === 'startScreening'
            ? '🔍'
            : next.kind === 'done'
              ? '🏡'
              : '➡️',
    titleAr: overrides.titleAr || next.title,
    titleEn: overrides.titleEn || next.title,
    bodyAr: overrides.bodyAr || next.body,
    bodyEn: overrides.bodyEn || next.body,
    href: overrides.href || next.href,
    ctaAr: overrides.ctaAr || next.cta,
    ctaEn: overrides.ctaEn || next.cta,
    progressPct: journey.progressPct,
    stepLabelAr: 'مسار ولي الأمر',
    stepLabelEn: 'Parent journey',
    autoRedirect: PARENT_AUTO_REDIRECT.includes(next.copyId),
    secondaryHref: overrides.secondaryHref,
    secondaryCtaAr: overrides.secondaryCtaAr,
    secondaryCtaEn: overrides.secondaryCtaEn,
  };
}

function fromSpecialistAction(action: NextRecommendedAction): UnifiedNextAction {
  return {
    id: `specialist_${action.id}`,
    stage: action.id === 'assessment' ? 'onboarding' : 'operational',
    priority: PRIORITY_MAP[action.priority],
    emoji: action.emoji,
    titleAr: action.titleAr,
    titleEn: action.titleEn,
    bodyAr: action.descriptionAr,
    bodyEn: action.descriptionEn,
    reasonAr: action.reasonAr,
    reasonEn: action.reasonEn,
    href: action.href,
    ctaAr:
      action.id === 'home_train'
        ? 'ابدأ جلسة اليوم'
        : action.id === 'assessment'
          ? 'ابدأ التقييم الأول'
          : 'ابدئي الآن',
    ctaEn:
      action.id === 'home_train'
        ? "Start today's session"
        : action.id === 'assessment'
          ? 'Start first assessment'
          : 'Start now',
    stepLabelAr: 'مسار الأخصائي',
    stepLabelEn: 'Specialist workflow',
    autoRedirect: action.id === 'assessment',
  };
}

export function resolveSpecialistNextAction(
  childId?: string,
  childName?: string
): UnifiedNextAction {
  if (
    typeof window !== 'undefined' &&
    specialistNeedsFirstAssessment(loadStoredAssessments())
  ) {
    return specialistFirstAssessmentAction();
  }

  const active = readActiveChild();
  const id = childId || active?.id || 'child_local';
  const name = childName || active?.name;
  const goals = loadGoalsLocal(id);
  const sensory = loadSensoryHubSessions(id);
  const ctx = buildAdaptiveFlowContext(id, name, goals, sensory);
  return fromSpecialistAction(getNextRecommendedAction(ctx));
}

function advisorCompletedOnboardingBriefing(posts: HubPost[]) {
  const onboarding = posts.find((p) => p.id === HUB_ONBOARDING_POST_ID);
  return onboarding?.replies.some((r) => r.authorMemberId === 'samer') ?? false;
}

export function resolveHubNextAction(input: {
  actor: HubActor;
  mou: MouState;
  posts: HubPost[];
  advisorGuide?: AdvisorGuideState;
}): UnifiedNextAction {
  const status = mouOverallStatus(input.mou);
  const pending = input.posts.filter((p) => p.status === 'pending').length;
  const ownSigned =
    input.actor.memberId === 'hazem'
      ? input.mou.hazem.signed
      : input.mou.samer.signed;
  const onboardingDone = advisorCompletedOnboardingBriefing(input.posts);

  if (
    input.actor.role === 'scientific_advisor' &&
    !onboardingDone
  ) {
    return {
      id: 'hub_onboarding_meeting',
      stage: 'onboarding',
      priority: 'critical',
      emoji: '📋',
      titleAr: 'الاجتماع الأول — تعرّف على منصة تآلف',
      titleEn: 'First meeting — learn the Taaluf platform',
      bodyAr:
        'اقرأ محتوى المنصة كاملاً في غرفة الاجتماعات، استخدم مرشد تآلف (بتوجيه الإدارة)، ثم شارك ملاحظاتك في الدردشة.',
      bodyEn:
        'Read the full platform overview in the meeting room, use Merhid (admin-directed), then share your notes in the chat.',
      href: '/hub?focus=meeting',
      ctaAr: 'افتح الاجتماع الأول',
      ctaEn: 'Open first meeting',
      stepLabelAr: 'غرفة الاجتماعات',
      stepLabelEn: 'Meeting room',
      autoRedirect: true,
    };
  }

  if (status !== 'executed') {
    return {
      id: 'hub_mou_sign',
      stage: 'onboarding',
      priority: 'critical',
      emoji: '📜',
      titleAr: 'راجع المذكرة واعتمد الشراكة',
      titleEn: 'Review the MOU & partnership',
      bodyAr:
        status === 'pending'
          ? 'مذكرة التفاهم الاستشارية لسنتين — أكّد توقيعك لبدء التعاون.'
          : 'بانتظار تأكيد الطرف الآخر — راجع المذكرة وأكّد موقفك.',
      bodyEn:
        status === 'pending'
          ? 'Two-year advisory MOU — confirm your sign-off to begin collaboration.'
          : 'Awaiting the other party — review the memorandum and confirm your position.',
      href: '/hub?focus=agreement',
      ctaAr: ownSigned ? 'عرض حالة المذكرة' : 'راجع المذكرة واعتمد',
      ctaEn: ownSigned ? 'View MOU status' : 'Review & sign MOU',
      stepLabelAr: 'الشراكة والاتفاق',
      stepLabelEn: 'Partnership & agreement',
      autoRedirect: true,
    };
  }

  if (input.actor.role === 'admin' && pending > 0) {
    return {
      id: 'hub_review_pending',
      stage: 'operational',
      priority: 'high',
      emoji: '✅',
      titleAr: `راجع ${pending} مقترحاً قيد المراجعة`,
      titleEn: `Review ${pending} pending proposal${pending === 1 ? '' : 's'}`,
      bodyAr: 'اقتراحات د. سامر في غرفة الاجتماعات — اعتمد أو ناقش قبل النشر.',
      bodyEn: 'Dr. Samer’s proposals in the meeting room — approve or discuss before rollout.',
      href: '/hub?focus=meeting',
      ctaAr: 'افتح غرفة الاجتماعات',
      ctaEn: 'Open meeting room',
      reasonAr: `${pending} بنداً بانتظار قرارك`,
      reasonEn: `${pending} item(s) awaiting your decision`,
      stepLabelAr: 'غرفة الاجتماعات',
      stepLabelEn: 'Meeting room',
    };
  }

  if (input.actor.role === 'scientific_advisor') {
    return {
      id: 'hub_propose_or_test',
      stage: 'operational',
      priority: 'medium',
      emoji: '🔬',
      titleAr: 'اقترح تقييماً أو اختبر الغرف الحسية',
      titleEn: 'Propose an evaluation or test sensory rooms',
      bodyAr: 'شارك ملاحظة سريرية أو مقترح مقياس في غرفة الاجتماعات، ثم جرّب بيئة الاختبار.',
      bodyEn: 'Share a clinical note or metrics proposal, then try the test environment.',
      href: '/hub?focus=meeting',
      ctaAr: 'افتح غرفة الاجتماعات',
      ctaEn: 'Open meeting room',
      secondaryHref: '/sensory-rooms',
      secondaryCtaAr: 'بيئات الاختبار',
      secondaryCtaEn: 'Test environments',
      stepLabelAr: 'مركز تآلف السريري والبحثي',
      stepLabelEn: 'Clinical & research hub',
    };
  }

  return {
    id: 'hub_open_workspace',
    stage: 'operational',
    priority: 'medium',
    emoji: '🛡️',
    titleAr: 'راجع المركز السريري والبحثي',
    titleEn: 'Review the clinical & research hub',
    bodyAr: 'المذكرة نافذة — تابع غرفة الاجتماعات والمقترحات المعتمدة.',
    bodyEn: 'MOU is in force — continue in the meeting room and approved proposals.',
    href: '/hub?focus=meeting',
    ctaAr: 'افتح غرفة الاجتماعات',
    ctaEn: 'Open meeting room',
    stepLabelAr: 'المركز السريري والبحثي',
    stepLabelEn: 'Clinical & research hub',
  };
}

export function resolveAdminNextAction(input?: {
  mouStatus?: MouOverallStatus;
  pendingHubPosts?: number;
}): UnifiedNextAction {
  const mou = input?.mouStatus;
  const pending = input?.pendingHubPosts ?? 0;

  if (mou && mou !== 'executed') {
    return {
      id: 'admin_hub_mou',
      stage: 'onboarding',
      priority: 'critical',
      emoji: '📜',
      titleAr: 'راجع المذكرة والمركز البحثي',
      titleEn: 'Review MOU & research hub',
      bodyAr: 'اعتمد مذكرة التفاهم الاستشارية مع د. سامر قبل متابعة التعاون.',
      bodyEn: 'Sign the advisory MOU with Dr. Samer before continuing collaboration.',
      href: '/hub?focus=agreement',
      ctaAr: 'راجع المذكرة واعتمد',
      ctaEn: 'Review & sign MOU',
      autoRedirect: true,
      stepLabelAr: 'الإدارة العليا',
      stepLabelEn: 'Administration',
    };
  }

  if (pending > 0) {
    return {
      id: 'admin_hub_pending',
      stage: 'operational',
      priority: 'high',
      emoji: '✅',
      titleAr: `اعتمد ${pending} مقترحاً في المركز البحثي`,
      titleEn: `Approve ${pending} hub proposal${pending === 1 ? '' : 's'}`,
      bodyAr: 'مقترحات د. سامر بانتظار مراجعتك في غرفة الاجتماعات.',
      bodyEn: 'Dr. Samer’s proposals await your review in the meeting room.',
      href: '/hub?focus=meeting',
      ctaAr: 'راجع المقترحات',
      ctaEn: 'Review proposals',
      stepLabelAr: 'المركز السريري والبحثي',
      stepLabelEn: 'Clinical & research hub',
    };
  }

  return {
    id: 'admin_overview',
    stage: 'operational',
    priority: 'medium',
    emoji: '📊',
    titleAr: 'راجع تقدّم المنصة',
    titleEn: 'Review platform progress',
    bodyAr: 'تابع الأهل والأخصائيين والتقييمات من لوحة الإدارة.',
    bodyEn: 'Track parents, specialists, and assessments from the admin panel.',
    href: '/admin',
    ctaAr: 'افتح لوحة الإدارة',
    ctaEn: 'Open admin panel',
    stepLabelAr: 'الإدارة العليا',
    stepLabelEn: 'Administration',
  };
}

export function resolveClientNextActionForRole(
  role: string | undefined,
  options?: { studentName?: string }
): UnifiedNextAction | null {
  if (typeof window === 'undefined') return null;
  switch (role) {
    case 'parent':
      return resolveParentNextAction(options?.studentName);
    case 'specialist':
    case 'teacher':
      return resolveSpecialistNextAction();
    case 'scientific_advisor':
      return null;
    case 'admin':
      return resolveAdminNextAction();
    default:
      return null;
  }
}

function isGenericHome(path: string) {
  return (
    path === '/parent' ||
    path === '/dashboard' ||
    path === '/admin' ||
    path === '/hub' ||
    path === '/login'
  );
}

/** وجهة الدخول بعد تسجيل الدخول — توجيه مباشر للخطوة الحرجة عند الحاجة */
export function resolvePostLoginDestination(
  role: string | undefined,
  callbackUrl: string | null | undefined,
  options?: { studentName?: string }
): string {
  if (role === 'specialist' || role === 'teacher') {
    const hasAnyAssessment =
      typeof window !== 'undefined'
        ? !specialistNeedsFirstAssessment(loadStoredAssessments())
        : false;
    return resolveSpecialistLoginDestination(callbackUrl, hasAnyAssessment);
  }

  const fallback = homePathForRole(role);
  const safeCallback = safePostLoginPath(callbackUrl, fallback);

  if (
    callbackUrl &&
    safeCallback !== fallback &&
    !isGenericHome(safeCallback)
  ) {
    return safeCallback;
  }

  const action = resolveClientNextActionForRole(role, options);
  if (action?.autoRedirect) return action.href;

  return fallback;
}

export function hubFocusFromQuery(
  focus: string | null | undefined
): 'overview' | 'meeting' | 'agreement' | null {
  if (
    focus === 'meeting' ||
    focus === 'agreement' ||
    focus === 'overview'
  ) {
    return focus;
  }
  return null;
}

export function defaultHubTab(input: {
  mouStatus: MouOverallStatus;
  pendingCount: number;
  actorRole: HubActor['role'];
  posts?: HubPost[];
}): 'overview' | 'meeting' | 'agreement' {
  if (
    input.actorRole === 'scientific_advisor' &&
    input.posts &&
    !advisorCompletedOnboardingBriefing(input.posts)
  ) {
    return 'meeting';
  }
  if (input.mouStatus !== 'executed') return 'agreement';
  if (input.actorRole === 'admin' && input.pendingCount > 0) return 'meeting';
  if (input.actorRole === 'scientific_advisor') return 'meeting';
  return 'overview';
}
