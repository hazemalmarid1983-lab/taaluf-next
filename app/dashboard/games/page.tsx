'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CHILD_VERBAL_ASSENT } from '@/lib/legalContent';
import { useLanguage } from '@/components/LanguageProvider';
import {
  PARENT_ROUTES,
  readParentJourneyState,
  skipOptionalGames,
} from '@/lib/parentJourney';
import { SENSORY_MATCHING_PAGE } from '@/lib/sensoryMatching';
import { startParentGamesSequenceAtHref } from '@/lib/parentGamesSequence';

export default function GamesHubPage() {
  const { t, dir } = useLanguage();
  const [readyForAssessment, setReadyForAssessment] = useState(false);
  const [independent, setIndependent] = useState(false);

  useEffect(() => {
    try {
      const journey = readParentJourneyState();
      setIndependent(journey.selectedMode === 'independent_parent');
      setReadyForAssessment(
        journey.selectedMode === 'independent_parent'
          ? journey.hasParentQ
          : journey.hasGames && !journey.hasReport
      );
    } catch {
      setReadyForAssessment(false);
    }
  }, []);

  return (
    <section className="mx-auto max-w-3xl space-y-6" dir={dir}>
      <div>
        <p className="text-sm font-semibold text-[#2E7D8E]">{t('games')}</p>
        <h1 className="mt-1 text-3xl font-bold text-[#0b1f14]">
          {t('gamesHubTitle')}
        </h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          {t('gamesHubIntro')}
        </p>
        <p className="mt-3 rounded-2xl border border-[#2D8B5A]/20 bg-white px-4 py-3 text-sm leading-7 text-slate-600">
          {CHILD_VERBAL_ASSENT}
        </p>
      </div>

      <article className="overflow-hidden rounded-3xl border-2 border-indigo-400/80 bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950 p-6 text-white shadow-lg">
        <p className="text-xs font-semibold text-indigo-200">جديد · جناح حسي</p>
        <h2 className="mt-1 text-2xl font-black">الغرف الحسية والتنظيم الانفعالي</h2>
        <p className="mt-1 text-sm font-semibold text-indigo-100">
          🫧 فقاعات · 🌌 نجوم وتنفس · ✨ رسم ضوئي
        </p>
        <p className="mt-3 text-sm leading-7 text-white/85">
          ثلاث غرف ملء الشاشة مع حماية حسية، مؤقت جلسة، وتسجيل مؤشر الهدوء
          للربط بملف الطفل.
        </p>
        <Link
          href="/sensory-rooms"
          className="mt-5 inline-block rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-indigo-900"
        >
          ادخل الجناح الحسي
        </Link>
      </article>

      <article className="overflow-hidden rounded-3xl border-2 border-[#2E7D8E] bg-gradient-to-br from-[#042F2E] via-[#0E7490] to-[#164E63] p-6 text-white shadow-lg">
        <p className="text-xs font-semibold text-teal-100">النشاط الحسي التفاعلي</p>
        <h2 className="mt-1 text-2xl font-black">الغرفة الحسية</h2>
        <p className="mt-1 text-sm font-semibold text-teal-100">
          🐟 بحيرة الأسماك · 🫧 أنبوب الفقاعات
        </p>
        <p className="mt-3 text-sm leading-7 text-white/85">
          لمس السمكة للصيد، وتموجات الماء في الفراغ. هدير ماء هادئ ومؤثرات بصرية
          مهدئة — ليست علاجاً طبياً.
        </p>
        <Link
          href="/sensory-room"
          onClick={() => startParentGamesSequenceAtHref('/sensory-room')}
          className="mt-5 inline-block rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#0E7490]"
        >
          ادخل الغرفة الحسية
        </Link>
      </article>

      <article className="rounded-3xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 shadow-sm">
        <p className="text-xs font-semibold text-amber-800">سلسلة جديدة</p>
        <h2 className="mt-1 text-2xl font-black text-[#0b1f14]">
          مطابقة الصور والتعريف الصوتي
        </h2>
        <p className="mt-1 text-sm font-semibold text-amber-800">
          🐱 حيوانات · 🍎 فواكه · 🥄 أدوات يومية · 🚗 وسائل نقل
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          اضغط أو اسحب البطاقة. عند المطابقة الصحيحة يُنطق الاسم بالعربية مع نغمة
          تعزيز. يتدرج النشاط من تطابق الصورة طبق الأصل إلى تطابق المجموعات
          الضمنية.
        </p>
        <Link
          href={SENSORY_MATCHING_PAGE}
          onClick={() => startParentGamesSequenceAtHref(SENSORY_MATCHING_PAGE)}
          className="mt-5 inline-block rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white"
        >
          ابدأ سلسلة المطابقة
        </Link>
      </article>

      {independent && (
        <button
          type="button"
          className="text-sm font-semibold text-[#2E7D8E] underline"
          onClick={() => {
            skipOptionalGames();
            window.location.href = PARENT_ROUTES.report;
          }}
        >
          تخطّي الأنشطة والانتقال للتقرير الأسري
        </button>
      )}

      {readyForAssessment && (
        <Link
          href={independent ? PARENT_ROUTES.report : PARENT_ROUTES.assessment}
          className="block"
        >
          <Button className="h-12 w-full text-base font-bold">
            {independent
              ? 'المتابعة للتقرير التوجيهي الأسري'
              : 'المتابعة للتقييم التربوي'}
          </Button>
        </Link>
      )}
    </section>
  );
}
