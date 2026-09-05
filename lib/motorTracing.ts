/**
 * مسارات ومقاييس محرك التتبع البصري الحركي — منطق خالص قابل للاختبار.
 */

export type TracingDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type TracingPathId =
  | 'line_horizontal'
  | 'line_vertical'
  | 'wave_horizontal'
  | 'curve_arc'
  | 'shape_circle'
  | 'shape_square'
  | 'shape_triangle'
  | 'number_1'
  | 'number_2';

export interface TracingPoint {
  x: number;
  y: number;
  t: number;
}

export interface TracingPath {
  id: TracingPathId;
  difficulty: TracingDifficulty;
  labelAr: string;
  labelEn: string;
  /** مسار SVG داخل viewBox 400×300 */
  pathD: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  /** نقاط مرجعية مُسبقة التوليد على طول المسار للتقييم دون DOM */
  samples: { x: number; y: number }[];
}

export interface TracingScore {
  accuracy: number;
  smoothness: number;
  coverage: number;
  completed: boolean;
}

export const TRACING_VIEWBOX = { width: 400, height: 300 };

export const TRACING_TOLERANCE = 28;

export const TRACING_PATHS: TracingPath[] = [
  {
    id: 'line_horizontal',
    difficulty: 'beginner',
    labelAr: 'خط أفقي',
    labelEn: 'Horizontal line',
    pathD: 'M 60 150 L 340 150',
    start: { x: 60, y: 150 },
    end: { x: 340, y: 150 },
    samples: lineSamples(60, 150, 340, 150, 24),
  },
  {
    id: 'line_vertical',
    difficulty: 'beginner',
    labelAr: 'خط عمودي',
    labelEn: 'Vertical line',
    pathD: 'M 200 50 L 200 250',
    start: { x: 200, y: 50 },
    end: { x: 200, y: 250 },
    samples: lineSamples(200, 50, 200, 250, 24),
  },
  {
    id: 'wave_horizontal',
    difficulty: 'intermediate',
    labelAr: 'موجة أفقية',
    labelEn: 'Wavy line',
    pathD: 'M 50 150 Q 100 90 150 150 T 250 150 T 350 150',
    start: { x: 50, y: 150 },
    end: { x: 350, y: 150 },
    samples: waveSamples(),
  },
  {
    id: 'curve_arc',
    difficulty: 'intermediate',
    labelAr: 'منحنى',
    labelEn: 'Curved arc',
    pathD: 'M 50 220 Q 200 40 350 220',
    start: { x: 50, y: 220 },
    end: { x: 350, y: 220 },
    samples: quadBezierSamples(50, 220, 200, 40, 350, 220, 28),
  },
  {
    id: 'shape_circle',
    difficulty: 'advanced',
    labelAr: 'دائرة',
    labelEn: 'Circle',
    pathD: 'M 200 90 A 60 60 0 1 1 199.5 90',
    start: { x: 200, y: 90 },
    end: { x: 200, y: 90 },
    samples: circleSamples(200, 150, 60, 32),
  },
  {
    id: 'shape_square',
    difficulty: 'advanced',
    labelAr: 'مربع',
    labelEn: 'Square',
    pathD: 'M 110 90 L 290 90 L 290 210 L 110 210 Z',
    start: { x: 110, y: 90 },
    end: { x: 110, y: 90 },
    samples: [
      ...lineSamples(110, 90, 290, 90, 8),
      ...lineSamples(290, 90, 290, 210, 8),
      ...lineSamples(290, 210, 110, 210, 8),
      ...lineSamples(110, 210, 110, 90, 8),
    ],
  },
  {
    id: 'shape_triangle',
    difficulty: 'advanced',
    labelAr: 'مثلث',
    labelEn: 'Triangle',
    pathD: 'M 200 70 L 320 230 L 80 230 Z',
    start: { x: 200, y: 70 },
    end: { x: 200, y: 70 },
    samples: [
      ...lineSamples(200, 70, 320, 230, 10),
      ...lineSamples(320, 230, 80, 230, 10),
      ...lineSamples(80, 230, 200, 70, 10),
    ],
  },
  {
    id: 'number_1',
    difficulty: 'advanced',
    labelAr: 'رقم ١',
    labelEn: 'Number 1',
    pathD: 'M 220 70 L 200 90 L 200 230',
    start: { x: 220, y: 70 },
    end: { x: 200, y: 230 },
    samples: [
      ...lineSamples(220, 70, 200, 90, 6),
      ...lineSamples(200, 90, 200, 230, 14),
    ],
  },
  {
    id: 'number_2',
    difficulty: 'advanced',
    labelAr: 'رقم ٢',
    labelEn: 'Number 2',
    pathD: 'M 120 110 Q 120 70 200 70 Q 280 70 280 120 Q 280 170 120 230 L 280 230',
    start: { x: 120, y: 110 },
    end: { x: 280, y: 230 },
    samples: numberTwoSamples(),
  },
];

