import {
  TRACING_PATHS,
  completionPhrase,
  pathsByDifficulty,
  scoreTracing,
  tracingPathById,
  type TracingPoint,
} from '../lib/motorTracing';

describe('motor tracing paths', () => {
  it('exposes beginner, intermediate and advanced paths', () => {
    expect(pathsByDifficulty('beginner').length).toBeGreaterThanOrEqual(2);
    expect(pathsByDifficulty('intermediate').length).toBeGreaterThanOrEqual(2);
    expect(pathsByDifficulty('advanced').length).toBeGreaterThanOrEqual(3);
  });

  it('resolves paths by id', () => {
    const path = tracingPathById('line_horizontal');
    expect(path?.start).toEqual({ x: 60, y: 150 });
    expect(path?.end).toEqual({ x: 340, y: 150 });
    expect(tracingPathById('missing' as 'line_horizontal')).toBeUndefined();
  });

  it('every path has samples and bilingual labels', () => {
    TRACING_PATHS.forEach((path) => {
      expect(path.samples.length).toBeGreaterThan(8);
      expect(path.labelAr.trim()).not.toBe('');
      expect(path.labelEn.trim()).not.toBe('');
      expect(path.pathD).toMatch(/^M /);
    });
  });
});

describe('scoreTracing', () => {
  const path = tracingPathById('line_horizontal')!;

  function strokeAlongPath(): TracingPoint[] {
    return path.samples.map((sample, index) => ({
      x: sample.x,
      y: sample.y,
      t: index * 40,
    }));
  }

  it('scores a clean horizontal trace as completed', () => {
    const score = scoreTracing(strokeAlongPath(), path);
    expect(score.accuracy).toBeGreaterThanOrEqual(80);
    expect(score.coverage).toBeGreaterThanOrEqual(55);
    expect(score.completed).toBe(true);
  });

  it('rejects a stroke that is too short', () => {
    const score = scoreTracing(
      [{ x: 60, y: 150, t: 0 }, { x: 80, y: 150, t: 40 }],
      path
    );
    expect(score.completed).toBe(false);
    expect(score.accuracy).toBe(0);
  });

  it('returns encouraging completion phrases', () => {
    const good = scoreTracing(strokeAlongPath(), path);
    expect(completionPhrase(good, true)).toBe('رائع! وصلت للنهاية');
    expect(completionPhrase({ ...good, completed: false }, true)).toContain(
      'حاول'
    );
  });
});
