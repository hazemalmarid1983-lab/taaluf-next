'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/components/LanguageProvider';
import {
  getCriterionLabel,
  getReviewQuestions,
  getReviewQuestionsBySection,
  REVIEW_SECTIONS,
} from '@/lib/consultantRoom/reviewQuestions';
import {
  importReviewBackup,
  reviewBackupFileName,
  serializeReviewBackup,
} from '@/lib/consultantRoom/reviewBackup';
import {
  findFirstUnansweredQuestionId,
  getCriterionReviewStatus,
  getCriterionReviewStatusLabel,
  getQuestionStatus,
  getQuestionStatusLabel,
  getReviewProgressSummary,
  loadReviewResponses,
  upsertReviewAnswer,
  upsertReviewNotes,
  upsertReviewReviewed,
} from '@/lib/consultantRoom/reviewProgress';
import type {
  ReviewAnswer,
  ReviewQuestionDefinition,
  ReviewResponsesState,
  ReviewSectionId,
} from '@/lib/consultantRoom/types';

function groupByCriterion(questions: readonly ReviewQuestionDefinition[]) {
  const groups = new Map<string, ReviewQuestionDefinition[]>();
  for (const question of questions) {
    const key = question.criterionId ?? '__general__';
    const list = groups.get(key) ?? [];
    list.push(question);
    groups.set(key, list);
  }
  return [...groups.entries()].sort(([a], [b]) => {
    if (a === '__general__') return -1;
    if (b === '__general__') return 1;
    return parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10);
  });
}

