'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  loadStoredAssessments,
  type StoredAssessment,
} from '@/lib/assessmentHelpers';
import { loadGoalsLocal } from '@/lib/goalsStore';
import type { TrackedGoal } from '@/lib/goalsEngine';

type StudentRow = {
  id: string;
  name: string;
  dob?: string;
  age?: number;
  parent_name?: string;
  status?: string;
};

type GameSession = {
  id?: string;
  childId?: string;
  gameCode?: string;
  game_code?: string;
  score: number;
  endedAt?: string;
  ended_at?: string;
  startedAt?: string;
};

function classColor(label: string) {
  if (label === 'طبيعي') return '#2D8B5A';
  if (label === 'خفيف' || label === 'متوسط') return '#EAB308';
  if (label === 'شديد') return '#F97316';
  if (label === 'شديد جداً') return '#DC2626';
  return '#64748B';
}

function DomainLineChart({
  assessments,
}: {
  assessments: StoredAssessment[];
}) {
  const domains = useMemo(() => {
    const set = new Set<string>();
    assessments.forEach((a) =>
      Object.keys(a.domainAverages || {}).forEach((d) => set.add(d))
    );
    return Array.from(set).slice(0, 4);
  }, [assessments]);

  if (assessments.length < 2 || !domains.length) return null;

  const w = 320;
  const h = 140;
  const colors = ['#2D8B5A', '#4A90D9', '#EAB308', '#F97316'];

  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-5">
      <h2 className="text-lg font-bold text-[#0b1f14]">مقارنة المجالات عبر الوقت</h2>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-40 w-full">
        {domains.map((domain, di) => {
          const pts = assessments
            .slice()
            .reverse()
            .map((a, i, arr) => {
              const x = (i / Math.max(1, arr.length - 1)) * (w - 24) + 12;
              const v = Number(a.domainAverages?.[domain] ?? 0);
              const y = h - 16 - (v / 3) * (h - 28);
              return `${x},${y}`;
            })
            .join(' ');
          return (
            <polyline
              key={domain}
              fill="none"
              stroke={colors[di % colors.length]}
              strokeWidth="2.5"
              points={pts}
            />
          );
        })}
      </svg>
      <ul className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
        {domains.map((d, i) => (
          <li key={d} className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: colors[i % colors.length] }}
            />
            {d}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function StudentDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const [student, setStudent] = useState<StudentRow | null>(null);
  const [assessments, setAssessments] = useState<StoredAssessment[]>([]);
  const [games, setGames] = useState<GameSession[]>([]);
  const [goals, setGoals] = useState<TrackedGoal[]>([]);

  useEffect(() => {
    try {
      const list = JSON.parse(
        localStorage.getItem('taaluf.students.v1') || '[]'
      ) as StudentRow[];
      const found = list.find((s) => s.id === id);
      if (found) {
        setStudent(found);
        localStorage.setItem('taaluf.activeStudent', JSON.stringify(found));
      } else {
        const active = JSON.parse(
          localStorage.getItem('taaluf.activeStudent') || 'null'
        );
        if (active?.id === id) setStudent(active);
      }

      const localAssess = loadStoredAssessments().filter(
        (a) => a.studentId === id
      );
      setAssessments(localAssess);
      setGoals(loadGoalsLocal(id));

      const localGames = JSON.parse(
        localStorage.getItem('taaluf.gameSessions.v1') || '[]'
      ) as GameSession[];
      setGames(
        (Array.isArray(localGames) ? localGames : []).filter(
          (g: { childId?: string }) => g.childId === id
        )
      );
    } catch {
      /* ignore */
    }

    fetch(`/api/students/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.student?.fields?.name) {
          setStudent({
            id: d.student.id,
            name: d.student.fields.name,
            dob: d.student.fields.dob,
            age: d.student.fields.age,
            parent_name: d.student.fields.parent_name,
            status: d.student.fields.status,
          });
        }
      })
      .catch(() => undefined);

    fetch(`/api/assessments?studentId=${encodeURIComponent(id)}`).catch(
      () => undefined
    );

    fetch(`/api/games/run?childId=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.sessions) && d.sessions.length) setGames(d.sessions);
      })
      .catch(() => undefined);
  }, [id]);

  const timeline = useMemo(() => {
    const rows = assessments.map((a) => ({
      id: a.id,
      date: a.savedAt,
      type: 'تقييم',
      percentage: a.percentage,
      classification: a.classification,
      specialist: 'أخصائي تآلف',
    }));
    try {
      const screening = JSON.parse(
        localStorage.getItem('taaluf.screening.v1') || 'null'
      );
      if (screening?.childId === id && screening.result) {
        rows.push({
          id: 'screening',
          date: screening.savedAt || new Date().toISOString(),
          type: 'فرز',
          percentage: screening.result.overall,
          classification:
            screening.result.band === 'elevated'
              ? 'شديد'
              : screening.result.band === 'moderate'
                ? 'متوسط'
                : 'طبيعي',
          specialist: 'فرز أولي',
        });
      }
    } catch {
      /* ignore */
    }
    return rows.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [assessments, id]);

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <Link href="/dashboard/students" className="text-sm text-[#2D8B5A]">
        ← قائمة الأطفال
      </Link>

      <div className="rounded-3xl border border-emerald-100 bg-white p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[#0b1f14]">
              {student?.name || 'ملف الطفل'}
            </h1>
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              <li>العمر: {student?.age != null ? `${student.age} سنة` : '—'}</li>
              <li>ولي الأمر: {student?.parent_name || '—'}</li>
              <li>الحالة: {student?.status || 'نشط'}</li>
            </ul>
          </div>
          <Link href="/dashboard/assessments/new">
            <Button>تقييم جديد</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-100 bg-white p-6">
        <h2 className="text-xl font-bold text-[#0b1f14]">خط زمني للتقييمات</h2>
        {timeline.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">لا تقييمات محفوظة بعد.</p>
        ) : (
          <ol className="relative mt-6 space-y-5 border-r border-emerald-100 pr-5">
            {timeline.map((t) => (
              <li key={t.id} className="relative">
                <span
                  className="absolute -right-[27px] top-1 h-3 w-3 rounded-full"
                  style={{ background: classColor(t.classification) }}
                />
                <p className="text-xs text-slate-400">
                  {new Date(t.date).toLocaleString('ar-EG')} · {t.type}
                </p>
                <p className="mt-1 font-semibold text-slate-800">
                  {t.percentage}% · {t.classification}
                </p>
                <p className="text-xs text-slate-500">{t.specialist}</p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <DomainLineChart assessments={assessments} />

      <div className="rounded-3xl border border-emerald-100 bg-white p-6">
        <h2 className="text-lg font-bold text-[#0b1f14]">الأهداف النشطة</h2>
        {goals.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">لا أهداف بعد.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {goals.slice(0, 5).map((g) => {
              const range = Math.max(1, g.target - g.baseline);
              const fill = Math.min(
                100,
                Math.max(0, ((g.current - g.baseline) / range) * 100)
              );
              return (
                <li key={g.id}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{g.title}</span>
                    <span className="text-slate-500">{g.current}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-emerald-50">
                    <div
                      className="h-full rounded-full bg-[#2D8B5A]"
                      style={{ width: `${fill}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Link
          href="/dashboard/goals"
          className="mt-4 inline-block text-sm font-semibold text-[#2D8B5A]"
        >
          فتح صفحة الأهداف ←
        </Link>
      </div>

      <div className="rounded-3xl border border-emerald-100 bg-white p-6">
        <h2 className="text-lg font-bold text-[#0b1f14]">جلسات الألعاب</h2>
        {games.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">لا جلسات ألعاب بعد.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {games.slice(0, 8).map((g, i) => (
              <li
                key={g.id || i}
                className="flex justify-between rounded-xl bg-emerald-50/50 px-3 py-2"
              >
                <span>
                  {g.gameCode || g.game_code || 'لعبة'} · {g.score} نقطة
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(
                    g.endedAt || g.ended_at || g.startedAt || Date.now()
                  ).toLocaleDateString('ar-EG')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
