/**
 * تقارير إدارية وتربوية — مسار صعوبات التعلم (وزارة التربية والتعليم)
 */

import type { ComprehensiveAssessmentReport } from '@/lib/academicAssessmentEngine';
import { iepCompletionRate } from '@/lib/ldIep/engine';
import type { LdIndividualEducationPlan } from '@/lib/ldIep/types';
import {
  averageAchievement,
  weeklyAttendanceRate,
} from '@/lib/resourceRoom/engine';
import type { ResourceRoomSession } from '@/lib/resourceRoom/types';
import type { LdStudentProfile } from '@/lib/tracks/studentProfile';

export type LdMinistryReport = {
  reportType: 'moe_integration' | 'moe_iep' | 'moe_progress';
  generatedAt: string;
  regulatoryBody: 'moe';
  regulatoryLabelAr: string;
  regulatoryLabelEn: string;
  student: {
    id: string;
    name: string;
    gradeLevel?: string;
    schoolName?: string;
  };
  summary: {
    ar: string;
    en: string;
  };
  sections: LdReportSection[];
};

export type LdReportSection = {
  id: string;
  titleAr: string;
  titleEn: string;
  items: Array<{ labelAr: string; labelEn: string; value: string }>;
};

export function buildMoeIntegrationReport(
  profile: LdStudentProfile,
  iep: LdIndividualEducationPlan | null,
  sessions: ResourceRoomSession[]
): LdMinistryReport {
  const attendance = weeklyAttendanceRate(sessions, profile.id);
  const achievement = averageAchievement(sessions, profile.id);

  return {
    reportType: 'moe_integration',
    generatedAt: new Date().toISOString(),
    regulatoryBody: 'moe',
    regulatoryLabelAr: 'وزارة التربية والتعليم',
    regulatoryLabelEn: 'Ministry of Education',
    student: {
      id: profile.id,
      name: profile.name,
      gradeLevel: profile.schoolIntegration.gradeLevel,
      schoolName: profile.schoolIntegration.schoolName,
    },
    summary: {
      ar: `تقرير دمج مدرسي للطالب/الطالبة ${profile.name} — يوضح خطة الدعم الأكاديمي ومتطلبات غرفة المصادر وفق معايير وزارة التربية والتعليم.`,
      en: `School integration report for ${profile.name} — outlines academic support plan and resource room requirements per Ministry of Education standards.`,
    },
    sections: [
      {
        id: 'integration',
        titleAr: 'خطة الدمج المدرسي',
        titleEn: 'School Integration Plan',
        items: [
          {
            labelAr: 'نوع الدمج',
            labelEn: 'Placement Type',
            value: iep?.schoolIntegration.placement ?? profile.schoolIntegration.integrationPlan ?? '—',
          },
          {
            labelAr: 'ساعات الدعم الأسبوعية',
            labelEn: 'Weekly Support Hours',
            value: String(iep?.schoolIntegration.hoursPerWeek ?? '—'),
          },
          {
            labelAr: 'غرفة المصادر',
            labelEn: 'Resource Room',
            value: profile.schoolIntegration.resourceRoomAssigned ? 'مُخصَّصة' : 'غير مُخصَّصة',
          },
        ],
      },
      {
        id: 'attendance',
        titleAr: 'حضور غرفة المصادر',
        titleEn: 'Resource Room Attendance',
        items: [
          {
            labelAr: 'نسبة الحضور (4 أسابيع)',
            labelEn: 'Attendance Rate (4 weeks)',
            value: `${attendance}%`,
          },
          {
            labelAr: 'متوسط الإنجاز',
            labelEn: 'Average Achievement',
            value: achievement != null ? `${achievement}%` : '—',
          },
          {
            labelAr: 'جلسات مكتملة',
            labelEn: 'Completed Sessions',
            value: String(
              sessions.filter(
                (s) => s.childId === profile.id && s.status === 'completed'
              ).length
            ),
          },
        ],
      },
      {
        id: 'accommodations',
        titleAr: 'التسهيلات المعتمدة',
        titleEn: 'Approved Accommodations',
        items: (iep?.accommodations ?? [])
          .filter((a) => a.approved)
          .map((a) => ({
            labelAr: a.descriptionAr,
            labelEn: a.descriptionEn,
            value: '✓ معتمد',
          })),
      },
    ],
  };
}

