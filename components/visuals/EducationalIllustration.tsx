'use client';

import type { ReactElement } from 'react';
import {
  resolveEducationalAssetId,
  type EducationalAssetId,
} from '@/lib/visuals/educationalAssets';

type Props = {
  asset: string;
  size?: number;
  label?: string;
  className?: string;
};

type Draw = (size: number) => ReactElement;

function svg(size: number, children: ReactElement) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
      {children}
    </svg>
  );
}

/** طفل كرتوني أساسي — يُعاد استخدامه في رسوم الأفعال */
function childBase(
  opts: {
    armL?: ReactElement;
    armR?: ReactElement;
    legL?: ReactElement;
    legR?: ReactElement;
    mouth?: ReactElement;
    extra?: ReactElement;
  } = {}
) {
  return (
    <>
      <ellipse cx="60" cy="108" rx="28" ry="5" fill="#0f172a" opacity="0.12" />
      <circle cx="60" cy="34" r="16" fill="#fdba74" />
      <circle cx="54" cy="32" r="2.2" fill="#1e293b" />
      <circle cx="66" cy="32" r="2.2" fill="#1e293b" />
      {opts.mouth ?? (
        <path d="M54 40q6 5 12 0" fill="none" stroke="#9a3412" strokeWidth="2" strokeLinecap="round" />
      )}
      <path d="M48 48h24l4 34H44z" fill="#38bdf8" />
      {opts.armL ?? <path d="M48 56 L28 72" stroke="#fdba74" strokeWidth="7" strokeLinecap="round" />}
      {opts.armR ?? <path d="M72 56 L92 72" stroke="#fdba74" strokeWidth="7" strokeLinecap="round" />}
      {opts.legL ?? <path d="M50 82 L44 104" stroke="#1d4ed8" strokeWidth="8" strokeLinecap="round" />}
      {opts.legR ?? <path d="M70 82 L76 104" stroke="#1d4ed8" strokeWidth="8" strokeLinecap="round" />}
      {opts.extra}
    </>
  );
}

function animalFace(
  size: number,
  fill: string,
  ear?: ReactElement,
  snout?: ReactElement
) {
  return svg(
    size,
    <>
      <ellipse cx="60" cy="104" rx="26" ry="6" fill="#0f172a" opacity="0.14" />
      {ear}
      <circle cx="60" cy="62" r="34" fill={fill} />
      <circle cx="48" cy="56" r="4" fill="#1e293b" />
      <circle cx="72" cy="56" r="4" fill="#1e293b" />
      <ellipse cx="48" cy="48" rx="8" ry="5" fill="#fff" opacity="0.35" />
      {snout ?? (
        <ellipse cx="60" cy="72" rx="10" ry="7" fill="#fff" opacity="0.45" />
      )}
    </>
  );
}

