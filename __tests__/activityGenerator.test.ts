import {
  buildLocalActivity,
  detectToolType,
  extractExplicitItems,
  normalizeGeneratedActivity,
  sanitizeGlyph,
  toInternalToolType,
} from '../lib/activityGenerator';
import { buildTrialChoices } from '../lib/homeClassroomEngine';

describe('activity generator — skill detection', () => {
  it('reads the skill type from the goal wording', () => {
    expect(detectToolType('أن يطابق الطالب بين الحيوانات الأليفة')).toBe(
      'identical_matching'
    );
    expect(detectToolType('أن يتعرف الطفل على وسائل النقل')).toBe(
      'receptive_discrimination'
    );
    expect(detectToolType('أن يفرز الطالب الفواكه عن المواصلات')).toBe(
      'sorting_categories'
    );
    expect(detectToolType('أن يسمّي الطفل الأدوات اليومية')).toBe(
      'functional_naming'
    );
  });

  it('falls back to receptive discrimination for unclear wording', () => {
    expect(detectToolType('هدف عام للطفل في الجلسة')).toBe(
      'receptive_discrimination'
    );
  });

  it('extracts items named explicitly in the goal', () => {
    const items = extractExplicitItems('أن يطابق بين حصان، قطة، خروف');
    expect(items.map((item) => item.id).sort()).toEqual([
      'cat',
      'horse',
      'sheep',
    ]);
  });

  it('maps API activity names to internal tool types', () => {
    expect(toInternalToolType('visual-matching')).toBe('identical_matching');
    expect(toInternalToolType('receptive-id')).toBe('receptive_discrimination');
    expect(toInternalToolType('nonsense')).toBeUndefined();
  });
});

describe('activity generator — local activities', () => {
  it('builds a playable matching activity from the pet goal', () => {
    const activity = buildLocalActivity('أن يطابق الطالب بين الحيوانات الأليفة');
    expect(activity.origin).toBe('generated');
    expect(activity.toolType).toBe('identical_matching');
    expect(activity.sampleItems.length).toBeGreaterThanOrEqual(3);
    expect(activity.sampleItems.every((item) => item.imageUrl)).toBe(true);
    expect(activity.sampleItems.map((item) => item.id)).toContain('cat');
  });

  it('gives receptive goals distractors from another category', () => {
    const activity = buildLocalActivity('أن يتعرف الطفل على وسائل النقل');
    expect(activity.toolType).toBe('receptive_discrimination');
    expect(activity.sampleItems.map((item) => item.id)).toContain('car');
    expect(activity.distractors?.length).toBeGreaterThan(0);
    const targetIds = activity.sampleItems.map((item) => item.id);
    expect(
      activity.distractors?.some((item) => targetIds.includes(item.id))
    ).toBe(false);
  });

  it('builds exactly two sorting bins that cover every item', () => {
    const activity = buildLocalActivity('أن يفرز الطالب الفواكه عن وسائل النقل');
    expect(activity.sortingBins).toHaveLength(2);
    const covered = (activity.sortingBins || []).flatMap((bin) => bin.itemIds);
    expect(activity.sampleItems.every((item) => covered.includes(item.id))).toBe(
      true
    );
  });

  it('keeps parent coaching steps in both languages', () => {
    const activity = buildLocalActivity('أن يتعرف الطفل على وسائل النقل');
    const coach = activity.coachInstructions;
    expect(coach.parentVerbalCueAr).toContain('{item}');
    expect(coach.parentVerbalCueEn).toContain('{item}');
    expect(coach.setupEn.length).toBeGreaterThan(10);
    expect(coach.supportGuidanceEn.length).toBeGreaterThan(10);
  });

  it('stays playable through a full five-trial session', () => {
    const activity = buildLocalActivity('أن يسمّي الطفل الأدوات اليومية');
    for (let index = 0; index < 5; index += 1) {
      const { target, choices } = buildTrialChoices(activity, index);
      expect(target).toBeDefined();
      expect(choices).toContain(target);
    }
  });
});

