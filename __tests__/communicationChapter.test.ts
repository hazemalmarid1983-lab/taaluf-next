import { CRITERIA_LIST } from '../types/taalof';
import {
  COMMUNICATION_LANGUAGE_CHAPTER_ID,
  findChapterIdForMedia,
  listTrainingChapterIds,
  loadCommunicationLanguageChapter,
  validateCommunicationLanguageChapter,
} from '../lib/training/loadChapter';
import { resolveTrainingActivityRoute } from '../lib/training/activityRoutes';
import { requireTrainingMedia, resolveMediaRuntimeConfig } from '../lib/training/engine';
import {
  buildCommTrialSpec,
  getCommDisplayedChoices,
  resolveCommAssistanceStage,
  resolveCommRuntimeSettings,
  resolveCommTrialOutcome,
} from '../lib/training/communicationChoiceEngine';
import {
  beginCommChoiceSession,
  commitCommChoiceTrial,
  finalizeCommChoiceSession,
  isCommChoiceSessionComplete,
  startCommChoiceTrial,
} from '../lib/training/communicationChoiceSessionFlow';
import { hasCommPictogramArt } from '../lib/training/commPictogramArt';
import { getTrainingCandidatesForCriterion } from '../lib/training/trainingCandidates';
import {
  resolveChapterIdForPlanMedia,
  saveTrainingPlanFromBuilder,
} from '../lib/training/planBuilder';
import { resolveTrainingPlanExecutionForPlan } from '../lib/training/planExecution';
import type { TrackedGoal } from '../lib/goalsEngine';
import * as goalsStore from '../lib/goalsStore';
import {
  clearAllTrainingStorage,
  resetTrainingStorageAdapter,
  setTrainingStorageAdapter,
} from '../lib/training/storage';
import { TRAINING_ENGINE_TYPES } from '../lib/training/types';
import { validateTrainingChapterDocument } from '../lib/training/validateChapter';

const COMM_CRITERIA = ['C1', 'C2', 'C3', 'C6', 'C8'] as const;
const COMM_MEDIA = [
  'tap-to-request',
  'symbol-board-request',
  'listen-then-tap',
  'point-to-item',
  'name-call-tap',
] as const;

describe('communication-language chapter document', () => {
  const criteriaIds = new Set(CRITERIA_LIST.map((c) => c.id));

  it('validates and loads chapter', () => {
    const validation = validateCommunicationLanguageChapter();
    expect(validation.valid).toBe(true);
    const doc = loadCommunicationLanguageChapter();
    expect(doc.chapter.chapterId).toBe(COMMUNICATION_LANGUAGE_CHAPTER_ID);
    expect(doc.chapter.titleAr).toBe('التواصل واللغة');
  });

  it('defines five media linked to C1,C2,C3,C6,C8 only', () => {
    const doc = loadCommunicationLanguageChapter();
    expect(doc.media).toHaveLength(5);
    expect(doc.chapter.orderedMedia).toEqual([...COMM_MEDIA]);
    expect(doc.chapter.criterionIds.sort()).toEqual([...COMM_CRITERIA].sort());

    for (const item of doc.media) {
      expect(item.criterionIds.every((id) => criteriaIds.has(id))).toBe(true);
      expect(
        item.criterionIds.every((id) =>
          (COMM_CRITERIA as readonly string[]).includes(id)
        )
      ).toBe(true);
    }
  });

  it('uses communication engine types only', () => {
    const doc = loadCommunicationLanguageChapter();
    const engines = new Set<string>(TRAINING_ENGINE_TYPES);
    for (const item of doc.media) {
      expect(['expressive_choice', 'receptive_choice']).toContain(
        item.engineType
      );
      expect(engines.has(item.engineType)).toBe(true);
    }
  });

  it('registers chapter in loader and media lookup', () => {
    expect(listTrainingChapterIds()).toContain(COMMUNICATION_LANGUAGE_CHAPTER_ID);
    for (const mediaId of COMM_MEDIA) {
      expect(findChapterIdForMedia(mediaId)).toBe(
        COMMUNICATION_LANGUAGE_CHAPTER_ID
      );
    }
  });

  it('exposes routes for every media', () => {
    for (const mediaId of COMM_MEDIA) {
      const route = resolveTrainingActivityRoute(
        COMMUNICATION_LANGUAGE_CHAPTER_ID,
        mediaId
      );
      expect(route).toContain('/dashboard/training/communication-language/');
      expect(route).toContain(mediaId);
    }
  });
});

describe('communication criterion → skill → media candidates', () => {
  it('maps each communication criterion to one activity', () => {
    const expected: Record<string, string> = {
      C1: 'tap-to-request',
      C8: 'symbol-board-request',
      C3: 'listen-then-tap',
      C6: 'point-to-item',
      C2: 'name-call-tap',
    };

    for (const [criterionId, mediaId] of Object.entries(expected)) {
      const result = getTrainingCandidatesForCriterion(criterionId);
      expect(result.chapterId).toBe(COMMUNICATION_LANGUAGE_CHAPTER_ID);
      expect(result.media.map((m) => m.mediaId)).toEqual([mediaId]);
      expect(result.skills).toHaveLength(1);
    }
  });

  it('does not steal C11 from attention-focus', () => {
    const result = getTrainingCandidatesForCriterion('C11');
    expect(result.chapterId).toBe('attention-focus');
    expect(result.media.map((m) => m.mediaId)).toEqual(['follow-star']);
  });
});

