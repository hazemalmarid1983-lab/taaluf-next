'use client';

export default function SensoryMatchingError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-[#F0FDFA] px-4 text-center"
      dir="rtl"
    >
      <p className="text-sm text-[#2E7D8E]">مطابقة الصور</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">تعذر تشغيل النشاط</h1>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-2xl bg-[#2E7D8E] px-6 py-3 text-sm font-bold text-white"
      >
        إعادة المحاولة
      </button>
    </main>
  );
}
