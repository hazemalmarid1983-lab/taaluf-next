import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function AssessmentReportAliasPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login?portal=parent');
  if (session.user?.role === 'parent') {
    redirect('/parent/assessment?view=results');
  }
  redirect('/dashboard/assessments/new?view=results');
}
