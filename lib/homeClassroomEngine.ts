/**
 * محرك الغرفة الصفية المنزلية المساندة.
 * يوفّر: بنك وسائل رقمية بديلة عن الأدوات الملموسة (تطابق/تمييز/تصنيف/تسمية)،
 * نصوص توجيه ولي الأمر خطوة بخطوة، وحساب الاستقلالية وفق تدرّج المساعدة (ABA/TEACCH).
 * أداة تدريب وتعميم منزلي — ليست تشخيصاً طبياً.
 */

import type { RegulationZoneId } from './regulationZones';
import {
  buildPromptFadingCue,
  compareIndependence,
  countPromptBreakdown,
  independencePercentage,
  noResponseCount,
  promptedCount,
  trialPromptSequence,
  type PromptBreakdown,
  type PromptHierarchyLevel,
  type PromptLevel,
} from './promptHierarchy';

export type { PromptHierarchyLevel, PromptLevel } from './promptHierarchy';
export {
  PROMPT_HIERARCHY_LEVELS,
  PROMPT_LEVELS,
  PROMPT_QUICK_LEVELS,
} from './promptHierarchy';

export type ToolCategory =
  | 'fruits'
  | 'food'
  | 'animals'
  | 'vehicles'
  | 'daily_objects'
  | 'colors_shapes';

export type HomeToolType =
  | 'identical_matching'
  | 'receptive_discrimination'
  | 'sorting_categories'
  | 'functional_naming';

export interface InteractiveToolItem {
  id: string;
  nameAr: string;
  nameEn: string;
  category: ToolCategory;
  /** رمز تعبيري أو مسار أيقونة/صورة يُعرض على الشاشة بديلاً عن المجسم الملموس */
  imageUrl: string;
  soundEffect?: string;
}

/** سلة فرز في أهداف التصنيف — تُحدّد العناصر التي تنتمي إليها صراحةً */
export interface SortingBin {
  id: string;
  labelAr: string;
  labelEn: string;
  emoji: string;
  itemIds: string[];
}

export interface HomeClassroomGoal {
  id: string;
  /** من بنك الوسائل الجاهز أم مولّد من هدف خطة فردية */
  origin?: 'bank' | 'generated';
  /** معرّف هدف الخطة الفردية الذي وُلّدت منه الوسيلة */
  iepGoalId?: string;
  /** نص الهدف كما كتبه المعلم — يُحفظ في تقرير الجلسة */
  sourceGoalText?: string;
  targetSkill: string;
  targetSkillEn: string;
  toolType: HomeToolType;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  /**
   * توجيه ولي الأمر بلغتي الواجهة. حقول {child} و{item} تُستبدل وقت العرض
   * باسم الطفل النشط والعنصر المستهدف في المحاولة الحالية.
   */
  coachInstructions: {
    /** تهيئة البيئة قبل بدء المحاولة */
    setupAr: string;
    setupEn: string;
    /** ما يقوله ولي الأمر نصاً للطفل */
    parentVerbalCueAr: string;
    parentVerbalCueEn: string;
    /** كيف يتدخل ولي الأمر إذا تردد الطفل */
    supportGuidanceAr: string;
    supportGuidanceEn: string;
  };
  sampleItems: InteractiveToolItem[];
  /** مشتتات إضافية توسّع مجموعة الخيارات في أهداف التمييز */
  distractors?: InteractiveToolItem[];
  sortingBins?: SortingBin[];
}

export interface TrialResult {
  trialNumber: number;
  promptLevel: PromptLevel;
  timestamp: string;
  itemId?: string;
}

export type MasteryBand = 'mastered' | 'emerging' | 'needs_support';

