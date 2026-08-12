const BASE = process.env.SMOKE_BASE || 'https://taaluf-next.vercel.app';

async function tryLogin(email, password, portal) {
  const jar = new Map();
  const merge = (res) => {
    const raw = res.headers.getSetCookie?.() || [];
    for (const c of raw) {
      const part = c.split(';')[0];
      const i = part.indexOf('=');
      if (i > 0) jar.set(part.slice(0, i), part.slice(i + 1));
    }
  };
  const cookie = () =>
    [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');

  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  merge(csrfRes);
  const { csrfToken } = await csrfRes.json();

  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    portal,
    json: 'true',
    callbackUrl: `${BASE}/admin`,
  });

  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      cookie: cookie(),
    },
    body,
    redirect: 'manual',
  });
  merge(loginRes);
  const loginText = await loginRes.text();

  const sessRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { cookie: cookie() },
  });
  merge(sessRes);
  const session = await sessRes.json().catch(() => ({}));

  console.log(
    JSON.stringify(
      {
        portal,
        email,
        loginStatus: loginRes.status,
        location: loginRes.headers.get('location'),
        loginBody: loginText.slice(0, 200),
        session,
        cookies: [...jar.keys()],
      },
      null,
      2
    )
  );
}

await tryLogin('admin@taaluf.local', 'taaluf123', 'admin');
await tryLogin('parent@taaluf.local', 'taaluf123', 'parent');
