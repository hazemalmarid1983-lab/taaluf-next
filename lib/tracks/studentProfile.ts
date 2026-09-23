/**
 * ملف طالب مستقل لمسار صعوبات التعلم — وزارة التربية والتعليم
 */

import type { LdAcademicDomain } from './types';
import { LD_STORAGE } from './storageKeys';

export type LdGradeLevel =
  | 'kg1'
  | 'kg2'
  | 'grade1'
  | 'grade2'
  | 'grade3'
  | 'grade4'
  | 'grade5'
  | 'grade6'
  | 'grade7'
  | 'grade8'
  | 'grade9'
  | 'grade10'
  | 'grade11'
  | 'grade12';

export type LdSchoolIntegration = {
  schoolName?: string;
  gradeLevel?: LdGradeLevel;
  resourceRoomAssigned?: boolean;
  mainClassTeacher?: string;
  ldSpecialist?: string;
  integrationPlan?: 'full' | 'partial' | 'resource_room_only';
};

export type LdEvaluationMetric = {
  domain: LdAcademicDomain;
  baselineScore: number;
  currentScore: number;
  targetScore: number;
  lastAssessedAt?: string;
  trend: 'improving' | 'stable' | 'declining' | 'unknown';
};

export type LdStudentProfile = {
  id: string;
  name: string;
  dob?: string;
  age?: number;
  gender?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  /** مسار ثابت — دائماً learning_disabilities */
  track: 'learning_disabilities';
  schoolIntegration: LdSchoolIntegration;
  /** مجالات التقييم الأكاديمي */
  evaluationMetrics: LdEvaluationMetric[];
  /** تشخيصات تربوية (ليست طبية) */
  educationalIndicators: string[];
  accommodations: string[];
  notes?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  specialistEmail?: string;
};

function readProfiles(): LdStudentProfile[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(LD_STORAGE.studentProfiles);
    return raw ? (JSON.parse(raw) as LdStudentProfile[]) : [];
  } catch {
    return [];
  }
}

function writeProfiles(profiles: LdStudentProfile[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LD_STORAGE.studentProfiles, JSON.stringify(profiles));
}

export function listLdStudentProfiles(): LdStudentProfile[] {
  return readProfiles().filter((p) => p.status === 'active');
}

export function getLdStudentProfile(id: string): LdStudentProfile | null {
  return readProfiles().find((p) => p.id === id) ?? null;
}

export function upsertLdStudentProfile(
  profile: Omit<LdStudentProfile, 'track' | 'createdAt' | 'updatedAt'> &
    Partial<Pick<LdStudentProfile, 'createdAt'>>
): LdStudentProfile {
  const now = new Date().toISOString();
  const profiles = readProfiles();
  const idx = profiles.findIndex((p) => p.id === profile.id);
  const existing = idx >= 0 ? profiles[idx] : null;

  const merged: LdStudentProfile = {
    track: 'learning_disabilities',
    evaluationMetrics: profile.evaluationMetrics ?? existing?.evaluationMetrics ?? [],
    educationalIndicators:
      profile.educationalIndicators ?? existing?.educationalIndicators ?? [],
    accommodations: profile.accommodations ?? existing?.accommodations ?? [],
    schoolIntegration: {
      ...existing?.schoolIntegration,
      ...profile.schoolIntegration,
    },
    status: profile.status ?? existing?.status ?? 'active',
    createdAt: existing?.createdAt ?? profile.createdAt ?? now,
    updatedAt: now,
    id: profile.id,
    name: profile.name,
    dob: profile.dob ?? existing?.dob,
    age: profile.age ?? existing?.age,
    gender: profile.gender ?? existing?.gender,
    parentName: profile.parentName ?? existing?.parentName,
    parentPhone: profile.parentPhone ?? existing?.parentPhone,
    parentEmail: profile.parentEmail ?? existing?.parentEmail,
    notes: profile.notes ?? existing?.notes,
    specialistEmail: profile.specialistEmail ?? existing?.specialistEmail,
  };

  if (idx >= 0) {
    profiles[idx] = merged;
  } else {
    profiles.push(merged);
  }
  writeProfiles(profiles);
  return merged;
}

export function createLdStudentProfile(fields: {
  id: string;
  name: string;
  dob?: string;
  age?: number;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  schoolName?: string;
  gradeLevel?: LdGradeLevel;
  specialistEmail?: string;
  notes?: string;
}): LdStudentProfile {
  return upsertLdStudentProfile({
    id: fields.id,
    name: fields.name,
    dob: fields.dob,
    age: fields.age,
    parentName: fields.parentName,
    parentPhone: fields.parentPhone,
    parentEmail: fields.parentEmail,
    specialistEmail: fields.specialistEmail,
    notes: fields.notes,
    schoolIntegration: {
      schoolName: fields.schoolName,
      gradeLevel: fields.gradeLevel,
      resourceRoomAssigned: false,
      integrationPlan: 'partial',
    },
    evaluationMetrics: [],
    educationalIndicators: [],
    accommodations: [],
    status: 'active',
  });
}

export const GRADE_LEVEL_LABELS: Record<LdGradeLevel, { ar: string; en: string }> = {
  kg1: { ar: 'الروضة الأولى', en: 'KG1' },
  kg2: { ar: 'الروضة الثانية', en: 'KG2' },
  grade1: { ar: 'الصف الأول', en: 'Grade 1' },
  grade2: { ar: 'الصف الثاني', en: 'Grade 2' },
  grade3: { ar: 'الصف الثالث', en: 'Grade 3' },
  grade4: { ar: 'الصف الرابع', en: 'Grade 4' },
  grade5: { ar: 'الصف الخامس', en: 'Grade 5' },
  grade6: { ar: 'الصف السادس', en: 'Grade 6' },
  grade7: { ar: 'الصف السابع', en: 'Grade 7' },
  grade8: { ar: 'الصف الثامن', en: 'Grade 8' },
  grade9: { ar: 'الصف التاسع', en: 'Grade 9' },
  grade10: { ar: 'الصف العاشر', en: 'Grade 10' },
  grade11: { ar: 'الصف الحادي عشر', en: 'Grade 11' },
  grade12: { ar: 'الصف الثاني عشر', en: 'Grade 12' },
};
