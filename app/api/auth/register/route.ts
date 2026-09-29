import { NextResponse } from 'next/server';
import { findUserByEmail, isAirtableConfigured } from '@/lib/airtable';
import { logAction } from '@/lib/auditLog';
import { nextAuthSecret } from '@/lib/authConfig';
import { normalizeEmail, registerUserAccount, type SignupError } from '@/lib/userAccounts';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_WINDOW = 10;
/** أفضل جهد لكل نسخة خادم — ليس بديلاً عن حماية على مستوى البنية */
const attempts = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter((at) => now - at < WINDOW_MS);
  recent.push(now);
  attempts.set(key, recent);
  return recent.length > MAX_ATTEMPTS_PER_WINDOW;
}

const STATUS: Record<SignupError, number> = {
  NAME_REQUIRED: 400,
  EMAIL_INVALID: 400,
  EMAIL_RESERVED: 400,
  PASSWORD_TOO_SHORT: 400,
  PASSWORD_MISMATCH: 400,
  ROLE_NOT_ALLOWED: 403,
  EMAIL_TAKEN: 409,
};

export async function POST(req: Request) {
  // حساب بلا سر جلسة لا يمكنه الدخول — لا ننشئه
  if (!nextAuthSecret()) {
    return NextResponse.json({ error: 'AUTH_NOT_CONFIGURED' }, { status: 503 });
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'TOO_MANY_ATTEMPTS' }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 });

  if (isAirtableConfigured()) {
    const existing = await findUserByEmail(normalizeEmail(body.email)).catch(() => null);
    if (existing) return NextResponse.json({ error: 'EMAIL_TAKEN' }, { status: 409 });
  }

  try {
    const result = await registerUserAccount({
      name: body.name,
      email: body.email,
      password: body.password,
      confirmPassword: body.confirmPassword,
      role: body.role,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: STATUS[result.error] });
    }
    await logAction({
      userId: result.account.id,
      action: 'register',
      entityType: 'user',
      entityId: result.account.id,
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, role: result.account.role });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('HUB_STORAGE_')) {
      console.error('[register] durable storage unavailable:', message);
      return NextResponse.json({ error: 'STORAGE_UNAVAILABLE' }, { status: 503 });
    }
    console.error('[register] failed:', error);
    return NextResponse.json({ error: 'REGISTRATION_FAILED' }, { status: 500 });
  }
}
