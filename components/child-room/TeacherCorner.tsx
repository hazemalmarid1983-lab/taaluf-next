'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  addTeacherNote,
  listTeacherNotes,
  readTeacherSession,
} from '@/lib/childRoom/gate';

export default function TeacherCorner({ childId }: { childId: string }) {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<string[]>([]);
  const [rooms, setRooms] = useState<Array<{ childId: string; childName: string }>>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const session = readTeacherSession();
    if (!session?.childIds.includes(childId)) {
      setVisible(false);
      return;
    }
    setVisible(true);
    setNotes(listTeacherNotes(childId));
    let invites: Array<{ childId: string; childName: string }> = [];
    try {
      invites = JSON.parse(localStorage.getItem('taaluf.childRoom.invites.v1') || '[]');
    } catch {
      invites = [];
    }
    setRooms(
      session.childIds.map((id) => ({
        childId: id,
        childName: invites.find((invite) => invite.childId === id)?.childName || id,
      }))
    );
  }, [childId]);

  if (!visible) return null;

  return (
    <section className="mx-auto mt-6 max-w-lg rounded-2xl border border-slate-200 bg-slate-50 p-5 text-right">
      <h2 className="text-base font-bold text-slate-900">زاوية المدرس</h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        سجل الجلسة هنا. القائمة تعرض الغرف المسندة إليك فقط.
      </p>
      {rooms.length > 1 ? (
        <ul className="mt-3 space-y-1 text-sm">
          {rooms.map((room) => (
            <li key={room.childId}>
              <Link
                href={`/dashboard/child-room?child=${encodeURIComponent(room.childId)}`}
                className="font-semibold text-[#2E7D8E] underline"
              >
                غرفة {room.childName}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm"
        rows={3}
        placeholder="ملاحظة هذه الجلسة"
      />
      <button
        type="button"
        className="mt-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
        onClick={() => {
          addTeacherNote(childId, note);
          setNotes(listTeacherNotes(childId));
          setNote('');
        }}
      >
        حفظ الملاحظة
      </button>
      <ul className="mt-3 space-y-1 text-sm text-slate-700">
        {notes.map((item, index) => (
          <li key={`${index}-${item}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
