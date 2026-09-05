/**
 * مزامنة Airtable تُستدعى من المسارات الخادمية فقط.
 * لا تُمرَّر المفاتيح إلى العميل.
 */
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import {
  fetchAssessmentRecords,
  fetchChildRecord,
  fetchConsentRecords,
  logAuditEvent,
  syncAssessmentResult,
  syncChildRecord,
  syncConsentRecord,
} from '@/lib/airtableSync';

function parentOwnsChild(
  record: { fields?: Record<string, unknown> } | null,
  email: string
) {
  if (!record?.fields) return false;
  return (
    String(record.fields.ParentEmail || '').toLowerCase() ===
    String(email || '').toLowerCase()
  );
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const url = new URL(req.url);
  const kind = url.searchParams.get('kind') || 'child';
  const id = String(url.searchParams.get('id') || '');
  const isParent = session.user.role === 'parent';
  const email = String(session.user.email || '');

  if (kind === 'consents') {
    const result = await fetchConsentRecords(session.user.id);
    return NextResponse.json(result);
  }

  if (!id) {
    return NextResponse.json({ error: 'ID_REQUIRED' }, { status: 400 });
  }

  if (isParent) {
    const child = await fetchChildRecord(id);
    if (!parentOwnsChild(child.data, email)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
  }

  if (kind === 'assessments') {
    const result = await fetchAssessmentRecords(id);
    return NextResponse.json(result);
  }

  const result = await fetchChildRecord(id);
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const kind = String(body.kind || '');

  if (kind === 'child') {
    const name = String(body.name || '').trim();
    const birthDate = String(body.birthDate || body.dob || '').trim();
    if (!name || !birthDate) {
      return NextResponse.json({ error: 'NAME_DOB_REQUIRED' }, { status: 400 });
    }
    const result = await syncChildRecord({
      childId: String(body.childId || `child_${Date.now()}`),
      name,
      birthDate,
      ageBand: String(body.ageBand || ''),
      gender: body.gender ? String(body.gender) : undefined,
      guardianEmail:
        session.user.role === 'parent'
          ? String(session.user.email || '')
          : String(body.guardianEmail || ''),
      guardianPhone: body.guardianPhone ? String(body.guardianPhone) : undefined,
      guardianName:
        session.user.role === 'parent'
          ? String(session.user.name || '')
          : String(body.guardianName || ''),
    });
    await logAuditEvent('create_student', 'student', session.user.id, result.id);
    return NextResponse.json(result);
  }

  if (kind === 'consent') {
    const result = await syncConsentRecord({
      userId: session.user.id,
      childId: String(body.childId || ''),
      consentType: body.consentType || 'assessment',
      consentText: String(body.consentText || ''),
      ipAddress:
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '',
    });
    await logAuditEvent(
      'consent_accepted',
      'consent',
      session.user.id,
      result.id
    );
    return NextResponse.json(result);
  }

  if (kind === 'assessment') {
    const result = await syncAssessmentResult({
      childId: String(body.childId || ''),
      journeyMode:
        body.journeyMode === 'independent_parent'
          ? 'independent_parent'
          : 'specialist_guided',
      totalNeedPercentage: Number(body.totalNeedPercentage || 0),
      overallClassification: String(body.overallClassification || ''),
      suggestedReassessmentDays: Number(body.suggestedReassessmentDays || 180),
      domainScores: Array.isArray(body.domainScores) ? body.domainScores : [],
      fusedResultsJson: String(body.fusedResultsJson || '{}'),
      evaluatedAt: String(body.evaluatedAt || new Date().toISOString()),
    });
    await logAuditEvent(
      'create_assessment',
      'assessment',
      session.user.id,
      result.id
    );
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'UNKNOWN_KIND' }, { status: 400 });
}