export function buildMoeIepReport(
  profile: LdStudentProfile,
  iep: LdIndividualEducationPlan
): LdMinistryReport {
  const completion = iepCompletionRate(iep);

  return {
    reportType: 'moe_iep',
    generatedAt: new Date().toISOString(),
    regulatoryBody: 'moe',
    regulatoryLabelAr: 'وزارة التربية والتعليم',
    regulatoryLabelEn: 'Ministry of Education',
    student: {
      id: profile.id,
      name: profile.name,
      gradeLevel: profile.schoolIntegration.gradeLevel,
      schoolName: profile.schoolIntegration.schoolName,
    },
    summary: {
      ar: `الخطة التربوية الفردية (IEP) للطالب/الطالبة ${profile.name} — ${iep.schoolYear} · ${iep.term}`,
      en: `Individual Education Plan (IEP) for ${profile.name} — ${iep.schoolYear} · ${iep.term}`,
    },
    sections: [
      {
        id: 'goals',
        titleAr: 'الأهداف التعليمية الذكية (SMART)',
        titleEn: 'SMART Educational Goals',
        items: iep.goals.map((g) => ({
          labelAr: g.titleAr,
          labelEn: g.titleEn,
          value: `${g.current}% ← ${g.target}% (${g.status})`,
        })),
      },
      {
        id: 'progress',
        titleAr: 'معدل التقدم',
        titleEn: 'Progress Rate',
        items: [
          {
            labelAr: 'نسبة إنجاز الخطة',
            labelEn: 'Plan Completion',
            value: `${completion}%`,
          },
          {
            labelAr: 'تاريخ المراجعة',
            labelEn: 'Review Date',
            value: iep.reviewDate,
          },
        ],
      },
      {
        id: 'interventions',
        titleAr: 'التدخلات القائمة على الأدلة',
        titleEn: 'Evidence-Based Interventions',
        items: iep.goals.flatMap((g) =>
          g.interventions.map((i) => ({
            labelAr: i.nameAr,
            labelEn: i.nameEn,
            value: `${i.frequency} · ${i.evidenceBase}`,
          }))
        ),
      },
    ],
  };
}

export type LdAdminMetrics = {
  totalStudents: number;
  activeIepPlans: number;
  resourceRoomSessionsThisWeek: number;
  averageIepCompletion: number;
  domainBreakdown: Array<{ domain: string; count: number }>;
  attendanceRate: number;
};

export function computeLdAdminMetrics(
  profiles: LdStudentProfile[],
  iepPlans: LdIndividualEducationPlan[],
  sessions: ResourceRoomSession[]
): LdAdminMetrics {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  const activeIeps = iepPlans.filter((p) => p.status === 'active');
  const weekSessions = sessions.filter(
    (s) => s.scheduledDate >= weekStartStr && s.status !== 'cancelled'
  );

  const domainCounts: Record<string, number> = {};
  activeIeps.forEach((iep) => {
    iep.priorityDomains.forEach((d) => {
      domainCounts[d] = (domainCounts[d] ?? 0) + 1;
    });
  });

  const completionRates = activeIeps.map(iepCompletionRate);
  const avgCompletion =
    completionRates.length > 0
      ? Math.round(
          completionRates.reduce((a, b) => a + b, 0) / completionRates.length
        )
      : 0;

  const attendanceRates = profiles.map((p) =>
    weeklyAttendanceRate(sessions, p.id)
  );
  const avgAttendance =
    attendanceRates.length > 0
      ? Math.round(
          attendanceRates.reduce((a, b) => a + b, 0) / attendanceRates.length
        )
      : 0;

  return {
    totalStudents: profiles.length,
    activeIepPlans: activeIeps.length,
    resourceRoomSessionsThisWeek: weekSessions.length,
    averageIepCompletion: avgCompletion,
    domainBreakdown: Object.entries(domainCounts).map(([domain, count]) => ({
      domain,
      count,
    })),
    attendanceRate: avgAttendance,
  };
}

export function buildMoeProgressReport(
  profile: LdStudentProfile,
  assessment: ComprehensiveAssessmentReport | null,
  iep: LdIndividualEducationPlan | null,
  sessions: ResourceRoomSession[]
): LdMinistryReport {
  const attendance = weeklyAttendanceRate(sessions, profile.id);
  const completion = iep ? iepCompletionRate(iep) : 0;

  return {
    reportType: 'moe_progress',
    generatedAt: new Date().toISOString(),
    regulatoryBody: 'moe',
    regulatoryLabelAr: 'وزارة التربية والتعليم',
    regulatoryLabelEn: 'Ministry of Education',
    student: {
      id: profile.id,
      name: profile.name,
      gradeLevel: profile.schoolIntegration.gradeLevel,
      schoolName: profile.schoolIntegration.schoolName,
    },
    summary: {
      ar: assessment?.primaryDiagnosisAr ?? `تقرير متابعة تقدم أكاديمي — ${profile.name}`,
      en: assessment?.primaryDiagnosisEn ?? `Academic progress report — ${profile.name}`,
    },
    sections: [
      {
        id: 'assessment',
        titleAr: 'نتائج التقييم الأكاديمي',
        titleEn: 'Academic Assessment Results',
        items: assessment
          ? Object.values(assessment.domains).map((d) => ({
              labelAr: d.label,
              labelEn: d.labelEn,
              value: `${d.score}/${d.maxScore} · ${d.severityLabelAr}`,
            }))
          : [{ labelAr: '—', labelEn: '—', value: 'لا يوجد تقييم محفوظ' }],
      },
      {
        id: 'iep_progress',
        titleAr: 'تقدم الخطة التربوية',
        titleEn: 'IEP Progress',
        items: [
          {
            labelAr: 'نسبة إنجاز الأهداف',
            labelEn: 'Goal Completion',
            value: `${completion}%`,
          },
          {
            labelAr: 'حضور غرفة المصادر',
            labelEn: 'Resource Room Attendance',
            value: `${attendance}%`,
          },
        ],
      },
    ],
  };
}
