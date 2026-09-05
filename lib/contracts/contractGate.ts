/**
 * بوابة التحقق من العقد — تمنع الإجراءات غير الموقّعة.
 */

import type { ContractType } from './contractTemplates';
import { getContractStatus, isContractSigned } from './contractStore';

export type ContractAction =
  | 'home_session'
  | 'clinical_report_export'
  | 'sensory_room_session';

export type ContractGateResult = {
  allowed: boolean;
  status: 'pending' | 'signed_electronic' | 'signed_paper';
  action: ContractAction;
  contractType: ContractType;
  messageAr: string;
  messageEn: string;
};

const ACTION_CONTRACT: Record<ContractAction, ContractType> = {
  home_session: 'parent',
  clinical_report_export: 'parent',
  sensory_room_session: 'parent',
};

const BLOCK_MESSAGES: Record<
  ContractAction,
  { ar: string; en: string }
> = {
  home_session: {
    ar: 'يُرجى توقيع اتفاقية ولي الأمر قبل بدء الجلسات التدريبية في الغرفة المنزلية.',
    en: 'Please sign the parent agreement before starting home classroom training sessions.',
  },
  clinical_report_export: {
    ar: 'يُرجى توقيع اتفاقية ولي الأمر قبل تنزيل أو طباعة التقرير السريري النهائي.',
    en: 'Please sign the parent agreement before downloading or printing the final clinical report.',
  },
  sensory_room_session: {
    ar: 'يُرجى توقيع اتفاقية ولي الأمر قبل استخدام الغرف الحسية.',
    en: 'Please sign the parent agreement before using sensory rooms.',
  },
};

export function checkContractGate(
  childId: string | null | undefined,
  action: ContractAction
): ContractGateResult {
  const contractType = ACTION_CONTRACT[action];
  const messages = BLOCK_MESSAGES[action];

  if (!childId || !childId.trim()) {
    return {
      allowed: false,
      status: 'pending',
      action,
      contractType,
      messageAr: 'يُرجى اختيار ملف الطفل أولاً ثم توقيع الاتفاقية.',
      messageEn: 'Please select the child file first, then sign the agreement.',
    };
  }

  const status = getContractStatus(childId, contractType);
  const signed = isContractSigned(childId, contractType);

  return {
    allowed: signed,
    status,
    action,
    contractType,
    messageAr: signed ? '' : messages.ar,
    messageEn: signed ? '' : messages.en,
  };
}

export function assertContractSigned(
  childId: string | null | undefined,
  action: ContractAction
): boolean {
  return checkContractGate(childId, action).allowed;
}

export function contractGateLabel(
  result: ContractGateResult,
  isAr: boolean
): string {
  return isAr ? result.messageAr : result.messageEn;
}
