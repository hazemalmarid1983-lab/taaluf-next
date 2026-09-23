/**
 * محرك جدولة غرف المصادر — نموذج pull-out للمساندة الأكاديمية
 */

import {
  DEFAULT_RESOURCE_ROOM_SLOTS,
  SESSION_TYPE_LABELS,
  type ResourceRoomSession,
  type ResourceRoomSessionStatus,
  type ResourceRoomSessionType,
  type ResourceRoomSlot,
  type ResourceRoomWeeklySchedule,
} from './types';

export function generateSessionId(): string {
  return `rr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function getAvailableSlots(
  dayOfWeek?: number,
  slots: ResourceRoomSlot[] = DEFAULT_RESOURCE_ROOM_SLOTS
): ResourceRoomSlot[] {
  if (dayOfWeek == null) return slots;
  return slots.filter((s) => s.dayOfWeek === dayOfWeek);
}

export function countSessionsOnDate(
  sessions: ResourceRoomSession[],
  slotId: string,
  date: string
): number {
  return sessions.filter(
    (s) =>
      s.slotId === slotId &&
      s.scheduledDate === date &&
      s.status !== 'cancelled'
  ).length;
}

export function isSlotAvailable(
  slot: ResourceRoomSlot,
  date: string,
  sessions: ResourceRoomSession[]
): boolean {
  const booked = countSessionsOnDate(sessions, slot.id, date);
  return booked < slot.maxStudents;
}

export function createResourceRoomSession(fields: {
  childId: string;
  childName: string;
  slotId?: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  sessionType: ResourceRoomSessionType;
  targetDomain: string;
  iepGoalId?: string;
  interventions?: string[];
  preNotes?: string;
}): ResourceRoomSession {
  const now = new Date().toISOString();
  return {
    id: generateSessionId(),
    childId: fields.childId,
    childName: fields.childName,
    slotId: fields.slotId,
    scheduledDate: fields.scheduledDate,
    startTime: fields.startTime,
    endTime: fields.endTime,
    sessionType: fields.sessionType,
    status: 'scheduled',
    targetDomain: fields.targetDomain,
    iepGoalId: fields.iepGoalId,
    interventions: fields.interventions ?? [],
    preNotes: fields.preNotes,
    createdAt: now,
    updatedAt: now,
  };
}

export function completeSession(
  session: ResourceRoomSession,
  fields: {
    postNotes?: string;
    achievementPercent?: number;
    accommodationsUsed?: string[];
    materials?: string[];
  }
): ResourceRoomSession {
  const now = new Date().toISOString();
  return {
    ...session,
    status: 'completed',
    postNotes: fields.postNotes ?? session.postNotes,
    achievementPercent: fields.achievementPercent,
    accommodationsUsed: fields.accommodationsUsed,
    materials: fields.materials,
    updatedAt: now,
    completedAt: now,
  };
}

export function updateSessionStatus(
  session: ResourceRoomSession,
  status: ResourceRoomSessionStatus
): ResourceRoomSession {
  return {
    ...session,
    status,
    updatedAt: new Date().toISOString(),
    completedAt: status === 'completed' ? new Date().toISOString() : session.completedAt,
  };
}

export function sessionSummaryAr(session: ResourceRoomSession): string {
  const typeLabel = SESSION_TYPE_LABELS[session.sessionType]?.ar ?? session.sessionType;
  const date = session.scheduledDate;
  return `${typeLabel} · ${date} · ${session.startTime}–${session.endTime}`;
}

export function weeklyAttendanceRate(
  sessions: ResourceRoomSession[],
  childId: string,
  weeksBack = 4
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeksBack * 7);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const relevant = sessions.filter(
    (s) =>
      s.childId === childId &&
      s.scheduledDate >= cutoffStr &&
      s.status !== 'cancelled'
  );
  if (relevant.length === 0) return 0;

  const attended = relevant.filter(
    (s) => s.status === 'completed'
  ).length;
  return Math.round((attended / relevant.length) * 100);
}

export function averageAchievement(
  sessions: ResourceRoomSession[],
  childId: string
): number | null {
  const completed = sessions.filter(
    (s) =>
      s.childId === childId &&
      s.status === 'completed' &&
      s.achievementPercent != null
  );
  if (completed.length === 0) return null;
  const sum = completed.reduce(
    (acc, s) => acc + (s.achievementPercent ?? 0),
    0
  );
  return Math.round(sum / completed.length);
}

export function buildWeeklySchedule(
  childId: string,
  slotIds: string[],
  slots: ResourceRoomSlot[] = DEFAULT_RESOURCE_ROOM_SLOTS
): ResourceRoomWeeklySchedule {
  const selected = slots.filter((s) => slotIds.includes(s.id));
  return {
    childId,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    slots: selected.map((s) => ({
      slotId: s.id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      sessionType: s.sessionType,
      roomName: s.roomName,
    })),
  };
}

export function upcomingSessions(
  sessions: ResourceRoomSession[],
  childId?: string,
  limit = 5
): ResourceRoomSession[] {
  const today = new Date().toISOString().slice(0, 10);
  return sessions
    .filter(
      (s) =>
        s.scheduledDate >= today &&
        s.status === 'scheduled' &&
        (!childId || s.childId === childId)
    )
    .sort((a, b) =>
      a.scheduledDate === b.scheduledDate
        ? a.startTime.localeCompare(b.startTime)
        : a.scheduledDate.localeCompare(b.scheduledDate)
    )
    .slice(0, limit);
}

export const DAY_LABELS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

export function dayLabelAr(dayOfWeek: number): string {
  return DAY_LABELS_AR[dayOfWeek] ?? '';
}
