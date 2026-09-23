import { NextResponse } from 'next/server';
import { requireHubActor } from '@/lib/clinicalHubApi';
import { markHubMeetingRead } from '@/lib/clinicalHubStore';
import { maintenanceBlockedResponse } from '@/lib/maintenanceGuard';

/** Mark meeting-room activity as read for the signed-in hub member. */
export async function POST() {
  const gate = await requireHubActor();
  if ('response' in gate) return gate.response;

  const blocked = maintenanceBlockedResponse(gate.actor.role);
  if (blocked) return blocked;

  const readState = await markHubMeetingRead(gate.actor.memberId);
  return NextResponse.json({ ok: true, readState });
}
