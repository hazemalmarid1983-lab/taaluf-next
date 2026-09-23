import type { TrackedGoal } from '../lib/goalsEngine';
import * as goalsStore from '../lib/goalsStore';
import {
  C15_PROGRESSION_DIMENSION_SKILL_IDS,
  C15_TARGET_SKILL_IDS,
  filterObserverImitationTargetSkillIds,
  isC15ProgressionDimensionSkillId,
  isC15TargetSkillId,
} from '../lib/training/c15SkillClassification';
import { resolveObserverImitationRuntimeSettings } from '../lib/training/observerImitationEngine';
import { beginObserverImitationSession } from '../lib/training/observerImitationSessionFlow';
import {
  loadMotorSocialImitationChapter,
  MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
} from '../lib/training/loadChapter';
import {
  listCandidateEntriesForGoal,
  PlanBuilderError,
  resolvePlanBuilderGoalViews,
  saveTrainingPlanFromBuilder,
  togglePlanBuilderActivitySkill,
} from '../lib/training/planBuilder';
import { requireTrainingMedia } from '../lib/training/engine';
import { resolveMediaRuntimeConfig } from '../lib/training/engine/mediaLoader';
import { validateTrainingChapterDocument } from '../lib/training/validateChapter';
import { validateTrainingPlanDocument } from '../lib/training/validatePlan';
import { createTrainingPlan } from '../lib/training/createPlan';
import {
  clearAllTrainingStorage,
  resetTrainingStorageAdapter,
  setTrainingStorageAdapter,
} from '../lib/training/storage';

const memory = new Map<string, string>();

function installMemoryStorage() {
  memory.clear();
  setTrainingStorageAdapter({
    isAvailable: () => true,
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: (key) => memory.delete(key),
  });
}

beforeEach(() => {
  resetTrainingStorageAdapter();
  installMemoryStorage();
  clearAllTrainingStorage();
});

afterEach(() => {
  resetTrainingStorageAdapter();
  memory.clear();
  jest.restoreAllMocks();
});

const TARGET = {
  S1: C15_TARGET_SKILL_IDS[0],
  S2: C15_TARGET_SKILL_IDS[1],
  S3: C15_TARGET_SKILL_IDS[2],
} as const;

const PROGRESSION = {
  S4: C15_PROGRESSION_DIMENSION_SKILL_IDS[0],
  S5: C15_PROGRESSION_DIMENSION_SKILL_IDS[1],
} as const;

function sampleGoal(childId: string): TrackedGoal {
  return {
    id: `tg_${childId}_C15_test`,
    childId,
    criterionId: 'C15',
    domain: 'social',
    title: 'التقليد',
    smartText: 'هدف',
    baseline: 30,
    target: 70,
    current: 35,
    startDate: '2026-09-08T00:00:00.000Z',
    targetDate: '2026-10-08T00:00:00.000Z',
    status: 'active',
    sessions: [],
  };
}

describe('C15 skill classification constants', () => {
  it.each(C15_TARGET_SKILL_IDS)('%s is a target skill', (id) => {
    expect(isC15TargetSkillId(id)).toBe(true);
    expect(isC15ProgressionDimensionSkillId(id)).toBe(false);
  });

  it.each(C15_PROGRESSION_DIMENSION_SKILL_IDS)(
    '%s is progression (not target)',
    (id) => {
      expect(isC15ProgressionDimensionSkillId(id)).toBe(true);
      expect(isC15TargetSkillId(id)).toBe(false);
    }
  );
});

describe('C15 chapter after reclassification', () => {
  it('validates chapter document', () => {
    const doc = loadMotorSocialImitationChapter();
    expect(validateTrainingChapterDocument(doc).valid).toBe(true);
    expect(doc.chapter.skillIds).toEqual([...C15_TARGET_SKILL_IDS]);
    expect(doc.media[0]?.skillIds).toEqual([...C15_TARGET_SKILL_IDS]);
    expect(doc.skills).toHaveLength(5);
  });
});

