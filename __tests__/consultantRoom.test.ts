import { homePathForRole } from '@/lib/access';
import {
  advisorClinicalNavHref,
  canAccessConsultantRoom,
  CONSULTANT_MEETINGS_PATH,
  CONSULTANT_REVIEW_PATH,
  CONSULTANT_ROOM_PATH,
} from '@/lib/consultantRoom/access';
import {
  clearIntroTourState,
  CONSULTANT_INTRO_TOUR_STORAGE_KEY,
  INTRO_TOUR_STEPS,
  markIntroTourCompleted,
  markIntroTourSkipped,
  readIntroTourState,
  shouldShowIntroTour,
} from '@/lib/consultantRoom/introTour';
import { getPlatformStatusItems } from '@/lib/consultantRoom/platformStatus';
import { SCIENTIFIC_REVIEW_POINTS } from '@/lib/consultantRoom/reviewPoints';
import { REVIEW_QUESTION_BANK } from '@/lib/consultantRoom/reviewQuestionBank';
import {
  consultantHomeSectionsIncludeAgreementUi,
  getConsultantSections,
} from '@/lib/consultantRoom/sections';

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  Object.defineProperty(global, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => memory.set(key, String(value)),
      removeItem: (key: string) => memory.delete(key),
    },
  });
});

describe('consultantRoom access', () => {
  it('allows scientific_advisor and admin', () => {
    expect(canAccessConsultantRoom('scientific_advisor')).toBe(true);
    expect(canAccessConsultantRoom('admin')).toBe(true);
  });

  it('denies specialist, teacher, parent, and anonymous', () => {
    expect(canAccessConsultantRoom('specialist')).toBe(false);
    expect(canAccessConsultantRoom('teacher')).toBe(false);
    expect(canAccessConsultantRoom('parent')).toBe(false);
    expect(canAccessConsultantRoom(undefined)).toBe(false);
    expect(canAccessConsultantRoom(null)).toBe(false);
  });

  it('exposes stable route paths', () => {
    expect(CONSULTANT_ROOM_PATH).toBe('/dashboard/consultant');
    expect(CONSULTANT_MEETINGS_PATH).toBe('/dashboard/consultant/meetings');
    expect(CONSULTANT_REVIEW_PATH).toBe('/dashboard/consultant/review');
  });

  it('routes advisor clinical nav to consultant room', () => {
    expect(advisorClinicalNavHref()).toBe('/dashboard/consultant');
  });

  it('uses consultant room as advisor home after login', () => {
    expect(homePathForRole('scientific_advisor')).toBe(CONSULTANT_ROOM_PATH);
  });
});

