'use client';

import { useState } from 'react';
import SensoryRoomShell from '@/components/sensory-hub/SensoryRoomShell';
import { useSensoryRoomSession } from '@/components/sensory-hub/useSensoryRoomSession';
import { useLanguage } from '@/components/LanguageProvider';
import { ANIMAL_CARDS } from '@/lib/sensoryHubAnimals';
import { speakText, stopSpeaking } from '@/lib/sensoryAudio';

export default function AnimalsSoundGardenRoom() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const session = useSensoryRoomSession('animals');
  const [activeId, setActiveId] = useState<string | null>(null);

  const pick = (id: string) => {
    const card = ANIMAL_CARDS.find((c) => c.id === id)!;
    setActiveId(id);
    session.bumpInteraction();
    stopSpeaking();
    session.audio.current?.playAnimalSound(session.settings, id);
    window.setTimeout(() => {
      speakText(isAr ? card.nameAr : card.nameEn, { lang, rate: 0.78 });
    }, 480);
    window.setTimeout(() => setActiveId(null), 700);
  };

  return (
    <SensoryRoomShell
      roomId="animals"
      titleAr="حديقة أصوات الحيوانات"
      titleEn="Animal sound garden"
      isAr={isAr}
      elapsedMs={session.elapsedMs}
      interactions={session.interactions}
      calmIndex={session.calmIndex}
      engagementIndex={session.engagementIndex}
      interactionRate={session.interactionRate}
      remainingSec={session.remainingSec}
      settings={session.settings}
      onSettingsChange={session.setSettings}
      onExit={session.exit}
      sessionPhase={session.sessionPhase}
      endReason={session.endReason}
      resultStats={session.resultStats}
      onReplay={session.replay}
      onExitGroup={session.exitGroup}
      className="bg-gradient-to-b from-emerald-950 to-lime-950"
    >
      <div className="absolute inset-0 flex items-center justify-center p-4 pt-20">
        <div className="grid w-full max-w-lg grid-cols-2 gap-4 sm:grid-cols-3">
          {ANIMAL_CARDS.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => pick(card.id)}
              className={`flex min-h-[120px] flex-col items-center justify-center rounded-3xl border-2 p-4 transition active:scale-95 ${
                activeId === card.id
                  ? 'scale-105 border-amber-300 bg-amber-400/20 shadow-lg shadow-amber-400/20'
                  : 'border-white/15 bg-white/10 hover:bg-white/15'
              }`}
            >
              <span className="text-5xl leading-none">{card.emoji}</span>
              <strong className="mt-2 text-sm font-black text-white">
                {isAr ? card.nameAr : card.nameEn}
              </strong>
              <span className="text-[10px] text-white/60">
                {isAr ? card.soundAr : card.soundEn}
              </span>
            </button>
          ))}
        </div>
      </div>
    </SensoryRoomShell>
  );
}
