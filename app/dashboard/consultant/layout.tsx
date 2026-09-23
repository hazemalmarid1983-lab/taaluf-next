import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import ConsultantTrackNav from '@/components/consultant/ConsultantTrackNav';
import MerhidChat from '@/components/merhid/MerhidChat';
import { homePathForRole } from '@/lib/access';
import { authOptions } from '@/lib/auth';
import { canAccessConsultantRoom } from '@/lib/consultantRoom/access';

export const metadata = {
  title: 'غرفة المستشار العلمي — تآلف',
  robots: { index: false, follow: false },
};

export default async function ConsultantRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login?portal=hub');

  if (!canAccessConsultantRoom(session.user?.role)) {
    redirect(homePathForRole(session.user?.role));
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/60 to-[#F1F5F9] print:bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 print:max-w-none print:px-0 print:py-0">
        <ConsultantTrackNav name={session.user?.name} />
        {children}
      </div>
      <MerhidChat scope="scientific_advisor" compact />
    </div>
  );
}
