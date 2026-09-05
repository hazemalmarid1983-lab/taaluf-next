import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import AdminPreviewBar from '@/components/access/AdminPreviewBar';
import SubscriberGate from '@/components/access/SubscriberGate';
import MerhidChat from '@/components/merhid/MerhidChat';
import ParentShellNav from '@/components/parent/ParentShellNav';
import { arePaymentsDisabled, homePathForRole } from '@/lib/access';
import { authOptions } from '@/lib/auth';

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login?portal=parent');
  if (session.user?.role !== 'parent' && session.user?.role !== 'admin') {
    redirect(homePathForRole(session.user?.role));
  }

  const isAdmin = session.user?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#F1F5F9] print:bg-white print:min-h-0">
      {isAdmin && <AdminPreviewBar portalLabel="بوابة أولياء الأمور" />}
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 print:max-w-none print:px-0 print:py-0">
        <ParentShellNav name={session.user?.name} isAdmin={isAdmin} />
        {children}
      </div>
      <MerhidChat scope={isAdmin ? 'admin' : 'parent'} compact />
      {!arePaymentsDisabled() && <SubscriberGate />}
    </div>
  );
}