export interface HomeSessionSummary {
  childId: string;
  childName?: string;
  goalId: string;
  goalTitleAr: string;
  /** نص هدف الخطة الفردية إن كانت الوسيلة مولّدة منه */
  sourceGoalText?: string;
  sessionDate: string;
  totalTrials: number;
  independentCount: number;
  promptedCount: number;
  noResponseCount: number;
  masteryPercentage: number;
  band: MasteryBand;
  clinicalNoteAr: string;
  clinicalNoteEn: string;
  recommendedNextStepAr: string;
  recommendedNextStepEn: string;
  /** منطقة التنظيم الانفعالي عند بداية الجلسة */
  moodBefore?: RegulationZoneId;
  /** منطقة التنظيم الانفعالي بعد انتهاء المحاولات */
  moodAfter?: RegulationZoneId;
  /** توزيع درجات المساعدة في الجلسة */
  promptBreakdown?: PromptBreakdown;
  /** تسلسل المحاولات الخمس لرسم التطور */
  trialPromptSequence?: PromptHierarchyLevel[];
  /** فرق نسبة الاستقلالية عن الجلسة السابقة لنفس الهدف */
  independenceDelta?: number | null;
  /** توصية تلاشي المساعدة للجلسة التالية */
  promptFadingCueAr?: string;
  promptFadingCueEn?: string;
}

/** قراءتا المشاعر المرفقتان بالجلسة */
export type SessionMood = {
  before?: RegulationZoneId | null;
  after?: RegulationZoneId | null;
};

/** عدد محاولات الجلسة المنزلية القصيرة المركّزة */
export const HOME_SESSION_TARGET_TRIALS = 5;

export const HOME_SESSIONS_STORAGE_KEY = 'taaluf.homeClassroom.v1';

/** آخر جلسة محفوظة لنفس الطفل والهدف قبل تاريخ معيّن */
export function findPreviousHomeSession(
  sessions: HomeSessionSummary[],
  childId: string,
  goalId: string,
  beforeDate: string
) {
  return sessions
    .filter(
      (session) =>
        session.childId === childId &&
        session.goalId === goalId &&
        session.sessionDate < beforeDate &&
        session.totalTrials > 0
    )
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))[0];
}

