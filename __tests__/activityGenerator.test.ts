import {
  buildLocalActivity,
  detectToolType,
  extractExplicitItems,
  isPhysicalMotorGoal,
  isPhysicalObservationActivity,
  normalizeGeneratedActivity,
  PHYSICAL_OBSERVATION_MEDIA_ID,
  sanitizeGlyph,
  toInternalToolType,
  trainingMediaForGoal,
} from '../lib/activityGenerator';
import { parseCustomActivities } from '../lib/childRoom/customActivityStore';
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

describe('physical / motor goals route to live observation, never choice cards', () => {
  const beads = 'أن يلضم الطفل 5 خرزات في خيط';
  const balls = 'أن ينقل الطفل الكرات من سلة إلى أخرى';

  it('detects fine and gross motor goals by wording or developmental domain', () => {
    expect(isPhysicalMotorGoal(beads)).toBe(true);
    expect(isPhysicalMotorGoal('لضم الخرز')).toBe(true);
    expect(isPhysicalMotorGoal(balls)).toBe(true);
    expect(isPhysicalMotorGoal('نقل الكرات')).toBe(true);
    expect(isPhysicalMotorGoal('The child strings 5 beads')).toBe(true);
    expect(isPhysicalMotorGoal('هدف عام للطفل', 'gross_motor')).toBe(true);
    expect(isPhysicalMotorGoal('هدف عام للطفل', 'fine_motor')).toBe(true);
  });

  it('does not misread visual goals as motor on partial-word matches', () => {
    expect(isPhysicalMotorGoal('أن يتعرف الطفل على وسائل النقل')).toBe(false);
    expect(isPhysicalMotorGoal('تنمية الذاكرة البصرية')).toBe(false);
    expect(isPhysicalMotorGoal('أن يطابق اللون الأزرق')).toBe(false);
    expect(isPhysicalMotorGoal('أن يستمع الطفل إلى قصة')).toBe(false);
    expect(isPhysicalMotorGoal('أن يطابق الطالب بين الحيوانات الأليفة', 'receptive_language')).toBe(false);
  });

  it.each([beads, balls, 'لضم الخرز', 'نقل الكرات'])('builds a card-free tracker for «%s»', (text) => {
    const activity = buildLocalActivity(text, 'iep_1');
    expect(activity.executionMode).toBe('physical_observation');
    expect(isPhysicalObservationActivity(activity)).toBe(true);
    expect(activity.iepGoalId).toBe('iep_1');
    expect(activity.distractors).toBeUndefined();
    expect(activity.sortingBins).toBeUndefined();
    expect(activity.sampleItems).toHaveLength(1);
    expect(activity.sampleItems.map((item) => item.id)).not.toContain('bus');
    expect(buildTrialChoices(activity, 0).choices).toHaveLength(1);
  });

  it('routes by developmental domain even when the text reads like a vocabulary goal', () => {
    const activity = buildLocalActivity('أن يتعرف الطفل على وسائل النقل', undefined, {
      developmentalDomain: 'fine_motor',
    });
    expect(activity.executionMode).toBe('physical_observation');
  });

  it('ignores an AI payload that tries to turn a motor goal into picture cards', () => {
    const activity = normalizeGeneratedActivity(
      {
        activityType: 'receptive-id',
        items: [
          { nameAr: 'حافلة', nameEn: 'Bus', emoji: '🚌' },
          { nameAr: 'سمكة', nameEn: 'Fish', emoji: '🐟' },
          { nameAr: 'قطة', nameEn: 'Cat', emoji: '🐱' },
        ],
      },
      balls
    );
    expect(activity.executionMode).toBe('physical_observation');
    expect(activity.sampleItems).toHaveLength(1);
  });

  it('never assigns a digital choice game as the room media', () => {
    expect(trainingMediaForGoal(beads)).toBe(PHYSICAL_OBSERVATION_MEDIA_ID);
    expect(trainingMediaForGoal(balls)).toBe(PHYSICAL_OBSERVATION_MEDIA_ID);
    expect(trainingMediaForGoal('أن يتعرف الطفل على وسائل النقل')).toBe('find-the-target');
  });

  it('keeps digital goals on the interactive card path', () => {
    const activity = buildLocalActivity('أن يتعرف الطفل على وسائل النقل');
    expect(activity.executionMode).toBeUndefined();
    expect(isPhysicalObservationActivity(activity)).toBe(false);
  });

  it('rebuilds legacy stored motor activities that were saved as picture cards', () => {
    const legacyCards = buildLocalActivity('أن يتعرف الطفل على وسائل النقل');
    const [row] = parseCustomActivities(
      JSON.stringify({
        activities: [
          { id: 'old', childId: 'c', goalText: balls, mediaId: 'find-the-target', activity: legacyCards },
        ],
      })
    );
    expect(row.activity.executionMode).toBe('physical_observation');
    expect(row.mediaId).toBe(PHYSICAL_OBSERVATION_MEDIA_ID);
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
