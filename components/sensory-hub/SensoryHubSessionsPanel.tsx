'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { SENSORY_ROOMS } from '@/lib/sensoryHub';
import {
  formatSensorySessionDuration,
  loadSensoryHubSessions,
  summarizeSensoryHubSessions,
} from '@/lib/sensoryHubSession';

export default function SensoryHubSessionsPanel({
  childId,
  isAr,
  className,
}: {
  childId: string;
  isAr: boolean;
  className?: string;
}) {
  const summary = useMemo(() => {
    const sessions = loadSensoryHubSessions(childId);
    return summarizeSensoryHubSessions(sessions);
  }, [childId]);

  const roomLabel = (roomId: string) => {
    const room = SENSORY_ROOMS.find((r) => r.id === roomId);
    if (!room) return roomId;
    return isAr ? room.titleAr : room.titleEn;
  };

  if (summary.totalSessions === 0) {
    return (
      <div
        className={`rounded-3xl border border-white/90 bg-white/85 p-6 backdrop-blur-xl ${className || ''}`}
      >
        <h2 className="text-lg font-bold text-[#0b1f14]">
          {isAr ? 'جلسات الغرف الحسية' : 'Sensory room sessions'}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {isAr
            ? 'لا توجد جلسات مسجّلة بعد — جرّبي جناح الغرف الحسية من الرابط أدناه.'
            : 'No sessions recorded yet — try the sensory wing from the link below.'}
        </p>
        <Link
          href="/sensory-rooms"
          className="mt-3 inline-block text-sm font-semibold text-violet-600 hover:underline"
        >
          {isAr ? 'جناح الغرف الحسية ←' : 'Sensory rooms hub →'}
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`rounded-3xl border border-white/90 bg-white/85 p-6 backdrop-blur-xl ${className || ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#0b1f14]">
            {isAr ? 'جلسات الغرف الحسية' : 'Sensory room sessions'}
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            {isAr
              ? 'ملخص الاستخدام المسجّل محلياً — يُظهر أثر التنظيم الحسي على ملف الطفل.'
              : 'Locally saved usage summary — sensory regulation impact on the child record.'}
          </p>
        </div>
        <Link
          href="/sensory-rooms"
          className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-bold text-violet-700"
        >
          {isAr ? 'الجناح الحسي' : 'Sensory wing'}
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatChip
          label={isAr ? 'جلسات' : 'Sessions'}
          value={String(summary.totalSessions)}
        />
        <StatChip
          label={isAr ? 'دقائق' : 'Minutes'}
          value={String(summary.totalMinutes)}
        />
        <StatChip
          label={isAr ? 'مؤشر الهدوء' : 'Calm index'}
          value={`${summary.avgCalmIndex}%`}
        />
        <StatChip
          label={isAr ? 'مؤشر الانخراط' : 'Engagement'}
          value={`${summary.avgEngagementIndex}%`}
        />
        <StatChip
          label={isAr ? 'تف/د' : 'Int/min'}
          value={String(summary.avgInteractionRate)}
        />
      </div>

      {summary.byRoom.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-black text-slate-600">
            {isAr ? 'حسب الغرفة' : 'By room'}
          </h3>
          <ul className="mt-2 space-y-2">
            {summary.byRoom.map((row) => (
              <li
                key={row.roomId}
                className="flex items-center justify-between rounded-xl bg-violet-50/60 px-3 py-2 text-sm"
              >
                <span className="font-semibold text-slate-800">
                  {roomLabel(row.roomId)}
                </span>
                <span className="text-xs text-slate-500">
                  {row.count} · {row.totalMinutes}
                  {isAr ? ' د' : 'm'} · {row.avgCalm}% · {row.avgEngagement}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.recent.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-black text-slate-600">
            {isAr ? 'آخر الجلسات' : 'Recent sessions'}
          </h3>
          <ul className="mt-2 space-y-1.5 text-[11px] text-slate-600">
            {summary.recent.map((s, i) => (
              <li
                key={`${s.roomId}-${s.endedAt}-${i}`}
                className="flex justify-between rounded-lg bg-slate-50 px-2.5 py-1.5"
              >
                <span>{roomLabel(s.roomId)}</span>
                <span className="text-slate-400">
                  {formatSensorySessionDuration(s.durationMs)} · {s.calmIndex}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50/50 px-3 py-2 text-center">
      <div className="text-lg font-black text-violet-900">{value}</div>
      <div className="text-[10px] font-bold text-violet-600/80">{label}</div>
    </div>
  );
}
