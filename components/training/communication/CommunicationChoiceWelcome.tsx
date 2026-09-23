'use client';

import { Button } from '@/components/ui/button';
import CommPictogramVisual from '@/components/training/communication/CommPictogramVisual';
import type { CommPictogram } from '@/lib/training/communicationChoiceEngine';

type Props = {
  title: string;
  sample: CommPictogram;
  hintAr: string;
  onStart: () => void;
};

export default function CommunicationChoiceWelcome({
  title,
  sample,
  hintAr,
  onStart,
}: Props) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-[#F0F7FA] via-[#E8F2F5] to-[#DCE9EE] px-6 text-center"
      dir="rtl"
    >
      <div className="relative z-10 flex max-w-md flex-col items-center gap-8">
        <CommPictogramVisual item={sample} sizePx={128} />
        <h1 className="text-3xl font-bold text-[#1F2A37] sm:text-4xl">{title}</h1>
        <p className="text-sm text-[#4B5563]">{hintAr}</p>
        <p className="text-xs text-slate-500">
          تدريب رقمي · مؤشر أداء داخل الجلسة · يحتاج مراجعة علمية
        </p>
        <Button
          type="button"
          size="lg"
          className="h-16 min-w-[12rem] rounded-2xl bg-[#2E7D8E] text-lg font-bold text-white hover:bg-[#256878]"
          onClick={onStart}
        >
          ابدأ
        </Button>
      </div>
    </div>
  );
}
