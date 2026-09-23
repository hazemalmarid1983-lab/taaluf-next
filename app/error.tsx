'use client';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center"
      dir="rtl"
    >
      <p className="text-xs font-bold text-[#2E7D8E]">تآلف</p>
      <h1 className="mt-2 text-xl font-black text-slate-900">حدث خطأ غير متوقع</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        {process.env.NODE_ENV === 'development' && error.message
          ? error.message
          : 'يمكن إعادة المحاولة. إذا استمرت المشكلة، حدّث الصفحة أو أعد تشغيل السيرفر المحلي.'}
      </p>
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
