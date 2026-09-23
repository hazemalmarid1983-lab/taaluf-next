import {
  COMMUNICATION_LANGUAGE_CHAPTER_ID,
  loadCommunicationLanguageChapter,
} from '../lib/training/loadChapter';
import { requireTrainingMedia } from '../lib/training/engine';
import {
  beginCommChoiceSession,
  commitCommChoiceTrial,
  isCommChoiceSessionComplete,
  startCommChoiceTrial,
} from '../lib/training/communicationChoiceSessionFlow';

describe('communication choice session flow', () => {
  const media = requireTrainingMedia(
    loadCommunicationLanguageChapter(),
    'symbol-board-request'
  );

  it('starts session from media config', () => {
    const bundle = beginCommChoiceSession({
      childId: 'child_sym',
      chapterId: COMMUNICATION_LANGUAGE_CHAPTER_ID,
      media,
    });

    expect(bundle.session.mediaId).toBe('symbol-board-request');
    expect(bundle.session.targetTrialCount).toBe(8);
    expect(bundle.settings.choiceCount).toBeGreaterThanOrEqual(2);
  });

  it('records trials with prompt levels', () => {
    let session = beginCommChoiceSession({
      childId: 'child_sym',
      chapterId: COMMUNICATION_LANGUAGE_CHAPTER_ID,
      media,
    }).session;

    session = startCommChoiceTrial(session);
    session = commitCommChoiceTrial(session, {
      correct: true,
      promptLevel: 'independent',
      responseTimeMs: 900,
    });

    expect(session.trials).toHaveLength(1);
    expect(session.trials[0].correct).toBe(true);
    expect(isCommChoiceSessionComplete(session)).toBe(false);
  });
});
