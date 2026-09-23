import {
  CRITERIA_WITHOUT_METHODOLOGY_SECTION,
  REVIEW_QUESTION_BANK,
} from '@/lib/consultantRoom/reviewQuestionBank';
import type {
  ReviewQuestionDefinition,
  ReviewSection,
  ReviewSectionId,
} from '@/lib/consultantRoom/types';

export { CRITERIA_WITHOUT_METHODOLOGY_SECTION, REVIEW_QUESTION_BANK };

export const REVIEW_SECTIONS: readonly ReviewSection[] = [
  { id: 'general-principles', titleAr: 'المبادئ المنهجية العامة', order: 1 },
  {
    id: 'goals-criteria-measurement',
    titleAr: 'الأهداف والمعايير والقياس',
    order: 2,
  },
  {
    id: 'digital-real-training',
    titleAr: 'التدريب الرقمي والتدريب الواقعي',
    order: 3,
  },
  {
    id: 'social-cognitive',
    titleAr: 'المعايير الاجتماعية والمعرفية',
    order: 4,
  },
  {
    id: 'behavioral-sensory-independence',
    titleAr: 'المعايير السلوكية والحسية والاستقلالية',
    order: 5,
  },
  {
    id: 'safety-scientific-boundaries',
    titleAr: 'السلامة والحدود العلمية',
    order: 6,
  },
] as const;

/** أسماء المعايير للعرض — من المصدر القانوني */
export const CRITERION_LABELS: Record<string, string> = {
  C1: 'الطلب والتعبير عن الاحتياجات المباشرة',
  C2: 'الاستجابة للنداء باسمه والالتفات',
  C3: 'فهم التعليمات اللفظية البسيطة (خطوة واحدة)',
  C4: 'فهم التعليمات المركبة (خطوتان فأكثر)',
  C5: 'التواصل التعبيري بالجمل الوظيفية',
  C6: 'الإشارة والإيماء للتواصل',
  C7: 'المحادثة المتبادلة وطرح الأسئلة',
  C8: 'استخدام الرموز أو الصور للطلب',
  C9: 'الصدى اللفظي مقابل الكلام الوظيفي',
  C10: 'وضوح النطق وفهم المستمع',
  C11: 'الانتباه المشترك والتتبع البصري التفاعلي',
  C12: 'التواصل البصري أثناء التفاعل',
  C13: 'المبادرة الاجتماعية مع الأقران',
  C14: 'اللعب التخيلي وتبادل الأدوار',
  C15: 'التقليد الحركي والاجتماعي',
  C16: 'الاستجابة الاجتماعية (ابتسام وترحيب)',
  C17: 'التعبير عن المشاعر وفهم مشاعر الآخرين',
  C18: 'اللعب التعاوني والمشاركة',
  C19: 'انتظار الدور في النشاط الجماعي',
  C20: 'الاستجابة للتعليمات الجماعية',
  C21: 'مطابقة المجسمات والصور والتصنيف',
  C22: 'تمييز الألوان والأشكال',
  C23: 'العد والإدراك الكمي المبكر',
  C24: 'حل المشكلات البسيطة',
  C25: 'الانتباه والتركيز في المهمة',
  C26: 'الذاكرة العاملة واتباع التسلسل',
  C27: 'التصنيف حسب الفئة (وظيفة أو لون أو شكل)',
  C28: 'المفاهيم المكانية (فوق، تحت، بجانب)',
  C29: 'تنفيذ نموذج معرفي (انظر ثم افعل)',
  C30: 'المرونة المعرفية (تغيير القاعدة)',
  C31: 'المرونة مع التغيير والروتين اليومي',
  C32: 'التنظيم الانفعالي ونوبات الغضب',
  C33: 'الحساسية والمعالجة الحسية',
  C34: 'استقلالية استخدام الحمام وجاهزية الضبط',
};

export function getReviewQuestions(): readonly ReviewQuestionDefinition[] {
  return REVIEW_QUESTION_BANK;
}

export function getReviewQuestionsBySection(
  sectionId: ReviewSectionId
): readonly ReviewQuestionDefinition[] {
  return REVIEW_QUESTION_BANK.filter((q) => q.sectionId === sectionId);
}

export function getReviewQuestionsByCriterion(
  criterionId: string
): readonly ReviewQuestionDefinition[] {
  return REVIEW_QUESTION_BANK.filter((q) => q.criterionId === criterionId);
}

export function getReviewQuestionById(
  questionId: string
): ReviewQuestionDefinition | undefined {
  return REVIEW_QUESTION_BANK.find((q) => q.id === questionId);
}

export function getCriteriaWithReviewQuestions(): readonly string[] {
  const ids = new Set<string>();
  for (const q of REVIEW_QUESTION_BANK) {
    if (q.criterionId) ids.add(q.criterionId);
  }
  return [...ids].sort(
    (a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10)
  );
}

export function getCriterionLabel(criterionId: string): string {
  return CRITERION_LABELS[criterionId] ?? criterionId;
}
