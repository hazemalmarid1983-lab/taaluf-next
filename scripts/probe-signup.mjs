// Reproduces register → immediate credentials sign-in against a deployment.
// Usage: node scripts/probe-signup.mjs https://taaluf-next.vercel.app
const base = process.argv[2] || 'http://localhost:3000';
const role = process.argv[3] || 'parent';
const quick = process.argv.includes('--quick');
const email = `qa-signup-${role}-${Date.now()}@example.com`;
const password = 'qa-probe-pass-123';

function cookieHeader(res, jar) {
  for (const raw of res.headers.getSetCookie?.() || []) {
    const [pair] = raw.split(';');
    const [name, ...rest] = pair.split('=');
    jar.set(name.trim(), rest.join('='));
  }
  return [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
}

async function signIn(label) {
  const jar = new Map();
  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  cookieHeader(csrfRes, jar);
  const started = Date.now();
  const res = await fetch(`${base}/api/auth/callback/credentials`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; '),
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      portal: role,
      json: 'true',
      callbackUrl: `${base}/${role === 'parent' ? 'parent' : 'dashboard'}`,
    }),
  });
  const cookies = cookieHeader(res, jar);
  const location = res.headers.get('location') || (await res.text()).slice(0, 200);
  const session = cookies.includes('session-token');
  console.log(`[${label}] status=${res.status} ms=${Date.now() - started} sessionCookie=${session} -> ${location}`);
  if (session) {
    for (const path of [`/${role === 'parent' ? 'parent' : 'dashboard'}`, '/dashboard/home-classroom']) {
      const page = await fetch(`${base}${path}`, { redirect: 'manual', headers: { Cookie: cookies } });
      const target = page.headers.get('location');
      const bounced = Boolean(target && target.includes('/login'));
      console.log(`  [middleware] GET ${path} -> ${page.status}${target ? ` ${target}` : ''} ${bounced ? 'BOUNCED TO LOGIN' : 'ok'}`);
    }
  }
  return session;
}

const reg = await fetch(`${base}/api/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'QA probe', email, password, confirmPassword: password, role }),
});
console.log(`[register] status=${reg.status} body=${await reg.text()} email=${email}`);

await signIn('immediate');
if (quick) process.exit(0);
await new Promise((r) => setTimeout(r, 5000));
await signIn('after 5s');
await new Promise((r) => setTimeout(r, 25000));
await signIn('after 30s');
