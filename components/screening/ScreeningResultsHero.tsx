'use client';

import Link from 'next/link';
import type { ScreeningResult } from '@/lib/screeningEngine';
import { bandLabelAr } from '@/lib/screeningEngine';

const paymentsOff =
  process.env.NEXT_PUBLIC_PAYMENTS_DISABLED === 'true' ||
  process.env.NEXT_PUBLIC_TAALUF_PILOT_MODE === 'true';

type Tone = 'green' | 'yellow' | 'red' | 'locked';

type ResultCard = {
  id: string;
  title: string;
  status: string;
  hint: string;
  tone: Tone;
  locked?: boolean;
};

const TONE_BORDER: Record<Tone, string> = {
  green: 'border-green-500',
  yellow: 'border-yellow-400',
  red: 'border-red-500',
  locked: 'border-cyan-800/60',
};

const TONE_TEXT: Record<Tone, string> = {
  green: 'text-green-400',
  yellow: 'text-yellow-400',
  red: 'text-red-400',
  locked: 'text-cyan-700',
};

/** تحويل نسبة القلق (أعلى = أكثر حاجة) إلى تسمية العرض */
function statusFromPercent(scorePercent: number): {
  status: string;
  tone: Tone;
  hint: string;
} {
  if (scorePercent < 30) {
    return {
      status: 'مستقر',
      tone: 'green',
      hint: 'المؤشرات ضمن المدى المتوازن حالياً',
    };
  }
  if (scorePercent < 55) {
    return {
      status: 'بحاجة مراقبة',
      tone: 'yellow',
      hint: 'يُفضّل المتابعة بدعم تربوي موجّه',
    };
  }
  return {
    status: 'تدخل عاجل',
    tone: 'red',
    hint: 'يُوصى بالانتقال إلى التقييم التربوي الكامل',
  };
}

const DIM_TITLE: Record<string, string> = {
  linguistic: 'النطق والتخاطب',
  behavioral: 'التربية الخاصة',
  cognitive: 'الجانب المعرفي',
  motor: 'المهارات الحركية',
};

const LOCKED_TEASERS: ResultCard[] = [
  {
    id: 'psych',
    title: 'الجانب النفسي',
    status: 'مقفل',
    hint: 'متاح في التقرير الكامل',
    tone: 'locked',
    locked: true,
  },
  {
    id: 'social',
    title: 'التواصل الاجتماعي',
    status: 'مقفل',
    hint: 'متاح في التقرير الكامل',
    tone: 'locked',
    locked: true,
  },
  {
    id: 'restricted',
    title: 'السلوك المقيد',
    status: 'مقفل',
    hint: 'متاح في التقرير الكامل',
    tone: 'locked',
    locked: true,
  },
  {
    id: 'adaptive',
    title: 'التكيف اليومي',
    status: 'مقفل',
    hint: 'متاح في التقرير الكامل',
    tone: 'locked',
    locked: true,
  },
];

function buildCards(result: ScreeningResult): ResultCard[] {
  const free = result.domainScores.map((d) => {
    const mapped = statusFromPercent(d.scorePercent);
    return {
      id: d.dimension,
      title: DIM_TITLE[d.dimension] || d.label_ar,
      status: mapped.status,
      hint: `${mapped.hint} · ${d.scorePercent}%`,
      tone: mapped.tone,
    };
  });
  return [...free, ...LOCKED_TEASERS];
}

export default function ScreeningResultsHero({
  result,
  msg,
  onRetake,
}: {
  result: ScreeningResult;
  msg?: string;
  onRetake?: () => void;
}) {
  const cards = buildCards(result);
  const nextHref = paymentsOff
    ? '/dashboard/parent-assessment'
    : '/parent/pay-assessment';

  const print = () => {
    window.print();
  };

  return (
    <div className="screening-results-print -mx-4 min-h-[70vh] bg-[#0d1a1f] px-4 py-8 text-white sm:-mx-6 sm:px-6 md:rounded-3xl">
      <div className="mx-auto w-full max-w-5xl rounded-3xl border border-[#2a4a55] bg-[#15262d] p-6 shadow-2xl sm:p-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-cyan-300 sm:text-3xl">
              نتائج الفحص الأولي لطفلك
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              المؤشر العام: {result.overall}% · {bandLabelAr(result.band)}
            </p>
          </div>
          <span className="rounded-full bg-gray-700 px-4 py-1 text-sm text-gray-300">
            نسخة مجانية
          </span>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`rounded-xl border-r-4 bg-[#0e1a20] p-4 transition hover:bg-[#1a2f38] ${TONE_BORDER[card.tone]} ${
                card.locked ? 'opacity-70' : ''
              }`}
            >
              <h3 className="text-sm text-gray-400">{card.title}</h3>
              <p className={`mt-1 text-2xl font-bold ${TONE_TEXT[card.tone]}`}>
                {card.status}
              </p>
              <p className="mt-2 text-xs text-gray-500">{card.hint}</p>
            </div>
          ))}
        </div>

        <div className="my-10 h-px w-full bg-gradient-to-r from-transparent via-cyan-700 to-transparent" />

        <div className="relative overflow-hidden rounded-2xl border border-[#2a4a55] bg-[#0a151a] p-6 shadow-inner sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-900/10 to-transparent" />

          <div className="relative z-10 space-y-4 text-center">
            <div className="mb-2 flex justify-center">
              <span className="rounded-full border border-cyan-700/50 bg-cyan-800/40 px-3 py-1 text-xs text-cyan-300">
                اكتشف المزيد عن طفلك
              </span>
            </div>

            <h2 className="text-2xl font-bold leading-tight text-gray-100 md:text-3xl">
              النتائج التي تراها ليست سوى القشرة الخارجية.
              <br />
              <span className="text-cyan-300">
                طفلك يحاول إخبارك بشيء أعمق.
              </span>
            </h2>

            <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-400">
              أكمل المسار لتحصل على دليلك التربوي المتقدم، وتعرف خارطة الطريق
              التي تساعدك على فهم طفلك ودعمه اليوم.
            </p>

            <div className="pt-6">
              <Link
                href={nextHref}
                className="inline-block rounded-full bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] px-10 py-4 text-lg font-bold text-[#0f172a] shadow-[0_0_20px_rgba(251,191,36,0.3)] transition hover:scale-105 hover:from-[#f59e0b] hover:to-[#d97706] active:scale-95"
              >
                {paymentsOff
                  ? 'افتح التقييم التربوي الكامل'
                  : 'احصل على التقرير الكامل الآن'}
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-xs text-gray-500">
              <button
                type="button"
                onClick={print}
                className="underline transition hover:text-gray-300"
              >
                اطبع النتيجة الحالية
              </button>
              {onRetake ? (
                <button
                  type="button"
                  onClick={onRetake}
                  className="underline transition hover:text-gray-300"
                >
                  إعادة الفرز
                </button>
              ) : null}
            </div>

            {msg ? (
              <p className="pt-2 text-sm text-cyan-400/80">{msg}</p>
            ) : null}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .screening-results-print,
          .screening-results-print * {
            visibility: visible;
          }
          .screening-results-print {
            position: absolute;
            inset: 0;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
