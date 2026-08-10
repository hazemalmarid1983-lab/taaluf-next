import Link from 'next/link';

/** شريط ثابت للإدارة أثناء معاينة البوابات الأخرى */
export default function AdminPreviewBar({ portalLabel }: { portalLabel: string }) {
  return (
    <div className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-950 shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <p>
          وضع معاينة الإدارة · تعرض حالياً:{' '}
          <span className="font-bold">{portalLabel}</span>
        </p>
        <Link
          href="/admin"
          className="rounded-xl bg-[#0b1f14] px-4 py-1.5 font-semibold text-white hover:bg-[#163d28]"
        >
          ← العودة للوحة الإدارة
        </Link>
      </div>
    </div>
  );
}
