'use client';

import AssessmentRadarChart from '@/components/assessment/RadarChart';
import SchoolPassCard from '@/components/SchoolPassCard';
import PdfExportButton from '@/components/reports/PdfExportButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LEGAL_DISCLAIMERS } from '@/lib/legalContent';
import { SOURCE_LABEL_AR } from '@/lib/fusion';
import type { ProposedGoal } from '@/lib/goalsEngine';
import type { AiAnalysisPayload } from '@/lib/openai';
import { buildSchoolPassData } from '@/lib/schoolPass';
import {
  getReportMetadataByJourney,
  readJourneyMode,
} from '@/lib/parentJourney';
import type { AssessmentResult } from '@/types/taalof';
import { CalendarClock, Sparkles, Target } from 'lucide-react';

type Props = {
  studentName: string;
  childAge?: number;
  result: AssessmentResult;
  goals: ProposedGoal[];
  ai: AiAnalysisPayload | null;
  busyAi: boolean;
  busySave: boolean;
  msg: string;
  nextDate: string;
  onNextDateChange: (v: string) => void;
  onRunAi: () => void;
  onSave: () => void;
  onBackToQuestions: () => void;
  onBookTeam: () => void;
  /** مصادر البيانات لكل مجال: specialist | parent | game */
  domainSources?: Record<string, string[]>;
  emergencyContact?: string;
};

const REC_LABELS: Record<string, string> = {
  special_education: 'تربية خاصة',
  speech: 'نطق وتخاطب',
  psychological: 'نفسي / تربوي',
  occupational: 'وظيفي',
};

