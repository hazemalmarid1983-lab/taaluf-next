import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { authorizeActor, type ClinicalActor } from '@/lib/clinicalAccess';
import type { Permission } from '@/lib/permissions';
import { ClinicalStoreError } from '@/lib/server/clinicalRecordStore';

export type ApiAuthResult =
  | { ok: true; actor: ClinicalActor }
  | { ok: false; response: NextResponse };

/** تحقق الجلسة وصلاحية الدور في كل مسار API (دفاع في العمق خلف الـ middleware) */
export async function requireApiPermission(anyOf: Permission[]): Promise<ApiAuthResult> {
  const session = await getServerSession(authOptions);
  const decision = authorizeActor(session?.user, anyOf);
  if (!decision.ok) {
    return {
      ok: false,
      response: NextResponse.json({ error: decision.error }, { status: decision.status }),
    };
  }
  return { ok: true, actor: decision.actor };
}

export function forbidden(error = 'FORBIDDEN') {
  return NextResponse.json({ error }, { status: 403 });
}

export function storeErrorResponse(err: unknown): NextResponse {
  if (err instanceof ClinicalStoreError) {
    return NextResponse.json({ error: err.code }, { status: 400 });
  }
  const message = err instanceof Error ? err.message : 'CLINICAL_STORE_FAILED';
  return NextResponse.json({ error: message }, { status: 500 });
}
