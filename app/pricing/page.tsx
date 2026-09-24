import { Suspense } from 'react';
import SubscriptionTierCards from '@/components/access/SubscriptionTierCards';
import PricingQuery from '@/app/pricing/PricingQuery';

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#F1F5F9] px-4 py-8">
      <Suspense fallback={<SubscriptionTierCards />}>
        <PricingQuery />
      </Suspense>
    </main>
  );
}
