'use client';

export default function SensoryRoomError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#06131C] px-4 text-center text-white" dir="rtl">
      <p className="text-sm text-teal-300">الغرفة الحسية</p>
      <h1 className="mt-2 text-2xl font-bold">تعذر تشغيل المشهد الحسي</h1>
      <p className="mt-2 max-w-md text-sm text-white/60">
        يمكن إعادة المحاولة مباشرة. الصوت يحتاج نقرة واحدة في الصفحة.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-2xl bg-[#2E7D8E] px-6 py-3 text-sm font-bold"
      >
        إعادة المحاولة
      </button>
    </main>
  );
}