// 📦 بنك أهداف التدريب المنزلي والوسائل الرقمية
export const HOME_CLASSROOM_GOALS: HomeClassroomGoal[] = [
  // 1. التطابق المتطابق (صورة إلى صورة مماثلة)
  {
    id: 'goal_match_identical_fruits',
    targetSkill: 'التطابق البصري 1:1',
    targetSkillEn: '1:1 visual matching',
    toolType: 'identical_matching',
    titleAr: 'مطابقة صور الفواكه المتطابقة',
    titleEn: 'Matching Identical Fruit Images',
    descriptionAr:
      'تدريب الطفل على مطابقة صورة التفاحة / الموزة مع نظيرتها على الشاشة.',
    descriptionEn:
      'The child matches a fruit picture to its identical pair on screen.',
    coachInstructions: {
      setupAr: 'حطي الشاشة في مستوى نظر الطفل، وشيلي أي شي مشتت من الطاولة.',
      setupEn:
        "Position the screen at the child's eye level and ensure the table is distraction-free.",
      parentVerbalCueAr:
        'قولي لـ{child} بنبرة واضحة ومباشرة: «حط {item} عند {item}» أو «طابق {item}».',
      parentVerbalCueEn:
        'Say clearly and directly: "Match the {item}" or "Put {item} on {item}."',
      supportGuidanceAr:
        'انتظري 4 ثوانٍ. إذا ما تحرك، وجّهي يده بلطف على الهدف وامدحيه فوراً لما يوصل.',
      supportGuidanceEn:
        'Wait 4 seconds. If no movement, gently guide their hand and provide immediate praise.',
    },
    sampleItems: [
      {
        id: 'apple',
        nameAr: 'تفاحة',
        nameEn: 'Apple',
        category: 'fruits',
        imageUrl: '🍎',
      },
      {
        id: 'banana',
        nameAr: 'موز',
        nameEn: 'Banana',
        category: 'fruits',
        imageUrl: '🍌',
      },
      {
        id: 'orange',
        nameAr: 'برتقال',
        nameEn: 'Orange',
        category: 'fruits',
        imageUrl: '🍊',
      },
    ],
  },

  // 2. التمييز السمعي البصري (اللغة الاستقبالية)
  {
    id: 'goal_receptive_animals',
    targetSkill: 'الاستجابة اللغوية الاستقبالية',
    targetSkillEn: 'Receptive language response',
    toolType: 'receptive_discrimination',
    titleAr: 'الإشارة إلى الحيوان المطلوب وسط مشتتات',
    titleEn: 'Receptive Animal Identification',
    descriptionAr:
      'اختيار الحيوان الصحيح عند سماع اسمه من ولي الأمر من بين 3 خيارات.',
    descriptionEn:
      'The child selects the named animal from three on-screen options.',
    coachInstructions: {
      setupAr:
        'تأكدي أن الطفل منتبه لكِ وناظر إليكِ قبل ما تعطيه الأمر، وسمّي شيئاً واحداً بس.',
      setupEn:
        'Make sure the child is attending and looking at you before you give the cue, and name only one item.',
      parentVerbalCueAr: 'قولي لـ{child} بنبرة مرحة: «وين {item}؟» أو «المس {item}».',
      parentVerbalCueEn:
        'Say cheerfully: "Where is the {item}?" or "Touch the {item}."',
      supportGuidanceAr:
        'إذا لمس شيئاً غلط، أشيري أنتِ إلى {item} وقولي: «هذا هو»، وبعدها خليه يحاول لحاله.',
      supportGuidanceEn:
        'If they touch the wrong item, point to the {item} yourself and say "This is it", then let them try again on their own.',
    },
    sampleItems: [
      {
        id: 'cat',
        nameAr: 'قطة',
        nameEn: 'Cat',
        category: 'animals',
        imageUrl: '🐱',
      },
      {
        id: 'dog',
        nameAr: 'كلب',
        nameEn: 'Dog',
        category: 'animals',
        imageUrl: '🐶',
      },
      {
        id: 'lion',
        nameAr: 'أسد',
        nameEn: 'Lion',
        category: 'animals',
        imageUrl: '🦁',
      },
    ],
    distractors: [
      {
        id: 'bird',
        nameAr: 'عصفور',
        nameEn: 'Bird',
        category: 'animals',
        imageUrl: '🐦',
      },
      {
        id: 'fish',
        nameAr: 'سمكة',
        nameEn: 'Fish',
        category: 'animals',
        imageUrl: '🐟',
      },
    ],
  },

  // 3. التصنيف والفرز في مجموعات
  {
    id: 'goal_sorting_vehicles_food',
    targetSkill: 'التصنيف المعرفي والمجموعات الضمنية',
    targetSkillEn: 'Categorisation & implicit sets',
    toolType: 'sorting_categories',
    titleAr: 'فرز الطعام والمواصلات في السلال المخصصة',
    titleEn: 'Sorting Food vs. Vehicles',
    descriptionAr:
      'وضع كل عنصر في فئته الصحيحة لتعزيز البنية المعرفية وتنظيم المفاهيم.',
    descriptionEn:
      'The child places each item in its matching basket to strengthen concept organisation.',
    coachInstructions: {
      setupAr: 'الشاشة فيها سلتين: سلة الطعام وسلة المواصلات — سمّيهما للطفل أول شي.',
      setupEn:
        'The screen shows two baskets: food and vehicles — name them for the child first.',
      parentVerbalCueAr:
        'قولي لـ{child}: «وين نحط {item}؟» وشجّعيه يحطها في السلة الصحيحة.',
      parentVerbalCueEn:
        'Say: "Where do we put the {item}?" and encourage them to place it in the correct basket.',
      supportGuidanceAr:
        'ساعديه بيدك في أول محاولة عشان يفهم الفكرة، وبعدها خلي المحاولات له لحاله.',
      supportGuidanceEn:
        'Guide their hand on the first trial to show the idea, then leave the following trials to them.',
    },
    sampleItems: [
      {
        id: 'car',
        nameAr: 'سيارة',
        nameEn: 'Car',
        category: 'vehicles',
        imageUrl: '🚗',
      },
      {
        id: 'apple',
        nameAr: 'تفاحة',
        nameEn: 'Apple',
        category: 'fruits',
        imageUrl: '🍎',
      },
      {
        id: 'bus',
        nameAr: 'حافلة',
        nameEn: 'Bus',
        category: 'vehicles',
        imageUrl: '🚌',
      },
      {
        id: 'bread',
        nameAr: 'خبز',
        nameEn: 'Bread',
        category: 'food',
        imageUrl: '🍞',
      },
    ],
    sortingBins: [
      {
        id: 'bin_food',
        labelAr: 'سلة الطعام',
        labelEn: 'Food basket',
        emoji: '🧺',
        itemIds: ['apple', 'bread'],
      },
      {
        id: 'bin_vehicles',
        labelAr: 'سلة المواصلات',
        labelEn: 'Vehicles basket',
        emoji: '🛣️',
        itemIds: ['car', 'bus'],
      },
    ],
  },

  // 4. التسمية الوظيفية (اللغة التعبيرية)
  {
    id: 'goal_functional_naming_objects',
    targetSkill: 'التسمية التعبيرية ووظيفة الأشياء',
    targetSkillEn: 'Expressive naming & object function',
    toolType: 'functional_naming',
    titleAr: 'تسمية الأدوات اليومية وذكر وظيفتها',
    titleEn: 'Naming Daily Objects & Their Function',
    descriptionAr:
      'تسمية الأداة المعروضة على الشاشة ثم ربطها بوظيفتها في الروتين اليومي.',
    descriptionEn:
      'The child names the on-screen object and links it to its daily-routine function.',
    coachInstructions: {
      setupAr:
        'اجلسي مقابل الطفل، وأشيري للشاشة بإصبع واحد عشان تثبّتي انتباهه على الأداة.',
      setupEn:
        "Sit facing the child and point at the screen with one finger to anchor their attention on the object.",
      parentVerbalCueAr:
        'أشيري إلى {item} واسألي {child}: «شو هذا؟» وبعد ما يجاوب: «شو نسوي فيه؟» وانتظري 4 ثوانٍ.',
      parentVerbalCueEn:
        'Point at the {item} and ask: "What is this?" then after the answer: "What do we do with it?" Wait 4 seconds.',
      supportGuidanceAr:
        'إذا ما سمّاها، عطيه أول مقطع من الكلمة بس، وبعدها قلّلي هذي المساعدة في المحاولات الجاية.',
      supportGuidanceEn:
        'If they do not name it, give only the first syllable of the word, then fade that help in the following trials.',
    },
    sampleItems: [
      {
        id: 'spoon',
        nameAr: 'ملعقة',
        nameEn: 'Spoon',
        category: 'daily_objects',
        imageUrl: '🥄',
      },
      {
        id: 'cup',
        nameAr: 'كوب',
        nameEn: 'Cup',
        category: 'daily_objects',
        imageUrl: '🥤',
      },
      {
        id: 'toothbrush',
        nameAr: 'فرشاة',
        nameEn: 'Toothbrush',
        category: 'daily_objects',
        imageUrl: '🪥',
      },
      {
        id: 'shoe',
        nameAr: 'حذاء',
        nameEn: 'Shoe',
        category: 'daily_objects',
        imageUrl: '👟',
      },
    ],
  },
];

