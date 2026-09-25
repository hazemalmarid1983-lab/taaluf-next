/**
 * عناصر التمرين البصري التي لها رسم كرتوني ملون في المحرك المركزي.
 */

import {
  EDUCATIONAL_ASSET_IDS,
  isEducationalAssetId,
  resolveEducationalAssetId,
} from '@/lib/visuals/educationalAssets';

export const COMM_PICTOGRAM_ART_IDS = [
  'car',
  'cup',
  'ball',
  'book',
  'water',
  'food',
  'toy',
  'come',
  'sit',
  'give',
  'face_child',
  'face_adult',
] as const;

export type CommPictogramArtId = (typeof COMM_PICTOGRAM_ART_IDS)[number];

export function hasCommPictogramArt(id: string): boolean {
  return Boolean(resolveEducationalAssetId(id)) || isEducationalAssetId(id);
}

export { EDUCATIONAL_ASSET_IDS };
