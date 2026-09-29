/**
 * عميل السجل التربوي على الخادم. التخزين المحلي نسخة مؤقتة فقط؛
 * المرجع هو /api/goals و /api/children/link.
 */

import {
  isEmptySyncPlan,
  planGoalSync,
  replaceChildGoals,
  replaceGoalProbes,
} from '@/lib/clinicalSyncPlan';
import type { GeneralizationProbe } from '@/lib/generalizationIndex';
import {
  loadGeneralizationProbes,
  saveGeneralizationProbesLocal,
} from '@/lib/generalizationProbeStore';
import type { GoalSession, TrackedGoal } from '@/lib/goalsEngine';
import { loadGoalsLocal, saveGoalsLocal } from '@/lib/goalsStore';
import type { IoaInput, IoaSummary } from '@/lib/ioa';
import type { ParentStage } from '@/lib/parentRouteGuard';
import type { IoaRecord } from '@/types/clinical';

const SERVER_CHILD_ID = /^[A-Za-z0-9_-]{1,80}$/;

/** معرّفات مؤقتة لا تُرحّل (لا يوجد طفل مسجل بعد) */
export function isServerChildId(childId: string | null | undefined): childId is string {
  return Boolean(childId) && childId !== 'local' && childId !== 'child_local' && SERVER_CHILD_ID.test(childId!);
}

type ServerGoalsPayload = {
  goals: TrackedGoal[];
  generalizationProbes: GeneralizationProbe[];
};

export type GoalActionBody =
  | { action: 'session'; input: Record<string, unknown> }
  | { action: 'session_entry'; session: GoalSession }
  | { action: 'maintenance_probe'; input: Record<string, unknown> }
  | { action: 'generalization_probe'; input: Record<string, unknown> }
  | { action: 'fba_plan'; input: Record<string, unknown> }
  | { action: 'status'; status: TrackedGoal['status'] };

export type GoalActionResponse =
  | {
      ok: true;
      goal: TrackedGoal;
      generalizationProbes: GeneralizationProbe[];
      withdrawn: boolean;
      passed?: boolean;
      countsTowardIndex?: boolean;
    }
  | { ok: false; status: number; error: string; errors?: string[] };

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<{ status: number; body: T | null }> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const body = (await res.json().catch(() => null)) as T | null;
  return { status: res.status, body };
}

export async function linkChildOnServer(
  childId: string,
  childName?: string
): Promise<{ ok: boolean; parentStage?: ParentStage | null }> {
  const { status, body } = await jsonRequest<{ ok?: boolean; parentStage?: ParentStage | null }>(
    '/api/children/link',
    { method: 'POST', body: JSON.stringify({ childId, childName }) }
  );
  return { ok: status === 200 && Boolean(body?.ok), parentStage: body?.parentStage };
}

export async function fetchServerGoals(
  childId: string
): Promise<(ServerGoalsPayload & { linked: boolean }) | null> {
  const { status, body } = await jsonRequest<ServerGoalsPayload & { linked?: boolean }>(
    `/api/goals?childId=${encodeURIComponent(childId)}`
  );
  if (status !== 200 || !body) return null;
  return {
    linked: Boolean(body.linked),
    goals: Array.isArray(body.goals) ? body.goals : [],
    generalizationProbes: Array.isArray(body.generalizationProbes) ? body.generalizationProbes : [],
  };
}

