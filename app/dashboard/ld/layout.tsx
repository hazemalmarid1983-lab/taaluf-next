import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import LdTrackNav from '@/components/ld/LdTrackNav';
import MerhidChat from '@/components/merhid/MerhidChat';
import { authOptions } from '@/lib/auth';
import { isLearningDifficultiesEnabled } from '@/lib/featureFlags';

export default async function LdDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login?portal=specialist');

  if (!isLearningDifficultiesEnabled()) {
    redirect('/dashboard/screening');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 to-[#F1F5F9] print:bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 print:max-w-none print:px-0 print:py-0">
        <LdTrackNav name={session.user?.name} />
        {children}
      </div>
      <MerhidChat scope="specialist" compact />
    </div>
  );
}
