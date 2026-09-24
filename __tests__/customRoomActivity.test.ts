import { trainingMediaForGoal } from '../lib/activityGenerator';
import {
  addCustomActivity,
  latestCustomForChild,
  parseCustomActivities,
} from '../lib/childRoom/customActivityStore';

describe('custom child-room activities', () => {
  it('maps a written matching goal to match-me and stores it for that room', () => {
    expect(trainingMediaForGoal('أن يطابق الطفل صور الحيوانات الأليفة')).toBe(
      'match-me'
    );
    const saved = addCustomActivity([], {
      childId: 'child_a',
      goalText: 'أن يطابق الطفل صور الحيوانات الأليفة',
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.activity.mediaId).toBe('match-me');
    expect(saved.activity.activity.origin).toBe('generated');
    expect(saved.activity.activity.sampleItems.length).toBeGreaterThanOrEqual(3);
    const other = addCustomActivity(saved.activities, {
      childId: 'child_b',
      goalText: 'أن يتعرف الطفل على وسائل النقل',
    });
    expect(other.ok).toBe(true);
    if (!other.ok) return;
    const stored = parseCustomActivities(
      JSON.stringify({ activities: other.activities })
    );
    expect(latestCustomForChild(stored, 'child_a')?.goalText).toContain('يطابق');
    expect(latestCustomForChild(stored, 'child_b')?.mediaId).toBe('find-the-target');
  });
});
