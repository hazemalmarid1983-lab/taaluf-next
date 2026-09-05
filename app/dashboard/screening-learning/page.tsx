'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useStepNav } from '@/hooks/useStepNav';
import {
  evaluateLearningScreening,
  type LearningScreeningResult,
} from '@/lib/learningScreeningEngine';
import AcademicAccommodationsCard from '@/components/reports/AcademicAccommodationsCard';
import PdfExportButton from '@/components/reports/PdfExportButton';
import { useLanguage } from '@/components/LanguageProvider';
import { localizeLearningQuestion } from '@/lib/i18n/learningScreeningI18n';
import { LEARNING_SCREENING_QUESTIONS } from '@/lib/learningScreeningQuestions';
import { PARENT_ROUTES, readActiveChild, unlockFullPath } from '@/lib/parentJourney';

const STORE_KEY = 'taaluf.learningScreening.v1';
const STORE_KEY_ALIAS = 'taaluf_learning_screening_answers';
const TOTAL = LEARNING_SCREENING_QUESTIONS.length;

type StoredPayload = {
  childId?: string;
  answers?: Record<string, number>;
  result?: LearningScreeningResult;
  savedAt?: string;
};

function readActiveChildId() {
  try {
    const active = JSON.parse(
      localStorage.getItem('taaluf.activeStudent') || 'null'
    );
    return active?.id ? String(active.id) : '';
  } catch {
    return '';
  }
}

function payloadMatchesChild(payload: StoredPayload | null, childId: string) {
  if (!payload?.result?.domainResults && !payload?.answers) return false;
  if (!childId || !payload.childId) return true;
  return payload.childId === childId || payload.childId === 'child_local';
}

