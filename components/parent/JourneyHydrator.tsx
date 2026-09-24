'use client';

import { useEffect } from 'react';
import { applyServerJourney } from '@/lib/childRoom/journeyClient';

export default function JourneyHydrator() {
  useEffect(() => {
    void applyServerJourney();
  }, []);
  return null;
}
