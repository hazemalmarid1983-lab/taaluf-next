import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export function hashPasswordSync(plainPassword: string): string {
  return bcrypt.hashSync(plainPassword, SALT_ROUNDS);
}

/**
 * Compares a plain password to a stored bcrypt hash.
 * Never accepts plain-text stored passwords.
 */
export async function verifyPassword(
  plainPassword: string,
  storedHashedPassword: string
): Promise<boolean> {
  if (!plainPassword || !storedHashedPassword) return false;
  // bcrypt hashes begin with $2a$ / $2b$ / $2y$
  if (!/^\$2[aby]\$/.test(storedHashedPassword)) {
    // TODO: migrate existing users to bcrypt hashes on next login
    return false;
  }
  return bcrypt.compare(plainPassword, storedHashedPassword);
}
