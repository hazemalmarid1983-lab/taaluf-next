import {
  ACTIVE_STUDENT_STORAGE_KEY,
  attachActiveTrainingStudentRefresh,
  parentHasRegisteredChildForTraining,
  readActiveTrainingStudentForUi,
  resolveParentTrainingChildHref,
  resolveTrainingChildPromptRole,
  SPECIALIST_TRAINING_CHILD_LINKS,
  trainingDashboardHeading,
} from '../lib/training/trainingActiveChildUx';
import { readActiveStudentProfile } from '../lib/training/trainingResultsPresentation';

const ACTIVE_KEY = ACTIVE_STUDENT_STORAGE_KEY;

function installBrowserMocks() {
  const localStore: Record<string, string> = {};

  // @ts-expect-error test env mock
  global.window = global;

  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem: (key: string) => localStore[key] ?? null,
      setItem: (key: string, value: string) => {
        localStore[key] = value;
      },
      removeItem: (key: string) => {
        delete localStore[key];
      },
      clear: () => {
        Object.keys(localStore).forEach((key) => delete localStore[key]);
      },
    },
    writable: true,
  });

  const windowListeners: Record<string, () => void> = {};
  const documentListeners: Record<string, () => void> = {};

  Object.defineProperty(global, 'document', {
    value: {
      visibilityState: 'visible',
      addEventListener: (type: string, handler: () => void) => {
        documentListeners[type] = handler;
      },
      removeEventListener: (type: string) => {
        delete documentListeners[type];
      },
      dispatchEvent: (event: Event) => {
        documentListeners[event.type]?.();
        return true;
      },
    },
    writable: true,
  });

  global.window.addEventListener = (type: string, handler: () => void) => {
    windowListeners[type] = handler;
  };
  global.window.removeEventListener = (type: string) => {
    delete windowListeners[type];
  };
  global.window.dispatchEvent = (event: Event) => {
    windowListeners[event.type]?.();
    return true;
  };

  return { localStore };
}

function setActiveStudent(id: string, name: string) {
  localStorage.setItem(ACTIVE_KEY, JSON.stringify({ id, name }));
}

describe('training active child UX', () => {
  beforeEach(() => {
    installBrowserMocks();
    localStorage.clear();
  });

  describe('specialist CTA targets', () => {
    it('links to caseload, new student, and plan builder', () => {
      expect(SPECIALIST_TRAINING_CHILD_LINKS.chooseCaseload).toBe('/dashboard');
      expect(SPECIALIST_TRAINING_CHILD_LINKS.newStudent).toBe(
        '/dashboard/students/new'
      );
      expect(SPECIALIST_TRAINING_CHILD_LINKS.buildPlan).toBe(
        '/dashboard/training/plans/new'
      );
    });

    it('treats non-parent session role as specialist prompt', () => {
      expect(resolveTrainingChildPromptRole('specialist')).toBe('specialist');
      expect(resolveTrainingChildPromptRole('admin')).toBe('specialist');
      expect(resolveTrainingChildPromptRole('parent')).toBe('parent');
    });
  });

  describe('parent CTA targets', () => {
    it('routes to register when no registered child', () => {
      expect(resolveParentTrainingChildHref(false)).toBe('/parent/register-child');
      expect(parentHasRegisteredChildForTraining()).toBe(false);
    });

    it('routes to parent home when child exists in journey', () => {
      setActiveStudent('child_1', 'أحمد');
      expect(parentHasRegisteredChildForTraining()).toBe(true);
      expect(resolveParentTrainingChildHref(true)).toBe('/parent');
    });
  });

  describe('active student reads taaluf.activeStudent only', () => {
    it('returns null when no active child', () => {
      expect(readActiveTrainingStudentForUi()).toBeNull();
      expect(readActiveStudentProfile()).toBeNull();
    });

    it('returns profile when active child is set', () => {
      setActiveStudent('child_99', 'سارة');
      expect(readActiveTrainingStudentForUi()).toEqual({
        id: 'child_99',
        name: 'سارة',
      });
    });

    it('does not use child_local in training UI reader', () => {
      setActiveStudent('child_local', 'محلي');
      expect(readActiveTrainingStudentForUi()?.id).toBe('child_local');
      localStorage.removeItem(ACTIVE_KEY);
      expect(readActiveTrainingStudentForUi()).toBeNull();
    });
  });

  describe('refresh on focus / visibility', () => {
    it('re-reads activeStudent after storage change when refresh fires', () => {
      const seen: (ReturnType<typeof readActiveTrainingStudentForUi>)[] = [];
      const refresh = () => {
        seen.push(readActiveTrainingStudentForUi());
      };

      const detach = attachActiveTrainingStudentRefresh(refresh);
      refresh();
      expect(seen[0]).toBeNull();

      setActiveStudent('child_new', 'ليان');
      window.dispatchEvent(new Event('focus'));
      expect(seen[seen.length - 1]).toEqual({ id: 'child_new', name: 'ليان' });

      setActiveStudent('child_other', 'عمر');
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
      expect(seen[seen.length - 1]).toEqual({ id: 'child_other', name: 'عمر' });

      detach();
    });
  });

  describe('guard / entry semantics', () => {
    it('active child means no missing-child prompt condition', () => {
      setActiveStudent('c1', 'Test');
      expect(readActiveTrainingStudentForUi()?.id).toBeTruthy();
    });

    it('shows child name in training heading when active', () => {
      setActiveStudent('c1', 'ياسمين');
      expect(trainingDashboardHeading(readActiveTrainingStudentForUi())).toBe(
        'التدريب — ياسمين'
      );
      expect(trainingDashboardHeading(null)).toBeNull();
    });

    it('PlanActivity missing_child is distinct from invalid_launch loop', () => {
      expect(readActiveTrainingStudentForUi()).toBeNull();
    });
  });
});
