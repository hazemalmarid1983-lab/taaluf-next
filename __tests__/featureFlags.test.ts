import {
  isLearningDifficultiesEnabled,
  isLearningDifficultiesRoute,
  LEARNING_DIFFICULTIES_ENABLED,
} from '../lib/featureFlags';
import { parentScreeningEntryHref } from '../lib/parentJourney';

describe('learning difficulties feature flag', () => {
  it('is disabled by default in test env', () => {
    expect(LEARNING_DIFFICULTIES_ENABLED).toBe(false);
    expect(isLearningDifficultiesEnabled()).toBe(false);
  });

  it('routes academic paths correctly', () => {
    expect(isLearningDifficultiesRoute('/dashboard/pathways')).toBe(true);
    expect(isLearningDifficultiesRoute('/dashboard/screening-learning')).toBe(true);
    expect(isLearningDifficultiesRoute('/dashboard/screening')).toBe(false);
  });

  it('uses developmental screening entry when disabled', () => {
    expect(parentScreeningEntryHref()).toBe('/dashboard/screening');
  });
});
