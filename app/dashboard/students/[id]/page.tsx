'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  loadStoredAssessments,
  type StoredAssessment,
} from '@/lib/assessmentHelpers';
import { hasActiveAssessment } from '@/lib/assessmentGate';
import {
  createTrackedGoalsFromScores,
  type TrackedGoal,
} from '@/lib/goalsEngine';
import { loadGoalsLocal, saveGoalsLocal } from '@/lib/goalsStore';
import PhysicianClinicalSummary from '@/components/PhysicianClinicalSummary';
import DualPathwayRecord from '@/components/records/DualPathwayRecord';
import SensoryHubRecommendationsCard from '@/components/sensory-hub/SensoryHubRecommendationsCard';
import SensoryHubSessionsPanel from '@/components/sensory-hub/SensoryHubSessionsPanel';
import NextBestActionCard from '@/components/dashboard/NextBestActionCard';
import ClinicalProgressReportPreview from '@/components/reports/ClinicalProgressReportPreview';
import PdfExportButton from '@/components/reports/PdfExportButton';
import ContractArchiveCard from '@/components/contracts/ContractArchiveCard';
import {
  blockIfContractPending,
} from '@/components/contracts/ContractGate';
import ContractSignModal from '@/components/contracts/ContractSignModal';
import PermissionGate from '@/components/access/PermissionGate';
import { aggregateClinicalProgressReport } from '@/lib/clinicalReportAggregator';
import { loadHomeSessions } from '@/lib/homeClassroomEngine';
import { loadSensoryHubSessions } from '@/lib/sensoryHubSession';
import { doctorSummaryPath } from '@/lib/doctorReferral';
import { buildPhysicianSummaryInput } from '@/lib/progressTracker';
import {
  readAcademicPathway,
  readDevelopmentalPathway,
} from '@/lib/childPathwayRecord';
import { useLanguage } from '@/components/LanguageProvider';

type StudentRow = {
  id: string;
  name: string;
  dob?: string;
  age?: number;
  parent_name?: string;
  parent_phone?: string;
  notes?: string;
  status?: string;
};

type GameSession = {
  id?: string;
  childId?: string;
  gameCode?: string;
  game_code?: string;
  score: number;
  endedAt?: string;
  ended_at?: string;
  startedAt?: string;
};

function classColor(label: string) {
  if (label === 'طبيعي') return '#2D8B5A';
  if (label === 'خفيف' || label === 'متوسط') return '#EAB308';
  if (label === 'شديد') return '#F97316';
  if (label === 'شديد جداً') return '#DC2626';
  return '#64748B';
}

