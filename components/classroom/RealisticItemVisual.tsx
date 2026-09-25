'use client';

import EducationalIllustration, {
  hasEducationalIllustration,
} from '@/components/visuals/EducationalIllustration';

/** رسوم مجسّمة ملونة عبر محرك الرسوم التعليمي المركزي. */
export function hasRealisticItem(symbol: string) {
  return hasEducationalIllustration(symbol);
}

export default function RealisticItemVisual({
  symbol,
  size = 160,
  label,
  className = '',
}: {
  symbol: string;
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <EducationalIllustration
      asset={symbol}
      size={size}
      label={label}
      className={className}
    />
  );
}
