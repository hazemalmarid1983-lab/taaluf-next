'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  clampSensorySettings,
  formatSessionClock,
  type SensoryHubSettings,
  type SensoryRoomId,
} from '@/lib/sensoryHub';
import {
  holdExitProgress,
  SENSORY_FOCUS_BODY_CLASS,
  SENSORY_FOCUS_EXIT_HOLD_MS,
} from '@/lib/sensoryFocusMode';
import SensoryReinforcerBanner from '@/components/sensory-hub/SensoryReinforcerBanner';
import {
  SensoryImmersiveContext,
  type SensoryImmersiveContextValue,
} from '@/components/sensory-hub/SensoryImmersiveContext';
import { useSensoryFullscreen } from '@/components/sensory-hub/useSensoryFullscreen';
import { SENSORY_VIEWPORT_LAYER_CLASS } from '@/lib/sensoryFullscreen';
import SensorySessionResultsPanel, {
  type SensorySessionResultStat,
} from '@/components/sensory-hub/SensorySessionResultsPanel';
import type { SensorySessionEndReason } from '@/lib/sensorySessionEnd';
import type { SensorySessionPhase } from '@/components/sensory-hub/useSensoryRoomSession';

export type SensoryHubSettingsPanelProps = {
  settings: SensoryHubSettings;
  onChange: (settings: SensoryHubSettings) => void;
  isAr: boolean;
  onClose: () => void;
};

export function SensoryHubSettingsPanel({
  settings,
  onChange,
  isAr,
  onClose,
}: SensoryHubSettingsPanelProps) {
  const set = (patch: Partial<SensoryHubSettings>) =>
    onChange(clampSensorySettings({ ...settings, ...patch }));

  return (
    <div className="absolute inset-x-4 top-16 z-40 mx-auto max-w-sm rounded-2xl border border-white/15 bg-slate-900/92 p-4 shadow-2xl backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <strong className="text-xs font-black text-white">
          {isAr ? 'إعدادات الجلسة' : 'Session settings'}
        </strong>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-2 py-1 text-[10px] font-bold text-slate-300 hover:bg-white/10"
        >
          {isAr ? 'إغلاق' : 'Close'}
        </button>
      </div>

      <label className="mb-3 block text-[10px] font-bold text-slate-300">
        {isAr ? 'مستوى الصوت' : 'Volume'}
        <input
          type="range"
          min={8}
          max={78}
          value={Math.round(settings.volume * 100)}
          onChange={(e) => set({ volume: Number(e.target.value) / 100 })}
          className="mt-1 w-full accent-cyan-400"
        />
      </label>

      <label className="mb-3 block text-[10px] font-bold text-slate-300">
        {isAr ? 'سطوع الألوان' : 'Color brightness'}
        <input
          type="range"
          min={38}
          max={92}
          value={Math.round(settings.brightness * 100)}
          onChange={(e) => set({ brightness: Number(e.target.value) / 100 })}
          className="mt-1 w-full accent-violet-400"
        />
      </label>

      <label className="block text-[10px] font-bold text-slate-300">
        {isAr ? 'حساسية التفاعل' : 'Interaction sensitivity'}
        <input
          type="range"
          min={35}
          max={100}
          value={Math.round(settings.sensitivity * 100)}
          onChange={(e) => set({ sensitivity: Number(e.target.value) / 100 })}
          className="mt-1 w-full accent-emerald-400"
        />
      </label>
    </div>
  );
}

