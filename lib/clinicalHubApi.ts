import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import {
  canAccessClinicalHub,
  hubMemberFromSession,
  type HubActor,
} from '@/lib/clinicalHub';

export function hubUnauthorized() {
  return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
}

export function hubForbidden(message = 'غير مسموح — هذه المساحة خاصة') {
  return NextResponse.json({ error: 'FORBIDDEN', message }, { status: 403 });
}

export async function requireHubActor(): Promise<
  { actor: HubActor } | { response: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { response: hubUnauthorized() };
  if (!canAccessClinicalHub(session.user.role)) {
    return { response: hubForbidden() };
  }
  const actor = hubMemberFromSession(session.user);
  if (!actor) return { response: hubForbidden() };
  return { actor };
}
