/**
 * فيزياء غرفة الموجة والقارب — دوال نقية قابلة للاختبار.
 * اللمس يطلق «موجة» تنتشر يميناً ويساراً وتخفت، والقارب يطفو على سطح الماء ويميل مع انحداره.
 */

export type Swell = { x: number; radius: number; amp: number };

export const SWELL_SPEED = 3.2;
export const SWELL_DECAY = 0.985;
export const SWELL_WIDTH = 70;
export const SWELL_MAX_AMP = 46;

export function createSwell(x: number, strength = 1): Swell {
  return { x, radius: 0, amp: SWELL_MAX_AMP * Math.max(0.2, Math.min(1, strength)) };
}

/** يحرّك الموجات خطوة زمنية ويحذف الخافتة منها */
export function stepSwells(swells: Swell[], maxRadius: number): Swell[] {
  return swells
    .map((s) => ({ ...s, radius: s.radius + SWELL_SPEED, amp: s.amp * SWELL_DECAY }))
    .filter((s) => s.amp > 0.6 && s.radius < maxRadius);
}

/** ارتفاع الموجات المضافة عند x (موجب = أعلى من السطح) */
export function swellHeightAt(swells: Swell[], x: number): number {
  let total = 0;
  for (const s of swells) {
    const d = Math.abs(x - s.x) - s.radius;
    total += s.amp * Math.exp(-((d / SWELL_WIDTH) ** 2));
  }
  return total;
}

/** ارتفاع السطح (إحداثي y على الشاشة) لطبقة الماء layer عند x */
export function waterSurfaceY(
  x: number,
  h: number,
  phase: number,
  layer: number,
  swells: Swell[]
): number {
  const base = h * (0.55 + layer * 0.08);
  const ambient = Math.sin(x * 0.008 + phase + layer) * (18 - layer * 4);
  return base + ambient - swellHeightAt(swells, x) * (1 - layer * 0.3);
}

export type BoatState = { x: number; vx: number };

/** نابض ناعم يقرّب القارب من الهدف دون قفزات */
export function stepBoat(boat: BoatState, targetX: number): BoatState {
  const accel = (targetX - boat.x) * 0.012;
  const vx = (boat.vx + accel) * 0.9;
  return { x: boat.x + vx, vx };
}
