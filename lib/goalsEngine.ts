/**
 * أهداف مقترحة للعمل مع الطالب — من درجات التقييم وبنك التوصيات.
 */

import type { AiAnalysisPayload } from '@/lib/openai';
import {
  CRITERIA_LIST,
  DOMAINS,
  getCriterionById,
  type AssessmentResult,
  type AssessmentScore,
} from '@/types/taalof';

export type ProposedGoal = {
  id: string;
  criterionId: string;
  domain: string;
  title: string;
  priority: 'عالية' | 'متوسطة' | 'متابعة';
  score: number;
  why: string;
  strategy: string;
};

export type GoalSession = {
  at: string;
  mood?: string;
  activity?: string;
  notes?: string;
  progress?: number;
};

export type TrackedGoal = {
  id: string;
  childId: string;
  criterionId: string;
  domain: string;
  title: string;
  smartText: string;
  baseline: number;
  target: number;
  current: number;
  startDate: string;
  targetDate: string;
  status: 'active' | 'done' | 'paused';
  sessions: GoalSession[];
  lastUpdate?: string;
};

export const DEFAULT_GOAL_WHY =
  'يظهر الطفل حاجة لدعم إضافي في هذا السلوك وفق الملاحظة التربوية.';

export function goalWhyFromCriterion(
  criterion:
    | {
        levels?: Record<string, { description?: string }>;
      }
    | undefined,
  score: number
): string {
  const rounded = Math.min(3, Math.max(0, Math.round(Number(score) || 0)));
  const fromLevel =
    criterion?.levels?.[String(rounded) as '0' | '1' | '2' | '3']
      ?.description?.trim();
  if (fromLevel) return fromLevel;
  return DEFAULT_GOAL_WHY;
}

/** نص هدف SMART بالعربية — يفضّل autoGoal من بنك v3 */
export function buildSmartGoalText(
  criterionName: string,
  recommendation: string,
  weeks = 2
): string {
  return `خلال ${weeks} أسبوعين، نعمل على تحسين «${criterionName}» عبر تطبيق: ${recommendation} مع توثيق يومي قصير للنجاح والتعديل.`;
}

export type RoutineEnhancementGoal = {
  id: string;
  title: string;
  domain: string;
  strategy: string;
  ageBand: string;
  ageLabel: string;
};

const ROUTINE_ENHANCEMENT_GOALS: Record<string, Omit<RoutineEnhancementGoal, 'ageBand' | 'ageLabel'>[]> = {
  '3-4': [
    {
      id: 'routine-3-4-joint',
      title: 'تبادل الانتباه في لعب قصير',
      domain: 'التفاعل واللعب',
      strategy:
        'خلال 3–5 دقائق، سمِّ ما ينظر إليه الطفل وانتظر مشاركته قبل تقديم اللعبة.',
    },
    {
      id: 'routine-3-4-request',
      title: 'طلب شيء مفضل بإشارة أو كلمة',
      domain: 'التواصل',
      strategy:
        'ضع الشيء المفضل في مجال الرؤية، وانتظر الإشارة أو الكلمة، ثم قدّمه مباشرة.',
    },
    {
      id: 'routine-3-4-match',
      title: 'مطابقة شيء مألوف مع نموذجه',
      domain: 'الانتباه والمطابقة',
      strategy:
        'اعرض نموذجاً واحداً وخيارين، واحتفل بالمطابقة الصحيحة ثم أعد المحاولة بهدوء.',
    },
  ],
  '5-6': [
    {
      id: 'routine-5-6-instruction',
      title: 'اتباع تعليمة من خطوتين في روتين يومي',
      domain: 'الفهم والتنفيذ',
      strategy:
        'اطلب خطوتين متتاليتين واضحتين، مثل «ضع الكوب ثم أغلق الباب»، وامنح مهلة قبل التكرار.',
    },
    {
      id: 'routine-5-6-feelings',
      title: 'تسمية شعور بسيط أثناء قصة أو لعب',
      domain: 'التواصل الاجتماعي',
      strategy:
        'قف عند مشهد واضح واسأل «ماذا يشعر؟» واقبل كلمة واحدة ثم أعد صياغتها في جملة قصيرة.',
    },
    {
      id: 'routine-5-6-turn',
      title: 'تبادل الدور في لعبة قصيرة',
      domain: 'اللعب',
      strategy:
        'حدّد دوراً لك ودوره للطفل، وانتظر اكتمال دوره قبل أن تبدأ دورك التالي.',
    },
  ],
  '7-9': [
    {
      id: 'routine-7-9-recount',
      title: 'سرد حدث يومي في جملتين أو ثلاث',
      domain: 'التعبير',
      strategy:
        'اسأل ماذا حدث ثم ماذا بعد ذلك، وساعده ببداية الجملة إن توقف دون إكمال القصة عنه.',
    },
    {
      id: 'routine-7-9-problem',
      title: 'حل مشكلة منزلية بسيطة بعد مهلة تفكير',
      domain: 'المرونة والتفكير',
      strategy:
        'اطرح سؤالاً مثل «أين نضع هذا؟» وانتظر قبل أي تلميح، ثم اقبل حلاً عملياً واحداً.',
    },
    {
      id: 'routine-7-9-tidy',
      title: 'إنهاء نشاط ثم إعادة أدواته إلى مكانها',
      domain: 'الاستقلال في الروتين',
      strategy:
        'اتفق على نهاية واضحة للنشاط، ثم اطلب إعادة الأدوات قبل الانتقال إلى شيء آخر.',
    },
  ],
  '10-12': [
    {
      id: 'routine-10-12-plan',
      title: 'تخطيط الخطوة التالية في نشاط أو واجب',
      domain: 'التنظيم',
      strategy:
        'قبل البدء، اطلب منه تسمية الخطوة الأولى فقط، ثم راجعها بعد الإنجاز.',
    },
    {
      id: 'routine-10-12-help',
      title: 'طلب المساعدة بجملة واضحة عند التعثر',
      domain: 'التواصل الوظيفي',
      strategy:
        'عند التوقف، انتظر جملة طلب مثل «أحتاج مساعدة في…» قبل تقديم الحل.',
    },
    {
      id: 'routine-10-12-flex',
      title: 'التكيف مع تغيير بسيط في الروتين بعد تهيئة',
      domain: 'المرونة',
      strategy:
        'أخبر بالتغيير قبل وقوعه بجملة واحدة، ثم نفّذه وراجع مع الطفل ما الذي بقي كما هو.',
    },
  ],
};

