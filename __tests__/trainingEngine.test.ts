import {
  ATTENTION_FOCUS_CHAPTER_ID,
  loadAttentionFocusChapter,
} from '../lib/training/loadChapter';
import {
  TRAINING_PROMPT_LEVELS,
  TrainingEngineError,
  calculateAccuracy,
  calculateAverageResponseTimeMs,
  calculateSessionMetrics,
  countTrainingPromptBreakdown,
  createTrainingSession,
  endTrainingSession,
  isTrainingPromptLevel,
  loadTrainingMedia,
  recordTrial,
  requireTrainingMedia,
  resolveMediaRuntimeConfig,
  runTrainingTrialLoop,
  startTrial,
  trainingIndependencePercentage,
  validateRecordTrainingTrialInput,
  validateTrainingSession,
  validateTrainingSessionRuntime,
  validateTrainingTrial,
} from '../lib/training/engine';

describe('training engine — media loader', () => {
  const doc = loadAttentionFocusChapter();

  it('loads media from attention-focus chapter', () => {
    const media = loadTrainingMedia(doc, 'follow-star');
    expect(media?.titleAr).toBe('اتبع النجمة');
    expect(media?.engineType).toBe('visual_tracking');
  });

  it('throws when media is missing', () => {
    expect(() => requireTrainingMedia(doc, 'missing-media')).toThrow(
      TrainingEngineError
    );
    try {
      requireTrainingMedia(doc, 'missing-media');
    } catch (error) {
      expect(error).toBeInstanceOf(TrainingEngineError);
      expect((error as TrainingEngineError).code).toBe('MEDIA_NOT_FOUND');
    }
  });

  it('reads runtime config from TrainingMediaConfig', () => {
    const media = requireTrainingMedia(doc, 'match-me');
    const config = resolveMediaRuntimeConfig(media);

    expect(config.engineType).toBe('matching');
    expect(config.trialCount).toBe(10);
    expect(config.choices).toBe(2);
    expect(config.prompting).toBe(true);
    expect(config.reinforcement).toBe(true);
    expect(config.difficulty).toBe(1);
    expect(config.content).toEqual(
      expect.objectContaining({ category: 'basic_shapes' })
    );
  });

  it('rejects unsupported difficulty override', () => {
    const media = requireTrainingMedia(doc, 'follow-star');
    expect(() =>
      resolveMediaRuntimeConfig(media, 9 as 1)
    ).toThrow(TrainingEngineError);
  });
});

describe('training engine — prompt levels', () => {
  it('recognizes all TrainingPromptLevel values', () => {
    for (const level of TRAINING_PROMPT_LEVELS) {
      expect(isTrainingPromptLevel(level)).toBe(true);
    }
    expect(isTrainingPromptLevel('invalid')).toBe(false);
  });

  it('calculates independence from prompt levels', () => {
    const trials = [
      { promptLevel: 'independent' as const },
      { promptLevel: 'independent' as const },
      { promptLevel: 'independent' as const },
      { promptLevel: 'visual_hint' as const },
      { promptLevel: 'reduced_choices' as const },
    ];
    expect(trainingIndependencePercentage(trials)).toBe(60);
    expect(countTrainingPromptBreakdown(trials).independent).toBe(3);
    expect(countTrainingPromptBreakdown(trials).visual_hint).toBe(1);
  });
});

