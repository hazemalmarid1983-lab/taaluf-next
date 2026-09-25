'use client';

import type { ReactElement } from 'react';
import type { CommPictogram } from '@/lib/training/communicationChoiceEngine';
import {
  hasCommPictogramArt,
  type CommPictogramArtId,
} from '@/lib/training/commPictogramArt';

type Props = {
  item: CommPictogram;
  sizePx?: number;
  highlighted?: boolean;
  /** مساعدة بصرية — لا تُستخدم كحالة اختيار/إتقان */
  assistanceHint?: boolean;
};

type Draw = (size: number) => ReactElement;

function frame(size: number, children: ReactElement) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
      {children}
    </svg>
  );
}

const ART: Record<CommPictogramArtId, Draw> = {
  car: (size) =>
    frame(
      size,
      <>
        <ellipse cx="60" cy="98" rx="34" ry="7" fill="#0f172a" opacity="0.16" />
        <path d="M28 70h64l-8-22H40z" fill="#f97316" />
        <path d="M42 48h28l8 16H36z" fill="#fdba74" />
        <rect x="46" y="52" width="12" height="8" rx="2" fill="#e0f2fe" />
        <rect x="62" y="52" width="12" height="8" rx="2" fill="#e0f2fe" />
        <circle cx="42" cy="78" r="8" fill="#0f172a" />
        <circle cx="78" cy="78" r="8" fill="#0f172a" />
        <circle cx="42" cy="78" r="3" fill="#e2e8f0" />
        <circle cx="78" cy="78" r="3" fill="#e2e8f0" />
      </>
    ),
  cup: (size) =>
    frame(
      size,
      <>
        <ellipse cx="54" cy="98" rx="18" ry="5" fill="#0f172a" opacity="0.14" />
        <path d="M34 36h44l-6 52H40z" fill="#38bdf8" />
        <path d="M40 36h32l-4 40H44z" fill="#e0f2fe" opacity="0.45" />
        <rect x="32" y="28" width="48" height="10" rx="4" fill="#bae6fd" />
        <path d="M78 44h10a12 12 0 010 24H78" fill="none" stroke="#0284c7" strokeWidth="6" />
      </>
    ),
  ball: (size) =>
    frame(
      size,
      <>
        <ellipse cx="60" cy="100" rx="26" ry="6" fill="#0f172a" opacity="0.16" />
        <circle cx="60" cy="62" r="32" fill="#ef4444" />
        <path d="M60 30c8 10 8 54 0 64" fill="none" stroke="#fff" strokeWidth="3" />
        <path d="M32 50c18 6 38 6 56 0" fill="none" stroke="#fff" strokeWidth="3" />
        <ellipse cx="48" cy="48" rx="10" ry="6" fill="#fff" opacity="0.35" />
      </>
    ),
  book: (size) =>
    frame(
      size,
      <>
        <ellipse cx="60" cy="100" rx="28" ry="6" fill="#0f172a" opacity="0.14" />
        <path d="M28 34h32v52H28z" fill="#16a34a" />
        <path d="M60 34h32v52H60z" fill="#15803d" />
        <path d="M34 46h20M34 54h16M66 46h20M66 54h16" stroke="#ecfdf5" strokeWidth="3" strokeLinecap="round" />
      </>
    ),
  water: (size) =>
    frame(
      size,
      <>
        <path d="M60 22c-16 24-28 38-28 54a28 28 0 0056 0c0-16-12-30-28-54z" fill="#3b82f6" />
        <path d="M60 36c-8 14-16 24-16 36a16 16 0 0032 0c0-12-8-22-16-36z" fill="#93c5fd" opacity="0.7" />
      </>
    ),
  food: (size) =>
    frame(
      size,
      <>
        <ellipse cx="60" cy="86" rx="34" ry="12" fill="#fdba74" />
        <path d="M30 78c8-28 52-28 60 0" fill="#f97316" />
        <circle cx="48" cy="62" r="7" fill="#22c55e" />
        <circle cx="68" cy="58" r="6" fill="#ef4444" />
        <rect x="56" y="50" width="10" height="8" rx="2" fill="#facc15" />
      </>
    ),
  toy: (size) =>
    frame(
      size,
      <>
        <circle cx="60" cy="48" r="22" fill="#a78bfa" />
        <circle cx="52" cy="44" r="3" fill="#1e293b" />
        <circle cx="68" cy="44" r="3" fill="#1e293b" />
        <path d="M50 54q10 8 20 0" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="36" y="70" width="48" height="26" rx="12" fill="#7c3aed" />
      </>
    ),
  come: (size) =>
    frame(
      size,
      <>
        <circle cx="86" cy="28" r="10" fill="#0f766e" />
        <path d="M78 40h16l4 22h-8l-2 24h-8l-2-24h-8z" fill="#115e59" />
        <path d="M70 48c-8 2-14 8-16 10" stroke="#115e59" strokeWidth="5" strokeLinecap="round" />
        <path d="M102 48c8 2 12 8 14 12" stroke="#115e59" strokeWidth="5" strokeLinecap="round" />
        <circle cx="34" cy="46" r="8" fill="#fb923c" />
        <path d="M28 56h12l2 14H30z" fill="#ea580c" />
        <path d="M30 70l-6 18M40 70l8 16" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" />
        <path d="M42 60c8-2 16 2 22 8" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" />
      </>
    ),
  sit: (size) =>
    frame(
      size,
      <>
        <rect x="68" y="42" width="8" height="36" rx="2" fill="#64748b" />
        <rect x="40" y="72" width="40" height="8" rx="2" fill="#94a3b8" />
        <rect x="44" y="80" width="6" height="22" fill="#475569" />
        <rect x="70" y="80" width="6" height="22" fill="#475569" />
        <circle cx="52" cy="36" r="10" fill="#fb7185" />
        <path d="M44 46h16v18H40z" fill="#e11d48" />
        <path d="M42 64h22v8H38z" fill="#be123c" />
        <path d="M40 72v16M58 72v16" stroke="#9f1239" strokeWidth="5" strokeLinecap="round" />
      </>
    ),
  give: (size) =>
    frame(
      size,
      <>
        <circle cx="28" cy="34" r="10" fill="#38bdf8" />
        <path d="M20 46h16v28H18z" fill="#0284c7" />
        <path d="M34 58c16-6 28-4 40 2" stroke="#fcd34d" strokeWidth="12" strokeLinecap="round" />
        <path d="M70 52c8 2 16 8 18 14-10 2-18-2-24-8-2 8-8 12-14 10 2-8 8-14 20-16z" fill="#fde68a" />
        <circle cx="92" cy="58" r="12" fill="#22c55e" />
        <ellipse cx="88" cy="54" rx="4" ry="3" fill="#fff" opacity="0.45" />
      </>
    ),
  face_child: (size) =>
    frame(
      size,
      <>
        <circle cx="60" cy="64" r="34" fill="#fdba74" />
        <circle cx="48" cy="58" r="4" fill="#1e293b" />
        <circle cx="72" cy="58" r="4" fill="#1e293b" />
        <path d="M50 74q10 8 20 0" fill="none" stroke="#9a3412" strokeWidth="3" strokeLinecap="round" />
        <path d="M36 40c8-16 40-16 48 0" fill="none" stroke="#92400e" strokeWidth="6" strokeLinecap="round" />
      </>
    ),
  face_adult: (size) =>
    frame(
      size,
      <>
        <circle cx="60" cy="66" r="32" fill="#e7e5e4" />
        <circle cx="48" cy="60" r="4" fill="#1e293b" />
        <circle cx="72" cy="60" r="4" fill="#1e293b" />
        <path d="M50 76h20" stroke="#57534e" strokeWidth="3" strokeLinecap="round" />
        <path d="M34 42h52" stroke="#44403c" strokeWidth="8" strokeLinecap="round" />
      </>
    ),
};

