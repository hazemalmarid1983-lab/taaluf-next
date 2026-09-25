'use client';



import { useCallback, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import CommunicationChoiceComplete from '@/components/training/communication/CommunicationChoiceComplete';

import TapToRequestComplete from '@/components/training/communication/TapToRequestComplete';

import CommunicationChoicePlayArea from '@/components/training/communication/CommunicationChoicePlayArea';

import TapToRequestPlayArea from '@/components/training/communication/TapToRequestPlayArea';

import CommunicationChoiceWelcome from '@/components/training/communication/CommunicationChoiceWelcome';

import PlanActivityGuardMessage from '@/components/training/PlanActivityGuardMessage';

import { withChosenPostSessionMood } from '@/components/training/PostSessionMoodHost';
import { useActivityLevelGate } from '@/components/training/useActivityLevelGate';

import { childFacingStars } from '@/lib/training/followStarEngine';

import {

  calculateSessionMetrics,

  requireTrainingMedia,

  resolveMediaRuntimeConfig,

} from '@/lib/training/engine';

import { loadChapterById } from '@/lib/training/loadChapter';

import { buildCommTrialSpec, commSettingsForLevel, resolveCommRuntimeSettings } from '@/lib/training/communicationChoiceEngine';

import {

  beginCommChoiceSession,

  commitCommChoiceTrial,

  finalizeCommChoiceSession,

  isCommChoiceSessionComplete,

  startCommChoiceTrial,

} from '@/lib/training/communicationChoiceSessionFlow';

import { prepareLiveActivitySession } from '@/lib/training/liveSessionDraft';

import type { CommTrialOutcome } from '@/lib/training/communicationChoiceEngine';

import {

  persistSessionAndAdvancePlan,

  preparePlanActivityBegin,

  resolveTrainingActivityCompletionHref,

} from '@/lib/training/planActivityIntegration';

import { readActiveTrainingChildId } from '@/lib/training/sessionPersistence';

import {

  metricsForCompletedSession,

  resolveTapToRequestDoneHref,

  resolveTapToRequestSessionChildId,

  shouldUseTapToRequestCompleteScreen,

  TAP_TO_REQUEST_MEDIA_ID,

} from '@/lib/training/tapToRequestCompletion';

import type { TrainingSessionRuntime } from '@/lib/training/engine/types';



type Props = {

  chapterId: string;

  mediaId: string;

  welcomeHintAr?: string;

  /** حجم بطاقات الخيارات — نشاط tap-to-request فقط حاليًا */

  choiceSizePx?: number;

};



type Phase = 'welcome' | 'playing' | 'complete' | 'blocked';

type BlockReason = 'missing_child' | 'invalid_launch';



export default function CommunicationChoiceActivity({

  chapterId,

  mediaId,

  welcomeHintAr = 'المس الصورة المناسبة',

  choiceSizePx,

}: Props) {

  const router = useRouter();

  const media = useMemo(() => {

    const chapter = loadChapterById(chapterId);

    return requireTrainingMedia(chapter, mediaId);

  }, [chapterId, mediaId]);



  const [phase, setPhase] = useState<Phase>('welcome');

  const [sessionBundle, setSessionBundle] = useState<ReturnType<

    typeof beginCommChoiceSession

  > | null>(null);

  const [session, setSession] = useState<TrainingSessionRuntime | null>(null);

  const [resultStars, setResultStars] = useState(1);

  const [sessionSaved, setSessionSaved] = useState(true);

  const [blockReason, setBlockReason] = useState<BlockReason | null>(null);

  const [activeChildId, setActiveChildId] = useState<string | null>(null);

  const { level, recordSession } = useActivityLevelGate({
    childId: activeChildId,
    mediaId: media.mediaId,
    chapterId,
  });



  const welcomeSample = useMemo(() => {

    const config = resolveMediaRuntimeConfig(media);

    const settings = resolveCommRuntimeSettings(config);

    return buildCommTrialSpec(settings, 1).target;

  }, [media]);



  const completedMetrics = useMemo(() => {

    if (!session || session.status !== 'completed') return null;

    return metricsForCompletedSession(session);

  }, [session]);



  const handleStart = useCallback(async () => {

    const begin = preparePlanActivityBegin({ pageMediaId: media.mediaId });

    if (!begin.ok) {

      setBlockReason(begin.reason);

      setPhase('blocked');

      return;

    }



    const childResolution = resolveTapToRequestSessionChildId({

      mediaId: media.mediaId,

      beginChildId: begin.childId,

      activeChildId: readActiveTrainingChildId(),

      planId: begin.planId,

    });



    if (!childResolution.ok) {

      setBlockReason(

        childResolution.reason === 'child_mismatch'

          ? 'invalid_launch'

          : 'missing_child'

      );

      setPhase('blocked');

      return;

    }



    setActiveChildId(childResolution.childId);

    const bundle = beginCommChoiceSession({

      childId: childResolution.childId,

      chapterId,

      media,

      planId: begin.planId,

      goalIds: begin.goalIds,

      sessionDifficulty: begin.sessionDifficulty,

    });

    const opened = prepareLiveActivitySession(bundle.session, startCommChoiceTrial);

    if (opened.action === 'finalize') {
      const nextSession = finalizeCommChoiceSession(opened.session);
      const metrics = calculateSessionMetrics(nextSession.trials);
      setResultStars(childFacingStars(metrics.accuracy));

      const withMood = await withChosenPostSessionMood(nextSession);
      try {
        persistSessionAndAdvancePlan(withMood);
        setSessionSaved(true);
      } catch (error) {
        console.error('[taaluf-training] persist session failed', error);
        setSessionSaved(false);
      }

      setSession(withMood);
      setPhase('complete');
      return;
    }

    const started = opened.session;

    setSessionBundle({ ...bundle, session: started });

    setSession(started);

    setPhase('playing');

  }, [chapterId, media]);



  const handleTrialComplete = useCallback(

    async (outcome: CommTrialOutcome) => {

      if (!session) return;

      let nextSession = commitCommChoiceTrial(session, outcome);



      if (isCommChoiceSessionComplete(nextSession)) {

        nextSession = finalizeCommChoiceSession(nextSession);

        recordSession(nextSession.trials);

        const metrics = calculateSessionMetrics(nextSession.trials);

        setResultStars(childFacingStars(metrics.accuracy));



        const withMood = await withChosenPostSessionMood(nextSession);

        try {

          persistSessionAndAdvancePlan(withMood);

          setSessionSaved(true);

        } catch (error) {

          console.error('[taaluf-training] persist session failed', error);

          setSessionSaved(false);

        }



        setSession(withMood);

        setPhase('complete');

        return;

      }



      nextSession = startCommChoiceTrial(nextSession);

      setSession(nextSession);

    },

    [recordSession, session]

  );



  const handleDone = useCallback(() => {

    if (mediaId === TAP_TO_REQUEST_MEDIA_ID) {

      router.push(resolveTapToRequestDoneHref(mediaId));

      return;

    }

    router.push(resolveTrainingActivityCompletionHref(session?.planId));

  }, [router, session?.planId, mediaId]);



  if (phase === 'blocked' && blockReason) {

    return <PlanActivityGuardMessage reason={blockReason} />;

  }



  if (phase === 'welcome') {

    return (

      <CommunicationChoiceWelcome

        title={media.titleAr}

        sample={welcomeSample}

        hintAr={welcomeHintAr}

        onStart={handleStart}

      />

    );

  }



  if (phase === 'complete' && session) {

    if (shouldUseTapToRequestCompleteScreen(mediaId, session, phase)) {

      const metrics = completedMetrics ?? metricsForCompletedSession(session);

      return (

        <TapToRequestComplete

          sessionId={session.id}

          stars={resultStars}

          sessionSaved={sessionSaved}

          metrics={metrics}

          onDone={handleDone}

        />

      );

    }



    return (

      <CommunicationChoiceComplete

        stars={resultStars}

        sessionSaved={sessionSaved}

        onDone={handleDone}

      />

    );

  }



  if (phase === 'playing' && session && sessionBundle) {

    const trialNumber =

      session.activeTrialNumber ?? session.trials.length + 1;



    if (mediaId === 'tap-to-request') {

      return (

        <TapToRequestPlayArea

          settings={commSettingsForLevel(sessionBundle.settings, level)}

          level={level}

          sessionSeed={session.id}

          trialNumber={trialNumber}

          totalTrials={session.targetTrialCount}

          onTrialComplete={handleTrialComplete}

        />

      );

    }



    return (

      <CommunicationChoicePlayArea

        settings={commSettingsForLevel(sessionBundle.settings, level)}

        level={level}

        trialNumber={trialNumber}

        totalTrials={session.targetTrialCount}

        onTrialComplete={handleTrialComplete}

        choiceSizePx={choiceSizePx}

      />

    );

  }



  return null;

}


