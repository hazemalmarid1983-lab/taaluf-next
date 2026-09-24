import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { logAction } from '@/lib/auditLog';
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
import {
  mapParentToCriteria,
  type ParentAnswer,
} from '@/lib/parentAssessment';
import { loadChildJourneys, saveChildJourneys, upsertJourney } from '@/lib/childRoom/journeyStore';
import type { SubscriptionTierId } from '@/lib/subscriptionTiers';

function asPlan(value: unknown): SubscriptionTierId {
  if (value === 'clinical' || value === 'child_room' || value === 'free_screening') {
    return value;
  }
  return 'child_room';
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const answers = (body.answers || []) as ParentAnswer[];
    const childId = String(body.childId || '');
    if (!answers.length) {
      return NextResponse.json({ error: 'ANSWERS_REQUIRED' }, { status: 400 });
    }

    const planId = asPlan(body.planId);
    const current = await findChildCooldown(childId);
    const locked = resolveCooldown(current, current?.planId || planId);
    if (childId && !locked.open) {
      return NextResponse.json(
        { error: 'COOLDOWN_ACTIVE', cooldown: { ...locked, childId } },
        { status: 409 }
      );
    }

    const mappedScores = mapParentToCriteria(answers);
    const id = `parent_${Date.now().toString(36)}`;

    await logAction({
      userId: session.user.id || '',
      action: 'create_assessment',
      entityType: 'assessment',
      entityId: id,
    });

    let cooldown = locked;
    if (childId) {
      const record = buildCooldownRecord(childId, planId, new Date(), id);
      await saveAssessmentCooldowns(
        upsertCooldownRecord(await loadAssessmentCooldowns(), record)
      );
      cooldown = { ...resolveCooldown(record, planId), childId };
      const savedAt = new Date().toISOString();
      if (childId !== 'child_local') await saveChildJourneys(
        upsertJourney(await loadChildJourneys(), {
          childId,
          parentUserId: session.user.role === 'parent' ? session.user.id : undefined,
          planId,
          parentAssessment: {
            id,
            childId,
            answers,
            mappedScores,
            savedAt,
          },
        })
      );
    }

    return NextResponse.json({
      ok: true,
      id,
      childId,
      mappedScores,
      savedAt: new Date().toISOString(),
      cooldown,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PARENT_ASSESSMENT_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
