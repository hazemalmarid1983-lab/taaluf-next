import {
  resolveTrainingBackNav,
  TRAINING_BACK_TO_CONSULTANT_LABEL,
  TRAINING_BACK_TO_TRAINING_LABEL,
  TRAINING_DASHBOARD_PATH,
} from '../lib/training/trainingNavLinks';

describe('trainingNavLinks', () => {
  it('training home links to consultant room', () => {
    expect(resolveTrainingBackNav(TRAINING_DASHBOARD_PATH)).toEqual({
      href: '/dashboard/consultant',
      label: TRAINING_BACK_TO_CONSULTANT_LABEL,
    });
  });

  it('plan builder links to training home', () => {
    expect(resolveTrainingBackNav('/dashboard/training/plans/new')).toEqual({
      href: TRAINING_DASHBOARD_PATH,
      label: TRAINING_BACK_TO_TRAINING_LABEL,
    });
  });

  it('session detail links to training home', () => {
    expect(resolveTrainingBackNav('/dashboard/training/sessions/abc123')).toEqual(
      {
        href: TRAINING_DASHBOARD_PATH,
        label: TRAINING_BACK_TO_TRAINING_LABEL,
      }
    );
  });

  it('activity routes link to training home', () => {
    expect(
      resolveTrainingBackNav(
        '/dashboard/training/communication-language/tap-to-request'
      )
    ).toEqual({
      href: TRAINING_DASHBOARD_PATH,
      label: TRAINING_BACK_TO_TRAINING_LABEL,
    });
    expect(
      resolveTrainingBackNav('/dashboard/training/attention-focus/follow-star')
    ).toEqual({
      href: TRAINING_DASHBOARD_PATH,
      label: TRAINING_BACK_TO_TRAINING_LABEL,
    });
  });

  it('normalizes trailing slash on training home', () => {
    expect(resolveTrainingBackNav('/dashboard/training/')).toEqual({
      href: '/dashboard/consultant',
      label: TRAINING_BACK_TO_CONSULTANT_LABEL,
    });
  });
});
