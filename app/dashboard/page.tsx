import Link from 'next/link';
import {
  BRAND,
  CLASSIFICATION_BANDS,
  DASHBOARD,
  DISCLAIMER_AR,
  DOMAIN_META,
} from '@/lib/content';

export default function DashboardPage() {
  return (
    <section className="space-y-10">
      <div className="taaluf-rise max-w-2xl">
        <p className="text-sm font-semibold text-[#2D8B5A]">
          إصدار {BRAND.version} · {BRAND.criteriaCount} مؤشراً
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#0b1f14]">
          {DASHBOARD.title}
        </h1>
        <p className="mt-3 text-base leading-8 text-slate-600">
          {DASHBOARD.subtitle}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {DASHBOARD.actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={
              action.tone === 'primary'
                ? 'group rounded-3xl bg-[#2D8B5A] p-7 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#247a4e]'
                : 'group rounded-3xl border border-emerald-100 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:border-[#2D8B5A]/35'
            }
          >
            <h2
              className={
                action.tone === 'primary'
                  ? 'text-2xl font-bold'
                  : 'text-2xl font-bold text-[#0b1f14]'
              }
            >
              {action.title}
            </h2>
            <p
              className={
                action.tone === 'primary'
                  ? 'mt-3 text-sm leading-7 text-emerald-50/90'
                  : 'mt-3 text-sm leading-7 text-slate-600'
              }
            >
              {action.body}
            </p>
            <span
              className={
                action.tone === 'primary'
                  ? 'mt-6 inline-block text-sm font-semibold text-white underline-offset-4 group-hover:underline'
                  : 'mt-6 inline-block text-sm font-semibold text-[#2D8B5A] underline-offset-4 group-hover:underline'
              }
            >
              {action.cta} ←
            </span>
          </Link>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-emerald-100 bg-white p-7">
          <h2 className="text-xl font-bold text-[#0b1f14]">مجالات التقييم</h2>
          <p className="mt-2 text-sm text-slate-500">
            من بنك المؤشرات الرسمي — لا تُخلط مع أدوات حسية أو مسوحات أخرى.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {DOMAIN_META.map(({ domain, count }) => (
              <li
                key={domain}
                className="flex items-center justify-between rounded-2xl bg-[#F0F9F4] px-4 py-3 text-sm"
              >
                <span className="font-semibold text-slate-800">{domain}</span>
                <span className="text-slate-500">{count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white p-7">
          <h2 className="text-xl font-bold text-[#0b1f14]">سلم التصنيف</h2>
          <ul className="mt-5 space-y-3">
            {CLASSIFICATION_BANDS.map((band) => (
              <li
                key={band.label}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: band.color }}
                  />
                  {band.label}
                </span>
                <span className="text-slate-400">{band.range}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs leading-6 text-slate-400">{DISCLAIMER_AR}</p>
        </div>
      </div>
    </section>
  );
}
