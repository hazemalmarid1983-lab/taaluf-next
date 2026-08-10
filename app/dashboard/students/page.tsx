'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPreviousAssessment } from '@/lib/assessmentHelpers';

type StudentRow = {
  id: string;
  name: string;
  dob?: string;
  age?: number;
  parent_name?: string;
  parentName?: string;
  ParentName?: string;
  status?: string;
  Status?: string;
};

function ageFromDob(dob?: string, fallback?: number) {
  if (fallback != null && fallback > 0) return fallback;
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

function riskFromClassification(label?: string) {
  if (!label) return '—';
  if (label === 'شديد جداً' || label === 'شديد') return label;
  if (label === 'متوسط') return 'متوسط';
  if (label === 'خفيف') return 'خفيف';
  return 'منخفض';
}

type SortKey = 'name' | 'age' | 'lastAssessment' | 'risk';

export default function StudentsListPage() {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const local = JSON.parse(
          localStorage.getItem('taaluf.students.v1') || '[]'
        ) as StudentRow[];
        setRows(Array.isArray(local) ? local : []);

        const res = await fetch('/api/students');
        const data = await res.json();
        if (res.ok && Array.isArray(data.records) && data.records.length) {
          setRows(
            data.records.map(
              (r: { id: string; fields: Record<string, unknown> }) => ({
                id: r.id,
                name: String(r.fields.name || r.fields.Name || ''),
                dob: String(r.fields.dob || r.fields.DOB || ''),
                age: Number(r.fields.age || 0) || undefined,
                parent_name: String(
                  r.fields.parent_name || r.fields.ParentName || ''
                ),
                status: String(r.fields.status || r.fields.Status || 'نشط'),
              })
            )
          );
        } else if (!local.length) {
          setMsg(data.message || '');
        }
      } catch {
        setMsg('تعذر تحميل قائمة الطلاب');
      }
    };
    void load();
  }, []);

  const enriched = useMemo(() => {
    return rows.map((s) => {
      const prev = getPreviousAssessment(s.id);
      return {
        ...s,
        ageValue: ageFromDob(s.dob, s.age),
        parent:
          s.parent_name || s.parentName || s.ParentName || '—',
        status: s.status || s.Status || 'نشط',
        lastAssessment: prev?.savedAt || '',
        risk: riskFromClassification(prev?.classification),
        lastPct: prev?.percentage,
      };
    });
  }, [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = enriched;
    if (query) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          String(s.parent).toLowerCase().includes(query)
      );
    }
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name, 'ar') * dir;
      if (sortKey === 'age')
        return ((a.ageValue ?? -1) - (b.ageValue ?? -1)) * dir;
      if (sortKey === 'lastAssessment')
        return a.lastAssessment.localeCompare(b.lastAssessment) * dir;
      return a.risk.localeCompare(b.risk, 'ar') * dir;
    });
  }, [enriched, q, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0b1f14]">قائمة الأطفال</h1>
          <p className="mt-2 text-sm text-slate-600">
            بحث وترتيب وانتقال سريع لملف الطفل.
          </p>
        </div>
        <Link href="/dashboard/students/new">
          <Button>إضافة طفل</Button>
        </Link>
      </div>

      <Input
        placeholder="ابحث بالاسم أو اسم ولي الأمر…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-md"
      />

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-emerald-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-600">
            لا يوجد أطفال بعد. ابدأ بإضافة طفل.
          </p>
          {msg && <p className="mt-2 text-xs text-slate-400">{msg}</p>}
          <Link href="/dashboard/students/new" className="mt-4 inline-block">
            <Button variant="outline">إضافة طفل</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-emerald-100 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-emerald-50/80 text-slate-600">
              <tr>
                {(
                  [
                    ['name', 'الاسم'],
                    ['age', 'العمر'],
                    ['parent', 'ولي الأمر'],
                    ['status', 'الحالة'],
                    ['lastAssessment', 'آخر تقييم'],
                    ['risk', 'مستوى الخطر'],
                  ] as const
                ).map(([key, label]) => (
                  <th key={key} className="px-4 py-3 text-start font-semibold">
                    {key === 'parent' || key === 'status' ? (
                      label
                    ) : (
                      <button
                        type="button"
                        className="hover:text-[#2D8B5A]"
                        onClick={() => toggleSort(key as SortKey)}
                      >
                        {label}
                        {sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-slate-100 transition hover:bg-emerald-50/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/students/${s.id}`}
                      className="font-semibold text-[#0b1f14] hover:text-[#2D8B5A]"
                      onClick={() => {
                        localStorage.setItem(
                          'taaluf.activeStudent',
                          JSON.stringify(s)
                        );
                      }}
                    >
                      {s.name || '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {s.ageValue != null ? `${s.ageValue} سنة` : '—'}
                  </td>
                  <td className="px-4 py-3">{s.parent}</td>
                  <td className="px-4 py-3">{s.status}</td>
                  <td className="px-4 py-3">
                    {s.lastAssessment
                      ? new Date(s.lastAssessment).toLocaleDateString('ar-EG')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {s.risk}
                    {s.lastPct != null ? ` (${s.lastPct}%)` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
