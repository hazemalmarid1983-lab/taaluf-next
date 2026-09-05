/**
 * يتحقق من المتغيرات المطلوبة للنشر — بدون طباعة القيم السرية.
 * الاستخدام: node scripts/vercel-env-check.mjs [.env.local]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const envFile = process.argv[2] || path.join(root, '.env.local');

const REQUIRED = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'NEXT_PUBLIC_APP_URL',
  'AIRTABLE_API_KEY',
  'AIRTABLE_BASE_ID',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
];

const PILOT = [
  'TAALUF_PILOT_MODE',
  'NEXT_PUBLIC_PAYMENTS_DISABLED',
  'ALLOW_DEMO_USERS',
  'NEXT_PUBLIC_LEARNING_DIFFICULTIES_ENABLED',
];

function parseEnv(text) {
  const map = new Map();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i <= 0) continue;
    map.set(trimmed.slice(0, i).trim(), trimmed.slice(i + 1).trim());
  }
  return map;
}

if (!fs.existsSync(envFile)) {
  console.error(`Missing env file: ${envFile}`);
  process.exit(1);
}

const env = parseEnv(fs.readFileSync(envFile, 'utf8'));
let fail = 0;

function check(key, required = true) {
  const v = env.get(key) ?? process.env[key] ?? '';
  const ok = Boolean(String(v).trim());
  const mark = ok ? 'OK ' : required ? 'MISSING' : 'WARN';
  console.log(`${mark.padEnd(8)} ${key}`);
  if (required && !ok) fail += 1;
  return ok;
}

console.log(`Checking: ${envFile}\n--- Required (production) ---`);
for (const k of REQUIRED) check(k, true);

console.log('\n--- Pilot / product flags ---');
for (const k of PILOT) check(k, false);

console.log('\n--- Recommendations ---');
if (env.get('ALLOW_DEMO_USERS') === 'true') {
  console.log('WARN     ALLOW_DEMO_USERS=true — use false on public production');
}
if (!env.get('NEXT_PUBLIC_APP_URL')?.trim()) {
  console.log('MISSING  NEXT_PUBLIC_APP_URL — add same value as NEXTAUTH_URL');
  fail += 1;
}
if (env.get('NEXT_PUBLIC_LEARNING_DIFFICULTIES_ENABLED') !== 'false') {
  console.log('INFO     Set NEXT_PUBLIC_LEARNING_DIFFICULTIES_ENABLED=false for autism-only pilot');
}

console.log(`\n--- Result: ${fail ? 'NOT READY' : 'READY'} (${fail} blocking) ---`);
process.exit(fail ? 1 : 0);
