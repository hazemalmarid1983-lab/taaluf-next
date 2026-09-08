import { loadAttentionFocusChapter } from '../lib/training/loadChapter';

import {
  requireTrainingMedia,
  resolveMediaRuntimeConfig,
} from '../lib/training/engine';

import {
  buildFollowStarPathOrder,
  childFacingStars,
  deriveFollowStarPathOrderSeed,
  getFollowStarPath,
  getFollowStarPathIndex,
  getFollowStarTargetPoint,
  hitRadiusPixels,
  isFollowStarHit,
  resolveFollowStarAssistanceStage,
  resolveFollowStarRuntimeSettings,
  resolveFollowStarTrialOutcome,
} from '../lib/training/followStarEngine';

describe('follow-star engine', () => {
  const media = requireTrainingMedia(
    loadAttentionFocusChapter(),
    'follow-star'
  );

  const runtimeConfig = resolveMediaRuntimeConfig(media);

  const settings = resolveFollowStarRuntimeSettings(runtimeConfig);

  it('reads runtime settings from media config', () => {
    expect(settings.trialCount).toBe(10);
    expect(settings.difficulty).toBe(1);
    expect(settings.readyWindowMs).toBe(3000);
    expect(settings.prompting).toBe(true);
    expect(settings.reinforcement).toBe(true);
    expect(settings.hitRadiusPercent).toBe(14);
  });

  it('builds visual paths per trial with shuffled order', () => {
    const seed = deriveFollowStarPathOrderSeed('session-test-1');
    const path = getFollowStarPath(1, seed);

    expect(path.length).toBeGreaterThanOrEqual(2);
    expect(getFollowStarTargetPoint(path)).toEqual(path[path.length - 1]);
  });

  it('avoids immediate consecutive path repetition within a session order', () => {
    const seed = deriveFollowStarPathOrderSeed('session-shuffle-a');
    for (let trial = 1; trial < 10; trial += 1) {
      const current = getFollowStarPathIndex(trial, seed);
      const next = getFollowStarPathIndex(trial + 1, seed);
      expect(current).not.toBe(next);
    }
  });

  it('varies path order across session seeds', () => {
    const orderA = buildFollowStarPathOrder(deriveFollowStarPathOrderSeed('child-a'));
    const orderB = buildFollowStarPathOrder(deriveFollowStarPathOrderSeed('child-b'));
    expect(orderA).not.toEqual(orderB);
  });

  it('detects hits within radius on a square arena', () => {
    const target = { x: 50, y: 40 };
    const arena = { widthPx: 100, heightPx: 100 };
    const radius = 14;

    expect(isFollowStarHit({ x: 50, y: 40 }, target, radius, arena)).toBe(true);
    expect(isFollowStarHit({ x: 64, y: 40 }, target, radius, arena)).toBe(true);
    expect(isFollowStarHit({ x: 64.01, y: 40 }, target, radius, arena)).toBe(
      false
    );
  });

  it('uses pixel distance on wide landscape arenas', () => {
    const target = { x: 50, y: 50 };
    const arena = { widthPx: 200, heightPx: 100 };
    const radius = 14;

    expect(hitRadiusPixels(radius, arena)).toBe(14);
    expect(isFollowStarHit({ x: 50, y: 50 }, target, radius, arena)).toBe(true);
    expect(isFollowStarHit({ x: 64, y: 50 }, target, radius, arena)).toBe(false);

    const edgeTapX = 50 + (14 / arena.widthPx) * 100;
    expect(
      isFollowStarHit({ x: edgeTapX, y: 50 }, target, radius, arena)
    ).toBe(true);
  });

  it('uses pixel distance on tall portrait arenas', () => {
    const target = { x: 50, y: 50 };
    const arena = { widthPx: 100, heightPx: 220 };
    const radius = 14;

    expect(hitRadiusPixels(radius, arena)).toBe(14);
    expect(isFollowStarHit({ x: 50, y: 64 }, target, radius, arena)).toBe(false);

    const edgeTapY = 50 + (14 / arena.heightPx) * 100;
    expect(
      isFollowStarHit({ x: 50, y: edgeTapY }, target, radius, arena)
    ).toBe(true);
    expect(
      isFollowStarHit({ x: 50, y: edgeTapY + 0.01 }, target, radius, arena)
    ).toBe(false);
  });

  it('rejects taps clearly outside the hit radius', () => {
    const target = { x: 30, y: 70 };
    const arena = { widthPx: 360, heightPx: 640 };

    expect(isFollowStarHit({ x: 80, y: 20 }, target, 14, arena)).toBe(false);
  });

  it('records responseTimeMs as movement + ready elapsed (full task, not reaction-only)', () => {
    const outcome = resolveFollowStarTrialOutcome({
      promptingEnabled: true,
      tapped: true,
      hit: true,
      elapsedReadyMs: 700,
      movementMs: 1200,
    });

    expect(outcome.responseTimeMs).toBe(1900);
  });

  it('assigns prompt levels from assistance delivered, not latency alone', () => {
    expect(
      resolveFollowStarTrialOutcome({
        promptingEnabled: true,
        tapped: true,
        hit: true,
        elapsedReadyMs: 700,
        movementMs: 1200,
      }).promptLevel
    ).toBe('independent');

    expect(
      resolveFollowStarTrialOutcome({
        promptingEnabled: true,
        tapped: true,
        hit: true,
        elapsedReadyMs: 1800,
        movementMs: 1000,
      }).promptLevel
    ).toBe('visual_hint');

    expect(
      resolveFollowStarTrialOutcome({
        promptingEnabled: true,
        tapped: false,
        hit: false,
        elapsedReadyMs: 3000,
        movementMs: 1000,
      }).promptLevel
    ).toBe('no_response');
  });

  it('does not treat keyboard activation as automatic hit in outcome logic', () => {
    const miss = resolveFollowStarTrialOutcome({
      promptingEnabled: true,
      tapped: true,
      hit: false,
      elapsedReadyMs: 500,
      movementMs: 1000,
    });

    expect(miss.correct).toBe(false);
  });

  it('escalates assistance stage over time when prompting is enabled', () => {
    expect(resolveFollowStarAssistanceStage(900, true)).toBe('none');
    expect(resolveFollowStarAssistanceStage(1500, true)).toBe('visual_hint');
  });

  it('maps accuracy to child-facing stars', () => {
    expect(childFacingStars(90)).toBe(3);
    expect(childFacingStars(60)).toBe(2);
    expect(childFacingStars(20)).toBe(1);
  });
});
