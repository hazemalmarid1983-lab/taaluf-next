/**
 * تخزين جلسات وجداول غرف المصادر
 */

import { LD_STORAGE } from '@/lib/tracks/storageKeys';
import type {
  ResourceRoomSession,
  ResourceRoomWeeklySchedule,
} from './types';

function readSessions(): ResourceRoomSession[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(LD_STORAGE.resourceRoomSessions);
    return raw ? (JSON.parse(raw) as ResourceRoomSession[]) : [];
  } catch {
    return [];
  }
}

function writeSessions(sessions: ResourceRoomSession[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(
    LD_STORAGE.resourceRoomSessions,
    JSON.stringify(sessions)
  );
}

function readSchedules(): ResourceRoomWeeklySchedule[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(LD_STORAGE.resourceRoomSchedule);
    return raw ? (JSON.parse(raw) as ResourceRoomWeeklySchedule[]) : [];
  } catch {
    return [];
  }
}

function writeSchedules(schedules: ResourceRoomWeeklySchedule[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(
    LD_STORAGE.resourceRoomSchedule,
    JSON.stringify(schedules)
  );
}

export function listResourceRoomSessions(childId?: string): ResourceRoomSession[] {
  const all = readSessions();
  if (!childId) return all;
  return all.filter((s) => s.childId === childId);
}

export function getResourceRoomSession(id: string): ResourceRoomSession | null {
  return readSessions().find((s) => s.id === id) ?? null;
}

export function saveResourceRoomSession(session: ResourceRoomSession): ResourceRoomSession {
  const sessions = readSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.push(session);
  }
  writeSessions(sessions);
  return session;
}

export function deleteResourceRoomSession(id: string) {
  writeSessions(readSessions().filter((s) => s.id !== id));
}

export function getWeeklySchedule(
  childId: string
): ResourceRoomWeeklySchedule | null {
  return readSchedules().find((s) => s.childId === childId) ?? null;
}

export function saveWeeklySchedule(schedule: ResourceRoomWeeklySchedule) {
  const schedules = readSchedules();
  const idx = schedules.findIndex((s) => s.childId === schedule.childId);
  if (idx >= 0) {
    schedules[idx] = schedule;
  } else {
    schedules.push(schedule);
  }
  writeSchedules(schedules);
}
