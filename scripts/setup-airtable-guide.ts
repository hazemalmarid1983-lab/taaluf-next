/**
 * دليل خطوة بخطوة لإنشاء جداول Airtable الناقصة.
 * التشغيل: npx tsx scripts/setup-airtable-guide.ts
 */

import { EXPECTED_TABLES } from './airtable-schema';

function main() {
  console.log('\n━━━ دليل إعداد Airtable — قاعدة TaalofDB ━━━\n');
  console.log('1) افتح https://airtable.com وأنشئ Base باسم TaalofDB');
  console.log('2) أنشئ Personal Access Token من https://airtable.com/create/tokens');
  console.log('   الصلاحيات: data.records:read, data.records:write, schema.bases:read');
  console.log('3) انسخ AIRTABLE_API_KEY و AIRTABLE_BASE_ID إلى .env.local\n');
  console.log('4) أنشئ الجداول التالية بالحقول الدقيقة:\n');

  for (const table of EXPECTED_TABLES) {
    console.log(`┌─ جدول: ${table.name}`);
    for (const field of table.fields) {
      console.log(`│  • ${field.name.padEnd(22)} → ${field.type}${field.note ? ` (${field.note})` : ''}`);
    }
    console.log('└────────────────────────────────────────\n');
  }

  console.log('ملاحظات:');
  console.log('- Assessments.Student → Link إلى Students');
  console.log('- Assessments.Specialist → Link إلى Specialists');
  console.log('- AssessmentCriteria.Assessment → Link إلى Assessments');
  console.log('- Payments.currency: SAR | AED | EGP | USD');
  console.log('- Payments.status: pending | captured | failed | refunded');
  console.log('- AuditLog.Action: login, logout, create_student, create_assessment, view_report, delete_data, consent_accepted');
  console.log('\nبعد الإنشاء شغّل: npx tsx scripts/verify-airtable.ts\n');
}

main();
