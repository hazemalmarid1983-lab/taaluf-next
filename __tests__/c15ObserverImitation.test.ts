import { getCriterionById } from '@/types/taalof';
import { getTrainingCandidatesForCriterion } from '@/lib/training/trainingCandidates';
import {
  loadMotorSocialImitationChapter,
  MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
} from '@/lib/training/loadChapter';
import { validateTrainingChapterDocument } from '@/lib/training/validateChapter';
import { resolveTrainingActivityRoute } from '@/lib/training/activityRoutes';
import {
  beginObserverImitationSession,
  commitObserverImitationTrial,
  finalizeObserverImitationSession,
  isObserverImitationSessionComplete,
  startObserverImitationTrial,
} from '@/lib/training/observerImitationSessionFlow';
import { requireTrainingMedia } from '@/lib/training/engine';
import {
  OBSERVER_IMITATION_MEDIA_ID,
  resolveObserverImitationRuntimeSettings,
} from '@/lib/training/observerImitationEngine';
import { buildObserverImitationTrialOutcome } from '@/lib/training/observerImitationObserverFlow';
import { resolveMediaRuntimeConfig } from '@/lib/training/engine/mediaLoader';
import { calculateSessionMetrics } from '@/lib/training/engine/metrics';
import {
  buildUpdatedTrainingProgress,
  persistCompletedTrainingSession,
} from '@/lib/training/sessionPersistence';
import { resolveChapterIdForPlanMedia } from '@/lib/training/planBuilder';
import { createTrainingPlan } from '@/lib/training/createPlan';
import { resolveTrainingPlanExecutionForPlan } from '@/lib/training/planExecution';
import { OBSERVER_IMITATION_PROTOCOL_REVISION } from '@/lib/training/types';
import {
  clearAllTrainingStorage,
  resetTrainingStorageAdapter,
  saveTrainingPlan,
  setTrainingStorageAdapter,
} from '@/lib/training/storage';

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
});

describe('C15 canonical mapping', () => {
  it('loads C15 from taalof_criteria_v3 via CRITERIA_LIST', () => {
    const c15 = getCriterionById('C15');
    expect(c15?.name).toBe('التقليد الحركي والاجتماعي');
    expect(c15?.question).toBe(
      'هل يقلد الطفل حركة بسيطة أو تعبيراً اجتماعياً بعد نموذج مباشر؟'
    );
    expect(c15?.autoGoal).toContain('5 حركات كبيرة');
  });
});

describe('C15 training chapter', () => {
  it('validates motor-social-imitation chapter', () => {
    const doc = loadMotorSocialImitationChapter();
    const result = validateTrainingChapterDocument(doc);
    expect(result.valid).toBe(true);
  });

  it('resolves training candidates for C15 only (not C14/C16)', () => {
    const result = getTrainingCandidatesForCriterion('C15');
    expect(result.chapterId).toBe(MOTOR_SOCIAL_IMITATION_CHAPTER_ID);
    expect(result.skills.length).toBe(5);
    expect(result.media.map((m) => m.mediaId)).toEqual(['observer-imitation']);
    expect(result.criterionId).toBe('C15');

    const allCriterionIds = new Set<string>();
    for (const skill of result.skills) {
      skill.criterionIds.forEach((id) => allCriterionIds.add(id));
    }
    for (const media of result.media) {
      media.criterionIds.forEach((id) => allCriterionIds.add(id));
    }
    expect(allCriterionIds.has('C14')).toBe(false);
    expect(allCriterionIds.has('C16')).toBe(false);
    expect(allCriterionIds.has('C15')).toBe(true);
  });

  it('exposes activity route', () => {
    expect(
      resolveTrainingActivityRoute(
        MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
        OBSERVER_IMITATION_MEDIA_ID
      )
    ).toBe('/dashboard/training/motor-social-imitation/observer-imitation');
  });
});

