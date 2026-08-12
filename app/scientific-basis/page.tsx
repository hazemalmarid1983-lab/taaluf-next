import Link from 'next/link';
import { BRAND } from '@/lib/content';
import { SCIENTIFIC_BASIS_AR } from '@/lib/legalContent';

export const metadata = {
  title: 'أساسنا العلمي | تآلف',
  description: 'المرجع العلمي والتنظيمي لمعايير منصة تآلف',
};

export default function ScientificBasisPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f0f9f4_0%,#eef7f2_45%,#f8fafc_100%)] px-4 py-10">
      <article className="mx-auto max-w-3xl rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-10">
        <Link href="/" className="text-sm font-semibold text-[#2D8B5A]">
          ← العودة لتآلف
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-[#0b1f14]">أساسنا العلمي</h1>
        <p className="mt-2 text-sm text-slate-500">
          المرجع التنظيمي ومعايير {BRAND.name} الأصلية
        </p>

        <div className="mt-8 space-y-8">
          {SCIENTIFIC_BASIS_AR.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-bold text-[#0b1f14]">
                {section.heading}
              </h2>
              <p className="mt-3 text-sm leading-8 text-slate-600">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-10 border-t border-slate-100 pt-4 text-sm text-slate-400">
          © {new Date().getFullYear()} تآلف. جميع الحقوق محفوظة.
        </div>
      </article>
    </main>
  );
}
