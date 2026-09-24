/**
 * قناة غرفة الطفل المغلقة: رسائل وملاحظات ولي الأمر والمدرس على الخادم.
 */

import { readHubJsonFile, writeHubJsonFile } from '@/lib/hubPersistence';

export const ROOM_MESSAGES_FILE = 'child-room-messages.json';

export const ROOM_CHANNEL_ROLES = [
  'parent',
  'teacher',
  'specialist',
  'scientific_advisor',
  'admin',
] as const;

export function canUseRoomChannel(role?: string | null) {
  return ROOM_CHANNEL_ROLES.includes(role as (typeof ROOM_CHANNEL_ROLES)[number]);
}

export type RoomMessage = {
  id: string;
  childId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
};

function clean(value: unknown, max: number) {
  return String(value || '')
    .replace(/[\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function parseRoomMessages(raw: string | null): RoomMessage[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { messages?: unknown[] };
    if (!Array.isArray(parsed.messages)) return [];
    return parsed.messages.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const row = item as Record<string, unknown>;
      const message: RoomMessage = {
        id: clean(row.id, 80),
        childId: clean(row.childId, 80),
        authorId: clean(row.authorId, 80),
        authorName: clean(row.authorName, 80) || 'مشارك',
        authorRole: clean(row.authorRole, 40),
        body: clean(row.body, 1000),
        createdAt: clean(row.createdAt, 40),
      };
      if (!message.id || !message.childId || !message.body) return [];
      return [message];
    });
  } catch {
    return [];
  }
}

export function messagesForChild(messages: RoomMessage[], childId: string) {
  return messages
    .filter((message) => message.childId === childId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

export function appendRoomMessage(
  messages: RoomMessage[],
  input: Omit<RoomMessage, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): { ok: true; messages: RoomMessage[]; message: RoomMessage } | { ok: false; error: string } {
  const body = clean(input.body, 1000);
  const childId = clean(input.childId, 80);
  if (!childId || body.length < 1) return { ok: false, error: 'TEXT_REQUIRED' };
  const message: RoomMessage = {
    id: input.id || `room_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    childId,
    authorId: clean(input.authorId, 80),
    authorName: clean(input.authorName, 80) || 'مشارك',
    authorRole: clean(input.authorRole, 40),
    body,
    createdAt: input.createdAt || new Date().toISOString(),
  };
  const others = messages.filter((item) => item.childId !== childId);
  const mine = messagesForChild(messages, childId).concat(message).slice(-200);
  return { ok: true, messages: [...others, ...mine], message };
}

export async function loadRoomMessages(): Promise<RoomMessage[]> {
  return parseRoomMessages(await readHubJsonFile(ROOM_MESSAGES_FILE));
}

export async function saveRoomMessages(messages: RoomMessage[]): Promise<void> {
  await writeHubJsonFile(ROOM_MESSAGES_FILE, JSON.stringify({ messages }));
}
