import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/server/apiAuth';
import {
  CLASSIFICATIONS,
  CRITERIA_LIST,
  DOMAINS,
  TAALOF_CRITERIA,
} from '@/types/taalof';

/** يعيد المعايير الرسمية من taalof_criteria_v3.json (مصدر الحقيقة في التطبيق) */
export async function GET() {
  const auth = await requireApiPermission([
    'view_child_progress',
    'review_clinical_content',
    'edit_assessment',
  ]);
  if (!auth.ok) return auth.response;

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