export default function ResultsScreen({
  studentName,
  childAge,
  result,
  goals,
  ai,
  busyAi,
  busySave,
  msg,
  nextDate,
  onNextDateChange,
  onRunAi,
  onSave,
  onBackToQuestions,
  onBookTeam,
  domainSources,
  emergencyContact,
}: Props) {
  const schoolPass = buildSchoolPassData({
    childName: studentName,
    ageBand: result.ageBand,
    scores: result.scores,
    emergencyContact,
  });

  return (
    <section className="print-document space-y-6 print:bg-white print:p-0">
      <div className="sticky top-2 z-50 print:hidden">
        <PdfExportButton
          documentTitle={`تقرير_تآلف_${studentName}`}
          label="تنزيل التقرير / بطاقة الدعم (PDF) 📥"
          className="h-14 w-full rounded-2xl bg-amber-500 text-base font-black text-slate-900 shadow-lg hover:bg-amber-400 hover:text-slate-900"
        />
      </div>

      <div
        role="alert"
        className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold leading-7 text-amber-950"
      >
        ⚠️ هذا التقرير أداة تقييم تربوي مساعدة وليس تشخيصاً طبياً. يُنصح بمراجعة
        الأخصائي المؤهل للحصول على تقييم شامل.
      </div>

      <div className="rounded-3xl bg-[#0b1f14] px-6 py-8 text-white sm:px-8">
        <p className="text-sm font-medium text-emerald-200/90">شاشة النتائج</p>
        <p className="mt-2 text-xs font-semibold text-emerald-100/80">
          {getReportMetadataByJourney(readJourneyMode()).reportBadge}
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          {getReportMetadataByJourney(readJourneyMode()).reportTitle}
          {studentName ? ` · ${studentName}` : ''}
          {childAge != null ? ` · ${childAge} سنة` : ''}
        </h1>
        <div
          className="mt-5 inline-flex items-center gap-3 rounded-2xl px-5 py-3 text-lg font-bold"
          style={{
            backgroundColor: `${result.classificationMeta.color}33`,
            color: '#fff',
            border: `1px solid ${result.classificationMeta.color}`,
          }}
        >
          <span style={{ color: result.classificationMeta.color }}>
            {result.percentage}%
          </span>
          <span>·</span>
          <span>{result.classification}</span>
          <span className="text-sm font-normal text-emerald-100/80">
            ({result.totalScore}/{result.maxScore})
          </span>
        </div>
        <p className="mt-4 max-w-2xl text-xs leading-6 text-emerald-100/60">
          {getReportMetadataByJourney(readJourneyMode()).disclaimerText}{' '}
          {LEGAL_DISCLAIMERS.resultsBanner}
        </p>
      </div>

      <div className="grid gap-4 print:hidden sm:grid-cols-2 lg:grid-cols-3">
        <Button onClick={onRunAi} disabled={busyAi} className="h-12 gap-2">
          <Sparkles className="h-4 w-4" />
          {busyAi ? 'جاري التحليل…' : 'تحليل بالذكاء الاصطناعي'}
        </Button>
        <Button
          variant="outline"
          onClick={onSave}
          disabled={busySave}
          className="h-12"
        >
          {busySave ? 'جاري الحفظ…' : 'حفظ التقييم'}
        </Button>
        <Button
          variant="outline"
          className="h-12"
          onClick={() =>
            document
              .getElementById('school-pass-card')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        >
          بطاقة المعلم
        </Button>
      </div>

      {msg && (
        <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-[#2D8B5A] print:hidden">
          {msg}
        </p>
      )}

      {/* ماذا يفعل الذكاء الاصطناعي */}
      <div className="rounded-3xl border border-emerald-100 bg-white p-6 print:hidden">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-emerald-50 p-3 text-[#2D8B5A]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0b1f14]">
              وظيفة تحليل الذكاء الاصطناعي
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              عند الضغط على الزر أعلاه يقوم النظام بقراءة درجات الـ 40 معياراً
              ومتوسط المجالات، ثم يولّد{' '}
              <strong>تقريراً توجيهياً لولي الأمر</strong> وفق دستور تآلف، مع{' '}
              <strong>نقاط قوة</strong>،{' '}
              <strong>مجالات تركيز</strong>، و
              <strong>خطة عمل منزلية</strong>. النتيجة تظهر في القسم الأخضر أدناه
              مباشرة. لا يصدر تشخيصاً طبياً.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-emerald-100 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-[#2D8B5A]" />
              <h2 className="text-xl font-bold text-[#0b1f14]">
                الأهداف المقترحة للعمل مع الطالب
              </h2>
            </div>
            <p className="mb-5 text-sm text-slate-500">
              مستخرجة تلقائياً من المؤشرات ذات الدرجة 2 أو أعلى (أولوية الدعم).
            </p>
            {goals.length === 0 ? (
              <p className="text-sm text-slate-500">
                لا توجد أهداف عالية الأولوية حالياً — الملف ضمن متابعة روتينية.
              </p>
            ) : (
              <ul className="space-y-4">
                {goals.map((g, i) => (
                  <li
                    key={g.id}
                    className="rounded-2xl border border-slate-100 bg-[#F0F9F4] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-slate-900">
                        {i + 1}. {g.title}
                      </p>
                      <span
                        className={
                          g.priority === 'عالية'
                            ? 'rounded-lg bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700'
                            : 'rounded-lg bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800'
                        }
                      >
                        أولوية {g.priority} · {g.score}/3
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{g.domain}</p>
                    {g.why?.trim() ? (
                      <p className="mt-2 text-sm leading-7 text-slate-700">
                        <span className="font-semibold text-[#2D8B5A]">لماذا: </span>
                        {g.why}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm leading-7 text-slate-700">
                      <span className="font-semibold text-[#2D8B5A]">
                        استراتيجية:{' '}
                      </span>
                      {g.strategy}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {ai ? (
            <div
              id="ai-analysis-panel"
              className="scroll-mt-6 rounded-3xl border-2 border-[#2D8B5A] bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold text-[#2D8B5A]">
                نتيجة تحليل الذكاء الاصطناعي
              </h2>
              <p className="mt-3 text-sm leading-8 text-slate-700">{ai.analysis}</p>

              {!!ai.strengths?.length && (
                <div className="mt-5">
                  <p className="text-sm font-bold text-[#2D8B5A]">نقاط القوة</p>
                  <ul className="mt-2 list-disc space-y-1 pr-5 text-sm text-slate-600">
                    {ai.strengths.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!!ai.weaknesses?.length && (
                <div className="mt-5">
                  <p className="text-sm font-bold text-amber-700">مجالات التركيز</p>
                  <ul className="mt-2 list-disc space-y-1 pr-5 text-sm text-slate-600">
                    {ai.weaknesses.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {ai.intervention_plan && (
                <div className="mt-5 rounded-2xl bg-emerald-50 p-4">
                  <p className="text-sm font-bold text-[#2D8B5A]">خطة التدخل</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {ai.intervention_plan}
                  </p>
                </div>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {Object.entries(ai.recommendations || {}).map(([key, val]) =>
                  val ? (
                    <div
                      key={key}
                      className="rounded-2xl border border-slate-100 p-3"
                    >
                      <p className="text-xs font-bold text-[#2D8B5A]">
                        {REC_LABELS[key] || key}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {val}
                      </p>
                    </div>
                  ) : null
                )}
              </div>

              {/* حجز موعد بعد التحليل */}
              <button
                type="button"
                onClick={onBookTeam}
                className="mt-8 flex w-full items-center gap-4 rounded-3xl bg-gradient-to-l from-[#1f6b44] to-[#2D8B5A] p-5 text-start text-white transition hover:brightness-110 print:hidden"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                  <CalendarClock className="h-7 w-7" />
                </span>
                <span>
                  <span className="block text-lg font-bold">
                    حجز موعد مع فريق متعدد التخصصات
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-emerald-50/90">
                    لتقييم/تشخيص أكثر شمولية وتفصيلاً — تربية خاصة، نطق، نفسي
                    تربوي، ووظيفي.
                  </span>
                </span>
              </button>
            </div>
          ) : (
            <div
              id="ai-analysis-panel"
              className="scroll-mt-6 rounded-3xl border-2 border-[#2D8B5A]/45 bg-gradient-to-l from-[#F0F9F4] to-[#FAF7F1] p-6 text-center shadow-sm print:hidden"
            >
              <p className="text-sm font-semibold leading-7 text-[#0b1f14]">
                لم يُنفَّذ التحليل التربوي بعد. اضغط الزر لاستخراج الملخص
                التوجيهي وخطة التدخل المنزلية.
              </p>
              <Button
                onClick={onRunAi}
                disabled={busyAi}
                className="mt-4 h-12 gap-2 bg-[#2D8B5A] px-6 text-base font-bold hover:bg-[#247a4d]"
              >
                <Sparkles className="h-4 w-4" />
                {busyAi
                  ? 'جاري التحليل…'
                  : '🤖 توليد التحليل التربوي الذكي'}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-emerald-100 bg-white p-6">
            <h2 className="text-xl font-bold text-[#0b1f14]">متوسط المجالات</h2>
            <AssessmentRadarChart domainAverages={result.domainAverages} />
            <ul className="mt-4 space-y-3">
              {Object.entries(result.domainAverages).map(([domain, avg]) => (
                <li
                  key={domain}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span>{domain}</span>
                    {(domainSources?.[domain] || []).map((src) => (
                      <span
                        key={`${domain}-${src}`}
                        className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#2D8B5A]"
                      >
                        {SOURCE_LABEL_AR[src] || src}
                      </span>
                    ))}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {avg.toFixed(2)} / 3
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white p-6 print:hidden">
            <Label htmlFor="nextDate">تاريخ التقييم القادم</Label>
            <Input
              id="nextDate"
              type="date"
              className="mt-2"
              value={nextDate}
              onChange={(e) => onNextDateChange(e.target.value)}
            />
            <p className="mt-2 text-xs text-slate-400">
              اقتراح تلقائي حسب شدة التصنيف (يمكن تعديله)
            </p>
          </div>

          <Button variant="ghost" className="w-full print:hidden" onClick={onBackToQuestions}>
            العودة لتعديل الإجابات
          </Button>
        </div>
      </div>

      <div className="school-pass-host">
        <SchoolPassCard data={schoolPass} />
      </div>
    </section>
  );
}
