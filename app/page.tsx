'use client';

import { useState } from 'react';
import Link from 'next/link';
import ParentPricingCards from '@/components/access/ParentPricingCards';
import SubscriberGate from '@/components/access/SubscriberGate';
import { Button } from '@/components/ui/button';
import { BRAND, DISCLAIMER_AR } from '@/lib/content';

function LogoMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#2D8B5A" />
      <path
        d="M20 34c2-10 8-16 12-16s10 6 12 16"
        fill="none"
        stroke="#F0F9F4"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M26 38c2 6 6 10 6 10s4-4 6-10"
        fill="#F0F9F4"
        opacity="0.95"
      />
      <circle cx="26" cy="28" r="2.5" fill="#F0F9F4" />
      <circle cx="38" cy="28" r="2.5" fill="#F0F9F4" />
    </svg>
  );
}

const TRUST = [
  'تقييم تربوي علمي',
  'مبني على DSM-5 و ICD-11',
  'أخصائيون مؤهلون',
  'حماية بيانات الأطفال',
];

const STEPS = [
  {
    n: '1',
    title: 'الفرز الأولي',
    body: '12 سؤالاً · حوالي 5 دقائق',
  },
  {
    n: '2',
    title: 'الاستبيان الشامل',
    body: 'معايير الأخصائي + استبيان الأهل',
  },
  {
    n: '3',
    title: 'الألعاب التفاعلية',
    body: 'تقليد وتتبع بصري بتسجيل يدوي',
  },
  {
    n: '4',
    title: 'التقرير والخطة',
    body: 'دمج المصادر + أهداف تربوية + PDF',
  },
];

const FEATURES = [
  'معايير علمية أصيلة',
  'تجربة لطيفة للأطفال',
  'لغة الأهل البسيطة',
  'دمج 3 مصادر تقييم',
  'خطة أهداف تربوية',
  'متابعة مستمرة',
];

