import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import {
  buildCooldownRecord,
  resolveCooldown,
  upsertCooldownRecord,
} from '@/lib/assessmentCooldown';
import {
  findChildCooldown,
  loadAssessmentCooldowns,
  saveAssessmentCooldowns,
} from '@/lib/assessmentCooldownStore';
import type { SubscriptionTierId } from '@/lib/subscriptionTiers';

function asPlan(value: unknown): SubscriptionTierId {
  if (value === 'clinical' || value === 'child_room' || value === 'free_screening') {
    return value;
  }
  return 'child_room';
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const childId = new URL(req.url).searchParams.get('childId')?.trim() || '';
  if (!childId) {
    return NextResponse.json({ error: 'CHILD_REQUIRED' }, { status: 400 });
  }
  const requestedPlan = asPlan(new URL(req.url).searchParams.get('planId'));
  const record = await findChildCooldown(childId);
  const view = resolveCooldown(record, record?.planId || requestedPlan);
  return NextResponse.json({ ok: true, cooldown: { ...view, childId } });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as {
    childId?: string;
    planId?: string;
    assessmentId?: string;
  } | null;
  const childId = body?.childId?.trim() || '';
  if (!childId) {
    return NextResponse.json({ error: 'CHILD_REQUIRED' }, { status: 400 });
  }
  const current = await findChildCooldown(childId);
  const planId = asPlan(body?.planId || current?.planId);
  const locked = resolveCooldown(current, planId);
  if (!locked.open) {
    return NextResponse.json({ error: 'COOLDOWN_ACTIVE', cooldown: locked }, { status: 409 });
  }
  const record = buildCooldownRecord(childId, planId, new Date(), body?.assessmentId);
  await saveAssessmentCooldowns(
    upsertCooldownRecord(await loadAssessmentCooldowns(), record)
  );
  const view = resolveCooldown(record, planId);
  return NextResponse.json({ ok: true, cooldown: { ...view, childId } });
}
