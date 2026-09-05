/**
 * يضمن NEXTAUTH_URL صالحاً على Vercel والمحلي.
 * يمنع قيم تالفة مثل "https://https" أو قيم تبدأ بـ BOM.
 * يقبل localhost و 127.0.0.1 حتى لا تُستبدل الجلسة بعنوان الإنتاج.
 */

const PRODUCTION_HOST = 'taaluf-next.vercel.app';

export function cleanAuthUrl(raw: string) {
  return String(raw || '')
    .replace(/^\uFEFF/, '')
    .trim()
    .replace(/\/$/, '');
}

function isLoopbackHost(hostname: string) {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host.endsWith('.localhost')
  );
}

export function isUsableAuthUrl(raw: string): boolean {
  const value = cleanAuthUrl(raw);
  if (!value) return false;
  try {
    const withProtocol = value.startsWith('http') ? value : `https://${value}`;
    const u = new URL(withProtocol);
    const host = u.hostname;
    return (
      (u.protocol === 'https:' || u.protocol === 'http:') &&
      (host.includes('.') || isLoopbackHost(host)) &&
      !host.startsWith('https') &&
      host !== 'https'
    );
  } catch {
    return false;
  }
}

export function ensureAuthUrl() {
  const current = cleanAuthUrl(process.env.NEXTAUTH_URL || '');
  const appUrl = cleanAuthUrl(process.env.NEXT_PUBLIC_APP_URL || '');
  const vercelProd = cleanAuthUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL || '');
  const vercelUrl = cleanAuthUrl(process.env.VERCEL_URL || '');

  const candidates = [current, appUrl, vercelProd, vercelUrl]
    .filter(Boolean)
    .map((v) => (v.startsWith('http') ? v : `https://${v}`));

  const valid = candidates.find(isUsableAuthUrl);

  // لا تكتب على NEXT_PUBLIC_* (يُضمَّن نصاً ثابتاً وقت البناء)
  process.env.NEXTAUTH_URL = valid || `https://${PRODUCTION_HOST}`;
  return process.env.NEXTAUTH_URL;
}
