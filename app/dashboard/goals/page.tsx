'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  createTrackedGoalsFromScores,
  todayPracticeFromGoal,
  type TrackedGoal,
} from '@/lib/goalsEngine';
import { loadGoalsLocal, saveGoalsLocal, upsertGoalLocal } from '@/lib/goalsStore';
import { loadStoredAssessments } from '@/lib/assessmentHelpers';
import { useLanguage } from '@/components/LanguageProvider';
import SensoryHubRecommendationsCard from '@/components/sensory-hub/SensoryHubRecommendationsCard';

const MOODS = ['😊', '😐', '😟', '😢'] as const;

function WeekChart({ values }: { values: number[] }) {
  const w = 280;
  const h = 80;
  const max = Math.max(100, ...values, 1);
  const pts = values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * (w - 16) + 8;
      const y = h - 10 - (v / max) * (h - 20);
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full">
      <polyline
        fill="none"
        stroke="#2D8B5A"
        strokeWidth="3"
        points={pts}
      />
      {values.map((v, i) => {
        const x = (i / Math.max(1, values.length - 1)) * (w - 16) + 8;
        const y = h - 10 - (v / max) * (h - 20);
        return <circle key={i} cx={x} cy={y} r="3.5" fill="#2D8B5A" />;
      })}
    </svg>
  );
}

export default function GoalsPage() {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';
  const [childId, setChildId] = useState('child_local');
  const [goals, setGoals] = useState<TrackedGoal[]>([]);
  const [noteGoalId, setNoteGoalId] = useState<string | null>(null);
  const [mood, setMood] = useState<string>('😊');
  const [activity, setActivity] = useState('');
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    try {
      const active = JSON.parse(
        localStorage.getItem('taaluf.activeStudent') || 'null'
      );
      const id = active?.id || 'child_local';
      setChildId(id);
      let list = loadGoalsLocal(id);
      if (!list.length) {
        const assessments = loadStoredAssessments().filter(
          (a) => a.studentId === id
        );
        const latest = assessments[0];
        if (latest?.scores?.length) {
          list = createTrackedGoalsFromScores(id, latest.scores);
          const all = [...list, ...loadGoalsLocal()];
          saveGoalsLocal(all);
        }
      }
      setGoals(list);
    } catch {
      /* ignore */
    }
  }, []);

  const practice = useMemo(
    () => todayPracticeFromGoal(goals[0] || null),
    [goals]
  );

  const weekValues = useMemo(() => {
    const key = `taaluf.goals.week.${childId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as number[];
    } catch {
      /* ignore */
    }
    const mock = [20, 28, 35, 40, 48, 55, goals[0]?.current ?? 60];
    localStorage.setItem(key, JSON.stringify(mock));
    return mock;
  }, [childId, goals]);

  const statusColor = (g: TrackedGoal) => {
    const pct =
      g.target === g.baseline
        ? 0
        : ((g.current - g.baseline) / (g.target - g.baseline)) * 100;
    if (pct >= 70) return 'bg-emerald-500';
    if (pct >= 35) return 'bg-amber-400';
    return 'bg-rose-500';
  };

  const saveNote = async () => {
    if (!noteGoalId) return;
    const goal = goals.find((g) => g.id === noteGoalId);
    if (!goal) return;
    const progress = Math.min(
      100,
      goal.current + (mood === '😊' ? 5 : mood === '😐' ? 2 : 0)
    );
    const updated: TrackedGoal = {
      ...goal,
      current: progress,
      lastUpdate: new Date().toISOString(),
      sessions: [
        ...goal.sessions,
        {
          at: new Date().toISOString(),
          mood,
          activity,
          notes,
          progress,
        },
      ],
    };
    upsertGoalLocal(updated);
    setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    await fetch(`/api/goals/${updated.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal: updated,
        session: updated.sessions[updated.sessions.length - 1],
        current: progress,
      }),
    }).catch(() => undefined);
    setMsg('تم حفظ الملاحظة');
    setNoteGoalId(null);
    setActivity('');
    setNotes('');
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0b1f14]">{t('educationalGoals')}</h1>
        <p className="mt-2 text-sm text-slate-600">
          أهداف SMART من المعايير ذات الدرجة ≥ 2 مع تتبّع أسبوعي.
        </p>
      </div>

      <div className="rounded-3xl border-2 border-[#2D8B5A] bg-emerald-50/60 p-6">
        <p className="text-xs font-semibold text-[#2D8B5A]">تمرين اليوم</p>
        <h2 className="mt-1 text-xl font-bold text-[#0b1f14]">{practice.title}</h2>
        <ol className="mt-3 list-decimal space-y-1 pr-5 text-sm leading-7 text-slate-700">
          {practice.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>

      <div className="rounded-3xl border border-emerald-100 bg-white p-6">
        <h2 className="text-lg font-bold text-[#0b1f14]">التقدّم الأسبوعي</h2>
        <WeekChart values={weekValues} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
      {goals.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-emerald-200 bg-white p-8 text-center text-sm text-slate-500">
          لا أهداف بعد — أكمل تقييماً للطفل لتوليد أهداف تلقائياً.
        </p>
      ) : (
        <div className="grid gap-4">
          {goals.map((g) => {
            const range = Math.max(1, g.target - g.baseline);
            const fill = Math.min(
              100,
              Math.max(0, ((g.current - g.baseline) / range) * 100)
            );
            return (
              <article
                key={g.id}
                className="rounded-3xl border border-emerald-100 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${statusColor(g)}`}
                      />
                      <h3 className="text-lg font-bold text-[#0b1f14]">
                        {g.title}
                      </h3>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-[#2D8B5A]">
                      {g.domain}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNoteGoalId(g.id)}
                  >
                    سجّل ملاحظة
                  </Button>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {g.smartText}
                </p>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>
                      {g.baseline} → {g.target}
                    </span>
                    <span>الحالي {g.current}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-emerald-50">
                    <div
                      className="h-full rounded-full bg-[#2D8B5A]"
                      style={{ width: `${fill}%` }}
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  جلسات: {g.sessions.length}
                  {g.lastUpdate
                    ? ` · آخر تحديث ${new Date(g.lastUpdate).toLocaleDateString('ar-EG')}`
                    : ''}
                </p>
              </article>
            );
          })}
        </div>
      )}

        </div>

        <SensoryHubRecommendationsCard goals={goals} isAr={isAr} />
      </div>

      {noteGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6">
            <h3 className="text-lg font-bold">سجّل ملاحظة</h3>
            <div className="mt-3 flex gap-2">
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  className={
                    mood === m
                      ? 'rounded-xl bg-emerald-50 px-3 py-2 text-xl ring-2 ring-[#2D8B5A]'
                      : 'rounded-xl px-3 py-2 text-xl'
                  }
                >
                  {m}
                </button>
              ))}
            </div>
            <input
              className="mt-3 w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="النشاط المنزلي"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
            />
            <textarea
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
              rows={3}
              placeholder="ملاحظات"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="mt-4 flex gap-2">
              <Button onClick={saveNote}>حفظ</Button>
              <Button variant="ghost" onClick={() => setNoteGoalId(null)}>
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {msg && <p className="text-sm text-[#2D8B5A]">{msg}</p>}
    </section>
  );
}
