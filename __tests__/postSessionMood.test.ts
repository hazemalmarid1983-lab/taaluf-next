import {
  isPostSessionMood,
  POST_SESSION_MOODS,
  postSessionMoodZone,
} from '../lib/training/postSessionMood';

describe('post-session mood', () => {
  it('offers excited, calm, tired, and anxious before the report is stored', () => {
    expect(POST_SESSION_MOODS.map((mood) => mood.labelAr)).toEqual([
      'متحمس',
      'هادئ',
      'متعب',
      'قلق',
    ]);
    expect(isPostSessionMood('excited')).toBe(true);
    expect(isPostSessionMood('ready')).toBe(false);
    expect(postSessionMoodZone('tired')).toBe('blue');
    expect(postSessionMoodZone('anxious')).toBe('yellow');
    expect(postSessionMoodZone('calm')).toBe('green');
  });
});
