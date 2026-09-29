import { functionalIndicatorDisclaimer } from '@/lib/functionalIndicators';
import { cn } from '@/lib/utils';

export default function FunctionalIndicatorDisclaimer({
  lang = 'ar',
  className,
}: {
  lang?: 'ar' | 'en';
  className?: string;
}) {
  return (
    <p
      role="note"
      data-testid="functional-indicator-disclaimer"
      dir={lang === 'en' ? 'ltr' : 'rtl'}
      className={cn(
        'rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-6 text-amber-900 sm:text-sm print:border-slate-300 print:bg-white',
        className
      )}
    >
      {functionalIndicatorDisclaimer(lang)}
    </p>
  );
}
