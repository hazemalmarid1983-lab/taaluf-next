/**
 * Smoke test: scientific advisor RBAC via live session (local dev server).
 * Usage: node scripts/verify-advisor-permissions.mjs [baseUrl]
 */

const BASE = process.argv[2] || 'http://localhost:3000';
const ADVISOR = { email: 'samer@taaluf.local', password: 'taaluf123' };

function parseCookies(setCookieHeaders) {
  const jar = new Map();
  for (const raw of setCookieHeaders) {
    const part = raw.split(';')[0];
    const eq = part.indexOf('=');
    if (eq > 0) jar.set(part.slice(0, eq), part.slice(eq + 1));
  }
  return jar;
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

async function login(email, password) {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const csrfCookies = parseCookies(csrfRes.headers.getSetCookie?.() || []);

  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    callbackUrl: `${BASE}/hub`,
    json: 'true',
  });

  const signInRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookieHeader(csrfCookies),
    },
    body,
    redirect: 'manual',
  });

  const jar = parseCookies(signInRes.headers.getSetCookie?.() || []);
  for (const [k, v] of csrfCookies) jar.set(k, v);

  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: cookieHeader(jar) },
  });
  const session = await sessionRes.json();
  return { jar, session };
}

async function get(path, jar) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Cookie: cookieHeader(jar) },
    redirect: 'manual',
  });
  return { status: res.status, location: res.headers.get('location') };
}

async function json(path, jar, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Cookie: cookieHeader(jar),
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

const checks = [];

function record(name, ok, detail = '') {
  checks.push({ name, ok, detail });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log(`\nAdvisor RBAC verification @ ${BASE}\n`);

  const { jar, session } = await login(ADVISOR.email, ADVISOR.password);
  record(
    'Login as advisor',
    session?.user?.role === 'scientific_advisor',
    session?.user?.role || 'no session'
  );

  const hubPage = await get('/hub', jar);
  record('GET /hub → 200', hubPage.status === 200, `status ${hubPage.status}`);

  const adminPage = await get('/admin', jar);
  record(
    'GET /admin blocked',
    adminPage.status === 307 && adminPage.location?.includes('/hub'),
    `status ${adminPage.status} → ${adminPage.location || '—'}`
  );

  const parentPage = await get('/parent', jar);
  record(
    'GET /parent blocked',
    parentPage.status === 307 && parentPage.location?.includes('/hub'),
    `status ${parentPage.status} → ${parentPage.location || '—'}`
  );

  const hubApi = await json('/api/hub', jar);
  record(
    'GET /api/hub',
    hubApi.status === 200 && hubApi.data?.actor?.memberId === 'samer',
    hubApi.data?.actor?.role || `status ${hubApi.status}`
  );

  const createPost = await json('/api/hub/posts', jar, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: 'research_note',
      title: 'RBAC smoke test',
      body: 'Automated advisor permission check — safe to delete.',
    }),
  });
  record(
    'POST /api/hub/posts (propose)',
    createPost.status === 200 && createPost.data?.post?.status === 'pending',
    `status ${createPost.status}`
  );

  const postId = createPost.data?.post?.id;
  if (postId) {
    const approveAttempt = await json(`/api/hub/posts/${postId}`, jar, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });
    record(
      'PATCH approve blocked for advisor',
      approveAttempt.status === 403,
      `status ${approveAttempt.status}`
    );

    const replyAttempt = await json(`/api/hub/posts/${postId}`, jar, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: 'ملاحظة مراجعة — اختبار صلاحيات' }),
    });
    record(
      'PATCH reply allowed for advisor',
      replyAttempt.status === 200,
      `status ${replyAttempt.status}`
    );
  } else {
    record('PATCH approve blocked for advisor', false, 'no post id');
    record('PATCH reply allowed for advisor', false, 'no post id');
  }

  const mouReset = await json('/api/hub/mou', jar, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reset' }),
  });
  record(
    'MOU reset blocked for advisor',
    mouReset.status === 403,
    `status ${mouReset.status}`
  );

  const dashboard = await get('/dashboard', jar);
  record(
    'GET /dashboard (test env preview)',
    dashboard.status === 200,
    `status ${dashboard.status}`
  );

  const sensory = await get('/sensory-rooms', jar);
  record(
    'GET /sensory-rooms (test env)',
    sensory.status === 200,
    `status ${sensory.status}`
  );

  const failed = checks.filter((c) => !c.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} passed\n`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
