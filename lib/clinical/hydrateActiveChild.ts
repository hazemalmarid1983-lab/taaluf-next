import {
  persistLocalAssessment,
  type StoredAssessment,
} from '@/lib/assessmentHelpers';
import { createTrackedGoalsFromScores } from '@/lib/goalsEngine';
import { loadGoalsLocal, saveGoalsLocal } from '@/lib/goalsStore';
import { saveActiveChild, type ParentChild } from '@/lib/parentJourney';
import {
  mapAirtableAssessmentToStored,
  pickLatestAirtableAssessment,
  type AirtableAssessmentRecord,
} from '@/lib/clinical/mapAirtableAssessmentToStored';

export type ClinicalHydrateResult = {
  activeSaved: boolean;
  assessmentHydrated: boolean;
  goalsCreated: boolean;
  error?: string;
};

function isAirtableRecordId(id: string): boolean {
  return id.startsWith('rec');
}

async function fetchAirtableAssessments(
  childId: string
): Promise<AirtableAssessmentRecord[]> {
  const res = await fetch(
    `/api/airtable/sync?kind=assessments&id=${encodeURIComponent(childId)}`
  );
  if (!res.ok) return [];
  const payload = (await res.json()) as {
    ok?: boolean;
    data?: AirtableAssessmentRecord[];
  };
  if (!payload.ok || !Array.isArray(payload.data)) return [];
  return payload.data;
}

function persistMappedAssessment(
  mapped: ReturnType<typeof mapAirtableAssessmentToStored>,
  studentName?: string
): StoredAssessment {
  return persistLocalAssessment({
    id: mapped.id,
    studentId: mapped.studentId,
    studentName,
    savedAt: mapped.savedAt,
    percentage: mapped.percentage,
    classification: mapped.classification,
    totalScore: mapped.totalScore,
    maxScore: mapped.maxScore,
    domainAverages: mapped.domainAverages,
    scores: mapped.scores,
    nextAssessmentDate: mapped.nextAssessmentDate,
  });
}

/**
 * نقطة دخول واحدة: تثبيت الطفل النشط + hydrate سريري من Airtable (تقييم + أهداف عند الحاجة).
 * لا يمنع اختيار الطفل عند فشل الشبكة أو غياب التقييم.
 */
export async function hydrateActiveChildClinicalSlice(
  child: ParentChild
): Promise<ClinicalHydrateResult> {
  const result: ClinicalHydrateResult = {
    activeSaved: false,
    assessmentHydrated: false,
    goalsCreated: false,
  };

  if (!child?.id) return result;

  try {
    saveActiveChild(child);
    result.activeSaved = true;
  } catch {
    return { ...result, error: 'ACTIVE_STUDENT_SAVE_FAILED' };
  }

  if (!isAirtableRecordId(child.id)) {
    return result;
  }

  try {
    const records = await fetchAirtableAssessments(child.id);
    const latest = pickLatestAirtableAssessment(records);
    if (!latest) return result;

    const mapped = mapAirtableAssessmentToStored(latest, child.id);
    const stored = persistMappedAssessment(mapped, child.name);
    result.assessmentHydrated = true;

    if (!stored.scores.length) return result;

    const existingGoals = loadGoalsLocal(child.id);
    if (existingGoals.length > 0) return result;

    const newGoals = createTrackedGoalsFromScores(child.id, stored.scores);
    if (newGoals.length) {
      saveGoalsLocal([...newGoals, ...loadGoalsLocal()]);
      result.goalsCreated = true;
    }
  } catch {
    return { ...result, error: 'CLINICAL_HYDRATE_FAILED' };
  }

  return result;
}
