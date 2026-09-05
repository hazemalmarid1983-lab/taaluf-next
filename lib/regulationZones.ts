/**
 * مناطق التنظيم الانفعالي (Zones of Regulation) مبسّطة لأربع مناطق،
 * مع بيانات تمرين التنفس المتناغم وتحليل تحوّل حالة الطفل بين بداية الجلسة ونهايتها.
 *
 * منفصلة عن المكوّن لتبقى قابلة للاختبار ولتقرأها شاشة التقرير دون تحميل الواجهة.
 */

export type RegulationZoneId = 'blue' | 'green' | 'yellow' | 'red';

export type RegulationZone = {
  id: RegulationZoneId;
  emoji: string;
  labelAr: string;
  labelEn: string;
  /** ما يشعر به الطفل بلغته هو */
  stateAr: string;
  stateEn: string;
  /** ما تفعله الأم قبل بدء التدريب */
  coachAr: string;
  coachEn: string;
  tone: string;
  activeTone: string;
  /** هل يحتاج تهدئة قبل بدء المحاولات */
  needsCalming: boolean;
};

/**
 * الترتيب أزرق ← أخضر ← أصفر ← أحمر يوافق تدرّج الشدة المألوف للأهل،
 * وقيمة severity هي ما يقيس التحسّن لا ترتيب العرض.
 */
export const REGULATION_ZONES: RegulationZone[] = [
  {
    id: 'blue',
    emoji: '😴',
    labelAr: 'متعب',
    labelEn: 'Tired',
    stateAr: 'طاقتي منخفضة وأشعر بالنعاس أو الملل.',
    stateEn: 'My energy is low — I feel sleepy or bored.',
    coachAr:
      'ابدئي بحركة خفيفة أو مشروب بارد، واجعلي الجلسة قصيرة بثلاث محاولات فقط.',
    coachEn:
      'Start with light movement or a cool drink, and keep the session short — three trials only.',
    tone: 'border-sky-200 bg-sky-50 text-sky-900',
    activeTone: 'border-sky-500 bg-sky-100 ring-4 ring-sky-200',
    needsCalming: true,
  },
  {
    id: 'green',
    emoji: '🙂',
    labelAr: 'جاهز ومستقر',
    labelEn: 'Ready & settled',
    stateAr: 'أنا هادئ ومنتبه ومستعد للتعلم.',
    stateEn: 'I am calm, focused and ready to learn.',
    coachAr: 'هذه أفضل لحظة للتدريب — ابدئي المحاولات الآن مباشرة.',
    coachEn: 'This is the best moment to train — start the trials right away.',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    activeTone: 'border-emerald-500 bg-emerald-100 ring-4 ring-emerald-200',
    needsCalming: false,
  },
  {
    id: 'yellow',
    emoji: '😕',
    labelAr: 'مشتت أو متوتر',
    labelEn: 'Distracted or tense',
    stateAr: 'أشعر بالقلق أو لا أستطيع تثبيت انتباهي.',
    stateEn: 'I feel worried, or I cannot hold my attention still.',
    coachAr:
      'شغّلي تمرين التنفس دورتين قبل البدء، وقلّلي المشتتات حول الطاولة.',
    coachEn:
      'Run two breathing cycles before starting, and clear distractions around the table.',
    tone: 'border-amber-200 bg-amber-50 text-amber-900',
    activeTone: 'border-amber-500 bg-amber-100 ring-4 ring-amber-200',
    needsCalming: true,
  },
  {
    id: 'red',
    emoji: '😠',
    labelAr: 'غاضب',
    labelEn: 'Angry',
    stateAr: 'جسمي متوتر وأحتاج أن أهدأ قبل أي شيء.',
    stateEn: 'My body is tense — I need to calm down before anything else.',
    coachAr:
      'أجّلي التدريب الآن. استخدمي الفقاعات الحسية والتنفس، وابدئي حين يعود للأخضر.',
    coachEn:
      'Postpone the training. Use the sensory bubbles and breathing, then start once they return to green.',
    tone: 'border-rose-200 bg-rose-50 text-rose-900',
    activeTone: 'border-rose-500 bg-rose-100 ring-4 ring-rose-200',
    needsCalming: true,
  },
];

/** الأخضر هو حالة الجهوزية، وكل ابتعاد عنه شدّة أعلى تحتاج تدخلاً */
const ZONE_SEVERITY: Record<RegulationZoneId, number> = {
  green: 0,
  blue: 1,
  yellow: 2,
  red: 3,
};

