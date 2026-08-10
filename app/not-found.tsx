import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-[#2D8B5A]">خطأ 404</p>
      <h1 className="mt-2 text-3xl font-bold text-[#0b1f14]">الصفحة غير موجودة</h1>
      <p className="mt-3 text-sm leading-7 text-slate-500">
        الرابط غير صحيح أو الصفحة نُقلت. استخدم بوابات الدخول أدناه.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-[#2D8B5A] px-4 py-2 text-sm font-semibold text-white"
        >
          الرئيسية
        </Link>
        <Link
          href="/login"
          className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-[#2D8B5A]"
        >
          بوابات الدخول
        </Link>
      </div>
    </main>
  );
}
