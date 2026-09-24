import { readHubJsonFile, writeHubJsonFile } from '@/lib/hubPersistence';
import {
  ASSESSMENT_COOLDOWN_FILE,
  parseCooldownFile,
  type AssessmentCooldownRecord,
} from '@/lib/assessmentCooldown';

export async function loadAssessmentCooldowns(): Promise<AssessmentCooldownRecord[]> {
  return parseCooldownFile(await readHubJsonFile(ASSESSMENT_COOLDOWN_FILE));
}

export async function saveAssessmentCooldowns(
  records: AssessmentCooldownRecord[]
): Promise<void> {
  await writeHubJsonFile(ASSESSMENT_COOLDOWN_FILE, JSON.stringify({ records }));
}

export async function findChildCooldown(
  childId: string
): Promise<AssessmentCooldownRecord | null> {
  const id = childId.trim();
  if (!id) return null;
  return (await loadAssessmentCooldowns()).find((row) => row.childId === id) ?? null;
}
