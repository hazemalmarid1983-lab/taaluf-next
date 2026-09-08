import {
  ATTENTION_FOCUS_CHAPTER_ID,
  loadAttentionFocusChapter,
} from '../lib/training/loadChapter';
import {
  createTrainingActivityFlow,
  type TrainingTrialOutcome,
} from '../lib/training/activityFlow';
import { requireTrainingMedia, TrainingEngineError } from '../lib/training/engine';
import {
  resolveFollowStarRuntimeSettings,
  type FollowStarRuntimeSettings,
} from '../lib/training/followStarEngine';
import {
  resolveMatchMeRuntimeSettings,
  type MatchMeRuntimeSettings,
} from '../lib/training/matchMeEngine';

const followStarFlow = createTrainingActivityFlow<FollowStarRuntimeSettings>({
  resolveSettings: resolveFollowStarRuntimeSettings,
  resolveDifficulty: (settings) => settings.difficulty,
});

const matchMeFlow = createTrainingActivityFlow<MatchMeRuntimeSettings>({
  resolveSettings: resolveMatchMeRuntimeSettings,
  resolveDifficulty: (settings) => settings.difficulty,
});

const independentOutcome: TrainingTrialOutcome = {
  correct: true,
  promptLevel: 'independent',
  responseTimeMs: 900,
};

describe('training activity flow — generic layer', () => {
  const followStarMedia = requireTrainingMedia(
    loadAttentionFocusChapter(),
    'follow-star'
  );
  const matchMeMedia = requireTrainingMedia(
    loadAttentionFocusChapter(),
    'match-me'
  );

  it('begins a session with media-specific settings', () => {
    const bundle = followStarFlow.begin({
      childId: 'child_flow',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media: followStarMedia,
    });

    expect(bundle.session.status).toBe('active');
    expect(bundle.session.mediaId).toBe('follow-star');
    expect(bundle.session.targetTrialCount).toBe(10);
    expect(bundle.settings.trialCount).toBe(10);
    expect(bundle.settings.hitRadiusPercent).toBe(14);
  });

  it('starts, commits, and completes trials until trialCount', () => {
    let session = matchMeFlow.begin({
      childId: 'child_flow',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media: matchMeMedia,
    }).session;

    expect(matchMeFlow.isComplete(session)).toBe(false);

    for (let i = 0; i < session.targetTrialCount; i += 1) {
      session = matchMeFlow.startTrial(session);
      session = matchMeFlow.commitTrial(session, {
        ...independentOutcome,
        responseTimeMs: 800 + i * 50,
      });
    }

    expect(matchMeFlow.isComplete(session)).toBe(true);
    expect(session.trials).toHaveLength(10);

    session = matchMeFlow.finalize(session);
    expect(session.status).toBe('completed');
    expect(session.metrics?.totalTrials).toBe(10);
  });

  it('prevents overlapping active trials', () => {
    let session = followStarFlow.begin({
      childId: 'child_flow',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media: followStarMedia,
    }).session;

    session = followStarFlow.startTrial(session);
    expect(() => followStarFlow.startTrial(session)).toThrow(TrainingEngineError);

    session = followStarFlow.commitTrial(session, independentOutcome);
    expect(() => followStarFlow.startTrial(session)).not.toThrow();
  });

  it('blocks mutation after finalize', () => {
    let session = followStarFlow.begin({
      childId: 'child_flow',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media: followStarMedia,
    }).session;

    session = followStarFlow.startTrial(session);
    session = followStarFlow.commitTrial(session, independentOutcome);
    session = followStarFlow.finalize(session);

    expect(() => followStarFlow.startTrial(session)).toThrow(TrainingEngineError);
  });

  it('preserves behavior equivalent to media-specific session flows', () => {
    const genericBundle = matchMeFlow.begin({
      childId: 'child_mm',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media: matchMeMedia,
    });

    expect(genericBundle.settings.choiceCount).toBe(2);
    expect(genericBundle.settings.matchLevel).toBe(1);

    let session = genericBundle.session;
    session = matchMeFlow.startTrial(session);
    session = matchMeFlow.commitTrial(session, {
      correct: false,
      promptLevel: 'reduced_choices',
      responseTimeMs: 4200,
    });

    expect(session.trials).toHaveLength(1);
    expect(session.trials[0].promptLevel).toBe('reduced_choices');
    expect(matchMeFlow.isComplete(session)).toBe(false);
  });
});
