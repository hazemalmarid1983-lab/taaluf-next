/** أنواع غرفة المستشار العلمي — قابلة للتوسع لاحقاً */

export type ConsultantSectionStatus = 'ready' | 'partial' | 'preparing';

export type ConsultantExploreLink = {
  href: string;
  labelAr: string;
};

export type ConsultantSection = {
  id: string;
  titleAr: string;
  descriptionAr: string;
  status: ConsultantSectionStatus;
  /** رابط أساسي عند توفر محتوى */
  href?: string;
  explore?: readonly ConsultantExploreLink[];
  /** مصدر المحتوى — للشفافية */
  sourceNote?: string;
};

export type PlatformStatusLevel =
  | 'implemented'
  | 'partial'
  | 'in_progress'
  | 'needs_review';

export type PlatformStatusItem = {
  id: string;
  labelAr: string;
  level: PlatformStatusLevel;
  noteAr: string;
};

export type ScientificReviewPoint = {
  id: string;
  domainAr: string;
  questionAr: string;
  relatedSectionId?: string;
  relatedHref?: string;
};

/** أقسام نموذج المراجعة العلمية */
export type ReviewSectionId =
  | 'general-principles'
  | 'goals-criteria-measurement'
  | 'digital-real-training'
  | 'social-cognitive'
  | 'behavioral-sensory-independence'
  | 'safety-scientific-boundaries';

export type ReviewSection = {
  id: ReviewSectionId;
  titleAr: string;
  order: number;
};

export type ReviewResponseType = 'yes_no' | 'review_note';

export type ReviewQuestionDefinition = {
  id: string;
  sectionId: ReviewSectionId;
  criterionId?: string;
  question: string;
  responseType: ReviewResponseType;
};

export type ReviewAnswer = 'yes' | 'no';

export type ReviewQuestionItemStatus = 'pending' | 'answered';

export type ReviewQuestionResponse = {
  answer?: ReviewAnswer;
  reviewed?: boolean;
  notes?: string;
  updatedAt?: string;
};

export type ReviewResponsesState = Record<string, ReviewQuestionResponse>;

export type ReviewOverallStatus =
  | 'not_started'
  | 'in_progress'
  | 'partial'
  | 'complete';

export type CriterionReviewStatus =
  | 'not_reviewed'
  | 'partial'
  | 'reviewed';
