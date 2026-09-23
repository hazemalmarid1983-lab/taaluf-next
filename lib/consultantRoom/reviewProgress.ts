import {
  getCriteriaWithReviewQuestions,
  getReviewQuestions,
  getReviewQuestionsByCriterion,
  getReviewQuestionsBySection,
} from '@/lib/consultantRoom/reviewQuestions';
import type {
  CriterionReviewStatus,
  ReviewAnswer,
  ReviewOverallStatus,
  ReviewQuestionDefinition,
  ReviewQuestionItemStatus,
  ReviewResponsesState,
} from '@/lib/consultantRoom/types';

export const CONSULTANT_REVIEW_STORAGE_KEY = 'taaluf.consultantReview.v1';

export function isQuestionCompleteForDefinition(
  question: ReviewQuestionDefinition,
  response: ReviewResponsesState[string] | undefined
): boolean {
  if (question.responseType === 'yes_no') {
    return response?.answer === 'yes' || response?.answer === 'no';
  }
  return response?.reviewed === true;
}

export function getQuestionStatus(
  question: ReviewQuestionDefinition,
  response: ReviewResponsesState[string] | undefined
): ReviewQuestionItemStatus {
  return isQuestionCompleteForDefinition(question, response)
    ? 'answered'
    : 'pending';
}

export function isQuestionComplete(
  questionId: string,
  state: ReviewResponsesState
): boolean {
  const question = getReviewQuestions().find((q) => q.id === questionId);
  if (!question) return false;
  return isQuestionCompleteForDefinition(question, state[questionId]);
}

export function countAnsweredQuestions(
  state: ReviewResponsesState,
  questions?: readonly ReviewQuestionDefinition[]
): number {
  const list = questions ?? getReviewQuestions();
  return list.filter((q) => isQuestionCompleteForDefinition(q, state[q.id]))
    .length;
}

export function getProgressPercentage(
  answeredCount: number,
  totalCount: number
): number {
  if (totalCount <= 0) return 0;
  return Math.round((answeredCount / totalCount) * 100);
}

export function getReviewOverallStatus(
  answeredCount: number,
  totalCount: number
): ReviewOverallStatus {
  if (totalCount <= 0 || answeredCount <= 0) return 'not_started';
  if (answeredCount >= totalCount) return 'complete';
  if (answeredCount >= totalCount / 2) return 'partial';
  return 'in_progress';
}

export function getReviewOverallStatusLabel(status: ReviewOverallStatus): string {
  switch (status) {
    case 'not_started':
      return 'لم تبدأ';
    case 'in_progress':
      return 'قيد المراجعة';
    case 'partial':
      return 'مراجعة جزئية';
    case 'complete':
      return 'مكتملة';
  }
}

export function getQuestionStatusLabel(status: ReviewQuestionItemStatus): string {
  return status === 'answered' ? 'تمت الإجابة' : 'لم تتم المراجعة';
}

export function getCriterionReviewStatus(
  criterionId: string,
  state: ReviewResponsesState
): CriterionReviewStatus {
  const questions = getReviewQuestionsByCriterion(criterionId);
  if (questions.length === 0) return 'not_reviewed';
  const answered = countAnsweredQuestions(state, questions);
  if (answered <= 0) return 'not_reviewed';
  if (answered >= questions.length) return 'reviewed';
  return 'partial';
}

export function getCriterionReviewStatusLabel(
  status: CriterionReviewStatus
): string {
  switch (status) {
    case 'not_reviewed':
      return 'لم تتم المراجعة';
    case 'partial':
      return 'مراجعة جزئية';
    case 'reviewed':
      return 'تمت مراجعة نقاطه';
  }
}

export function countReviewedCriteria(state: ReviewResponsesState): number {
  return getCriteriaWithReviewQuestions().filter(
    (criterionId) => getCriterionReviewStatus(criterionId, state) === 'reviewed'
  ).length;
}

export function countPartiallyReviewedCriteria(
  state: ReviewResponsesState
): number {
  return getCriteriaWithReviewQuestions().filter(
    (criterionId) => getCriterionReviewStatus(criterionId, state) === 'partial'
  ).length;
}

export function findFirstUnansweredQuestionId(
  state: ReviewResponsesState
): string | null {
  const unanswered = getReviewQuestions().find(
    (q) => !isQuestionCompleteForDefinition(q, state[q.id])
  );
  return unanswered?.id ?? null;
}

export function loadReviewResponses(): ReviewResponsesState {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CONSULTANT_REVIEW_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ReviewResponsesState;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveReviewResponses(state: ReviewResponsesState): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(CONSULTANT_REVIEW_STORAGE_KEY, JSON.stringify(state));
}

export function upsertReviewAnswer(
  state: ReviewResponsesState,
  questionId: string,
  answer: ReviewAnswer
): ReviewResponsesState {
  const next: ReviewResponsesState = {
    ...state,
    [questionId]: {
      ...state[questionId],
      answer,
      reviewed: undefined,
      updatedAt: new Date().toISOString(),
    },
  };
  saveReviewResponses(next);
  return next;
}

export function upsertReviewReviewed(
  state: ReviewResponsesState,
  questionId: string,
  reviewed: boolean
): ReviewResponsesState {
  const next: ReviewResponsesState = {
    ...state,
    [questionId]: {
      ...state[questionId],
      reviewed,
      answer: undefined,
      updatedAt: new Date().toISOString(),
    },
  };
  saveReviewResponses(next);
  return next;
}

export function upsertReviewNotes(
  state: ReviewResponsesState,
  questionId: string,
  notes: string
): ReviewResponsesState {
  const next: ReviewResponsesState = {
    ...state,
    [questionId]: {
      ...state[questionId],
      notes,
      updatedAt: new Date().toISOString(),
    },
  };
  saveReviewResponses(next);
  return next;
}

export function getSectionProgress(
  sectionId: Parameters<typeof getReviewQuestionsBySection>[0],
  state: ReviewResponsesState
) {
  const questions = getReviewQuestionsBySection(sectionId);
  const answeredCount = countAnsweredQuestions(state, questions);
  return {
    totalCount: questions.length,
    answeredCount,
    percentage: getProgressPercentage(answeredCount, questions.length),
  };
}

export function getReviewProgressSummary(state: ReviewResponsesState) {
  const questions = getReviewQuestions();
  const totalCount = questions.length;
  const answeredCount = countAnsweredQuestions(state, questions);
  const percentage = getProgressPercentage(answeredCount, totalCount);
  const status = getReviewOverallStatus(answeredCount, totalCount);
  const criteriaWithQuestions = getCriteriaWithReviewQuestions();
  const reviewedCriteriaCount = countReviewedCriteria(state);

  return {
    totalCount,
    answeredCount,
    percentage,
    status,
    statusLabel: getReviewOverallStatusLabel(status),
    criteriaWithQuestionsCount: criteriaWithQuestions.length,
    reviewedCriteriaCount,
    partiallyReviewedCriteriaCount: countPartiallyReviewedCriteria(state),
  };
}
