'use client';

/** Temporary MVP Asset — illustration placeholders (not Final Educational Asset). */

type Props = {
  movementId: string;
  className?: string;
};

export default function ObserverImitationModelVisual({
  movementId,
  className = 'h-[min(52vh,420px)] w-[min(52vh,420px)]',
}: Props) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={`mx-auto text-[#2E7D8E] ${className}`}
      role="img"
      aria-hidden
    >
      <rect
        x="8"
        y="8"
        width="184"
        height="184"
        rx="32"
        fill="#f0f9fb"
        stroke="currentColor"
        strokeWidth="3"
      />
      <circle cx="100" cy="72" r="28" fill="#d4eef3" stroke="currentColor" strokeWidth="2" />
      {movementId === 'hands_up' && (
        <>
          <path d="M55 120 L55 45 M145 120 L145 45" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
          <circle cx="55" cy="38" r="8" fill="currentColor" />
          <circle cx="145" cy="38" r="8" fill="currentColor" />
        </>
      )}
      {movementId === 'clap' && (
        <>
          <path d="M60 110 Q85 80 110 110" fill="none" stroke="currentColor" strokeWidth="9" />
          <path d="M90 110 Q115 80 140 110" fill="none" stroke="currentColor" strokeWidth="9" />
        </>
      )}
      {movementId === 'wave' && (
        <path
          d="M115 145 C130 110 155 100 168 75"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
        />
      )}
      {movementId === 'touch_nose' && (
        <>
          <circle cx="100" cy="72" r="22" fill="none" stroke="currentColor" strokeWidth="4" />
          <circle cx="100" cy="78" r="5" fill="currentColor" />
          <path d="M155 155 L115 92" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        </>
      )}
      {movementId === 'touch_head' && (
        <>
          <path d="M155 155 L100 55" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          <circle cx="100" cy="55" r="10" fill="currentColor" />
        </>
      )}
      {movementId === 'smile' && (
        <>
          <circle cx="82" cy="68" r="5" fill="currentColor" />
          <circle cx="118" cy="68" r="5" fill="currentColor" />
          <path d="M75 88 Q100 108 125 88" fill="none" stroke="currentColor" strokeWidth="6" />
        </>
      )}
      {!['hands_up', 'clap', 'wave', 'touch_nose', 'touch_head', 'smile'].includes(
        movementId
      ) && (
        <text x="100" y="105" textAnchor="middle" fontSize="14" fill="currentColor">
          model
        </text>
      )}
    </svg>
  );
}
