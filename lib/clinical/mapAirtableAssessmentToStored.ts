import type { StoredAssessment } from '@/lib/assessmentHelpers';

export type AirtableAssessmentRecord = {
  id: string;
  createdTime?: string;
  fields: Record<string, unknown>;
};

function clampCriterionScore(raw: unknown): number {
  return Math.min(3, Math.max(0, Number(raw) || 0));
}

function parseJson(raw: unknown): unknown {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(String(raw));
  } catch {
    return null;
  }
}

export function assessmentDateToIso(date: unknown, fallback?: string): string {
  const s = String(date ?? '').trim();
  if (s) {
    const parsed = Date.parse(s.length === 10 ? `${s}T12:00:00.000Z` : s);
    if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  }
  if (fallback) {
    const parsed = Date.parse(fallback);
    if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  }
  return new Date().toISOString();
}

function assessmentDateMs(fields: Record<string, unknown>): number {
  const s = String(fields.AssessmentDate ?? '').trim();
  if (!s) return 0;
  const parsed = Date.parse(s.length === 10 ? `${s}T23:59:59.999Z` : s);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function createdTimeMs(record: AirtableAssessmentRecord): number {
  if (!record.createdTime) return 0;
  const parsed = Date.parse(record.createdTime);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** أحدث تقييم: AssessmentDate تنازليًا ثم createdTime — لا يعتمد على ترتيب API */
export function pickLatestAirtableAssessment(
  records: AirtableAssessmentRecord[]
): AirtableAssessmentRecord | null {
  if (!records.length) return null;
  return [...records].sort((a, b) => {
    const dateDiff = assessmentDateMs(b.fields) - assessmentDateMs(a.fields);
    if (dateDiff !== 0) return dateDiff;
    return createdTimeMs(b) - createdTimeMs(a);
  })[0];
}

export function parseDomainAveragesJson(
  raw: unknown
): Record<string, number> {
  const parsed = parseJson(raw);
  if (!parsed) return {};
  if (Array.isArray(parsed)) {
    const out: Record<string, number> = {};
    for (const row of parsed) {
      if (!row || typeof row !== 'object') continue;
      const item = row as Record<string, unknown>;
      const domain = String(item.domain ?? item.Domain ?? '').trim();
      if (!domain) continue;
      const pct = Number(item.percentage ?? item.Percentage ?? item.score);
      out[domain] = Number.isFinite(pct) ? pct : 0;
    }
    return out;
  }
  if (typeof parsed === 'object') {
    const out: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      const n = Number(value);
      out[key] = Number.isFinite(n) ? n : 0;
    }
    return out;
  }
  return {};
}

export function parseScoresFromScoresJson(
  raw: unknown
): StoredAssessment['scores'] {
  const parsed = parseJson(raw);
  if (!parsed) return [];

  if (Array.isArray(parsed)) {
    const out: StoredAssessment['scores'] = [];
    for (const row of parsed) {
      if (!row || typeof row !== 'object') continue;
      const item = row as Record<string, unknown>;
      const criterionId = String(item.criterionId ?? item.CriterionCode ?? '').trim();
      if (!criterionId) continue;
      out.push({
        criterionId,
        score: clampCriterionScore(item.score ?? item.Score),
        specialistNotes:
          typeof item.specialistNotes === 'string'
            ? item.specialistNotes
            : undefined,
        evidence: Array.isArray(item.evidence)
          ? item.evidence.map(String)
          : undefined,
      });
    }
    return out;
  }

  if (typeof parsed === 'object') {
    const out: StoredAssessment['scores'] = [];
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!value || typeof value !== 'object') continue;
      const item = value as Record<string, unknown>;
      const criterionId = String(
        item.criterionId ?? item.CriterionCode ?? key
      ).trim();
      const fused = item.fusedScore ?? item.score ?? item.Score;
      if (!criterionId || fused == null) continue;
      if (Number.isNaN(Number(fused))) continue;
      out.push({
        criterionId,
        score: clampCriterionScore(fused),
      });
    }
    return out;
  }

  return [];
}

export function resolveAssessmentPercentage(
  totalScore: number,
  maxScore: number
): number {
  if (maxScore === 100) return totalScore;
  if (maxScore > 0) return (totalScore / maxScore) * 100;
  return 0;
}

export function mapAirtableAssessmentToStored(
  record: AirtableAssessmentRecord,
  childId: string
): Omit<StoredAssessment, 'id' | 'savedAt'> & { id: string; savedAt: string } {
  const fields = record.fields;
  const totalScore = Number(fields.TotalScore ?? 0) || 0;
  const maxScore = Number(fields.MaxScore ?? 0) || 0;

  return {
    id: record.id,
    studentId: childId,
    savedAt: assessmentDateToIso(fields.AssessmentDate, record.createdTime),
    classification: String(fields.Classification ?? '').trim(),
    totalScore,
    maxScore,
    percentage: resolveAssessmentPercentage(totalScore, maxScore),
    domainAverages: parseDomainAveragesJson(fields.DomainAveragesJSON),
    scores: parseScoresFromScoresJson(fields.ScoresJSON),
    nextAssessmentDate: fields.NextAssessmentDate
      ? String(fields.NextAssessmentDate).slice(0, 10)
      : undefined,
  };
}
