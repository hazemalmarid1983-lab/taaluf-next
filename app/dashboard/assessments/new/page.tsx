'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import CriteriaSlider from '@/components/assessment/CriteriaSlider';
import ResultsScreen from '@/components/assessment/ResultsScreen';
import { Button } from '@/components/ui/button';
import {
  clearAssessmentDraft,
  hasActiveAssessment,
  saveAssessmentDraft,
  type AssessmentDraft,
} from '@/lib/assessmentGate';
import {
  compareWithPrevious,
  domainSourcesFromFusion,
  fuseAssessmentSources,
  getPreviousAssessment,
  loadStoredGameScores,
  loadStoredParentScores,
  saveStoredAssessment,
  suggestNextAssessmentDate,
  type StoredAssessment,
} from '@/lib/assessmentHelpers';
import { useStepNav } from '@/hooks/useStepNav';
import { ASSESSMENT_UI } from '@/lib/content';
import { buildProposedGoals } from '@/lib/goalsEngine';
import type { AiAnalysisPayload } from '@/lib/openai';
import { downloadAssessmentPdf } from '@/lib/pdf';
import {
  DOMAINS,
  calculateAssessmentResult,
  getActiveCriteria,
  getAgeBand,
  getAgeBandFromYears,
  type AssessmentScore,
} from '@/types/taalof';

type LocalStudent = {
  id: string;
  name: string;
  age?: number;
  dob?: string;
  birthdate?: string;
};
type Phase = 'questionnaire' | 'results';

function resultFromStored(
  stored: StoredAssessment,
  ageBand: ReturnType<typeof getAgeBand>
) {
  return calculateAssessmentResult(
    stored.scores.map((s) => ({
      criterionId: s.criterionId,
      score: s.score,
      specialistNotes: s.specialistNotes,
      evidence: s.evidence,
    })),
    ageBand
  );
}

export default function NewAssessmentPage() {
  return (
    <Suspense
      fallback={
        <p className="py-16 text-center text-sm text-slate-500">
          جاري تحميل التقييم…
        </p>
      }
    >
      <NewAssessmentInner />
    </Suspense>
  );
}

