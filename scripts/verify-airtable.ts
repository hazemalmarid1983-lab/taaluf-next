/**
 * يتحقق من وجود جداول Airtable المطلوبة وحقولها.
 * التشغيل: npx tsx scripts/verify-airtable.ts
 */

import { EXPECTED_TABLES } from './airtable-schema';
import { loadEnvFiles } from './load-env';

loadEnvFiles();

type MetaTable = {
  id: string;
  name: string;
  fields: Array<{ id: string; name: string; type: string }>;
};

async function fetchTables(apiKey: string, baseId: string): Promise<MetaTable[]> {
  const res = await fetch(
    `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable Meta API failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { tables: MetaTable[] };
  return data.tables || [];
}

async function main() {
  const apiKey = process.env.AIRTABLE_API_KEY || '';
  const baseId = process.env.AIRTABLE_BASE_ID || '';

  console.log('\n━━━ التحقق من مخطط Airtable — تآلف ━━━\n');

  if (!apiKey || !baseId) {
    console.log('❌ AIRTABLE_API_KEY أو AIRTABLE_BASE_ID غير مضبوطين في .env.local');
    console.log('   شغّل scripts/setup-airtable-guide.ts لإنشاء الجداول يدوياً.\n');
    process.exit(1);
  }

  let tables: MetaTable[] = [];
  try {
    tables = await fetchTables(apiKey, baseId);
  } catch (err) {
    console.log('❌ تعذر الاتصال بـ Airtable Meta API');
    console.log(`   ${err instanceof Error ? err.message : err}`);
    console.log('   تأكد أن التوكن يملك صلاحية schema.bases:read\n');
    process.exit(1);
  }

  const byName = new Map(tables.map((t) => [t.name, t]));
  let ok = 0;
  let warn = 0;
  let missing = 0;

  for (const expected of EXPECTED_TABLES) {
    const table = byName.get(expected.name);
    if (!table) {
      console.log(`❌ ${expected.name} — الجدول غير موجود`);
      missing += 1;
      continue;
    }

    const fieldNames = new Set(table.fields.map((f) => f.name));
    const missingFields = expected.fields
      .map((f) => f.name)
      .filter((n) => !fieldNames.has(n));

    if (missingFields.length === 0) {
      console.log(`✅ ${expected.name} — موجود بجميع الحقول المتوقعة`);
      ok += 1;
    } else {
      console.log(
        `⚠️  ${expected.name} — موجود لكن ينقصه: ${missingFields.join(', ')}`
      );
      warn += 1;
    }
  }

  console.log('\n—— الملخص ——');
  console.log(`✅ كامل: ${ok}`);
  console.log(`⚠️  ناقص حقول: ${warn}`);
  console.log(`❌ مفقود: ${missing}`);
  console.log('');

  if (missing > 0 || warn > 0) {
    console.log('للمساعدة في الإنشاء: npx tsx scripts/setup-airtable-guide.ts\n');
    process.exit(missing > 0 ? 1 : 0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
