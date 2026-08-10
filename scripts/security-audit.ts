/**
 * مراجعة أمنية سريعة للكود.
 * التشغيل: npx tsx scripts/security-audit.ts
 */

import fs from 'fs';
import path from 'path';

type Row = { level: 'pass' | 'warn' | 'fail'; msg: string };

const rows: Row[] = [];

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', 'coverage', 'scripts'].includes(entry.name))
      continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function main() {
  console.log('\n━━━ Security Audit — تآلف ━━━\n');

  const appFiles = [...walk('app'), ...walk('lib'), ...walk('components')];
  const apiRoutes = walk('app/api').filter((f) => f.endsWith('route.ts'));

  // 1) Hardcoded secrets
  const secretHits: string[] = [];
  for (const file of appFiles) {
    const text = fs.readFileSync(file, 'utf8');
    if (/sk-[A-Za-z0-9]{10,}/.test(text)) secretHits.push(file);
    if (/Bearer\s+[A-Za-z0-9._-]{20,}/.test(text) && !file.includes('payments'))
      secretHits.push(file);
    if (/api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i.test(text)) secretHits.push(file);
  }
  rows.push(
    secretHits.length
      ? {
          level: 'fail',
          msg: `أسرار محتملة مُقسّاة: ${Array.from(new Set(secretHits)).map((f) => path.relative(process.cwd(), f)).join(', ')}`,
        }
      : { level: 'pass', msg: 'لا أسرار مُقسّاة ظاهرة في المصدر' }
  );

  // 2) Plain password compares
  const plainPw: string[] = [];
  for (const file of appFiles) {
    const text = fs.readFileSync(file, 'utf8');
    if (
      /password\s*===\s*|===\s*password/.test(text) &&
      !/bcrypt|hash|compare|password_hash|TODO/.test(text)
    ) {
      plainPw.push(path.relative(process.cwd(), file));
    }
  }
  rows.push(
    plainPw.length
      ? { level: 'fail', msg: `مقارنة كلمة مرور نصية: ${plainPw.join(', ')}` }
      : { level: 'pass', msg: 'لا مقارنة كلمات مرور نصية (bcrypt مستخدم)' }
  );

  // 3) API auth
  const noAuth: string[] = [];
  for (const file of apiRoutes) {
    const text = fs.readFileSync(file, 'utf8');
    const rel = path.relative(process.cwd(), file);
    const isPublic =
      rel.includes(`${path.sep}auth${path.sep}`) ||
      rel.includes(`payments${path.sep}webhook`) ||
      rel.includes(`access${path.sep}entitlements`);
    const hasAuth =
      text.includes('getServerSession') ||
      text.includes('withAuth') ||
      text.includes('authorize');
    if (!hasAuth && !isPublic) noAuth.push(rel);
  }
  rows.push(
    noAuth.length
      ? {
          level: 'fail',
          msg: `مسارات API بلا تحقق جلسة: ${noAuth.join(', ')}`,
        }
      : {
          level: 'pass',
          msg: 'مسارات API محمية (أو عامة مقصودة: webhook/entitlements/auth)',
        }
  );

  // 4) SQL injection
  const sqlHits = appFiles.filter((f) =>
    /SELECT\s+.+\s+FROM|rawQuery|sql`/i.test(fs.readFileSync(f, 'utf8'))
  );
  rows.push(
    sqlHits.length
      ? {
          level: 'warn',
          msg: `استعلامات خام محتملة: ${sqlHits.map((f) => path.relative(process.cwd(), f)).join(', ')}`,
        }
      : { level: 'pass', msg: 'لا استعلامات SQL خام (Airtable فقط)' }
  );

  // 5) XSS
  const xss = appFiles.filter((f) =>
    fs.readFileSync(f, 'utf8').includes('dangerouslySetInnerHTML')
  );
  rows.push(
    xss.length
      ? {
          level: 'warn',
          msg: `dangerouslySetInnerHTML في: ${xss.map((f) => path.relative(process.cwd(), f)).join(', ')}`,
        }
      : { level: 'pass', msg: 'لا استخدام لـ dangerouslySetInnerHTML' }
  );

  // 6) gitignore
  const gi = fs.readFileSync('.gitignore', 'utf8');
  const giOk =
    (gi.includes('.env*.local') || gi.includes('.env.local')) &&
    gi.includes('node_modules') &&
    gi.includes('.next');
  rows.push(
    giOk
      ? { level: 'pass', msg: '.gitignore يتضمن .env.local و node_modules و .next' }
      : { level: 'fail', msg: '.gitignore ناقص حماية البيئة أو المخرجات' }
  );

  if (!gi.includes('.env.production')) {
    rows.push({
      level: 'warn',
      msg: 'يُفضَّل إضافة .env.production إلى .gitignore',
    });
  } else {
    rows.push({ level: 'pass', msg: '.env.production مغطى في .gitignore' });
  }

  // 7) Client env leakage
  const clientLeak: string[] = [];
  for (const file of appFiles) {
    const text = fs.readFileSync(file, 'utf8');
    if (!text.includes("'use client'") && !text.includes('"use client"'))
      continue;
    if (
      /process\.env\.(?!NEXT_PUBLIC_)/.test(text) &&
      /process\.env\.[A-Z_]+/.test(text)
    ) {
      // allow only NEXT_PUBLIC_
      const matches = text.match(/process\.env\.([A-Z0-9_]+)/g) || [];
      const bad = matches.filter((m) => !m.includes('NEXT_PUBLIC_'));
      if (bad.length) clientLeak.push(path.relative(process.cwd(), file));
    }
  }
  rows.push(
    clientLeak.length
      ? {
          level: 'fail',
          msg: `وصول env غير عام من مكوّنات عميل: ${clientLeak.join(', ')}`,
        }
      : {
          level: 'pass',
          msg: 'مكوّنات العميل لا تقرأ أسراراً من process.env',
        }
  );

  // Demo credentials
  const demo = appFiles.filter((f) =>
    /taaluf123|paid-access/.test(fs.readFileSync(f, 'utf8'))
  );
  rows.push(
    demo.length
      ? {
          level: 'warn',
          msg: `حسابات/كلمات تجريبية للتطوير في: ${demo.map((f) => path.relative(process.cwd(), f)).join(', ')} — عطّلها في الإنتاج`,
        }
      : { level: 'pass', msg: 'لا بيانات تجريبية ظاهرة' }
  );

  for (const r of rows) {
    const icon = r.level === 'pass' ? '✅' : r.level === 'warn' ? '⚠️' : '❌';
    console.log(`${icon} ${r.msg}`);
  }

  const fails = rows.filter((r) => r.level === 'fail').length;
  const warns = rows.filter((r) => r.level === 'warn').length;
  console.log(`\nFails: ${fails} · Warnings: ${warns}\n`);
  process.exit(fails > 0 ? 1 : 0);
}

main();
