/**
 * يضبط متغيرات Production و Preview على Vercel للعزل الآمن.
 * Usage: npm run vercel:setup-environments
 *
 * Production: AIRTABLE_BASE_ID = AIRTABLE_PRODUCTION_BASE_ID (نفس Base الإنتاج)
 * Preview:    AIRTABLE_BASE_ID = sandbox من .airtable-preview.env (إن وُجد)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { loadEnvFiles } from './load-env';

loadEnvFiles();

const PREVIEW_ENV_FILE = path.join(process.cwd(), '.airtable-preview.env');

function parseEnvFile(raw: string) {
  const out: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

function upsertVercelEnv(key: string, value: string, target: 'production' | 'preview') {
  console.log(`  ${key} → ${target}`);
  try {
    execSync(`npx vercel env rm ${key} ${target} --yes`, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    /* not set yet */
  }
  execSync(`npx vercel env add ${key} ${target}`, {
    input: value,
    stdio: ['pipe', 'inherit', 'inherit'],
    encoding: 'utf8',
  });
}

function main() {
  const prodBase =
    process.env.AIRTABLE_PRODUCTION_BASE_ID?.trim() ||
    process.env.AIRTABLE_BASE_ID?.trim();

  if (!prodBase) {
    console.error('\n❌ AIRTABLE_BASE_ID أو AIRTABLE_PRODUCTION_BASE_ID مطلوب في .env.local\n');
    process.exit(1);
  }

  console.log('\n━━━ Vercel environment isolation ━━━\n');
  console.log(`Production Airtable base: ${prodBase}\n`);

  console.log('→ Production variables\n');
  upsertVercelEnv('AIRTABLE_PRODUCTION_BASE_ID', prodBase, 'production');
  upsertVercelEnv('AIRTABLE_BASE_ID', prodBase, 'production');
  upsertVercelEnv('MAINTENANCE_MODE', 'false', 'production');
  upsertVercelEnv('NEXT_PUBLIC_SHOW_ENV_BANNER', 'false', 'production');

  console.log('\n→ Preview guard variables\n');
  upsertVercelEnv('AIRTABLE_PRODUCTION_BASE_ID', prodBase, 'preview');
  upsertVercelEnv('MAINTENANCE_MODE', 'false', 'preview');
  upsertVercelEnv('NEXT_PUBLIC_SHOW_ENV_BANNER', 'true', 'preview');

  if (fs.existsSync(PREVIEW_ENV_FILE)) {
    const previewVars = parseEnvFile(fs.readFileSync(PREVIEW_ENV_FILE, 'utf8'));
    const previewBase = previewVars.AIRTABLE_BASE_ID?.trim();
    if (previewBase && previewBase !== prodBase) {
      console.log('\n→ Preview sandbox Airtable (from .airtable-preview.env)\n');
      upsertVercelEnv('AIRTABLE_BASE_ID', previewBase, 'preview');
    } else {
      console.warn(
        '\n⚠️  .airtable-preview.env موجود لكن AIRTABLE_BASE_ID غير صالح — شغّل npm run setup:airtable-preview\n'
      );
    }
  } else {
    console.warn(
      '\n⚠️  لا يوجد .airtable-preview.env — أنشئ Base تجريبي ثم شغّل npm run setup:airtable-preview\n'
    );
  }

  console.log('\n✅ تم. أعد نشر Production و Preview على Vercel.\n');
  console.log('لتفعيل الصيانة لاحقاً: MAINTENANCE_MODE=true على Production فقط.\n');
}

main();
