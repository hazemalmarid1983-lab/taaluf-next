'use client';

import PromptRecordingBar from '@/components/classroom/PromptRecordingBar';
import type { PromptHierarchyLevel } from '@/lib/promptHierarchy';

/** شريط تسجيل المساعدة البشرية بعد استجابة الطفل في التدريب الميداني. */
export default function FieldPromptRecordBar({
  onRecord,
}: {
  onRecord: (level: PromptHierarchyLevel) => void;
}) {
  return (
    <div className="w-full max-w-2xl" aria-label="تسجيل مستوى المساعدة">
      <PromptRecordingBar isAr visible onRecord={onRecord} />
    </div>
  );
}
