/**
 * ربط كل معيار من معايير التقييم الأربعين برسم تعليمي ملون يجسّد السلوك المستهدف.
 * CLINICAL_RULES: رسوم EducationalIllustration يجب أن تطابق أهداف ABA في كل المجالات.
 * الربط مقترح تربوي — يحتاج مراجعة علمية قبل اعتماده نهائياً.
 */

import {
  CRITERIA_LIST,
  DEVELOPMENTAL_DOMAINS,
  DEVELOPMENTAL_DOMAIN_GAPS,
  type DevelopmentalDomainId,
} from '@/types/taalof';
import {
  resolveEducationalAssetId,
  type EducationalAssetId,
} from '@/lib/visuals/educationalAssets';

export const CRITERION_ILLUSTRATIONS: Record<string, EducationalAssetId> = {
  // التواصل الاستقبالي
  C2: 'face_child',
  C3: 'sit',
  C4: 'tidy_toys',
  C20: 'hands_up',
  // التواصل المعبّر
  C1: 'give',
  C5: 'talk',
  C6: 'point',
  C7: 'talk',
  C8: 'picture_card',
  C9: 'talk',
  C10: 'talk',
  // التفاعل والمهارات الاجتماعية
  C11: 'point',
  C12: 'face_adult',
  C13: 'wave',
  C14: 'toy',
  C16: 'smile',
  C17: 'feelings',
  C18: 'ball',
  C19: 'sit',
  // المهارات الحركية الكبرى
  C15: 'clap',
  // المهارات المعرفية والأكاديمية
  C21: 'apple',
  C22: 'triangle',
  C23: 'grapes',
  C24: 'key',
  C25: 'book',
  C26: 'blocks',
  C27: 'cow',
  C28: 'spatial_under',
  C29: 'touch_nose',
  C30: 'square',
  // الرعاية الذاتية والاستقلالية
  C34: 'toilet',
  C35: 'spoon',
  C36: 'toothbrush',
  // السلوك التكيفي والبديل
  C31: 'daily_schedule',
  C32: 'calm_breath',
  C37: 'hold_hand',
  C38: 'toy',
  C39: 'bed',
  // المعالجة والتكامل الحسي
  C33: 'headphones',
  C40: 'food',
};

/** رسم تمثيلي لكل مجال نمائي — يظهر حتى للمجال الذي لا بنود له بعد */
export const DEVELOPMENTAL_DOMAIN_ILLUSTRATIONS: Record<
  DevelopmentalDomainId,
  EducationalAssetId
> = {
  receptive_language: 'sit',
  expressive_language: 'talk',
  self_help: 'toothbrush',
  social_skills: 'wave',
  gross_motor: 'hands_up',
  fine_motor: 'blocks',
  cognitive_pre_academic: 'triangle',
  adaptive_behavior: 'calm_breath',
  sensory_integration: 'headphones',
};

export function illustrationIdForCriterion(
  criterionId: string
): EducationalAssetId | null {
  return resolveEducationalAssetId(CRITERION_ILLUSTRATIONS[criterionId]);
}

export type DomainIllustrationCoverage = {
  domain: DevelopmentalDomainId;
  domainIllustration: EducationalAssetId | null;
  criteria: number;
  illustrated: number;
  missing: string[];
  /** فجوة سريرية معلنة: مجال بلا بنود تقييم بعد */
  declaredGap: boolean;
};

export function criterionIllustrationCoverage(): DomainIllustrationCoverage[] {
  return DEVELOPMENTAL_DOMAINS.map(({ id: domain }) => {
    const ids = CRITERIA_LIST.filter((c) => c.developmentalDomain === domain).map(
      (c) => c.id
    );
    const missing = ids.filter((id) => !illustrationIdForCriterion(id));
    return {
      domain,
      domainIllustration: resolveEducationalAssetId(
        DEVELOPMENTAL_DOMAIN_ILLUSTRATIONS[domain]
      ),
      criteria: ids.length,
      illustrated: ids.length - missing.length,
      missing,
      declaredGap: DEVELOPMENTAL_DOMAIN_GAPS.includes(domain),
    };
  });
}