describe('training engine — validation', () => {
  it('validates a correct training trial', () => {
    const result = validateTrainingTrial({
      trialNumber: 1,
      correct: true,
      promptLevel: 'independent',
      responseTimeMs: 850,
      recordedAt: '2026-09-08T10:00:00.000Z',
    });
    expect(result.valid).toBe(true);
  });

  it('rejects invalid trial prompt level and response time', () => {
    const result = validateTrainingTrial({
      trialNumber: 0,
      correct: true,
      promptLevel: 'unknown',
      responseTimeMs: -5,
      recordedAt: 'not-a-date',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(2);
  });

  it('validates record trial input', () => {
    expect(
      validateRecordTrainingTrialInput({
        correct: false,
        promptLevel: 'full_physical',
        responseTimeMs: 1200,
      }).valid
    ).toBe(true);
  });

  it('validates completed session runtime', () => {
    const doc = loadAttentionFocusChapter();
    const media = requireTrainingMedia(doc, 'wait-then-touch');
    const session = runTrainingTrialLoop(
      createTrainingSession({
        childId: 'child_1',
        chapterId: ATTENTION_FOCUS_CHAPTER_ID,
        media,
      }),
      [
        {
          correct: true,
          promptLevel: 'independent',
          responseTimeMs: 500,
        },
      ]
    );

    expect(validateTrainingSession(session).valid).toBe(true);
    expect(validateTrainingSessionRuntime(session).valid).toBe(true);
  });
});

describe('training engine — session lifecycle', () => {
  const doc = loadAttentionFocusChapter();

  function createFollowStarSession() {
    return createTrainingSession({
      childId: 'child_test',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media: requireTrainingMedia(doc, 'follow-star'),
    });
  }

  it('creates an active session with target trials from media config', () => {
    const session = createFollowStarSession();
    expect(session.status).toBe('active');
    expect(session.mediaId).toBe('follow-star');
    expect(session.targetTrialCount).toBe(10);
    expect(session.trials).toEqual([]);
    expect(session.activeTrialNumber).toBeUndefined();
  });

  it('starts and records a trial with timestamp and metrics fields', () => {
    let session = createFollowStarSession();
    session = startTrial(session);
    expect(session.activeTrialNumber).toBe(1);

    session = recordTrial(session, {
      correct: true,
      promptLevel: 'independent',
      responseTimeMs: 640,
      recordedAt: '2026-09-08T12:00:00.000Z',
    });

    expect(session.activeTrialNumber).toBeUndefined();
    expect(session.trials).toHaveLength(1);
    expect(session.trials[0]).toEqual({
      trialNumber: 1,
      correct: true,
      promptLevel: 'independent',
      responseTimeMs: 640,
      recordedAt: '2026-09-08T12:00:00.000Z',
    });
  });

  it('requires startTrial before recordTrial', () => {
    const session = createFollowStarSession();
    expect(() =>
      recordTrial(session, {
        correct: true,
        promptLevel: 'independent',
      })
    ).toThrow(TrainingEngineError);
  });

  it('prevents overlapping active trials', () => {
    let session = startTrial(createFollowStarSession());
    expect(() => startTrial(session)).toThrow(TrainingEngineError);
    session = recordTrial(session, {
      correct: true,
      promptLevel: 'independent',
    });
    expect(() => startTrial(session)).not.toThrow();
  });

  it('ends session with accuracy, independence, and average response time', () => {
    const completed = runTrainingTrialLoop(createFollowStarSession(), [
      { correct: true, promptLevel: 'independent', responseTimeMs: 400 },
      { correct: true, promptLevel: 'independent', responseTimeMs: 600 },
      { correct: false, promptLevel: 'visual_hint', responseTimeMs: 800 },
      { correct: true, promptLevel: 'reduced_choices', responseTimeMs: 1000 },
    ]);

    expect(completed.status).toBe('completed');
    expect(completed.endedAt).toBeTruthy();
    expect(completed.independenceRate).toBe(50);
    expect(completed.metrics).toEqual(
      expect.objectContaining({
        accuracy: 75,
        independence: 50,
        averageResponseTimeMs: 700,
        correctCount: 3,
        incorrectCount: 1,
        totalTrials: 4,
      })
    );

    const metrics = calculateSessionMetrics(completed.trials);
    expect(metrics.accuracy).toBe(calculateAccuracy(completed.trials));
    expect(metrics.averageResponseTimeMs).toBe(
      calculateAverageResponseTimeMs(completed.trials)
    );
    expect(metrics.promptBreakdown.visual_hint).toBe(1);
  });

  it('blocks mutation after session completion', () => {
    const completed = runTrainingTrialLoop(createFollowStarSession(), [
      { correct: true, promptLevel: 'independent' },
    ]);

    expect(() => startTrial(completed)).toThrow(TrainingEngineError);
    expect(() =>
      recordTrial(completed, {
        correct: true,
        promptLevel: 'independent',
      })
    ).toThrow(TrainingEngineError);
  });

  it('blocks closing session while a trial is active', () => {
    const active = startTrial(createFollowStarSession());
    expect(() => endTrainingSession(active)).toThrow(TrainingEngineError);
  });

  it('enforces max trials from media config', () => {
    const media = requireTrainingMedia(doc, 'where-did-it-go');
    expect(media.config.trialCount).toBe(8);

    let session = createTrainingSession({
      childId: 'child_cap',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    });

    for (let i = 0; i < 8; i += 1) {
      session = startTrial(session);
      session = recordTrial(session, {
        correct: true,
        promptLevel: 'independent',
      });
    }

    expect(session.trials).toHaveLength(8);
    expect(() => startTrial(session)).toThrow(TrainingEngineError);
    try {
      startTrial(session);
    } catch (error) {
      expect(error).toBeInstanceOf(TrainingEngineError);
      expect((error as TrainingEngineError).code).toBe('MAX_TRIALS_REACHED');
    }
  });
});

describe('training engine — all attention-focus media configs', () => {
  const doc = loadAttentionFocusChapter();

  it('creates sessions for each of the five media tools', () => {
    const mediaIds = doc.chapter.orderedMedia;
    expect(mediaIds).toHaveLength(5);

    for (const mediaId of mediaIds) {
      const media = requireTrainingMedia(doc, mediaId);
      const config = resolveMediaRuntimeConfig(media);
      const session = createTrainingSession({
        childId: 'child_all',
        chapterId: ATTENTION_FOCUS_CHAPTER_ID,
        media,
      });

      expect(session.targetTrialCount).toBe(config.trialCount);
      expect(session.difficulty).toBe(config.difficulty);

      const completed = runTrainingTrialLoop(session, [
        {
          correct: true,
          promptLevel: 'independent',
          responseTimeMs: 300,
        },
      ]);

      expect(completed.metrics?.accuracy).toBe(100);
    }
  });
});
