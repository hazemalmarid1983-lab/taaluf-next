'use client';

import { Button } from '@/components/ui/button';

type Props = {
  stars: number;
  sessionSaved: boolean;
  onDone: () => void;
};

export default function CommunicationChoiceComplete({
  stars,
  sessionSaved,
  onDone,
}: Props) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-[#F0F7FA] to-[#DCE9EE] px-6 text-center"
      dir="rtl"
    >
      <p className="text-sm font-bold text-[#2E7D8E]">انتهت الجلسة</p>
      <h2 className="mt-2 text-2xl font-black text-slate-900">أحسنت!</h2>
      <p className="mt-2 text-sm text-slate-600">
        {sessionSaved
          ? 'تم حفظ مؤشرات هذه الجلسة الرقمية. هذا ليس إتقاناً للمعيار في الحياة اليومية.'
          : 'تعذر الحفظ — يمكن إعادة المحاولة.'}
      </p>
      <div className="mt-6 flex gap-2" aria-label={`نجوم: ${stars}`}>
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`text-3xl ${n <= stars ? 'text-amber-400' : 'text-slate-200'}`}
          >
            ★
          </span>
        ))}
      </div>
      <Button type="button" className="mt-10" size="lg" onClick={onDone}>
        تم
      </Button>
    </div>
  );
}