export function findHomeGoal(goalId: string): HomeClassroomGoal | undefined {
  return HOME_CLASSROOM_GOALS.find((goal) => goal.id === goalId);
}

export type CoachLang = 'ar' | 'en';

/** يعرّف الاسم بأداة التعريف حتى يُقرأ الأمر اللفظي طبيعياً: تفاحة ← التفاحة */
export function withDefiniteArticle(nameAr: string) {
  return nameAr.startsWith('ال') ? nameAr : `ال${nameAr}`;
}

/**
 * يجهّز خطوات التوجيه الثلاث بلغة الواجهة، مع إدراج اسم الطفل النشط
 * والعنصر المستهدف في المحاولة الحالية.
 */
export function resolveCoachInstructions(
  goal: HomeClassroomGoal,
  lang: CoachLang,
  vars: { childName?: string | null; item?: InteractiveToolItem }
) {
  const isAr = lang === 'ar';
  const c = goal.coachInstructions;
  const childName = vars.childName?.trim() || (isAr ? 'طفلك' : 'your child');
  const itemName = vars.item
    ? isAr
      ? withDefiniteArticle(vars.item.nameAr)
      : vars.item.nameEn.toLowerCase()
    : isAr
      ? 'العنصر'
      : 'item';

  const fill = (template: string) =>
    template.replaceAll('{child}', childName).replaceAll('{item}', itemName);

  return {
    setup: isAr ? c.setupAr : c.setupEn,
    verbalCue: fill(isAr ? c.parentVerbalCueAr : c.parentVerbalCueEn),
    support: fill(isAr ? c.supportGuidanceAr : c.supportGuidanceEn),
  };
}

