'use client';



import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import PromptRecordingBar from '@/components/classroom/PromptRecordingBar';

import CommunicationVisualCard, {

  type CommunicationVisualCardState,

} from '@/components/training/communication/CommunicationVisualCard';

import {

  type CommChoice,

  type CommRuntimeSettings,

  type CommTrialOutcome,

} from '@/lib/training/communicationChoiceEngine';

import {

  getCommunicationCatalogItem,

  resolveTapToRequestSpokenPrompt,

} from '@/lib/training/communicationVisualCatalog';

import type { PromptHierarchyLevel } from '@/lib/promptHierarchy';

import {

  buildOutcomeAfterObserverRecord,

  buildTapToRequestTrialSpec,

  onChildTapChoice,

  onObserverOpenRecording,

  resolveTapToRequestDisplayedChoices,

  type TapToRequestPendingTrial,

  type TapToRequestPhase,

} from '@/lib/training/tapToRequestObserverFlow';

import { speakText, stopSpeaking } from '@/lib/sensoryAudio';



type Props = {

  settings: CommRuntimeSettings;

  sessionSeed: string;

  trialNumber: number;

  totalTrials: number;

  onTrialComplete: (outcome: CommTrialOutcome) => void;

};



type ChildFeedbackKind = 'success' | 'miss';



const PROMPT_VISUAL_PX = 160;

const CHOICE_VISUAL_PX = 128;