describe('consultantRoom content', () => {
  it('defines core sections including meeting hall', () => {
    const sections = getConsultantSections();
    const ids = sections.map((s) => s.id);
    expect(ids).toContain('overview');
    expect(ids).toContain('meeting-hall');
    expect(ids).toContain('assessment-system');
  });

  it('provides platform status without empty levels', () => {
    const items = getPlatformStatusItems();
    expect(items.length).toBeGreaterThan(5);
    expect(items.some((i) => i.level === 'needs_review')).toBe(true);
  });

  it('marks C11/C25/C26 training as implemented with scientific review pending', () => {
    const items = getPlatformStatusItems();
    const c11 = items.find((i) => i.id === 'training-c11');
    const c25 = items.find((i) => i.id === 'training-c25');
    const c26 = items.find((i) => i.id === 'training-c26');

    expect(c11?.level).toBe('needs_review');
    expect(c11?.noteAr).toContain('Implemented — Scientific Review Pending');
    expect(c11?.noteAr).toContain('لا يُفسَّر النشاط الرقمي');

    expect(c25?.level).toBe('needs_review');
    expect(c25?.noteAr).toContain('Implemented — Scientific Review Pending');
    expect(c25?.noteAr).toContain('مرشّحة تدريب مقترحة');

    expect(c26?.level).toBe('needs_review');
    expect(c26?.noteAr).toContain(
      'Pedagogical metadata — not structural training coverage'
    );
    expect(c26?.noteAr).toContain('goalLinks');

    const comm = items.find((i) => i.id === 'training-chapter-communication');
    expect(comm?.level).toBe('needs_review');
    expect(comm?.noteAr).toContain('فصل التواصل واللغة');
    expect(comm?.noteAr).toContain('مراجعة علمية');
  });

  it('lists open scientific review questions only', () => {
    expect(SCIENTIFIC_REVIEW_POINTS.length).toBeGreaterThan(0);
    for (const point of SCIENTIFIC_REVIEW_POINTS) {
      expect(/[?؟]$/.test(point.questionAr)).toBe(true);
    }
  });

  it('reflects Canon 4.0 operational scope without legacy Canon 36 copy', () => {
    const serialized = JSON.stringify({
      sections: getConsultantSections(),
      platform: getPlatformStatusItems(),
      reviewPoints: SCIENTIFIC_REVIEW_POINTS,
      intro: INTRO_TOUR_STEPS,
    });

    expect(serialized).not.toMatch(/Canon 36/i);
    expect(serialized).not.toMatch(/٣٦ معيار/);
    expect(serialized).not.toMatch(/8 مجالات|٨ مجالات/);
    expect(serialized).toMatch(/Canon 4\.0/);
    expect(serialized).toMatch(/40|٤٠/);
    expect(serialized).toMatch(/4 محاور|٤ محاور/);
    expect(serialized).toMatch(/C1–C34|C1-C34/);

    const c35Pending = getPlatformStatusItems().find(
      (i) => i.id === 'assessment-c35-c40-pending'
    );
    expect(c35Pending?.level).toBe('needs_review');
    expect(c35Pending?.labelAr).toMatch(/C35–C40/);

    expect(
      SCIENTIFIC_REVIEW_POINTS.some((p) => p.id === 'c35-c40-review-scope')
    ).toBe(true);

    expect(REVIEW_QUESTION_BANK.length).toBe(191);
    for (const id of ['C35', 'C36', 'C37', 'C38', 'C39', 'C40']) {
      expect(
        REVIEW_QUESTION_BANK.some((q) => q.criterionId === id)
      ).toBe(false);
    }
  });

  it('does not surface partnership agreement CTAs on consultant home', () => {
    expect(consultantHomeSectionsIncludeAgreementUi()).toBe(false);
    const sections = getConsultantSections();
    expect(sections.some((section) => section.id === 'advisory-profile')).toBe(
      false
    );
    expect(sections.some((section) => section.id === 'scientific-review-form')).toBe(
      true
    );
  });
});

describe('consultantRoom intro tour', () => {
  it('shows on first visit when storage is empty', () => {
    clearIntroTourState();
    expect(shouldShowIntroTour()).toBe(true);
    expect(readIntroTourState()).toBeNull();
  });

  it('persists skipped state and hides the tour', () => {
    expect(markIntroTourSkipped()).toBe(true);
    expect(readIntroTourState()?.status).toBe('skipped');
    expect(shouldShowIntroTour()).toBe(false);
  });

  it('persists completed state and hides the tour', () => {
    clearIntroTourState();
    expect(markIntroTourCompleted()).toBe(true);
    expect(readIntroTourState()?.status).toBe('completed');
    expect(shouldShowIntroTour()).toBe(false);
  });

  it('does not show after refresh when persisted', () => {
    markIntroTourCompleted();
    expect(memory.get(CONSULTANT_INTRO_TOUR_STORAGE_KEY)).toBeTruthy();
    expect(shouldShowIntroTour()).toBe(false);
  });

  it('does not throw when localStorage is unavailable', () => {
    Object.defineProperty(global, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error('blocked');
        },
        setItem: () => {
          throw new Error('blocked');
        },
        removeItem: () => {
          throw new Error('blocked');
        },
      },
    });

    expect(() => shouldShowIntroTour()).not.toThrow();
    expect(shouldShowIntroTour()).toBe(true);
    expect(markIntroTourSkipped()).toBe(false);
    expect(markIntroTourCompleted()).toBe(false);
    expect(readIntroTourState()).toBeNull();
  });

  it('defines five tour steps ending with review path', () => {
    expect(INTRO_TOUR_STEPS).toHaveLength(5);
    expect(INTRO_TOUR_STEPS[4].primaryAction?.href).toBe(CONSULTANT_REVIEW_PATH);
  });
});
