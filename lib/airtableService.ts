/**
 * إدراج مباشر في Airtable من الخادم فقط.
 * المفاتيح تُقرأ من AIRTABLE_API_KEY و AIRTABLE_BASE_ID ولا تُطبع.
 */

import { airtableCreds, cleanEnv } from '@/lib/env';
import { TABLE_NAMES, isAirtableConfigured } from '@/lib/airtable';
import { assertSafePlatformDataAccess } from '@/lib/platformEnvironment';
import { postSessionMoodById } from '@/lib/training/postSessionMood';

function goalsTable() {
  return cleanEnv(process.env.AIRTABLE_GOALS_TABLE) || 'Goals';
}

function gameSessionsTable() {
  return cleanEnv(process.env.AIRTABLE_GAME_SESSIONS_TABLE) || 'GameSessions';
}

export type AirtableWriteResult = {
  ok: boolean;
  status: number;
  ids: string[];
  error?: string;
};

export type FourSourceCriterion = {
  criterionId: string;
  score: number;
  domain?: string;
  name?: string;
};

export type GoalSyncRow = {
  childId: string;
  criterionId: string;
  title: string;
  domain: string;
  baseline: number;
  target: number;
  current: number;
  status: string;
  sessions?: unknown[];
};

export type GameSessionSyncInput = {
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

function redact(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/pat[A-Za-z0-9]{10,}/g, '[redacted]')
    .replace(/AIRTABLE_API_KEY\s*[:=]\s*\S+/gi, 'AIRTABLE_API_KEY=[redacted]');
}

function missingConfig(): AirtableWriteResult {
  console.error(
    '[airtable] AIRTABLE_API_KEY or AIRTABLE_BASE_ID is missing — insert skipped'
  );
  return { ok: false, status: 0, ids: [], error: 'AIRTABLE_NOT_CONFIGURED' };
}

function logInsert(table: string, status: number, count: number, detail = '') {
  const suffix = detail ? ` ${redact(detail).slice(0, 400)}` : '';
  if (status === 200 || status === 201) {
    console.log(
      `[airtable] ${table} insert HTTP ${status} records=${count}`
    );
    return;
  }
  console.error(`[airtable] ${table} insert HTTP ${status}${suffix}`);
}

