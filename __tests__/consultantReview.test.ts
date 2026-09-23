import {
  CRITERIA_WITHOUT_METHODOLOGY_SECTION,
  getCriteriaWithReviewQuestions,
  getReviewQuestions,
  getReviewQuestionsByCriterion,
  getReviewQuestionsBySection,
  REVIEW_QUESTION_BANK,
} from '@/lib/consultantRoom/reviewQuestions';
import {
  importReviewBackup,
  parseReviewBackup,
  serializeReviewBackup,
} from '@/lib/consultantRoom/reviewBackup';
import {
  CONSULTANT_REVIEW_STORAGE_KEY,
  countAnsweredQuestions,
  findFirstUnansweredQuestionId,
  getCriterionReviewStatus,
  getProgressPercentage,
  getQuestionStatus,
  getReviewOverallStatus,
  getReviewProgressSummary,
  getSectionProgress,
  isQuestionCompleteForDefinition,
  loadReviewResponses,
  saveReviewResponses,
  upsertReviewAnswer,
  upsertReviewNotes,
  upsertReviewReviewed,
} from '@/lib/consultantRoom/reviewProgress';

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

describe('consultantReview question bank', () => {
  it('loads expanded review questions', () => {
    expect(getReviewQuestions().length).toBeGreaterThan(10);
    expect(REVIEW_QUESTION_BANK.length).toBe(191);
  });

  it('has no duplicate IDs', () => {
    const ids = REVIEW_QUESTION_BANK.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('assigns every question to a section', () => {
    for (const question of REVIEW_QUESTION_BANK) {
      expect(question.sectionId).toBeTruthy();
      expect(question.responseType).toMatch(/yes_no|review_note/);
    }
  });

  it('covers C1–C34 with review points from methodology', () => {
    const covered = getCriteriaWithReviewQuestions();
    for (let i = 1; i <= 34; i += 1) {
      expect(covered).toContain(`C${i}`);
    }
  });

  it('does not list C34 as without methodology section', () => {
    expect(CRITERIA_WITHOUT_METHODOLOGY_SECTION).not.toContain('C34');
    expect(getReviewQuestionsBySection('social-cognitive').length).toBeGreaterThan(
      0
    );
  });

  it('includes C34 review questions from §96 methodology', () => {
    const c34 = getReviewQuestionsByCriterion('C34');
    expect(c34.length).toBe(20);
    expect(c34.some((q) => q.id === 'C34-01')).toBe(true);
    expect(c34.some((q) => q.id === 'C34-17' && q.responseType === 'yes_no')).toBe(
      true
    );
    expect(c34.filter((q) => q.responseType === 'review_note').length).toBe(19);
  });

  it('includes C33 and C32 questions unchanged', () => {
    const c33 = REVIEW_QUESTION_BANK.filter((q) => q.criterionId === 'C33');
    const c32 = REVIEW_QUESTION_BANK.filter((q) => q.criterionId === 'C32');
    expect(c33.length).toBe(6);
    expect(c32.length).toBe(4);
    expect(c33.map((q) => q.id)).toEqual([
      'C33-01',
      'C33-02',
      'C33-03',
      'C33-04',
      'C33-05',
      'C33-06',
    ]);
  });

  it('keeps legacy question IDs', () => {
    const legacy = [
      'screening-thresholds',
      'canon-validity',
      'fusion-weights',
      'goal-generation',
      'training-activities',
      'sensory-metrics',
      'disclaimer-language',
      'merhid-boundaries',
      'gas-scale',
      'iep-approval',
    ];
    for (const id of legacy) {
      expect(REVIEW_QUESTION_BANK.some((q) => q.id === id)).toBe(true);
    }
  });

  it('links criterion questions with valid criterionId', () => {
    for (const question of REVIEW_QUESTION_BANK) {
      if (!question.criterionId) continue;
      expect(question.criterionId).toMatch(/^C\d+$/);
      const n = parseInt(question.criterionId.slice(1), 10);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(34);
    }
  });

  it('does not leave social-cognitive section empty', () => {
    expect(getReviewQuestionsBySection('social-cognitive').length).toBeGreaterThan(
      50
    );
  });
});

describe('consultantReview persistence', () => {
  it('saves yes answers', () => {
    const next = upsertReviewAnswer({}, 'canon-validity', 'yes');
    expect(next['canon-validity']?.answer).toBe('yes');
    expect(memory.get(CONSULTANT_REVIEW_STORAGE_KEY)).toBeTruthy();
  });

  it('saves no answers', () => {
    const next = upsertReviewAnswer({}, 'goal-generation', 'no');
    expect(next['goal-generation']?.answer).toBe('no');
  });

  it('saves review_note completion', () => {
    const q = REVIEW_QUESTION_BANK.find((item) => item.id === 'iep-approval')!;
    const next = upsertReviewReviewed({}, q.id, true);
    expect(next[q.id]?.reviewed).toBe(true);
    expect(isQuestionCompleteForDefinition(q, next[q.id])).toBe(true);
  });

  it('saves notes without completing yes_no question', () => {
    const next = upsertReviewNotes({}, 'gas-scale', 'ملاحظة draft');
    expect(next['gas-scale']?.notes).toBe('ملاحظة draft');
    const q = REVIEW_QUESTION_BANK.find((item) => item.id === 'gas-scale')!;
    expect(isQuestionCompleteForDefinition(q, next['gas-scale'])).toBe(false);
  });

  it('reloads answers after reopening', () => {
    saveReviewResponses({
      'training-activities': { answer: 'yes', notes: 'جيد' },
      'C33-01': { reviewed: true },
    });
    const loaded = loadReviewResponses();
    expect(loaded['training-activities']?.answer).toBe('yes');
    expect(loaded['C33-01']?.reviewed).toBe(true);
  });

  it('preserves legacy answers after bank expansion', () => {
    saveReviewResponses({ 'screening-thresholds': { answer: 'no' } });
    expect(loadReviewResponses()['screening-thresholds']?.answer).toBe('no');
    expect(getReviewQuestions().some((q) => q.id === 'screening-thresholds')).toBe(
      true
    );
  });

  it('allows updating a previous answer', () => {
    let state = upsertReviewAnswer({}, 'iep-approval', 'yes');
    state = upsertReviewAnswer(state, 'iep-approval', 'no');
    expect(state['iep-approval']?.answer).toBe('no');
  });
});

describe('consultantReview progress', () => {
  it('does not mark yes_no complete without yes/no', () => {
    const q = REVIEW_QUESTION_BANK.find((item) => item.id === 'canon-validity')!;
    expect(getQuestionStatus(q, undefined)).toBe('pending');
    expect(getQuestionStatus(q, { notes: 'ملاحظة' })).toBe('pending');
  });

  it('does not mark review_note complete without reviewed flag', () => {
    const q = REVIEW_QUESTION_BANK.find((item) => item.id === 'C33-03')!;
    expect(getQuestionStatus(q, { notes: 'تعليق' })).toBe('pending');
    expect(getQuestionStatus(q, { reviewed: true })).toBe('answered');
  });

  it('calculates progress after bank expansion', () => {
    const total = getReviewQuestions().length;
    expect(getProgressPercentage(0, total)).toBe(0);
    expect(getReviewOverallStatus(Math.ceil(total / 2), total)).toBe('partial');
  });

  it('calculates criterion review status', () => {
    const c33 = REVIEW_QUESTION_BANK.filter((q) => q.criterionId === 'C33');
    const state: Record<string, { reviewed: boolean }> = {};
    state[c33[0].id] = { reviewed: true };
    expect(getCriterionReviewStatus('C33', state)).toBe('partial');
    for (const q of c33) state[q.id] = { reviewed: true };
    expect(getCriterionReviewStatus('C33', state)).toBe('reviewed');
  });

  it('calculates section progress', () => {
    const section = getSectionProgress('general-principles', {
      'screening-thresholds': { answer: 'yes' },
    });
    expect(section.answeredCount).toBe(1);
    expect(section.totalCount).toBeGreaterThan(0);
  });

  it('calculates overall summary with criteria counts', () => {
    const summary = getReviewProgressSummary({});
    expect(summary.totalCount).toBe(191);
    expect(summary.criteriaWithQuestionsCount).toBe(34);
    expect(summary.reviewedCriteriaCount).toBe(0);
  });

  it('finds first unanswered question for continue review', () => {
    const state = {
      'screening-thresholds': { answer: 'yes' as const },
      'canon-validity': { answer: 'no' as const },
    };
    const next = findFirstUnansweredQuestionId(state);
    expect(next).toBeTruthy();
    expect(next).not.toBe('screening-thresholds');
  });

  it('counts answered questions correctly', () => {
    const state = {
      a: { answer: 'yes' as const },
      b: { reviewed: true },
      c: { notes: 'x' },
    };
    const questions = [
      { id: 'a', sectionId: 'general-principles', question: 'q', responseType: 'yes_no' as const },
      { id: 'b', sectionId: 'general-principles', question: 'q', responseType: 'review_note' as const },
      { id: 'c', sectionId: 'general-principles', question: 'q', responseType: 'yes_no' as const },
    ];
    expect(countAnsweredQuestions(state, questions)).toBe(2);
  });
});

describe('consultantReview backup', () => {
  it('round-trips review responses through JSON backup', () => {
    upsertReviewAnswer({}, 'screening-thresholds', 'yes');
    const exported = serializeReviewBackup(loadReviewResponses());
    const parsed = parseReviewBackup(exported);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.payload.responses['screening-thresholds']?.answer).toBe('yes');

    memory.clear();
    const imported = importReviewBackup(exported);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(loadReviewResponses()['screening-thresholds']?.answer).toBe('yes');
    expect(memory.has(CONSULTANT_REVIEW_STORAGE_KEY)).toBe(true);
  });

  it('rejects invalid backup JSON', () => {
    expect(parseReviewBackup('{not-json').ok).toBe(false);
    expect(parseReviewBackup('{"version":99}').ok).toBe(false);
  });
});
