import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import TaalufLogo from '@/components/branding/TaalufLogo';
import { LanguageToggleBtn } from '@/components/LanguageProvider';
import MerhidChat from '@/components/merhid/MerhidChat';
import { homePathForRole } from '@/lib/access';
import { authOptions } from '@/lib/auth';
import {
  canAccessClinicalHub,
  HUB_NAME_AR,
  isScientificAdvisorRole,
} from '@/lib/clinicalHub';

export const metadata = {
  title: 'مركز تآلف السريري والبحثي',
  robots: { index: false, follow: false },
};

export default async function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login?portal=hub');
  if (!canAccessClinicalHub(session.user?.role)) {
    redirect(homePathForRole(session.user?.role));
  }

  const role = session.user?.role;
  const isAdvisor = isScientificAdvisorRole(role);
  const merhidScope = isAdvisor ? 'scientific_advisor' : 'admin';

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#07140e_0%,#0f2a1c_32%,#f3f7f4_32%)]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 text-white">
          <div>
            <TaalufLogo href="/hub" size="md" tone="dark" />
            <p className="mt-1 text-sm text-emerald-100/80">{HUB_NAME_AR}</p>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/70">
              Private · {session.user?.name}
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <LanguageToggleBtn className="border-white/20 bg-white/10 text-white hover:bg-white/20" />
            {!isAdvisor && (
              <Link href="/admin" className="rounded-xl bg-white/10 px-3 py-2">
                الإدارة
              </Link>
            )}
            <Link
              href="/sensory-rooms"
              className="rounded-xl bg-white/10 px-3 py-2"
            >
              بيئات الاختبار
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
      <MerhidChat scope={merhidScope} compact />
    </div>
  );
}
