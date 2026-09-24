'use client';

import { useCallback, useState } from 'react';
import {
  ACTIVITY_LEVEL_MAX,
  applyActivityLevelAttempt,
  initialActivityLevelRecord,
  loadStoredActivityLevel,
  saveActivityLevel,
  type ActivityLevelAttempt,
  type ActivityLevelRecord,
} from '@/lib/training/activityLevelGate';

export function useActivityLevelGate(input: {
  childId: string | null;
  mediaId: string;
  chapterId?: string;
  maxLevel?: number;
}) {
  const maxLevel = input.maxLevel ?? ACTIVITY_LEVEL_MAX;
  const [record, setRecord] = useState<ActivityLevelRecord>(initialActivityLevelRecord);
  const [loadedFor, setLoadedFor] = useState('');
  const key = input.childId ? `${input.childId}:${input.mediaId}` : '';

  if (key && loadedFor !== key && input.childId) {
    setLoadedFor(key);
    setRecord(
      loadStoredActivityLevel({
        childId: input.childId,
        mediaId: input.mediaId,
        chapterId: input.chapterId,
        maxLevel,
      })
    );
  }

  const recordAttempt = useCallback(
    (attempt: ActivityLevelAttempt) => {
      if (!input.childId) return;
      const childId = input.childId;
      setRecord((current) => {
        const next = applyActivityLevelAttempt(current, attempt, maxLevel);
        saveActivityLevel(childId, input.mediaId, next.record);
        return next.record;
      });
    },
    [input.childId, input.mediaId, maxLevel]
  );

  return { level: record.level, recordAttempt };
}
