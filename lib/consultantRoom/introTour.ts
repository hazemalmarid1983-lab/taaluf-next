import { CONSULTANT_REVIEW_PATH } from '@/lib/consultantRoom/access';

export const CONSULTANT_INTRO_TOUR_STORAGE_KEY = 'taaluf.consultant.introTour.v1';

export type IntroTourAnchorId =
  | 'intro-hero'
  | 'intro-sections'
  | 'intro-platform-status'
  | 'intro-journey'
  | 'intro-review';

export type IntroTourCompletionStatus = 'skipped' | 'completed';

export type IntroTourStoredState = {
  status: IntroTourCompletionStatus;
  at: string;
};

export type IntroTourStep = {
  id: string;
  anchorId: IntroTourAnchorId;
  titleAr: string;
  bodyAr: string;
  isFinal?: boolean;
  primaryAction?: {
    labelAr: string;
    href: string;
  };
  secondaryAction?: {
    labelAr: string;
  };
};

export const INTRO_TOUR_STEPS: readonly IntroTourStep[] = [
  {
    id: 'hero',
    anchorId: 'intro-hero',
    titleAr: 'مرحبًا بك في غرفة المراجعة العلمية',
    bodyAr:
      'هذه الغرفة مخصصة لفهم منظومة تآلف ومراجعتها علميًا قبل اعتماد أي منهجية.',
  },
  {
    id: 'sections',
    anchorId: 'intro-sections',
    titleAr: 'أقسام المنصة',
    bodyAr:
      'من هنا يمكنك استكشاف التقييم، الأهداف، التدريب، القياس، الذكاء الاصطناعي، الفجوات وخارطة الطريق.',
  },
  {
    id: 'platform-status',
    anchorId: 'intro-platform-status',
    titleAr: 'حالة المنصة',
    bodyAr:
      'هذه الحالة تميز بين ما هو مطبق، وما هو جزئي، وما هو قيد التطوير، وما يحتاج مراجعة علمية.',
  },
  {
    id: 'journey',
    anchorId: 'intro-journey',
    titleAr: 'فهم المنظومة',
    bodyAr:
      'فكرة المنظومة: التقييم → الأهداف → الخطة → التدريب → القياس → التقدم.',
  },
  {
    id: 'review',
    anchorId: 'intro-review',
    titleAr: 'المراجعة العلمية',
    bodyAr:
      'بعد استكشاف المنصة يمكنك الانتقال إلى المراجعة العلمية المنظمة للمعايير C1–C34. التقييم التشغيلي الحالي يعتمد Canon 4.0 (٤٠ مؤشراً)، بينما يغطي نموذج المراجعة العلمية حالياً C1–C34. أما C35–C40 فهي مؤشرات تشغيلية بانتظار إدراجها في نطاق المراجعة وفق القرار العلمي.',
    isFinal: true,
    primaryAction: {
      labelAr: 'ابدأ المراجعة العلمية',
      href: CONSULTANT_REVIEW_PATH,
    },
    secondaryAction: {
      labelAr: 'استكشف المنصة',
    },
  },
] as const;

function getLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    const globalStorage = (globalThis as { localStorage?: Storage }).localStorage;
    if (globalStorage) return globalStorage;
  } catch {
    return null;
  }
  return null;
}

function isBrowserStorageAvailable(): boolean {
  const storage = getLocalStorage();
  if (!storage) return false;
  try {
    const probe = '__taaluf_intro_tour_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function readIntroTourState(): IntroTourStoredState | null {
  const storage = getLocalStorage();
  if (!storage || !isBrowserStorageAvailable()) return null;
  try {
    const raw = storage.getItem(CONSULTANT_INTRO_TOUR_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as IntroTourStoredState;
    if (
      parsed?.status !== 'skipped' &&
      parsed?.status !== 'completed'
    ) {
      return null;
    }
    if (typeof parsed.at !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function shouldShowIntroTour(): boolean {
  return readIntroTourState() === null;
}

function writeIntroTourState(status: IntroTourCompletionStatus): boolean {
  const storage = getLocalStorage();
  if (!storage || !isBrowserStorageAvailable()) return false;
  try {
    const payload: IntroTourStoredState = {
      status,
      at: new Date().toISOString(),
    };
    storage.setItem(CONSULTANT_INTRO_TOUR_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function markIntroTourSkipped(): boolean {
  return writeIntroTourState('skipped');
}

export function markIntroTourCompleted(): boolean {
  return writeIntroTourState('completed');
}

export function clearIntroTourState(): void {
  const storage = getLocalStorage();
  if (!storage || !isBrowserStorageAvailable()) return;
  try {
    storage.removeItem(CONSULTANT_INTRO_TOUR_STORAGE_KEY);
  } catch {
    // ignore — storage unavailable
  }
}
