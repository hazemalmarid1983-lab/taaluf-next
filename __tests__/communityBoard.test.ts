import { classifyCommunityLink, dueAwarenessPosts } from '../lib/community/awarenessSchedule';
import {
  addComment,
  addDiscussion,
  addLecture,
  isCommunityStaff,
  parseCommunityFeed,
  withDueAwareness,
} from '../lib/community/feedStore';

describe('community feed', () => {
  test('publishes the latest Sunday and Wednesday once', () => {
    const now = new Date('2026-09-24T08:00:00.000Z');
    const due = dueAwarenessPosts(now, new Set());
    expect(due.map((item) => item.id)).toEqual([
      'awareness_2026-09-23',
      'awareness_2026-09-20',
    ]);
    expect(dueAwarenessPosts(now, new Set(due.map((item) => item.id)))).toEqual([]);
    const merged = withDueAwareness([], now);
    expect(merged.added).toHaveLength(2);
    expect(withDueAwareness(merged.posts, now).added).toHaveLength(0);
  });

  test('accepts zoom and youtube links only', () => {
    expect(classifyCommunityLink('https://us02web.zoom.us/j/123').ok).toBe(true);
    expect(classifyCommunityLink('https://youtu.be/abc123').ok).toBe(true);
    expect(classifyCommunityLink('http://youtube.com/watch?v=1').ok).toBe(false);
    expect(classifyCommunityLink('https://example.com/watch').ok).toBe(false);
  });

  test('staff can lecture and comment while parents discuss', () => {
    expect(isCommunityStaff('specialist')).toBe(true);
    expect(isCommunityStaff('parent')).toBe(false);
    const discussion = addDiscussion(
      [],
      { id: 'p1', name: 'أم', role: 'parent' },
      'سؤال عن الروتين',
      'كيف أبدأ بصورة واحدة؟'
    );
    expect(discussion.ok).toBe(true);
    if (!discussion.ok) return;
    const lecture = addLecture(
      discussion.posts,
      { id: 's1', name: 'أخصائي', role: 'specialist' },
      {
        title: 'لقاء الأحد',
        body: 'مراجعة عامة للروتين المنزلي.',
        link: { kind: 'youtube', url: 'https://youtu.be/abc123' },
      }
    );
    expect(lecture.ok).toBe(true);
    if (!lecture.ok) return;
    const commented = addComment(
      lecture.posts,
      discussion.post.id,
      { id: 's1', name: 'أخصائي', role: 'specialist' },
      'ابدئي بصورة واحدة مألوفة.'
    );
    expect(commented.ok).toBe(true);
    if (!commented.ok) return;
    const stored = parseCommunityFeed(JSON.stringify({ posts: commented.posts }));
    const parentPost = stored.find((post) => post.id === discussion.post.id);
    expect(parentPost?.comments[0]?.staff).toBe(true);
    expect(JSON.stringify(stored)).not.toContain('password');
  });
});
