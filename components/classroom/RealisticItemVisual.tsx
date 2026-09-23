'use client';

import { useId, type ReactElement } from 'react';

/** رسوم مجسّمة بظل وإضاءة بدل الرموز التعبيرية المسطحة. */
const OBJECTS: Record<string, (size: number, uid: string) => ReactElement> = {
  '🍎': (s, uid) => (
    <svg width={s} height={s} viewBox="0 0 120 120" aria-hidden>
      <ellipse cx="60" cy="102" rx="28" ry="8" fill="#0f172a" opacity="0.18" />
      <path d="M60 28c8-16 28-14 30-2" fill="none" stroke="#3f6212" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="74" cy="24" rx="10" ry="6" fill="#65a30d" transform="rotate(-20 74 24)" />
      <circle cx="60" cy="68" r="36" fill={`url(#${uid}-apple)`} />
      <ellipse cx="46" cy="54" rx="12" ry="8" fill="#fff" opacity="0.35" />
      <defs>
        <radialGradient id={`${uid}-apple`} cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#fecaca" />
          <stop offset="45%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#991b1b" />
        </radialGradient>
      </defs>
    </svg>
  ),
  '🍌': (s, uid) => (
    <svg width={s} height={s} viewBox="0 0 120 120" aria-hidden>
      <ellipse cx="62" cy="100" rx="26" ry="7" fill="#0f172a" opacity="0.16" />
      <path d="M28 78c8-28 28-48 58-46 6 18-8 40-28 52-16 10-28 8-30-6z" fill={`url(#${uid}-banana)`} />
      <defs>
        <linearGradient id={`${uid}-banana`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="55%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
      </defs>
    </svg>
  ),
  '🍊': (s, uid) => (
    <svg width={s} height={s} viewBox="0 0 120 120" aria-hidden>
      <ellipse cx="60" cy="100" rx="26" ry="7" fill="#0f172a" opacity="0.16" />
      <circle cx="60" cy="64" r="34" fill={`url(#${uid}-orange)`} />
      <ellipse cx="48" cy="52" rx="10" ry="6" fill="#fff" opacity="0.28" />
      <defs>
        <radialGradient id={`${uid}-orange`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="40%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#c2410c" />
        </radialGradient>
      </defs>
    </svg>
  ),
  '🐱': (s) => face(s, '#fdba74', '#9a3412'),
  '🐶': (s) => face(s, '#d6d3d1', '#44403c'),
  '🦁': (s) => face(s, '#fbbf24', '#b45309'),
  '🐦': (s, uid) => (
    <svg width={s} height={s} viewBox="0 0 120 120" aria-hidden>
      <ellipse cx="62" cy="100" rx="22" ry="6" fill="#0f172a" opacity="0.15" />
      <ellipse cx="58" cy="62" rx="28" ry="22" fill={`url(#${uid}-bird)`} />
      <circle cx="74" cy="54" r="4" fill="#0f172a" />
      <path d="M84 60l16 6-16 4z" fill="#f59e0b" />
      <defs>
        <linearGradient id={`${uid}-bird`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
      </defs>
    </svg>
  ),
  '🐟': (s, uid) => (
    <svg width={s} height={s} viewBox="0 0 120 120" aria-hidden>
      <ellipse cx="60" cy="100" rx="24" ry="6" fill="#0f172a" opacity="0.15" />
      <ellipse cx="58" cy="62" rx="32" ry="18" fill={`url(#${uid}-fish)`} />
      <path d="M90 62l18-14v28z" fill="#0284c7" />
      <circle cx="40" cy="58" r="3" fill="#0f172a" />
      <defs>
        <linearGradient id={`${uid}-fish`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
      </defs>
    </svg>
  ),
  '🚗': (s) => vehicle(s, '#ef4444'),
  '🚌': (s) => vehicle(s, '#f59e0b'),
  '🍞': (s, uid) => (
    <svg width={s} height={s} viewBox="0 0 120 120" aria-hidden>
      <ellipse cx="60" cy="98" rx="28" ry="6" fill="#0f172a" opacity="0.15" />
      <path d="M24 70c0-22 16-36 36-36s36 14 36 36v16H24z" fill={`url(#${uid}-bread)`} />
      <defs>
        <linearGradient id={`${uid}-bread`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
    </svg>
  ),
  '🥄': (s, uid) => utensil(s, uid),
  '🥤': (s, uid) => (
    <svg width={s} height={s} viewBox="0 0 120 120" aria-hidden>
      <ellipse cx="60" cy="102" rx="16" ry="5" fill="#0f172a" opacity="0.16" />
      <path d="M42 36h36l-6 58H48z" fill={`url(#${uid}-cup)`} />
      <rect x="40" y="28" width="40" height="10" rx="3" fill="#e2e8f0" />
      <defs>
        <linearGradient id={`${uid}-cup`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="50%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
    </svg>
  ),
  '🪥': (s, uid) => utensil(s, uid),
  '👟': (s, uid) => (
    <svg width={s} height={s} viewBox="0 0 120 120" aria-hidden>
      <ellipse cx="64" cy="96" rx="30" ry="7" fill="#0f172a" opacity="0.16" />
      <path d="M22 72c18-8 28-22 36-22 10 0 16 8 40 10 4 8-2 18-16 20H28c-8 0-12-4-6-8z" fill={`url(#${uid}-shoe)`} />
      <defs>
        <linearGradient id={`${uid}-shoe`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>
    </svg>
  ),
};

function face(size: number, light: string, dark: string) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
      <ellipse cx="60" cy="100" rx="26" ry="7" fill="#0f172a" opacity="0.16" />
      <circle cx="60" cy="64" r="34" fill={light} />
      <circle cx="46" cy="58" r="4" fill={dark} />
      <circle cx="74" cy="58" r="4" fill={dark} />
      <ellipse cx="48" cy="50" rx="8" ry="5" fill="#fff" opacity="0.35" />
    </svg>
  );
}

function vehicle(size: number, color: string) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
      <ellipse cx="60" cy="96" rx="32" ry="7" fill="#0f172a" opacity="0.18" />
      <rect x="22" y="52" width="76" height="28" rx="8" fill={color} />
      <path d="M36 52l10-16h28l10 16" fill={color} opacity="0.85" />
      <circle cx="38" cy="82" r="8" fill="#0f172a" />
      <circle cx="82" cy="82" r="8" fill="#0f172a" />
    </svg>
  );
}

function utensil(size: number, uid: string) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
      <ellipse cx="60" cy="102" rx="14" ry="5" fill="#0f172a" opacity="0.14" />
      <rect x="54" y="28" width="8" height="62" rx="4" fill={`url(#${uid}-metal)`} />
      <ellipse cx="58" cy="28" rx="16" ry="10" fill="#e2e8f0" />
      <defs>
        <linearGradient id={`${uid}-metal`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="50%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function hasRealisticItem(symbol: string) {
  return Boolean(OBJECTS[symbol]);
}

export default function RealisticItemVisual({
  symbol,
  size = 160,
  label,
}: {
  symbol: string;
  size?: number;
  label?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const draw = OBJECTS[symbol];
  if (!draw) {
    return (
      <span className="text-5xl leading-none" aria-label={label}>
        {symbol}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center" role="img" aria-label={label ?? symbol}>
      {draw(size, uid)}
    </span>
  );
}
