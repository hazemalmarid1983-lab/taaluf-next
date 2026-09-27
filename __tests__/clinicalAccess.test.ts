import {
  ASSESSMENT_SUBMIT_PERMISSIONS,
  authorizeActor,
  canAccessChild,
  linkDecision,
  type ClinicalActor,
} from '../lib/clinicalAccess';
import { filterStudentsForActor } from '../lib/studentVisibility';

const actor = (role: ClinicalActor['role'], userId = 'u1', email?: string): ClinicalActor => ({
  userId,
  role,
  email,
});

const links = { parentUserIds: ['p1'], specialistUserIds: ['s1'] };

describe('authorizeActor (API defense in depth)', () => {
  it('rejects a missing session with 401', () => {
    expect(authorizeActor(null, ['view_child_progress'])).toEqual({
      ok: false,
      status: 401,
      error: 'UNAUTHORIZED',
    });
    expect(authorizeActor({ role: 'parent' }, ['view_child_progress']).ok).toBe(false);
  });

  it('rejects unknown roles (GUEST) with 403 even for read permissions', () => {
    for (const role of ['guest', 'hacker', '', undefined]) {
      const decision = authorizeActor({ id: 'x', role }, ['view_child_progress']);
      expect(decision).toEqual({ ok: false, status: 403, error: 'FORBIDDEN' });
    }
  });

  it('requires at least one listed permission', () => {
    expect(authorizeActor({ id: 'p', role: 'parent' }, ['run_home_session']).ok).toBe(true);
    expect(authorizeActor({ id: 'p', role: 'parent' }, ['update_iep_goals']).ok).toBe(false);
    expect(authorizeActor({ id: 'a', role: 'scientific_advisor' }, ['record_session_trials']).ok).toBe(false);
    expect(authorizeActor({ id: 's', role: 'specialist' }, ['record_session_trials']).ok).toBe(true);
  });

  it('lets clinical roles submit assessments but never guests', () => {
    for (const role of ['parent', 'specialist', 'admin', 'scientific_advisor']) {
      expect(authorizeActor({ id: 'x', role }, ASSESSMENT_SUBMIT_PERMISSIONS).ok).toBe(true);
    }
    expect(authorizeActor({ id: 'g', role: 'guest' }, ASSESSMENT_SUBMIT_PERMISSIONS).ok).toBe(false);
  });
});

describe('canAccessChild', () => {
  it('limits parents and specialists to their linked children', () => {
    expect(canAccessChild(actor('PARENT', 'p1'), links, 'write')).toBe(true);
    expect(canAccessChild(actor('PARENT', 'p2'), links, 'read')).toBe(false);
    expect(canAccessChild(actor('SPECIALIST', 's1'), links, 'write')).toBe(true);
    expect(canAccessChild(actor('SPECIALIST', 's2'), links, 'read')).toBe(false);
  });

  it('gives advisors read-only access, admins full access and guests none', () => {
    expect(canAccessChild(actor('SCIENTIFIC_ADVISOR'), links, 'read')).toBe(true);
    expect(canAccessChild(actor('SCIENTIFIC_ADVISOR'), links, 'write')).toBe(false);
    expect(canAccessChild(actor('SUPER_ADMIN'), links, 'write')).toBe(true);
    expect(canAccessChild(actor('GUEST'), links, 'read')).toBe(false);
  });
});

describe('linkDecision', () => {
  it('lets the first user create a record and blocks strangers from joining it', () => {
    expect(linkDecision(actor('PARENT', 'p9'), null)).toEqual({ ok: true, as: 'parent' });
    expect(linkDecision(actor('PARENT', 'p9'), links)).toEqual({ ok: false, error: 'CHILD_OWNED' });
    expect(linkDecision(actor('SPECIALIST', 's9'), links)).toEqual({ ok: false, error: 'CHILD_OWNED' });
    expect(linkDecision(actor('PARENT', 'p1'), links)).toEqual({ ok: true, as: 'parent' });
  });

  it('never links advisors or guests', () => {
    expect(linkDecision(actor('SCIENTIFIC_ADVISOR'), null).ok).toBe(false);
    expect(linkDecision(actor('GUEST'), null).ok).toBe(false);
  });
});

describe('filterStudentsForActor', () => {
  const students = [
    { id: 'a', fields: { parent_email: 'Mom@x.com', specialist_email: 's@x.com' } },
    { id: 'b', fields: { parent_email: 'other@x.com' } },
  ];

  it('shows parents only their own children by email', () => {
    expect(filterStudentsForActor(students, actor('PARENT', 'p', 'mom@x.com')).map((s) => s.id)).toEqual(['a']);
    expect(filterStudentsForActor(students, actor('PARENT', 'p'))).toEqual([]);
  });

  it('shows specialists assigned or unassigned students', () => {
    expect(filterStudentsForActor(students, actor('SPECIALIST', 's', 's@x.com')).map((s) => s.id)).toEqual(['a', 'b']);
    expect(filterStudentsForActor(students, actor('SPECIALIST', 's', 'z@x.com')).map((s) => s.id)).toEqual(['b']);
  });

  it('shows nothing to guests', () => {
    expect(filterStudentsForActor(students, actor('GUEST'))).toEqual([]);
  });
});
