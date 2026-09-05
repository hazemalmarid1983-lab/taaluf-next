import { CONSENT_LAYERS, REQUIRED_CONSENT_LAYERS } from '../lib/consentConstants';
import { nextCatItem, selectCatQueue } from '../lib/catLogic';
import {
  CHILD_VERBAL_ASSENT,
  LEGAL_COUNTRY_AR,
  LEGAL_DISCLAIMER_LOCATIONS_AR,
  LEGAL_DISCLAIMERS,
  LEGAL_HUB_VERSION,
  LEGAL_JURISDICTION_AR,
  LEGAL_VERSION,
  THREE_TIER_CONSENTS,
} from '../lib/legalContent';
import { getPrice } from '../lib/pricing';
import { CRITERIA_LIST } from '../types/taalof';

describe('القالب القانوني والعماني', () => {
  it('has four consent layers including video', () => {
    expect(CONSENT_LAYERS).toHaveLength(4);
    expect(REQUIRED_CONSENT_LAYERS).toHaveLength(3);
    expect(CONSENT_LAYERS.map((l) => l.type)).toEqual([
      'general_platform',
      'assessment',
      'data_privacy',
      'video_analysis',
    ]);
    expect(THREE_TIER_CONSENTS.platformConsent.fullText.length).toBeGreaterThan(
      80
    );
    expect(THREE_TIER_CONSENTS.dataConsent.fullText).toContain('سلطنة عمان');
  });

  it('exposes five live disclaimer slots', () => {
    expect(Object.keys(LEGAL_DISCLAIMERS)).toEqual([
      'registration',
      'preAssessment',
      'resultsBanner',
      'pdfFooter',
      'aiPrefix',
    ]);
    expect(LEGAL_DISCLAIMERS.pdfFooter).toContain('سلطنة عمان');
    expect(LEGAL_DISCLAIMERS.aiPrefix).toMatch(/اصطناعي/);
    expect(CHILD_VERBAL_ASSENT.length).toBeGreaterThan(20);
  });

  it('names Oman and the arbitration center', () => {
    expect(LEGAL_COUNTRY_AR).toBe('سلطنة عمان');
    expect(LEGAL_JURISDICTION_AR).toBe('المركز العماني للتحكيم التجاري');
    expect(LEGAL_VERSION).toBe('2.0-oman');
    expect(LEGAL_HUB_VERSION).toBe('1.0');
    expect(LEGAL_DISCLAIMER_LOCATIONS_AR).toHaveLength(5);
  });

  it('quotes the official OMR assessment price', () => {
    expect(getPrice('assessment', 'OMR')).toBe(25);
  });
});

describe('CAT queue', () => {
  it('starts with one item per domain then fills to 40', () => {
    const queue = selectCatQueue();
    expect(queue.length).toBe(CRITERIA_LIST.length);
    const firstDomains = new Set(queue.slice(0, 4).map((c) => c.domain));
    expect(firstDomains.size).toBe(4);
  });

  it('returns the next unanswered item', () => {
    const first = nextCatItem([]);
    expect(first).toBeTruthy();
    const second = nextCatItem([{ criterionId: first!.id, score: 3 }]);
    expect(second?.id).not.toBe(first!.id);
  });
});
