import {
  DEV_DEMO_PASSWORD,
  demoAccountsPolicy,
  demoFallbackHash,
  nextAuthSecret,
} from '../lib/demoAccounts';
import { verifyPassword } from '../lib/password';

describe('demo account policy', () => {
  it('uses the development password outside production', async () => {
    expect(demoAccountsPolicy({ NODE_ENV: 'development' })).toEqual({
      enabled: true,
      mode: 'development',
    });
    const hash = demoFallbackHash(DEV_DEMO_PASSWORD, { NODE_ENV: 'test' });
    await expect(verifyPassword(DEV_DEMO_PASSWORD, hash!)).resolves.toBe(true);
  });

  it('disables demo accounts in production even in pilot mode or without Tap', () => {
    const env = {
      NODE_ENV: 'production',
      TAALUF_PILOT_MODE: 'true',
      PAYMENTS_DISABLED: 'true',
      NEXT_PUBLIC_PAYMENTS_DISABLED: 'true',
    };
    expect(demoAccountsPolicy(env)).toEqual({ enabled: false, reason: 'production_disabled' });
    expect(demoFallbackHash(DEV_DEMO_PASSWORD, env)).toBeNull();
  });

  it('never accepts the default or a short password in production', () => {
    for (const password of [DEV_DEMO_PASSWORD, 'paid-access', 'short-pass']) {
      const env = { NODE_ENV: 'production', ALLOW_DEMO_USERS: 'true', DEMO_USERS_PASSWORD: password };
      expect(demoAccountsPolicy(env)).toEqual({ enabled: false, reason: 'production_weak_password' });
    }
  });

  it('allows an explicit strong override in production and rejects taaluf123', async () => {
    const env = {
      NODE_ENV: 'production',
      ALLOW_DEMO_USERS: 'true',
      DEMO_USERS_PASSWORD: 'Pilot-Strong-Pass-2026',
    };
    const hash = demoFallbackHash(DEV_DEMO_PASSWORD, env)!;
    await expect(verifyPassword('Pilot-Strong-Pass-2026', hash)).resolves.toBe(true);
    await expect(verifyPassword(DEV_DEMO_PASSWORD, hash)).resolves.toBe(false);
  });

  it('has no fallback NextAuth secret in production', () => {
    expect(nextAuthSecret({ NODE_ENV: 'production' })).toBeUndefined();
    expect(nextAuthSecret({ NODE_ENV: 'production', NEXTAUTH_SECRET: 's3cret' })).toBe('s3cret');
    expect(nextAuthSecret({ NODE_ENV: 'development' })).toBeTruthy();
  });
});