function NewAssessmentInner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isParentPortal = pathname?.startsWith('/parent');
  const wantResults =
    searchParams.get('view') === 'results' ||
    searchParams.get('view') === 'report';

  const [student, setStudent] = useState<LocalStudent | null>(null);
  const [scores, setScores] = useState<Record<string, number | null>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [evidence, setEvidence] = useState<Record<string, string[]>>({});
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>('questionnaire');
  const { locked, go } = useStepNav(500);
  const [computed, setComputed] = useState<ReturnType<
    typeof calculateAssessmentResult
  > | null>(null);
  const [previous, setPrevious] = useState<StoredAssessment | null>(null);
  const [nextDate, setNextDate] = useState('');
  const [ai, setAi] = useState<AiAnalysisPayload | null>(null);
  const [busyAi, setBusyAi] = useState(false);
  const [busySave, setBusySave] = useState(false);
  const [msg, setMsg] = useState('');
  const [toast, setToast] = useState('');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [domainSources, setDomainSources] = useState<Record<string, string[]>>(
    {}
  );
  const [gateReady, setGateReady] = useState(false);

  const ageBand = useMemo(() => {
    const birth = student?.dob || student?.birthdate;
    if (birth) return getAgeBand(birth);
    if (student?.age != null) return getAgeBandFromYears(student.age);
    return '5-6';
  }, [student]);

  const activeCriteria = useMemo(
    () => getActiveCriteria(ageBand),
    [ageBand]
  );

  const showToast = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(''), 4500);
  };

  useEffect(() => {
    try {
      if (localStorage.getItem('taaluf_consented') !== 'true') {
        router.replace('/consent');
        return;
      }
      const raw = localStorage.getItem('taaluf.activeStudent');
      if (!raw) {
        setGateReady(true);
        return;
      }
      const s = JSON.parse(raw) as LocalStudent;
      setStudent(s);
      const band =
        s.dob || s.birthdate
          ? getAgeBand(s.dob || s.birthdate || '')
          : s.age != null
            ? getAgeBandFromYears(s.age)
            : '5-6';
      const prev = getPreviousAssessment(s.id);
      setPrevious(prev);

      const gate = hasActiveAssessment(s.id);
      const draft = gate.draft as AssessmentDraft | null | undefined;

      if (wantResults && prev) {
        const result = resultFromStored(prev, band);
        setComputed(result);
        setScores(
          Object.fromEntries(prev.scores.map((x) => [x.criterionId, x.score]))
        );
        setNotes(
          Object.fromEntries(
            prev.scores
              .filter((x) => x.specialistNotes)
              .map((x) => [x.criterionId, x.specialistNotes || ''])
          )
        );
        setNextDate(
          prev.nextAssessmentDate ||
            suggestNextAssessmentDate(prev.classification)
        );
        if (prev.aiAnalysis) setAi(prev.aiAnalysis as AiAnalysisPayload);
        setPhase('results');
        setMsg(`تقرير محفوظ · ${prev.percentage}% · ${prev.classification}`);
        setGateReady(true);
        return;
      }

      if (gate.active && isParentPortal) {
        showToast(gate.message);
        if (gate.reason === 'completed' && prev) {
          const result = resultFromStored(prev, band);
          setComputed(result);
          setScores(
            Object.fromEntries(prev.scores.map((x) => [x.criterionId, x.score]))
          );
          setNextDate(
            prev.nextAssessmentDate ||
              suggestNextAssessmentDate(prev.classification)
          );
          if (prev.aiAnalysis) setAi(prev.aiAnalysis as AiAnalysisPayload);
          setPhase('results');
          router.replace('/parent/assessment?view=results');
        } else if (draft?.scores) {
          setScores(draft.scores);
          setNotes(draft.notes || {});
          setStep(draft.step || 0);
          setMsg('تم استئناف التقييم قيد المعالجة');
        }
        setGateReady(true);
        return;
      }

      if (gate.active && !isParentPortal && gate.reason === 'completed' && !wantResults) {
        showToast(gate.message);
        if (prev) {
          const result = resultFromStored(prev, band);
          setComputed(result);
          setScores(
            Object.fromEntries(prev.scores.map((x) => [x.criterionId, x.score]))
          );
          setNextDate(
            prev.nextAssessmentDate ||
              suggestNextAssessmentDate(prev.classification)
          );
          if (prev.aiAnalysis) setAi(prev.aiAnalysis as AiAnalysisPayload);
          setPhase('results');
        }
      } else if (draft?.childId === s.id && draft.scores) {
        setScores(draft.scores);
        setNotes(draft.notes || {});
        setStep(draft.step || 0);
      }

      setGateReady(true);
    } catch {
      setGateReady(true);
    }
    // ageBand intentionally omitted: student drives band after hydrate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, wantResults, isParentPortal]);

  useEffect(() => {
    setScores((prev) => {
      const next = { ...prev };
      for (const c of activeCriteria) {
        if (!(c.id in next)) next[c.id] = null;
      }
      return next;
    });
  }, [activeCriteria]);

  // حفظ مسودة أثناء التقدم
  useEffect(() => {
    if (!gateReady || !student?.id || phase !== 'questionnaire') return;
    const answered = Object.entries(scores).filter(
      ([, v]) => v != null
    ) as Array<[string, number]>;
    if (!answered.length) return;
    saveAssessmentDraft({
      childId: student.id,
      scores: Object.fromEntries(answered),
      notes,
      step,
      updatedAt: new Date().toISOString(),
      status: 'in_progress',
    });
  }, [scores, notes, step, student?.id, phase, gateReady]);

  const scoreList: AssessmentScore[] = useMemo(
    () =>
      activeCriteria.map((c) => ({
        criterionId: c.id,
        score: Number(scores[c.id] ?? 0),
        specialistNotes: notes[c.id] || undefined,
        evidence: evidence[c.id]?.length ? evidence[c.id] : undefined,
      })),
    [activeCriteria, scores, notes, evidence]
  );

  const comparison = useMemo(
    () => (computed ? compareWithPrevious(computed, previous) : null),
    [computed, previous]
  );

  const goals = useMemo(
    () => (computed ? buildProposedGoals(scoreList) : []),
    [computed, scoreList]
  );

  const criterion = activeCriteria[step];
  const isLast = step >= activeCriteria.length - 1;
  const progress = activeCriteria.length
    ? Math.round(((step + 1) / activeCriteria.length) * 100)
    : 0;
  const domainIndex = DOMAINS.indexOf(criterion?.domain || '') + 1;
  const currentAnswered = criterion
    ? scores[criterion.id] != null
    : false;

  const finishQuestionnaire = () => {
    const unanswered = activeCriteria.filter((c) => scores[c.id] == null);
    if (unanswered.length) {
      showToast('يرجى الإجابة على جميع الأسئلة قبل عرض النتائج');
      const idx = activeCriteria.findIndex((c) => scores[c.id] == null);
      if (idx >= 0) setStep(idx);
      return;
    }

    const parentScores = loadStoredParentScores(student?.id);
    const gameScores = loadStoredGameScores(student?.id);
    const fused = fuseAssessmentSources({
      specialistScores: scoreList.map((s) => ({
        criterionId: s.criterionId,
        score: s.score,
      })),
      parentScores,
      gameScores,
    });
    const fusedMap = new Map(
      fused.map((f) => [f.criterionId, f.fusedScore] as const)
    );
    const fusedScores: AssessmentScore[] = activeCriteria.map((c) => {
      const base = scoreList.find((s) => s.criterionId === c.id);
      return {
        criterionId: c.id,
        score: fusedMap.has(c.id)
          ? fusedMap.get(c.id)!
          : Number(base?.score ?? 0),
        specialistNotes: base?.specialistNotes,
        evidence: base?.evidence,
      };
    });
    const result = calculateAssessmentResult(fusedScores, ageBand);
    setDomainSources(domainSourcesFromFusion(fused));
    setComputed(result);
    setNextDate(suggestNextAssessmentDate(result.classification));
    setPhase('results');
    if (student?.id) {
      saveAssessmentDraft({
        childId: student.id,
        scores: Object.fromEntries(
          Object.entries(scores).filter(([, v]) => v != null)
        ) as Record<string, number>,
        notes,
        step,
        updatedAt: new Date().toISOString(),
        status: 'completed_pending_report',
      });
    }
    setMsg(
      `اكتمل الاستبيان — النتيجة ${result.percentage}% · ${result.classification}`
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const runAi = async () => {
    if (!computed) {
      setMsg('أكمل الاستبيان أولاً');
      return;
    }
    setBusyAi(true);
    setMsg('جاري تحليل الدرجات وتوليد الملخص التربوي…');
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scores: scoreList,
          studentName: student?.name,
          childAge: student?.age,
          ageBand,
          birthdate: student?.dob || student?.birthdate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'فشل التحليل');
      setAi(data.ai);
      setMsg(
        data.message ||
          'ظهر تحليل الذكاء الاصطناعي في القسم الأخضر أدناه مع الأهداف وخطة التدخل.'
      );
      setTimeout(() => {
        document
          .getElementById('ai-analysis-panel')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'تعذر التحليل');
    } finally {
      setBusyAi(false);
    }
  };

  const saveAssessment = async () => {
    if (!computed) {
      setMsg('أكمل الاستبيان أولاً');
      return;
    }
    if (!student?.id) {
      setMsg('أضف طالباً أولاً من صفحة التسجيل');
      return;
    }
    setBusySave(true);
    setMsg('');
    try {
      const res = await fetch('/api/airtable/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          scores: scoreList,
          aiAnalysis: ai,
          nextAssessmentDate: nextDate,
          ageBand,
          birthdate: student?.dob || student?.birthdate,
          childAge: student?.age,
        }),
      });
      const data = await res.json();
      if (!res.ok && !data.success) {
        throw new Error(data.error || 'فشل الحفظ');
      }

      const stored: StoredAssessment = {
        id: data.data?.id || data.record?.id || `local_${Date.now()}`,
        studentId: student.id,
        studentName: student.name,
        savedAt: new Date().toISOString(),
        percentage: computed.percentage,
        classification: computed.classification,
        totalScore: computed.totalScore,
        maxScore: computed.maxScore,
        domainAverages: computed.domainAverages,
        scores: scoreList,
        nextAssessmentDate: nextDate,
        aiAnalysis: ai,
      };
      saveStoredAssessment(stored);
      clearAssessmentDraft(student.id);
      setPrevious(stored);
      await fetch('/api/platform/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'assessment',
          id: stored.id,
          studentId: student.id,
          studentName: student.name,
          percentage: computed.percentage,
          classification: computed.classification,
          totalScore: computed.totalScore,
          maxScore: computed.maxScore,
        }),
      }).catch(() => undefined);
      setMsg(`تم حفظ التقييم (${data.source || 'ok'})`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'تعذر الحفظ');
    } finally {
      setBusySave(false);
    }
  };

  const exportPdf = async () => {
    if (!computed) {
      setMsg('أكمل الاستبيان أولاً');
      return;
    }
    try {
      setMsg('جاري إنشاء التقرير العربي…');
      await downloadAssessmentPdf(`taaluf-${student?.name || 'assessment'}.pdf`, {
        studentName: student?.name || 'طالب',
        childAge: student?.age,
        result: computed,
        ai,
        goals,
        nextAssessmentDate: nextDate,
        comparison,
        domainSources,
      });
      await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'view_report',
          entityType: 'report',
          entityId: student?.id || 'report',
        }),
      }).catch(() => undefined);
      setMsg('تم تنزيل التقرير بالعربية');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'تعذر إنشاء PDF');
    }
  };

  if (!gateReady) {
    return (
      <p className="py-16 text-center text-sm text-slate-500">
        جاري تحميل التقييم…
      </p>
    );
  }

  if (phase === 'results' && computed) {
    return (
      <>
        {toast && (
          <div
            role="status"
            className="fixed left-1/2 top-4 z-[60] w-[min(92vw,28rem)] -translate-x-1/2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-950 shadow-lg"
          >
            {toast}
          </div>
        )}
        <ResultsScreen
          studentName={student?.name || 'طالب'}
          childAge={student?.age}
          result={computed}
          goals={goals}
          ai={ai}
          busyAi={busyAi}
          busySave={busySave}
          msg={msg}
          nextDate={nextDate}
          onNextDateChange={setNextDate}
          onRunAi={runAi}
          onSave={saveAssessment}
          onExportPdf={exportPdf}
          domainSources={domainSources}
          onBackToQuestions={() => {
            if (isParentPortal && previous) {
              showToast(
                'لديك تقييم قيد المعالجة، يرجى إكماله أو عرض تقريره أولاً.'
              );
              return;
            }
            setPhase('questionnaire');
            setMsg('');
            setStep(Math.max(0, activeCriteria.length - 1));
          }}
          onBookTeam={() => {
            if (isParentPortal) {
              router.push('/parent/booking');
              return;
            }
            setBookingOpen(true);
          }}
        />

        {bookingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
              <h3 className="text-xl font-bold text-[#0b1f14]">
                حجز موعد — فريق متعدد التخصصات
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                بناءً على نتيجة التقييم ({computed.percentage}% ·{' '}
                {computed.classification}) يُفضَّل فحص تكميلي أكثر تفصيلاً. لأولياء
                الأمور: مسار الحجز الكامل (موعد → دفع → تأكيد) من بوابة الأهل.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <Button
                  onClick={() => {
                    setBookingOpen(false);
                    router.push('/parent/booking');
                  }}
                >
                  فتح شاشة المواعيد والدفع
                </Button>
                <Button variant="ghost" onClick={() => setBookingOpen(false)}>
                  إغلاق
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      {toast && (
        <div
          role="status"
          className="fixed left-1/2 top-4 z-[60] w-[min(92vw,28rem)] -translate-x-1/2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-950 shadow-lg"
        >
          {toast}
        </div>
      )}

      <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-[#2D8B5A]">
          سؤال {step + 1} من {activeCriteria.length}
          {criterion ? ` · ${criterion.domain}` : ''}
          {domainIndex > 0 ? ` (${domainIndex}/${DOMAINS.length})` : ''}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#0b1f14] sm:text-3xl">
          {ASSESSMENT_UI.title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {student
            ? `${student.name}${student.age != null ? ` · ${student.age} سنة` : ''} · فئة عمرية ${ageBand}`
            : `لا طالب نشط — سجّل طالباً لربط التقييم · فئة ${ageBand}`}
        </p>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>تقدم الاستبيان</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-emerald-50">
            <div
              className="h-full rounded-full bg-[#2D8B5A] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {criterion && (
        <div className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-6">
          <CriteriaSlider
            criterion={criterion}
            value={scores[criterion.id] ?? null}
            notes={notes[criterion.id] || ''}
            evidence={evidence[criterion.id] || []}
            onChange={(value) => {
              setScores((prev) => ({ ...prev, [criterion.id]: value }));
              setComputed(null);
              setAi(null);
            }}
            onNotesChange={(text) =>
              setNotes((prev) => ({ ...prev, [criterion.id]: text }))
            }
            onEvidenceChange={(imgs) =>
              setEvidence((prev) => ({ ...prev, [criterion.id]: imgs }))
            }
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-emerald-100 bg-white p-4">
        <Button
          variant="ghost"
          disabled={step === 0 || locked}
          onClick={() => go(() => setStep((s) => Math.max(0, s - 1)))}
        >
          السابق
        </Button>
        <p className="text-xs text-slate-400">
          بعد آخر سؤال تُغلق شاشة الاستبيان وتظهر النتائج والأهداف كاملة
        </p>
        {isLast ? (
          <Button
            disabled={locked || !currentAnswered}
            onClick={finishQuestionnaire}
          >
            إنهاء وعرض النتائج
          </Button>
        ) : (
          <Button
            disabled={locked || !currentAnswered}
            onClick={() => go(() => setStep((s) => s + 1))}
          >
            التالي
          </Button>
        )}
      </div>

      {msg && (
        <p className="text-center text-sm font-medium text-[#2D8B5A]">{msg}</p>
      )}
    </section>
  );
}
