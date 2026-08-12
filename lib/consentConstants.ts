import {
  ASSESSMENT_CONSENT_AR,
  PLATFORM_TERMS_CHECKBOX_AR,
} from '@/lib/legalContent';

export const CONSENT_LAYERS = [
  {
    type: 'general_platform',
    title: PLATFORM_TERMS_CHECKBOX_AR.title,
    text: PLATFORM_TERMS_CHECKBOX_AR.body,
  },
  {
    type: 'assessment',
    title: 'الموافقة على التقييم',
    text: ASSESSMENT_CONSENT_AR.assessment,
  },
  {
    type: 'data_privacy',
    title: 'الموافقة على البيانات',
    text: ASSESSMENT_CONSENT_AR.data,
  },
] as const;

export const CONSENT_COOKIE = 'taaluf_consented';
export const CONSENT_STORAGE_KEY = 'taaluf_consented';
