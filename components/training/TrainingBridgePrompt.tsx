'use client';

import { Button } from '@/components/ui/button';

type Props = {
  goalTitle: string;
  isAr: boolean;
  onSpecialized: () => void;
  onHomeGeneral: () => void;
  onDismiss: () => void;
};

export default function TrainingBridgePrompt({
  goalTitle,
  isAr,
  onSpecialized,
  onHomeGeneral,
  onDismiss,
}: Props) {
  return (
    <div
      className="rounded-3xl border border-indigo-200/80 bg-indigo-50/90 p-5 shadow-sm"
      role="region"
      aria-labelledby="training-bridge-title"
    >
      <h2
        id="training-bridge-title"
        className="text-sm font-black text-indigo-950"
      >
        {isAr
          ? 'يوجد تدريب متخصص لهذا الهدف'
          : 'Specialized training is available for this goal'}
      </h2>
      <p className="mt-2 text-[11px] leading-6 text-indigo-900/85">
        {isAr
          ? `«${goalTitle}» — يمكن تنفيذ تدريب متخصص مرتبط بهذا الهدف ضمن منظومة التدريب، أو متابعة التدريب المنزلي العام.`
          : `"${goalTitle}" — run platform training linked to this goal, or continue with general home practice.`}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={onSpecialized}
        >
          {isAr ? 'التدريب المتخصص' : 'Specialized training'}
        </Button>
        <Button type="button" variant="outline" onClick={onHomeGeneral}>
          {isAr ? 'التدريب المنزلي العام' : 'General home training'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-slate-600"
          onClick={onDismiss}
        >
          {isAr ? 'إلغاء' : 'Cancel'}
        </Button>
      </div>
    </div>
  );
}
