'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ActiveStudentProfile } from '@/lib/training/trainingResultsPresentation';
import {
  attachActiveTrainingStudentRefresh,
  readActiveTrainingStudentForUi,
} from '@/lib/training/trainingActiveChildUx';

export function useActiveTrainingStudent(): ActiveStudentProfile | null {
  const [profile, setProfile] = useState<ActiveStudentProfile | null>(null);

  const refresh = useCallback(() => {
    setProfile(readActiveTrainingStudentForUi());
  }, []);

  useEffect(() => {
    refresh();
    return attachActiveTrainingStudentRefresh(refresh);
  }, [refresh]);

  return profile;
}