describe('observer-imitation session engine', () => {
  const chapter = loadMotorSocialImitationChapter();
  const media = requireTrainingMedia(chapter, OBSERVER_IMITATION_MEDIA_ID);

  it('uses observer-imitation protocol revision', () => {
    const bundle = beginObserverImitationSession({
      childId: 'child_c15',
      chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
      media,
    });
    expect(bundle.session.protocolRevision).toBe(
      OBSERVER_IMITATION_PROTOCOL_REVISION
    );
    expect(bundle.settings.trials.length).toBe(5);
  });

  it('stores observer-selected promptLevel without auto assignment', () => {
    let session = beginObserverImitationSession({
      childId: 'child_c15',
      chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
      media,
    }).session;

    session = startObserverImitationTrial(session);
    const movement = bundleMovement(session, media);

    const outcome = buildObserverImitationTrialOutcome({
      success: true,
      observerPromptLevel: 'partial_physical',
      responseTimeMs: 1200,
      movementId: movement.movementId,
      movementCategory: movement.category,
      modelReplays: 3,
    });

    expect(outcome.promptLevel).toBe('partial_physical');
    expect(outcome.modelReplays).toBe(3);

    session = commitObserverImitationTrial(session, outcome);
    expect(session.trials[0]?.promptLevel).toBe('partial_physical');
    expect(session.trials[0]?.modelReplays).toBe(3);
    expect(session.trials[0]?.movementId).toBe(movement.movementId);
  });

  it('sets no_response only when observer selects it', () => {
    let session = beginObserverImitationSession({
      childId: 'child_c15',
      chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
      media,
    }).session;
    session = startObserverImitationTrial(session);
    const movement = bundleMovement(session, media);

    const outcome = buildObserverImitationTrialOutcome({
      success: true,
      observerPromptLevel: 'no_response',
      responseTimeMs: 5000,
      movementId: movement.movementId,
      movementCategory: movement.category,
      modelReplays: 0,
    });

    expect(outcome.promptLevel).toBe('no_response');
    expect(outcome.correct).toBe(false);
  });

  it('completes session metrics without mastery wording contract', () => {
    let session = beginObserverImitationSession({
      childId: 'child_c15',
      chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
      media,
    }).session;

    for (let i = 0; i < session.targetTrialCount; i += 1) {
      session = startObserverImitationTrial(session);
      const movement = bundleMovement(session, media);
      session = commitObserverImitationTrial(
        session,
        buildObserverImitationTrialOutcome({
          success: i % 2 === 0,
          observerPromptLevel: i === 0 ? 'independent' : 'gestural',
          responseTimeMs: 800 + i * 100,
          movementId: movement.movementId,
          movementCategory: movement.category,
          modelReplays: 1,
        })
      );
    }

    expect(isObserverImitationSessionComplete(session)).toBe(true);
    session = finalizeObserverImitationSession(session);
    const metrics = calculateSessionMetrics(session.trials);
    expect(metrics.totalTrials).toBe(5);
    expect(metrics.promptBreakdown.gestural).toBeGreaterThan(0);
    expect(metrics.independence).toBeGreaterThanOrEqual(0);
  });

  it('persists session and progress', () => {
    let session = beginObserverImitationSession({
      childId: 'child_persist_c15',
      chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
      media,
    }).session;

    session = startObserverImitationTrial(session);
    const movement = bundleMovement(session, media);
    session = commitObserverImitationTrial(
      session,
      buildObserverImitationTrialOutcome({
        success: true,
        observerPromptLevel: 'independent',
        responseTimeMs: 900,
        movementId: movement.movementId,
        movementCategory: movement.category,
        modelReplays: 0,
      })
    );

    while (!isObserverImitationSessionComplete(session)) {
      session = startObserverImitationTrial(session);
      const m = bundleMovement(session, media);
      session = commitObserverImitationTrial(
        session,
        buildObserverImitationTrialOutcome({
          success: true,
          observerPromptLevel: 'verbal',
          responseTimeMs: 1000,
          movementId: m.movementId,
          movementCategory: m.category,
          modelReplays: 2,
        })
      );
    }

    session = finalizeObserverImitationSession(session);
    const { progress, metrics } = persistCompletedTrainingSession(session);
    expect(progress.mediaId).toBe(OBSERVER_IMITATION_MEDIA_ID);
    expect(progress.chapterId).toBe(MOTOR_SOCIAL_IMITATION_CHAPTER_ID);
    expect(metrics.totalTrials).toBe(session.targetTrialCount);

    const updated = buildUpdatedTrainingProgress(null, session, metrics);
    expect(updated.completedSessions).toBe(1);
  });
});

describe('plan integration for C15', () => {
  it('resolves chapter from observer-imitation media id', () => {
    expect(resolveChapterIdForPlanMedia(['observer-imitation'])).toBe(
      MOTOR_SOCIAL_IMITATION_CHAPTER_ID
    );
  });

  it('resolves plan execution route for C15 activity', () => {
    const plan = createTrainingPlan({
      childId: 'child_plan_c15',
      chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
      assignments: [{ mediaId: OBSERVER_IMITATION_MEDIA_ID, order: 1 }],
      status: 'active',
    });
    saveTrainingPlan(plan);

    const execution = resolveTrainingPlanExecutionForPlan(plan);
    expect(execution.activityRoute).toContain('observer-imitation');
    expect(execution.media?.mediaId).toBe(OBSERVER_IMITATION_MEDIA_ID);
  });
});

function bundleMovement(
  session: ReturnType<typeof beginObserverImitationSession>['session'],
  media: ReturnType<typeof requireTrainingMedia>
) {
  const settings = resolveObserverImitationRuntimeSettings({
    config: resolveMediaRuntimeConfig(media, session.difficulty),
    sessionId: session.id,
  });
  const trialNumber = session.activeTrialNumber ?? session.trials.length + 1;
  const movement = settings.trials[trialNumber - 1];
  if (!movement) {
    throw new Error('missing movement for trial');
  }
  return movement;
}