const AGE_BAND_AR: Record<string, string> = {
  '3-4': '٣–٤ سنوات',
  '5-6': '٥–٦ سنوات',
  '7-9': '٧–٩ سنوات',
  '10-12': '١٠–١٢ سنة',
};

export function ageBandForRoutineGoals(input: {
  ageBand?: string;
  childAge?: number;
}): string {
  if (input.ageBand && ROUTINE_ENHANCEMENT_GOALS[input.ageBand]) {
    return input.ageBand;
  }
  const age = input.childAge;
  if (age == null || Number.isNaN(age)) return '5-6';
  if (age < 5) return '3-4';
  if (age < 7) return '5-6';
  if (age < 10) return '7-9';
  return '10-12';
}

/** أهداف تعزيز منزلي عندما لا توجد بنود دعم بدرجة ٢ أو أعلى. ليست تشخيصاً ولا إتقاناً. */
export function buildRoutineEnhancementGoals(input: {
  ageBand?: string;
  childAge?: number;
}): RoutineEnhancementGoal[] {
  const ageBand = ageBandForRoutineGoals(input);
  const ageLabel = AGE_BAND_AR[ageBand] || ageBand;
  return (ROUTINE_ENHANCEMENT_GOALS[ageBand] || ROUTINE_ENHANCEMENT_GOALS['5-6']).map(
    (goal) => ({ ...goal, ageBand, ageLabel })
  );
}

export function buildProposedGoals(
  scores: AssessmentScore[],
  limit = 8
): ProposedGoal[] {
  const rows = scores
    .map((s) => {
      const c = getCriterionById(s.criterionId);
      if (!c) return null;
      const roundedScore = Math.min(3, Math.max(0, Math.round(s.score)));
      const priority: ProposedGoal['priority'] =
        roundedScore >= 3 ? 'عالية' : roundedScore === 2 ? 'متوسطة' : 'متابعة';
      return {
        id: `goal-${c.id}`,
        criterionId: c.id,
        domain: c.domain,
        title: c.name,
        priority,
        score: s.score,
        why: goalWhyFromCriterion(c, s.score),
        strategy: c.recommendation,
      } satisfies ProposedGoal;
    })
    .filter((g): g is ProposedGoal => g != null && g.score >= 2)
    .sort((a, b) => b.score - a.score || a.domain.localeCompare(b.domain, 'ar'));

  return rows.slice(0, limit);
}

