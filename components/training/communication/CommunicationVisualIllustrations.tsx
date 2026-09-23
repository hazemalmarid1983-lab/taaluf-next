'use client';

type SvgProps = { className?: string; size?: number };

/** رسوم SVG تعليمية مؤقتة — قابلة للاستبدال بـ static-image لاحقاً */
export function CommIllWater({ className, size = 120 }: SvgProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <rect x="8" y="8" width="104" height="104" rx="24" fill="#E8F4FC" />
      <path
        d="M60 28c-8 14-22 28-22 42a22 22 0 1044 0c0-14-14-28-22-42z"
        fill="#3D7DD6"
      />
      <path
        d="M60 38c-5 9-14 18-14 28a14 14 0 1028 0c0-10-9-19-14-28z"
        fill="#6BA3E8"
        opacity="0.55"
      />
      <rect x="72" y="78" width="28" height="18" rx="6" fill="#2E7D8E" opacity="0.85" />
    </svg>
  );
}

export function CommIllFood({ className, size = 120 }: SvgProps) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden>
      <rect x="8" y="8" width="104" height="104" rx="24" fill="#FFF4E8" />
      <ellipse cx="60" cy="72" rx="38" ry="14" fill="#E08A3C" opacity="0.35" />
      <path
        d="M32 68 L60 38 L88 68 Z"
        fill="#E08A3C"
        stroke="#C4722A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="48" cy="58" r="6" fill="#3A9B6E" />
      <circle cx="68" cy="54" r="5" fill="#C94C4C" />
      <rect x="54" y="48" width="12" height="8" rx="2" fill="#F5D547" />
    </svg>
  );
}

export function CommIllToy({ className, size = 120 }: SvgProps) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden>
      <rect x="8" y="8" width="104" height="104" rx="24" fill="#F3EEF9" />
      <circle cx="60" cy="52" r="22" fill="#7B5EA7" />
      <circle cx="50" cy="48" r="4" fill="#1e293b" />
      <circle cx="70" cy="48" r="4" fill="#1e293b" />
      <path
        d="M48 58 Q60 68 72 58"
        fill="none"
        stroke="#1e293b"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <rect x="38" y="72" width="44" height="28" rx="12" fill="#9B7BC7" />
      <rect x="48" y="82" width="24" height="10" rx="5" fill="#E8DFF5" />
    </svg>
  );
}

export function CommIllBook({ className, size = 120 }: SvgProps) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden>
      <rect x="8" y="8" width="104" height="104" rx="24" fill="#EAF6F0" />
      <path
        d="M36 34 H84 V86 H36 Z"
        fill="#3A9B6E"
        rx="4"
      />
      <path d="M60 34 V86" stroke="#2E7D5A" strokeWidth="2" />
      <path
        d="M42 44 H56 M42 52 H56 M42 60 H52"
        stroke="#EAF6F0"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M64 44 H78 M64 52 H78 M64 60 H72"
        stroke="#EAF6F0"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const ILLUSTRATIONS: Record<string, (props: SvgProps) => JSX.Element> = {
  'comm-ill-water': CommIllWater,
  'comm-ill-food': CommIllFood,
  'comm-ill-toy': CommIllToy,
  'comm-ill-book': CommIllBook,
};

export function CommunicationVisualIllustration({
  assetId,
  size = 120,
  className,
}: {
  assetId: string;
  size?: number;
  className?: string;
}) {
  const Render = ILLUSTRATIONS[assetId];
  if (!Render) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-slate-100 text-slate-400 ${className ?? ''}`}
        style={{ width: size, height: size }}
        aria-hidden
      >
        ?
      </div>
    );
  }
  return <Render size={size} className={className} />;
}
