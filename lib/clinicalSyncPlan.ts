/**
 * مزامنة نسخة المتصفح مع السجل السريري على الخادم (منطق نقي).
 * الخادم هو المرجع: ما لديه يحلّ محل النسخة المحلية، وما ينقصه يُرفع إليه.
 */

import type { GeneralizationProbe } from '@/lib/generalizationIndex';
import type { GoalSession, TrackedGoal } from '@/lib/goalsEngine';

export type GoalSyncPlan = {
  /** أهداف محلية غير موجودة على الخادم */
  goalsToImport: TrackedGoal[];
  /** مجسات تعميم محلية لأهداف الطفل غير موجودة على الخادم */
  probesToImport: GeneralizationProbe[];
  /** جلسات سُجلت محلياً (مثل محرك التدريب) على أهداف موجودة على الخادم */
  sessionsToPush: Array<{ goalId: string; session: GoalSession }>;
};

export function planGoalSync(
  localGoals: TrackedGoal[],
  serverGoals: TrackedGoal[],
  localProbes: GeneralizationProbe[],
  serverProbes: GeneralizationProbe[]
): GoalSyncPlan {
  const serverById = new Map(serverGoals.map((g) => [g.id, g]));
  const goalsToImport = localGoals.filter((g) => !serverById.has(g.id));
  const childGoalIds = new Set([...serverById.keys(), ...goalsToImport.map((g) => g.id)]);
  const knownProbes = new Set(serverProbes.map((p) => p.probe_id));
  const probesToImport = localProbes.filter(
    (p) => childGoalIds.has(p.goal_id) && !knownProbes.has(p.probe_id)
  );
  const sessionsToPush = localGoals.flatMap((local) => {
    const server = serverById.get(local.id);
    if (!server) return [];
    const seen = new Set((server.sessions || []).map((s) => s.at));
    return (local.sessions || [])
      .filter((s) => !seen.has(s.at))
      .map((session) => ({ goalId: local.id, session }));
  });
  return { goalsToImport, probesToImport, sessionsToPush };
}

export function isEmptySyncPlan(plan: GoalSyncPlan): boolean {
  return !plan.goalsToImport.length && !plan.probesToImport.length && !plan.sessionsToPush.length;
}

/** نسخة التخزين المحلي بعد المزامنة: أهداف الطفل من الخادم + أهداف الأطفال الآخرين كما هي */
export function replaceChildGoals(
  allLocal: TrackedGoal[],
  childId: string,
  serverGoals: TrackedGoal[]
): TrackedGoal[] {
  return [...serverGoals, ...allLocal.filter((g) => g.childId !== childId)];
}

export function replaceGoalProbes(
  allLocal: GeneralizationProbe[],
  goalIds: Set<string>,
  serverProbes: GeneralizationProbe[]
): GeneralizationProbe[] {
  return [...allLocal.filter((p) => !goalIds.has(p.goal_id)), ...serverProbes];
}
