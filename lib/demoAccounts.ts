/**
 * سياسة الحسابات التجريبية (@taaluf.local).
 * خارج الإنتاج: كلمات المرور الافتراضية للتطوير.
 * في الإنتاج: معطّلة كلياً إلا بتفعيل صريح وكلمة مرور قوية من البيئة — الافتراضية لا تُقبل أبداً.
 */

import { hashPasswordSync } from '@/lib/password';

export const DEV_DEMO_PASSWORD = 'taaluf123';
export const DEV_GUEST_SPECIALIST_PASSWORD = 'paid-access';
export const DEMO_PASSWORD_MIN_LENGTH = 12;

const WEAK_DEMO_PASSWORDS = new Set([DEV_DEMO_PASSWORD, DEV_GUEST_SPECIALIST_PASSWORD]);

type Env = Record<string, string | undefined>;

export type DemoAccountsPolicy =
  | { enabled: false; reason: 'production_disabled' | 'production_weak_password' }
  | { enabled: true; mode: 'development' }
  | { enabled: true; mode: 'production_override'; password: string };

function isProduction(env: Env): boolean {
  return env.NODE_ENV === 'production';
}

export function demoAccountsPolicy(env: Env = process.env): DemoAccountsPolicy {
  if (!isProduction(env)) return { enabled: true, mode: 'development' };
  if (String(env.ALLOW_DEMO_USERS || '').trim().toLowerCase() !== 'true') {
    return { enabled: false, reason: 'production_disabled' };
  }
  const password = String(env.DEMO_USERS_PASSWORD || '');
  if (password.length < DEMO_PASSWORD_MIN_LENGTH || WEAK_DEMO_PASSWORDS.has(password)) {
    return { enabled: false, reason: 'production_weak_password' };
  }
  return { enabled: true, mode: 'production_override', password };
}

const hashCache = new Map<string, string>();

function cachedHash(password: string): string {
  let hash = hashCache.get(password);
  if (!hash) {
    hash = hashPasswordSync(password);
    hashCache.set(password, hash);
  }
  return hash;
}

/**
 * الـ hash الاحتياطي لحساب تجريبي (قبل تعيين كلمة مرور خاصة).
 * null = لا يُقبل أي دخول بكلمة مرور افتراضية لهذا الحساب.
 */
export function demoFallbackHash(
  devPassword: string,
  env: Env = process.env
): string | null {
  const policy = demoAccountsPolicy(env);
  if (!policy.enabled) return null;
  return cachedHash(policy.mode === 'development' ? devPassword : policy.password);
}

export function nextAuthSecret(env: Env = process.env): string | undefined {
  const secret = String(env.NEXTAUTH_SECRET || '').trim();
  if (secret) return secret;
  return isProduction(env) ? undefined : 'taaluf-dev-secret-change-me';
}
