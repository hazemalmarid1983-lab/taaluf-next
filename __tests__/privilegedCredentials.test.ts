import fs from 'fs';
import os from 'os';
import path from 'path';
import { hashPasswordSync } from '../lib/password';
import {
  changePrivilegedPassword,
  getPrivilegedPasswordHash,
  resetPrivilegedCredentialsMemoryForTests,
  verifyPrivilegedLogin,
} from '../lib/privilegedCredentials';
import { portalMatchesEmail } from '../lib/loginPortal';

describe('privileged credentials', () => {
  const tmpDir = path.join(os.tmpdir(), `taaluf-priv-${Date.now()}`);
  const fallback = hashPasswordSync('taaluf123');

  beforeAll(() => {
    process.env.TAALUF_DATA_DIR = tmpDir;
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    resetPrivilegedCredentialsMemoryForTests();
    const file = path.join(tmpDir, 'privileged-credentials.json');
    if (fs.existsSync(file)) fs.unlinkSync(file);
  });

  it('stores a custom admin password', async () => {
    const result = await changePrivilegedPassword({
      email: 'admin@taaluf.local',
      currentPassword: 'taaluf123',
      newPassword: 'AdminSecure9',
      fallbackHash: fallback,
    });
    expect(result.ok).toBe(true);
    const hash = await getPrivilegedPasswordHash('admin@taaluf.local');
    expect(hash).toBeTruthy();
    await expect(
      verifyPrivilegedLogin('admin@taaluf.local', 'AdminSecure9', fallback)
    ).resolves.toBe(true);
    await expect(
      verifyPrivilegedLogin('admin@taaluf.local', 'taaluf123', fallback)
    ).resolves.toBe(false);
  });

  it('stores advisor password separately from admin', async () => {
    await changePrivilegedPassword({
      email: 'admin@taaluf.local',
      currentPassword: 'taaluf123',
      newPassword: 'AdminOnly99',
      fallbackHash: fallback,
    });
    resetPrivilegedCredentialsMemoryForTests();
    const result = await changePrivilegedPassword({
      email: 'samer@taaluf.local',
      currentPassword: 'taaluf123',
      newPassword: 'SamerOnly99',
      fallbackHash: fallback,
    });
    expect(result.ok).toBe(true);
    await expect(
      verifyPrivilegedLogin('samer@taaluf.local', 'SamerOnly99', fallback)
    ).resolves.toBe(true);
    await expect(
      verifyPrivilegedLogin('admin@taaluf.local', 'AdminOnly99', fallback)
    ).resolves.toBe(false);
  });
});

describe('portal email matching', () => {
  it('blocks admin email on hub portal', () => {
    expect(portalMatchesEmail('hub', 'admin@taaluf.local')).toBe(false);
    expect(portalMatchesEmail('admin', 'samer@taaluf.local')).toBe(false);
    expect(portalMatchesEmail('admin', 'admin@taaluf.local')).toBe(true);
    expect(portalMatchesEmail('hub', 'samer@taaluf.local')).toBe(true);
  });
});
