import type { Language } from '@/lib/i18n/translations';
import {
  FAQ_ITEMS_AR,
  LEGAL_DISCLAIMER_LOCATIONS_AR,
  LEGAL_DOES_NOT_AR,
  LEGAL_ORIGINALITY_AR,
  LEGAL_PROVIDES_AR,
  PRIVACY_SECTIONS_AR,
  SCIENTIFIC_BASIS_AR,
  TERMS_SECTIONS_AR,
} from '@/lib/legalContent';

const TERMS_EN = [
  {
    heading: 'Platform definition and operation',
    body: 'Taaluf is an online educational support assessment platform operated from the Sultanate of Oman. This document is dated 14 August 2026. The platform is a screening and assessment tool that uses original criteria and AI to provide educational indicators. Taaluf does not provide a medical diagnosis and does not replace a qualified specialist.',
  },
  {
    heading: 'Governing law and venue',
    body: 'These terms are governed by the laws of the Sultanate of Oman. Any dispute that cannot be resolved amicably is referred to the Oman Commercial Arbitration Centre under its applicable rules.',
  },
  {
    heading: 'Disclaimer',
    body: 'Results are observable educational indicators, not a medical or psychological diagnosis, and do not create a therapeutic relationship between Taaluf and the user. Educational or medical decisions remain with the family and a qualified specialist.',
  },
  {
    heading: 'The four consents',
    body: 'Using the platform requires: (1) general use consent, (2) educational assessment consent, (3) personal-data processing consent, and (4) video-analysis consent when that service is enabled.',
  },
  {
    heading: 'Data protection',
    body: 'We do not collect biometric data for facial identification. Storage is on the server and Airtable when configured, with local browser storage during trials. Users may request export or deletion of their data.',
  },
  {
    heading: 'Pricing',
    body: 'Base prices are in US dollars with conversion to Omani rial and other currencies: screening is free, comprehensive assessment is $39 (about 15 OMR), monthly follow-up is $15 (about 5.75 OMR), and the specialist portal is $49 (about 19 OMR).',
  },
  {
    heading: 'Artificial intelligence',
    body: 'Gemini (and a fallback when needed) drafts a guidance report. Every AI output is prefaced with a notice that it is not a diagnosis and should be reviewed by a qualified specialist.',
  },
] as const;

const PRIVACY_EN = [
  {
    heading: 'What we collect',
    body: 'The child’s name and age, screening and assessment answers, game sessions, child-linked messages, and consent records. We do not request card details inside the platform during the trial.',
  },
  {
    heading: 'Why we collect it',
    body: 'To provide the educational assessment, save progress, generate a guidance report, and enable parent–specialist communication.',
  },
  {
    heading: 'Where it is stored',
    body: 'On the platform server and Airtable when keys are configured, or locally in the browser if connection fails. API keys stay in environment variables, not in the browser.',
  },
  {
    heading: 'Video (later phase)',
    body: 'Video upload is optional and only after explicit consent. It is analyzed for educational purposes only and is not used for identity recognition.',
  },
  {
    heading: 'Your rights',
    body: 'Access, correction, export, and deletion. Contact the platform or administration to request deletion.',
  },
  {
    heading: 'Law',
    body: 'Processing is carried out under the platform’s operation from the Sultanate of Oman. Disputes: Oman Commercial Arbitration Centre.',
  },
] as const;

const SCIENCE_EN = [
  {
    heading: 'Regulatory reference',
    body: 'The general regulatory frame is DSM-5 and ICD-11 to link known scientific domains. This is a regulatory reference, not a diagnostic license.',
  },
  {
    heading: 'Taaluf criteria (40 indicators)',
    body: 'Four major domains: receptive and expressive communication; social interaction, inclusion, and play; cognitive growth and problem-solving; and behavior, adaptation, senses, and self-independence (10 items each). Scale 0–3 (higher = greater support need).',
  },
  {
    heading: 'Adaptive testing (CAT)',
    body: 'Assessment starts with a seed from each domain, then deepens higher-scoring domains to reduce questions while covering all four domains.',
  },
  {
    heading: 'Artificial intelligence',
    body: 'Gemini generates family guidance text under an educational constitution. It is not a diagnosis and is reviewed by a specialist when adopted.',
  },
] as const;

const FAQ_EN = [
  {
    q: 'Does Taaluf provide a medical diagnosis?',
    a: 'No. It is an educational support tool only.',
  },
  {
    q: 'Where does the platform operate legally?',
    a: 'The Sultanate of Oman, document dated 14 August 2026. Disputes go through the Oman Commercial Arbitration Centre.',
  },
  {
    q: 'What ages?',
    a: 'Approximately 3 to 12 years.',
  },
  {
    q: 'Is screening paid?',
    a: 'The initial screening is free. Comprehensive assessment, follow-up, and the specialist portal have published USD prices with OMR conversion.',
  },
  {
    q: 'Where is data stored?',
    a: 'Airtable when configured, otherwise in the browser during trials. You may request deletion.',
  },
  {
    q: 'Are the games a diagnosis?',
    a: 'No. They are support activities for educational indicators (imitation, tracking, emotions).',
  },
] as const;

const PROVIDES_EN = [
  'A fast free initial screening for parents.',
  'A multi-source comprehensive educational assessment (specialist, family, games).',
  'SMART educational goals for individual plans.',
  'Exportable guidance reports (PDF).',
] as const;

const DOES_NOT_EN = [
  'Does not provide a medical diagnosis or treatment report.',
  'Does not prescribe medicines or medical protocols.',
  'Does not collect biometric data for face or identity recognition.',
  'Does not use protected commercial psychological scales.',
] as const;

const DISCLAIMER_LOCS_EN = [
  'Registration and general consent',
  'Before starting the educational assessment',
  'Banner at the top of pages and the results page',
  'PDF report footer',
  'Prefix of AI outputs',
] as const;

const ORIGINALITY_EN =
  'All criteria used on the platform (Canon 4.0-unified — 40 indicators) are original items prepared by the Taaluf team. The platform does not use any protected commercial scales (such as ADOS-2, CARS-2, Vineland-3, or WISC-V). Similarity in some concepts (such as eye contact or attention) is general conceptual overlap common in publicly available developmental literature.';

export function legalSections(lang: Language) {
  return {
    terms: lang === 'en' ? TERMS_EN : TERMS_SECTIONS_AR,
    privacy: lang === 'en' ? PRIVACY_EN : PRIVACY_SECTIONS_AR,
    science: lang === 'en' ? SCIENCE_EN : SCIENTIFIC_BASIS_AR,
    faq: lang === 'en' ? FAQ_EN : FAQ_ITEMS_AR,
    provides: lang === 'en' ? PROVIDES_EN : LEGAL_PROVIDES_AR,
    doesNot: lang === 'en' ? DOES_NOT_EN : LEGAL_DOES_NOT_AR,
    disclaimerLocs: lang === 'en' ? DISCLAIMER_LOCS_EN : LEGAL_DISCLAIMER_LOCATIONS_AR,
    originality: lang === 'en' ? ORIGINALITY_EN : LEGAL_ORIGINALITY_AR,
  };
}
