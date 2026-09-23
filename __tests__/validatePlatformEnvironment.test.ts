import {
  assertPlatformEnvironmentSafe,
  validatePlatformEnvironment,
} from '../lib/validatePlatformEnvironment';

describe('validatePlatformEnvironment', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env.AIRTABLE_API_KEY = 'pat-test';
  });

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('passes production when base ids match', () => {
    process.env.VERCEL_ENV = 'production';
    process.env.AIRTABLE_BASE_ID = 'appProd123';
    process.env.AIRTABLE_PRODUCTION_BASE_ID = 'appProd123';
    const result = validatePlatformEnvironment();
    expect(result.ok).toBe(true);
    expect(result.tier).toBe('production');
  });

  it('fails production when base ids differ', () => {
    process.env.VERCEL_ENV = 'production';
    process.env.AIRTABLE_BASE_ID = 'appOther';
    process.env.AIRTABLE_PRODUCTION_BASE_ID = 'appProd123';
    const result = validatePlatformEnvironment();
    expect(result.ok).toBe(false);
    expect(result.issues[0]).toMatch(/must match/);
  });

  it('fails preview when pointed at production base', () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.AIRTABLE_BASE_ID = 'appProd123';
    process.env.AIRTABLE_PRODUCTION_BASE_ID = 'appProd123';
    const result = validatePlatformEnvironment();
    expect(result.ok).toBe(false);
    expect(assertPlatformEnvironmentSafe).toThrow(/sandbox/);
  });

  it('passes preview with separate sandbox base', () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.AIRTABLE_BASE_ID = 'appPreview456';
    process.env.AIRTABLE_PRODUCTION_BASE_ID = 'appProd123';
    expect(validatePlatformEnvironment().ok).toBe(true);
  });
});