function ParentSecureExit({
  onExit,
  isAr,
  dimmed,
}: {
  onExit: () => void;
  isAr: boolean;
  dimmed: boolean;
}) {
  const holdStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);

  const stopHold = useCallback(() => {
    holdStartRef.current = null;
    setProgress(0);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <button
      type="button"
      onPointerDown={(event) => {
        event.stopPropagation();
        holdStartRef.current = Date.now();
        const tick = () => {
          if (holdStartRef.current === null) return;
          const elapsed = Date.now() - holdStartRef.current;
          setProgress(holdExitProgress(elapsed));
          if (elapsed >= SENSORY_FOCUS_EXIT_HOLD_MS) {
            stopHold();
            onExit();
            return;
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      }}
      onPointerUp={stopHold}
      onPointerLeave={stopHold}
      onPointerCancel={stopHold}
      aria-label={
        isAr ? 'خروج آمن — اضغط مطولاً 3 ثوانٍ' : 'Safe exit — hold 3 seconds'
      }
      className={`pointer-events-auto absolute top-0 end-0 z-50 flex h-14 w-14 items-center justify-center transition-opacity duration-500 ${
        dimmed ? 'opacity-25 hover:opacity-80' : 'opacity-100'
      }`}
    >
      <span
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/20 text-[9px] text-white/40 backdrop-blur-sm"
        style={{
          boxShadow: progress
            ? `inset 0 0 0 ${Math.round(progress * 14)}px rgba(255,255,255,0.12)`
            : undefined,
        }}
      >
        {isAr ? 'خروج' : 'Exit'}
      </span>
    </button>
  );
}

export type SensoryRoomShellProps = {
  roomId: SensoryRoomId;
  titleAr: string;
  titleEn: string;
  isAr: boolean;
  elapsedMs: number;
  interactions: number;
  calmIndex: number;
  engagementIndex: number;
  interactionRate?: number;
  remainingSec?: number;
  sessionPhase?: SensorySessionPhase;
  endReason?: SensorySessionEndReason | null;
  resultStats?: SensorySessionResultStat[];
  onReplay?: () => void;
  onExitGroup?: () => void;
  settings: SensoryHubSettings;
  onSettingsChange: (s: SensoryHubSettings) => void;
  onExit: () => void;
  children: ReactNode;
  className?: string;
};

const CHROME_HIDE_MS = 4200;

/** غلاف غامر ملء الشاشة — واجهة نظيفة، تحكم ولي مخفي، ومقاييس سريرية. */
export default function SensoryRoomShell({
  titleAr,
  titleEn,
  isAr,
  elapsedMs,
  interactions,
  calmIndex,
  engagementIndex,
  interactionRate,
  remainingSec,
  sessionPhase = 'playing',
  endReason,
  resultStats,
  onReplay,
  onExitGroup,
  settings,
  onSettingsChange,
  onExit,
  children,
  className,
}: SensoryRoomShellProps) {
  const [controlsVisible, setControlsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const hideTimerRef = useRef<number | null>(null);

  useSensoryFullscreen(true);

  const playing = sessionPhase === 'playing';

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
      setShowSettings(false);
    }, CHROME_HIDE_MS);
  }, []);

  useEffect(() => {
    document.body.classList.add(SENSORY_FOCUS_BODY_CLASS);
    revealControls();
    return () => {
      document.body.classList.remove(SENSORY_FOCUS_BODY_CLASS);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [revealControls]);

  const ctx: SensoryImmersiveContextValue = {
    controlsVisible,
    revealControls,
  };

  return (
    <SensoryImmersiveContext.Provider value={ctx}>
      <div
        className={`${SENSORY_VIEWPORT_LAYER_CLASS} ${className || ''}`}
        onPointerDown={playing ? revealControls : undefined}
        data-sensory-focus
      >
        <div className={playing ? undefined : 'pointer-events-none opacity-40'}>
          {children}
        </div>

        {playing ? (
          <ParentSecureExit
            onExit={onExit}
            isAr={isAr}
            dimmed={!controlsVisible}
          />
        ) : null}

        {sessionPhase === 'results' && endReason && resultStats && onReplay && onExitGroup ? (
          <SensorySessionResultsPanel
            isAr={isAr}
            titleAr={titleAr}
            titleEn={titleEn}
            endReason={endReason}
            stats={resultStats}
            onReplay={onReplay}
            onExitGroup={onExitGroup}
            variant="dark"
          />
        ) : null}

        {playing ? (
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              revealControls();
              setShowSettings((v) => !v);
            }}
            className={`pointer-events-auto absolute top-0 start-0 z-50 h-14 w-14 transition-opacity duration-500 ${
              controlsVisible ? 'opacity-100' : 'opacity-25 hover:opacity-80'
            }`}
            aria-label={isAr ? 'إعدادات الولي' : 'Parent settings'}
          >
            <span className="ms-3 mt-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/20 text-xs text-white/50 backdrop-blur-sm">
              ⚙
            </span>
          </button>
        ) : null}

        {showSettings && controlsVisible && playing ? (
          <SensoryHubSettingsPanel
            settings={settings}
            onChange={onSettingsChange}
            isAr={isAr}
            onClose={() => setShowSettings(false)}
          />
        ) : null}

        <div
          className={`pointer-events-none absolute top-14 left-1/2 z-20 max-w-[96vw] -translate-x-1/2 transition-opacity duration-500 ${
            controlsVisible && playing ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="rounded-full border border-white/10 bg-black/30 px-4 py-1.5 text-[9px] font-bold text-white/75 backdrop-blur-sm">
            <span>{isAr ? titleAr : titleEn}</span>
            <span className="mx-1.5 opacity-30">·</span>
            <span>{formatSessionClock(elapsedMs)}</span>
            {remainingSec != null ? (
              <>
                <span className="mx-1.5 opacity-30">·</span>
                <span>
                  {isAr ? 'متبقٍ' : 'left'} {remainingSec}s
                </span>
              </>
            ) : null}
            <span className="mx-1.5 opacity-30">·</span>
            <span>
              {interactions} {isAr ? 'تف' : 'int'}
            </span>
            <span className="mx-1.5 opacity-30">·</span>
            <span>
              {isAr ? 'هدوء' : 'calm'} {calmIndex}%
            </span>
            <span className="mx-1.5 opacity-30">·</span>
            <span>
              {isAr ? 'انخراط' : 'engage'} {engagementIndex}%
            </span>
            {interactionRate != null && interactionRate > 0 ? (
              <>
                <span className="mx-1.5 opacity-30">·</span>
                <span>
                  {interactionRate}/{isAr ? 'د' : 'm'}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className={controlsVisible && playing ? 'opacity-100' : 'opacity-0'}>
          <SensoryReinforcerBanner isAr={isAr} />
        </div>
      </div>
    </SensoryImmersiveContext.Provider>
  );
}
