import path from 'path';

/**
 * مسار تخزين بيانات الـ hub (clinical + platform).
 * - محلياً: `.data/` في جذر المشروع
 * - Vercel/serverless: `/tmp/taaluf-data` (قابل للكتابة لكن مؤقت بين عمليات النشر)
 * - تجاوز: `TAALUF_DATA_DIR`
 *
 * ⚠️ للإطلاق الواسع: انقل إلى Airtable أو KV/S3 — لا تعتمد على الملفات على serverless.
 */
export function getHubDataDir(): string {
  if (process.env.TAALUF_DATA_DIR?.trim()) {
    return process.env.TAALUF_DATA_DIR.trim();
  }
  if (process.env.VERCEL === '1') {
    return path.join('/tmp', 'taaluf-data');
  }
  return path.join(process.cwd(), '.data');
}

export function isEphemeralHubStorage(): boolean {
  return process.env.VERCEL === '1' && !process.env.TAALUF_DATA_DIR?.trim();
}
