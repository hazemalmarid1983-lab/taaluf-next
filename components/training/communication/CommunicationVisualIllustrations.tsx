'use client';

import EducationalIllustration from '@/components/visuals/EducationalIllustration';

type SvgProps = { className?: string; size?: number };

const LEGACY_TO_ASSET: Record<string, string> = {
  'comm-ill-water': 'water',
  'comm-ill-food': 'food',
  'comm-ill-toy': 'toy',
  'comm-ill-book': 'book',
};

/** توافق قديم — كل الأصول تمر عبر محرك الرسوم الملونة المركزي. */
export function CommIllWater({ className, size = 120 }: SvgProps) {
  return <EducationalIllustration asset="water" size={size} className={className} />;
}
export function CommIllFood({ className, size = 120 }: SvgProps) {
  return <EducationalIllustration asset="food" size={size} className={className} />;
}
export function CommIllToy({ className, size = 120 }: SvgProps) {
  return <EducationalIllustration asset="toy" size={size} className={className} />;
}
export function CommIllBook({ className, size = 120 }: SvgProps) {
  return <EducationalIllustration asset="book" size={size} className={className} />;
}

export function CommunicationVisualIllustration({
  assetId,
  size = 120,
  className,
}: {
  assetId: string;
  size?: number;
  className?: string;
}) {
  const asset = LEGACY_TO_ASSET[assetId] || assetId;
  return (
    <EducationalIllustration asset={asset} size={size} className={className} />
  );
}
