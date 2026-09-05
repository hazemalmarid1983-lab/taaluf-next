'use client';

import React, { useState } from 'react';
import { ACADEMIC_FULL_QUESTIONS } from '@/lib/academicFullQuestions';
import {
  evaluateComprehensiveAssessment,
  type ComprehensiveAssessmentReport,
} from '@/lib/academicAssessmentEngine';
import { useLanguage } from '@/components/LanguageProvider';
import {
  fillTemplate,
  localizeDomainBadge,
} from '@/lib/academicFullI18n';
import IepReportSheet from '@/components/reports/IepReportSheet';
import { PARENT_ROUTES } from '@/lib/parentJourney';

export default function ComprehensiveAcademicAssessment() {
  const { lang, dir, t } = useLanguage();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [report, setReport] = useState<ComprehensiveAssessmentReport | null>(
    null
  );

  const q = ACADEMIC_FULL_QUESTIONS[currentIdx] || ACADEMIC_FULL_QUESTIONS[0];
  const badge = localizeDomainBadge(q, lang);

  const handleSelect = (score: number) => {
    setSelectedScore(score);
    const updated = { ...answers, [q.id]: score };
    setAnswers(updated);

    setTimeout(() => {
      if (currentIdx < ACADEMIC_FULL_QUESTIONS.length - 1) {
        setCurrentIdx((prev) => prev + 1);
        setSelectedScore(null);
        window.scrollTo(0, 0);
      } else {
        const nextReport = evaluateComprehensiveAssessment(updated, 'الطالب');
        localStorage.setItem(
          'taaluf_comprehensive_academic_report',
          JSON.stringify(nextReport)
        );
        setReport(nextReport);
        setIsFinished(true);
        window.scrollTo(0, 0);
      }
    }, 120);
  };

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-start bg-[#F1F5F9] px-4 py-8 text-slate-900"
      dir={dir}
    >
      <div className="pointer-events-none print-glow absolute right-10 top-16 h-96 w-96 rounded-full bg-teal-400/20 blur-[60px]" />
      <div className="pointer-events-none print-glow absolute bottom-16 left-10 h-96 w-96 rounded-full bg-amber-500/20 blur-[60px]" />

      <div className="relative z-10 w-full max-w-3xl space-y-5">
        {!isFinished ? (
          <>
            <div className="space-y-3 rounded-3xl border border-white/90 bg-white/85 p-6 text-center shadow-xl backdrop-blur-md sm:p-8">
              <div className="flex items-center justify-between text-xs font-bold sm:text-sm">
                <span className="rounded-full border border-[#2E7D8E]/20 bg-[#2E7D8E]/10 px-3.5 py-1 text-[#2E7D8E]">
                  {badge.domainLabel} • {badge.skillName}
                </span>
                <span className="text-slate-500">
                  {fillTemplate(t('itemProgress'), {
                    current: currentIdx + 1,
                    total: ACADEMIC_FULL_QUESTIONS.length,
                  })}
                </span>
              </div>

              <h1 className="pt-1 text-xl font-black leading-relaxed text-slate-900 sm:text-2xl">
                {q.question}
              </h1>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-[#2E7D8E] transition-all duration-500"
                  style={{
                    width: `${((currentIdx + 1) / ACADEMIC_FULL_QUESTIONS.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2.5 rounded-3xl border border-white/90 bg-white/85 p-5 shadow-xl backdrop-blur-md sm:p-6">
              {q.options.map((opt) => {
                const isSelected = selectedScore === opt.score;
                return (
                  <button
                    key={opt.score}
                    type="button"
                    onClick={() => handleSelect(opt.score)}
                    className={`flex w-full items-start gap-3.5 rounded-2xl border-2 p-4 text-start transition-all ${
                      isSelected
                        ? 'scale-[1.01] border-amber-500 bg-amber-50/90 shadow-md'
                        : 'border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500'
                          : 'border-slate-300'
                      }`}
                    >
                      {isSelected && (
                        <span className="block h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <div className="text-sm font-bold text-slate-900 sm:text-base">
                        {opt.label}
                      </div>
                      <div className="text-xs leading-relaxed text-slate-600">
                        {opt.description}
                      </div>
                    </div>
                  </button>
                );
              })}

              <div className="flex items-center justify-between border-t border-slate-200/60 pt-3 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    if (currentIdx > 0) {
                      setCurrentIdx((i) => i - 1);
                      setSelectedScore(null);
                      window.scrollTo(0, 0);
                    }
                  }}
                  disabled={currentIdx === 0}
                  className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-30"
                >
                  {t('prev')}
                </button>
                <span className="font-bold text-slate-400">
                  {fillTemplate(t('percentDone'), {
                    n: Math.round(
                      ((currentIdx + 1) / ACADEMIC_FULL_QUESTIONS.length) * 100
                    ),
                  })}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-5">
            {report ? <IepReportSheet report={report} /> : null}
            <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
              <a
                href={PARENT_ROUTES.academicCard}
                className="inline-block rounded-2xl bg-[#2E7D8E] px-8 py-3.5 text-sm font-bold text-white shadow-md"
              >
                {t('viewPrintCard')}
              </a>
              <a
                href={PARENT_ROUTES.results}
                className="inline-block rounded-2xl border border-[#2E7D8E]/30 bg-white px-6 py-3.5 text-sm font-bold text-[#2E7D8E]"
              >
                {t('comprehensiveReport')}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