export async function postGoalAction(
  childId: string,
  goalId: string,
  body: GoalActionBody
): Promise<GoalActionResponse> {
  try {
    const res = await jsonRequest<Record<string, unknown>>(`/api/goals/${encodeURIComponent(goalId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ childId, ...body }),
    });
    if (res.status === 200 && res.body?.ok) return res.body as GoalActionResponse;
    return {
      ok: false,
      status: res.status,
      error: String(res.body?.error || 'REQUEST_FAILED'),
      errors: Array.isArray(res.body?.errors) ? (res.body.errors as string[]) : undefined,
    };
  } catch {
    return { ok: false, status: 0, error: 'NETWORK' };
  }
}

function cacheServerRecord(childId: string, payload: ServerGoalsPayload) {
  saveGoalsLocal(replaceChildGoals(loadGoalsLocal(), childId, payload.goals));
  const goalIds = new Set(payload.goals.map((g) => g.id));
  saveGeneralizationProbesLocal(
    replaceGoalProbes(loadGeneralizationProbes(), goalIds, payload.generalizationProbes)
  );
}

/** يحدّث النسخة المحلية بهدف أعاده الخادم بعد إجراء */
export function cacheServerGoal(goal: TrackedGoal, probes?: GeneralizationProbe[]) {
  saveGoalsLocal([goal, ...loadGoalsLocal().filter((g) => g.id !== goal.id)]);
  if (probes) {
    saveGeneralizationProbesLocal(replaceGoalProbes(loadGeneralizationProbes(), new Set([goal.id]), probes.filter((p) => p.goal_id === goal.id)));
  }
}

export type ChildSyncResult =
  | ({ source: 'server'; parentStage?: ParentStage | null } & ServerGoalsPayload)
  | { source: 'local'; goals: TrackedGoal[]; generalizationProbes: GeneralizationProbe[] };

/**
 * يربط الطفل بالمستخدم، يرفع ما ينقص الخادم (ترحيل)، ثم يجعل نسخة الخادم هي المحلية.
 * عند تعذّر الخادم تُعاد النسخة المحلية كما هي.
 */
export async function syncChildClinicalRecord(
  childId: string,
  options: { childName?: string; link?: boolean } = {}
): Promise<ChildSyncResult> {
  const localGoals = loadGoalsLocal(childId);
  const localIds = new Set(localGoals.map((g) => g.id));
  const localProbes = loadGeneralizationProbes().filter((p) => localIds.has(p.goal_id));
  const local: ChildSyncResult = { source: 'local', goals: localGoals, generalizationProbes: localProbes };
  if (!isServerChildId(childId)) return local;

  try {
    let parentStage: ParentStage | null | undefined;
    if (options.link !== false) {
      const linked = await linkChildOnServer(childId, options.childName);
      parentStage = linked.parentStage;
    }
    let server = await fetchServerGoals(childId);
    if (!server?.linked) return local;

    const plan = planGoalSync(localGoals, server.goals, localProbes, server.generalizationProbes);
    if (!isEmptySyncPlan(plan)) {
      if (plan.goalsToImport.length || plan.probesToImport.length) {
        await jsonRequest('/api/goals', {
          method: 'POST',
          body: JSON.stringify({
            childId,
            goals: plan.goalsToImport,
            generalizationProbes: plan.probesToImport,
          }),
        });
      }
      for (const { goalId, session } of plan.sessionsToPush) {
        await postGoalAction(childId, goalId, { action: 'session_entry', session });
      }
      server = (await fetchServerGoals(childId)) ?? server;
    }

    cacheServerRecord(childId, server);
    return { source: 'server', parentStage, goals: server.goals, generalizationProbes: server.generalizationProbes };
  } catch {
    return local;
  }
}

export type IoaReviewResponse = { ok: true; records: IoaRecord[]; summary: IoaSummary } | { ok: false; status: number; error: string };

export async function fetchIoaReview(childId: string): Promise<IoaReviewResponse> {
  try {
    const res = await jsonRequest<{ records?: IoaRecord[]; summary?: IoaSummary; error?: string }>(
      `/api/children/${encodeURIComponent(childId)}/ioa`
    );
    if (res.status === 200 && res.body?.summary) {
      return { ok: true, records: res.body.records ?? [], summary: res.body.summary };
    }
    return { ok: false, status: res.status, error: String(res.body?.error || 'REQUEST_FAILED') };
  } catch {
    return { ok: false, status: 0, error: 'NETWORK' };
  }
}

export type IoaPostResponse =
  | { ok: true; record: IoaRecord }
  | { ok: false; status: number; error: string; errors?: string[] };

export async function postIoa(childId: string, input: IoaInput): Promise<IoaPostResponse> {
  try {
    const res = await jsonRequest<{ record?: IoaRecord; error?: string; errors?: string[] }>(
      `/api/children/${encodeURIComponent(childId)}/ioa`,
      { method: 'POST', body: JSON.stringify(input) }
    );
    if (res.status === 200 && res.body?.record) return { ok: true, record: res.body.record };
    return {
      ok: false,
      status: res.status,
      error: String(res.body?.error || 'REQUEST_FAILED'),
      errors: Array.isArray(res.body?.errors) ? res.body.errors : undefined,
    };
  } catch {
    return { ok: false, status: 0, error: 'NETWORK' };
  }
}

/** يرفع جلسة سُجلت محلياً (محرك التدريب) إلى الخادم دون انتظار */
export function pushSessionEntry(childId: string, goalId: string, session: GoalSession) {
  if (typeof window === 'undefined' || !isServerChildId(childId)) return;
  void postGoalAction(childId, goalId, { action: 'session_entry', session });
}
