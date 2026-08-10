import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import AdminPreviewBar from '@/components/access/AdminPreviewBar';
import SubscriberGate from '@/components/access/SubscriberGate';
import MerhidChat from '@/components/merhid/MerhidChat';
import { authOptions } from '@/lib/auth';
import { arePaymentsDisabled } from '@/lib/access';
import { BRAND, NAV } from '@/lib/content';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login?portal=specialist');

  const role = session.user?.role;
  const isAdmin = role === 'admin';
  const isParent = role === 'parent';
  const paymentsOff = arePaymentsDisabled();

  // ولي الأمر يدخل فقط صفحات الفرز/الاستبيان/الألعاب/الرسائل/الأهداف
  // (الوسيط middleware يمنع بقية مسارات /dashboard)
  if (isParent) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f0f9f4_0%,#eef7f2_40%,#f8fafc_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-emerald-200/60 pb-5">
            <div>
              <Link
                href="/parent"
                className="text-3xl font-bold tracking-tight text-[#2D8B5A]"
              >
                {BRAND.name}
              </Link>
              <p className="mt-1 text-xs text-slate-500">
                بوابة ولي الأمر · {session.user?.name}
              </p>
            </div>
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <Link
                href="/parent"
                className="rounded-xl px-3 py-2 text-slate-600 transition hover:bg-white hover:text-[#2D8B5A]"
              >
                الرئيسية
              </Link>
              <Link
                href="/dashboard/screening"
                className="rounded-xl px-3 py-2 text-slate-600 transition hover:bg-white hover:text-[#2D8B5A]"
              >
                الفرز
              </Link>
              <Link
                href="/dashboard/parent-assessment"
                className="rounded-xl px-3 py-2 text-slate-600 transition hover:bg-white hover:text-[#2D8B5A]"
              >
                الاستبيان
              </Link>
              <Link
                href="/dashboard/games"
                className="rounded-xl px-3 py-2 text-slate-600 transition hover:bg-white hover:text-[#2D8B5A]"
              >
                الألعاب
              </Link>
              <Link
                href="/api/auth/signout"
                className="rounded-xl px-3 py-2 text-slate-400 transition hover:text-rose-600"
              >
                خروج
              </Link>
            </nav>
          </header>
          {children}
        </div>
        <MerhidChat scope="parent" compact />
        {!paymentsOff && <SubscriberGate />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f0f9f4_0%,#eef7f2_40%,#f8fafc_100%)]">
      {isAdmin && <AdminPreviewBar portalLabel="بوابة المختص" />}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-emerald-200/60 pb-5">
          <div>
            <Link
              href="/dashboard"
              className="text-3xl font-bold tracking-tight text-[#2D8B5A]"
            >
              {BRAND.name}
            </Link>
            <p className="mt-1 text-xs text-slate-500">
              بوابة المختص · {session.user?.name}
              {isAdmin ? ' · معاينة إدارة' : ' · مرشد مقيد بالمسار'}
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-xl bg-[#0b1f14] px-3 py-2 font-semibold text-white"
              >
                لوحة الإدارة
              </Link>
            )}
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  item.primary
                    ? 'rounded-xl bg-[#2D8B5A] px-4 py-2 font-semibold text-white transition hover:bg-[#247a4e]'
                    : 'rounded-xl px-3 py-2 text-slate-600 transition hover:bg-white hover:text-[#2D8B5A]'
                }
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/api/auth/signout"
              className="rounded-xl px-3 py-2 text-slate-400 transition hover:text-rose-600"
            >
              خروج
            </Link>
          </nav>
        </header>
        {children}
      </div>
      <MerhidChat scope={isAdmin ? 'admin' : 'specialist'} compact />
      {!paymentsOff && <SubscriberGate />}
    </div>
  );
}
