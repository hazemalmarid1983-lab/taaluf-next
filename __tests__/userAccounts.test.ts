import { portalAllowsEmail } from '../lib/loginPortal';
import { parseUserAccounts, validateSignup } from '../lib/userAccounts';

const valid = {
  name: 'أم أحمد',
  email: ' Parent.One@Example.com ',
  password: 'secret-pass-1',
  confirmPassword: 'secret-pass-1',
  role: 'parent',
};

describe('self sign-up validation', () => {
  it('accepts a parent or specialist and normalizes the email', () => {
    expect(validateSignup(valid)).toEqual({
      ok: true,
      value: { name: 'أم أحمد', email: 'parent.one@example.com', password: 'secret-pass-1', role: 'parent' },
    });
    expect(validateSignup({ ...valid, role: 'specialist' }).ok).toBe(true);
  });

  it('never lets anyone self-register as admin, advisor or teacher', () => {
    for (const role of ['admin', 'scientific_advisor', 'teacher', 'guest', undefined]) {
      expect(validateSignup({ ...valid, role })).toEqual({ ok: false, error: 'ROLE_NOT_ALLOWED' });
    }
  });

  it('rejects bad input with a specific error', () => {
    expect(validateSignup({ ...valid, name: ' ' })).toEqual({ ok: false, error: 'NAME_REQUIRED' });
    expect(validateSignup({ ...valid, email: 'not-an-email' })).toEqual({ ok: false, error: 'EMAIL_INVALID' });
    expect(validateSignup({ ...valid, password: 'short', confirmPassword: 'short' })).toEqual({
      ok: false,
      error: 'PASSWORD_TOO_SHORT',
    });
    expect(validateSignup({ ...valid, confirmPassword: 'different-pass' })).toEqual({
      ok: false,
      error: 'PASSWORD_MISMATCH',
    });
  });

  it('reserves internal demo and teacher domains', () => {
    expect(validateSignup({ ...valid, email: 'admin@taaluf.local' })).toEqual({ ok: false, error: 'EMAIL_RESERVED' });
    expect(validateSignup({ ...valid, email: 'x@teachers.taaluf' })).toEqual({ ok: false, error: 'EMAIL_RESERVED' });
  });

  it('drops stored rows with an unexpected role', () => {
    const rows = parseUserAccounts(
      JSON.stringify({
        accounts: [
          { id: 'a', email: 'a@x.com', name: 'A', role: 'parent', passwordHash: 'h', createdAt: '' },
          { id: 'b', email: 'b@x.com', name: 'B', role: 'admin', passwordHash: 'h', createdAt: '' },
        ],
      })
    );
    expect(rows.map((row) => row.id)).toEqual(['a']);
    expect(parseUserAccounts('not json')).toEqual([]);
  });
});

describe('login portal accepts real emails only on self-signup portals', () => {
  it('lets any real email use the parent and specialist portals', () => {
    expect(portalAllowsEmail('parent', 'mom@example.com')).toBe(true);
    expect(portalAllowsEmail('specialist', 'dr@clinic.org')).toBe(true);
  });

  it('keeps admin and advisor portals for internal accounts', () => {
    expect(portalAllowsEmail('admin', 'mom@example.com')).toBe(false);
    expect(portalAllowsEmail('hub', 'mom@example.com')).toBe(false);
    expect(portalAllowsEmail('admin', 'admin@taaluf.local')).toBe(true);
    expect(portalAllowsEmail('parent', 'admin@taaluf.local')).toBe(false);
  });
});
