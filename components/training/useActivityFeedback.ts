'use client';

import { useRef } from 'react';
import { ActivityFeedbackAudio } from '@/lib/training/activityFeedbackAudio';

export function useActivityFeedback() {
  const audio = useRef<ActivityFeedbackAudio | null>(null);
  if (!audio.current) audio.current = new ActivityFeedbackAudio();
  return audio.current;
}
