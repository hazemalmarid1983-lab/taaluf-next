/** مواعيد متاحة لفريق متعدد التخصصات */

export type BookingSlot = {
  id: string;
  date: string;
  time: string;
  label: string;
  team: string;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** يولّد مواعيد للأيام القادمة (أيام العمل) */
export function getAvailableSlots(from = new Date(), days = 14): BookingSlot[] {
  const slots: BookingSlot[] = [];
  const times = ['09:00', '11:00', '13:00', '16:00'];
  const cursor = new Date(from);
  cursor.setHours(12, 0, 0, 0);

  for (let d = 1; d <= days + 10 && slots.length < 16; d++) {
    const day = new Date(cursor);
    day.setDate(cursor.getDate() + d);
    const wd = day.getDay();
    if (wd === 5 || wd === 6) continue; // جمعة/سبت
    const date = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
    const dateLabel = day.toLocaleDateString('ar-EG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    for (const time of times) {
      if (slots.length >= 16) break;
      slots.push({
        id: `${date}_${time}`,
        date,
        time,
        label: `${dateLabel} — ${time}`,
        team: 'تربية خاصة · نطق · نفسي تربوي · وظيفي',
      });
    }
  }
  return slots;
}

export function getSlotById(id: string) {
  return getAvailableSlots().find((s) => s.id === id) || null;
}
