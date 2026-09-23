'use client';

import { useMemo, useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import {
  createResourceRoomSession,
  dayLabelAr,
  getAvailableSlots,
  isSlotAvailable,
  upcomingSessions,
} from '@/lib/resourceRoom/engine';
import {
  listResourceRoomSessions,
  saveResourceRoomSession,
  getWeeklySchedule,
} from '@/lib/resourceRoom/store';
import {
  DEFAULT_RESOURCE_ROOM_SLOTS,
  SESSION_TYPE_LABELS,
  type ResourceRoomSession,
} from '@/lib/resourceRoom/types';
import { readLdActiveStudent } from '@/lib/tracks/trackContext';

export default function ResourceRoomScheduler() {
  const { lang, dir, t } = useLanguage();
  const [sessions, setSessions] = useState<ResourceRoomSession[]>(() =>
    typeof window !== 'undefined' ? listResourceRoomSessions() : []
  );
  const [selectedDay, setSelectedDay] = useState(0);
  const [msg, setMsg] = useState('');

  const child = useMemo(
    () => (typeof window !== 'undefined' ? readLdActiveStudent() : null),
    []
  );

  const daySlots = getAvailableSlots(selectedDay);
  const upcoming = upcomingSessions(sessions, child?.id);

  const bookSlot = (slotId: string) => {
    if (!child) {
      setMsg(t('ldSelectStudentFirst'));
      return;
    }
    const slot = DEFAULT_RESOURCE_ROOM_SLOTS.find((s) => s.id === slotId);
    if (!slot) return;

    const today = new Date();
    const daysUntil = (slot.dayOfWeek - today.getDay() + 7) % 7 || 7;
    const sessionDate = new Date(today);
    sessionDate.setDate(today.getDate() + daysUntil);
    const dateStr = sessionDate.toISOString().slice(0, 10);

    if (!isSlotAvailable(slot, dateStr, sessions)) {
      setMsg(t('ldSlotFull'));
      return;
    }

    const session = createResourceRoomSession({
      childId: child.id,
      childName: child.name,
      slotId: slot.id,
      scheduledDate: dateStr,
      startTime: slot.startTime,
      endTime: slot.endTime,
      sessionType: slot.sessionType,
      targetDomain:
        lang === 'en'
          ? SESSION_TYPE_LABELS[slot.sessionType].en
          : SESSION_TYPE_LABELS[slot.sessionType].ar,
    });

    const saved = saveResourceRoomSession(session);
    setSessions((prev) => [...prev, saved]);
    setMsg(t('ldSessionBooked'));
  };

  return (
    <div className="space-y-6" dir={dir}>
      {msg && (
        <p className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {msg}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {[0, 1, 2, 3, 4].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setSelectedDay(d)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              selectedDay === d
                ? 'bg-amber-600 text-white'
                : 'bg-white text-slate-600 hover:bg-amber-50'
            }`}
          >
            {dayLabelAr(d)}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {daySlots.map((slot) => {
          const typeLabel =
            lang === 'en'
              ? SESSION_TYPE_LABELS[slot.sessionType].en
              : SESSION_TYPE_LABELS[slot.sessionType].ar;
          return (
            <div
              key={slot.id}
              className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm"
            >
              <p className="font-bold text-slate-900">{typeLabel}</p>
              <p className="mt-1 text-xs text-slate-500">
                {slot.startTime}–{slot.endTime} · {slot.roomName}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {t('ldMaxStudents')}: {slot.maxStudents}
              </p>
              <button
                type="button"
                onClick={() => bookSlot(slot.id)}
                className="mt-3 w-full rounded-xl bg-amber-600 py-2 text-xs font-bold text-white hover:bg-amber-700"
              >
                {t('ldBookSession')}
              </button>
            </div>
          );
        })}
      </div>

      {upcoming.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold text-slate-900">
            {t('ldUpcomingSessions')}
          </h3>
          <ul className="space-y-2">
            {upcoming.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
              >
                <span className="font-semibold">{s.childName}</span>
                <span className="mx-2 text-slate-400">·</span>
                {s.scheduledDate} {s.startTime}–{s.endTime}
              </li>
            ))}
          </ul>
        </div>
      )}

      {child && getWeeklySchedule(child.id) && (
        <p className="text-xs text-emerald-600">{t('ldScheduleSaved')}</p>
      )}
    </div>
  );
}
