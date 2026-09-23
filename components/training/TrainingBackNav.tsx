import Link from 'next/link';
import type { TrainingBackNavItem } from '@/lib/training/trainingNavLinks';

type Props = TrainingBackNavItem;

export default function TrainingBackNav({ href, label }: Props) {
  return (
    <nav dir="rtl" className="mb-4 print:hidden" aria-label={label}>
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2 text-sm font-semibold text-[#2E7D8E] shadow-sm transition hover:border-[#2E7D8E]/35 hover:bg-[#F0F7FA]"
      >
        <span aria-hidden className="text-base leading-none">
          →
        </span>
        <span>{label}</span>
      </Link>
    </nav>
  );
}
