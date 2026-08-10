'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import ParentPricingCards from '@/components/access/ParentPricingCards';
import { Button } from '@/components/ui/button';
import { loadStoredAssessments } from '@/lib/assessmentHelpers';
import { loadGoalsLocal } from '@/lib/goalsStore';

type Child = {
  id: string;
  name: string;
  age?: number;
};

function CircularGauge({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32">
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="#E7F5EE"
        strokeWidth="10"
      />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="#2D8B5A"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 60 60)"
      />
      <text
        x="60"
        y="66"
        textAnchor="middle"
        className="fill-[#0b1f14] text-xl font-bold"
        fontSize="22"
        fontWeight="700"
      >
        {pct}%
      </text>
    </svg>
  );
}

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
  const [progress, setProgress] = useState(0);
  const [events, setEvents] = useState<
    Array<{ title: string; at: string }>
  >([]);
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

      const assessments = loadStoredAssessments();
      const childId = active?.id;
      const mine = childId
        ? assessments.filter((a) => a.studentId === childId)
        : assessments;
      const hasAssessment = mine.length > 0;

      let p = 10;
      if (screening?.result) p += 20;
      if (parentDone) p += 20;
      if (hasAssessment) p += 35;
      if (unlocked) p += 15;
      setProgress(Math.min(100, p));

      const goals = loadGoalsLocal(childId);
      setGoalsCount(goals.filter((g) => g.status === 'active').length);

      const feed: Array<{ title: string; at: string }> = [];
      if (screening?.savedAt)
        feed.push({ title: 'اكتمل الفرز الأولي', at: screening.savedAt });
      for (const a of mine.slice(0, 3)) {
        feed.push({
          title: `تقييم محفوظ · ${a.percentage}%`,
          at: a.savedAt,
        });
      }
      const games = JSON.parse(
        localStorage.getItem('taaluf.gameSessions.v1') || '[]'
      );
      if (Array.isArray(games)) {
        for (const g of games.slice(0, 2)) {
          feed.push({
            title: `جلسة لعبة · ${g.gameCode || 'game'}`,
            at: g.endedAt || g.startedAt || new Date().toISOString(),
          });
        }
      }
      setEvents(
        feed
          .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
          .slice(0, 5)
      );
    } catch {
      /* ignore */
    }
  }, [studentNameFromEntitlements, unlocked]);

  const statusLabel = useMemo(() => {
    if (goalsCount > 0) return 'خطة نشطة';
    if (unlocked && progress >= 70) return 'متابعة شهرية';
    return 'قيد التقييم';
  }, [goalsCount, unlocked, progress]);

  const nextStep = useMemo(() => {
    if (!consented)
      return {
        title: 'أكمل الموافقة قبل البدء',
        href: '/consent',
        cta: 'الموافقة',
      };
    if (!hasScreening)
      return {
        title: 'أكمل الفرز الأولي (5 دقائق)',
        href: '/dashboard/screening',
        cta: 'ابدأ الفرز',
      };
    if (!unlocked)
      return {
        title: 'ابدأ التقييم الشامل',
        href: '/parent/pay-assessment',
        cta: 'ادفع وابدأ',
      };
    if (!hasParentQ)
      return {
        title: 'أكمل استبيان الأهل',
        href: '/dashboard/parent-assessment',
        cta: 'الاستبيان',
      };
    if (goalsCount > 0)
      return {
        title: 'سجّل ملاحظة اليوم',
        href: '/dashboard/goals',
        cta: 'الأهداف',
      };
    return {
      title: 'راجع التقرير',
      href: '/parent/assessment',
      cta: 'التقرير',
    };
  }, [consented, hasScreening, unlocked, hasParentQ, goalsCount]);

  const parentName = session?.user?.name || 'ولي الأمر';
  const childName = child?.name || 'طفلك';

  return (
    <section className="space-y-6">
      {!consented && (
        <Link
          href="/consent"
          className="block rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950"
        >
          أكمل الموافقة قبل البدء →
        </Link>
      )}

      <div className="rounded-3xl bg-white p-7 shadow-sm">
        <h1 className="text-3xl font-bold text-[#0b1f14]">
          أهلاً {parentName}، كيف حال {childName} اليوم؟
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          الحالة الحالية:{' '}
          <span className="font-semibold text-[#2D8B5A]">{statusLabel}</span>
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-emerald-100 bg-white p-6">
          <div className="flex flex-wrap items-center gap-6">
            <CircularGauge value={progress} />
            <div>
              <h2 className="text-xl font-bold text-[#0b1f14]">تقدّم التقييم</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                أكمل الخطوات بالترتيب للحصول على تقرير مدمج من الأخصائي والأهل
                والألعاب.
              </p>
              <Link href={nextStep.href} className="mt-4 inline-block">
                <Button>{nextStep.cta}</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-2xl font-bold text-[#2D8B5A]">
              {(childName || 'ط').slice(0, 1)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0b1f14]">{childName}</h2>
              <p className="text-sm text-slate-500">
                {child?.age != null ? `${child.age} سنة` : 'العمر غير محدد'} ·{' '}
                {statusLabel}
              </p>
            </div>
          </div>
          {!child?.id || child.id === 'local' ? (
            <Link
              href="/parent/register-child"
              className="mt-4 inline-block text-sm font-semibold text-[#2D8B5A]"
            >
              سجّل بيانات الطفل ←
            </Link>
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl bg-[#2D8B5A] p-6 text-white">
        <p className="text-sm text-emerald-100">الخطوة التالية</p>
        <h2 className="mt-1 text-2xl font-bold">{nextStep.title}</h2>
        <Link href={nextStep.href} className="mt-4 inline-block">
          <Button className="bg-white text-[#1f6b44] hover:bg-emerald-50">
            {nextStep.cta}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { href: '/dashboard/screening', label: 'الفرز', icon: '①' },
          {
            href: '/dashboard/parent-assessment',
            label: 'الاستبيان',
            icon: '②',
          },
          { href: '/dashboard/games', label: 'الألعاب', icon: '③' },
          {
            href: unlocked ? '/parent/assessment' : '/parent/pay-assessment',
            label: 'التقرير',
            icon: '④',
          },
        ].map((a) => (
          <Link
            key={a.href + a.label}
            href={a.href}
            className="flex min-h-11 flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-white p-4 text-center transition hover:border-[#2D8B5A]/40"
          >
            <span className="text-xl text-[#2D8B5A]">{a.icon}</span>
            <span className="mt-2 text-sm font-semibold text-[#0b1f14]">
              {a.label}
            </span>
          </Link>
        ))}
      </div>

      <div className="rounded-3xl border border-emerald-100 bg-white p-6">
        <h2 className="text-lg font-bold text-[#0b1f14]">النشاط الأخير</h2>
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">لا أحداث بعد.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {events.map((e, i) => (
              <li
                key={`${e.title}-${i}`}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-medium text-slate-800">{e.title}</span>
                <span className="text-xs text-slate-400">
                  {new Date(e.at).toLocaleDateString('ar-EG')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ParentPricingCards />

      <Link
        href="/parent/booking"
        className="block rounded-3xl border-2 border-dashed border-[#2D8B5A]/40 bg-emerald-50/50 p-6"
      >
        <h2 className="text-lg font-bold text-[#0b1f14]">
          حجز موعد فحص شامل مع فريق متعدد التخصصات
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          اختر موعداً متاحاً ثم أكمل الدفع لتأكيد الحجز باسم الطفل.
        </p>
      </Link>
    </section>
  );
}
