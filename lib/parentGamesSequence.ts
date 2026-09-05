/**
 * سلسلة أنشطة ولي الأمر: غرفة حسية ← مطابقة صور ← العودة للمركز.
 */

import { PARENT_ROUTES } from './parentJourney';
import { SENSORY_MATCHING_TOTAL_ROUNDS } from './sensoryMatching';

export type ParentGameStep = {
  id: string;
  href: string;
  titleAr: string;
  titleEn: string;
  /** مدة الجلسة بالثواني (0 = يعتمد على جولات اللعبة الداخلية) */
  durationSec: number;
  maxInteractions?: number;
};

export const PARENT_GAMES_SEQUENCE: ParentGameStep[] = [
  {
    id: 'classic_sensory',
    href: '/sensory-room',
    titleAr: 'الغرفة الحسية',
    titleEn: 'Sensory room',
    durationSec: 90,
    maxInteractions: 40,
  },
  {
    id: 'sensory_matching',
    href: '/sensory-matching',
    titleAr: 'مطابقة الصور',
    titleEn: 'Picture matching',
    durationSec: 0,
    maxInteractions: SENSORY_MATCHING_TOTAL_ROUNDS,
  },
];

export const PARENT_GAMES_SEQUENCE_KEY = 'taaluf.parentGamesSequence.v1';

export type ParentGamesSequenceState = {
  currentIndex: number;
  startedAt: number;
};

export function readParentGamesSequence(): ParentGamesSequenceState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PARENT_GAMES_SEQUENCE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ParentGamesSequenceState;
    if (typeof parsed.currentIndex !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function startParentGamesSequenceAtHref(href: string) {
  if (typeof window === 'undefined') return;
  const idx = PARENT_GAMES_SEQUENCE.findIndex((step) => step.href === href);
  startParentGamesSequence(idx >= 0 ? idx : 0);
}

export function startParentGamesSequence(index = 0) {
  if (typeof window === 'undefined') return;
  const clamped = Math.max(0, Math.min(index, PARENT_GAMES_SEQUENCE.length - 1));
  const payload: ParentGamesSequenceState = {
    currentIndex: clamped,
    startedAt: Date.now(),
  };
  try {
    sessionStorage.setItem(PARENT_GAMES_SEQUENCE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function clearParentGamesSequence() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(PARENT_GAMES_SEQUENCE_KEY);
  } catch {
    /* ignore */
  }
}

export function currentParentGameStep(): ParentGameStep | null {
  const state = readParentGamesSequence();
  if (!state) return null;
  return PARENT_GAMES_SEQUENCE[state.currentIndex] ?? null;
}

/** بعد إنهاء خطوة — يُرجع رابط الخطوة التالية أو null */
export function advanceParentGamesSequence(): string | null {
  if (typeof window === 'undefined') return null;
  const state = readParentGamesSequence();
  if (!state) return null;
  const nextIndex = state.currentIndex + 1;
  if (nextIndex >= PARENT_GAMES_SEQUENCE.length) {
    clearParentGamesSequence();
    return null;
  }
  const payload: ParentGamesSequenceState = {
    currentIndex: nextIndex,
    startedAt: Date.now(),
  };
  try {
    sessionStorage.setItem(PARENT_GAMES_SEQUENCE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
  return PARENT_GAMES_SEQUENCE[nextIndex]?.href ?? null;
}

export function parentGamesReturnHub() {
  return PARENT_ROUTES.games;
}

export function stepForPathname(pathname: string): ParentGameStep | null {
  const normalized = pathname.split('?')[0]?.split('#')[0] || pathname;
  return (
    PARENT_GAMES_SEQUENCE.find(
      (step) =>
        normalized === step.href || normalized.startsWith(`${step.href}/`)
    ) ?? null
  );
}
