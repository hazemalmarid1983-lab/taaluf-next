import {
  addCalendarMonths,
  buildCooldownRecord,
  cooldownMessage,
  cooldownMonthsForPlan,
  formatCooldownDate,
  parseCooldownFile,
  resolveCooldown,
  upsertCooldownRecord,
} from '../lib/assessmentCooldown';

describe('assessment cooldown', () => {
  it('uses six months for the basic room plan and three for clinical', () => {
    expect(cooldownMonthsForPlan('child_room')).toBe(6);
    expect(cooldownMonthsForPlan('clinical')).toBe(3);
    const from = new Date(2026, 2, 24);
    expect(formatCooldownDate(addCalendarMonths(from, 6))).toBe('24/09/2026');
    expect(formatCooldownDate(addCalendarMonths(from, 3))).toBe('24/06/2026');
  });

  it('keeps the comprehensive assessment closed until the next date', () => {
    const record = buildCooldownRecord(
      'child_a',
      'child_room',
      new Date(2026, 2, 24)
    );
    const locked = resolveCooldown(
      record,
      'child_room',
      new Date(2026, 3, 1)
    );
    expect(locked.open).toBe(false);
    expect(locked.message).toBe(cooldownMessage(record.nextOpenAt));
    expect(locked.message).toContain('24/09/2026');
    const opened = resolveCooldown(
      record,
      'child_room',
      new Date(2026, 8, 24)
    );
    expect(opened.open).toBe(true);
  });

  it('round-trips the latest server record per child', () => {
    const first = buildCooldownRecord('child_a', 'child_room');
    const second = buildCooldownRecord('child_a', 'clinical');
    const stored = upsertCooldownRecord([first], second);
    const parsed = parseCooldownFile(JSON.stringify({ records: stored }));
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.planId).toBe('clinical');
  });
});
