/**
 * إعدادات الجلسة المشتركة بين NextAuth (Node) والـ middleware (Edge).
 * يجب أن يستخدم الطرفان نفس السر ونفس اسم الكوكي، وإلا تُقبل الجلسة في /api/auth/session
 * وتُرفض في الـ middleware فيعود المستخدم لصفحة الدخول بعد نجاح التسجيل.
 * بلا استيرادات Node — آمن للـ Edge runtime.
 */

type Env = Record<string, string | undefined>;

export function nextAuthSecret(env: Env = process.env): string | undefined {
  const secret = String(env.NEXTAUTH_SECRET || '').trim();
  if (secret) return secret;
  return env.NODE_ENV === 'production' ? undefined : 'taaluf-dev-secret-change-me';
}

export function authUsesSecureCookies(authUrl: string | undefined): boolean {
  return String(authUrl || '').trim().startsWith('https://');
}

export function sessionTokenCookieName(authUrl: string | undefined): string {
  return authUsesSecureCookies(authUrl)
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';
}
