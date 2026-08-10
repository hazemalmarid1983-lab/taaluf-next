import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import AdminPreviewBar from '@/components/access/AdminPreviewBar';
import SubscriberGate from '@/components/access/SubscriberGate';
import MerhidChat from '@/components/merhid/MerhidChat';
import { arePaymentsDisabled } from '@/lib/access';
import { authOptions } from '@/lib/auth';
import { BRAND } from '@/lib/content';

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login?portal=parent');
  if (session.user?.role !== 'parent' && session.user?.role !== 'admin') {
    redirect('/login?portal=parent');
  }

  const isAdmin = session.user?.role === 'admin';

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f0f9f4_0%,#f8fafc_100%)]">
      {isAdmin && <AdminPreviewBar portalLabel="بوابة أولياء الأمور" />}
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-emerald-200/60 pb-5">
          <div>
            <Link href="/parent" className="text-3xl font-bold text-[#2D8B5A]">
              {BRAND.name}
            </Link>
            <p className="mt-1 text-xs text-slate-500">
              بوابة أولياء الأمور · {session.user?.name}
              {isAdmin ? ' · معاينة إدارة' : ''}
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm">
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-xl bg-[#0b1f14] px-3 py-2 font-semibold text-white"
              >
                لوحة الإدارة
              </Link>
            )}
            <Link href="/parent" className="rounded-xl px-3 py-2 text-slate-600">
              الرئيسية
            </Link>
            <Link
              href="/parent/register-child"
              className="rounded-xl px-3 py-2 text-slate-600"
            >
              تسجيل طفل
            </Link>
            <Link
              href="/dashboard/messages"
              className="rounded-xl px-3 py-2 text-slate-600"
            >
              الرسائل
            </Link>
            <Link
              href="/dashboard/goals"
              className="rounded-xl px-3 py-2 text-slate-600"
            >
              الأهداف
            </Link>
            <Link
              href="/parent/booking"
              className="rounded-xl bg-[#2D8B5A] px-3 py-2 font-semibold text-white"
            >
              حجز فحص شامل
            </Link>
            <Link
              href="/api/auth/signout"
              className="rounded-xl px-3 py-2 text-slate-400"
            >
              خروج
            </Link>
          </nav>
        </header>
        {children}
      </div>
      <MerhidChat scope={isAdmin ? 'admin' : 'parent'} compact />
      {!arePaymentsDisabled() && <SubscriberGate />}
    </div>
  );
}