/**
 * يستخرج العبارة النموذجية التي يقولها ولي الأمر للطفل من نص التوجيه،
 * فزر النطق يجب أن يسمع «حط الموز عند الموز» أو "Match the banana"
 * لا التعليمات الموجّهة لولي الأمر نفسه.
 */
export function extractSpokenCue(coachText: string) {
  const quoted = coachText.match(/«[^»]+»|"[^"]+"|“[^”]+”/g);
  if (!quoted?.length) return coachText;

  return quoted.reduce((spoken, raw) => {
    const part = raw.slice(1, -1).trim();
    if (!part) return spoken;
    if (!spoken) return part;
    // لا نضيف نقطة إذا انتهى المقطع السابق بعلامة ترقيم أصلاً
    return `${spoken}${/[.!?؟]$/.test(spoken) ? ' ' : '. '}${part}`;
  }, '');
}

/** ما يُنطق عند وضع العنصر في السلة الصحيحة — يسمّي الفئة للطفل */
export function sortingSpokenFeedback(
  item: InteractiveToolItem,
  bin: SortingBin,
  lang: CoachLang
) {
  return lang === 'ar'
    ? `${withDefiniteArticle(item.nameAr)} في ${bin.labelAr}`
    : `${item.nameEn} goes in the ${bin.labelEn.toLowerCase()}`;
}

/** السلة التي ينتمي إليها العنصر في أهداف الفرز */
export function binIdForItem(goal: HomeClassroomGoal, itemId: string) {
  return goal.sortingBins?.find((bin) => bin.itemIds.includes(itemId))?.id;
}

/**
 * مجموعة الخيارات المعروضة في محاولة واحدة.
 * الترتيب مُشتق من رقم المحاولة (بدون عشوائية) لتجنّب اختلاف العرض بين
 * الخادم والمتصفح وتغيّر البطاقات أثناء نفس المحاولة.
 */
export function buildTrialChoices(
  goal: HomeClassroomGoal,
  trialIndex: number
): { target: InteractiveToolItem; choices: InteractiveToolItem[] } {
  const pool = [...goal.sampleItems, ...(goal.distractors || [])];
  const target = goal.sampleItems[trialIndex % goal.sampleItems.length];
  const others = pool.filter((item) => item.id !== target.id);
  const picked: InteractiveToolItem[] = [];
  if (others.length > 0) {
    picked.push(others[trialIndex % others.length]);
  }
  if (others.length > 1) {
    picked.push(others[(trialIndex + 1) % others.length]);
  }

  const choices = [target, ...picked];
  // تدوير موضع الهدف حتى لا يعتاد الطفل على مكان ثابت
  const offset = trialIndex % choices.length;
  return {
    target,
    choices: [...choices.slice(offset), ...choices.slice(0, offset)],
  };
}

/**
 * 🧮 خوارزمية تحليل جلسة التدريب المنزلي.
 * يقبل الهدف ككائن (للوسائل المولّدة) أو كمعرّف من البنك.
 */
