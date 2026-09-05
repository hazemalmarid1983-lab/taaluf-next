import {
  THREE_TIER_CONSENTS,
  VIDEO_CONSENT,
} from '@/lib/legalContent';

export const CONSENT_LAYERS = [
  {
    type: THREE_TIER_CONSENTS.platformConsent.type,
    title: THREE_TIER_CONSENTS.platformConsent.title,
    text: THREE_TIER_CONSENTS.platformConsent.fullText,
    summary: THREE_TIER_CONSENTS.platformConsent.summary,
    required: THREE_TIER_CONSENTS.platformConsent.required,
  },
  {
    type: THREE_TIER_CONSENTS.assessmentConsent.type,
    title: THREE_TIER_CONSENTS.assessmentConsent.title,
    text: THREE_TIER_CONSENTS.assessmentConsent.fullText,
    summary: THREE_TIER_CONSENTS.assessmentConsent.summary,
    required: THREE_TIER_CONSENTS.assessmentConsent.required,
  },
  {
    type: THREE_TIER_CONSENTS.dataConsent.type,
    title: THREE_TIER_CONSENTS.dataConsent.title,
    text: THREE_TIER_CONSENTS.dataConsent.fullText,
    summary: THREE_TIER_CONSENTS.dataConsent.summary,
    required: THREE_TIER_CONSENTS.dataConsent.required,
  },
  {
    type: VIDEO_CONSENT.type,
    title: VIDEO_CONSENT.title,
    text: VIDEO_CONSENT.fullText,
    summary: VIDEO_CONSENT.summary,
    required: VIDEO_CONSENT.required,
  },
] as const;

export const REQUIRED_CONSENT_LAYERS = CONSENT_LAYERS.filter((l) => l.required);

export const CONSENT_COOKIE = 'taaluf_consented';
export const CONSENT_STORAGE_KEY = 'taaluf_consented';
