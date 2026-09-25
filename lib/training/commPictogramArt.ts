/** عناصر التمرين البصري التي لها رسم واضح بدل المربع الملوّن. */
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

export function hasCommPictogramArt(id: string): id is CommPictogramArtId {
  return (COMM_PICTOGRAM_ART_IDS as readonly string[]).includes(id);
}
