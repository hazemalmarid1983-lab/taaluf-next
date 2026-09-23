'use client';

import CommunicationChoiceActivity from '@/components/training/communication/CommunicationChoiceActivity';
import { COMMUNICATION_LANGUAGE_CHAPTER_ID } from '@/lib/training/loadChapter';

export default function SymbolBoardRequestPage() {
  return (
    <div className="-mx-4 sm:-mx-6">
      <CommunicationChoiceActivity
        chapterId={COMMUNICATION_LANGUAGE_CHAPTER_ID}
        mediaId="symbol-board-request"
        welcomeHintAr="اختر الرمز للطلب"
      />
    </div>
  );
}
