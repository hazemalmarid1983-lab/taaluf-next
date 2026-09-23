'use client';

import PromptRecordingBar from '@/components/classroom/PromptRecordingBar';
import type { PromptHierarchyLevel } from '@/lib/promptHierarchy';

/** لم يعد غطاءً وسط الشاشة. الاختيار يثبت في الركن السفلي الأيسر. */
export default function PromptSelectionOverlay({
  isAr,
  onSelect,
}: {
  isAr: boolean;
  onSelect: (level: PromptHierarchyLevel) => void;
}) {
  return <PromptRecordingBar isAr={isAr} visible onRecord={onSelect} />;
}
