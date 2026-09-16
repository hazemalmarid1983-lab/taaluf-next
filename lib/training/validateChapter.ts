/**
 * التحقق من صحة مستندات الفصول التدريبية — بدون مكتبات خارجية.
 */

import {
  TRAINING_ENGINE_TYPES,
  TRAINING_GOAL_TYPES,
  type TrainingAgeBand,
  type TrainingChapterDocument,
  type TrainingDifficulty,
  type TrainingDomainId,
  type TrainingEngineType,
  type TrainingGoalLink,
  type TrainingGoalType,
  type TrainingMedia,
  type TrainingSkill,
  type TrainingValidationResult,
} from '@/lib/training/types';
import {
  isCanonicalCriterionId,
} from '@/lib/training/canonicalCriteria';

const TRAINING_AGE_BANDS: TrainingAgeBand[] = ['3-4', '5-6', '7-9', '10-12'];
const TRAINING_DIFFICULTIES: TrainingDifficulty[] = [1, 2, 3];
const TRAINING_DOMAIN_IDS: TrainingDomainId[] = [
  'cognitive',
  'communication',
  'social',
  'sensory_behavior',
];

const ENGINE_TYPE_SET = new Set<string>(TRAINING_ENGINE_TYPES);
const GOAL_TYPE_SET = new Set<string>(TRAINING_GOAL_TYPES);
const AGE_BAND_SET = new Set<string>(TRAINING_AGE_BANDS);
const DIFFICULTY_SET = new Set<number>(TRAINING_DIFFICULTIES);
const DOMAIN_ID_SET = new Set<string>(TRAINING_DOMAIN_IDS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function pushIfMissing(errors: string[], path: string, value: unknown) {
  if (value === undefined || value === null || value === '') {
    errors.push(`${path} مطلوب`);
  }
}

function validateAgeBands(
  errors: string[],
  path: string,
  bands: unknown
): bands is TrainingAgeBand[] {
  if (!Array.isArray(bands) || bands.length === 0) {
    errors.push(`${path} يجب أن يكون مصفوفة غير فارغة`);
    return false;
  }
  for (const band of bands) {
    if (!AGE_BAND_SET.has(String(band))) {
      errors.push(`${path} يحتوي فئة عمرية غير صالحة: ${String(band)}`);
    }
  }
  return true;
}

function validateDifficultyLevels(
  errors: string[],
  path: string,
  levels: unknown
): levels is TrainingDifficulty[] {
  if (!Array.isArray(levels) || levels.length === 0) {
    errors.push(`${path} يجب أن يكون مصفوفة غير فارغة`);
    return false;
  }
  for (const level of levels) {
    if (!DIFFICULTY_SET.has(Number(level))) {
      errors.push(`${path} يحتوي مستوى صعوبة غير صالح: ${String(level)}`);
    }
  }
  return true;
}

function validateGoalLink(
  errors: string[],
  path: string,
  link: unknown,
  knownSkillIds: Set<string>
): link is TrainingGoalLink {
  if (!isRecord(link)) {
    errors.push(`${path} يجب أن يكون كائناً`);
    return false;
  }

  pushIfMissing(errors, `${path}.goalType`, link.goalType);
  pushIfMissing(errors, `${path}.labelAr`, link.labelAr);
  pushIfMissing(errors, `${path}.labelEn`, link.labelEn);

  if (
    link.goalType !== undefined &&
    !GOAL_TYPE_SET.has(String(link.goalType))
  ) {
    errors.push(`${path}.goalType غير صالح: ${String(link.goalType)}`);
  }

  if (link.criterionIds !== undefined) {
    if (!isStringArray(link.criterionIds) || link.criterionIds.length === 0) {
      errors.push(`${path}.criterionIds يجب أن يكون مصفوفة نصوص غير فارغة`);
    }
  }

  if (link.skillIds !== undefined) {
    if (!isStringArray(link.skillIds) || link.skillIds.length === 0) {
      errors.push(`${path}.skillIds يجب أن يكون مصفوفة نصوص غير فارغة`);
    } else {
      for (const skillId of link.skillIds) {
        if (!knownSkillIds.has(skillId)) {
          errors.push(`${path}.skillIds يشير إلى مهارة غير معرّفة: ${skillId}`);
        }
      }
    }
  }

  const hasCriterionLink =
    Array.isArray(link.criterionIds) && link.criterionIds.length > 0;
  const hasSkillLink = Array.isArray(link.skillIds) && link.skillIds.length > 0;
  if (!hasCriterionLink && !hasSkillLink) {
    errors.push(
      `${path} يجب أن يربط goalLink بمهارة (skillIds) أو معيار (criterionIds) على الأقل`
    );
  }

  return errors.every((e) => !e.startsWith(`${path}.`));
}

function validateCanonicalCriterionIds(
  errors: string[],
  path: string,
  criterionIds: unknown
): criterionIds is string[] {
  if (!isStringArray(criterionIds) || criterionIds.length === 0) {
    errors.push(`${path} يجب أن يكون مصفوفة معايير غير فارغة`);
    return false;
  }

  for (const id of criterionIds) {
    if (!isCanonicalCriterionId(id)) {
      errors.push(`${path} يشير إلى معيار غير موجود في v3: ${id}`);
    }
  }

  return true;
}

function validateSkill(
  errors: string[],
  path: string,
  skill: unknown
): skill is TrainingSkill {
  if (!isRecord(skill)) {
    errors.push(`${path} يجب أن يكون كائناً`);
    return false;
  }

  pushIfMissing(errors, `${path}.skillId`, skill.skillId);
  pushIfMissing(errors, `${path}.domainId`, skill.domainId);
  pushIfMissing(errors, `${path}.titleAr`, skill.titleAr);
  pushIfMissing(errors, `${path}.titleEn`, skill.titleEn);

  if (
    skill.domainId !== undefined &&
    !DOMAIN_ID_SET.has(String(skill.domainId))
  ) {
    errors.push(`${path}.domainId غير صالح: ${String(skill.domainId)}`);
  }

  validateCanonicalCriterionIds(errors, `${path}.criterionIds`, skill.criterionIds);

  return true;
}

function validateMedia(
  errors: string[],
  path: string,
  media: unknown,
  knownSkillIds: Set<string>,
  skillById: Map<string, TrainingSkill>
): media is TrainingMedia {
  if (!isRecord(media)) {
    errors.push(`${path} يجب أن يكون كائناً`);
    return false;
  }

  pushIfMissing(errors, `${path}.mediaId`, media.mediaId);
  pushIfMissing(errors, `${path}.titleAr`, media.titleAr);
  pushIfMissing(errors, `${path}.titleEn`, media.titleEn);
  pushIfMissing(errors, `${path}.engineType`, media.engineType);

  if (
    media.engineType !== undefined &&
    !ENGINE_TYPE_SET.has(String(media.engineType))
  ) {
    errors.push(`${path}.engineType غير صالح: ${String(media.engineType)}`);
  }

  if (!isStringArray(media.skillIds) || media.skillIds.length === 0) {
    errors.push(`${path}.skillIds يجب أن يكون مصفوفة مهارات غير فارغة`);
  } else {
    for (const skillId of media.skillIds) {
      if (!knownSkillIds.has(skillId)) {
        errors.push(`${path}.skillIds يشير إلى مهارة غير معرّفة: ${skillId}`);
      }
    }
  }

  if (!Array.isArray(media.goalLinks) || media.goalLinks.length === 0) {
    errors.push(`${path}.goalLinks يجب أن يكون مصفوفة أهداف غير فارغة`);
  } else {
    media.goalLinks.forEach((link, index) => {
      validateGoalLink(errors, `${path}.goalLinks[${index}]`, link, knownSkillIds);
    });
  }

  if (
    validateCanonicalCriterionIds(errors, `${path}.criterionIds`, media.criterionIds) &&
    isStringArray(media.skillIds)
  ) {
    const allowedCriteria = new Set<string>();
    for (const skillId of media.skillIds) {
      const skill = skillById.get(skillId);
      if (skill) {
        for (const criterionId of skill.criterionIds) {
          allowedCriteria.add(criterionId);
        }
      }
    }

    for (const criterionId of media.criterionIds) {
      if (!allowedCriteria.has(criterionId)) {
        errors.push(
          `${path}.criterionIds يحتوي ${criterionId} خارج معايير المهارات المرتبطة`
        );
      }
    }
  }

  validateAgeBands(errors, `${path}.ageBands`, media.ageBands);
  validateDifficultyLevels(errors, `${path}.difficultyLevels`, media.difficultyLevels);

  if (!isRecord(media.config)) {
    errors.push(`${path}.config يجب أن يكون كائناً`);
  } else if (media.config.difficulty !== undefined) {
    if (!DIFFICULTY_SET.has(Number(media.config.difficulty))) {
      errors.push(
        `${path}.config.difficulty غير صالح: ${String(media.config.difficulty)}`
      );
    }
  }

  if (
    media.engineType !== undefined &&
    isRecord(media.config) &&
    media.config.engineType !== undefined &&
    String(media.config.engineType) !== String(media.engineType)
  ) {
    errors.push(
      `${path}.config.engineType يجب أن يطابق engineType عند تعريفه`
    );
  }

  return true;
}

/** يتحقق من مستند فصل تدريبي كامل */
export function validateTrainingChapterDocument(
  input: unknown
): TrainingValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { valid: false, errors: ['المستند يجب أن يكون كائناً'] };
  }

  pushIfMissing(errors, 'version', input.version);
  pushIfMissing(errors, 'platform', input.platform);

  if (input.platform !== undefined && input.platform !== 'تآلف') {
    errors.push('platform يجب أن يكون «تآلف»');
  }

  if (!isRecord(input.chapter)) {
    errors.push('chapter مطلوب');
    return { valid: false, errors };
  }

  const chapter = input.chapter;
  pushIfMissing(errors, 'chapter.chapterId', chapter.chapterId);
  pushIfMissing(errors, 'chapter.titleAr', chapter.titleAr);
  pushIfMissing(errors, 'chapter.titleEn', chapter.titleEn);
  pushIfMissing(errors, 'chapter.descriptionAr', chapter.descriptionAr);

  if (
    chapter.domain !== undefined &&
    !DOMAIN_ID_SET.has(String(chapter.domain))
  ) {
    errors.push(`chapter.domain غير صالح: ${String(chapter.domain)}`);
  }

  if (!isStringArray(chapter.skillIds) || chapter.skillIds.length === 0) {
    errors.push('chapter.skillIds يجب أن يكون مصفوفة غير فارغة');
  }

  if (
    !Array.isArray(chapter.criterionIds) ||
    chapter.criterionIds.length === 0
  ) {
    errors.push('chapter.criterionIds يجب أن يكون مصفوفة معايير غير فارغة');
  } else {
    validateCanonicalCriterionIds(errors, 'chapter.criterionIds', chapter.criterionIds);
  }

  validateAgeBands(errors, 'chapter.ageBands', chapter.ageBands);
  validateDifficultyLevels(
    errors,
    'chapter.difficultyLevels',
    chapter.difficultyLevels
  );

  if (!isStringArray(chapter.orderedMedia) || chapter.orderedMedia.length === 0) {
    errors.push('chapter.orderedMedia يجب أن يكون مصفوفة معرّفات وسائل');
  }

  if (!Array.isArray(input.skills) || input.skills.length === 0) {
    errors.push('skills يجب أن يكون مصفوفة مهارات غير فارغة');
  }

  if (!Array.isArray(input.media) || input.media.length === 0) {
    errors.push('media يجب أن يكون مصفوفة وسائل غير فارغة');
  }

  const knownSkillIds = new Set<string>();
  const skillById = new Map<string, TrainingSkill>();
  if (Array.isArray(input.skills)) {
    for (let i = 0; i < input.skills.length; i++) {
      const skill = input.skills[i];
      if (validateSkill(errors, `skills[${i}]`, skill) && isRecord(skill)) {
        const skillId = String(skill.skillId);
        knownSkillIds.add(skillId);
        skillById.set(skillId, skill as TrainingSkill);
      }
    }
  }

  if (isStringArray(chapter.skillIds)) {
    for (const skillId of chapter.skillIds) {
      if (!knownSkillIds.has(skillId)) {
        errors.push(`chapter.skillIds يشير إلى مهارة غير معرّفة: ${skillId}`);
      }
    }
  }

  const mediaById = new Map<string, TrainingMedia>();
  if (Array.isArray(input.media)) {
    for (let i = 0; i < input.media.length; i++) {
      const item = input.media[i];
      if (validateMedia(errors, `media[${i}]`, item, knownSkillIds, skillById) && isRecord(item)) {
        const mediaId = String(item.mediaId);
        if (mediaById.has(mediaId)) {
          errors.push(`mediaId مكرر: ${mediaId}`);
        } else {
          mediaById.set(mediaId, item as TrainingMedia);
        }
      }
    }
  }

  if (isStringArray(chapter.orderedMedia)) {
    const seen = new Set<string>();
    for (const mediaId of chapter.orderedMedia) {
      if (!mediaById.has(mediaId)) {
        errors.push(`orderedMedia يشير إلى وسيلة غير معرّفة: ${mediaId}`);
      }
      if (seen.has(mediaId)) {
        errors.push(`orderedMedia يحتوي معرّفاً مكرراً: ${mediaId}`);
      }
      seen.add(mediaId);
    }

    if (
      mediaById.size > 0 &&
      chapter.orderedMedia.length !== mediaById.size
    ) {
      errors.push(
        'orderedMedia يجب أن يضم كل الوسائل المعرّفة ولا يتجاوزها'
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidTrainingChapterDocument(
  input: unknown
): asserts input is TrainingChapterDocument {
  const result = validateTrainingChapterDocument(input);
  if (!result.valid) {
    throw new Error(result.errors.join('; '));
  }
}

export function isTrainingEngineType(value: string): value is TrainingEngineType {
  return ENGINE_TYPE_SET.has(value);
}

export function isTrainingGoalType(value: string): value is TrainingGoalType {
  return GOAL_TYPE_SET.has(value);
}

export function isTrainingDifficulty(value: number): value is TrainingDifficulty {
  return DIFFICULTY_SET.has(value);
}
