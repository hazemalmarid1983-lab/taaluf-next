import { hashPassword, verifyPassword } from '../lib/password';
import { ensureAuthUrl, isUsableAuthUrl } from '../lib/ensureAuthUrl';
import {
  parsePortalParam,
  portalFromEmail,
  safePostLoginPath,
} from '../lib/loginPortal';

describe('bcrypt password helpers', () => {
  it('hash + compare correct password → true', async () => {
    const hashed = await hashPassword('taaluf123');
    expect(hashed.startsWith('$2')).toBe(true);
    await expect(verifyPassword('taaluf123', hashed)).resolves.toBe(true);
  });

  it('compare wrong password → false', async () => {
    const hashed = await hashPassword('taaluf123');
    await expect(verifyPassword('wrong-pass', hashed)).resolves.toBe(false);
  });
});

describe('isUsableAuthUrl', () => {
  it('accepts localhost and loopback', () => {
    expect(isUsableAuthUrl('http://localhost:3000')).toBe(true);
    expect(isUsableAuthUrl('http://127.0.0.1:3000')).toBe(true);
    expect(isUsableAuthUrl('http://[::1]:3000')).toBe(true);
  });

  it('rejects broken hosts', () => {
    expect(isUsableAuthUrl('https://https')).toBe(false);
    expect(isUsableAuthUrl('not a url')).toBe(false);
    expect(isUsableAuthUrl('')).toBe(false);
  });
});

describe('ensureAuthUrl', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env.NEXTAUTH_URL = original.NEXTAUTH_URL;
    process.env.NEXT_PUBLIC_APP_URL = original.NEXT_PUBLIC_APP_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL =
      original.VERCEL_PROJECT_PRODUCTION_URL;
    process.env.VERCEL_URL = original.VERCEL_URL;
  });

  it('keeps local NEXTAUTH_URL instead of rewriting to Vercel', () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    process.env.VERCEL_URL = 'taaluf-next.vercel.app';
    expect(ensureAuthUrl()).toBe('http://localhost:3000');
  });
});

describe('login portal helpers', () => {
  it('reads a hub portal query', () => {
    expect(parsePortalParam('portal=hub')).toBe('hub');
  });

  it('reads a mistakenly encoded portal key', () => {
    expect(parsePortalParam('portal%3Dspecialist=')).toBe('specialist');
  });

  it('maps demo emails to portals', () => {
    expect(portalFromEmail('parent@taaluf.local')).toBe('parent');
    expect(portalFromEmail('specialist@taaluf.local')).toBe('specialist');
    expect(portalFromEmail('samer@taaluf.local')).toBe('hub');
    expect(portalFromEmail('admin@taaluf.local')).toBe('admin');
  });

  it('keeps an in-app callback path', () => {
    expect(
      safePostLoginPath(
        'http://127.0.0.1:3000/sensory-room/child_local',
        '/parent'
      )
    ).toBe('/sensory-room/child_local');
  });

  it('drops login/api callbacks', () => {
    expect(safePostLoginPath('/login?portal=parent', '/parent')).toBe(
      '/parent'
    );
  });
});
