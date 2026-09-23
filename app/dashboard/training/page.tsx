'use client';



import TrainingActiveChildHeader from '@/components/training/TrainingActiveChildHeader';

import TrainingPlanEntry from '@/components/training/TrainingPlanEntry';

import TrainingSessionResultsList from '@/components/training/TrainingSessionResultsList';



export default function TrainingDashboardPage() {

  return (

    <div className="px-4 py-8 sm:px-6">

      <TrainingActiveChildHeader />

      <TrainingPlanEntry />

      <TrainingSessionResultsList />

    </div>

  );

}