export function tracingPathById(id: TracingPathId): TracingPath | undefined {
  return TRACING_PATHS.find((p) => p.id === id);
}

export function pathsByDifficulty(difficulty: TracingDifficulty): TracingPath[] {
  return TRACING_PATHS.filter((p) => p.difficulty === difficulty);
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function nearestDistance(
  point: { x: number; y: number },
  samples: { x: number; y: number }[]
) {
  let min = Infinity;
  for (const sample of samples) {
    const d = distance(point, sample);
    if (d < min) min = d;
  }
  return min;
}

/** زاوية بين ثلاث نقاط متتالية (بالرadian) */
function turnAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
) {
  const v1x = b.x - a.x;
  const v1y = b.y - a.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  const dot = v1x * v2x + v1y * v2y;
  const m1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const m2 = Math.sqrt(v2x * v2x + v2y * v2y);
  if (m1 < 0.001 || m2 < 0.001) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (m1 * m2)));
  return Math.acos(cos);
}

export function scoreTracing(
  userPoints: TracingPoint[],
  path: TracingPath,
  tolerance = TRACING_TOLERANCE
): TracingScore {
  if (userPoints.length < 4) {
    return { accuracy: 0, smoothness: 0, coverage: 0, completed: false };
  }

  const accuracies = userPoints.map((p) => nearestDistance(p, path.samples));
  const within = accuracies.filter((d) => d <= tolerance).length;
  const accuracy = Math.round((within / userPoints.length) * 100);

  const angles: number[] = [];
  for (let i = 2; i < userPoints.length; i += 1) {
    angles.push(turnAngle(userPoints[i - 2], userPoints[i - 1], userPoints[i]));
  }
  const avgAngle =
    angles.length > 0
      ? angles.reduce((sum, a) => sum + a, 0) / angles.length
      : 0;
  // زوايا أصغر = حركة أنعم؛ نعكس إلى 0–100
  const smoothness = Math.round(Math.max(0, Math.min(100, 100 - avgAngle * 80)));

  let covered = 0;
  for (const sample of path.samples) {
    if (nearestDistance(sample, userPoints) <= tolerance) covered += 1;
  }
  const coverage = Math.round((covered / path.samples.length) * 100);

  const last = userPoints[userPoints.length - 1];
  const reachedEnd = distance(last, path.end) <= tolerance * 1.4;
  const completed =
    reachedEnd && coverage >= 55 && accuracy >= 45 && userPoints.length >= 8;

  return { accuracy, smoothness, coverage, completed };
}

export function completionPhrase(score: TracingScore, isAr: boolean) {
  if (!score.completed) {
    return isAr
      ? 'حاول مجدداً، تابع على الخط'
      : 'Try again — stay on the path';
  }
  if (score.accuracy >= 80 && score.smoothness >= 70) {
    return isAr ? 'رائع! وصلت للنهاية' : 'Great! You reached the end';
  }
  return isAr ? 'أحسنت! وصلت للنهاية' : 'Well done! You reached the end';
}

function lineSamples(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  count: number
) {
  const samples: { x: number; y: number }[] = [];
  for (let i = 0; i <= count; i += 1) {
    const t = i / count;
    samples.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
  }
  return samples;
}

function quadBezierSamples(
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  count: number
) {
  const samples: { x: number; y: number }[] = [];
  for (let i = 0; i <= count; i += 1) {
    const t = i / count;
    const u = 1 - t;
    samples.push({
      x: u * u * x0 + 2 * u * t * cx + t * t * x1,
      y: u * u * y0 + 2 * u * t * cy + t * t * y1,
    });
  }
  return samples;
}

function waveSamples() {
  const samples: { x: number; y: number }[] = [];
  for (let x = 50; x <= 350; x += 12) {
    const t = (x - 50) / 300;
    const y = 150 + Math.sin(t * Math.PI * 3) * 35;
    samples.push({ x, y });
  }
  return samples;
}

function circleSamples(cx: number, cy: number, r: number, count: number) {
  const samples: { x: number; y: number }[] = [];
  for (let i = 0; i <= count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    samples.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }
  return samples;
}

function numberTwoSamples() {
  const top = quadBezierSamples(120, 110, 120, 70, 200, 70, 8);
  const arc = quadBezierSamples(200, 70, 280, 70, 280, 120, 8);
  const mid = quadBezierSamples(280, 120, 280, 170, 120, 230, 10);
  const base = lineSamples(120, 230, 280, 230, 8);
  return [...top, ...arc, ...mid, ...base];
}
