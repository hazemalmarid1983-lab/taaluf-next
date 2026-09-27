import {
  PARENT_HOME_PATH,
  PARENT_REGISTER_CHILD_PATH,
  parentStageRedirect,
  parseParentStage,
} from '../lib/parentRouteGuard';

describe('parent route guard', () => {
  it('does not restrict when the stage is unknown', () => {
    expect(parseParentStage(undefined)).toBeNull();
    expect(parseParentStage('tampered')).toBeNull();
    expect(parentStageRedirect(null, '/dashboard/goals')).toBeNull();
    expect(parentStageRedirect(null, '/dashboard/community')).toBeNull();
  });

  it.each([
    '/dashboard/screening',
    '/dashboard/goals',
    '/dashboard/child-room',
    '/dashboard/training/attention-focus/follow-star',
    '/dashboard/messages',
    '/parent/assessment',
    '/parent/booking/pay',
    '/onboarding/teacher-choice',
  ])('sends a parent without a registered child from %s to registration', (path) => {
    expect(parentStageRedirect('no_child', path)).toBe(PARENT_REGISTER_CHILD_PATH);
  });

  it.each(['/parent', '/parent/register-child', '/dashboard/community', '/consent'])(
    'lets a parent without a child reach %s',
    (path) => {
      expect(parentStageRedirect('no_child', path)).toBeNull();
    }
  );

  it.each(['/dashboard/community', '/dashboard/community/thread', '/parent/community'])(
    'hides %s from a parent with a registered child',
    (path) => {
      expect(parentStageRedirect('has_child', path)).toBe(PARENT_HOME_PATH);
    }
  );

  it.each(['/parent', '/dashboard/goals', '/dashboard/messages', '/dashboard/child-room', '/dashboard/screening'])(
    'lets a parent with a child reach %s',
    (path) => {
      expect(parentStageRedirect('has_child', path)).toBeNull();
    }
  );

  it('does not match look-alike prefixes', () => {
    expect(parentStageRedirect('no_child', '/dashboard/screening-learning')).toBeNull();
    expect(parentStageRedirect('has_child', '/dashboard/communityx')).toBeNull();
  });
});
