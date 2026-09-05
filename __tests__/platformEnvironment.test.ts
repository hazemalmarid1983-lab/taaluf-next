import {
  hubStorageNamespace,
  platformTier,
  previewUsesProductionAirtable,
} from '../lib/platformEnvironment';

describe('platformEnvironment', () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('detects Vercel preview tier', () => {
    process.env.VERCEL_ENV = 'preview';
    expect(platformTier()).toBe('preview');
    expect(hubStorageNamespace()).toBe('taaluf-data/preview');
  });

  it('detects production tier', () => {
    process.env.VERCEL_ENV = 'production';
    expect(platformTier()).toBe('production');
    expect(hubStorageNamespace()).toBe('taaluf-data/production');
  });

  it('blocks preview when Airtable base matches production id', () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.AIRTABLE_PRODUCTION_BASE_ID = 'appProd123';
    process.env.AIRTABLE_BASE_ID = 'appProd123';
    expect(previewUsesProductionAirtable()).toBe(true);
  });

  it('allows preview with separate Airtable base', () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.AIRTABLE_PRODUCTION_BASE_ID = 'appProd123';
    process.env.AIRTABLE_BASE_ID = 'appPreview456';
    expect(previewUsesProductionAirtable()).toBe(false);
  });
});
