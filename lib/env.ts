/** تنظيف قيم البيئة من BOM / أسطر جديدة / مسافات (مشكلة شائعة مع PowerShell و Vercel) */

export function cleanEnv(value?: string | null): string {
  if (value == null) return '';
  return String(value)
    .replace(/^\uFEFF/, '')
    .replace(/[\r\n\0]/g, '')
    .trim()
    .replace(/^['"]|['"]$/g, '');
}

export function airtableCreds() {
  return {
    apiKey: cleanEnv(process.env.AIRTABLE_API_KEY),
    baseId: cleanEnv(process.env.AIRTABLE_BASE_ID),
  };
}
