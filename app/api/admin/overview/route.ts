import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getAdminOverview } from '@/lib/platformData';

/** للإدارة فقط — الاطلاع على بيانات الجميع */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json(
      {
        error: 'FORBIDDEN',
        message: 'غير مسموح — بيانات الجميع متاحة للإدارة العليا فقط',
      },
      { status: 403 }
    );
  }

  const overview = await getAdminOverview();
  return NextResponse.json({ ok: true, overview });
}
