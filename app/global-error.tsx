'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-[#F1F5F9] font-sans antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <h1 className="text-xl font-black text-slate-900">تعذر تحميل الصفحة</h1>
          <p className="mt-2 max-w-md text-sm text-slate-600">
            {process.env.NODE_ENV === 'development' && error.message
              ? error.message
              : 'حدث خطأ في التطبيق.'}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-2xl bg-[#2E7D8E] px-6 py-3 text-sm font-bold text-white"
          >
            إعادة المحاولة
          </button>
        </main>
      </body>
    </html>
  );
}
