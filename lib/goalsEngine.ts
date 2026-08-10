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

/** نص هدف SMART بالعربية من توصية المعيار */
export function buildSmartGoalText(
  criterionName: string,
  recommendation: string,
  weeks = 2
): string {
  return `خلال ${weeks} أسبوعين، نعمل على تحسين «${criterionName}» عبر تطبيق: ${recommendation} مع توثيق يومي قصير للنجاح والتعديل.`;
}

export function buildProposedGoals(
  scores: AssessmentScore[],
  limit = 8
): ProposedGoal[] {
  const rows = scores
    .map((s) => {
      const c = getCriterionById(s.criterionId);
      if (!c) return null;
      const priority: ProposedGoal['priority'] =
        s.score >= 3 ? 'عالية' : s.score === 2 ? 'متوسطة' : 'متابعة';
      return {
        id: `goal-${c.id}`,
        criterionId: c.id,
        domain: c.domain,
        title: c.name,
        priority,
        score: s.score,
        why: c.levels[String(s.score) as '0' | '1' | '2' | '3']?.description || '',
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
      smartText: buildSmartGoalText(g.title, c?.recommendation || g.strategy),
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
    analysis: `بناءً على تقييم تآلف (${result.percentage}% · ${result.classification}) تظهر حاجة دعم مركّزة في: ${
      weakDomains.join('، ') || 'متابعة روتينية'
    }. يُفضَّل اختيار هدف تربوي واحد أسبوعياً وتوثيق التقدّم في المنزل والمدرسة. هذا تحليل توجيهي وليس تشخيصاً طبياً.`,
    strengths: strongDomains.length
      ? strongDomains.map((d) => `ملامح أكثر استقراراً نسبياً في مجال ${d}`)
      : ['وجود أساس يمكن البناء عليه عبر روتين قصير يومي'],
    weaknesses: top.map(
      (g) => `${g.title} (${g.priority}) — درجة ${g.score}/3`
    ),
    recommendations: {
      special_education:
        goals.find((g) => g.domain === 'التربية الخاصة')?.strategy ||
        'تعليمات قصيرة مع تعزيز فوري وتقسيم المهام.',
      speech:
        goals.find((g) => g.domain === 'النطق والتخاطب')?.strategy ||
        'نماذج لغوية بسيطة مع دعم بصري عند الطلب.',
      psychological:
        goals.find((g) => g.domain === 'النفسية' || g.domain === 'التواصل الاجتماعي')
          ?.strategy || 'روتين تهدئة وخياران واضحان عند الإحباط.',
      occupational:
        goals.find((g) => g.domain === 'الوظيفية' || g.domain === 'التكيف')
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
