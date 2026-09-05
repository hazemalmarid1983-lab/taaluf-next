import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import AdminPreviewGate from '@/components/access/AdminPreviewGate';
import AdvisorTestBanner from '@/components/access/AdvisorTestBanner';
import SubscriberGate from '@/components/access/SubscriberGate';
import MerhidChat from '@/components/merhid/MerhidChat';
import ParentShellNav from '@/components/parent/ParentShellNav';
import SpecialistShellNav from '@/components/specialist/SpecialistShellNav';
import { authOptions } from '@/lib/auth';
import { arePaymentsDisabled } from '@/lib/access';

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
  const isAdvisor = role === 'scientific_advisor';
  const paymentsOff = arePaymentsDisabled();

  // ولي الأمر يدخل فقط صفحات الفرز/الاستبيان/الألعاب/الرسائل/الأهداف
  // (الوسيط middleware يمنع بقية مسارات /dashboard)
  if (isParent) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] print:bg-white print:min-h-0">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 print:max-w-none print:px-0 print:py-0">
          <ParentShellNav name={session.user?.name} />
          {children}
        </div>
        <MerhidChat scope="parent" compact />
        {!paymentsOff && <SubscriberGate />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] print:bg-white print:min-h-0">
      {isAdmin && <AdminPreviewGate />}
      {isAdvisor && <AdvisorTestBanner />}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 print:max-w-none print:px-0 print:py-0">
        <SpecialistShellNav name={session.user?.name} isAdmin={isAdmin} />
        {children}
      </div>
      <MerhidChat
        scope={isAdmin ? 'admin' : isAdvisor ? 'scientific_advisor' : 'specialist'}
        compact
      />
      {!paymentsOff && <SubscriberGate />}
    </div>
  );
}