describe('Plan Builder — observer-imitation target skills only', () => {
  const childId = 'child_c15_reclass';

  beforeEach(() => {
    jest.spyOn(goalsStore, 'loadGoalsLocal').mockReturnValue([sampleGoal(childId)]);
  });

  function entries() {
    const views = resolvePlanBuilderGoalViews(childId, [sampleGoal(childId).id]);
    return listCandidateEntriesForGoal(views[0]!);
  }

  it('S1 selectable in candidate entries', () => {
    expect(entries().some((e) => e.skillId === TARGET.S1)).toBe(true);
  });

  it('S2 selectable in candidate entries', () => {
    expect(entries().some((e) => e.skillId === TARGET.S2)).toBe(true);
  });

  it('S3 selectable in candidate entries', () => {
    expect(entries().some((e) => e.skillId === TARGET.S3)).toBe(true);
  });

  it('S4 not selectable as target skill', () => {
    expect(entries().some((e) => e.skillId === PROGRESSION.S4)).toBe(false);
  });

  it('S5 not selectable as target skill', () => {
    expect(entries().some((e) => e.skillId === PROGRESSION.S5)).toBe(false);
  });

  it('toggle S4 throws PlanBuilderError', () => {
    expect(() =>
      togglePlanBuilderActivitySkill({}, [], 'observer-imitation', PROGRESSION.S4)
    ).toThrow(PlanBuilderError);
  });

  it('S1+S2 save to one assignment', () => {
    const plan = saveTrainingPlanFromBuilder({
      childId,
      selectedGoalIds: [sampleGoal(childId).id],
      orderedMediaIds: ['observer-imitation'],
      difficulties: { 'observer-imitation': 1 },
      selectedActivitySkills: {
        'observer-imitation': [TARGET.S1, TARGET.S2],
      },
    });
    expect(plan.assignments).toHaveLength(1);
    expect(plan.assignments[0]?.skillIds).toEqual([TARGET.S1, TARGET.S2]);
  });

  it('S1+S2+S3 save without S4/S5', () => {
    const plan = saveTrainingPlanFromBuilder({
      childId,
      selectedGoalIds: [sampleGoal(childId).id],
      orderedMediaIds: ['observer-imitation'],
      difficulties: { 'observer-imitation': 1 },
      selectedActivitySkills: {
        'observer-imitation': [TARGET.S1, TARGET.S2, TARGET.S3],
      },
    });
    const ids = plan.assignments[0]?.skillIds ?? [];
    expect(ids).toHaveLength(3);
    expect(ids).toEqual([TARGET.S1, TARGET.S2, TARGET.S3]);
    expect(ids.some((id) => isC15ProgressionDimensionSkillId(id))).toBe(false);
  });

  it('filter strips S4/S5 if passed to builder save path', () => {
    const filtered = filterObserverImitationTargetSkillIds([
      TARGET.S1,
      PROGRESSION.S4,
      PROGRESSION.S5,
    ]);
    expect(filtered).toEqual([TARGET.S1]);
  });
});

describe('validation backward compatibility', () => {
  it('plan without skillIds stays valid', () => {
    const plan = createTrainingPlan({
      childId: 'c_legacy',
      chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
      assignments: [{ mediaId: 'observer-imitation', difficulty: 1, order: 1 }],
      status: 'active',
    });
    expect(validateTrainingPlanDocument(plan).valid).toBe(true);
  });

  it('legacy plan with S4/S5 in skillIds stays valid', () => {
    const plan = createTrainingPlan({
      childId: 'c_legacy_mix',
      chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
      assignments: [
        {
          mediaId: 'observer-imitation',
          difficulty: 1,
          order: 1,
          skillIds: [TARGET.S1, PROGRESSION.S4, PROGRESSION.S5],
        },
      ],
      status: 'active',
    });
    expect(validateTrainingPlanDocument(plan).valid).toBe(true);
  });
});

describe('other chapters unaffected', () => {
  it('tap-to-request plan without skillIds stays valid', () => {
    const plan = createTrainingPlan({
      childId: 'comm_child',
      chapterId: 'communication-language',
      assignments: [{ mediaId: 'tap-to-request', difficulty: 1, order: 1 }],
      status: 'active',
    });
    expect(validateTrainingPlanDocument(plan).valid).toBe(true);
  });
});

describe('observer-imitation engine unchanged (smoke)', () => {
  it('still begins with five trials', () => {
    const chapter = loadMotorSocialImitationChapter();
    const media = requireTrainingMedia(chapter, 'observer-imitation');
    const bundle = beginObserverImitationSession({
      childId: 'c_eng',
      chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
      media,
      skillIds: [TARGET.S1, TARGET.S2],
    });
    expect(bundle.session.targetTrialCount).toBe(5);
    const settings = resolveObserverImitationRuntimeSettings({
      config: resolveMediaRuntimeConfig(media, bundle.session.difficulty),
      sessionId: bundle.session.id,
    });
    expect(settings.trials.length).toBe(5);
  });
});
