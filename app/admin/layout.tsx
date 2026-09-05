import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import TaalufLogo from '@/components/branding/TaalufLogo';
import { LanguageToggleBtn } from '@/components/LanguageProvider';
import SubscriberGate from '@/components/access/SubscriberGate';
import MerhidChat from '@/components/merhid/MerhidChat';
import { homePathForRole } from '@/lib/access';
import { authOptions } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login?portal=admin');
  if (session.user?.role !== 'admin') {
    redirect(homePathForRole(session.user?.role));
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0b1f14_0%,#123526_35%,#f0f9f4_35%)]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 text-white">
          <div>
            <TaalufLogo href="/admin" size="md" tone="dark" />
            <p className="mt-1 text-sm text-emerald-100/80">
              لوحة الإدارة العليا · {session.user?.name}
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <LanguageToggleBtn className="border-white/20 bg-white/10 text-white hover:bg-white/20" />
            <Link href="/hub" className="rounded-xl bg-white/10 px-3 py-2">
              المركز البحثي
            </Link>
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