function formulaEscape(value: string): string {
  return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function listRecords(
  table: string,
  formula: string
): Promise<Array<{ id: string; fields: Record<string, unknown> }>> {
  const { apiKey, baseId } = airtableCreds();
  if (!apiKey || !baseId) return [];
  const query = `?filterByFormula=${encodeURIComponent(formula)}&maxRecords=20`;
  const url = `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}${query}`;
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    });
    const text = await response.text().catch(() => '');
    if (response.status !== 200) {
      console.error(
        `[airtable] ${table} list HTTP ${response.status} ${redact(text).slice(0, 400)}`
      );
      return [];
    }
    const parsed = JSON.parse(text) as {
      records?: Array<{ id: string; fields?: Record<string, unknown> }>;
    };
    return (parsed.records ?? []).map((row) => ({
      id: row.id,
      fields: row.fields ?? {},
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'NETWORK';
    console.error(`[airtable] ${table} list failed: ${redact(message)}`);
    return [];
  }
}

async function insertRecords(
  table: string,
  records: Array<Record<string, unknown>>
): Promise<AirtableWriteResult> {
  if (!records.length) {
    return { ok: false, status: 0, ids: [], error: 'EMPTY' };
  }
  try {
    assertSafePlatformDataAccess('airtable-insert');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PLATFORM_DATA_GUARD';
    console.error(`[airtable] ${table} insert blocked: ${message}`);
    return { ok: false, status: 0, ids: [], error: 'PLATFORM_DATA_GUARD' };
  }
  if (!isAirtableConfigured()) return missingConfig();

  const { apiKey, baseId } = airtableCreds();
  if (!apiKey || !baseId) return missingConfig();

  const ids: string[] = [];
  let lastStatus = 0;
  for (let index = 0; index < records.length; index += 10) {
    const chunk = records.slice(index, index + 10);
    const url = `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: chunk.map((fields) => ({ fields })),
        }),
        cache: 'no-store',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'NETWORK';
      console.error(`[airtable] ${table} insert failed: ${redact(message)}`);
      return { ok: false, status: 0, ids, error: 'NETWORK' };
    }

    lastStatus = response.status;
    const text = await response.text().catch(() => '');
    if (response.status !== 200 && response.status !== 201) {
      logInsert(table, response.status, chunk.length, text);
      return { ok: false, status: response.status, ids, error: `HTTP_${response.status}` };
    }
    logInsert(table, response.status, chunk.length);
    try {
      const parsed = JSON.parse(text) as { records?: Array<{ id?: string }> };
      for (const row of parsed.records ?? []) {
        if (row.id) ids.push(row.id);
      }
    } catch {
      console.error(`[airtable] ${table} insert HTTP ${response.status} unreadable body`);
    }
  }

  return { ok: ids.length > 0, status: lastStatus, ids };
}

export async function syncFourSourceAssessment(input: {
  childId: string;
  criteria: FourSourceCriterion[];
  classification?: string;
}): Promise<{ assessment: AirtableWriteResult; criteria: AirtableWriteResult }> {
  const rows = input.criteria.filter(
    (row) => row.criterionId && Number.isFinite(Number(row.score))
  );
  const total = rows.reduce((sum, row) => sum + Number(row.score), 0);
  const fields: Record<string, unknown> = {
    AssessmentDate: new Date().toISOString().slice(0, 10),
    TotalScore: Math.round(total),
    MaxScore: Math.max(1, rows.length * 3),
    Classification: input.classification || 'تقييم رباعي مكتمل',
    Status: 'مكتمل',
    ScoresJSON: JSON.stringify({
      childId: input.childId,
      source: 'four-source',
      criteria: rows,
    }),
  };
  if (input.childId.startsWith('rec')) {
    fields.Student = [input.childId];
  }

  const existingAssessment = (
    await listRecords(
      TABLE_NAMES.assessments,
      `AND(FIND('${formulaEscape(input.childId)}', {ScoresJSON}), FIND('four-source', {ScoresJSON}))`
    )
  )[0];
  const assessment = existingAssessment
    ? { ok: true, status: 200, ids: [existingAssessment.id] }
    : await insertRecords(TABLE_NAMES.assessments, [fields]);
  const assessmentId = assessment.ids[0];
  if (!assessment.ok || !assessmentId) {
    return {
      assessment,
      criteria: { ok: false, status: assessment.status, ids: [], error: 'ASSESSMENT_NOT_SAVED' },
    };
  }

  if (existingAssessment) {
    console.log(
      `[airtable] ${TABLE_NAMES.assessments} already stored HTTP 200 id=${existingAssessment.id}`
    );
  }

  const criteria = await insertRecords(
    TABLE_NAMES.criteria,
    rows.map((row) => ({
      Assessment: [assessmentId],
      Domain: row.domain || '',
      CriterionCode: row.criterionId,
      CriterionName: row.name || row.criterionId,
      Score: Number(row.score),
    }))
  );
  return { assessment, criteria };
}

export async function syncGoalChain(
  goals: GoalSyncRow[]
): Promise<AirtableWriteResult> {
  const rows = goals
    .filter((goal) => goal.childId && goal.criterionId && goal.title)
    .slice(0, 8);
  const childId = rows[0]?.childId;
  const existing = childId
    ? await listRecords(goalsTable(), `{childId}='${formulaEscape(childId)}'`)
    : [];
  const savedIds = new Set(
    existing.map((row) => String(row.fields.criterionId || ''))
  );
  const missing = rows.filter((goal) => !savedIds.has(goal.criterionId));
  if (missing.length === 0 && existing.length > 0) {
    console.log(`[airtable] ${goalsTable()} already stored HTTP 200 records=${existing.length}`);
    return { ok: true, status: 200, ids: existing.map((row) => row.id) };
  }
  return insertRecords(
    goalsTable(),
    missing.map((goal) => ({
      childId: goal.childId,
      criterionId: goal.criterionId,
      title: goal.title,
      domain: goal.domain || '',
      baseline: Number(goal.baseline) || 0,
      target: Number(goal.target) || 0,
      current: Number(goal.current) || 0,
      status: goal.status || 'active',
      sessions_json: JSON.stringify(goal.sessions || []),
    }))
  );
}

export async function syncGameSessionReport(
  input: GameSessionSyncInput
): Promise<{ session: AirtableWriteResult; report: AirtableWriteResult }> {
  const mood = postSessionMoodById(
    input.mood as 'excited' | 'calm' | 'tired' | 'anxious' | undefined
  );
  const moodLabel = mood?.labelAr || input.mood || '';
  const independence = Math.max(0, Math.min(100, Math.round(Number(input.independence) || 0)));
  const summary =
    input.summary ||
    `جلسة ${input.gameCode}: استقلال ${independence}%${moodLabel ? ` — مزاج ${moodLabel}` : ''}`;

  const session = await insertRecords(gameSessionsTable(), [
    {
      child_id: input.childId,
      game_code: input.gameCode,
      score: independence,
      level_reached: Number(input.levelReached) || 1,
      metrics_json: JSON.stringify({
        independence,
        mood: input.mood || '',
        moodLabel,
        accuracy: input.accuracy ?? null,
        childId: input.childId,
      }),
      trials_json: JSON.stringify({ totalTrials: Number(input.totalTrials) || 0 }),
      started_at: input.startedAt || new Date().toISOString(),
      ended_at: input.endedAt || new Date().toISOString(),
    },
  ]);

  const report = await insertRecords(TABLE_NAMES.reports, [
    {
      Summary: summary,
      CreatedAt: new Date().toISOString(),
    },
  ]);

  return { session, report };
}
