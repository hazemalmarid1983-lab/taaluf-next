import {
  evaluateHomeSession,
  HOME_CLASSROOM_GOALS,
  type TrialResult,
} from '@/lib/homeClassroomEngine';
import {
  BREATHING_COMPLETE_CUE,
  BREATHING_CYCLES,
  BREATHING_PHASES,
  REGULATION_ZONES,
  breathCycleSeconds,
  describeMoodShift,
  zoneById,
  zoneNeedsCalming,
} from '@/lib/regulationZones';

describe('مناطق التنظيم الانفعالي', () => {
  it('تغطي المناطق الأربع بمعرّفات فريدة', () => {
    const ids = REGULATION_ZONES.map((zone) => zone.id);
    expect(ids).toEqual(['blue', 'green', 'yellow', 'red']);
    expect(new Set(ids).size).toBe(4);
  });

  it('تحمل كل منطقة نصوصاً عربية وإنجليزية كاملة', () => {
    REGULATION_ZONES.forEach((zone) => {
      expect(zone.labelAr.length).toBeGreaterThan(0);
      expect(zone.labelEn.length).toBeGreaterThan(0);
      expect(zone.stateAr.length).toBeGreaterThan(0);
      expect(zone.stateEn.length).toBeGreaterThan(0);
      expect(zone.coachAr.length).toBeGreaterThan(0);
      expect(zone.coachEn.length).toBeGreaterThan(0);
    });
  });

  it('الأخضر وحده لا يحتاج تهدئة قبل التدريب', () => {
    expect(zoneNeedsCalming('green')).toBe(false);
    expect(zoneNeedsCalming('blue')).toBe(true);
    expect(zoneNeedsCalming('yellow')).toBe(true);
    expect(zoneNeedsCalming('red')).toBe(true);
    expect(zoneNeedsCalming(null)).toBe(false);
  });

  it('zoneById يعود بغير معرّف عند غياب القيمة', () => {
    expect(zoneById('red')?.emoji).toBe('😠');
    expect(zoneById(null)).toBeUndefined();
    expect(zoneById(undefined)).toBeUndefined();
  });
});

describe('تمرين التنفس المتناغم', () => {
  it('يمر بشهيق فثبات فزفير', () => {
    expect(BREATHING_PHASES.map((phase) => phase.id)).toEqual([
      'inhale',
      'hold',
      'exhale',
    ]);
  });

  it('الزفير أطول من الشهيق فيهدأ الجسم', () => {
    const inhale = BREATHING_PHASES.find((phase) => phase.id === 'inhale');
    const exhale = BREATHING_PHASES.find((phase) => phase.id === 'exhale');
    expect(exhale!.seconds).toBeGreaterThan(inhale!.seconds);
  });

  it('تتمدد الدائرة في الشهيق وتتقلص في الزفير', () => {
    const [inhale, hold, exhale] = BREATHING_PHASES;
    expect(inhale.scale).toBe(1);
    expect(hold.scale).toBe(inhale.scale);
    expect(exhale.scale).toBeLessThan(inhale.scale);
  });

  it('مدة الدورة مجموع أطوارها والتمرين لا يطول على الطفل', () => {
    expect(breathCycleSeconds()).toBe(13);
    expect(breathCycleSeconds() * BREATHING_CYCLES).toBeLessThanOrEqual(90);
  });

  it('عبارات النطق الصوتي فصحى مبسطة بلا تنوين ثقيل', () => {
    const [inhale, hold, exhale] = BREATHING_PHASES;
    expect(inhale.cueAr).toBe('خذ نَفَس عميق');
    expect(hold.cueAr).toBe('احبس الهواء ثواني');
    expect(exhale.cueAr).toBe('أخرج الهواء بهدوء');
    expect(BREATHING_COMPLETE_CUE.cueAr).toBe(
      'ممتاز، جسمك الآن هادئ ومستعد'
    );
  });
});

describe('تحوّل الحالة بين بداية الجلسة ونهايتها', () => {
  it('لا يستنتج شيئاً من قراءة ناقصة', () => {
    expect(describeMoodShift('red', null)).toBeNull();
    expect(describeMoodShift(null, 'green')).toBeNull();
    expect(describeMoodShift(null, null)).toBeNull();
  });

  it('يعد الانتقال نحو الأخضر تحسناً', () => {
    expect(describeMoodShift('red', 'green')?.direction).toBe('improved');
    expect(describeMoodShift('yellow', 'blue')?.direction).toBe('improved');
  });

  it('يعد الابتعاد عن الأخضر تراجعاً ويقترح تقصير الجلسة', () => {
    const shift = describeMoodShift('green', 'red');
    expect(shift?.direction).toBe('declined');
    expect(shift?.textAr).toContain('قصّري');
    expect(shift?.textEn).toContain('shorten');
  });

  it('البقاء في الأخضر تحسّن، والبقاء خارجه ثبات يستدعي المتابعة', () => {
    expect(describeMoodShift('green', 'green')?.direction).toBe('improved');
    expect(describeMoodShift('yellow', 'yellow')?.direction).toBe('steady');
  });

  it('يحفظ قراءتي المزاج مع بقية بيانات الجلسة', () => {
    const trials: TrialResult[] = [
      {
        trialNumber: 1,
        promptLevel: 'independent',
        timestamp: '2026-09-02T00:00:00.000Z',
      },
    ];
    const summary = evaluateHomeSession(
      'child_local',
      HOME_CLASSROOM_GOALS[0],
      trials,
      'سارة',
      { before: 'yellow', after: 'green' }
    );
    expect(summary.moodBefore).toBe('yellow');
    expect(summary.moodAfter).toBe('green');
    expect(describeMoodShift(summary.moodBefore, summary.moodAfter)?.direction).toBe(
      'improved'
    );
  });

  it('يذكر اسمي المنطقتين في نص التقرير', () => {
    const shift = describeMoodShift('red', 'green');
    expect(shift?.textAr).toContain('غاضب');
    expect(shift?.textAr).toContain('جاهز');
    expect(shift?.textEn).toContain('Angry');
    expect(shift?.textEn).toContain('Ready');
  });
});
