import { loadCommunicationLanguageChapter } from '../lib/training/loadChapter';
import { requireTrainingMedia, resolveMediaRuntimeConfig } from '../lib/training/engine';
import {
  buildCommTrialSpec,
  resolveCommRuntimeSettings,
} from '../lib/training/communicationChoiceEngine';

describe('communicationChoiceEngine — stable trial specs', () => {
  const media = requireTrainingMedia(
    loadCommunicationLanguageChapter(),
    'tap-to-request'
  );
  const settings = resolveCommRuntimeSettings(resolveMediaRuntimeConfig(media));

  it('buildCommTrialSpec is deterministic for the same trialNumber', () => {
    const a = buildCommTrialSpec(settings, 3);
    const b = buildCommTrialSpec(settings, 3);
    expect(a.choices.map((c) => c.id)).toEqual(b.choices.map((c) => c.id));
    expect(a.target.id).toBe(b.target.id);
  });

  it('buildCommTrialSpec can differ across trial numbers', () => {
    const a = buildCommTrialSpec(settings, 1);
    const b = buildCommTrialSpec(settings, 2);
    expect(a.target.id).not.toBe(b.target.id);
  });
});
