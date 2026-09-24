/**
 * المحاولة تبقى مفتوحة حتى يلمس الطفل.
 * الساعة لا تختار الإجابة ولا تُنهي التمرين نيابة عنه.
 */
export const ACTIVITY_AUTO_ANSWER_ENABLED = false;

export function shouldAutoFinishTrial(): boolean {
  return ACTIVITY_AUTO_ANSWER_ENABLED;
}