export function zoneById(id?: RegulationZoneId | null) {
  if (!id) return undefined;
  return REGULATION_ZONES.find((zone) => zone.id === id);
}

export function zoneNeedsCalming(id?: RegulationZoneId | null) {
  return zoneById(id)?.needsCalming ?? false;
}

// ───────────────────────── تمرين التنفس المتناغم ─────────────────────────

export type BreathPhaseId = 'inhale' | 'hold' | 'exhale';

export type BreathPhase = {
  id: BreathPhaseId;
  seconds: number;
  labelAr: string;
  labelEn: string;
  cueAr: string;
  cueEn: string;
  /** حجم الدائرة عند نهاية الطور، نسبةً لأكبر حجم */
  scale: number;
};

/**
 * زفير أطول من الشهيق لأنه ما يُنشّط الجهاز نظير الودي فيهدأ الجسم فعلاً،
 * والحبس قصير حتى لا يتحول التمرين إلى ضغط على الطفل.
 */
export const BREATHING_PHASES: BreathPhase[] = [
  {
    id: 'inhale',
    seconds: 4,
    labelAr: 'شهيق',
    labelEn: 'Breathe in',
    cueAr: 'خذ نَفَس عميق',
    cueEn: 'Take a deep breath',
    scale: 1,
  },
  {
    id: 'hold',
    seconds: 3,
    labelAr: 'ثبات',
    labelEn: 'Hold',
    cueAr: 'احبس الهواء ثواني',
    cueEn: 'Hold your breath for a moment',
    scale: 1,
  },
  {
    id: 'exhale',
    seconds: 6,
    labelAr: 'زفير',
    labelEn: 'Breathe out',
    cueAr: 'أخرج الهواء بهدوء',
    cueEn: 'Let the breath out gently',
    scale: 0.55,
  },
];

/** عبارة إتمام التمرين — فصحى مبسطة بلا تنوين ثقيل لقراءة صوتية طبيعية */
export const BREATHING_COMPLETE_CUE = {
  cueAr: 'ممتاز، جسمك الآن هادئ ومستعد',
  cueEn: 'Excellent — your body is calm and ready now',
};

/** حجم الدائرة في السكون — أصغر من ذروة الشهيق فيُقرأ التمدد بوضوح */
export const BREATH_RESTING_SCALE = 0.55;
export const BREATHING_CYCLES = 4;

export function breathCycleSeconds() {
  return BREATHING_PHASES.reduce((total, phase) => total + phase.seconds, 0);
}

// ───────────────────────── تحوّل الحالة بين بداية الجلسة ونهايتها ─────────────────────────

export type MoodShiftDirection = 'improved' | 'steady' | 'declined';

export type MoodShift = {
  direction: MoodShiftDirection;
  textAr: string;
  textEn: string;
};

/**
 * يقارن حالة الطفل قبل الجلسة وبعدها ليقرأها الأخصائي في التقرير.
 * يعود بـ null إن نقصت إحدى القراءتين، فلا نبني استنتاجاً على نصف بيانات.
 */
export function describeMoodShift(
  before?: RegulationZoneId | null,
  after?: RegulationZoneId | null
): MoodShift | null {
  const from = zoneById(before);
  const to = zoneById(after);
  if (!from || !to) return null;

  if (from.id === to.id) {
    return {
      direction: to.id === 'green' ? 'improved' : 'steady',
      textAr: `بقي الطفل في منطقة «${to.labelAr}» من بداية الجلسة إلى نهايتها.`,
      textEn: `The child stayed in the “${to.labelEn}” zone from start to finish.`,
    };
  }

  const improved = ZONE_SEVERITY[to.id] < ZONE_SEVERITY[from.id];
  if (improved) {
    return {
      direction: 'improved',
      textAr: `تحسّن التنظيم الانفعالي: انتقل من «${from.labelAr}» إلى «${to.labelAr}».`,
      textEn: `Regulation improved: moved from “${from.labelEn}” to “${to.labelEn}”.`,
    };
  }

  return {
    direction: 'declined',
    textAr: `تراجع التنظيم من «${from.labelAr}» إلى «${to.labelAr}» — قصّري مدة الجلسة القادمة وزيدي فترات الراحة.`,
    textEn: `Regulation declined from “${from.labelEn}” to “${to.labelEn}” — shorten the next session and add more breaks.`,
  };
}
