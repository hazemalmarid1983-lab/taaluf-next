'use client';

import { useEffect } from 'react';
import ClinicalBookingButton from '@/components/child-room/ClinicalBookingButton';
import RoomConversation from '@/components/child-room/RoomConversation';
import TeacherCorner from '@/components/child-room/TeacherCorner';
import TrainingActiveChildHeader from '@/components/training/TrainingActiveChildHeader';
import TrainingPlanEntry from '@/components/training/TrainingPlanEntry';
import TrainingSessionResultsList from '@/components/training/TrainingSessionResultsList';
import { readTeacherSession } from '@/lib/childRoom/gate';
import { saveActiveChild } from '@/lib/parentJourney';
import { useActiveTrainingStudent } from '@/lib/training/useActiveTrainingStudent';

export default function ChildRoomScreen() {
  const profile = useActiveTrainingStudent();

  useEffect(() => {
    const childId = new URLSearchParams(window.location.search).get('child');
    const session = readTeacherSession();
    if (!childId || !session?.childIds.includes(childId)) return;
    const stored = localStorage.getItem('taaluf.childRoom.invites.v1');
    let name = childId;
    try {
      const invites = JSON.parse(stored || '[]') as Array<{
        childId: string;
        childName: string;
      }>;
      name = invites.find((invite) => invite.childId === childId)?.childName || childId;
    } catch {
      name = childId;
    }
    saveActiveChild({ id: childId, name });
  }, []);

  return (
    <div className="px-4 py-8 sm:px-6">
      <TrainingActiveChildHeader />
      <p className="mx-auto mb-4 max-w-lg text-center text-xs leading-5 text-slate-500">
        غرفة مغلقة: يظهر تمرين الهدف الحالي فقط. بعد إكمال الجلسة تنتقل الغرفة إلى
        التمرين التالي. إكمال الجلسة الرقمية لا يعني إتقان المعيار.
      </p>
      <TrainingPlanEntry />
      {profile?.id ? (
        <ClinicalBookingButton childId={profile.id} childName={profile.name} />
      ) : null}
      <TrainingSessionResultsList />
      {profile?.id ? <RoomConversation childId={profile.id} /> : null}
      {profile?.id ? <TeacherCorner childId={profile.id} /> : null}
    </div>
  );
}
