import { BREATHING_PHASES, BREATH_RESTING_SCALE, breathScaleAt } from '@/lib/regulationZones';
import { ANIMAL_SOUND_IDS, animalSoundUrl } from '@/lib/sensoryHubAudio';
import {
  burstVx,
  FISH_MAX_BURST,
  FISH_MAX_CRUISE,
  FISH_MIN_CRUISE,
  randomCruise,
  relaxVx,
} from '@/lib/sensoryFish';
import {
  createSwell,
  stepBoat,
  stepSwells,
  swellHeightAt,
  waterSurfaceY,
} from '@/lib/sensoryWaves';
import { resolveCardRelease } from '@/lib/sensoryMatching';
import fs from 'fs';
import path from 'path';

describe('breathing ball follows the spoken phase gradually', () => {
  const exhaleIndex = BREATHING_PHASES.findIndex((p) => p.id === 'exhale');
  const exhale = BREATHING_PHASES[exhaleIndex];

  it('exhale starts at full size and ends at resting size', () => {
    expect(breathScaleAt(exhaleIndex, 0)).toBeCloseTo(1, 5);
    expect(breathScaleAt(exhaleIndex, exhale.seconds)).toBeCloseTo(BREATH_RESTING_SCALE, 5);
  });

  it('exhale shrinks monotonically in small steps (no jump)', () => {
    let prev = breathScaleAt(exhaleIndex, 0);
    for (let t = 0.1; t <= exhale.seconds; t += 0.1) {
      const next = breathScaleAt(exhaleIndex, t);
      expect(next).toBeLessThanOrEqual(prev + 1e-9);
      expect(prev - next).toBeLessThan(0.02);
      prev = next;
    }
  });

  it('inhale grows from resting to full', () => {
    expect(breathScaleAt(0, 0)).toBeCloseTo(BREATH_RESTING_SCALE, 5);
    expect(breathScaleAt(0, BREATHING_PHASES[0].seconds)).toBeCloseTo(1, 5);
  });
});

describe('natural animal recordings', () => {
  it('every animal has a bundled recording', () => {
    for (const id of ANIMAL_SOUND_IDS) {
      const url = animalSoundUrl(id);
      expect(url).toBe(`/sounds/animals/${id}.mp3`);
      expect(fs.existsSync(path.join(process.cwd(), 'public', url))).toBe(true);
    }
  });

  it('rain ambience recording exists', () => {
    expect(fs.existsSync(path.join(process.cwd(), 'public/sounds/ambient/rain.mp3'))).toBe(true);
  });
});

describe('fish speed stays calm (no runaway acceleration)', () => {
  it('cruise speed is within the calm range', () => {
    expect(randomCruise(() => 0)).toBe(FISH_MIN_CRUISE);
    expect(randomCruise(() => 1)).toBe(FISH_MAX_CRUISE);
  });

  it('repeated darts never exceed the burst cap and relax back to cruise', () => {
    const cruise = FISH_MAX_CRUISE;
    let vx = cruise;
    for (let dart = 0; dart < 20; dart += 1) {
      vx = burstVx(vx, cruise);
      expect(Math.abs(vx)).toBeLessThanOrEqual(FISH_MAX_BURST);
      for (let frame = 0; frame < 200; frame += 1) vx = relaxVx(vx, cruise);
    }
    expect(vx).toBeCloseTo(cruise, 1);
  });

  it('a tap burst flees in the given direction', () => {
    expect(burstVx(1, 1, -1)).toBeLessThan(0);
    expect(relaxVx(-3, 1)).toBeLessThan(0);
  });
});

describe('waves react to touch', () => {
  it('a touch raises the water under the finger, then spreads and fades', () => {
    let swells = [createSwell(300, 1)];
    const h = 800;
    const calm = waterSurfaceY(300, h, 0, 0, []);
    expect(waterSurfaceY(300, h, 0, 0, swells)).toBeLessThan(calm - 20);
    for (let i = 0; i < 40; i += 1) swells = stepSwells(swells, 2000);
    expect(swellHeightAt(swells, 300 + swells[0].radius)).toBeGreaterThan(swellHeightAt(swells, 300));
    for (let i = 0; i < 600; i += 1) swells = stepSwells(swells, 2000);
    expect(swells).toHaveLength(0);
  });

  it('the boat moves smoothly toward the target', () => {
    let boat = { x: 100, vx: 0 };
    let maxStep = 0;
    for (let i = 0; i < 400; i += 1) {
      const next = stepBoat(boat, 500);
      maxStep = Math.max(maxStep, Math.abs(next.x - boat.x));
      boat = next;
    }
    expect(boat.x).toBeCloseTo(500, 0);
    expect(maxStep).toBeLessThan(40);
  });
});

describe('matching card release', () => {
  it('a tap is an attempt', () => {
    expect(resolveCardRelease({ dx: 3, dy: 2, overTarget: false })).toBe('attempt');
  });
  it('dragging onto the target is an attempt', () => {
    expect(resolveCardRelease({ dx: 0, dy: -240, overTarget: true })).toBe('attempt');
  });
  it('dragging and dropping elsewhere cancels without penalty', () => {
    expect(resolveCardRelease({ dx: 80, dy: -40, overTarget: false })).toBe('cancel');
  });
});
