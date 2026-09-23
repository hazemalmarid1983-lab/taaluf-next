'use client';

import CommunicationChoiceActivity from '@/components/training/communication/CommunicationChoiceActivity';
import { COMMUNICATION_LANGUAGE_CHAPTER_ID } from '@/lib/training/loadChapter';

export default function PointToItemPage() {
  return (
    <div className="-mx-4 sm:-mx-6">
      <CommunicationChoiceActivity
        chapterId={COMMUNICATION_LANGUAGE_CHAPTER_ID}
        mediaId="point-to-item"
        welcomeHintAr="المس الشيء المطلوب"
      />
    </div>
  );
}
