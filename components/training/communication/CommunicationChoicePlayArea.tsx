'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PromptRecordingBar from '@/components/classroom/PromptRecordingBar';
import ActivityFocusShell from '@/components/training/ActivityFocusShell';
import CommPictogramVisual, {
  commPictogramAriaLabel,
} from '@/components/training/communication/CommPictogramVisual';
import { useActivityFeedback } from '@/components/training/useActivityFeedback';
import { shouldAutoFinishTrial } from '@/lib/training/activityResponsePolicy';
import {
  buildCommTrialSpec,
  resolveCommTrialOutcome,
  shouldPulseCommPrompt,
  type CommChoice,
  type CommRuntimeSettings,
  type CommTrialOutcome,
} from '@/lib/training/communicationChoiceEngine';
import type { PromptHierarchyLevel } from '@/lib/promptHierarchy';
import type { TrainingAssistanceStage } from '@/lib/training/assistanceSemantics';

type Props = {
  settings: CommRuntimeSettings;
  trialNumber: number;
  totalTrials: number;
  onTrialComplete: (outcome: CommTrialOutcome) => void;
  /** حجم بطاقات الخيارات (افتراضي: 88 شبكة / 110 مشهد) */
  choiceSizePx?: number;
};

type TrialPhase = 'choosing' | 'feedback';
type FeedbackKind = 'success' | 'miss' | 'timeout';