export default function TapToRequestPlayArea({

  settings,

  sessionSeed,

  trialNumber,

  totalTrials,

  onTrialComplete,

}: Props) {

  const trialStartedAt = useRef(Date.now());

  const sessionCommittedRef = useRef(false);

  const onTrialCompleteRef = useRef(onTrialComplete);

  const lastSpokenTrialRef = useRef<string | null>(null);



  onTrialCompleteRef.current = onTrialComplete;



  const trialSpec = useMemo(

    () => buildTapToRequestTrialSpec(settings, trialNumber, sessionSeed),

    [settings, trialNumber, sessionSeed]

  );

  const trialSpecRef = useRef(trialSpec);

  trialSpecRef.current = trialSpec;



  const displayedChoices = useMemo(

    () => resolveTapToRequestDisplayedChoices(trialSpec),

    [trialSpec]

  );



  const targetCatalog = useMemo(

    () => getCommunicationCatalogItem(trialSpec.target.id),

    [trialSpec.target.id]

  );



  const spokenPrompt = targetCatalog

    ? resolveTapToRequestSpokenPrompt(targetCatalog)

    : trialSpec.promptLabelAr;



  const [phase, setPhase] = useState<TapToRequestPhase>('choosing');

  const [pending, setPending] = useState<TapToRequestPendingTrial | null>(null);

  const [childFeedback, setChildFeedback] = useState<ChildFeedbackKind | null>(

    null

  );

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [reducedMotion, setReducedMotion] = useState(false);



  useEffect(() => {

    setReducedMotion(

      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    );

  }, []);



  const speakPrompt = useCallback(() => {

    if (!spokenPrompt.trim()) return;

    speakText(spokenPrompt, { lang: 'ar', rate: 0.82 });

  }, [spokenPrompt]);



  useEffect(() => {

    sessionCommittedRef.current = false;

    trialStartedAt.current = Date.now();

    setPhase('choosing');

    setPending(null);

    setChildFeedback(null);

    setSelectedId(null);



    const trialKey = `${trialNumber}-${trialSpec.target.id}`;

    if (lastSpokenTrialRef.current !== trialKey) {

      lastSpokenTrialRef.current = trialKey;

      speakPrompt();

    }



    return () => stopSpeaking();

  }, [trialNumber, settings, trialSpec.target.id, speakPrompt]);



  const commitAfterChildFeedback = useCallback(

    (outcome: CommTrialOutcome, feedback: ChildFeedbackKind) => {

      if (sessionCommittedRef.current) return;

      sessionCommittedRef.current = true;

      stopSpeaking();

      setChildFeedback(feedback);



      const delay =

        settings.reinforcement && feedback === 'success' ? 700 : 450;



      window.setTimeout(() => {

        onTrialCompleteRef.current(outcome);

      }, reducedMotion ? Math.min(delay, 150) : delay);

    },

    [reducedMotion, settings.reinforcement]

  );



  const handlePick = useCallback(

    (choiceId: string) => {

      if (phase !== 'choosing') return;

      const elapsed = Date.now() - trialStartedAt.current;

      const next = onChildTapChoice({

        phase,

        spec: trialSpecRef.current,

        choiceId,

        elapsedMs: elapsed,

      });

      if (!next) return;

      setSelectedId(choiceId);

      setPhase(next.phase);

      setPending(next.pending);

    },

    [phase]

  );



  const handleObserverOpen = useCallback(() => {

    const next = onObserverOpenRecording({ phase });

    if (!next) return;

    setPhase(next.phase);

    setPending(next.pending);

  }, [phase]);



  const handleObserverRecord = useCallback(

    (level: PromptHierarchyLevel) => {

      const elapsedMsAtRecord = Date.now() - trialStartedAt.current;

      const result = buildOutcomeAfterObserverRecord({

        phase,

        pending,

        spec: trialSpecRef.current,

        observerLevel: level,

        elapsedMsAtRecord,

      });

      if (!result) return;



      setPhase(result.phase);

      const feedback: ChildFeedbackKind = result.outcome.correct

        ? 'success'

        : 'miss';

      commitAfterChildFeedback(result.outcome, feedback);

    },

    [phase, pending, commitAfterChildFeedback]

  );



  const choicesLocked = phase !== 'choosing';

  const showObserverBar = phase === 'awaiting_observer';



  function cardState(choice: CommChoice): CommunicationVisualCardState {

    if (phase === 'child_feedback' && childFeedback === 'success' && choice.isCorrect) {

      return 'selected-correct';

    }

    if (

      phase === 'child_feedback' &&

      childFeedback === 'miss' &&

      selectedId === choice.id

    ) {

      return 'selected-incorrect';

    }

    if (phase === 'awaiting_observer' && selectedId === choice.id) {

      return choice.isCorrect ? 'selected-correct' : 'selected-incorrect';

    }

    return 'default';

  }



  return (

    <div

      className="flex min-h-[100dvh] flex-col bg-[#F4F7FA] px-4 py-6 pb-32 sm:px-8"

      dir="rtl"

    >

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">

        <p className="text-center text-xs text-slate-500">

          {trialNumber} / {totalTrials}

        </p>



        <section className="mt-4 flex flex-col items-center text-center" aria-label="الطلب">

          <p className="mb-2 text-sm font-semibold tracking-wide text-[#2E7D8E]">

            مطلوب

          </p>

          <div

            className="flex w-full max-w-md flex-col items-center gap-4 rounded-[2rem] border border-white bg-white px-6 py-8 shadow-[0_16px_48px_rgba(15,23,42,0.06)]"

          >

            {targetCatalog ? (

              <CommunicationVisualCard

                item={targetCatalog}

                sizePx={PROMPT_VISUAL_PX}

                state="default"

                as="div"

              />

            ) : null}

            <p className="text-2xl font-bold text-slate-800">{spokenPrompt}</p>

            <button

              type="button"

              className="inline-flex items-center gap-2 rounded-full border border-[#2E7D8E]/25 bg-[#2E7D8E]/8 px-5 py-2.5 text-sm font-bold text-[#2E7D8E] transition hover:bg-[#2E7D8E]/12 focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#2E7D8E]/40"

              onClick={() => speakPrompt()}

              aria-label="استمع إلى الطلب"

            >

              استمع

            </button>

          </div>

        </section>



        <div className="my-6 flex justify-center" aria-hidden>

          <span className="h-10 w-px bg-gradient-to-b from-[#2E7D8E]/30 to-transparent" />

        </div>



        <section className="flex flex-1 flex-col items-center" aria-label="اختيارات">

          <p className="mb-4 text-sm font-medium text-slate-600">اختر ما يناسب الطلب</p>

          <div

            className={`flex w-full max-w-xl flex-wrap items-stretch justify-center gap-6 sm:gap-8 ${

              choicesLocked ? 'pointer-events-none opacity-95' : ''

            }`}

          >

            {displayedChoices.map((choice) => {

              const catalog = getCommunicationCatalogItem(choice.item.id);

              if (!catalog) return null;

              return (

                <CommunicationVisualCard

                  key={choice.id}

                  item={catalog}

                  sizePx={CHOICE_VISUAL_PX}

                  state={cardState(choice)}

                  as="button"

                  disabled={choicesLocked}

                  onClick={() => handlePick(choice.id)}

                />

              );

            })}

          </div>

        </section>



        {phase === 'child_feedback' && childFeedback === 'success' && settings.reinforcement && (

          <p

            className="mt-8 text-center text-base font-medium text-emerald-700"

            aria-live="polite"

          >

            أحسنت!

          </p>

        )}

        {phase === 'child_feedback' && childFeedback === 'miss' && (

          <p

            className="mt-8 text-center text-base font-medium text-amber-800/90"

            aria-live="polite"

          >

            حاول مرة أخرى

          </p>

        )}

      </div>



      <div

        className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-300/80 bg-slate-100/95 px-3 py-3 shadow-[0_-8px_32px_rgba(15,23,42,0.08)] backdrop-blur-md sm:px-6"

        aria-label="منطقة المراقب"

      >

        {phase === 'choosing' ? (

          <div className="mx-auto mb-2 flex max-w-2xl justify-end">

            <button

              type="button"

              className="rounded-full border border-slate-400/60 bg-white px-4 py-2 text-[11px] font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"

              onClick={handleObserverOpen}

            >

              للمراقب: تسجيل درجة المساعدة

            </button>

          </div>

        ) : null}



        <div className="mx-auto max-w-2xl">

          <PromptRecordingBar
            isAr
            visible={showObserverBar}
            onRecord={handleObserverRecord}
          />

        </div>

        {showObserverBar ? (

          <p className="mx-auto mt-2 max-w-2xl text-center text-[10px] text-slate-500">

            بعد اختيار درجة المساعدة تنتقل المحاولة التالية.

          </p>

        ) : null}

      </div>

    </div>

  );

}


