import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import SubscriberGate from '@/components/access/SubscriberGate';
import MerhidChat from '@/components/merhid/MerhidChat';
import { authOptions } from '@/lib/auth';
import { BRAND } from '@/lib/content';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login?portal=admin');
  if (session.user?.role !== 'admin') redirect('/login?portal=admin');

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0b1f14_0%,#123526_35%,#f0f9f4_35%)]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 text-white">
          <div>
            <Link href="/admin" className="text-3xl font-bold">
              {BRAND.name}
            </Link>
            <p className="mt-1 text-sm text-emerald-100/80">
              لوحة الإدارة العليا · {session.user?.name}
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm">
            <Link href="/admin" className="rounded-xl bg-white/10 px-3 py-2">
              الرئيسية
            </Link>
            <Link href="/dashboard" className="rounded-xl bg-white/10 px-3 py-2">
              معاينة المختص
            </Link>
            <Link href="/parent" className="rounded-xl bg-white/10 px-3 py-2">
              معاينة الأهل
            </Link>
            <Link
              href="/api/auth/signout"
              className="rounded-xl bg-white px-3 py-2 font-semibold text-[#1f6b44]"
            >
              خروج
            </Link>
          </nav>
        </header>
        {children}
      </div>
      <MerhidChat scope="admin" compact />
      <SubscriberGate />
    </div>
  );
}