describe('activity generator — normalising AI output', () => {
  const goalText = 'أن يتعرف الطفل على الحيوانات الأليفة';

  it('accepts a well-formed payload', () => {
    const activity = normalizeGeneratedActivity(
      {
        activityType: 'receptive-id',
        titleAr: 'التعرف على الحيوانات الأليفة',
        titleEn: 'Identifying pets',
        items: [
          { nameAr: 'قطة', nameEn: 'Cat', emoji: '🐱' },
          { nameAr: 'كلب', nameEn: 'Dog', emoji: '🐶' },
          { nameAr: 'أرنب', nameEn: 'Rabbit', emoji: '🐰' },
        ],
        coach: { setupAr: 'اجلسي مقابل الطفل على الطاولة بهدوء.' },
      },
      goalText
    );

    expect(activity.toolType).toBe('receptive_discrimination');
    expect(activity.titleEn).toBe('Identifying pets');
    expect(activity.sampleItems).toHaveLength(3);
    expect(activity.coachInstructions.setupAr).toContain('اجلسي');
    // الخطوات الناقصة تُسدّ من القوالب حتى لا يبقى ولي الأمر بلا نص
    expect(activity.coachInstructions.parentVerbalCueAr).toContain('{item}');
  });

  it('replaces unusable icons with a matching emoji', () => {
    const activity = normalizeGeneratedActivity(
      {
        activityType: 'receptive-id',
        items: [
          { nameAr: 'قطة', nameEn: 'Cat', emoji: 'https://example.com/cat.png' },
          { nameAr: 'كلب', nameEn: 'Dog', emoji: 'dog' },
          { nameAr: 'مسطرة', nameEn: 'Ruler', emoji: '' },
        ],
      },
      goalText
    );

    expect(activity.sampleItems[0].imageUrl).toBe('🐱');
    expect(activity.sampleItems[1].imageUrl).toBe('🐶');
    expect(activity.sampleItems[2].imageUrl).toBeTruthy();
    expect(activity.sampleItems[2].imageUrl).not.toContain('http');
  });

  it('falls back to a local activity when items are missing', () => {
    const activity = normalizeGeneratedActivity(
      { activityType: 'receptive-id', items: [] },
      goalText
    );
    const local = buildLocalActivity(goalText);
    expect(activity.sampleItems).toEqual(local.sampleItems);
  });

  it('rejects sorting bins that leave items unsorted', () => {
    const activity = normalizeGeneratedActivity(
      {
        activityType: 'sorting',
        items: [
          { nameAr: 'تفاحة', nameEn: 'Apple', emoji: '🍎' },
          { nameAr: 'سيارة', nameEn: 'Car', emoji: '🚗' },
        ],
        bins: [
          {
            labelAr: 'سلة الطعام',
            labelEn: 'Food basket',
            emoji: '🧺',
            itemNamesAr: ['تفاحة'],
          },
        ],
      },
      'أن يفرز الطالب الفواكه عن وسائل النقل'
    );

    expect(activity.sortingBins).toHaveLength(2);
    const covered = (activity.sortingBins || []).flatMap((bin) => bin.itemIds);
    expect(activity.sampleItems.every((item) => covered.includes(item.id))).toBe(
      true
    );
  });

  it('keeps the teacher goal text on the generated activity', () => {
    const activity = normalizeGeneratedActivity({}, goalText, 'tg_123');
    expect(activity.sourceGoalText).toBe(goalText);
    expect(activity.iepGoalId).toBe('tg_123');
    expect(activity.titleAr).toBe(goalText);
  });
});

describe('glyph sanitising', () => {
  it('keeps single emoji and rejects text or links', () => {
    expect(sanitizeGlyph('🐴')).toBe('🐴');
    expect(sanitizeGlyph('✈️')).toBe('✈️');
    expect(sanitizeGlyph('horse')).toBeUndefined();
    expect(sanitizeGlyph('/images/horse.png')).toBeUndefined();
    expect(sanitizeGlyph('')).toBeUndefined();
    expect(sanitizeGlyph(null)).toBeUndefined();
  });
});
