'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MERHID_NAME } from '@/lib/merhid';
import {
  buildAdminViews,
  readLocalAdminSnapshot,
  type AdminDashboardViews,
} from '@/lib/adminDashboard';
import type {
  PlatformAssessment,
  PlatformBooking,
  PlatformPayment,
  PlatformStudent,
  PlatformUser,
} from '@/lib/platformData';
import { useLanguage } from '@/components/LanguageProvider';
import AdminNextActionBanner from '@/components/admin/AdminNextActionBanner';

type Overview = {
  users: PlatformUser[];
  students: PlatformStudent[];
  assessments: PlatformAssessment[];
  bookings: PlatformBooking[];
  payments: PlatformPayment[];
};

const ROLE_AR: Record<string, string> = {
  specialist: 'أخصائي',
  teacher: 'معلّم',
};

function journeyLabel(child: {
  hasScreening: boolean;
  hasParentQ: boolean;
  hasAssessment: boolean;
}) {
  if (child.hasAssessment) return 'تقييم مكتمل';
  if (child.hasParentQ) return 'بعد الاستبيان';
  if (child.hasScreening) return 'بعد الفرز';
  return 'مسجّل';
}

export default function AdminPage() {
  const { t } = useLanguage();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const [localTick, setLocalTick] = useState(0);

  const load = () => {
    fetch('/api/admin/overview')
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.message || data.error || 'رفض الوصول');
        setOverview(data.overview);
        setLocalTick((n) => n + 1);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'تعذر التحميل')
      );
  };

  useEffect(() => {
    load();
  }, []);

  const views: AdminDashboardViews | null = useMemo(() => {
    if (!overview) return null;
    return buildAdminViews({
      users: overview.users,
      students: overview.students,
      assessments: overview.assessments,
      bookings: overview.bookings,
      payments: overview.payments,
      local: readLocalAdminSnapshot(),
    });
  }, [overview, localTick]);

  const progress = views?.progress;

  return (
    <section className="space-y-8">
      <div className="rounded-3xl bg-white p-7 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[#0b1f14]">{t('adminTitle')}</h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              بيانات الأهل، صفحات الأخصائيين وكيفية عملهم، ونتائج العمل والتقدم.
              الأدوار الأخرى لا ترى هذه اللوحة. {MERHID_NAME} حر هنا.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="rounded-xl bg-[#2D8B5A] px-4 py-2 text-sm font-semibold text-white"
          >
            تحديث البيانات
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>
        )}
        <Link
          href="/hub"
          className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-[#F0F9F4] px-4 py-3 text-sm"
        >
          <span className="block font-bold text-[#0b1f14]">
              مركز تآلف السريري والبحثي
            </span>
          <span className="font-semibold text-[#2D8B5A]">فتح ↗</span>
        </Link>
      </div>

      <AdminNextActionBanner />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['أولياء الأمور', progress?.parentsCount],
          ['الأخصائيون', progress?.specialistsCount],
          ['الأطفال', progress?.childrenCount],
          ['تقييمات مكتملة', progress?.assessedCount],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-emerald-100 bg-white px-4 py-4"
          >
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-[#2D8B5A]">
              {value ?? '—'}
            </p>
          </div>
        ))}
      </div>

      <DataCard title="بيانات الأهل">
        <p className="mb-4 text-sm leading-7 text-slate-500">
          كل ولي أمر مع أطفاله وموقعهم في المسار: تسجيل → فرز مجاني → نتيجة →
          تقييم مدفوع أو متابعة مع الكادر.
        </p>
        {(views?.parents || []).length === 0 ? (
          <Empty />
        ) : (
          <div className="space-y-4">
            {views!.parents.map((p) => (
              <article
                key={p.email}
                className="rounded-2xl border border-slate-100 bg-[#F0F9F4] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-[#0b1f14]">{p.name}</h3>
                    <p className="text-xs text-slate-500">{p.email}</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {p.children.length} أطفال · {p.bookings} حجوزات · {p.payments}{' '}
                    مدفوعات
                  </p>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {p.howTheyWork}
                </p>
                {p.children.length === 0 ? (
                  <p className="mt-3 text-xs text-slate-400">لا أطفال مسجّلين بعد</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {p.children.map((c) => (
                      <li
                        key={c.id}
                        className="flex flex-wrap justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm"
                      >
                        <span className="font-semibold">
                          {c.name}
                          {c.age != null ? ` · ${c.age} سنة` : ''}
                        </span>
                        <span className="text-[#2D8B5A]">
                          {journeyLabel(c)}
                          {c.hasAssessment
                            ? ` · ${c.classification} · ${c.percentage}%`
                            : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
      </DataCard>

      <DataCard title="صفحات الأخصائيين — كيفية العمل">
        <p className="mb-4 text-sm leading-7 text-slate-500">
          كل مختص مع الحالات التي يشرف عليها، طريقة عمله، ونتائج التقييمات.
        </p>
        {(views?.specialists || []).length === 0 ? (
          <Empty />
        ) : (
          <div className="space-y-4">
            {views!.specialists.map((s) => (
              <article
                key={s.email}
                className="rounded-2xl border border-slate-100 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-[#0b1f14]">{s.name}</h3>
                    <p className="text-xs text-slate-500">
                      {ROLE_AR[s.role] || s.role} · {s.email}
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="text-xs font-semibold text-[#2D8B5A]"
                  >
                    فتح صفحة المختص ←
                  </Link>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {s.howTheyWork}
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <Stat label="حالات يشرف عليها" value={s.cases.length} />
                  <Stat label="تقييمات منجزة" value={s.assessmentsDone} />
                  <Stat
                    label="متوسط النتيجة"
                    value={s.avgPercentage != null ? `${s.avgPercentage}%` : '—'}
                  />
                </div>
                {s.cases.length === 0 ? (
                  <p className="mt-3 text-xs text-slate-400">
                    لا حالات مسجّلة بعد
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {s.cases.map((c) => (
                      <li
                        key={c.id}
                        className="flex flex-wrap justify-between gap-2 rounded-xl bg-[#F0F9F4] px-3 py-2 text-sm"
                      >
                        <span className="font-semibold">{c.name}</span>
                        <span className="text-slate-600">
                          {c.hasAssessment
                            ? `${c.classification} · ${c.percentage}% · ${c.goalsActive} أهداف`
                            : 'بانتظار التقييم'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
      </DataCard>

      <DataCard title="نتائج العمل والتقدم">
        {!progress ? (
          <Empty />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="أتمّوا الفرز" value={progress.screenedCount} />
              <Stat label="أتمّوا التقييم" value={progress.assessedCount} />
              <Stat
                label="متوسط النسب"
                value={
                  progress.avgScore != null ? `${progress.avgScore}%` : '—'
                }
              />
              <Stat label="أهداف نشطة" value={progress.goalsActive} />
            </div>
            {progress.classificationBreakdown.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-[#0b1f14]">
                  توزيع التصنيف
                </p>
                <ul className="mt-2 space-y-2">
                  {progress.classificationBreakdown.map((row) => {
                    const pct = progress.assessedCount
                      ? Math.round((row.count / progress.assessedCount) * 100)
                      : 0;
                    return (
                      <li key={row.label}>
                        <div className="mb-1 flex justify-between text-xs text-slate-500">
                          <span>{row.label}</span>
                          <span>
                            {row.count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#2D8B5A]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <p className="text-sm leading-7 text-slate-500">
              التقدم يُقاس بعدد الأطفال الذين عبروا الفرز ثم التقييم، ومتوسط
              النتائج، وعدد الأهداف النشطة التي يعمل عليها المختصون مع الحالات.
            </p>
          </div>
        )}
      </DataCard>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-[#F0F9F4] px-3 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-[#2D8B5A]">{value}</p>
    </div>
  );
}

function DataCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-6">
      <h2 className="mb-2 text-xl font-bold text-[#0b1f14]">{title}</h2>
      {children}
    </div>
  );
}

function Empty() {
  return (
    <p className="text-sm text-slate-400">
      لا بيانات بعد — ستظهر هنا فور تسجيل الأهل أو المختصين للحالات والتقييمات.
    </p>
  );
}
