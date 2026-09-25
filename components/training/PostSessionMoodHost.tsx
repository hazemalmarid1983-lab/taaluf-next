'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  POST_SESSION_MOODS,
  type PostSessionMoodId,
} from '@/lib/training/postSessionMood';

type Resolver = (mood: PostSessionMoodId) => void;

let pendingResolve: Resolver | null = null;
let openHost: ((open: boolean) => void) | null = null;

/** تنتظر اختيار المزاج قبل أن يُحفظ تقرير الجلسة. */
export function askPostSessionMood(): Promise<PostSessionMoodId> {
  return new Promise((resolve) => {
    pendingResolve = resolve;
    openHost?.(true);
  });
}

export async function withChosenPostSessionMood<
  T extends { postSessionMood?: PostSessionMoodId },
>(session: T): Promise<T> {
  const moodId = await askPostSessionMood();
  return { ...session, postSessionMood: moodId };
}

export default function PostSessionMoodHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    openHost = setOpen;
    if (pendingResolve) setOpen(true);
    return () => {
      openHost = null;
    };
  }, []);

  const choose = (mood: PostSessionMoodId) => {
    setOpen(false);
    const resolve = pendingResolve;
    pendingResolve = null;
    resolve?.(mood);
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center bg-[#0b1f14]/55 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-session-mood-title"
      dir="rtl"
    >
      <div className="w-full max-w-lg rounded-3xl bg-[#F7F3EB] p-6 shadow-2xl">
        <h2 id="post-session-mood-title" className="text-center text-xl font-bold text-[#1F4E5A]">
          كيف حال الطفل الآن؟
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          اختيار سريع قبل حفظ تقرير الجلسة.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {POST_SESSION_MOODS.map((mood) => (
            <button
              key={mood.id}
              type="button"
              onClick={() => choose(mood.id)}
              className="rounded-2xl border-2 border-[#2E7D8E]/20 bg-white px-3 py-4 text-base font-bold text-[#1F4E5A] shadow-sm active:scale-95"
            >
              <span className="mb-1 block text-2xl" aria-hidden>
                {mood.emoji}
              </span>
              {mood.labelAr}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
