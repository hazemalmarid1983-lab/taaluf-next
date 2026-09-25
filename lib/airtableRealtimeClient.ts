/**
 * يرسل لقطات التقييم والأهداف والجلسة إلى مسار الخادم.
 * المفاتيح لا تغادر الخادم.
 */

import {
  collectMergedAssessmentScores,
  isFourSourceGateOpen,
} from '@/lib/childRoom/gate';
import { loadGoalsLocal } from '@/lib/goalsStore';
import { getCriterionById } from '@/types/taalof';

type GameSessionPublish = {
  sessionKey: string;
  childId: string;
  gameCode: string;
  independence: number;
  mood?: string;
  accuracy?: number;
  levelReached?: number;
  totalTrials?: number;
  startedAt?: string;
  endedAt?: string;
  summary?: string;
};

function postRealtime(body: unknown, label: string, onOk: () => void) {
  void fetch('/api/airtable/realtime', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
    .then(async (response) => {
      if (!response.ok) {
        console.error(`[airtable] ${label} sync HTTP ${response.status}`);
        return;
      }
      console.log(`[airtable] ${label} sync HTTP ${response.status}`);
      onOk();
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'NETWORK';
      console.error(`[airtable] ${label} sync failed: ${message}`);
    });
}

/** بعد اكتمال المصادر الأربعة وحفظ سلسلة الأهداف. */
export function publishFourSourceSnapshot(childId: string) {
  if (typeof window === 'undefined' || !childId || !isFourSourceGateOpen(childId)) return;
  const scores = collectMergedAssessmentScores(childId);
  const goals = loadGoalsLocal(childId);
  if (scores.length === 0 && goals.length === 0) return;

  const fingerprint = `${goals.map((goal) => goal.id).join(',')}|${scores
    .map((row) => `${row.criterionId}:${row.score}`)
    .join(',')}`;
  const key = `taaluf.airtable.fourSource.${childId}`;
  if (localStorage.getItem(key) === fingerprint) return;

  postRealtime(
    {
      kind: 'four-source',
      childId,
      criteria: scores.map((row) => {
        const criterion = getCriterionById(row.criterionId);
        return {
          criterionId: row.criterionId,
          score: row.score,
          domain: criterion?.domain || '',
          name: criterion?.name || row.criterionId,
        };
      }),
      goals: goals.slice(0, 8).map((goal) => ({
        childId: goal.childId,
        criterionId: goal.criterionId,
        title: goal.title,
        domain: goal.domain,
        baseline: goal.baseline,
        target: goal.target,
        current: goal.current,
        status: goal.status,
        sessions: goal.sessions,
      })),
    },
    'four-source',
    () => localStorage.setItem(key, fingerprint)
  );
}

/** بعد حفظ تقرير الجلسة وتقييم المزاج. */
export function publishGameSession(input: GameSessionPublish) {
  if (typeof window === 'undefined' || !input.childId || !input.sessionKey) return;
  const key = `taaluf.airtable.game.${input.sessionKey}`;
  if (sessionStorage.getItem(key) === '1') return;
  postRealtime(
    { kind: 'game-session', ...input },
    'game-session',
    () => sessionStorage.setItem(key, '1')
  );
}
