/**
 * محرك بناء وإدارة الخطة التربوية الفردية (IEP) لمسار صعوبات التعلم
 */

import type { ComprehensiveAssessmentReport } from '@/lib/academicAssessmentEngine';
import type { LdAcademicDomain } from '@/lib/tracks/types';
import {
  DEFAULT_ACCOMMODATIONS,
  EVIDENCE_BASED_INTERVENTIONS,
  type LdIepAccommodation,
  type LdIepGoal,
  type LdIndividualEducationPlan,
} from './types';

const DOMAIN_MAP: Record<string, LdAcademicDomain> = {
  dyslexia: 'dyslexia',
  dysgraphia: 'dysgraphia',
  dyscalculia: 'dyscalculia',
  executive_adhd: 'executive_functions',
  cognitive_processing: 'cognitive_processing',
};

function mapDomain(key: string): LdAcademicDomain {
  return DOMAIN_MAP[key] ?? 'cognitive_processing';
}

function goalId(): string {
  return `ld_goal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function iepId(): string {
  return `ld_iep_${Date.now()}`;
}

function currentSchoolYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // Academic year starts September
  if (month >= 8) return `${year}/${year + 1}`;
  return `${year - 1}/${year}`;
}

function currentTerm(): string {
  const month = new Date().getMonth();
  if (month >= 8 || month <= 0) return 'الفصل الأول';
  if (month <= 3) return 'الفصل الثاني';
  return 'الفصل الصيفي';
}

export function buildSmartGoalAr(
  domain: LdAcademicDomain,
  baseline: number,
  target: number,
  weeks: number
): string {
  const domainLabels: Record<LdAcademicDomain, string> = {
    dyslexia: 'القراءة والوعي الفونيمي',
    dysgraphia: 'الكتابة والتعبير التحريري',
    dyscalculia: 'الحساب والمفاهيم الرياضية',
    cognitive_processing: 'المعالجة الإدراكية',
    executive_functions: 'الانتباه والوظائف التنفيذية',
  };
  const label = domainLabels[domain];
  return `خلال ${weeks} أسابيع، سيرفع الطالب/الطالبة أداءه في «${label}» من ${baseline}% إلى ${target}% بنسبة نجاح قابلة للقياس عبر تقييمات أسبوعية موثّقة.`;
}

export function buildSmartGoalEn(
  domain: LdAcademicDomain,
  baseline: number,
  target: number,
  weeks: number
): string {
  const domainLabels: Record<LdAcademicDomain, string> = {
    dyslexia: 'reading and phonemic awareness',
    dysgraphia: 'writing and written expression',
    dyscalculia: 'numeracy and mathematical concepts',
    cognitive_processing: 'cognitive processing',
    executive_functions: 'attention and executive functions',
  };
  const label = domainLabels[domain];
  return `Within ${weeks} weeks, the student will improve ${label} from ${baseline}% to ${target}% as measured by weekly documented assessments.`;
}

export function createGoalFromDomain(
  childId: string,
  domain: LdAcademicDomain,
  smartGoalAr: string,
  smartGoalEn: string,
  baseline = 30,
  target = 80
): LdIepGoal {
  const now = new Date();
  const review = new Date(now);
  review.setMonth(review.getMonth() + 3);

  return {
    id: goalId(),
    childId,
    domain,
    titleAr: smartGoalAr.split('،')[0] ?? smartGoalAr,
    titleEn: smartGoalEn.split(',')[0] ?? smartGoalEn,
    smartTextAr: smartGoalAr,
    smartTextEn: smartGoalEn,
    baseline,
    target,
    current: baseline,
    measurementMethod: 'تقييم أسبوعي موثّق + ملاحظة صفية',
    startDate: now.toISOString().slice(0, 10),
    reviewDate: review.toISOString().slice(0, 10),
    status: 'active',
    interventions: EVIDENCE_BASED_INTERVENTIONS[domain] ?? [],
    progressNotes: [],
  };
}

export function buildIepFromAssessment(
  report: ComprehensiveAssessmentReport,
  childId: string
): LdIndividualEducationPlan {
  const now = new Date().toISOString();
  const review = new Date();
  review.setMonth(review.getMonth() + 3);

  const ranked = Object.values(report.domains).sort((a, b) => b.score - a.score);
  const priorityDomains = ranked
    .filter((d) => d.severity !== 'normal')
    .slice(0, 3)
    .map((d) => mapDomain(d.domain));

  const goals: LdIepGoal[] = ranked
    .filter((d) => d.severity === 'severe' || d.severity === 'moderate')
    .slice(0, 4)
    .map((d) => {
      const domain = mapDomain(d.domain);
      const baseline = Math.max(10, 100 - d.percentage);
      const target = Math.min(90, baseline + 30);
      const smartAr =
        d.smartGoals[0] ??
        buildSmartGoalAr(domain, baseline, target, 8);
      const smartEn = buildSmartGoalEn(domain, baseline, target, 8);
      return createGoalFromDomain(childId, domain, smartAr, smartEn, baseline, target);
    });

  const accommodations: LdIepAccommodation[] = DEFAULT_ACCOMMODATIONS.map(
    (acc) => {
      const examAccom = report.individualEducationPlan.examAccommodations;
      const approved = examAccom.some(
        (e) =>
          (e.includes('وقت') && acc.id === 'acc_time') ||
          (e.includes('قارئ') && acc.id === 'acc_reader') ||
          (e.includes('جلوس') && acc.id === 'acc_seating')
      );
      return { ...acc, approved };
    }
  );

  const severeCount = ranked.filter((d) => d.severity === 'severe').length;

  return {
    id: iepId(),
    childId,
    childName: report.studentName ?? 'الطالب / الطالبة',
    schoolYear: currentSchoolYear(),
    term: currentTerm(),
    createdAt: now,
    updatedAt: now,
    reviewDate: review.toISOString().slice(0, 10),
    priorityDomains: priorityDomains.length > 0 ? priorityDomains : ['dyslexia'],
    goals,
    accommodations,
    schoolIntegration: {
      placement: severeCount >= 2 ? 'resource_room' : 'regular_class_with_support',
      hoursPerWeek: severeCount >= 2 ? 6 : 3,
      mainClassSubjects: ['اللغة العربية', 'الرياضيات', 'العلوم'],
      supportSubjects: priorityDomains.map((d) => {
        const labels: Record<LdAcademicDomain, string> = {
          dyslexia: 'دعم قرائي',
          dysgraphia: 'دعم كتابة',
          dyscalculia: 'دعم حسابي',
          cognitive_processing: 'مهارات إدراكية',
          executive_functions: 'وظائف تنفيذية',
        };
        return labels[d];
      }),
    },
    signatures: {},
    status: 'active',
  };
}

export function updateGoalProgress(
  goal: LdIepGoal,
  score: number,
  note: string,
  recordedBy?: string
): LdIepGoal {
  const now = new Date().toISOString();
  const notes = [
    ...goal.progressNotes,
    { at: now, note, score, recordedBy },
  ];
  let status = goal.status;
  if (score >= goal.target) status = 'achieved';

  return {
    ...goal,
    current: score,
    progressNotes: notes,
    status,
  };
}

export function iepCompletionRate(iep: LdIndividualEducationPlan): number {
  if (iep.goals.length === 0) return 0;
  const active = iep.goals.filter((g) => g.status !== 'discontinued');
  if (active.length === 0) return 0;
  const sum = active.reduce((acc, g) => {
    const range = g.target - g.baseline;
    if (range <= 0) return acc + (g.status === 'achieved' ? 100 : 0);
    const pct = ((g.current - g.baseline) / range) * 100;
    return acc + Math.max(0, Math.min(100, pct));
  }, 0);
  return Math.round(sum / active.length);
}