export function createTrackedGoalsFromScores(
  childId: string,
  scores: AssessmentScore[],
  limit = 6
): TrackedGoal[] {
  const proposed = buildProposedGoals(scores, limit);
  const start = new Date();
  const target = new Date(start);
  target.setDate(target.getDate() + 14);

  return proposed.map((g) => {
    const c = getCriterionById(g.criterionId);
    const baseline = Math.min(100, Math.max(0, Math.round((3 - g.score) * 33)));
    return {
      id: `tg_${childId}_${g.criterionId}_${start.getTime().toString(36)}`,
      childId,
      criterionId: g.criterionId,
      domain: g.domain,
      title: g.title,
      smartText:
        c?.autoGoal ||
        buildSmartGoalText(g.title, c?.recommendation || g.strategy),
      baseline,
      target: Math.min(100, baseline + 30),
      current: baseline,
      startDate: start.toISOString(),
      targetDate: target.toISOString(),
      status: 'active' as const,
      sessions: [],
      lastUpdate: start.toISOString(),
    };
  });
}

export function todayPracticeFromGoal(goal: TrackedGoal | null) {
  if (!goal) {
    return {
      title: 'تمرين اليوم',
      steps: [
        'اختر هدفاً واحداً من قائمة الأهداف',
        'طبّق استراتيجية قصيرة لمدة 5–10 دقائق',
        'سجّل ملاحظة المزاج والنتيجة',
      ],
    };
  }
  return {
    title: `تمرين اليوم: ${goal.title}`,
    steps: [
      'جهّز بيئة هادئة بدون مشتتات لمدة 10 دقائق',
      goal.smartText,
      'كافئ المحاولة فوراً بكلمة أو إشارة إيجابية',
      'سجّل المزاج والملاحظة في بطاقة الهدف',
    ],
  };
}

export function analysisFocusSentence(weakDomains: string[]): string {
  if (!weakDomains.length) {
    return 'تظهر الحاجة إلى دعم ومتابعة روتينية في الجوانب السلوكية والتفاعلية';
  }
  return `تظهر حاجة إلى دعم مركّز في: ${weakDomains.join('، ')}`;
}

/** تحليل تربوي محلي عند غياب OpenAI — يظهر دائماً على الشاشة */
export function buildLocalAiAnalysis(
  result: AssessmentResult,
  scores: AssessmentScore[]
): AiAnalysisPayload {
  const goals = buildProposedGoals(scores, 6);
  const weakDomains = DOMAINS.filter(
    (d) => (result.domainAverages[d] ?? 0) >= 1.5
  ).slice(0, 4);
  const strongDomains = DOMAINS.filter(
    (d) => (result.domainAverages[d] ?? 0) < 1
  ).slice(0, 3);

  const top = goals.slice(0, 3);

  return {
    analysis: `بناءً على تقييم تآلف (${result.percentage}% · ${result.classification}) ${analysisFocusSentence(
      weakDomains
    )}. يُفضَّل اختيار هدف تربوي واحد أسبوعياً وتوثيق التقدّم في المنزل والمدرسة. هذا تحليل توجيهي وليس تشخيصاً طبياً.`,
    strengths: strongDomains.length
      ? strongDomains.map((d) => `ملامح أكثر استقراراً نسبياً في مجال ${d}`)
      : ['وجود أساس يمكن البناء عليه عبر روتين قصير يومي'],
    weaknesses: top.map(
      (g) => `${g.title} (${g.priority}) — درجة ${g.score}/3`
    ),
    recommendations: {
      special_education:
        goals.find((g) => g.domain === 'النمو المعرفي والحلول الإدراكية')
          ?.strategy || 'تعليمات قصيرة مع تعزيز فوري وتقسيم المهام.',
      speech:
        goals.find((g) => g.domain === 'التواصل الاستجابي والتعبيري')
          ?.strategy || 'نماذج لغوية بسيطة مع دعم بصري عند الطلب.',
      psychological:
        goals.find(
          (g) =>
            g.domain === 'التفاعل والاندماج الاجتماعي واللعب' ||
            g.domain === 'السلوك والتكيف والحواس واستقلالية الذات'
        )?.strategy || 'روتين تهدئة وخياران واضحان عند الإحباط.',
      occupational:
        goals.find((g) => g.domain === 'السلوك والتكيف والحواس واستقلالية الذات')
          ?.strategy || 'مهارات مساعدة يومية بخطوات مرئية قصيرة.',
    },
    intervention_plan:
      top.length > 0
        ? `الأهداف ذات الأولوية: ${top
            .map((g) => g.title)
            .join('؛ ')}. طبّق استراتيجية واحدة لمدة أسبوعين مع توثيق بسيط (ماذا نجح / ما يحتاج تعديلاً).`
        : 'حافظ على روتين يومي بسيط مع تعزيز إيجابي، وأعد التقييم في الموعد المقترح.',
    confidence: 0.72,
  };
}

export function goalsFromCriteriaList(ids: string[]) {
  return ids
    .map((id) => CRITERIA_LIST.find((c) => c.id === id))
    .filter(Boolean);
}