const FAQ = [
  {
    q: 'هل تآلف تقدم تشخيصاً طبياً؟',
    a: 'لا، أداة تقييم تربوي مساعدة وليست تشخيصاً طبياً.',
  },
  {
    q: 'ما الأعمار المستهدفة؟',
    a: 'من 3 إلى 12 سنة مع فواصل عمرية للمعايير.',
  },
  {
    q: 'كم يستغرق التقييم؟',
    a: 'الفرز حوالي 5 دقائق، والتقييم الشامل حوالي 45 دقيقة.',
  },
  {
    q: 'هل بيانات طفلي آمنة؟',
    a: 'بياناتك محمية ومشفرة، ويمكنك طلب حذفها في أي وقت.',
  },
  {
    q: 'هل أحتاج أخصائي؟',
    a: 'التقييم يعمل مع أو بدون أخصائي، لكننا نوصي بمراجعة الأخصائي المؤهل.',
  },
  {
    q: 'كم تكلفة المتابعة؟',
    a: '49 ريال شهرياً للمتابعة المستمرة (أو ما يعادلها بعملتك).',
  },
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="overflow-x-hidden bg-[#f7fbf8]">
      <SubscriberGate />

      <section className="relative min-h-[100svh] overflow-hidden bg-[#0b1f14] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,139,90,0.35),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(240,249,244,0.12),transparent_40%)]" />
        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col px-6 py-8 sm:px-8">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <LogoMark />
              <span className="text-2xl font-bold tracking-tight">{BRAND.name}</span>
            </div>
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <a href="#how" className="rounded-xl px-3 py-2 text-emerald-100/80 hover:text-white">
                كيف نعمل
              </a>
              <a href="#pricing" className="rounded-xl px-3 py-2 text-emerald-100/80 hover:text-white">
                الباقات
              </a>
              <Link href="/login?portal=specialist" className="rounded-xl px-3 py-2 text-emerald-100/80 hover:text-white">
                للأخصائيين
              </Link>
              <Link
                href="/login?portal=parent"
                className="rounded-xl bg-white px-4 py-2 font-semibold text-[#1f6b44]"
              >
                دخول
              </Link>
            </nav>
          </header>

          <div className="flex flex-1 flex-col justify-center py-16">
            <div className="mb-6">
              <LogoMark className="h-16 w-16" />
            </div>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
              طفلك فريد. نحن نقرأه.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-50/90 sm:text-xl sm:leading-9">
              منصة تآلف تستخدم العلم والذكاء الاصطناعي لتقديم صورة أوضح وأكثر
              رحمة لطفلك
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="min-h-11 bg-[#2D8B5A] px-6 text-white hover:bg-[#247a4e]"
              >
                <Link href="/login?portal=parent">ابدأ الفرز الأولي — مجاناً</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-h-11 border-white/40 bg-transparent px-6 text-white hover:bg-white/10"
              >
                <a href="#how">كيف نعمل</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-emerald-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 py-6 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          {TRUST.map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-[#2D8B5A]">
                ✓
              </span>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-6 py-20 sm:px-8">
        <h2 className="text-3xl font-bold text-[#0b1f14]">كيف نعمل</h2>
        <p className="mt-3 max-w-xl text-base leading-8 text-slate-600">
          مسار واضح من الفرز السريع إلى التقرير والخطة التربوية.
        </p>
        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-3xl border border-emerald-100 bg-white p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2D8B5A] text-lg font-bold text-white">
                {s.n}
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-emerald-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8">
          <h2 className="text-3xl font-bold text-[#0b1f14]">لماذا تآلف</h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li
                key={f}
                className="rounded-3xl border border-emerald-100 bg-[#f7fbf8] p-6"
              >
                <svg viewBox="0 0 40 40" className="h-10 w-10 text-[#2D8B5A]">
                  <rect width="40" height="40" rx="12" fill="currentColor" opacity="0.12" />
                  <path
                    d="M12 21l5 5 11-12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-bold text-[#0b1f14]">{f}</h3>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20 sm:px-8">
        <ParentPricingCards />
      </section>

      <section className="border-t border-emerald-100 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-20 sm:px-8">
          <h2 className="text-3xl font-bold text-[#0b1f14]">أسئلة شائعة</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((item, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={item.q}
                  className="rounded-2xl border border-emerald-100 bg-[#f7fbf8]"
                >
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center justify-between gap-3 px-5 py-4 text-start text-sm font-bold text-[#0b1f14]"
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                  >
                    {item.q}
                    <span className="text-[#2D8B5A]">{open ? '−' : '+'}</span>
                  </button>
                  {open ? (
                    <p className="px-5 pb-4 text-sm leading-7 text-slate-600">
                      {item.a}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="bg-[#0b1f14] px-6 py-14 text-emerald-100/75 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.2fr_1fr_0.8fr]">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark />
              <p className="text-3xl font-bold text-white">{BRAND.name}</p>
            </div>
            <p className="mt-3 max-w-md text-sm leading-7">
              منصة تقييم تربوي مساعدة — ملامح أوضح وخطط ألطف للأطفال والأسر.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <a href="#how">كيف نعمل</a>
            <a href="#pricing">الباقات</a>
            <Link href="/login?portal=specialist">للأخصائيين</Link>
            <Link href="/login?portal=parent">من نحن</Link>
            <span>سياسة الخصوصية</span>
            <span>شروط الاستخدام</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">تواصل</p>
            <div className="mt-3 flex gap-3">
              {['X', 'in', 'web'].map((s) => (
                <span
                  key={s}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-xs"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-6xl border-t border-white/10 pt-6 text-xs leading-6">
          <p>
            منصة تآلف أداة تقييم تربوي مساعدة وليست تشخيصاً طبياً. {DISCLAIMER_AR}
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} تآلف · الإصدار {BRAND.version}
          </p>
        </div>
      </footer>
    </main>
  );
}
