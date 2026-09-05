/**
 * ينشئ جداول TaalofDB عبر Airtable Meta API.
 * يتطلب توكن بصلاحية schema.bases:write
 * التشغيل: npx tsx scripts/create-airtable-tables.ts
 */

import { loadEnvFiles } from './load-env';
import { provisionTaalofTables } from './airtable-provision';

loadEnvFiles();

async function main() {
  const apiKey = process.env.AIRTABLE_API_KEY || '';
  const baseId = process.env.AIRTABLE_BASE_ID || '';

  console.log('\n━━━ إنشاء جداول Airtable — TaalofDB ━━━\n');

  if (!apiKey || !baseId) {
    console.log('❌ عيّن AIRTABLE_API_KEY و AIRTABLE_BASE_ID في .env.local\n');
    process.exit(1);
  }

  try {
    await provisionTaalofTables(apiKey, baseId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`\n❌ فشل الإنشاء: ${msg}`);
    if (msg.includes('403') || msg.includes('UNAUTHORIZED') || msg.includes('scope')) {
      console.log('\nالتوكن يحتاج صلاحية إضافية:');
      console.log('   schema.bases:write');
      console.log('افتح https://airtable.com/create/tokens وعدّل التوكن ثم أعد التشغيل.\n');
    }
    process.exit(1);
  }

  console.log('\n—— انتهى الإنشاء ——');
  console.log('التحقق: npm run verify:airtable\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
