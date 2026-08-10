'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MERHID_NAME } from '@/lib/merhid';

type Overview = {
  users: Array<{ id: string; email: string; name: string; role: string }>;
  students: Array<{
    id: string;
    name: string;
    age?: number;
    parentEmail?: string;
    source: string;
    createdAt: string;
  }>;
  assessments: Array<{
    id: string;
    studentName: string;
    percentage: number;
    classification: string;
    savedAt: string;
    byEmail?: string;
  }>;
  bookings: Array<{
    id: string;
    slotLabel: string;
    studentName: string;
    paidAt: string;
    byEmail?: string;
  }>;
  payments: Array<{
    id: string;
    product: string;
    amount: number;
    currency: string;
    at: string;
    byEmail?: string;
  }>;
  counts: Record<string, number>;
};

const ROLE_AR: Record<string, string> = {
  admin: 'إدارة',
  specialist: 'مختص',
  teacher: 'معلّم',
  parent: 'ولي أمر',
};

export default function AdminPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    fetch('/api/admin/overview')
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.message || data.error || 'رفض الوصول');
        setOverview(data.overview);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'تعذر التحميل')
      );
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white p-7 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[#0b1f14]">
              لوحة الإدارة العليا
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              اطّلاع كامل على المستخدمين والطلاب والتقييمات والحجوزات والمدفوعات.
              الأدوار الأخرى لا تستطيع فتح هذه البيانات. {MERHID_NAME} حر هنا.
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
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['مستخدمون', overview?.counts.users],
          ['طلاب', overview?.counts.students],
          ['تقييمات', overview?.counts.assessments],
          ['حجوزات', overview?.counts.bookings],
          ['مدفوعات', overview?.counts.payments],
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

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/dashboard"
          className="rounded-3xl bg-[#2D8B5A] p-5 text-white"
        >
          معاينة بوابة المختص
        </Link>
        <Link
          href="/parent"
          className="rounded-3xl border border-emerald-100 bg-white p-5 font-semibold text-[#0b1f14]"
        >
          معاينة بوابة الأهل
        </Link>
        <Link
          href="/dashboard/assessments/new"
          className="rounded-3xl border border-emerald-100 bg-white p-5 font-semibold text-[#0b1f14]"
        >
          فتح تقييم (اطلاع)
        </Link>
      </div>

      <DataCard title="المستخدمون (دليل النظام)">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400">
              <th className="py-2 text-start font-medium">الاسم</th>
              <th className="py-2 text-start font-medium">البريد</th>
              <th className="py-2 text-start font-medium">الدور</th>
            </tr>
          </thead>
          <tbody>
            {(overview?.users || []).map((u) => (
              <tr key={u.id} className="border-t border-slate-50">
                <td className="py-2">{u.name}</td>
                <td className="py-2 text-slate-500">{u.email}</td>
                <td className="py-2">{ROLE_AR[u.role] || u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataCard>

      <DataCard title="الطلاب المسجّلون">
        {(overview?.students || []).length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-2 text-sm">
            {overview!.students.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap justify-between gap-2 rounded-xl bg-[#F0F9F4] px-3 py-2"
              >
                <span className="font-semibold">
                  {s.name}
                  {s.age != null ? ` · ${s.age} سنة` : ''}
                </span>
                <span className="text-slate-500">
                  {s.parentEmail || s.source} ·{' '}
                  {new Date(s.createdAt).toLocaleString('ar-EG')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DataCard>

      <DataCard title="التقييمات">
        {(overview?.assessments || []).length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-2 text-sm">
            {overview!.assessments.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap justify-between gap-2 rounded-xl bg-[#F0F9F4] px-3 py-2"
              >
                <span className="font-semibold">
                  {a.studentName} — {a.percentage}% · {a.classification}
                </span>
                <span className="text-slate-500">
                  {a.byEmail || '—'} ·{' '}
                  {new Date(a.savedAt).toLocaleString('ar-EG')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DataCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <DataCard title="الحجوزات المدفوعة">
          {(overview?.bookings || []).length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-2 text-sm">
              {overview!.bookings.map((b) => (
                <li key={b.id} className="rounded-xl bg-[#F0F9F4] px-3 py-2">
                  <p className="font-semibold">{b.studentName}</p>
                  <p className="text-slate-500">{b.slotLabel}</p>
                </li>
              ))}
            </ul>
          )}
        </DataCard>
        <DataCard title="المدفوعات">
          {(overview?.payments || []).length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-2 text-sm">
              {overview!.payments.map((p) => (
                <li
                  key={p.id}
                  className="flex justify-between rounded-xl bg-[#F0F9F4] px-3 py-2"
                >
                  <span>
                    {p.product} · {p.amount} {p.currency}
                  </span>
                  <span className="text-slate-500">{p.byEmail || '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </DataCard>
      </div>
    </section>
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
      <h2 className="mb-4 text-lg font-bold text-[#0b1f14]">{title}</h2>
      {children}
    </div>
  );
}

function Empty() {
  return (
    <p className="text-sm text-slate-400">
      لا بيانات بعد — ستظهر هنا فور تسجيل/دفع/حفظ من البوابات الأخرى.
    </p>
  );
}