export default function LearningScreeningPage() {
  const { lang, dir, t } = useLanguage();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<LearningScreeningResult | null>(null);
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState('');
  const { locked, go } = useStepNav(400);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advancingRef = useRef(false);

  useEffect(() => {
    try {
      const childId = readActiveChildId();
      const payload = JSON.parse(
        localStorage.getItem(STORE_KEY) || 'null'
      ) as StoredPayload | null;
      if (payloadMatchesChild(payload, childId)) {
        const computed =
          payload?.result ||
          (payload?.answers ? evaluateLearningScreening(payload.answers) : null);
        if (computed) {
          setAnswers(payload?.answers || {});
          setResult(computed);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const item = LEARNING_SCREENING_QUESTIONS[step]
    ? localizeLearningQuestion(LEARNING_SCREENING_QUESTIONS[step], lang)
    : undefined;
  const progress = Math.round(((step + 1) / TOTAL) * 100);
  const selectedScore = item ? answers[item.id] : undefined;
  const answered = selectedScore != null;
  const activeChild = ready ? readActiveChild() : null;

  const persist = (nextAnswers: Record<string, number>) => {
    const computed = evaluateLearningScreening(nextAnswers);
    const childId = readActiveChildId() || 'child_local';
    const payload: StoredPayload = {
      childId,
      answers: nextAnswers,
      result: computed,
      savedAt: computed.completedAt,
    };
    localStorage.setItem(STORE_KEY, JSON.stringify(payload));
    localStorage.setItem(STORE_KEY_ALIAS, JSON.stringify(nextAnswers));
    unlockFullPath();
    return computed;
  };

  const finish = (nextAnswers = answers) => {
    const missing = LEARNING_SCREENING_QUESTIONS.filter(
      (q) => nextAnswers[q.id] == null
    );
    if (missing.length > 0) {
      const first = LEARNING_SCREENING_QUESTIONS.findIndex(
        (q) => nextAnswers[q.id] == null
      );
      setMsg(t('remainingItems', { n: missing.length }));
      if (first >= 0) setStep(first);
      advancingRef.current = false;
      return;
    }
    const computed = persist(nextAnswers);
    setResult(computed);
    setMsg(t('savedAcademic'));
    advancingRef.current = false;
    window.scrollTo(0, 0);
  };

  const handleSelect = (score: number) => {
    if (!item || advancingRef.current) return;
    setMsg('');
    const nextAnswers = { ...answers, [item.id]: score };
    setAnswers(nextAnswers);

    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advancingRef.current = true;
    advanceTimerRef.current = setTimeout(() => {
      if (step < TOTAL - 1) {
        setStep((prev) => prev + 1);
        window.scrollTo(0, 0);
        advancingRef.current = false;
      } else {
        finish(nextAnswers);
      }
    }, 120);
  };

  const retake = () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advancingRef.current = false;
    localStorage.removeItem(STORE_KEY);
    localStorage.removeItem(STORE_KEY_ALIAS);
    setAnswers({});
    setResult(null);
    setStep(0);
    setMsg('');
    window.scrollTo(0, 0);
  };

  if (!ready) {
    return (
      <p className="py-16 text-center text-sm text-slate-500">
        {t('loadingAcademic')}
      </p>
    );
  }

  return (
    <div
      className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-1 py-4 text-slate-900 sm:py-8"
      dir={dir}
    >
      <div className="pointer-events-none print-glow absolute -right-20 top-1/4 h-96 w-96 rounded-full bg-teal-400/20 blur-[60px]" />
      <div className="pointer-events-none print-glow absolute -left-20 bottom-1/4 h-96 w-96 rounded-full bg-amber-500/20 blur-[60px]" />

      <div className="relative z-10 w-full max-w-3xl space-y-6">
        {result ? (
          <>
          <div className="sticky top-2 z-50 print:hidden">
            <PdfExportButton
              documentTitle={`نتيجة_الفرز_الأكاديمي_${activeChild?.name || 'تآلف'}`}
              label="تنزيل التقرير / بطاقة الدعم (PDF) 📥"
              className="h-14 w-full rounded-2xl bg-amber-500 text-base font-black text-slate-900 shadow-lg hover:bg-amber-400 hover:text-slate-900"
            />
          </div>
          <div className="print-document space-y-6 rounded-3xl border border-white/90 bg-white/85 p-8 text-center shadow-[0_16px_50px_rgba(0,0,0,0.08)] backdrop-blur-md print:bg-white print:p-0 print:shadow-none sm:p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-4xl text-amber-600">
              📑
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {t('academicIndicators')}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {result.overallRiskText} •{' '}
                {t('totalScoreOf', {
                  score: result.totalScore,
                  max: result.maxTotalScore,
                })}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2 text-right sm:grid-cols-2">
              {Object.values(result.domainResults).map((domain) => {
                const elevated = domain.level === 'high';
                return (
                  <div
                    key={domain.domain}
                    className={`rounded-2xl border p-4 ${
                      elevated
                        ? 'border-amber-200 bg-amber-50/80'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs text-slate-500">
                      {domain.label}
                    </span>
                    <strong className="text-base text-slate-800">
                      {t('scoreOf', {
                        score: domain.score,
                        max: domain.maxScore,
                      })}
                    </strong>
                    <div className="mt-1 text-xs font-semibold text-[#2E7D8E]">
                      {domain.levelText}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                      {domain.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <p className="text-xs leading-relaxed text-slate-500">
              {t('academicDisclaimer')}
            </p>

            {msg && (
              <p className="text-sm font-medium text-[#2D8B5A]">{msg}</p>
            )}

            <div className="flex flex-col gap-3 pt-2 print:hidden sm:flex-row">
              <Link
                href={PARENT_ROUTES.academicCard}
                className="flex-1 rounded-2xl bg-gradient-to-r from-[#2E7D8E] to-teal-700 py-3.5 text-center font-bold text-white shadow-md transition"
              >
                {t('openSupportPlan')}
              </Link>
              {result.recommendFullAssessment && (
                <Link
                  href={PARENT_ROUTES.academicAssessment}
                  className="rounded-2xl border border-[#2E7D8E]/30 bg-white px-6 py-3.5 text-center font-bold text-[#2E7D8E]"
                >
                  {t('completeFullAssessment')}
                </Link>
              )}
              <button
                type="button"
                onClick={retake}
                className="rounded-2xl bg-slate-200/80 px-6 py-3.5 font-bold text-slate-700 transition hover:bg-slate-300"
              >
                {t('retakeScreening')}
              </button>
            </div>
          </div>
            <AcademicAccommodationsCard
              childName={activeChild?.name || 'الطالب / الطالبة'}
              gradeLevel={
                activeChild?.age
                  ? `العمر ${activeChild.age} سنة`
                  : 'المرحلة الابتدائية'
              }
              result={result}
            />
          </>
        ) : (
          <>
            <div className="space-y-4 rounded-3xl border border-white/90 bg-white/80 p-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-md sm:p-10">
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-amber-800">
                  {item?.domainLabel}
                </span>
                <span className="font-semibold text-slate-500">
                  {t('questionOf', { current: step + 1, total: TOTAL })}
                </span>
              </div>

              <h1 className="pt-2 text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">
                {item?.question || item?.text}
              </h1>
              <p className="text-sm text-slate-500 sm:text-base">
                {t('chooseClosest')}
              </p>

              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-200/70">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-[#2E7D8E] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-3xl border border-white/90 bg-white/80 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-md sm:p-8">
              <span className="mb-2 block text-sm font-bold text-slate-600">
                {t('chooseDifficulty')}
              </span>

              {item?.options.map((opt) => {
                const isSelected = selectedScore === opt.score;
                return (
                  <button
                    key={opt.score}
                    type="button"
                    onClick={() => handleSelect(opt.score)}
                    className={`flex w-full items-start gap-4 rounded-2xl border-2 p-5 text-start transition-all ${
                      isSelected
                        ? 'scale-[1.01] border-amber-500 bg-amber-50/80 shadow-md'
                        : 'border-slate-200/80 bg-white/70 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div
                      className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500'
                          : 'border-slate-300'
                      }`}
                    >
                      {isSelected && (
                        <span className="block h-2.5 w-2.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="text-base font-semibold text-slate-900 sm:text-lg">
                        {opt.label}
                      </div>
                      <div className="text-xs font-normal leading-relaxed text-slate-600 sm:text-sm">
                        {opt.description}
                      </div>
                    </div>
                  </button>
                );
              })}

              {msg && (
                <p className="pt-1 text-center text-sm font-medium text-amber-800">
                  {msg}
                </p>
              )}

              <div className="flex items-center justify-between gap-3 pt-4">
                <button
                  type="button"
                  disabled={step === 0 || locked}
                  onClick={() => {
                    if (advanceTimerRef.current) {
                      clearTimeout(advanceTimerRef.current);
                    }
                    advancingRef.current = false;
                    go(() => setStep((s) => Math.max(0, s - 1)));
                  }}
                  className="rounded-2xl px-5 py-3 text-sm font-bold text-slate-500 transition hover:bg-white/70 disabled:opacity-40"
                >
                  {t('prev')}
                </button>
                <button
                  type="button"
                  disabled={locked || !answered}
                  onClick={() => {
                    if (!answered) {
                      setMsg(t('chooseAnswerFirst'));
                      return;
                    }
                    if (step >= TOTAL - 1) {
                      finish();
                      return;
                    }
                    go(() => setStep((s) => Math.min(TOTAL - 1, s + 1)));
                  }}
                  className={`rounded-2xl px-8 py-3.5 text-base font-bold shadow-lg transition-all ${
                    answered
                      ? 'scale-[1.02] bg-gradient-to-r from-amber-500 to-[#2E7D8E] text-white'
                      : 'cursor-not-allowed bg-slate-300 text-slate-500'
                  }`}
                >
                  {step >= TOTAL - 1 ? t('finishResults') : t('next')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