export default function ConsultantScientificReviewForm() {
  const { dir } = useLanguage();
  const questions = useMemo(() => getReviewQuestions(), []);
  const [responses, setResponses] = useState<ReviewResponsesState>({});
  const [activeSectionId, setActiveSectionId] = useState<ReviewSectionId>(
    REVIEW_SECTIONS[0].id
  );
  const [activeCriterionId, setActiveCriterionId] = useState<string | 'all'>(
    'all'
  );
  const [highlightQuestionId, setHighlightQuestionId] = useState<string | null>(
    null
  );
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  useEffect(() => {
    setResponses(loadReviewResponses());
  }, []);

  const progress = useMemo(
    () => getReviewProgressSummary(responses),
    [responses]
  );

  const sectionQuestions = useMemo(() => {
    const items = getReviewQuestionsBySection(activeSectionId);
    if (activeCriterionId === 'all') return items;
    return items.filter((q) => q.criterionId === activeCriterionId);
  }, [activeSectionId, activeCriterionId]);

  const sectionCriterionIds = useMemo(() => {
    const ids = new Set<string>();
    for (const q of getReviewQuestionsBySection(activeSectionId)) {
      if (q.criterionId) ids.add(q.criterionId);
    }
    return [...ids].sort(
      (a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10)
    );
  }, [activeSectionId]);

  const groupedQuestions = useMemo(
    () => groupByCriterion(sectionQuestions),
    [sectionQuestions]
  );

  const handleAnswer = useCallback(
    (questionId: string, answer: ReviewAnswer) => {
      setResponses((prev) => upsertReviewAnswer(prev, questionId, answer));
    },
    []
  );

  const handleReviewed = useCallback((questionId: string) => {
    setResponses((prev) => upsertReviewReviewed(prev, questionId, true));
  }, []);

  const handleNotesChange = useCallback((questionId: string, notes: string) => {
    setResponses((prev) => upsertReviewNotes(prev, questionId, notes));
  }, []);

  const scrollToQuestion = useCallback((questionId: string) => {
    const node = questionRefs.current[questionId];
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setHighlightQuestionId(questionId);
      window.setTimeout(() => setHighlightQuestionId(null), 2000);
    }
  }, []);

  const handleExportBackup = useCallback(() => {
    const json = serializeReviewBackup(responses);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = reviewBackupFileName();
    anchor.click();
    URL.revokeObjectURL(url);
    setBackupMessage('تم تنزيل نسخة احتياطية من إجابات المراجعة.');
  }, [responses]);

  const handleImportBackup = useCallback(
    async (file: File) => {
      setBackupMessage(null);
      try {
        const raw = await file.text();
        const result = importReviewBackup(raw);
        if (!result.ok) {
          setBackupMessage('تعذّر استيراد الملف — تأكد أنه نسخة احتياطية صالحة من المراجعة.');
          return;
        }
        setResponses(result.state);
        setBackupMessage('تم استيراد النسخة الاحتياطية بنجاح.');
      } catch {
        setBackupMessage('تعذّر قراءة الملف.');
      }
    },
    []
  );

  const handleContinueReview = useCallback(() => {
    const nextId = findFirstUnansweredQuestionId(responses);
    if (!nextId) return;

    const nextQuestion = questions.find((q) => q.id === nextId);
    if (nextQuestion) {
      setActiveSectionId(nextQuestion.sectionId);
      setActiveCriterionId(nextQuestion.criterionId ?? 'all');
      window.setTimeout(() => scrollToQuestion(nextId), 50);
    }
  }, [questions, responses, scrollToQuestion]);

  const globalQuestionOffset = useMemo(() => {
    const currentOrder =
      REVIEW_SECTIONS.find((section) => section.id === activeSectionId)?.order ??
      1;
    return REVIEW_SECTIONS.filter((section) => section.order < currentOrder).reduce(
      (sum, section) => sum + getReviewQuestionsBySection(section.id).length,
      0
    );
  }, [activeSectionId]);

  let questionCounter = globalQuestionOffset;

  return (
    <div dir={dir} className="space-y-6">
      <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm sm:p-7">
        <p className="text-xs font-bold text-[#2E7D8E]">نموذج المراجعة العلمية</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
          المراجعة العلمية
        </h1>
        <p className="mt-2 text-sm font-semibold text-slate-800">
          {progress.answeredCount} / {progress.totalCount} بندًا تمت مراجعته
        </p>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
          نموذج مخصص لمراجعة المنهجية والمحتوى العلمي للمنصة بعد الاطلاع عليها.
          يمكن استكمال المراجعة في أي وقت.
        </p>

        <div
          role="note"
          className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-amber-950"
        >
          هذه الصفحة مخصصة للمراجعة العلمية ولا تمثل اعتمادًا علميًا أو تشخيصيًا
          للمنصة. أي ملاحظة أو قرار نهائي يبقى خاضعًا لمراجعة المستشار العلمي.
        </div>

        <div
          role="note"
          className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-3 text-sm leading-relaxed text-slate-800"
        >
          <p className="font-bold text-slate-900">نطاق المراجعة العلمية الحالي</p>
          <p className="mt-2">يغطي النموذج حالياً المعايير C1–C34.</p>
          <p className="mt-2">
            C35–C40 موجودة في التقييم التشغيلي، لكنها ليست ضمن بنك المراجعة
            الحالي، وسيُحدد نطاق مراجعتها بقرار علمي.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500">حالة المراجعة</p>
            <p className="mt-1 text-base font-bold text-slate-900">
              {progress.statusLabel}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500">البنود</p>
            <p className="mt-1 text-base font-bold text-slate-900">
              {progress.answeredCount} / {progress.totalCount} ({progress.percentage}
              %)
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500">المعايير</p>
            <p className="mt-1 text-base font-bold text-slate-900">
              {progress.reviewedCriteriaCount} / {progress.criteriaWithQuestionsCount}{' '}
              معيارًا
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500">مراجعة جزئية</p>
            <p className="mt-1 text-base font-bold text-slate-900">
              {progress.partiallyReviewedCriteriaCount} معيارًا
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span>التقدم</span>
            <span>
              {progress.answeredCount} من {progress.totalCount}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[#2E7D8E] transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="lg"
            className="w-full sm:w-auto"
            onClick={handleContinueReview}
            disabled={progress.status === 'complete'}
          >
            متابعة المراجعة
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleExportBackup}
          >
            تصدير نسخة احتياطية
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => importInputRef.current?.click()}
          >
            استيراد نسخة احتياطية
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void handleImportBackup(file);
            }}
          />
        </div>
        {backupMessage ? (
          <p className="mt-3 text-sm text-slate-600" role="status">
            {backupMessage}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <p className="mb-3 px-2 text-xs font-semibold text-slate-500">
          أقسام النموذج
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {REVIEW_SECTIONS.map((section) => {
            const sectionQs = getReviewQuestionsBySection(section.id);
            const answered = sectionQs.filter((q) =>
              getQuestionStatus(q, responses[q.id]) === 'answered'
            ).length;
            const isActive = section.id === activeSectionId;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  setActiveSectionId(section.id);
                  setActiveCriterionId('all');
                }}
                className={`min-w-[11rem] shrink-0 rounded-xl border px-3 py-3 text-start transition ${
                  isActive
                    ? 'border-[#2E7D8E] bg-[#2E7D8E]/10 text-slate-900'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="block text-xs font-bold">{section.titleAr}</span>
                <span className="mt-1 block text-[11px] text-slate-500">
                  {sectionQs.length === 0
                    ? 'لا بنود'
                    : `${answered}/${sectionQs.length} مُجاب`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {sectionCriterionIds.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="mb-3 px-2 text-xs font-semibold text-slate-500">
            تصفية حسب المعيار
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCriterionId('all')}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                activeCriterionId === 'all'
                  ? 'border-[#2E7D8E] bg-[#2E7D8E]/10 text-slate-900'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              كل المعايير
            </button>
            {sectionCriterionIds.map((criterionId) => {
              const status = getCriterionReviewStatus(criterionId, responses);
              return (
                <button
                  key={criterionId}
                  type="button"
                  onClick={() => setActiveCriterionId(criterionId)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    activeCriterionId === criterionId
                      ? 'border-[#2E7D8E] bg-[#2E7D8E]/10 text-slate-900'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {criterionId} · {getCriterionReviewStatusLabel(status)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {REVIEW_SECTIONS.find((s) => s.id === activeSectionId)?.titleAr}
          </h2>
        </div>

        {sectionQuestions.length === 0 ? (
          <Card className="border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm leading-relaxed text-slate-600">
              لا توجد بنود في هذا التصفية حالياً.
            </p>
          </Card>
        ) : (
          groupedQuestions.map(([criterionKey, criterionQuestions]) => {
            const criterionId =
              criterionKey === '__general__' ? undefined : criterionKey;
            const criterionStatus = criterionId
              ? getCriterionReviewStatus(criterionId, responses)
              : null;

            return (
              <div key={criterionKey} className="space-y-4">
                {criterionId ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                    <p className="text-sm font-bold text-slate-900">
                      المعيار {criterionId} — {getCriterionLabel(criterionId)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {getCriterionReviewStatusLabel(criterionStatus!)}
                    </p>
                  </div>
                ) : null}

                {criterionQuestions.map((question) => {
                  questionCounter += 1;
                  const response = responses[question.id];
                  const status = getQuestionStatus(question, response);
                  const isHighlighted = highlightQuestionId === question.id;

                  return (
                    <div
                      key={question.id}
                      ref={(node) => {
                        questionRefs.current[question.id] = node;
                      }}
                      className={`scroll-mt-24 transition ${
                        isHighlighted ? 'ring-2 ring-[#2E7D8E]/40 ring-offset-2' : ''
                      }`}
                    >
                      <Card className="border-slate-200 p-5 sm:p-6">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-bold text-[#2E7D8E]">
                            السؤال {questionCounter}
                          </p>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                              status === 'answered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {getQuestionStatusLabel(status)}
                          </span>
                        </div>

                        <p className="mt-3 text-base font-semibold leading-relaxed text-slate-900">
                          {question.question}
                        </p>

                        {question.responseType === 'yes_no' ? (
                          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                            <Button
                              type="button"
                              size="lg"
                              variant={
                                response?.answer === 'yes' ? 'default' : 'outline'
                              }
                              className="min-h-12 flex-1 text-base"
                              onClick={() => handleAnswer(question.id, 'yes')}
                            >
                              نعم
                            </Button>
                            <Button
                              type="button"
                              size="lg"
                              variant={
                                response?.answer === 'no' ? 'default' : 'outline'
                              }
                              className="min-h-12 flex-1 text-base"
                              onClick={() => handleAnswer(question.id, 'no')}
                            >
                              لا
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-5">
                            <p className="mb-3 text-sm text-slate-600">
                              نقطة تحتاج تعليق المستشار
                            </p>
                            <Button
                              type="button"
                              size="lg"
                              variant={response?.reviewed ? 'default' : 'outline'}
                              className="min-h-12 w-full text-base sm:w-auto"
                              onClick={() => handleReviewed(question.id)}
                            >
                              تمت المراجعة
                            </Button>
                          </div>
                        )}

                        <label className="mt-5 block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">
                            ملاحظات / تعديل مقترح (اختياري)
                          </span>
                          <textarea
                            value={response?.notes ?? ''}
                            onChange={(event) =>
                              handleNotesChange(question.id, event.target.value)
                            }
                            rows={4}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-[#2E7D8E] focus:ring-2 focus:ring-[#2E7D8E]/20"
                            placeholder="أضف ملاحظة أو تعديلاً مقترحاً إن رغبت..."
                          />
                        </label>
                      </Card>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
