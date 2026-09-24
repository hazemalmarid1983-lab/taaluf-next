'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ActivityFocusShell from '@/components/training/ActivityFocusShell';
import FieldPromptRecordBar from '@/components/training/FieldPromptRecordBar';
import FollowStarVisual from '@/components/training/follow-star/FollowStarVisual';
import { useActivityFeedback } from '@/components/training/useActivityFeedback';
import type { PromptHierarchyLevel } from '@/lib/promptHierarchy';
import { shouldAutoFinishTrial } from '@/lib/training/activityResponsePolicy';
import {
  getFollowStarPath,
  getFollowStarTargetPoint,
  isFollowStarHit,
  resolveFollowStarTrialOutcome,
  shouldShowFollowStarVisualCue,
  type FollowStarRuntimeSettings,
  type FollowStarTrialOutcome,
} from '@/lib/training/followStarEngine';
import type { TrainingAssistanceStage } from '@/lib/training/assistanceSemantics';

type Props = {
  settings: FollowStarRuntimeSettings;
  trialNumber: number;
  totalTrials: number;
  pathOrderSeed: number;
  onTrialComplete: (outcome: FollowStarTrialOutcome) => void;
};

type TrialPhase = 'moving' | 'ready' | 'feedback';

export default function FollowStarPlayArea({
  settings,
  trialNumber,
  totalTrials,
  pathOrderSeed,
  onTrialComplete,
}: Props) {
  const arenaRef = useRef<HTMLDivElement>(null);
  const readyStartedAt = useRef<number | null>(null);
  const movementStartedAt = useRef<number>(0);
  const completedRef = useRef(false);
  const audio = useActivityFeedback();

  const path = getFollowStarPath(trialNumber, pathOrderSeed);
  const startPoint = path[0];
  const targetPoint = getFollowStarTargetPoint(path);

  const [phase, setPhase] = useState<TrialPhase>('moving');
  const [starPoint, setStarPoint] = useState(startPoint);
  const [assistanceStage, setAssistanceStage] =
    useState<TrainingAssistanceStage>('none');
  const [feedback, setFeedback] = useState<'success' | 'miss' | null>(null);
  const [pendingOutcome, setPendingOutcome] =
    useState<FollowStarTrialOutcome | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  const finishTrial = useCallback(
    (input: {
      tapped: boolean;
      hit: boolean;
      elapsedReadyMs: number;
    }) => {
      if (completedRef.current) return;
      completedRef.current = true;

      const movementMs = reducedMotion
        ? 0
        : Math.max(0, Date.now() - movementStartedAt.current);

      const outcome = resolveFollowStarTrialOutcome({
        promptingEnabled: settings.prompting,
        tapped: input.tapped,
        hit: input.hit,
        elapsedReadyMs: input.elapsedReadyMs,
        movementMs,
      });

      if (input.hit) audio.playSuccess();
      else audio.playIncorrect();
      setFeedback(input.hit ? 'success' : 'miss');
      setPendingOutcome(outcome);
      setPhase('feedback');
    },
    [audio, reducedMotion, settings.prompting]
  );

  const recordPrompt = (level: PromptHierarchyLevel) => {
    if (!pendingOutcome) return;
    onTrialComplete({ ...pendingOutcome, promptLevel: level });
    setPendingOutcome(null);
  };

  useEffect(() => {
    const pathForTrial = getFollowStarPath(trialNumber, pathOrderSeed);
    const start = pathForTrial[0];
    const target = getFollowStarTargetPoint(pathForTrial);

    completedRef.current = false;
    setPhase('moving');
    setStarPoint(start);
    setAssistanceStage('none');
    setFeedback(null);
    setPendingOutcome(null);
    movementStartedAt.current = Date.now();

    if (reducedMotion) {
      setStarPoint(target);
      setPhase('ready');
      readyStartedAt.current = Date.now();
      return;
    }

    const moveTimer = window.setTimeout(() => {
      setStarPoint(target);
      setPhase('ready');
      readyStartedAt.current = Date.now();
    }, settings.movementDurationMs);

    return () => window.clearTimeout(moveTimer);
  }, [trialNumber, pathOrderSeed, reducedMotion, settings.movementDurationMs]);

  useEffect(() => {
    if (!shouldAutoFinishTrial() || phase !== 'ready') return;

    const tick = window.setInterval(() => {
      if (readyStartedAt.current === null) return;
      const elapsed = Date.now() - readyStartedAt.current;
      if (elapsed >= settings.readyWindowMs) {
        finishTrial({
          tapped: false,
          hit: false,
          elapsedReadyMs: elapsed,
        });
      }
    }, 120);

    return () => window.clearInterval(tick);
  }, [finishTrial, phase, settings.readyWindowMs]);

  const handleArenaPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== 'ready' || completedRef.current || !arenaRef.current) return;
    audio.playTap();

    const rect = arenaRef.current.getBoundingClientRect();
    const tap = {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    };

    const hit = isFollowStarHit(tap, targetPoint, settings.hitRadiusPercent, {
      widthPx: rect.width,
      heightPx: rect.height,
    });
    const elapsedReadyMs =
      readyStartedAt.current === null
        ? 0
        : Date.now() - readyStartedAt.current;

    finishTrial({
      tapped: true,
      hit,
      elapsedReadyMs,
    });
  };

  const showVisualCue = shouldShowFollowStarVisualCue(assistanceStage);

  return (
    <ActivityFocusShell>
    <div
      className="relative flex h-full min-h-[100dvh] flex-col bg-gradient-to-b from-[#081224] via-[#0f2240] to-[#081224]"
      dir="rtl"
    >
      <div className="flex items-center justify-between px-5 pb-2 pt-5 sm:px-8">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalTrials}
          aria-valuenow={trialNumber}
          aria-label="تقدم المحاولات"
        >
          <div
            className="h-full rounded-full bg-[#E5B86E] transition-all duration-500"
            style={{ width: `${(trialNumber / totalTrials) * 100}%` }}
          />
        </div>
        <span className="ms-4 min-w-[3rem] text-sm font-semibold text-white/70">
          {trialNumber}/{totalTrials}
        </span>
      </div>

      <div
        ref={arenaRef}
        className="relative mx-4 mb-6 flex flex-1 touch-manipulation overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_50%_20%,rgba(46,125,142,0.18),transparent_55%),linear-gradient(180deg,#102038_0%,#0a1628_100%)] shadow-inner sm:mx-8"
        onPointerDown={handleArenaPointer}
        role="application"
        aria-label="مساحة اللعب — تابع النجمة ولمسها عند توقفها"
      >
        <div
          aria-hidden
          className={`pointer-events-none absolute z-20 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-[#fff3bf]/80 bg-gradient-to-br from-[#fff9e6]/20 to-[#ffd76a]/10 shadow-[0_0_40px_rgba(255,215,106,0.35)] motion-safe:transition-[left,top,transform] motion-safe:duration-[var(--move-ms)] motion-safe:ease-in-out ${
            showVisualCue ? 'motion-safe:animate-pulse ring-4 ring-[#2E7D8E]/60' : ''
          } ${feedback === 'success' ? 'scale-110 ring-4 ring-[#2D8B5A]/70' : ''} ${
            feedback === 'miss' ? 'opacity-70' : ''
          }`}
          style={{
            left: `${starPoint.x}%`,
            top: `${starPoint.y}%`,
            transitionDuration: reducedMotion
              ? '0ms'
              : `${settings.movementDurationMs}ms`,
          }}
        >
          <FollowStarVisual size={52} />
        </div>

        {showVisualCue && phase === 'ready' && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-sm font-semibold text-[#E5B86E]"
            aria-live="polite"
          >
            المس هنا
          </div>
        )}

        {feedback === 'success' && settings.reinforcement && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <div className="h-16 w-16 rounded-full bg-[#2D8B5A]/25 ring-4 ring-[#2D8B5A]/40 motion-safe:animate-pulse" />
          </div>
        )}
      </div>
      {pendingOutcome ? (
        <div className="px-4 pb-4 sm:px-8">
          <FieldPromptRecordBar onRecord={recordPrompt} />
        </div>
      ) : null}
    </div>
    </ActivityFocusShell>
  );
}