import {
  hasActiveAssessment,
  saveAssessmentDraft,
} from '../lib/assessmentGate';
import { persistLocalAssessment } from '../lib/assessmentHelpers';

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  Object.defineProperty(global, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => memory.set(k, String(v)),
      removeItem: (k: string) => memory.delete(k),
    },
  });
});

describe('hasActiveAssessment', () => {
  it('treats a saved report as completed, not a new draft', () => {
    persistLocalAssessment({
      studentId: 'child_1',
      studentName: 'أحمد',
      percentage: 42,
      classification: 'متوسط',
      totalScore: 20,
      maxScore: 108,
      domainAverages: {},
      scores: [{ criterionId: 'C1', score: 1 }],
    });
    saveAssessmentDraft({
      childId: 'child_1',
      scores: { C1: 1 },
      updatedAt: new Date().toISOString(),
      status: 'in_progress',
    });

    const gate = hasActiveAssessment('child_1');
    expect(gate.active).toBe(true);
    expect(gate.reason).toBe('completed');
  });

  it('treats a finished draft as completed so results can open', () => {
    saveAssessmentDraft({
      childId: 'child_1',
      scores: { C1: 2, C2: 1 },
      updatedAt: new Date().toISOString(),
      status: 'completed_pending_report',
    });

    const gate = hasActiveAssessment('child_1');
    expect(gate.active).toBe(true);
    expect(gate.reason).toBe('completed');
    expect(gate.draft?.status).toBe('completed_pending_report');
  });
});
