'use client';

import { useSearchParams } from 'next/navigation';
import SubscriptionTierCards from '@/components/access/SubscriptionTierCards';

export default function PricingQuery() {
  const params = useSearchParams();
  return <SubscriptionTierCards fromScreening={params.get('from') === 'screening'} />;
}
