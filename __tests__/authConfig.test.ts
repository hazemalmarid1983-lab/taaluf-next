import { nextAuthSecret, sessionTokenCookieName } from '../lib/authConfig';

describe('session config shared by NextAuth and the middleware', () => {
  it('trims the secret so a pasted trailing newline cannot split the two sides', () => {
    expect(nextAuthSecret({ NODE_ENV: 'production', NEXTAUTH_SECRET: '  s3cret\n' })).toBe('s3cret');
  });

  it('has no secret in production when unset, and a dev fallback otherwise', () => {
    expect(nextAuthSecret({ NODE_ENV: 'production' })).toBeUndefined();
    expect(nextAuthSecret({ NODE_ENV: 'production', NEXTAUTH_SECRET: '   ' })).toBeUndefined();
    expect(nextAuthSecret({ NODE_ENV: 'development' })).toBe('taaluf-dev-secret-change-me');
  });

  it('derives the session cookie name from the auth URL scheme', () => {
    expect(sessionTokenCookieName('https://taaluf-next.vercel.app')).toBe('__Secure-next-auth.session-token');
    expect(sessionTokenCookieName('http://localhost:3000')).toBe('next-auth.session-token');
    expect(sessionTokenCookieName(undefined)).toBe('next-auth.session-token');
  });
});
