type Props = {
  className?: string;
  size?: number;
};

/** نجمة SVG/CSS — نفس اللغة البصرية الهادئة لبقية أنشطة التدريب */
export default function FollowStarVisual({ className = '', size = 56 }: Props) {
  const gradientId = 'follow-star-gradient';

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="20%" y1="10%" x2="80%" y2="90%">
          <stop offset="0%" stopColor="#fff9e6" />
          <stop offset="55%" stopColor="#ffd76a" />
          <stop offset="100%" stopColor="#e5b86e" />
        </linearGradient>
        <filter id="follow-star-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M32 6 L38.5 24.5 L58 26.5 L43.5 39 L48 58.5 L32 48.5 L16 58.5 L20.5 39 L6 26.5 L25.5 24.5 Z"
        fill={`url(#${gradientId})`}
        stroke="#fff3bf"
        strokeWidth="2"
        strokeLinejoin="round"
        filter="url(#follow-star-glow)"
      />
    </svg>
  );
}
