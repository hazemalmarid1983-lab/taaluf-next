'use client';

import EducationalIllustration from '@/components/visuals/EducationalIllustration';

type Props = {
  movementId: string;
  className?: string;
};

/** رسم كرتوني ملون للنموذج — ليس مخططاً خطياً تجريدياً. */
export default function ObserverImitationModelVisual({
  movementId,
  className = 'h-[min(52vh,420px)] w-[min(52vh,420px)]',
}: Props) {
  return (
    <div
      className={`mx-auto flex items-center justify-center rounded-[2rem] bg-[#F0F9FB] p-4 shadow-inner ${className}`}
      role="img"
      aria-hidden
    >
      <EducationalIllustration asset={movementId} size={280} />
    </div>
  );
}
