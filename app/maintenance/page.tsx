import Link from 'next/link';
import TaalufLogo from '@/components/branding/TaalufLogo';

export default function MaintenancePage() {
  return (
    <main
      className="taaluf-hero-bg flex min-h-screen items-center justify-center px-4 py-16"
      dir="rtl"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">
        <TaalufLogo href="/" size="md" />
        <p className="mt-6 text-[11px] font-black uppercase tracking-[0.22em] text-[#2E7D8E]">
          صيانة مجدولة
        </p>
        <h1 className="mt-3 text-2xl font-bold text-[#0b1f14]">
          المنصة قيد التحديث
        </h1>
        <p className="mt-4 text-sm leading-8 text-slate-600">
          نقوم بتحسينات على منصة تآلف لضمان تجربة أفضل. سنعود خلال دقائق —
          شكراً لصبركم.
        </p>
        <p className="mt-6 text-xs text-slate-400">
          إذا كنت من فريق الإدارة أو المستشار العلمي، سجّل الدخول من{' '}
          <Link href="/login" className="font-semibold text-[#2D8B5A] underline">
            صفحة الدخول
          </Link>{' '}
          للمتابعة.
        </p>
      </div>
    </main>
  );
}
