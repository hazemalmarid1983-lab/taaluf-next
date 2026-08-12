/**
 * Smoke test لمسارات تآلف المحلية (بدون طباعة أسرار).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const BASE = process.env.SMOKE_BASE || 'http://127.0.0.1:3000';

const results = [];
function ok(name, pass, detail = '') {
  results.push({ name, pass: !!pass, detail });
  const mark = pass ? 'PASS' : 'FAIL';
  console.log(`${mark}  ${name}${detail ? ' — ' + detail : ''}`);
}

function loadJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

async function fetchText(url, init = {}) {
  const res = await fetch(url, { redirect: 'manual', ...init });
  const text = await res.text().catch(() => '');
  return { res, text, status: res.status };
}

function cookieJar(setCookieHeaders) {
  const jar = new Map();
  const list = setCookieHeaders || [];
  for (const raw of list) {
    const part = String(raw).split(';')[0];
    const i = part.indexOf('=');
    if (i > 0) jar.set(part.slice(0, i), part.slice(i + 1));
  }
  return jar;
}

function mergeCookies(jar, setCookieHeaders) {
  const next = cookieJar(setCookieHeaders);
  for (const [k, v] of next) jar.set(k, v);
  return jar;
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

async function login(email, password) {
  const jar = new Map();
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`, {
    headers: { cookie: cookieHeader(jar) },
  });
  mergeCookies(jar, csrfRes.headers.getSetCookie?.() || []);
  const csrfText = await csrfRes.text();
  let csrfToken = '';
  try {
    csrfToken = JSON.parse(csrfText)?.csrfToken || '';
  } catch {
    throw new Error(`CSRF_NOT_JSON status=${csrfRes.status}`);
  }

  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    portal: email.startsWith('parent') ? 'parent' : 'specialist',
    json: 'true',
    callbackUrl: `${BASE}/dashboard`,
  });

  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      cookie: cookieHeader(jar),
    },
    body,
    redirect: 'manual',
  });
  mergeCookies(jar, loginRes.headers.getSetCookie?.() || []);

  const sess = await fetch(`${BASE}/api/auth/session`, {
    headers: { cookie: cookieHeader(jar) },
  });
  mergeCookies(jar, sess.headers.getSetCookie?.() || []);
  const sessionText = await sess.text();
  let session = {};
  try {
    session = JSON.parse(sessionText);
  } catch {
    session = {};
  }
  return { jar, session, loginStatus: loginRes.status };
}

async function main() {
  console.log(`Smoke base: ${BASE}`);

  // Data integrity
  const screening = loadJson('data/taalof_screening.json');
  const parent = loadJson('data/taalof_parent_criteria.json');
  const criteria = loadJson('data/taalof_criteria.json');
  ok('screening v2 unified', String(screening.version).includes('unified'), screening.version);
  ok('screening 12 with options', screening.items?.length === 12 && screening.items.every((i) => i.options?.length === 4));
  ok('parent v2 unified', String(parent.version).includes('unified'), parent.version);
  ok('parent 20 with options', parent.items?.length === 20 && parent.items.every((i) => i.options?.length === 4));
  ok('criteria 36 unified', criteria.criteria?.length === 36 && String(criteria.version).includes('unified'), criteria.version);
  ok('gemini module present', fs.existsSync(path.join(root, 'lib/gemini.ts')));
  ok('constitution present', fs.readFileSync(path.join(root, 'lib/reportLanguage.ts'), 'utf8').includes('PARENT_REPORT_CONSTITUTION_AR'));

  // Public routes
  for (const p of ['/', '/login', '/login?portal=parent', '/consent']) {
    const { status, text, res } = await fetchText(`${BASE}${p}`);
    const loc = res.headers.get('location') || '';
    const pass =
      status === 200 ||
      (p === '/consent' && status >= 300 && status < 400);
    ok(
      `GET ${p}`,
      pass,
      `status=${status}${loc ? ' loc=' + loc : ''} bytes=${text.length}`
    );
  }

  // Homepage marker
  const home = await fetchText(`${BASE}/`);
  ok('homepage brand', home.text.includes('تآلف'), 'contains تآلف');

  // Parent login + routes
  const parentLogin = await login('parent@taaluf.local', 'taaluf123');
  ok(
    'parent login session',
    Boolean(parentLogin.session?.user?.email),
    parentLogin.session?.user?.email || `status=${parentLogin.loginStatus}`
  );

  const parentCookie = { cookie: cookieHeader(parentLogin.jar) };
  for (const p of [
    '/parent',
    '/dashboard/screening',
    '/dashboard/parent-assessment',
    '/dashboard/games',
  ]) {
    const { status, text, res } = await fetchText(`${BASE}${p}`, {
      headers: parentCookie,
    });
    const loc = res.headers.get('location') || '';
    const pass = status === 200 || (status >= 300 && status < 400 && loc && !loc.includes('/login'));
    ok(`parent route ${p}`, pass, `status=${status}${loc ? ' loc=' + loc : ''} bytes=${text.length}`);
  }

  const screeningPage = await fetchText(`${BASE}/dashboard/screening`, {
    headers: parentCookie,
  });
  ok(
    'screening UI unified copy',
    screeningPage.text.includes('مستقر') ||
      screeningPage.text.includes('الفرز الأولي') ||
      screeningPage.text.includes('اختر الوصف'),
    `status=${screeningPage.status}`
  );

  // Screening API
  const screeningAnswers = screening.items.map((i, idx) => ({
    id: i.id,
    value: idx % 4,
  }));
  const screenApi = await fetch(`${BASE}/api/screening`, {
    method: 'POST',
    headers: { ...parentCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ childId: 'smoke_child', answers: screeningAnswers }),
  });
  const screenJson = await screenApi.json().catch(() => ({}));
  ok(
    'POST /api/screening',
    screenApi.status === 200 && (screenJson.ok || screenJson.result || screenJson.overall != null),
    `status=${screenApi.status}`
  );

  // Parent assessment API
  const parentAnswers = parent.items.map((i, idx) => ({
    id: i.id,
    value: idx % 4,
  }));
  const parentApi = await fetch(`${BASE}/api/parent-assessment`, {
    method: 'POST',
    headers: { ...parentCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ childId: 'smoke_child', answers: parentAnswers }),
  });
  const parentJson = await parentApi.json().catch(() => ({}));
  ok(
    'POST /api/parent-assessment',
    parentApi.status === 200 && Array.isArray(parentJson.mappedScores),
    `status=${parentApi.status} mapped=${parentJson.mappedScores?.length ?? 0}`
  );

  // Specialist login + assessment
  const specialistLogin = await login('specialist@taaluf.local', 'taaluf123');
  ok(
    'specialist login session',
    Boolean(specialistLogin.session?.user?.email),
    specialistLogin.session?.user?.email || `status=${specialistLogin.loginStatus}`
  );
  const specialistCookie = { cookie: cookieHeader(specialistLogin.jar) };

  for (const p of ['/dashboard', '/dashboard/assessments/new', '/dashboard/students']) {
    const { status, res } = await fetchText(`${BASE}${p}`, {
      headers: specialistCookie,
    });
    const loc = res.headers.get('location') || '';
    const pass = status === 200 || (status >= 300 && status < 400 && !String(loc).includes('/login'));
    ok(`specialist route ${p}`, pass, `status=${status}`);
  }

  const scores = criteria.criteria.slice(0, 36).map((c, idx) => ({
    criterionId: c.id,
    score: idx % 4,
  }));

  const analyzeApi = await fetch(`${BASE}/api/ai/analyze`, {
    method: 'POST',
    headers: { ...specialistCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentName: 'طفل تجريبي',
      childAge: 6,
      ageBand: '5-6',
      scores,
      parentNotes: 'ملاحظة دخان للاختبار',
    }),
  });
  const analyzeJson = await analyzeApi.json().catch(() => ({}));
  ok(
    'POST /api/ai/analyze',
    analyzeApi.status === 200 && Boolean(analyzeJson.ai?.analysis || analyzeJson.ai),
    `status=${analyzeApi.status} source=${analyzeJson.source || '?'}`
  );

  const geminiApi = await fetch(`${BASE}/api/gemini`, {
    method: 'POST',
    headers: { ...specialistCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentName: 'طفل تجريبي',
      childAge: 6,
      ageBand: '5-6',
      scores,
      parentNotes: 'ملاحظة دخان للاختبار',
    }),
  });
  const geminiJson = await geminiApi.json().catch(() => ({}));
  ok(
    'POST /api/gemini',
    geminiApi.status === 200 && Boolean(geminiJson.ai?.analysis || geminiJson.ai),
    `status=${geminiApi.status} source=${geminiJson.source || geminiJson.error || '?'}`
  );

  if (geminiJson.ai?.analysis) {
    const a = String(geminiJson.ai.analysis);
    ok(
      'gemini report structure markers',
      a.includes('تقرير') || a.includes('ولي الأمر') || a.includes('تآلف'),
      `len=${a.length}`
    );
  } else {
    ok('gemini report structure markers', false, 'no analysis body');
  }

  const failed = results.filter((r) => !r.pass);
  console.log('\n--- SUMMARY ---');
  console.log(`total=${results.length} pass=${results.length - failed.length} fail=${failed.length}`);
  if (failed.length) {
    for (const f of failed) console.log(`FAIL: ${f.name} — ${f.detail}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('SMOKE_CRASH', err?.message || err);
  process.exit(1);
});
