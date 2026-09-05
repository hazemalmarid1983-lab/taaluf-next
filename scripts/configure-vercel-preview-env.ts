/**
 * يضبط متغيرات Preview على Vercel من ملف .airtable-preview.env
 * Usage: npm run vercel:preview-env
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ENV_FILE = path.join(process.cwd(), '.airtable-preview.env');

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

function main() {
  if (!fs.existsSync(ENV_FILE)) {
    console.error('\n❌ لم يُعثر على .airtable-preview.env');
    console.error('   شغّل أولاً: npm run setup:airtable-preview\n');
    process.exit(1);
  }

  const vars = parseEnvFile(fs.readFileSync(ENV_FILE, 'utf8'));
  const keys = Object.keys(vars);
  if (!keys.length) {
    console.error('\n❌ الملف فارغ\n');
    process.exit(1);
  }

  console.log('\n→ ضبط متغيرات Preview على Vercel…\n');
  for (const key of keys) {
    const value = vars[key];
    console.log(`  ${key}`);
    execSync(`npx vercel env add ${key} preview`, {
      input: value,
      stdio: ['pipe', 'inherit', 'inherit'],
      encoding: 'utf8',
    });
  }
  console.log('\n✅ تم. أعد نشر Preview أو انتظر deployment تلقائي.\n');
}

main();
