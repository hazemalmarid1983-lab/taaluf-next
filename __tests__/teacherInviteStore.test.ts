import {
  acceptInviteRecord,
  attachTeacherForm,
  createInviteRecord,
  parseInviteFile,
  toPublicInvite,
} from '../lib/childRoom/inviteStore';

describe('teacher invite store', () => {
  it('creates a token that can be read without the password hash', () => {
    const created = createInviteRecord([], 'child_1', 'ليان');
    const view = toPublicInvite(created.invite);
    expect(view.token.startsWith('inv_')).toBe(true);
    expect(view.childName).toBe('ليان');
    expect(view.path).toBe(`/invite/teacher/${view.token}`);
    expect(JSON.stringify(view)).not.toContain('passwordHash');
  });

  it('accepts the invite and stores the form for another device to read', () => {
    const created = createInviteRecord([], 'child_1', 'ليان');
    const accepted = acceptInviteRecord(
      created.invites,
      created.invite.token,
      'أ. سارة',
      'pass1234'
    );
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    const saved = attachTeacherForm(accepted.invites, created.invite.token, [
      { criterionId: 'C25', score: 2 },
    ]);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const raw = JSON.stringify({ invites: saved.invites });
    const loaded = parseInviteFile(raw);
    expect(loaded.invites[0]?.form?.scores[0]?.criterionId).toBe('C25');
    expect(toPublicInvite(loaded.invites[0]).formDone).toBe(true);
    expect(raw.includes('passwordHash')).toBe(true);
    expect(JSON.stringify(toPublicInvite(loaded.invites[0]))).not.toContain('fnv_');
  });

  it('rejects a second password that does not match', () => {
    const created = createInviteRecord([], 'child_1', 'ليان');
    const accepted = acceptInviteRecord(
      created.invites,
      created.invite.token,
      'أ. سارة',
      'pass1234'
    );
    if (!accepted.ok) throw new Error('accept failed');
    const again = acceptInviteRecord(
      accepted.invites,
      created.invite.token,
      'أ. سارة',
      'wrong-pass'
    );
    expect(again.ok).toBe(false);
  });
});
