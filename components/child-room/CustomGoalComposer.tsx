'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { upsertGoalLocal } from '@/lib/goalsStore';
import type { RoomCustomActivity } from '@/lib/childRoom/customActivityStore';
import {
  getActiveTrainingPlan,
  saveTrainingPlan,
} from '@/lib/training/storage/planStore';

const CUSTOM_PLAY_KEY = 'taaluf.childRoom.customPlay.v1';

export default function CustomGoalComposer({
  childId,
  onCreated,
}: {
  childId: string;
  onCreated?: (activity: RoomCustomActivity) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [goalText, setGoalText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = goalText.trim();
    if (text.length < 5) {
      setError('اكتب هدفاً أوضح (5 أحرف على الأقل).');
      return;
    }
    setBusy(true);
    setError('');
    const response = await fetch('/api/child-room/custom-activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId, goalText: text }),
    });
    const data = (await response.json().catch(() => null)) as {
      activity?: RoomCustomActivity;
      error?: string;
    } | null;
    setBusy(false);
    const created = data?.activity;
    if (!response.ok || !created) {
      setError('تعذر توليد الوسيلة. أعد المحاولة.');
      return;
    }
    upsertGoalLocal({
      id: created.id,
      childId,
      criterionId: 'custom_goal',
      domain: 'هدف خاص',
      title: created.goalText,
      smartText: created.goalText,
      baseline: 0,
      target: 3,
      current: 0,
      startDate: created.createdAt,
      targetDate: created.createdAt,
      status: 'active',
      sessions: [],
    });
    sessionStorage.setItem(CUSTOM_PLAY_KEY, JSON.stringify(created));
    try {
      const plan = getActiveTrainingPlan(childId);
      const assignment = plan?.assignments.find(
        (item) => item.mediaId === created.mediaId
      );
      if (plan && assignment) {
        saveTrainingPlan({
          ...plan,
          cursor: { nextOrder: assignment.order },
        });
      }
    } catch {
      /* الخطة المحلية اختيارية */
    }
    onCreated?.(created);
    setGoalText('');
    setOpen(false);
    router.push(`/dashboard/home-classroom?from=child-room&customId=${encodeURIComponent(created.id)}`);
  };

  return (
    <section className="mx-auto mt-4 max-w-lg rounded-2xl border border-[#2E7D8E]/20 bg-white p-5 text-right">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full rounded-xl bg-[#2E7D8E] px-4 py-3 text-sm font-bold text-white"
      >
        + إضافة هدف خاص وإنشاء وسيلته
      </button>
      {open ? (
        <form onSubmit={(event) => void submit(event)} className="mt-4 space-y-3">
          <p className="text-xs leading-5 text-slate-500">
            اكتب الهدف كما تلاحظه. المحرك يختار نوع التمرين والعناصر. إكمال
            الوسيلة الرقمية لا يعني إتقان المعيار.
          </p>
          <textarea
            value={goalText}
            onChange={(event) => setGoalText(event.target.value)}
            rows={3}
            maxLength={300}
            placeholder="مثال: أن يطابق الطفل صور الحيوانات الأليفة"
            className="w-full rounded-xl border border-slate-200 p-3 text-sm"
          />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? 'جارٍ إنشاء الوسيلة…' : 'توليد وإدراج في الغرفة'}
          </button>
        </form>
      ) : null}
    </section>
  );
}
