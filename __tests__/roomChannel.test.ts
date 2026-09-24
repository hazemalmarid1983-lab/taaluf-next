import { requestClinicalBooking } from '../lib/childRoom/clinicalBookings';
import {
  appendRoomMessage,
  canUseRoomChannel,
  messagesForChild,
  parseRoomMessages,
} from '../lib/childRoom/roomMessages';

describe('child room channel', () => {
  test('keeps parent and teacher notes inside one child room', () => {
    expect(canUseRoomChannel('parent')).toBe(true);
    expect(canUseRoomChannel('teacher')).toBe(true);
    expect(canUseRoomChannel('guest')).toBe(false);
    const first = appendRoomMessage([], {
      childId: 'child_a',
      authorId: 'parent_1',
      authorName: 'ولي الأمر',
      authorRole: 'parent',
      body: 'لاحظت انتظاراً أطول اليوم',
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = appendRoomMessage(first.messages, {
      childId: 'child_b',
      authorId: 'teacher_1',
      authorName: 'المدرس',
      authorRole: 'teacher',
      body: 'ملاحظة غرفة أخرى',
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    const roundTrip = parseRoomMessages(JSON.stringify({ messages: second.messages }));
    expect(messagesForChild(roundTrip, 'child_a')).toHaveLength(1);
    expect(messagesForChild(roundTrip, 'child_a')[0]?.body).toContain('انتظار');
  });

  test('books a progress review once per slot', () => {
    const saved = requestClinicalBooking([], {
      childId: 'child_a',
      childName: 'ليان',
      slotId: '2026-09-27_09:00',
      slotLabel: 'الأحد — 09:00',
      requestedBy: 'parent@taaluf.local',
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.booking.purpose).toBe('progress_review');
    const again = requestClinicalBooking(saved.bookings, {
      childId: 'child_a',
      childName: 'ليان',
      slotId: '2026-09-27_09:00',
      slotLabel: 'الأحد — 09:00',
      requestedBy: 'parent@taaluf.local',
    });
    expect(again.ok).toBe(false);
  });
});
