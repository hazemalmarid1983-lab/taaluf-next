import {
  C15_PROGRESSION_DIMENSION_SKILL_IDS,
  C15_TARGET_SKILL_IDS,
} from '../lib/training/c15SkillClassification';
import {
  C15_SKILL_MOVEMENT_IDS,
  resolveMovementIdsForC15TargetSkills,
} from '../lib/training/c15SkillMovementMap';
import { requireTrainingMedia } from '../lib/training/engine';
import { resolveMediaRuntimeConfig } from '../lib/training/engine/mediaLoader';
import {
  loadMotorSocialImitationChapter,
  MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
} from '../lib/training/loadChapter';
import {
  OBSERVER_IMITATION_MEDIA_ID,
  resolveObserverImitationRuntimeSettings,
} from '../lib/training/observerImitationEngine';
import { beginObserverImitationSession } from '../lib/training/observerImitationSessionFlow';

const S1 = C15_TARGET_SKILL_IDS[0];
const S2 = C15_TARGET_SKILL_IDS[1];
const S3 = C15_TARGET_SKILL_IDS[2];
const S4 = C15_PROGRESSION_DIMENSION_SKILL_IDS[0];
const S5 = C15_PROGRESSION_DIMENSION_SKILL_IDS[1];

const GROSS = new Set(C15_SKILL_MOVEMENT_IDS[S1]);
const FINE = new Set(C15_SKILL_MOVEMENT_IDS[S2]);
const SOCIAL = new Set(C15_SKILL_MOVEMENT_IDS[S3]);
const ALL_S1_S3 = new Set([...GROSS, ...FINE, ...SOCIAL]);

function movementIdsFromSettings(
  settings: ReturnType<typeof resolveObserverImitationRuntimeSettings>
): string[] {
  return settings.trials.map((trial) => trial.movementId);
}

function expectOnlyFromPool(actual: string[], allowed: Set<string>) {
  for (const id of actual) {
    expect(allowed.has(id)).toBe(true);
  }
}

describe('C15 skill → movement pool', () => {
  const chapter = loadMotorSocialImitationChapter();
  const media = requireTrainingMedia(chapter, OBSERVER_IMITATION_MEDIA_ID);
  const config = resolveMediaRuntimeConfig(media, 1);

  it('S1 only excludes fine and social movements', () => {
    const settings = resolveObserverImitationRuntimeSettings({
      config,
      sessionId: 'sess_s1_only',
      skillIds: [S1],
    });
    const ids = movementIdsFromSettings(settings);
    expect(ids.length).toBe(5);
    expectOnlyFromPool(ids, GROSS);
    expect(ids.some((id) => FINE.has(id))).toBe(false);
    expect(ids.some((id) => SOCIAL.has(id))).toBe(false);
  });

  it('S2 only excludes gross and social movements', () => {
    const settings = resolveObserverImitationRuntimeSettings({
      config,
      sessionId: 'sess_s2_only',
      skillIds: [S2],
    });
    const ids = movementIdsFromSettings(settings);
    expectOnlyFromPool(ids, FINE);
    expect(ids.some((id) => GROSS.has(id))).toBe(false);
    expect(ids.some((id) => SOCIAL.has(id))).toBe(false);
  });

  it('S3 only allows smile', () => {
    const settings = resolveObserverImitationRuntimeSettings({
      config,
      sessionId: 'sess_s3_only',
      skillIds: [S3],
    });
    const ids = movementIdsFromSettings(settings);
    expect(new Set(ids)).toEqual(new Set(['smile']));
  });

  it('S1 + S2 union pool', () => {
    const settings = resolveObserverImitationRuntimeSettings({
      config,
      sessionId: 'sess_s1_s2',
      skillIds: [S1, S2],
    });
    const ids = movementIdsFromSettings(settings);
    expectOnlyFromPool(ids, new Set([...GROSS, ...FINE]));
    expect(ids.some((id) => SOCIAL.has(id))).toBe(false);
  });

  it('S1 + S2 + S3 union pool', () => {
    const settings = resolveObserverImitationRuntimeSettings({
      config,
      sessionId: 'sess_s1_s2_s3',
      skillIds: [S1, S2, S3],
    });
    const ids = movementIdsFromSettings(settings);
    expectOnlyFromPool(ids, ALL_S1_S3);
    expect(resolveMovementIdsForC15TargetSkills([S1, S2, S3]).sort()).toEqual(
      [...ALL_S1_S3].sort()
    );
  });

  it('S4/S5 do not restrict movement pool (same trials as legacy)', () => {
    const sessionId = 'sess_progression_only';
    const withProgression = resolveObserverImitationRuntimeSettings({
      config,
      sessionId,
      skillIds: [S4, S5],
    });
    const legacy = resolveObserverImitationRuntimeSettings({
      config,
      sessionId,
    });
    expect(movementIdsFromSettings(withProgression)).toEqual(
      movementIdsFromSettings(legacy)
    );
  });

  it('S1 + S4/S5 uses S1 pool only', () => {
    const settings = resolveObserverImitationRuntimeSettings({
      config,
      sessionId: 'sess_s1_plus_prog',
      skillIds: [S1, S4, S5],
    });
    expectOnlyFromPool(movementIdsFromSettings(settings), GROSS);
  });

  it('deterministic trials for same session seed and skills', () => {
    const a = resolveObserverImitationRuntimeSettings({
      config,
      sessionId: 'fixed_seed_det',
      skillIds: [S1, S2],
    });
    const b = resolveObserverImitationRuntimeSettings({
      config,
      sessionId: 'fixed_seed_det',
      skillIds: [S1, S2],
    });
    expect(movementIdsFromSettings(a)).toEqual(movementIdsFromSettings(b));
  });

  it('legacy without skillIds keeps chapter movementIds override behavior', () => {
    const settings = resolveObserverImitationRuntimeSettings({
      config,
      sessionId: 'sess_legacy',
    });
    const ids = movementIdsFromSettings(settings);
    expect(ids.length).toBe(5);
    expect(ids.some((id) => !ALL_S1_S3.has(id))).toBe(false);
  });

  it('plan skillIds reach session and constrain movements', () => {
    const bundle = beginObserverImitationSession({
      childId: 'child_skill_integrity',
      chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
      media,
      skillIds: [S2],
    });
    expect(bundle.session.skillIds).toEqual([S2]);
    expectOnlyFromPool(
      movementIdsFromSettings(bundle.settings),
      FINE
    );
  });
});
