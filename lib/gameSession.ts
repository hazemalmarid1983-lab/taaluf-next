export type GameSessionPayload = {
  childId: string;
  gameCode: string;
  score: number;
  levelReached: number;
  metrics: Record<string, unknown>;
  trials: unknown[];
  startedAt: string;
  endedAt: string;
};

export async function saveGameSession(payload: GameSessionPayload) {
  const res = await fetch('/api/games/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || 'تعذر حفظ جلسة اللعبة');
  }

  try {
    const key = 'taaluf.gameSessions.v1';
    const prev = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(
      key,
      JSON.stringify([{ ...payload, id: data.id }, ...prev].slice(0, 40))
    );
  } catch {
    /* ignore */
  }

  return data;
}

export function starsFromRate(rate: number): number {
  if (rate >= 0.8) return 3;
  if (rate >= 0.5) return 2;
  return 1;
}
