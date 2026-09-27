'use client';

import DigitalPromptMappingPanel from '@/components/training/DigitalPromptMappingPanel';
import { summarizeDigitalPromptMapping } from '@/lib/training/trainingResultsPresentation';
import type { TrainingPromptLevel } from '@/lib/training/types';

/** ملخص مطويّ للمراقب في شاشة نهاية اللعبة — لا يظهر للطفل إلا عند فتحه */
export default function ObserverPromptMappingDisclosure({
  trials,
}: {
  trials?: ReadonlyArray<{ promptLevel: TrainingPromptLevel }>;
}) {
  if (!trials?.length) return null;
  const summary = summarizeDigitalPromptMapping(trials);
  if (!summary.rows.length && !summary.sessionPromptLabelAr) return null;

  return (
    <details className="mt-2 w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2 text-right" dir="rtl">
      <summary className="cursor-pointer text-xs font-semibold text-slate-500">
        للمراقب: مستوى المساعدة المسجّل
      </summary>
      <DigitalPromptMappingPanel trials={trials} compact />
    </details>
  );
}
