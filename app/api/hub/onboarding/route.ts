import { NextResponse } from 'next/server';
import { hubForbidden, requireHubActor } from '@/lib/clinicalHubApi';
import { markAdvisorWelcomeSeen } from '@/lib/clinicalHubStore';

export async function POST(req: Request) {
  const gate = await requireHubActor();
  if ('response' in gate) return gate.response;

  if (gate.actor.role !== 'scientific_advisor') {
    return hubForbidden('مسار الترحيب محصور بالمستشار العلمي');
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { action?: string };
    if (String(body.action || '') !== 'welcome_seen') {
      return NextResponse.json({ error: 'INVALID_ACTION' }, { status: 400 });
    }

    const onboarding = await markAdvisorWelcomeSeen();
    return NextResponse.json({
      ok: true,
      onboarding,
      nextStep: 'meeting',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'ONBOARDING_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const gate = await requireHubActor();
  if ('response' in gate) return gate.response;

  const { getClinicalHubSnapshot } = await import('@/lib/clinicalHubStore');
  const snapshot = await getClinicalHubSnapshot();
  const step =
    gate.actor.role !== 'scientific_advisor'
      ? 'complete'
      : snapshot.advisorOnboarding.welcomeSeenAt
        ? 'meeting'
        : 'welcome';

  return NextResponse.json({
    ok: true,
    step,
    onboarding: snapshot.advisorOnboarding,
  });
}
