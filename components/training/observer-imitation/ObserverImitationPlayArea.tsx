'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import ObserverImitationModelVisual from '@/components/training/observer-imitation/ObserverImitationModelVisual';
import { PROMPT_HIERARCHY_LEVELS, type PromptHierarchyLevel } from '@/lib/promptHierarchy';
import type { ObserverImitationMovementDefinition } from '@/lib/training/observerImitationCatalog';
import { buildObserverImitationTrialOutcome } from '@/lib/training/observerImitationObserverFlow';
import type { ObserverImitationTrialOutcome } from '@/lib/training/observerImitationEngine';
import { speakText, stopSpeaking } from '@/lib/sensoryAudio';

type TrialPhase = 'model' | 'perform' | 'observe' | 'reinforcement';

const OBSERVER_PROMPT_LEVELS: PromptHierarchyLevel[] = [
  'independent',
  'gestural',
  'verbal',
  'partial_physical',
  'full_physical',
  'no_response',
];

type Props = {
  movement: ObserverImitationMovementDefinition;
  trialNumber: number;
  totalTrials: number;
  modelDurationMs: number;
  replayAllowed: boolean;
  onTrialComplete: (outcome: ObserverImitationTrialOutcome) => void;
};

export default function ObserverImitationPlayArea({
  movement,
  trialNumber,
  totalTrials,
  modelDurationMs,
  replayAllowed,
  onTrialComplete,
}: Props) {
  const [phase, setPhase] = useState<TrialPhase>('model');
  const [modelReplays, setModelReplays] = useState(0);
  const [modelPlayKey, setModelPlayKey] = useState(0);
  const performStartedAt = useRef<number | null>(null);
  const [selectedPrompt, setSelectedPrompt] =
    useState<PromptHierarchyLevel | null>(null);
  const [reinforcementKind, setReinforcementKind] = useState<'success' | 'retry' | null>(
    null
  );

  const promptOptions = PROMPT_HIERARCHY_LEVELS.filter((item) =>
    OBSERVER_PROMPT_LEVELS.includes(item.level)
  );

  useEffect(() => {
    if (phase !== 'model') return undefined;
    stopSpeaking();
    void speakText(movement.titleAr, { lang: 'ar' });
    return () => {
      stopSpeaking();
    };
  }, [phase, movement.titleAr, modelPlayKey]);

  const replayModel = useCallback(() => {
    if (!replayAllowed || !movement.replayAllowed) return;
    setModelReplays((n) => n + 1);
    setModelPlayKey((k) => k + 1);
  }, [movement.replayAllowed, replayAllowed]);

  const goToPerform = () => {
    performStartedAt.current = Date.now();
    setPhase('perform');
  };

  const openObserve = () => {
    setSelectedPrompt(null);
    setPhase('observe');
  };

  const submitRecord = (success: boolean) => {
    if (!selectedPrompt) return;

    const elapsed =
      performStartedAt.current !== null
        ? Date.now() - performStartedAt.current
        : 0;

    const outcome = buildObserverImitationTrialOutcome({
      success,
      observerPromptLevel: selectedPrompt,
      responseTimeMs: elapsed,
      movementId: movement.movementId,
      movementCategory: movement.category,
      modelReplays,
    });

    setReinforcementKind(success ? 'success' : 'retry');
    setPhase('reinforcement');

    window.setTimeout(() => {
      onTrialComplete(outcome);
      setPhase('model');
      setModelReplays(0);
      setSelectedPrompt(null);
      setReinforcementKind(null);
      performStartedAt.current = null;
    }, 700);
  };

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col bg-gradient-to-b from-[#0f2a2e] via-[#163840] to-[#0b1f14] text-white"
      dir="rtl"
      data-model-duration-ms={modelDurationMs}
    >
      <div className="px-4 pt-4 text-center text-xs text-white/60">
        محاولة {trialNumber} من {totalTrials}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-32">
        {phase === 'model' && (
          <>
            <p className="mb-2 text-lg font-semibold text-[#a8e0ea]">شاهد النموذج</p>
            <ObserverImitationModelVisual movementId={movement.movementId} />
            <p className="mt-4 text-2xl font-bold">{movement.titleAr}</p>
            <p className="mt-2 max-w-sm text-sm text-white/75">
              {movement.instructionsAr}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {replayAllowed && movement.replayAllowed ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                  onClick={replayModel}
                >
                  إعادة النموذج
                  {modelReplays > 0 ? ` (${modelReplays})` : ''}
                </Button>
              ) : null}
              <Button
                type="button"
                className="bg-[#2E7D8E] hover:bg-[#256b79]"
                onClick={goToPerform}
              >
                الطفل ينفّذ الحركة
              </Button>
            </div>
          </>
        )}

        {phase === 'perform' && (
          <>
            <ObserverImitationModelVisual
              movementId={movement.movementId}
              className="h-[min(40vh,320px)] w-[min(40vh,320px)] opacity-40"
            />
            <p className="mt-6 text-2xl font-bold">نفّذ الحركة الآن</p>
            <p className="mt-2 text-sm text-white/70">{movement.titleAr}</p>
            <Button
              type="button"
              className="mt-8 bg-[#E5B86E] text-[#0b1f14] hover:bg-[#d4a85f]"
              onClick={openObserve}
            >
              تسجيل نتيجة المحاولة
            </Button>
          </>
        )}

        {phase === 'reinforcement' && (
          <div className="text-center">
            <p className="text-2xl font-bold">
              {reinforcementKind === 'success' ? 'أحسنت!' : 'نحاول مرة أخرى'}
            </p>
          </div>
        )}
      </div>

      {phase === 'observe' ? (
        <div className="fixed inset-x-0 bottom-0 z-20 max-h-[70dvh] overflow-y-auto rounded-t-3xl border-t border-white/20 bg-white px-4 py-5 text-[#0b1f14] shadow-2xl">
          <h2 className="text-lg font-bold">تسجيل نتيجة المحاولة</h2>
          <p className="mt-1 text-xs text-slate-600">
            اختر مستوى المساعدة الفعلية ثم نجاح/عدم النجاح. لا يُسجّل تلقائياً.
          </p>
          <fieldset className="mt-4 space-y-2">
            <legend className="sr-only">مستوى المساعدة</legend>
            {promptOptions.map((option) => (
              <label
                key={option.level}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 ${
                  selectedPrompt === option.level
                    ? 'border-[#2E7D8E] bg-[#2E7D8E]/10'
                    : 'border-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="observer-prompt"
                  checked={selectedPrompt === option.level}
                  onChange={() => setSelectedPrompt(option.level)}
                />
                <span className="text-sm font-medium">{option.labelAr}</span>
              </label>
            ))}
          </fieldset>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={!selectedPrompt}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => submitRecord(true)}
            >
              نجح
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!selectedPrompt}
              className="flex-1"
              onClick={() => submitRecord(false)}
            >
              لم ينجح
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
