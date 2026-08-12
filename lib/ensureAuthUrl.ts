/**
 * يضمن NEXTAUTH_URL صالحاً على Vercel.
 * يمنع قيم تالفة مثل "https://https" أو قيم تبدأ بـ BOM.
 */
export function ensureAuthUrl() {
  const productionHost = 'taaluf-next.vercel.app';

  const clean = (raw: string) =>
    String(raw || '')
      .replace(/^\uFEFF/, '')
      .trim()
      .replace(/\/$/, '');

  const current = clean(process.env.NEXTAUTH_URL || '');
  const appUrl = clean(process.env.NEXT_PUBLIC_APP_URL || '');
  const vercelProd = clean(process.env.VERCEL_PROJECT_PRODUCTION_URL || '');
  const vercelUrl = clean(process.env.VERCEL_URL || '');

  const candidates = [current, appUrl, vercelProd, vercelUrl]
    .filter(Boolean)
    .map((v) => (v.startsWith('http') ? v : `https://${v}`));

  const valid = candidates.find((v) => {
    try {
      const u = new URL(v);
      return (
        (u.protocol === 'https:' || u.protocol === 'http:') &&
        u.hostname.includes('.') &&
        !u.hostname.startsWith('https') &&
        u.hostname !== 'https'
      );
    } catch {
      return false;
    }
  });

  // لا تكتب على NEXT_PUBLIC_* (يُضمَّن نصاً ثابتاً وقت البناء)
  process.env.NEXTAUTH_URL = valid || `https://${productionHost}`;
  return process.env.NEXTAUTH_URL;
}
