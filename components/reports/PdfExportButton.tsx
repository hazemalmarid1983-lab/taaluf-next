'use client';

import { useLanguage } from '@/components/LanguageProvider';
import { cn } from '@/lib/utils';

interface PdfExportButtonProps {
  documentTitle?: string;
  className?: string;
  label?: string;
  isolateClass?: string;
}

export default function PdfExportButton({
  documentTitle = 'تقرير_تآلف_التربوي',
  className = '',
  label,
  isolateClass,
}: PdfExportButtonProps) {
  const { t } = useLanguage();

  const handleDownloadPdf = () => {
    const originalTitle = document.title;
    document.title = documentTitle;
    if (isolateClass) document.body.classList.add(isolateClass);

    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      document.title = originalTitle;
      if (isolateClass) document.body.classList.remove(isolateClass);
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.print();
    window.setTimeout(restore, 1500);
  };

  return (
    <button
      type="button"
      onClick={handleDownloadPdf}
      className={cn(
        'flex items-center justify-center gap-2 rounded-2xl bg-[#2E7D8E] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#236372] print:hidden',
        className
      )}
      title={t('downloadPdfTitle')}
    >
      {label || t('downloadPdf')}
    </button>
  );
}