describe('communication choice engine', () => {
  const doc = loadCommunicationLanguageChapter();

  it.each(COMM_MEDIA)('builds trials for %s at difficulties 1–3', (mediaId) => {
    const media = requireTrainingMedia(doc, mediaId);
    for (const difficulty of [1, 2, 3] as const) {
      const config = resolveMediaRuntimeConfig(media, difficulty);
      const settings = resolveCommRuntimeSettings(config);
      expect(settings.difficulty).toBe(difficulty);
      const spec = buildCommTrialSpec(settings, 1);
      expect(spec.choices.some((c) => c.isCorrect)).toBe(true);
      expect(spec.promptLabelAr.length).toBeGreaterThan(0);
    }
  });

  it('speaks a where-question and draws each point-to-item object', () => {
    const media = requireTrainingMedia(doc, 'point-to-item');
    const settings = resolveCommRuntimeSettings(resolveMediaRuntimeConfig(media));
    const specs = [1, 2, 3, 4].map((trial) => buildCommTrialSpec(settings, trial));
    expect(specs.map((spec) => spec.promptLabelAr)).toEqual([
      'أين كرة؟',
      'أين كوب؟',
      'أين سيارة؟',
      'أين كتاب؟',
    ]);
    for (const spec of specs) {
      expect(hasCommPictogramArt(spec.target.id)).toBe(true);
      for (const choice of spec.choices) {
        expect(hasCommPictogramArt(choice.item.id)).toBe(true);
      }
    }
  });

  it('applies assistance semantics and timeout', () => {
    const media = requireTrainingMedia(doc, 'tap-to-request');
    const settings = resolveCommRuntimeSettings(
      resolveMediaRuntimeConfig(media)
    );
    const spec = buildCommTrialSpec(settings, 1);

    expect(resolveCommAssistanceStage(1000, true)).toBe('none');
    expect(resolveCommAssistanceStage(3000, true)).toBe('visual_hint');
    expect(resolveCommAssistanceStage(5000, true)).toBe('reduced_choices');
    expect(resolveCommAssistanceStage(8000, true)).toBe(
      'direct_visual_assistance'
    );

    const reduced = getCommDisplayedChoices(
      spec,
      'reduced_choices'
    );
    expect(reduced.length).toBeLessThanOrEqual(2);

    const timeout = resolveCommTrialOutcome({
      spec,
      choiceId: null,
      elapsedMs: spec.responseWindowMs + 100,
      prompting: true,
      timedOut: true,
    });
    expect(timeout.correct).toBe(false);
    expect(timeout.promptLevel).toBe('no_response');
  });
});

describe('communication session flow and plan launch', () => {
  const memory = new Map<string, string>();

  beforeEach(() => {
    memory.clear();
    resetTrainingStorageAdapter();
    setTrainingStorageAdapter({
      isAvailable: () => true,
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => memory.set(key, value),
      removeItem: (key) => memory.delete(key),
    });
    clearAllTrainingStorage();
  });

  it('completes tap-to-request session and persists trials', () => {
    const media = requireTrainingMedia(
      loadCommunicationLanguageChapter(),
      'tap-to-request'
    );
    let session = beginCommChoiceSession({
      childId: 'child_comm',
      chapterId: COMMUNICATION_LANGUAGE_CHAPTER_ID,
      media,
    }).session;

    const total = session.targetTrialCount;
    for (let i = 0; i < total; i += 1) {
      session = startCommChoiceTrial(session);
      session = commitCommChoiceTrial(session, {
        correct: i % 2 === 0,
        promptLevel: i % 2 === 0 ? 'independent' : 'visual_hint',
        responseTimeMs: 1200 + i * 100,
      });
    }

    expect(isCommChoiceSessionComplete(session)).toBe(true);
    session = finalizeCommChoiceSession(session);
    expect(session.status).toBe('completed');
    expect(session.trials).toHaveLength(total);
  });

  it('saves plan with communication chapterId and resolves launcher route', () => {
    const childId = 'child_plan_comm';
    const goal: TrackedGoal = {
      id: 'tg_comm_c1',
      childId,
      criterionId: 'C1',
      domain: 'التواصل الاستجابي والتعبيري',
      title: 'طلب',
      smartText: 'test',
      baseline: 30,
      target: 70,
      current: 35,
      startDate: '2026-09-08T00:00:00.000Z',
      targetDate: '2026-10-08T00:00:00.000Z',
      status: 'active',
      sessions: [],
    };
    jest.spyOn(goalsStore, 'loadGoalsLocal').mockReturnValue([goal]);

    expect(resolveChapterIdForPlanMedia(['tap-to-request'])).toBe(
      COMMUNICATION_LANGUAGE_CHAPTER_ID
    );

    const plan = saveTrainingPlanFromBuilder({
      childId,
      selectedGoalIds: [goal.id],
      orderedMediaIds: ['tap-to-request'],
      difficulties: { 'tap-to-request': 2 },
    });

    expect(plan.chapterId).toBe(COMMUNICATION_LANGUAGE_CHAPTER_ID);
    const execution = resolveTrainingPlanExecutionForPlan(plan);
    expect(execution.activityRoute).toContain('tap-to-request');
  });

  it('rejects mixed-chapter plans', () => {
    expect(() =>
      resolveChapterIdForPlanMedia(['follow-star', 'tap-to-request'])
    ).toThrow(/فصلاً تدريبياً واحداً/);
  });
});

describe('communication chapter cross-link validation', () => {
  it('accepts shipped communication-language chapter', () => {
    const result = validateTrainingChapterDocument(
      loadCommunicationLanguageChapter()
    );
    expect(result.valid).toBe(true);
  });
});