export { hasCommPictogramArt };

export default function CommPictogramVisual({
  item,
  sizePx = 96,
  highlighted = false,
  assistanceHint = false,
}: Props) {
  const draw = hasCommPictogramArt(item.id) ? ART[item.id] : undefined;
  const artSize = Math.round(sizePx * 0.78);
  const largeLabel = sizePx >= 120;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 ${
        assistanceHint ? 'motion-safe:animate-pulse' : ''
      }`}
      style={{ width: sizePx, minHeight: sizePx }}
    >
      <div
        className="flex items-center justify-center rounded-3xl bg-white"
        style={{
          width: sizePx,
          height: artSize,
          boxShadow: highlighted
            ? `0 0 0 4px ${item.color}`
            : '0 10px 24px rgba(15,23,42,0.08)',
          outline: assistanceHint ? `3px dashed ${item.color}` : undefined,
        }}
      >
        {draw ? (
          draw(artSize)
        ) : (
          <span className="text-3xl font-black text-slate-500" aria-hidden>
            {item.labelAr.slice(0, 1)}
          </span>
        )}
      </div>
      <span
        className={
          largeLabel
            ? 'text-sm font-bold text-slate-800 sm:text-base'
            : 'text-[10px] font-bold text-slate-700 sm:text-xs'
        }
      >
        {item.labelAr}
      </span>
    </div>
  );
}

export function commPictogramAriaLabel(item: CommPictogram): string {
  return item.labelAr;
}