const ART: Record<EducationalAssetId, Draw> = {
  hands_up: (size) =>
    svg(
      size,
      childBase({
        armL: <path d="M48 54 L34 22" stroke="#fdba74" strokeWidth="8" strokeLinecap="round" />,
        armR: <path d="M72 54 L86 22" stroke="#fdba74" strokeWidth="8" strokeLinecap="round" />,
        extra: (
          <>
            <circle cx="34" cy="18" r="7" fill="#fdba74" />
            <circle cx="86" cy="18" r="7" fill="#fdba74" />
          </>
        ),
      })
    ),
  clap: (size) =>
    svg(
      size,
      childBase({
        armL: <path d="M48 58 L52 70" stroke="#fdba74" strokeWidth="8" strokeLinecap="round" />,
        armR: <path d="M72 58 L68 70" stroke="#fdba74" strokeWidth="8" strokeLinecap="round" />,
        extra: (
          <>
            <ellipse cx="52" cy="74" rx="10" ry="7" fill="#fdba74" />
            <ellipse cx="68" cy="74" rx="10" ry="7" fill="#fdba74" />
            <path d="M44 62 L36 52 M76 62 L84 52" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
          </>
        ),
      })
    ),
  wave: (size) =>
    svg(
      size,
      childBase({
        armR: <path d="M72 54 C86 40 94 28 98 18" stroke="#fdba74" strokeWidth="8" strokeLinecap="round" />,
        extra: (
          <>
            <circle cx="98" cy="16" r="7" fill="#fdba74" />
            <path d="M104 10 q8 4 0 10" fill="none" stroke="#f59e0b" strokeWidth="3" />
          </>
        ),
      })
    ),
  touch_nose: (size) =>
    svg(
      size,
      childBase({
        armR: <path d="M72 54 L66 40" stroke="#fdba74" strokeWidth="8" strokeLinecap="round" />,
        extra: (
          <>
            <ellipse cx="60" cy="36" rx="4" ry="3" fill="#fb7185" />
            <circle cx="66" cy="38" r="6" fill="#fdba74" />
          </>
        ),
      })
    ),
  touch_head: (size) =>
    svg(
      size,
      childBase({
        armR: <path d="M72 52 L60 18" stroke="#fdba74" strokeWidth="8" strokeLinecap="round" />,
        extra: (
          <>
            <circle cx="60" cy="16" r="7" fill="#fdba74" />
            <path d="M44 24c8-12 32-12 40 0" fill="none" stroke="#92400e" strokeWidth="5" strokeLinecap="round" />
          </>
        ),
      })
    ),
  smile: (size) =>
    svg(
      size,
      <>
        <ellipse cx="60" cy="104" rx="28" ry="5" fill="#0f172a" opacity="0.12" />
        <circle cx="60" cy="58" r="36" fill="#fdba74" />
        <circle cx="46" cy="52" r="4" fill="#1e293b" />
        <circle cx="74" cy="52" r="4" fill="#1e293b" />
        <path d="M44 70 Q60 88 76 70" fill="none" stroke="#9a3412" strokeWidth="5" strokeLinecap="round" />
        <circle cx="38" cy="62" r="6" fill="#fb7185" opacity="0.45" />
        <circle cx="82" cy="62" r="6" fill="#fb7185" opacity="0.45" />
      </>
    ),
  come: (size) =>
    svg(
      size,
      <>
        <circle cx="88" cy="28" r="11" fill="#0f766e" />
        <path d="M80 42h16l3 24h-8l-2 26h-8l-2-26h-7z" fill="#115e59" />
        <circle cx="34" cy="48" r="9" fill="#fb923c" />
        <path d="M28 58h12l2 16H28z" fill="#ea580c" />
        <path d="M30 74l-6 20M40 74l8 18" stroke="#ea580c" strokeWidth="5" strokeLinecap="round" />
        <path d="M42 62c10-2 20 4 28 12" stroke="#ea580c" strokeWidth="5" strokeLinecap="round" />
        <path d="M58 52h18" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" strokeDasharray="4 3" />
      </>
    ),
  sit: (size) =>
    svg(
      size,
      <>
        <rect x="70" y="44" width="8" height="34" rx="2" fill="#64748b" />
        <rect x="42" y="72" width="40" height="9" rx="2" fill="#94a3b8" />
        <rect x="46" y="81" width="6" height="22" fill="#475569" />
        <rect x="72" y="81" width="6" height="22" fill="#475569" />
        <circle cx="54" cy="38" r="11" fill="#fb7185" />
        <path d="M46 50h16v18H42z" fill="#e11d48" />
        <path d="M44 68h22v8H40z" fill="#be123c" />
        <path d="M44 76v18M58 76v18" stroke="#9f1239" strokeWidth="6" strokeLinecap="round" />
      </>
    ),
  give: (size) =>
    svg(
      size,
      <>
        <circle cx="28" cy="34" r="11" fill="#38bdf8" />
        <path d="M20 48h16v26H18z" fill="#0284c7" />
        <path d="M34 60c18-8 30-4 42 4" stroke="#fcd34d" strokeWidth="12" strokeLinecap="round" />
        <path d="M70 54c8 2 16 8 18 14-10 2-18-2-24-8-2 8-8 12-14 10 2-8 8-14 20-16z" fill="#fde68a" />
        <circle cx="94" cy="58" r="13" fill="#22c55e" />
        <ellipse cx="90" cy="54" rx="4" ry="3" fill="#fff" opacity="0.5" />
      </>
    ),
  face_child: (size) =>
    svg(
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
    svg(
      size,
      <>
        <circle cx="60" cy="66" r="32" fill="#e7e5e4" />
        <circle cx="48" cy="60" r="4" fill="#1e293b" />
        <circle cx="72" cy="60" r="4" fill="#1e293b" />
        <path d="M50 76h20" stroke="#57534e" strokeWidth="3" strokeLinecap="round" />
        <path d="M34 42h52" stroke="#44403c" strokeWidth="8" strokeLinecap="round" />
      </>
    ),
  water: (size) =>
    svg(
      size,
      <>
        <path d="M60 18c-18 28-32 42-32 58a32 32 0 0064 0c0-16-14-30-32-58z" fill="#3b82f6" />
        <path d="M60 34c-10 16-18 28-18 40a18 18 0 0036 0c0-12-8-24-18-40z" fill="#93c5fd" opacity="0.75" />
      </>
    ),
  food: (size) =>
    svg(
      size,
      <>
        <ellipse cx="60" cy="88" rx="36" ry="12" fill="#fdba74" />
        <path d="M28 80c10-32 54-32 64 0" fill="#f97316" />
        <circle cx="48" cy="62" r="8" fill="#22c55e" />
        <circle cx="70" cy="58" r="7" fill="#ef4444" />
        <rect x="56" y="50" width="12" height="9" rx="2" fill="#facc15" />
      </>
    ),
  toy: (size) =>
    svg(
      size,
      <>
        <circle cx="60" cy="46" r="24" fill="#a78bfa" />
        <circle cx="52" cy="42" r="3.5" fill="#1e293b" />
        <circle cx="68" cy="42" r="3.5" fill="#1e293b" />
        <path d="M50 54q10 9 20 0" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="34" y="70" width="52" height="28" rx="14" fill="#7c3aed" />
        <circle cx="48" cy="84" r="4" fill="#fde68a" />
        <circle cx="72" cy="84" r="4" fill="#fde68a" />
      </>
    ),
  book: (size) =>
    svg(
      size,
      <>
        <ellipse cx="60" cy="102" rx="28" ry="5" fill="#0f172a" opacity="0.12" />
        <path d="M26 32h34v56H26z" fill="#16a34a" />
        <path d="M60 32h34v56H60z" fill="#15803d" />
        <path d="M34 46h18M34 56h14M68 46h18M68 56h14" stroke="#ecfdf5" strokeWidth="3" strokeLinecap="round" />
      </>
    ),
  ball: (size) =>
    svg(
      size,
      <>
        <ellipse cx="60" cy="102" rx="26" ry="5" fill="#0f172a" opacity="0.14" />
        <circle cx="60" cy="60" r="34" fill="#ef4444" />
        <path d="M60 26c10 12 10 56 0 68" fill="none" stroke="#fff" strokeWidth="3.5" />
        <path d="M30 48c20 8 40 8 60 0" fill="none" stroke="#fff" strokeWidth="3.5" />
        <ellipse cx="46" cy="46" rx="10" ry="6" fill="#fff" opacity="0.35" />
      </>
    ),
  cat: (size) =>
    animalFace(
      size,
      '#fdba74',
      <>
        <path d="M34 40 L42 18 L52 40z" fill="#fb923c" />
        <path d="M68 40 L78 18 L86 40z" fill="#fb923c" />
      </>,
      <ellipse cx="60" cy="74" rx="8" ry="5" fill="#fb7185" />
    ),
  dog: (size) =>
    animalFace(
      size,
      '#d6d3d1',
      <>
        <ellipse cx="34" cy="58" rx="12" ry="16" fill="#a8a29e" />
        <ellipse cx="86" cy="58" rx="12" ry="16" fill="#a8a29e" />
      </>,
      <ellipse cx="60" cy="76" rx="12" ry="8" fill="#78716c" />
    ),
  rabbit: (size) =>
    animalFace(
      size,
      '#f5f5f4',
      <>
        <ellipse cx="46" cy="28" rx="8" ry="22" fill="#e7e5e4" />
        <ellipse cx="74" cy="28" rx="8" ry="22" fill="#e7e5e4" />
        <ellipse cx="46" cy="28" rx="3" ry="12" fill="#fda4af" />
        <ellipse cx="74" cy="28" rx="3" ry="12" fill="#fda4af" />
      </>
    ),
  fish: (size) =>
    svg(
      size,
      <>
        <ellipse cx="60" cy="102" rx="24" ry="5" fill="#0f172a" opacity="0.12" />
        <ellipse cx="56" cy="60" rx="34" ry="20" fill="#38bdf8" />
        <path d="M90 60l22-16v32z" fill="#0284c7" />
        <circle cx="40" cy="56" r="4" fill="#0f172a" />
        <ellipse cx="48" cy="48" rx="8" ry="4" fill="#fff" opacity="0.35" />
      </>
    ),
  bird: (size) =>
    svg(
      size,
      <>
        <ellipse cx="60" cy="102" rx="22" ry="5" fill="#0f172a" opacity="0.12" />
        <ellipse cx="56" cy="62" rx="28" ry="22" fill="#38bdf8" />
        <circle cx="72" cy="54" r="4" fill="#0f172a" />
        <path d="M84 60l16 6-16 4z" fill="#f59e0b" />
        <path d="M40 62c-10 4-16 14-8 18" fill="#0284c7" />
      </>
    ),
  horse: (size) => animalFace(size, '#b45309'),
  sheep: (size) => animalFace(size, '#f5f5f4', undefined, <ellipse cx="60" cy="74" rx="10" ry="7" fill="#a8a29e" />),
  cow: (size) =>
    animalFace(
      size,
      '#fafaf9',
      <>
        <ellipse cx="34" cy="42" rx="8" ry="6" fill="#a8a29e" />
        <ellipse cx="86" cy="42" rx="8" ry="6" fill="#a8a29e" />
      </>,
      <>
        <ellipse cx="52" cy="58" rx="8" ry="10" fill="#57534e" />
        <ellipse cx="70" cy="66" rx="7" ry="8" fill="#57534e" />
      </>
    ),
  chicken: (size) =>
    svg(
      size,
      <>
        <ellipse cx="60" cy="78" rx="28" ry="22" fill="#fef3c7" />
        <circle cx="60" cy="46" r="18" fill="#fde68a" />
        <path d="M60 24l4 12h-8z" fill="#ef4444" />
        <circle cx="54" cy="44" r="2.5" fill="#1e293b" />
        <path d="M72 48h12l-8 4z" fill="#f97316" />
      </>
    ),
  goat: (size) => animalFace(size, '#d6d3d1'),
  duck: (size) =>
    svg(
      size,
      <>
        <ellipse cx="58" cy="72" rx="30" ry="18" fill="#facc15" />
        <circle cx="78" cy="52" r="16" fill="#fde047" />
        <path d="M90 52h16l-10 6z" fill="#f97316" />
        <circle cx="82" cy="48" r="2.5" fill="#1e293b" />
      </>
    ),
  lion: (size) =>
    svg(
      size,
      <>
        <circle cx="60" cy="62" r="40" fill="#f59e0b" />
        <circle cx="60" cy="62" r="26" fill="#fde68a" />
        <circle cx="50" cy="58" r="3.5" fill="#1e293b" />
        <circle cx="70" cy="58" r="3.5" fill="#1e293b" />
        <ellipse cx="60" cy="72" rx="8" ry="5" fill="#b45309" />
      </>
    ),
  elephant: (size) =>
    svg(
      size,
      <>
        <circle cx="60" cy="58" r="30" fill="#94a3b8" />
        <ellipse cx="28" cy="62" rx="12" ry="18" fill="#64748b" />
        <ellipse cx="92" cy="62" rx="12" ry="18" fill="#64748b" />
        <path d="M60 70c0 18 4 28 10 34" fill="none" stroke="#64748b" strokeWidth="10" strokeLinecap="round" />
        <circle cx="50" cy="54" r="3.5" fill="#1e293b" />
        <circle cx="70" cy="54" r="3.5" fill="#1e293b" />
      </>
    ),
  giraffe: (size) =>
    svg(
      size,
      <>
        <rect x="54" y="28" width="12" height="48" rx="6" fill="#fbbf24" />
        <circle cx="60" cy="24" r="14" fill="#fcd34d" />
        <circle cx="56" cy="22" r="2" fill="#1e293b" />
        <ellipse cx="60" cy="88" rx="22" ry="16" fill="#f59e0b" />
        <circle cx="50" cy="80" r="5" fill="#b45309" />
        <circle cx="72" cy="86" r="4" fill="#b45309" />
      </>
    ),
  monkey: (size) => animalFace(size, '#a16207', undefined, <ellipse cx="60" cy="72" rx="14" ry="10" fill="#fde68a" />),
  bear: (size) =>
    animalFace(
      size,
      '#92400e',
      <>
        <circle cx="36" cy="40" r="10" fill="#78350f" />
        <circle cx="84" cy="40" r="10" fill="#78350f" />
      </>
    ),
  tiger: (size) =>
    animalFace(
      size,
      '#fb923c',
      undefined,
      <>
        <path d="M48 48 L52 70 M68 48 L64 70 M60 42 V78" stroke="#1e293b" strokeWidth="3" />
        <ellipse cx="60" cy="74" rx="10" ry="6" fill="#fff7ed" />
      </>
    ),
  apple: (size) =>
    svg(
      size,
      <>
        <ellipse cx="60" cy="104" rx="22" ry="5" fill="#0f172a" opacity="0.12" />
        <circle cx="60" cy="66" r="32" fill="#ef4444" />
        <path d="M60 34c6-12 20-10 22-2" fill="none" stroke="#3f6212" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="74" cy="30" rx="8" ry="5" fill="#65a30d" />
        <ellipse cx="48" cy="54" rx="10" ry="6" fill="#fff" opacity="0.3" />
      </>
    ),
  banana: (size) =>
    svg(
      size,
      <>
        <path d="M84 24C108 48 96 84 44 100" fill="none" stroke="#facc15" strokeWidth="28" strokeLinecap="round" />
        <path d="M78 30C96 48 88 76 52 90" fill="none" stroke="#fef9c3" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
        <path d="M92 18c6-2 10 4 6 8" fill="#854d0e" />
      </>
    ),
  orange: (size) =>
    svg(
      size,
      <>
        <circle cx="60" cy="64" r="34" fill="#fb923c" />
        <ellipse cx="48" cy="52" rx="10" ry="6" fill="#fff" opacity="0.28" />
        <path d="M60 30c4-8 14-8 16-2" fill="none" stroke="#3f6212" strokeWidth="3" />
      </>
    ),
  grapes: (size) =>
    svg(
      size,
      <>
        <circle cx="48" cy="48" r="12" fill="#7c3aed" />
        <circle cx="68" cy="48" r="12" fill="#8b5cf6" />
        <circle cx="58" cy="64" r="12" fill="#6d28d9" />
        <circle cx="44" cy="68" r="10" fill="#a78bfa" />
        <circle cx="72" cy="68" r="10" fill="#7c3aed" />
        <path d="M58 28v14" stroke="#3f6212" strokeWidth="4" />
      </>
    ),
  strawberry: (size) =>
    svg(
      size,
      <>
        <path d="M60 28c22 8 30 36 0 64C30 64 38 36 60 28z" fill="#ef4444" />
        <path d="M48 30h24l-6 12H54z" fill="#16a34a" />
        <circle cx="50" cy="52" r="2" fill="#fef08a" />
        <circle cx="66" cy="58" r="2" fill="#fef08a" />
        <circle cx="56" cy="70" r="2" fill="#fef08a" />
      </>
    ),
  watermelon: (size) =>
    svg(
      size,
      <>
        <path d="M20 70c0-28 18-46 40-46s40 18 40 46" fill="#4ade80" />
        <path d="M28 70c0-20 14-34 32-34s32 14 32 34" fill="#f87171" />
        <circle cx="48" cy="58" r="2" fill="#1e293b" />
        <circle cx="64" cy="54" r="2" fill="#1e293b" />
        <circle cx="58" cy="66" r="2" fill="#1e293b" />
      </>
    ),
  carrot: (size) =>
    svg(
      size,
      <>
        <path d="M60 34c18 8 24 40 8 70-28-8-34-40-8-70z" fill="#f97316" />
        <path d="M52 28c4-14 16-18 24-8-8 2-14 8-16 16" fill="#16a34a" />
      </>
    ),
  tomato: (size) =>
    svg(
      size,
      <>
        <circle cx="60" cy="66" r="30" fill="#ef4444" />
        <path d="M48 40c8-10 24-10 28 2-10 0-18 4-28-2z" fill="#16a34a" />
        <ellipse cx="48" cy="56" rx="8" ry="5" fill="#fff" opacity="0.25" />
      </>
    ),
  cucumber: (size) =>
    svg(
      size,
      <>
        <rect x="28" y="44" width="64" height="32" rx="16" fill="#22c55e" />
        <ellipse cx="40" cy="52" rx="4" ry="3" fill="#bbf7d0" />
        <ellipse cx="70" cy="60" rx="4" ry="3" fill="#bbf7d0" />
      </>
    ),
  potato: (size) =>
    svg(
      size,
      <>
        <ellipse cx="60" cy="64" rx="34" ry="26" fill="#d97706" />
        <circle cx="48" cy="58" r="3" fill="#92400e" />
        <circle cx="70" cy="70" r="3" fill="#92400e" />
        <circle cx="62" cy="52" r="2.5" fill="#92400e" />
      </>
    ),
  corn: (size) =>
    svg(
      size,
      <>
        <ellipse cx="60" cy="68" rx="18" ry="36" fill="#facc15" />
        <path d="M42 40c-10 20-8 48 4 60M78 40c10 20 8 48-4 60" fill="#16a34a" />
        <path d="M52 48h16M50 60h20M52 72h16" stroke="#ca8a04" strokeWidth="2" />
      </>
    ),
  bread: (size) =>
    svg(
      size,
      <>
        <path d="M24 72c0-24 16-38 36-38s36 14 36 38v16H24z" fill="#f59e0b" />
        <path d="M30 70c4-16 14-24 30-24s26 8 30 24" fill="#fde68a" />
      </>
    ),
  milk: (size) =>
    svg(
      size,
      <>
        <path d="M42 30h36l8 70H34z" fill="#e0f2fe" />
        <path d="M42 30h36v14H42z" fill="#38bdf8" />
        <rect x="48" y="52" width="24" height="28" rx="4" fill="#fff" opacity="0.7" />
      </>
    ),
  cheese: (size) =>
    svg(
      size,
      <>
        <path d="M24 78 L60 30 L96 78z" fill="#facc15" />
        <circle cx="52" cy="62" r="5" fill="#fde68a" />
        <circle cx="70" cy="68" r="4" fill="#fde68a" />
      </>
    ),
  egg: (size) =>
    svg(
      size,
      <>
        <ellipse cx="60" cy="66" rx="24" ry="32" fill="#fef3c7" />
        <ellipse cx="52" cy="54" rx="8" ry="10" fill="#fff" opacity="0.45" />
      </>
    ),
  rice: (size) =>
    svg(
      size,
      <>
        <ellipse cx="60" cy="78" rx="36" ry="16" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" />
        <ellipse cx="60" cy="58" rx="28" ry="18" fill="#fff" />
        <path d="M44 54h6M54 50h6M64 56h6M50 62h6" stroke="#e2e8f0" strokeWidth="2" />
      </>
    ),
  car: (size) =>
    svg(
      size,
      <>
        <ellipse cx="60" cy="100" rx="34" ry="6" fill="#0f172a" opacity="0.14" />
        <path d="M24 72h72l-8-24H36z" fill="#f97316" />
        <path d="M40 48h32l8 16H34z" fill="#fdba74" />
        <rect x="46" y="52" width="12" height="8" rx="2" fill="#e0f2fe" />
        <rect x="62" y="52" width="12" height="8" rx="2" fill="#e0f2fe" />
        <circle cx="40" cy="80" r="9" fill="#0f172a" />
        <circle cx="80" cy="80" r="9" fill="#0f172a" />
        <circle cx="40" cy="80" r="3.5" fill="#e2e8f0" />
        <circle cx="80" cy="80" r="3.5" fill="#e2e8f0" />
      </>
    ),
  bus: (size) =>
    svg(
      size,
      <>
        <rect x="18" y="40" width="84" height="42" rx="10" fill="#f59e0b" />
        <rect x="26" y="48" width="14" height="12" rx="2" fill="#e0f2fe" />
        <rect x="46" y="48" width="14" height="12" rx="2" fill="#e0f2fe" />
        <rect x="66" y="48" width="14" height="12" rx="2" fill="#e0f2fe" />
        <circle cx="36" cy="86" r="9" fill="#0f172a" />
        <circle cx="84" cy="86" r="9" fill="#0f172a" />
      </>
    ),
  plane: (size) =>
    svg(
      size,
      <>
        <ellipse cx="60" cy="60" rx="40" ry="12" fill="#38bdf8" />
        <path d="M60 48 L60 20 L70 48z" fill="#0284c7" />
        <path d="M40 60 L20 78 L44 66z" fill="#0ea5e9" />
        <path d="M80 60 L100 78 L76 66z" fill="#0ea5e9" />
        <circle cx="88" cy="58" r="3" fill="#e0f2fe" />
      </>
    ),
  train: (size) =>
    svg(
      size,
      <>
        <rect x="24" y="40" width="52" height="40" rx="8" fill="#ef4444" />
        <rect x="76" y="52" width="28" height="28" rx="4" fill="#f87171" />
        <rect x="32" y="48" width="16" height="12" rx="2" fill="#e0f2fe" />
        <circle cx="40" cy="88" r="8" fill="#0f172a" />
        <circle cx="68" cy="88" r="8" fill="#0f172a" />
        <circle cx="90" cy="88" r="7" fill="#0f172a" />
      </>
    ),
  bike: (size) =>
    svg(
      size,
      <>
        <circle cx="34" cy="78" r="16" fill="none" stroke="#0f172a" strokeWidth="5" />
        <circle cx="86" cy="78" r="16" fill="none" stroke="#0f172a" strokeWidth="5" />
        <path d="M34 78 L58 48 L86 78 M58 48 L58 36 M50 36h20" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  ship: (size) =>
    svg(
      size,
      <>
        <path d="M20 72h80l-12 24H32z" fill="#0284c7" />
        <rect x="48" y="40" width="24" height="32" fill="#e2e8f0" />
        <rect x="54" y="28" width="12" height="12" fill="#f87171" />
        <path d="M16 96h88" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
      </>
    ),
  spoon: (size) =>
    svg(
      size,
      <>
        <ellipse cx="60" cy="34" rx="16" ry="12" fill="#e2e8f0" />
        <rect x="54" y="42" width="12" height="52" rx="6" fill="#94a3b8" />
      </>
    ),
  cup: (size) =>
    svg(
      size,
      <>
        <path d="M34 36h44l-6 54H40z" fill="#38bdf8" />
        <path d="M40 36h32l-4 40H44z" fill="#e0f2fe" opacity="0.45" />
        <rect x="32" y="28" width="48" height="10" rx="4" fill="#bae6fd" />
        <path d="M78 46h10a12 12 0 010 24H78" fill="none" stroke="#0284c7" strokeWidth="6" />
      </>
    ),
  toothbrush: (size) =>
    svg(
      size,
      <>
        <rect x="54" y="28" width="12" height="64" rx="6" fill="#38bdf8" />
        <rect x="48" y="20" width="24" height="16" rx="4" fill="#e0f2fe" />
        <path d="M50 24h4M56 24h4M62 24h4" stroke="#0284c7" strokeWidth="2" />
      </>
    ),
  shoe: (size) =>
    svg(
      size,
      <>
        <path d="M22 72c18-8 28-22 36-22 10 0 16 8 40 10 4 8-2 18-16 20H28c-8 0-12-4-6-8z" fill="#334155" />
        <path d="M40 62h20" stroke="#e2e8f0" strokeWidth="3" />
      </>
    ),
  key: (size) =>
    svg(
      size,
      <>
        <circle cx="42" cy="48" r="16" fill="none" stroke="#f59e0b" strokeWidth="8" />
        <rect x="54" y="44" width="44" height="10" rx="4" fill="#fbbf24" />
        <path d="M84 54v12M94 54v8" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
      </>
    ),
  chair: (size) =>
    svg(
      size,
      <>
        <rect x="34" y="28" width="10" height="52" fill="#a16207" />
        <rect x="34" y="70" width="52" height="10" rx="2" fill="#ca8a04" />
        <rect x="40" y="80" width="8" height="22" fill="#92400e" />
        <rect x="72" y="80" width="8" height="22" fill="#92400e" />
      </>
    ),
  shirt: (size) =>
    svg(
      size,
      <>
        <path d="M40 34 L60 46 L80 34 L96 48 L84 56 V96 H36 V56 L24 48z" fill="#38bdf8" />
        <path d="M52 46h16v8H52z" fill="#e0f2fe" />
      </>
    ),
  pants: (size) =>
    svg(
      size,
      <>
        <path d="M36 28h48v28H36z" fill="#1d4ed8" />
        <path d="M36 56h20v44H36z" fill="#1e40af" />
        <path d="M64 56h20v44H64z" fill="#1e40af" />
      </>
    ),
  jacket: (size) =>
    svg(
      size,
      <>
        <path d="M38 34 L60 48 L82 34 L98 50 L84 58 V98 H36 V58 L22 50z" fill="#0f766e" />
        <path d="M60 48v50" stroke="#ecfdf5" strokeWidth="3" />
      </>
    ),
  cap: (size) =>
    svg(
      size,
      <>
        <ellipse cx="60" cy="64" rx="34" ry="16" fill="#2563eb" />
        <path d="M30 64c0-24 14-36 30-36s30 12 30 36" fill="#3b82f6" />
        <path d="M60 64h40" stroke="#1d4ed8" strokeWidth="8" strokeLinecap="round" />
      </>
    ),
  socks: (size) =>
    svg(
      size,
      <>
        <path d="M40 28h16v48c0 12-16 18-16 8z" fill="#f472b6" />
        <path d="M64 28h16v48c0 12-16 18-16 8z" fill="#fb7185" />
        <path d="M40 36h16M64 36h16" stroke="#fff" strokeWidth="3" />
      </>
    ),
  red: (size) =>
    svg(
      size,
      <>
        <circle cx="60" cy="60" r="36" fill="#ef4444" />
        <ellipse cx="46" cy="48" rx="10" ry="6" fill="#fff" opacity="0.3" />
      </>
    ),
  blue: (size) =>
    svg(
      size,
      <>
        <circle cx="60" cy="60" r="36" fill="#3b82f6" />
        <ellipse cx="46" cy="48" rx="10" ry="6" fill="#fff" opacity="0.3" />
      </>
    ),
  green: (size) =>
    svg(
      size,
      <>
        <circle cx="60" cy="60" r="36" fill="#22c55e" />
        <ellipse cx="46" cy="48" rx="10" ry="6" fill="#fff" opacity="0.3" />
      </>
    ),
  yellow: (size) =>
    svg(
      size,
      <>
        <circle cx="60" cy="60" r="36" fill="#eab308" />
        <ellipse cx="46" cy="48" rx="10" ry="6" fill="#fff" opacity="0.35" />
      </>
    ),
  circle: (size) =>
    svg(
      size,
      <>
        <circle cx="60" cy="60" r="34" fill="#f472b6" stroke="#be185d" strokeWidth="4" />
        <ellipse cx="48" cy="48" rx="10" ry="6" fill="#fff" opacity="0.35" />
      </>
    ),
  square: (size) =>
    svg(
      size,
      <>
        <rect x="24" y="24" width="72" height="72" rx="12" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="4" />
        <ellipse cx="42" cy="42" rx="10" ry="6" fill="#fff" opacity="0.35" />
      </>
    ),
  triangle: (size) =>
    svg(
      size,
      <>
        <path d="M60 22 L98 92 H22z" fill="#4ade80" stroke="#15803d" strokeWidth="4" strokeLinejoin="round" />
        <ellipse cx="52" cy="58" rx="8" ry="5" fill="#fff" opacity="0.3" />
      </>
    ),
  star: (size) =>
    svg(
      size,
      <>
        <path
          d="M60 18 L70 48 L102 48 L76 68 L86 98 L60 80 L34 98 L44 68 L18 48 L50 48z"
          fill="#facc15"
          stroke="#ca8a04"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </>
    ),
};

export function hasEducationalIllustration(asset: string) {
  return Boolean(resolveEducationalAssetId(asset));
}

export default function EducationalIllustration({
  asset,
  size = 120,
  label,
  className = '',
}: Props) {
  const id = resolveEducationalAssetId(asset);
  const draw = id ? ART[id] : null;

  if (!draw) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-2xl bg-slate-100 text-2xl font-black text-slate-500 ${className}`}
        style={{ width: size, height: size }}
        role="img"
        aria-label={label || asset}
      >
        {(label || asset || '?').slice(0, 1)}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      role="img"
      aria-label={label || id || asset}
    >
      {draw(size)}
    </span>
  );
}
