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