function DomainLineChart({
  assessments,
  title,
}: {
  assessments: StoredAssessment[];
  title: string;
}) {
  const domains = useMemo(() => {
    const set = new Set<string>();
    assessments.forEach((a) =>
      Object.keys(a.domainAverages || {}).forEach((d) => set.add(d))
    );
    return Array.from(set).slice(0, 4);
  }, [assessments]);

  if (assessments.length < 2 || !domains.length) return null;

  const w = 320;
  const h = 140;
  const colors = ['#2E7D8E', '#F59E0B', '#4A90D9', '#F97316'];

  return (
    <div className="rounded-3xl border border-white/90 bg-white/85 p-5 backdrop-blur-xl">
      <h2 className="text-lg font-bold text-[#0b1f14]">{title}</h2>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-40 w-full">
        {domains.map((domain, di) => {
          const pts = assessments
            .slice()
            .reverse()
            .map((a, i, arr) => {
              const x = (i / Math.max(1, arr.length - 1)) * (w - 24) + 12;
              const v = Number(a.domainAverages?.[domain] ?? 0);
              const y = h - 16 - (v / 3) * (h - 28);
              return `${x},${y}`;
            })
            .join(' ');
          return (
            <polyline
              key={domain}
              fill="none"
              stroke={colors[di % colors.length]}
              strokeWidth="2.5"
              points={pts}
            />
          );
        })}
      </svg>
      <ul className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
        {domains.map((d, i) => (
          <li key={d} className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: colors[i % colors.length] }}
            />
            {d}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function StudentDetailPage() {
  const { t, dir, lang } = useLanguage();
  const params = useParams();
  const id = String(params?.id || '');
  const [student, setStudent] = useState<StudentRow | null>(null);
  const [assessments, setAssessments] = useState<StoredAssessment[]>([]);
  const [games, setGames] = useState<GameSession[]>([]);
  const [goals, setGoals] = useState<TrackedGoal[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [clinicalReportOpen, setClinicalReportOpen] = useState(false);
  const [contractSignOpen, setContractSignOpen] = useState(false);
  const [contractTick, setContractTick] = useState(0);
  const [homeSessions, setHomeSessions] = useState<ReturnType<typeof loadHomeSessions>>([]);
  const [sensorySessions, setSensorySessions] = useState<ReturnType<typeof loadSensoryHubSessions>>([]);

  useEffect(() => {
    try {
      const rawStudents = localStorage.getItem('taaluf.students.v1');
      const students: StudentRow[] = rawStudents
        ? JSON.parse(rawStudents)
        : [];
      const found = students.find((s) => s.id === id);
      if (found) {
        setStudent(found);
        localStorage.setItem('taaluf.activeStudent', JSON.stringify(found));
      } else {
        const active = JSON.parse(
          localStorage.getItem('taaluf.activeStudent') || 'null'
        );
        if (active?.id === id) setStudent(active);
      }

      const localAssess = loadStoredAssessments().filter(
        (a) => a.studentId === id
      );
      setAssessments(localAssess);
      let goalList = loadGoalsLocal(id);
      if (!goalList.length && localAssess[0]?.scores?.length) {
        goalList = createTrackedGoalsFromScores(id, localAssess[0].scores);
        saveGoalsLocal([...goalList, ...loadGoalsLocal()]);
      }
      setGoals(goalList.filter((g) => g.status !== 'done'));

      const localGames = JSON.parse(
        localStorage.getItem('taaluf.gameSessions.v1') || '[]'
      ) as GameSession[];
      setGames(
        (Array.isArray(localGames) ? localGames : []).filter(
          (g: { childId?: string }) => g.childId === id
        )
      );

      setHomeSessions(loadHomeSessions().filter((s) => s.childId === id));
      setSensorySessions(loadSensoryHubSessions(id));
    } catch {
      /* ignore */
    }

    fetch(`/api/students/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.student?.fields?.name) {
          setStudent({
            id: d.student.id,
            name: d.student.fields.name,
            dob: d.student.fields.dob,
            age: d.student.fields.age,
            parent_name: d.student.fields.parent_name,
            parent_phone: d.student.fields.parent_phone,
            notes: d.student.fields.notes,
            status: d.student.fields.status,
          });
        }
      })
      .catch(() => undefined);

    fetch(`/api/assessments?studentId=${encodeURIComponent(id)}`).catch(
      () => undefined
    );

    fetch(`/api/games/run?childId=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.sessions) && d.sessions.length) setGames(d.sessions);
      })
      .catch(() => undefined);
  }, [id]);

  const timeline = useMemo(() => {
    const rows = assessments.map((a) => ({
      id: a.id,
      date: a.savedAt,
      type: t('typeAssessment'),
      percentage: a.percentage,
      classification: a.classification,
      specialist: t('specialistName'),
    }));
    const developmental = readDevelopmentalPathway(id);
    if (developmental.available && developmental.source === 'screening') {
      rows.push({
        id: 'screening-developmental',
        date: developmental.savedAt || new Date().toISOString(),
        type: t('typeDevScreening'),
        percentage: Number(String(developmental.scoreText).replace('%', '')) || 0,
        classification: developmental.summary,
        specialist: t('developmentalPath'),
      });
    }
    const academic = readAcademicPathway(id);
    if (academic.available) {
      const score = Number(String(academic.scoreText).replace(/[^\d.].*$/, ''));
      rows.push({
        id: 'screening-academic',
        date: academic.savedAt || new Date().toISOString(),
        type: t('typeAcaScreening'),
        percentage: Number.isFinite(score) ? score : 0,
        classification: academic.summary,
        specialist: t('academicPath'),
      });
    }
    return rows.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [assessments, id, t]);

  const latest = assessments[0];
  const physicianData = useMemo(
    () =>
      buildPhysicianSummaryInput({
        childName: student?.name || 'الطفل',
        age: student?.age,
        dob: student?.dob,
        studentId: id,
        goals,
      }),
    [student, id, goals, assessments]
  );

  const clinicalReport = useMemo(
    () =>
      aggregateClinicalProgressReport({
        student: {
          id,
          name: student?.name || t('childFile'),
          dob: student?.dob,
          age: student?.age,
          parentName: student?.parent_name,
          status: student?.status,
        },
        specialistName: t('specialistName'),
        assessments,
        goals,
        homeSessions,
        sensorySessions,
      }),
    [id, student, assessments, goals, homeSessions, sensorySessions, t]
  );

  return (
    <section
      dir={dir}
      className={`print-document mx-auto max-w-4xl space-y-6 print:bg-white print:p-0 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/dashboard" className="text-sm text-[#2E7D8E]">
          {t('backToCases')}
        </Link>
        <div className="flex flex-wrap gap-2">
          <PermissionGate permission="export_clinical_report">
            <button
              type="button"
              onClick={() => {
                if (
                  blockIfContractPending(id, 'clinical_report_export', () =>
                    setContractSignOpen(true)
                  )
                ) {
                  return;
                }
                setClinicalReportOpen(true);
              }}
              className="flex h-12 items-center justify-center rounded-2xl bg-[#2E7D8E] px-5 text-sm font-black text-white shadow-md transition hover:bg-[#236372]"
            >
              {lang === 'ar'
                ? '📄 استخراج التقرير السريري الشامل (PDF/طباعة)'
                : '📄 Export full clinical report (PDF/print)'}
            </button>
          </PermissionGate>
          <PermissionGate permission="export_clinical_report">
            <PdfExportButton
              documentTitle={`تقرير_الإحالة_${student?.name || t('childFile')}`}
              label="تنزيل التقرير / بطاقة الدعم (PDF) 📥"
              className="h-12 rounded-2xl bg-amber-500 px-5 text-sm font-black text-slate-900 hover:bg-amber-400 hover:text-slate-900"
            />
          </PermissionGate>
        </div>
      </div>

      <ClinicalProgressReportPreview
        open={clinicalReportOpen}
        onClose={() => setClinicalReportOpen(false)}
        report={clinicalReport}
        isAr={lang === 'ar'}
      />

      <ContractSignModal
        open={contractSignOpen}
        onClose={() => setContractSignOpen(false)}
        childId={id}
        childName={student?.name}
        contractType="parent"
        signerRoleDefault={lang === 'ar' ? 'ولي أمر' : 'Parent'}
        isAr={lang === 'ar'}
        onSigned={() => {
          setContractTick((n) => n + 1);
          setContractSignOpen(false);
        }}
      />

      <div className="rounded-3xl border border-white/90 bg-white/85 p-7 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#2E7D8E]">{t('caseFile')}</p>
            <h1 className="mt-1 text-3xl font-bold text-[#0b1f14]">
              {student?.name || t('childFile')}
            </h1>
            <ul className="mt-4 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
              <li>
                {t('ageLabel')}:{' '}
                {student?.age != null
                  ? t('ageYears', { age: student.age })
                  : student?.dob
                    ? student.dob
                    : '—'}
              </li>
              <li>
                {t('dobLabel')}: {student?.dob || '—'}
              </li>
              <li>
                {t('parentColon', { name: student?.parent_name || '—' })}
              </li>
              <li>
                {t('phoneLabel')}: {student?.parent_phone || '—'}
              </li>
              <li>
                {t('statusLabel')}: {student?.status || t('statusActive')}
              </li>
              <li>
                {latest
                  ? t('lastAssessment', {
                      label: `${latest.classification} · ${latest.percentage}%`,
                    })
                  : t('noEvalYet')}
              </li>
            </ul>
            {student?.notes ? (
              <p className="mt-4 rounded-2xl bg-[#F0F9F4] px-4 py-3 text-sm leading-7 text-slate-700">
                {student.notes}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
          <PermissionGate permission="edit_assessment">
            <Button
              onClick={() => {
                const gate = hasActiveAssessment(String(id));
                if (gate.active) {
                  window.alert(gate.message);
                  if (gate.reason === 'completed') {
                    window.location.href =
                      '/dashboard/assessments/new?view=results';
                  }
                  return;
                }
                window.location.href = '/dashboard/assessments/new';
              }}
            >
              {latest ? t('viewAssessmentBtn') : t('startAssessmentBtn')}
            </Button>
          </PermissionGate>
          <PermissionGate
            permissions={['manage_all_cases', 'manage_assigned_cases']}
            match="any"
          >
            <Button
              variant="outline"
              onClick={async () => {
                const path = doctorSummaryPath(id);
                const url = `${window.location.origin}${path}`;
                try {
                  await navigator.clipboard.writeText(url);
                  setCopiedLink(true);
                  window.setTimeout(() => setCopiedLink(false), 2000);
                } catch {
                  window.prompt('انسخ رابط الإحالة للطبيب:', url);
                }
              }}
            >
              {copiedLink ? t('doctorLinkCopied') : t('copyDoctorLink')}
            </Button>
          </PermissionGate>
          </div>
        </div>
      </div>

      <DualPathwayRecord childId={id} childName={student?.name} />

      <ContractArchiveCard
        key={contractTick}
        childId={id}
        childName={student?.name}
        isAr={lang === 'ar'}
      />

      <NextBestActionCard
        childId={id}
        childName={student?.name}
        isAr={lang === 'ar'}
      />

      <div
        dir={dir}
        className={`rounded-3xl border border-white/90 bg-white/85 p-6 backdrop-blur-xl ${
          dir === 'rtl' ? 'text-right' : 'text-left'
        }`}
      >
        <h2 className="text-xl font-bold text-[#0b1f14]">{t('workGoalsTitle')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('workGoalsLead')}</p>
        {goals.length === 0 ? (
          <p
            dir={dir}
            className={`mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500 ${
              dir === 'rtl' ? 'text-right' : 'text-left'
            }`}
          >
            {t('noGoalsYet')}
          </p>
        ) : (
          <ul className="mt-5 space-y-4">
            {goals.map((g) => {
              const range = Math.max(1, g.target - g.baseline);
              const fill = Math.min(
                100,
                Math.max(0, ((g.current - g.baseline) / range) * 100)
              );
              return (
                <li
                  key={g.id}
                  className="rounded-2xl border border-slate-100 bg-[#F0F9F4] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-[#0b1f14]">{g.title}</p>
                    <span className="text-xs font-semibold text-[#2E7D8E]">
                      {g.domain}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {g.smartText}
                  </p>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>
                        {t('fromTo', { from: g.baseline, to: g.target })}
                      </span>
                      <span>{t('currentValue', { n: g.current })}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-[#2E7D8E]"
                        style={{ width: `${fill}%` }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Link
          href="/dashboard/goals"
          className="mt-4 inline-block text-sm font-semibold text-[#2E7D8E]"
        >
          {t('updateGoalsProgress')}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <SensoryHubSessionsPanel childId={id} isAr={lang === 'ar'} />
        <SensoryHubRecommendationsCard goals={goals} isAr={lang === 'ar'} />
      </div>

      <div
        dir={dir}
        className={`rounded-3xl border border-white/90 bg-white/85 p-6 backdrop-blur-xl ${
          dir === 'rtl' ? 'text-right' : 'text-left'
        }`}
      >
        <h2 className="text-xl font-bold text-[#0b1f14]">{t('timelineTitle')}</h2>
        {timeline.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{t('noAssessmentsYet')}</p>
        ) : (
          <ol className="relative mt-6 space-y-5 border-r border-emerald-100 pr-5">
            {timeline.map((item) => (
              <li key={item.id} className="relative">
                <span
                  className="absolute -right-[27px] top-1 h-3 w-3 rounded-full"
                  style={{ background: classColor(item.classification) }}
                />
                <p className="text-xs text-slate-400">
                  {new Date(item.date).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB')} · {item.type}
                </p>
                <p className="mt-1 font-semibold text-slate-800">
                  {item.percentage}% · {item.classification}
                </p>
                <p className="text-xs text-slate-500">{item.specialist}</p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <DomainLineChart assessments={assessments} title={t('domainCompare')} />

      <PhysicianClinicalSummary data={physicianData} />

      <div
        dir={dir}
        className={`rounded-3xl border border-white/90 bg-white/85 p-6 backdrop-blur-xl ${
          dir === 'rtl' ? 'text-right' : 'text-left'
        }`}
      >
        <h2 className="text-lg font-bold text-[#0b1f14]">{t('gameSessions')}</h2>
        {games.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">{t('noGameSessions')}</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {games.slice(0, 8).map((g, i) => (
              <li
                key={g.id || i}
                className="flex justify-between rounded-xl bg-emerald-50/50 px-3 py-2"
              >
                <span>
                  {t('gamePoints', {
                    name: g.gameCode || g.game_code || t('games'),
                    score: g.score,
                  })}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(
                    g.endedAt || g.ended_at || g.startedAt || Date.now()
                  ).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
