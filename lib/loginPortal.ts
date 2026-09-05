export type PortalId = 'admin' | 'specialist' | 'parent' | 'hub';

const PORTALS: PortalId[] = ['admin', 'specialist', 'parent', 'hub'];

function asPortal(value: string | null | undefined): PortalId | null {
  if (
    value === 'admin' ||
    value === 'specialist' ||
    value === 'parent' ||
    value === 'hub'
  ) {
    return value;
  }
  return null;
}

/** يفك ?portal=parent حتى لو وصل الرابط مُرمَّزاً خطأ (?portal%3Dspecialist) */
export function parsePortalParam(
  search: string | URLSearchParams | null | undefined
): PortalId {
  if (!search) return 'specialist';
  const params =
    typeof search === 'string'
      ? new URLSearchParams(
          search.startsWith('?') ? search.slice(1) : search
        )
      : search;

  const direct = asPortal(params.get('portal'));
  if (direct) return direct;

  for (const key of params.keys()) {
    let decoded = key;
    try {
      decoded = decodeURIComponent(key);
    } catch {
      /* keep raw */
    }
    const match = decoded.match(/^portal=(admin|specialist|parent|hub)$/);
    if (match) return match[1] as PortalId;
  }

  return 'specialist';
}

export function portalFromEmail(email: string): PortalId | null {
  const e = email.trim().toLowerCase();
  if (e === 'admin@taaluf.local') return 'admin';
  if (e === 'samer@taaluf.local' || e === 'advisor@taaluf.local') return 'hub';
  if (e === 'parent@taaluf.local') return 'parent';
  if (
    e === 'specialist@taaluf.local' ||
    e === 'teacher@taaluf.local' ||
    e === 'guest-specialist@taaluf.local'
  ) {
    return 'specialist';
  }
  return null;
}

export function demoEmailForPortal(portal: PortalId) {
  if (portal === 'admin') return 'admin@taaluf.local';
  if (portal === 'hub') return 'samer@taaluf.local';
  if (portal === 'parent') return 'parent@taaluf.local';
  return 'specialist@taaluf.local';
}

export function isKnownPortal(value: string): value is PortalId {
  return PORTALS.includes(value as PortalId);
}

/**
 * مسار آمن بعد الدخول: يحترم callbackUrl إن كان داخل التطبيق.
 */
export function safePostLoginPath(
  callbackUrl: string | null | undefined,
  fallback: string
): string {
  const fb = fallback.startsWith('/') ? fallback : '/';
  if (!callbackUrl) return fb;
  const raw = callbackUrl.trim();
  if (!raw) return fb;

  const fromUrl = (pathname: string, search: string, hash: string) => {
    if (
      pathname.startsWith('/login') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('//')
    ) {
      return fb;
    }
    return `${pathname}${search}${hash}` || fb;
  };

  if (raw.startsWith('/') && !raw.startsWith('//')) {
    const fake = new URL(raw, 'http://local.invalid');
    return fromUrl(fake.pathname, fake.search, fake.hash);
  }

  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return fb;
    return fromUrl(u.pathname, u.search, u.hash);
  } catch {
    return fb;
  }
}
