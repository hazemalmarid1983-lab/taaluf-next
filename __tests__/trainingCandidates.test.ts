import type { TrackedGoal } from '../lib/goalsEngine';
import * as goalsStore from '../lib/goalsStore';
import {
  getTrainingCandidateCriteriaSource,
  getTrainingCandidatesForCriterion,
  getTrainingCandidatesForGoal,
  getTrainingCandidatesForTrackedGoal,
  TrainingCandidateError,
} from '../lib/training/trainingCandidates';
import { validateTrainingChapterDocument } from '../lib/training/validateChapter';
import { loadAttentionFocusChapter } from '../lib/training/loadChapter';

function sampleGoal(overrides: Partial<TrackedGoal> = {}): TrackedGoal {
  return {
    id: 'tg_test_child_C11_abc',
    childId: 'child_test',
    criterionId: 'C11',
    domain: 'التفاعل والاندماج الاجتماعي واللعب',
    title: 'الانتباه المشترك والتتبع البصري التفاعلي',
    smartText: 'هدف اختبار',
    baseline: 40,
    target: 70,
    current: 40,
    startDate: '2026-09-08T00:00:00.000Z',
    targetDate: '2026-10-08T00:00:00.000Z',
    status: 'active',
    sessions: [],
    ...overrides,
  };
}

describe('trainingCandidates', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses canonical v3 criteria source only', () => {
    expect(getTrainingCandidateCriteriaSource()).toBe(
      'data/taalof_criteria_v3.json'
    );
  });

  it('returns tap-to-request for C1 in communication-language', () => {
    const result = getTrainingCandidatesForCriterion('C1');
    expect(result.chapterId).toBe('communication-language');
    expect(result.skills.map((s) => s.skillId)).toEqual([
      'skill-functional-request',
    ]);
    expect(result.media.map((m) => m.mediaId)).toEqual(['tap-to-request']);
  });

  it('returns follow-star for C11', () => {
    const result = getTrainingCandidatesForCriterion('C11');
    expect(result.chapterId).toBe('attention-focus');
    expect(result.skills.map((s) => s.skillId)).toEqual(['skill-visual-tracking']);
    expect(result.media.map((m) => m.mediaId)).toEqual(['follow-star']);
  });

  it('returns five attention candidates for C25', () => {
    const result = getTrainingCandidatesForCriterion('C25');
    expect(result.skills).toHaveLength(5);
    expect(result.media.map((m) => m.mediaId)).toEqual([
      'follow-star',
      'match-me',
      'where-did-it-go',
      'find-the-target',
      'wait-then-touch',
    ]);
  });

  it('returns zero candidates for C26 after integrity correction', () => {
    const result = getTrainingCandidatesForCriterion('C26');
    expect(result.criterion.id).toBe('C26');
    expect(result.skills).toEqual([]);
    expect(result.media).toEqual([]);
  });

  it('returns zero candidates for C12 without error', () => {
    const result = getTrainingCandidatesForCriterion('C12');
    expect(result.skills).toEqual([]);
    expect(result.media).toEqual([]);
  });

  it('throws for invalid criterion reference', () => {
    expect(() => getTrainingCandidatesForCriterion('C999')).toThrow(
      TrainingCandidateError
    );
    expect(() => getTrainingCandidatesForCriterion('')).toThrow(
      TrainingCandidateError
    );
  });

  it('throws for missing goal id', () => {
    jest.spyOn(goalsStore, 'loadGoalsLocal').mockReturnValue([]);
    expect(() => getTrainingCandidatesForGoal('missing_goal')).toThrow(
      TrainingCandidateError
    );
  });

  it('resolves candidates for a tracked goal via goalId', () => {
    const goal = sampleGoal();
    jest.spyOn(goalsStore, 'loadGoalsLocal').mockReturnValue([goal]);

    const result = getTrainingCandidatesForGoal(goal.id);
    expect(result.goal.id).toBe(goal.id);
    expect(result.media.map((m) => m.mediaId)).toEqual(['follow-star']);
  });

  it('resolves candidates directly from TrackedGoal object', () => {
    const result = getTrainingCandidatesForTrackedGoal(
      sampleGoal({ criterionId: 'C25' })
    );
    expect(result.media).toHaveLength(5);
  });
});

describe('training chapter cross-link validation', () => {
  function cloneDoc() {
    return JSON.parse(JSON.stringify(loadAttentionFocusChapter()));
  }

  it('accepts the shipped attention-focus chapter', () => {
    const result = validateTrainingChapterDocument(loadAttentionFocusChapter());
    expect(result.valid).toBe(true);
  });

  it('rejects media criterionIds outside linked skill criterion union', () => {
    const doc = cloneDoc();
    doc.media[0].criterionIds = ['C12'];
    const result = validateTrainingChapterDocument(doc);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some(
        (error) => error.includes('criterionIds') && error.includes('C12')
      )
    ).toBe(true);
  });

  it('rejects unknown canonical criterion ids on skills', () => {
    const doc = cloneDoc();
    doc.skills[0].criterionIds = ['C999'];
    const result = validateTrainingChapterDocument(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('C999'))).toBe(true);
  });

  it('rejects media skillIds pointing to unknown skills', () => {
    const doc = cloneDoc();
    doc.media[0].skillIds = ['skill-missing'];
    const result = validateTrainingChapterDocument(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('skill-missing'))).toBe(
      true
    );
  });
});

describe('legacy criteria safety', () => {
  it('does not import taalof_unified_criteria.json in training mapper stack', () => {
    expect(getTrainingCandidateCriteriaSource()).not.toContain('unified');
  });
});