export function evaluateHomeSession(
  childId: string,
  goal: HomeClassroomGoal | string,
  trials: TrialResult[],
  childName?: string,
  mood?: SessionMood
): HomeSessionSummary {
  const resolved = typeof goal === 'string' ? findHomeGoal(goal) : goal;
  const goalId = typeof goal === 'string' ? goal : goal.id;
  const base = {
    childId,
    childName,
    goalId,
    goalTitleAr: resolved?.titleAr || goalId,
    sourceGoalText: resolved?.sourceGoalText,
    sessionDate: new Date().toISOString(),
    moodBefore: mood?.before || undefined,
    moodAfter: mood?.after || undefined,
  };

  const total = trials.length;
  if (total === 0) {
    return {
      ...base,
      totalTrials: 0,
      independentCount: 0,
      promptedCount: 0,
      noResponseCount: 0,
      masteryPercentage: 0,
      band: 'needs_support',
      clinicalNoteAr: 'لم يتم تسجيل أي محاولات في هذه الجلسة.',
      clinicalNoteEn: 'No trials were recorded in this session.',
      recommendedNextStepAr:
        'إعادة جدولة الجلسة في وقت يكون فيه الطفل أكثر هدوءاً واستعداداً.',
      recommendedNextStepEn:
        'Reschedule the session when the child is calmer and more available.',
    };
  }

  const independent = trials.filter(
    (t) => t.promptLevel === 'independent'
  ).length;
  const prompted = promptedCount(trials);
  const noResponse = noResponseCount(trials);
  const masteryPercentage = independencePercentage(trials);
  const promptBreakdown = countPromptBreakdown(trials);
  const trialSequence = trialPromptSequence(trials);

  const previous = findPreviousHomeSession(
    loadHomeSessions(),
    childId,
    goalId,
    base.sessionDate
  );
  const independenceCompare = compareIndependence(
    trials,
    previous?.trialPromptSequence?.map((level) => ({ promptLevel: level })) ||
      null
  );
  const fadingCue = buildPromptFadingCue(
    promptBreakdown,
    independenceCompare
  );

  let band: MasteryBand = 'needs_support';
  let clinicalNoteAr = '';
  let clinicalNoteEn = '';
  let recommendedNextStepAr = '';
  let recommendedNextStepEn = '';

  if (masteryPercentage >= 80) {
    band = 'mastered';
    clinicalNoteAr = `أظهر الطفل استقلالية عالية وإتقاناً ممتازاً للهدف بنسبة ${masteryPercentage}%.`;
    clinicalNoteEn = `The child showed high independence and mastery of the goal at ${masteryPercentage}%.`;
    recommendedNextStepAr =
      'تعميم المهارة على بيئات ومواد جديدة، ثم الانتقال للهدف التالي في الخطة الفردية.';
    recommendedNextStepEn =
      'Generalise the skill to new settings and materials, then move to the next IEP goal.';
  } else if (masteryPercentage >= 50) {
    band = 'emerging';
    clinicalNoteAr = `استجابة جيدة مع الاعتماد على المساعدة اللفظية/الإشارية — نسبة الإتقان المستقل ${masteryPercentage}%.`;
    clinicalNoteEn = `Good responding with reliance on verbal/gestural prompts — independent mastery ${masteryPercentage}%.`;
    recommendedNextStepAr =
      'مواصلة التدريب مع سحب المساعدة تدريجياً (Prompt Fading) للوصول إلى 80% استقلالية.';
    recommendedNextStepEn =
      'Continue training with systematic prompt fading to reach 80% independence.';
  } else {
    clinicalNoteAr = `الطفل لا يزال بحاجة لدعم ومساعدة جسدية متكررة — نسبة الاستقلالية ${masteryPercentage}%.`;
    clinicalNoteEn = `The child still needs frequent physical support — independence at ${masteryPercentage}%.`;
    recommendedNextStepAr =
      'تقليل المشتتات، واستخدام معزز تفضيلي فوري ومحبب جداً للطفل بعد كل استجابة صحيحة.';
    recommendedNextStepEn =
      'Reduce distractions and deliver an immediate, highly preferred reinforcer after each correct response.';
  }

  return {
    ...base,
    totalTrials: total,
    independentCount: independent,
    promptedCount: prompted,
    noResponseCount: noResponse,
    masteryPercentage,
    band,
    clinicalNoteAr,
    clinicalNoteEn,
    recommendedNextStepAr,
    recommendedNextStepEn,
    promptBreakdown,
    trialPromptSequence: trialSequence,
    independenceDelta: independenceCompare.delta,
    promptFadingCueAr: fadingCue.cueAr,
    promptFadingCueEn: fadingCue.cueEn,
  };
}

export function loadHomeSessions(): HomeSessionSummary[] {
  try {
    const raw = localStorage.getItem(HOME_SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HomeSessionSummary[]) : [];
  } catch {
    return [];
  }
}

/**
 * يحفظ الجلسة في السجل التراكمي ليقرأها الأخصائي في ملف الطالب.
 * يستبدل السجل المطابق في (الطفل + وقت الجلسة) بدل إضافة نسخة ثانية،
 * لأن ولي الأمر قد يسجّل شعور الطفل بعد ظهور التقرير فتُحفظ الجلسة مرتين.
 */
export function saveHomeSession(summary: HomeSessionSummary) {
  try {
    const sessions = loadHomeSessions();
    const existing = sessions.findIndex(
      (item) =>
        item.childId === summary.childId &&
        item.sessionDate === summary.sessionDate
    );
    if (existing >= 0) sessions[existing] = summary;
    else sessions.push(summary);
    localStorage.setItem(HOME_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    /* ignore */
  }
}
