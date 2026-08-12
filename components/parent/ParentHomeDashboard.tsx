'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import ParentPricingCards from '@/components/access/ParentPricingCards';
import { Button } from '@/components/ui/button';
import { loadStoredAssessments } from '@/lib/assessmentHelpers';
import { loadGoalsLocal } from '@/lib/goalsStore';
import { cn } from '@/lib/utils';

type Child = {
  id: string;
  name: string;
  age?: number;
};

const PATH_STEPS = [
  { id: 'screening', label: 'الفرز', href: '/dashboard/screening' },
  {
    id: 'questionnaire',
    label: 'الاستبيان',
    href: '/dashboard/parent-assessment',
  },
  { id: 'games', label: 'الألعاب', href: '/dashboard/games' },
  {
    id: 'report',
    label: 'التقرير',
    href: '/parent/assessment?view=results',
  },
] as const;

export default function ParentHomeDashboard({
  unlocked,
  studentNameFromEntitlements,
}: {
  unlocked: boolean;
  studentNameFromEntitlements?: string;
}) {
  const { data: session } = useSession();
  const [child, setChild] = useState<Child | null>(null);
  const [consented, setConsented] = useState(true);
  const [hasScreening, setHasScreening] = useState(false);
  const [hasParentQ, setHasParentQ] = useState(false);
  const [hasGames, setHasGames] = useState(false);
  const [hasReport, setHasReport] = useState(false);
  const [goalsCount, setGoalsCount] = useState(0);

  useEffect(() => {
    try {
      setConsented(localStorage.getItem('taaluf_consented') === 'true');
      const active = JSON.parse(
        localStorage.getItem('taaluf.activeStudent') || 'null'
      );
      if (active?.id) {
        setChild({
          id: active.id,
          name: active.name || studentNameFromEntitlements || 'طفلك',
          age: active.age,
        });
      } else if (studentNameFromEntitlements) {
        setChild({ id: 'local', name: studentNameFromEntitlements });
      }

      const screening = JSON.parse(
        localStorage.getItem('taaluf.screening.v1') || 'null'
      );
      setHasScreening(Boolean(screening?.result));

      const parentAssess = JSON.parse(
        localStorage.getItem('taaluf.parentAssessment.v1') || '[]'
      );
      const parentDone =
        Array.isArray(parentAssess) && parentAssess.length > 0;
      setHasParentQ(parentDone);

      const games = JSON.parse(
        localStorage.getItem('taaluf.gameSessions.v1') || '[]'
      );
      setHasGames(Array.isArray(games) && games.length > 0);

      const assessments = loadStoredAssessments();
      const childId = active?.id;
      const mine = childId
        ? assessments.filter((a) => a.studentId === childId)
        : assessments;
      setHasReport(mine.length > 0 || parentDone);

      const goals = loadGoalsLocal(childId);
      setGoalsCount(goals.filter((g) => g.status === 'active').length);
    } catch {
      /* ignore */
    }
  }, [studentNameFromEntitlements, unlocked]);

  const doneMap = useMemo(
    () => ({
      screening: hasScreening,
      questionnaire: hasParentQ,
      games: hasGames,
      report: hasReport,
    }),
    [hasScreening, hasParentQ, hasGames, hasReport]
  );

  const completedCount = PATH_STEPS.filter((s) => doneMap[s.id]).length;
  const progressPct = Math.round((completedCount / PATH_STEPS.length) * 100);

  const nextStep = useMemo(() => {
    if (!consented)
      return {
        title: 'أكمل الموافقة قبل البدء',
        body: 'نحتاج موافقتك لحماية بيانات طفلك قبل أي تقييم.',
        href: '/consent',
        cta: 'أوافق وأبدأ',
      };
    if (!child?.id || child.id === 'local')
      return {
        title: 'سجّل بيانات طفلك أولاً',
        body: 'خطوة سريعة لتخصيص المسار حسب عمر الطفل.',
        href: '/parent/register-child',
        cta: 'تسجيل الطفل',
      };
    if (!hasScreening)
      return {
        title: 'ابدأ الفرز الأولي الآن',
        body: '12 سؤالاً فقط · حوالي 5 دقائق · مجاناً.',
        href: '/dashboard/screening',
        cta: 'ابدأ الفرز الآن',
      };
    if (!hasParentQ)
      return {
        title: 'أكمل استبيان الأهل',
        body: 'أسئلة يومية تساعدنا على فهم طفلك بدقة أكبر.',
        href: '/dashboard/parent-assessment',
        cta: 'ابدأ الاستبيان الآن',
      };
    if (!hasGames)
      return {
        title: 'جرّب الألعاب التفاعلية',
        body: 'أنشطة قصيرة تدعم الصورة التربوية لطفلك.',
        href: '/dashboard/games',
        cta: 'افتح الألعاب',
      };
    if (hasReport)
      return {
        title: 'التقييم مكتمل',
        body: 'راجع النتائج وخطة العمل المنزلية. لا حاجة لبدء تقييم جديد.',
        href: '/parent/assessment?view=results',
        cta: 'اطلع على التقرير',
      };
    if (goalsCount > 0)
      return {
        title: 'تابع أهداف طفلك',
        body: 'سجّل ملاحظة اليوم وواصل الخطة التربوية.',
        href: '/dashboard/goals',
        cta: 'عرض الأهداف',
      };
    return {
      title: 'اطّلع على التقرير',
      body: 'راجع النتائج وخطة العمل المنزلية.',
      href: '/parent/assessment?view=results',
      cta: 'اطلع على التقرير',
    };
  }, [
    consented,
    child,
    hasScreening,
    hasParentQ,
    hasGames,
    hasReport,
    goalsCount,
  ]);

  const parentName = session?.user?.name || 'ولي الأمر';
  const childName = child?.name || 'طفلك';

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      <header className="rounded-3xl border border-slate-100 bg-white px-6 py-7 shadow-sm">
        <p className="text-sm font-semibold text-[#2D8B5A]">لوحة ولي الأمر</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight text-[#0b1f14]">
          أهلاً {parentName}
        </h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          مسار واحد واضح لـ <span className="font-semibold text-[#0b1f14]">{childName}</span>
          . أكمل الخطوات بالترتيب.
        </p>
      </header>

      {/* شريط التقدم الأفقي */}
      <div className="rounded-3xl border border-slate-100 bg-white px-5 py-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-[#0b1f14]">مسار التقييم</h2>
          <span className="text-xs font-semibold text-[#2D8B5A]">
            {progressPct}% مكتمل
          </span>
        </div>

        <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#2D8B5A] transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <ol className="grid grid-cols-4 gap-2">
          {PATH_STEPS.map((step, idx) => {
            const done = doneMap[step.id];
            const current =
              !done &&
              PATH_STEPS.slice(0, idx).every((s) => doneMap[s.id]);
            return (
              <li key={step.id} className="text-center">
                <div
                  className={cn(
                    'mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold',
                    done && 'bg-[#2D8B5A] text-white',
                    current && 'bg-[#2D8B5A]/15 text-[#2D8B5A] ring-2 ring-[#2D8B5A]/30',
                    !done && !current && 'bg-slate-100 text-slate-400'
                  )}
                >
                  {done ? '✓' : idx + 1}
                </div>
                <p
                  className={cn(
                    'mt-2 text-[11px] font-semibold leading-4',
                    done || current ? 'text-[#0b1f14]' : 'text-slate-400'
                  )}
                >
                  {step.label}
                </p>
              </li>
            );
          })}
        </ol>
        <p className="mt-4 text-center text-xs text-slate-400">
          الفرز → الاستبيان → الألعاب → التقرير
        </p>
      </div>

      {/* بطاقة الخطوة التالية فقط */}
      <div className="rounded-3xl border border-slate-100 bg-white p-7 shadow-sm">
        <p className="text-sm font-semibold text-[#2D8B5A]">الخطوة التالية</p>
        <h2 className="mt-2 text-2xl font-bold text-[#0b1f14]">
          {nextStep.title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-500">{nextStep.body}</p>
        <Link href={nextStep.href} className="mt-6 block">
          <Button className="h-12 w-full text-base font-bold">
            {nextStep.cta}
          </Button>
        </Link>
      </div>

      <ParentPricingCards />

      <Link
        href="/parent/booking"
        className="block rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-5"
      >
        <h2 className="text-base font-bold text-[#0b1f14]">
          حجز فحص شامل مع فريق متخصص
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          اختياري · بعد إكمال المسار الأساسي
        </p>
      </Link>
    </section>
  );
}
