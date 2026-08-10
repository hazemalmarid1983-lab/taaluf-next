import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import {
  CLASSIFICATIONS,
  CRITERIA_LIST,
  DOMAINS,
  TAALOF_CRITERIA,
} from '@/types/taalof';

/** يعيد المعايير الرسمية من taalof_criteria.json (مصدر الحقيقة في التطبيق) */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    data: {
      version: TAALOF_CRITERIA.version,
      platform: TAALOF_CRITERIA.platform,
      total_criteria: TAALOF_CRITERIA.total_criteria,
      domains: DOMAINS,
      classifications: CLASSIFICATIONS,
      criteria: CRITERIA_LIST,
    },
  });
}
