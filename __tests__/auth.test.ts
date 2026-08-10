import { hashPassword, verifyPassword } from '../lib/password';

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
