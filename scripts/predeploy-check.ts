/**
 * فحوصات ما قبل النشر.
 * التشغيل: npx tsx scripts/predeploy-check.ts
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { loadEnvFiles } from './load-env';

loadEnvFiles();

const REQUIRED_ENV = [
  'AIRTABLE_API_KEY',
  'AIRTABLE_BASE_ID',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'OPENAI_API_KEY',
];

/** اختيارية للإطلاق التجريبي بدون سجل تجاري / Tap */
const OPTIONAL_ENV = ['TAP_SECRET_KEY', 'TAP_PUBLIC_KEY', 'TAP_ENVIRONMENT'];

type Check = { ok: boolean; level: 'pass' | 'warn' | 'fail'; msg: string };

const checks: Check[] = [];

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === 'node_modules' ||
      entry.name === '.next' ||
      entry.name === 'coverage'
    )
      continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function main() {
  console.log('\n━━━ Pre-deploy Check — تآلف ━━━\n');

  // Env vars
  for (const key of REQUIRED_ENV) {
    const val = (process.env[key] || '').trim();
    if (!val) {
      checks.push({
        ok: false,
        level: 'fail',
        msg: `متغير البيئة فارغ: ${key}`,
      });
    } else {
      checks.push({ ok: true, level: 'pass', msg: `${key} مضبوط` });
    }
  }

  for (const key of OPTIONAL_ENV) {
    const val = (process.env[key] || '').trim();
    if (!val) {
      checks.push({
        ok: true,
        level: 'warn',
        msg: `${key} غير مضبوط — الدفع معطّل (مقبول بدون سجل تجاري)`,
      });
    } else {
      checks.push({ ok: true, level: 'pass', msg: `${key} مضبوط` });
    }
  }

  const nextUrl = process.env.NEXTAUTH_URL || '';
  if (nextUrl.startsWith('https://')) {
    checks.push({ ok: true, level: 'pass', msg: 'NEXTAUTH_URL يستخدم https' });
  } else if (nextUrl.includes('localhost') || nextUrl.includes('127.0.0.1')) {
    checks.push({
      ok: true,
      level: 'warn',
      msg: 'NEXTAUTH_URL محلي — غيّره إلى https:// عند النشر على Vercel',
    });
  } else if (nextUrl) {
    checks.push({
      ok: false,
      level: 'fail',
      msg: 'NEXTAUTH_URL يجب أن يبدأ بـ https:// في الإنتاج',
    });
  }

  const tapSecret = (process.env.TAP_SECRET_KEY || '').trim();
  const tapEnv = process.env.TAP_ENVIRONMENT || '';
  if (!tapSecret) {
    checks.push({
      ok: true,
      level: 'warn',
      msg: 'Tap غير مفعّل — المنصة تعمل ووضع الدفع تجريبي/معطّل',
    });
  } else if (tapEnv && tapEnv !== 'production') {
    checks.push({
      ok: true,
      level: 'warn',
      msg: `TAP_ENVIRONMENT=${tapEnv} (sandbox مقبول للتجربة)`,
    });
  } else if (tapEnv === 'production') {
    checks.push({ ok: true, level: 'pass', msg: 'TAP_ENVIRONMENT=production' });
  }

  // .gitignore
  const gi = fs.readFileSync('.gitignore', 'utf8');
  if (gi.includes('.env') || gi.includes('.env*.local')) {
    checks.push({ ok: true, level: 'pass', msg: '.gitignore يغطي ملفات البيئة' });
  } else {
    checks.push({
      ok: false,
      level: 'fail',
      msg: '.gitignore لا يتضمن .env.local',
    });
  }

  const files = [
    ...walk('app'),
    ...walk('lib'),
    ...walk('components'),
  ];

  const consoleHits: string[] = [];
  const localhostHits: string[] = [];
  const credHits: string[] = [];

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const rel = path.relative(process.cwd(), file);
    if (/console\.log\s*\(/.test(text)) consoleHits.push(rel);
    if (/https?:\/\/localhost|127\.0\.0\.1:3000/.test(text))
      localhostHits.push(rel);
    if (
      /password\s*[:=]\s*['"]taaluf123['"]/.test(text) ||
      /useState\(['"]taaluf123['"]\)/.test(text)
    )
      credHits.push(rel);
  }

  if (consoleHits.length) {
    checks.push({
      ok: false,
      level: 'warn',
      msg: `console.log في: ${consoleHits.slice(0, 8).join(', ')}`,
    });
  } else {
    checks.push({ ok: true, level: 'pass', msg: 'لا يوجد console.log في كود التطبيق' });
  }

  if (localhostHits.length) {
    checks.push({
      ok: false,
      level: 'warn',
      msg: `localhost في: ${localhostHits.slice(0, 8).join(', ')}`,
    });
  } else {
    checks.push({ ok: true, level: 'pass', msg: 'لا روابط localhost مُقسّاة في المصدر' });
  }

  if (credHits.length) {
    checks.push({
      ok: false,
      level: 'warn',
      msg: `بيانات تجريبية ظاهرة في: ${credHits.join(', ')}`,
    });
  } else {
    checks.push({
      ok: true,
      level: 'pass',
      msg: 'لا كلمات مرور تجريبية كقيم افتراضية في الواجهة',
    });
  }

  // Build
  try {
    console.log('جاري تشغيل npm run build…\n');
    execSync('npm run build', { stdio: 'inherit' });
    checks.push({ ok: true, level: 'pass', msg: 'npm run build نجح' });
  } catch {
    checks.push({ ok: false, level: 'fail', msg: 'npm run build فشل' });
  }

  console.log('\n—— النتائج ——');
  for (const c of checks) {
    const icon = c.level === 'pass' ? '✅' : c.level === 'warn' ? '⚠️' : '❌';
    console.log(`${icon} ${c.msg}`);
  }

  const fails = checks.filter((c) => c.level === 'fail').length;
  const warns = checks.filter((c) => c.level === 'warn').length;
  console.log(`\nFails: ${fails} · Warnings: ${warns}\n`);
  process.exit(fails > 0 ? 1 : 0);
}

main();