export default function CommunicationChoicePlayArea({
  settings,
  trialNumber,
  totalTrials,
  onTrialComplete,
  choiceSizePx,
}: Props) {
  const trialStartedAt = useRef(Date.now());
  const completedRef = useRef(false);
  const audio = useActivityFeedback();
  const assistanceStageRef = useRef<TrainingAssistanceStage>('none');
  const onTrialCompleteRef = useRef(onTrialComplete);

  onTrialCompleteRef.current = onTrialComplete;

  const trialSpec = useMemo(
    () => buildCommTrialSpec(settings, trialNumber),
    [settings, trialNumber]
  );
  const trialSpecRef = useRef(trialSpec);
  trialSpecRef.current = trialSpec;

  const defaultChoiceSize =
    trialSpec.layout === 'scene' ? 148 : 132;
  const choiceVisualSize = choiceSizePx ?? defaultChoiceSize;

  const [phase, setPhase] = useState<TrialPhase>('choosing');
  const [feedback, setFeedback] = useState<FeedbackKind | null>(null);
  const [assistanceStage, setAssistanceStage] =
    useState<TrainingAssistanceStage>('none');
  const [displayedChoices, setDisplayedChoices] = useState<CommChoice[]>(
    trialSpec.choices
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingOutcome, setPendingOutcome] = useState<CommTrialOutcome | null>(
    null
  );

  useEffect(() => {
    completedRef.current = false;
    trialStartedAt.current = Date.now();
    assistanceStageRef.current = 'none';
    setPhase('choosing');
    setFeedback(null);
    setAssistanceStage('none');
    setSelectedId(null);
    setPendingOutcome(null);
    setDisplayedChoices(trialSpec.choices);

    if (settings.mode === 'name_orienting' && typeof window !== 'undefined') {
      try {
        const u = new SpeechSynthesisUtterance('اسمك');
        u.lang = 'ar';
        window.speechSynthesis.speak(u);
      } catch {
        /* optional audio */
      }
    }
  }, [trialNumber, settings, trialSpec.choices]);

  const finishTrial = useCallback(
    (outcome: CommTrialOutcome, kind: FeedbackKind) => {
      if (completedRef.current) return;
      completedRef.current = true;

      if (kind === 'success') audio.playSuccess();
      else if (kind === 'miss') audio.playIncorrect();
      setFeedback(kind);
      setPhase('feedback');
      setPendingOutcome(outcome);
    },
    [audio]
  );

  const recordPrompt = (level: PromptHierarchyLevel) => {
    if (!pendingOutcome) return;
    onTrialCompleteRef.current({ ...pendingOutcome, promptLevel: level });
    setPendingOutcome(null);
  };

  useEffect(() => {
    if (!shouldAutoFinishTrial() || phase !== 'choosing') return;

    const tick = window.setInterval(() => {
      if (completedRef.current) return;
      const spec = trialSpecRef.current;
      const elapsed = Date.now() - trialStartedAt.current;
      if (elapsed >= spec.responseWindowMs) {
        window.clearInterval(tick);
        finishTrial(
          resolveCommTrialOutcome({
            spec,
            choiceId: null,
            elapsedMs: elapsed,
            prompting: settings.prompting,
            timedOut: true,
          }),
          'timeout'
        );
      }
    }, 200);

    return () => window.clearInterval(tick);
  }, [finishTrial, phase, settings.prompting, trialSpec.responseWindowMs]);

  const handlePick = useCallback(
    (choiceId: string) => {
      if (phase !== 'choosing' || completedRef.current) return;
      audio.playTap();
      setSelectedId(choiceId);
      const spec = trialSpecRef.current;
      const elapsed = Date.now() - trialStartedAt.current;
      const outcome = resolveCommTrialOutcome({
        spec,
        choiceId,
        elapsedMs: elapsed,
        prompting: settings.prompting,
        timedOut: false,
      });
      finishTrial(outcome, outcome.correct ? 'success' : 'miss');
    },
    [audio, finishTrial, phase, settings.prompting]
  );

  const pulsePrompt = shouldPulseCommPrompt(assistanceStage);
  const showAssistanceHint =
    phase === 'choosing' && assistanceStage === 'direct_visual_assistance';

  return (
    <ActivityFocusShell>
    <div
      className="flex h-full min-h-[100dvh] flex-col overflow-hidden bg-gradient-to-b from-[#F7FAFC] to-[#E2EEF3] px-4 py-4"
      dir="rtl"
    >
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <p className="text-center text-xs text-slate-500">
          {trialNumber} / {totalTrials}
        </p>
        <div
          className={`mt-3 flex flex-col items-center gap-3 rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm ${
            pulsePrompt && phase === 'choosing' ? 'animate-pulse' : ''
          } ${phase === 'feedback' && feedback === 'timeout' ? 'opacity-80' : ''}`}
        >
          <CommPictogramVisual item={trialSpec.target} sizePx={280} highlighted />
          <p className="text-xl font-bold text-slate-800">
            {trialSpec.promptLabelAr}
          </p>
        </div>

        <div
          className={`mt-4 grid min-h-0 gap-3 ${
            displayedChoices.length <= 2
              ? 'grid-cols-1 gap-6 sm:grid-cols-2'
              : trialSpec.layout === 'scene'
                ? 'grid-cols-2'
                : 'grid-cols-2 sm:grid-cols-3'
          } ${phase === 'feedback' ? 'pointer-events-none opacity-75' : ''}`}
        >
          {displayedChoices.map((choice) => {
            const isSelected = selectedId === choice.id;
            const showSuccess =
              phase === 'feedback' &&
              feedback === 'success' &&
              choice.isCorrect;
            const showWrong =
              phase === 'feedback' && feedback === 'miss' && isSelected;

            return (
              <button
                key={choice.id}
                type="button"
                disabled={phase !== 'choosing'}
                className={`flex flex-col items-center justify-center rounded-3xl border-2 bg-white shadow-md transition focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#2E7D8E] ${
                  choiceVisualSize >= 120 ? 'min-h-[10rem] p-5 sm:p-6' : 'p-4'
                } ${
                  showSuccess
                    ? 'border-[#3A9B6E] bg-[#3A9B6E]/10 ring-4 ring-[#3A9B6E]/25'
                    : showWrong
                      ? 'border-[#C94C4C] bg-[#C94C4C]/8'
                      : 'border-transparent hover:border-[#2E7D8E]/40'
                }`}
                aria-label={commPictogramAriaLabel(choice.item)}
                onClick={() => handlePick(choice.id)}
              >
                <CommPictogramVisual
                  item={choice.item}
                  sizePx={choiceVisualSize}
                  highlighted={showSuccess}
                  assistanceHint={
                    showAssistanceHint &&
                    choice.isCorrect &&
                    !showSuccess &&
                    !showWrong
                  }
                />
              </button>
            );
          })}
        </div>

        {feedback === 'timeout' && (
          <p
            className="mt-8 text-center text-lg font-bold text-slate-700"
            aria-live="polite"
          >
            انتهى الوقت — لم يتم اختيار إجابة
          </p>
        )}
        {feedback === 'success' && settings.reinforcement && (
          <p
            className="mt-6 text-center text-sm font-medium text-[#3A9B6E]"
            aria-live="polite"
          >
            أحسنت!
          </p>
        )}
        {feedback === 'miss' && (
          <p
            className="mt-6 text-center text-sm font-medium text-[#9B6B4C]"
            aria-live="polite"
          >
            حاول مرة أخرى
          </p>
        )}
        {pendingOutcome ? (
          <div className="mx-auto mt-6 w-full max-w-2xl" aria-label="تسجيل مستوى المساعدة">
            <PromptRecordingBar isAr visible onRecord={recordPrompt} />
          </div>
        ) : null}
      </div>
    </div>
    </ActivityFocusShell>
  );
}
