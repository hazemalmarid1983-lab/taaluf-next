/**
 * سرعة أسماك البركة: لكل سمكة سرعة سباحة هادئة ثابتة، والاندفاع (تلقائي أو عند اللمس)
 * مؤقت ومحدود ثم تعود السمكة تدريجياً إلى سرعتها الهادئة — فلا تتراكم السرعة مع الوقت.
 */

export const FISH_MIN_CRUISE = 0.55;
export const FISH_MAX_CRUISE = 1.45;
export const FISH_MAX_BURST = 3.4;
export const FISH_RELAX = 0.03;

export function randomCruise(rand: () => number = Math.random): number {
  return FISH_MIN_CRUISE + rand() * (FISH_MAX_CRUISE - FISH_MIN_CRUISE);
}

function direction(vx: number): 1 | -1 {
  return vx >= 0 ? 1 : -1;
}

/** اندفاع قصير في اتجاه dir (أو اتجاه السباحة الحالي) بسرعة محدودة */
export function burstVx(vx: number, cruise: number, dir?: 1 | -1): number {
  const d = dir ?? direction(vx);
  return d * Math.min(FISH_MAX_BURST, cruise * 2.2);
}

/** خطوة إطار: تقترب السرعة تدريجياً من سرعة السباحة الهادئة في نفس الاتجاه */
export function relaxVx(vx: number, cruise: number): number {
  const target = direction(vx) * cruise;
  const next = vx + (target - vx) * FISH_RELAX;
  return Math.max(-FISH_MAX_BURST, Math.min(FISH_MAX_BURST, next));
}

/** اصطياد السمكة: تختفي تدريجياً ثم تغيب لفترة وتعود من طرف الشاشة */
export const FISH_CATCH_FADE_FRAMES = 22;
export const FISH_RESPAWN_FRAMES = 150;

/** 0 = سمكة حرة، وأي قيمة موجبة = عدد الإطارات منذ اصطيادها */
export type FishCatchState = { caughtFrames: number };

export function isFishCatchable(fish: FishCatchState): boolean {
  return fish.caughtFrames === 0;
}

/** حجم السمكة النسبي أثناء الاختفاء (1 → 0)، و0 طوال فترة الغياب */
export function fishCatchScale(caughtFrames: number): number {
  if (caughtFrames <= 0) return 1;
  if (caughtFrames >= FISH_CATCH_FADE_FRAMES) return 0;
  return 1 - caughtFrames / FISH_CATCH_FADE_FRAMES;
}

export function shouldRespawnFish(caughtFrames: number): boolean {
  return caughtFrames >= FISH_CATCH_FADE_FRAMES + FISH_RESPAWN_FRAMES;
}

/** موضع واتجاه العودة: من خارج الحافة اليسرى أو اليمنى وتسبح للداخل */
export function fishRespawnPoint(
  width: number,
  height: number,
  rand: () => number = Math.random,
): { x: number; y: number; dir: 1 | -1 } {
  const fromLeft = rand() < 0.5;
  return {
    x: fromLeft ? -30 : width + 30,
    y: height * (0.25 + rand() * 0.55),
    dir: fromLeft ? 1 : -1,
  };
}
