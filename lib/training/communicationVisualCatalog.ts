/**
 * كatalog بصرية/صوتية للتواصل — طبقة محتوى فوق communicationChoiceEngine.
 * PROVISIONAL — تدريب رقمي؛ لا يثبت إتقاناً ميدانياً.
 */

import type { CommPictogramId } from '@/lib/training/communicationChoiceEngine';

export type CommunicationVisualPool = 'daily_needs' | 'actions' | 'scene_objects' | 'name_call';

export type CommunicationVisualSource =
  | { type: 'inline-svg'; assetId: string }
  | { type: 'static-image'; path: string };

export type CommunicationCatalogItem = {
  id: CommPictogramId;
  labelAr: string;
  spokenLabelAr: string;
  pool: CommunicationVisualPool;
  visual: CommunicationVisualSource;
  ariaLabelAr: string;
};

/** عناصر tap-to-request / pool daily_needs */
export const COMMUNICATION_DAILY_NEEDS_CATALOG: CommunicationCatalogItem[] = [
  {
    id: 'water',
    labelAr: 'ماء',
    spokenLabelAr: 'أريد ماء',
    pool: 'daily_needs',
    visual: { type: 'inline-svg', assetId: 'comm-ill-water' },
    ariaLabelAr: 'ماء — كوب ماء',
  },
  {
    id: 'food',
    labelAr: 'طعام',
    spokenLabelAr: 'أريد طعام',
    pool: 'daily_needs',
    visual: { type: 'inline-svg', assetId: 'comm-ill-food' },
    ariaLabelAr: 'طعام — وجبة',
  },
  {
    id: 'toy',
    labelAr: 'لعبة',
    spokenLabelAr: 'أريد لعبة',
    pool: 'daily_needs',
    visual: { type: 'inline-svg', assetId: 'comm-ill-toy' },
    ariaLabelAr: 'لعبة — دمية',
  },
  {
    id: 'book',
    labelAr: 'كتاب',
    spokenLabelAr: 'أريد كتاب',
    pool: 'daily_needs',
    visual: { type: 'inline-svg', assetId: 'comm-ill-book' },
    ariaLabelAr: 'كتاب',
  },
];

const BY_ID = new Map(
  COMMUNICATION_DAILY_NEEDS_CATALOG.map((item) => [item.id, item])
);

export function getCommunicationCatalogItem(
  id: CommPictogramId
): CommunicationCatalogItem | null {
  return BY_ID.get(id) ?? null;
}

export function listCommunicationCatalogForPool(
  pool: CommunicationVisualPool
): CommunicationCatalogItem[] {
  if (pool === 'daily_needs') {
    return [...COMMUNICATION_DAILY_NEEDS_CATALOG];
  }
  return [];
}

export function resolveTapToRequestSpokenPrompt(
  catalogItem: CommunicationCatalogItem
): string {
  return catalogItem.spokenLabelAr;
}
