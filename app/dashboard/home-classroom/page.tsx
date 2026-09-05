'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClinicalFlowStepper from '@/components/classroom/ClinicalFlowStepper';
import PreSessionCheckInModal from '@/components/classroom/PreSessionCheckInModal';
import SensoryPausePivot from '@/components/classroom/SensoryPausePivot';
import ClassroomQuickTools, {
  type QuickToolId,
} from '@/components/classroom/ClassroomQuickTools';
import MoodCheckStrip from '@/components/classroom/MoodCheckStrip';
import VisualScheduleBoard, {
  type ScheduleReward,
} from '@/components/classroom/VisualScheduleBoard';
import SensoryFocusOverlay from '@/components/classroom/SensoryFocusOverlay';
import PromptHierarchyChart from '@/components/classroom/PromptHierarchyChart';
import PromptRecordingBar from '@/components/classroom/PromptRecordingBar';
import ReinforcerDeliveryTimer from '@/components/classroom/ReinforcerDeliveryTimer';
import SessionMilestoneCard from '@/components/classroom/SessionMilestoneCard';
import SupportToolsCard from '@/components/home/SupportToolsCard';
import { useLanguage } from '@/components/LanguageProvider';
import {
  binIdForItem,
  buildTrialChoices,
  evaluateHomeSession,
  extractSpokenCue,
  findHomeGoal,
  HOME_CLASSROOM_GOALS,
  HOME_SESSION_TARGET_TRIALS,
  resolveCoachInstructions,
  saveHomeSession,
  sortingSpokenFeedback,
  type HomeClassroomGoal,
  type HomeSessionSummary,
  type InteractiveToolItem,
  type PromptLevel,
  type SortingBin,
  type TrialResult,
} from '@/lib/homeClassroomEngine';
import type { TrackedGoal } from '@/lib/goalsEngine';
import { loadGoalsLocal } from '@/lib/goalsStore';
import {
  describeMoodShift,
  zoneById,
  zoneNeedsCalming,
  type RegulationZoneId,
} from '@/lib/regulationZones';
import { readActiveChild, type ParentChild } from '@/lib/parentJourney';
import type { PromptHierarchyLevel } from '@/lib/promptHierarchy';
import { SENSORY_FOCUS_BODY_CLASS } from '@/lib/sensoryFocusMode';
import {
  clearSessionPause,
  deriveClinicalFlowStep,
  loadSessionPause,
  mapReadinessToMood,
  saveSessionPause,
  type ReadinessPath,
  type ReadinessState,
} from '@/lib/adaptiveClinicalFlow';
import ContractGate from '@/components/contracts/ContractGate';
import { isContractSigned } from '@/lib/contracts/contractStore';
import { stashSensoryReinforcerHandoff } from '@/lib/scheduleRewards';
import {
  RewardAudio,
  speakText,
  stopSpeaking,
  warmUpVoices,
} from '@/lib/sensoryAudio';

const BAND_TONE: Record<HomeSessionSummary['band'], string> = {
  mastered: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  emerging: 'border-amber-200 bg-amber-50 text-amber-900',
  needs_support: 'border-rose-200 bg-rose-50 text-rose-900',
};

/** قيمة عنصر القائمة لهدف خطة فردية — نميّزها عن معرّفات بنك الوسائل */
const IEP_PREFIX = 'iep:';

export default function HomeClassroomPage() {
  const { lang, dir } = useLanguage();
  const isAr = lang === 'ar';
  const router = useRouter();

  const [child, setChild] = useState<ParentChild | null>(null);
  const [selection, setSelection] = useState(HOME_CLASSROOM_GOALS[0].id);
  const [iepGoals, setIepGoals] = useState<TrackedGoal[]>([]);
  const [generated, setGenerated] = useState<HomeClassroomGoal | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');
  const [trials, setTrials] = useState<TrialResult[]>([]);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'ok' | 'miss' | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [scheduleOn, setScheduleOn] = useState(false);
  const [schedulePassed, setSchedulePassed] = useState(false);
  const [reward, setReward] = useState<ScheduleReward | null>(null);
  const [moodBefore, setMoodBefore] = useState<RegulationZoneId | null>(null);
  const [quickTool, setQuickTool] = useState<QuickToolId | null>(null);
  const [summary, setSummary] = useState<HomeSessionSummary | null>(null);
  const audioRef = useRef(new RewardAudio());
  const speechTimerRef = useRef<number | null>(null);
  const scrollAfterGenRef = useRef(false);
  const [genReadyNotice, setGenReadyNotice] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [awaitingPrompt, setAwaitingPrompt] = useState(false);
  const [suggestedPrompt, setSuggestedPrompt] =
    useState<PromptHierarchyLevel | null>(null);
  const [checkInComplete, setCheckInComplete] = useState(false);
  const [readinessState, setReadinessState] = useState<ReadinessState | null>(
    null
  );
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [contractTick, setContractTick] = useState(0);

  useEffect(() => {
    const active = readActiveChild();
    setChild(active);
    setIepGoals(loadGoalsLocal(active?.id));

    const pause = loadSessionPause();
    if (pause && pause.childId === (active?.id || 'child_local')) {
      setTrials(pause.trials);
      setMoodBefore(pause.moodBefore);
      setScheduleOn(pause.scheduleOn);
      setSchedulePassed(pause.schedulePassed);
      setReadinessState(pause.readiness);
      setCheckInComplete(true);
      setShowCheckInModal(false);
      clearSessionPause();
    }

    warmUpVoices();
    return () => {
      if (speechTimerRef.current !== null) {
        window.clearTimeout(speechTimerRef.current);
      }
      stopSpeaking();
    };
  }, []);

  const exitFocusMode = () => {
    setFocusMode(false);
    document.body.classList.remove(SENSORY_FOCUS_BODY_CLASS);
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
  };

  const enterFocusMode = async () => {
    setFocusMode(true);
    document.body.classList.add(SENSORY_FOCUS_BODY_CLASS);
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      /* بعض المتصفحات ترفض fullscreen دون تفاعل مسبق — الواجهة تبقى ملء الشاشة */
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && focusMode) {
        setFocusMode(false);
        document.body.classList.remove(SENSORY_FOCUS_BODY_CLASS);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.body.classList.remove(SENSORY_FOCUS_BODY_CLASS);
    };
  }, [focusMode]);

  useEffect(() => {
    if (summary && focusMode) exitFocusMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary]);

  const scrollToTrainingArea = () => {
    const scheduleEl = document.getElementById('visual-schedule');
    const activityEl = document.getElementById('training-activity');
    const flowEl = document.getElementById('training-flow');
    const target =
      scheduleOn && !schedulePassed && scheduleEl
        ? scheduleEl
        : activityEl || flowEl;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (!generated || !scrollAfterGenRef.current) return undefined;

    scrollAfterGenRef.current = false;
    setGenReadyNotice(true);

    const scrollTimer = window.setTimeout(scrollToTrainingArea, 150);
    const hideTimer = window.setTimeout(() => setGenReadyNotice(false), 6500);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(hideTimer);
    };
    // يُفعَّل مرة واحدة عند نجاح التوليد؛ scheduleOn يحدد هدف التمرير
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generated]);

  // الوسيلة المولّدة تحجب هدف البنك، وشكلها مطابق له فما بعدها لا يعرف الفرق
  const goal = useMemo(
    () => generated || findHomeGoal(selection) || HOME_CLASSROOM_GOALS[0],
    [generated, selection]
  );

  const trialIndex = trials.length;
  const currentTrial = Math.min(trialIndex + 1, HOME_SESSION_TARGET_TRIALS);
  const { target, choices } = useMemo(
    () => buildTrialChoices(goal, trialIndex),
    [goal, trialIndex]
  );

  const coach = resolveCoachInstructions(goal, lang, {
    childName: child?.name,
    item: target,
  });
  const targetName = isAr ? target.nameAr : target.nameEn;

  const cancelSpeech = () => {
    if (speechTimerRef.current !== null) {
      window.clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }
    stopSpeaking();
  };

  const speak = (text: string, rate?: number) => {
    if (!soundOn) return;
    speakText(text, { lang, rate });
  };

  /** تعزيز فوري: نغمة لطيفة ثم نطق الكلمة عند اللمس الصحيح فقط */
  const reactToTap = (isCorrect: boolean, spokenText: string) => {
    setFeedback(isCorrect ? 'ok' : 'miss');
    if (!soundOn) return;
    if (!isCorrect) {
      audioRef.current.playMiss();
      return;
    }
    audioRef.current.playSuccess();
    // تأجيل بسيط حتى لا تحجب نغمة التعزيز سماع الكلمة
    cancelSpeech();
    speechTimerRef.current = window.setTimeout(() => {
      speechTimerRef.current = null;
      speak(spokenText);
    }, 360);
  };

  const handleChoiceTap = (item: InteractiveToolItem) => {
    const isCorrect = item.id === target.id;
    setPickedId(item.id);
    reactToTap(isCorrect, isAr ? item.nameAr : item.nameEn);
    setAwaitingPrompt(true);
    setSuggestedPrompt(isCorrect ? 'independent' : null);
  };

  const handleBinTap = (bin: SortingBin) => {
    const isCorrect = binIdForItem(goal, target.id) === bin.id;
    setPickedId(bin.id);
    reactToTap(isCorrect, sortingSpokenFeedback(target, bin, lang));
    setAwaitingPrompt(true);
    setSuggestedPrompt(isCorrect ? 'independent' : null);
  };

  const resetSession = () => {
    setTrials([]);
    setPickedId(null);
    setFeedback(null);
    setSummary(null);
    setSchedulePassed(false);
    setMoodBefore(null);
    setCheckInComplete(false);
    setReadinessState(null);
    setShowCheckInModal(false);
    cancelSpeech();
    exitFocusMode();
    setAwaitingPrompt(false);
    setSuggestedPrompt(null);
  };

  const handleCheckInComplete = (state: ReadinessState, path: ReadinessPath) => {
    setReadinessState(state);
    setMoodBefore(mapReadinessToMood(state));
    setCheckInComplete(true);
    setShowCheckInModal(false);

    if (!path.directTrain && path.href.startsWith('/sensory-rooms')) {
      saveSessionPause({
        childId: child?.id || 'child_local',
        goalId: goal.id,
        goalTitleAr: goal.titleAr,
        trials,
        moodBefore: mapReadinessToMood(state),
        scheduleOn,
        schedulePassed,
        readiness: state,
        savedAt: new Date().toISOString(),
        returnHref: '/dashboard/home-classroom',
        sensoryRoomHref: path.href,
      });
      stashSensoryReinforcerHandoff({ href: path.href, totalSec: 120 });
      router.push(path.href);
    }
  };

  /** يرسل نص هدف الخطة الفردية لمحرك التوليد ويشغّل الوسيلة الناتجة فوراً */
  const generateActivity = async (goalText: string, iepGoalId?: string) => {
    const text = goalText.trim();
    if (!text || generating) return;

    setGenerating(true);
    setGenError(null);
    setGenReadyNotice(false);
    resetSession();

    try {
      const res = await fetch('/api/home-classroom/generate-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalText: text, iepGoalId }),
      });
      const data = await res.json();
      if (!res.ok || !data?.activity) {
        throw new Error(data?.error || 'GENERATION_FAILED');
      }
      scrollAfterGenRef.current = true;
      setGenerated(data.activity as HomeClassroomGoal);
    } catch {
      setGenerated(null);
      setGenError(
        isAr
          ? 'تعذر توليد الوسيلة الآن. تحققي من الاتصال ثم أعيدي المحاولة.'
          : 'Could not generate the activity. Check the connection and try again.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleGoalSelect = (value: string) => {
    setSelection(value);
    setGenError(null);

    if (value.startsWith(IEP_PREFIX)) {
      const id = value.slice(IEP_PREFIX.length);
      const tracked = iepGoals.find((item) => item.id === id);
      if (tracked) {
        const text = (tracked.smartText || tracked.title).slice(0, 300);
        void generateActivity(text, tracked.id);
        return;
      }
    }

    setGenerated(null);
    resetSession();
  };

  /** نبرة البطاقة الملموسة: تعزيز أخضر للصحيح وتنبيه لطيف للخطأ */
  const tapTone = (id: string) => {
    if (pickedId !== id) return 'border-slate-200 bg-slate-50';
    if (feedback === 'ok')
      return 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-200';
    if (feedback === 'miss') return 'border-rose-400 bg-rose-50';
    return 'border-[#2E7D8E] bg-[#2E7D8E]/10';
  };

  const recordTrial = (promptLevel: PromptLevel) => {
    const updated: TrialResult[] = [
      ...trials,
      {
        trialNumber: currentTrial,
        promptLevel,
        timestamp: new Date().toISOString(),
        itemId: target.id,
      },
    ];

    setTrials(updated);
    setPickedId(null);
    setFeedback(null);
    setAwaitingPrompt(false);
    setSuggestedPrompt(null);
    cancelSpeech();

    if (updated.length >= HOME_SESSION_TARGET_TRIALS) {
      const result = evaluateHomeSession(
        child?.id || 'child_local',
        goal,
        updated,
        child?.name,
        { before: moodBefore }
      );
      setSummary(result);
      saveHomeSession(result);
    }
  };

  /** شعور الطفل بعد المحاولات يُكتب في التقرير المحفوظ نفسه لا في سجل جديد */
  const recordMoodAfter = (zone: RegulationZoneId) => {
    if (!summary) return;
    const updated: HomeSessionSummary = { ...summary, moodAfter: zone };
    setSummary(updated);
    saveHomeSession(updated);
  };

  const undoLastTrial = () => {
    setTrials((prev) => prev.slice(0, -1));
    setPickedId(null);
    setFeedback(null);
    setAwaitingPrompt(false);
    setSuggestedPrompt(null);
  };

  const progressPct = Math.round(
    (trials.length / HOME_SESSION_TARGET_TRIALS) * 100
  );

  const inTrainingActivity =
    !generating &&
    !summary &&
    !(scheduleOn && !schedulePassed) &&
    checkInComplete;

  const clinicalStep = deriveClinicalFlowStep({
    checkInComplete,
    scheduleOn,
    schedulePassed,
    trialsCount: trials.length,
    hasSummary: Boolean(summary),
    moodAfter: summary?.moodAfter,
    targetTrials: HOME_SESSION_TARGET_TRIALS,
  });

  const shouldOfferCheckIn =
    !generating &&
    !summary &&
    !checkInComplete &&
    !(scheduleOn && !schedulePassed);

  const activeChildId = child?.id || 'child_local';
  const contractSigned = useMemo(() => {
    void contractTick;
    return isContractSigned(activeChildId, 'parent');
  }, [activeChildId, contractTick]);

  useEffect(() => {
    if (shouldOfferCheckIn && contractSigned) setShowCheckInModal(true);
    if (!contractSigned) setShowCheckInModal(false);
  }, [shouldOfferCheckIn, contractSigned]);

  const showPromptBar =
    inTrainingActivity &&
    trials.length < HOME_SESSION_TARGET_TRIALS &&
    (awaitingPrompt || goal.toolType === 'functional_naming');

  return (
    <section dir={dir} className="relative mx-auto max-w-4xl">
      {/* إضاءات محيطية خفيفة */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 end-0 h-80 w-80 rounded-full bg-teal-400/20 blur-[70px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 start-0 h-80 w-80 rounded-full bg-amber-400/20 blur-[70px]"
      />

      <div className="relative z-10 space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/90 bg-white/85 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏡</span>
              <h1 className="text-xl font-black text-[#0b1f14] sm:text-2xl">
                {isAr
                  ? 'الغرفة الصفية المنزلية المساندة'
                  : 'Virtual Home Co-Classroom'}
              </h1>
            </div>
            <p className="mt-1 text-xs leading-6 text-slate-500 sm:text-sm">
              {isAr
                ? 'موجّه ذكي لولي الأمر لتدريب أهداف الخطة الفردية وتعميمها في المنزل'
                : 'AI parent coach for training and generalising IEP goals at home'}
            </p>
            {child?.name && (
              <span className="mt-2 inline-block rounded-full border border-[#2E7D8E]/20 bg-[#2E7D8E]/10 px-3 py-1 text-[11px] font-bold text-[#2E7D8E]">
                {isAr ? `الطفل: ${child.name}` : `Child: ${child.name}`}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-end gap-2">
            <label className="text-xs font-bold text-slate-600">
              <span className="mb-1.5 block">
                {isAr ? 'الهدف التدريبي' : 'Training goal'}
              </span>
              <select
                value={selection}
                onChange={(event) => handleGoalSelect(event.target.value)}
                disabled={generating || (trials.length > 0 && !summary)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-800 outline-none transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-56 sm:text-sm"
              >
                <optgroup label={isAr ? 'بنك الوسائل الجاهزة' : 'Ready activity bank'}>
                  {HOME_CLASSROOM_GOALS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {isAr ? item.titleAr : item.titleEn}
                    </option>
                  ))}
                </optgroup>
                {iepGoals.length > 0 && (
                  <optgroup
                    label={
                      isAr
                        ? 'أهداف خطة الطالب الفردية (IEP)'
                        : "Student's IEP goals"
                    }
                  >
                    {iepGoals.map((item) => (
                      <option
                        key={item.id}
                        value={`${IEP_PREFIX}${item.id}`}
                      >
                        {item.title}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>

            <button
              type="button"
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                if (!next) cancelSpeech();
              }}
              aria-pressed={soundOn}
              title={
                isAr
                  ? soundOn
                    ? 'إيقاف الصوت والنطق'
                    : 'تشغيل الصوت والنطق'
                  : soundOn
                    ? 'Mute audio & speech'
                    : 'Unmute audio & speech'
              }
              className={`h-[42px] shrink-0 rounded-2xl border px-3 text-lg transition ${
                soundOn
                  ? 'border-[#2E7D8E]/30 bg-[#2E7D8E]/10 text-[#2E7D8E]'
                  : 'border-slate-300 bg-slate-100 text-slate-400'
              }`}
            >
              {soundOn ? '🔊' : '🔇'}
            </button>
          </div>
        </header>

        {!generating && (
          <ClinicalFlowStepper currentStep={clinicalStep} isAr={isAr} />
        )}

        <ContractGate
          childId={activeChildId}
          childName={child?.name}
          action="home_session"
          isAr={isAr}
          variant="modal"
          signerRoleDefault={isAr ? 'ولي أمر' : 'Parent'}
          onSigned={() => setContractTick((n) => n + 1)}
        />

        <PreSessionCheckInModal
          open={showCheckInModal && contractSigned}
          childName={child?.name}
          onComplete={handleCheckInComplete}
        />

        {/* مولّد الوسائل الذكي: أي هدف يُكتب نصاً يصبح وسيلة تفاعلية جاهزة */}
        <div className="rounded-3xl border border-white/90 bg-white/85 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <h2 className="text-sm font-black text-[#0b1f14]">
              {isAr
                ? 'توليد وسيلة من هدف مخصص'
                : 'Generate an activity from a custom goal'}
            </h2>
          </div>
          <p className="mt-1 text-[11px] leading-6 text-slate-500">
            {isAr
              ? 'اكتب هدف الخطة الفردية كما هو، وسيحدد المحرك نوع المهارة والعناصر وخطوات توجيه ولي الأمر تلقائياً.'
              : 'Type the IEP goal as written; the engine detects the skill type, the items, and the parent coaching steps automatically.'}
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={customText}
              onChange={(event) => setCustomText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void generateActivity(customText);
                }
              }}
              maxLength={300}
              disabled={generating}
              placeholder={
                isAr
                  ? 'مثال: أن يطابق الطالب بين الحيوانات الأليفة'
                  : 'e.g. The student matches identical pet pictures'
              }
              className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 outline-none transition focus:border-[#2E7D8E] focus:bg-white disabled:opacity-60 sm:text-sm"
            />
            <button
              type="button"
              onClick={() => void generateActivity(customText)}
              disabled={generating || customText.trim().length < 5}
              className="shrink-0 rounded-2xl bg-[#2E7D8E] px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-[#2E7D8E]/20 transition hover:bg-[#26697a] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            >
              {generating
                ? isAr
                  ? 'جارٍ التوليد…'
                  : 'Generating…'
                : isAr
                  ? 'ولّد الوسيلة'
                  : 'Generate'}
            </button>
          </div>

          {genError && (
            <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[11px] font-bold text-rose-700">
              {genError}
            </p>
          )}

          {generated && !genError && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
              <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-black text-white">
                {isAr ? 'وسيلة مولّدة' : 'Generated'}
              </span>
              <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-emerald-900">
                {generated.sourceGoalText}
              </span>
              <button
                type="button"
                onClick={() => {
                  setGenerated(null);
                  setSelection(HOME_CLASSROOM_GOALS[0].id);
                  resetSession();
                }}
                className="text-[11px] font-black text-emerald-700 underline underline-offset-2"
              >
                {isAr ? 'رجوع لبنك الوسائل' : 'Back to the bank'}
              </button>
            </div>
          )}
        </div>

        {/* قراءة انفعالية — تُكمّل فحص الجاهزية */}
        {!generating && !summary && checkInComplete && (
          <div
            id="training-flow"
            className={`space-y-3 rounded-3xl border bg-white/85 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl transition ${
              genReadyNotice
                ? 'border-sky-300/80 ring-2 ring-sky-200/70'
                : 'border-white/90'
            }`}
          >
            {genReadyNotice && (
              <p
                role="status"
                aria-live="polite"
                className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-emerald-50 px-4 py-3 text-center text-[11px] font-bold leading-6 text-sky-900 sm:text-xs"
              >
                {isAr
                  ? '✓ تم تجهيز الوسيلة بنجاح، انتقلي لخطوات التدريب بالأسفل'
                  : '✓ Activity ready — scroll down to the training steps below'}
              </p>
            )}
            <MoodCheckStrip
              value={moodBefore}
              onChange={setMoodBefore}
              titleAr="🧭 تأكيد المنطقة الانفعالية"
              titleEn="🧭 Confirm emotional zone"
              hintAr={
                readinessState
                  ? `فحص الجاهزية: ${readinessState === 'calm' ? 'هادئ' : readinessState === 'hyperactive' ? 'نشيط' : 'قلق'} — يمكنك تعديل المنطقة.`
                  : 'سجّلي منطقته قبل البدء لتُوثّق في تقرير الجلسة.'
              }
              hintEn={
                readinessState
                  ? `Readiness: ${readinessState} — you can adjust the zone.`
                  : 'Record their zone before starting — saved in the session report.'
              }
            />

            {zoneNeedsCalming(moodBefore) && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
                <p className="min-w-0 flex-1 text-[11px] font-bold leading-6 text-amber-900">
                  {isAr
                    ? zoneById(moodBefore)?.coachAr
                    : zoneById(moodBefore)?.coachEn}
                </p>
                <button
                  type="button"
                  onClick={() => setQuickTool('calm')}
                  className="shrink-0 rounded-2xl bg-[#5B8DEF] px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-[#4a79d3] active:scale-95"
                >
                  {isAr ? '🧘 افتحي أدوات التهدئة' : '🧘 Open calming tools'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* تهيئة سلوكية قبل التدريب: الطفل يرى المهمة والمعزّز قبل أول محاولة */}
        {!generating && !summary && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/90 bg-white/85 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl">
            <div className="min-w-0">
              <strong className="flex items-center gap-2 text-sm font-black text-[#0b1f14]">
                <span className="text-lg">🗓️</span>
                <span>
                  {isAr
                    ? 'الجدول البصري التمهيدي'
                    : 'Preparatory visual schedule'}
                </span>
              </strong>
              <p className="mt-1 text-[11px] leading-6 text-slate-500">
                {isAr
                  ? 'لوحة «أولاً / ثم» مع مؤقت حسي تُعرض على الطفل قبل المحاولات لتهيئته وضمان استقراره السلوكي.'
                  : 'A First / Then board with a sensory timer, shown before the trials to prime the child and keep them settled.'}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {scheduleOn && schedulePassed && (
                <button
                  type="button"
                  onClick={() => setSchedulePassed(false)}
                  className="rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 active:scale-95"
                >
                  {isAr ? '↩ أعد عرض اللوحة' : '↩ Show the board'}
                </button>
              )}
              <button
                type="button"
                role="switch"
                aria-checked={scheduleOn}
                onClick={() => {
                  setScheduleOn(!scheduleOn);
                  setSchedulePassed(false);
                }}
                className={`rounded-2xl border px-4 py-2.5 text-xs font-black transition active:scale-95 ${
                  scheduleOn
                    ? 'border-[#2E7D8E] bg-[#2E7D8E] text-white shadow-sm'
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {scheduleOn
                  ? isAr
                    ? '✔ مُفعّل'
                    : '✔ Enabled'
                  : isAr
                    ? 'تفعيل اللوحة'
                    : 'Enable board'}
              </button>
            </div>
          </div>
        )}

        {generating ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-white bg-white/90 p-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#2E7D8E]/20 border-t-[#2E7D8E]" />
            <p className="text-sm font-black text-[#0b1f14]">
              {isAr
                ? 'يحلل المحرك الهدف ويبني الوسيلة التفاعلية…'
                : 'Analysing the goal and building the interactive activity…'}
            </p>
            <p className="text-[11px] leading-6 text-slate-500">
              {isAr
                ? 'تحديد نوع المهارة، ثم استخراج العناصر، ثم صياغة خطوات التوجيه.'
                : 'Detecting the skill type, extracting the items, then drafting the coaching steps.'}
            </p>
          </div>
        ) : summary ? (
          <div className="space-y-6 rounded-3xl border border-white bg-white/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:p-8">
            <div className="space-y-2 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300 bg-emerald-100 text-3xl">
                🎉
              </div>
              <h2 className="text-2xl font-black text-[#0b1f14]">
                {isAr
                  ? 'اكتملت الجلسة المنزلية بنجاح!'
                  : 'Home session completed!'}
              </h2>
              <p className="text-xs leading-6 text-slate-500">
                {isAr
                  ? 'حُفظ الرصد في ملف الطفل على هذا الجهاز، وسيظهر للأخصائي عند مزامنة الملف.'
                  : 'Saved to the child record on this device and shared with the specialist on sync.'}
              </p>
            </div>

            <ReinforcerDeliveryTimer
              reward={reward}
              soundOn={soundOn}
              isAr={isAr}
              onRewardChange={setReward}
            />

            <SessionMilestoneCard
              summary={summary}
              childName={child?.name}
              isAr={isAr}
              dir={dir}
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryStat
                tone="border-emerald-200 bg-emerald-50 text-emerald-800"
                label={isAr ? 'نسبة الاستقلالية' : 'Independence'}
                value={`${summary.masteryPercentage}%`}
              />
              <SummaryStat
                tone="border-slate-200 bg-slate-50 text-slate-700"
                label={isAr ? 'محاولات مستقلة' : 'Independent trials'}
                value={`${summary.independentCount} / ${summary.totalTrials}`}
              />
              <SummaryStat
                tone="border-amber-200 bg-amber-50 text-amber-800"
                label={isAr ? 'محاولات بمساعدة' : 'Prompted trials'}
                value={String(summary.promptedCount)}
              />
              <SummaryStat
                tone="border-rose-200 bg-rose-50 text-rose-800"
                label={isAr ? 'عدم استجابة' : 'No response'}
                value={String(summary.noResponseCount)}
              />
            </div>

            {summary.promptBreakdown && summary.trialPromptSequence && (
              <PromptHierarchyChart
                breakdown={summary.promptBreakdown}
                sequence={summary.trialPromptSequence}
                isAr={isAr}
              />
            )}

            {(summary.promptFadingCueAr || summary.independenceDelta != null) && (
              <div className="space-y-2 rounded-2xl border border-violet-200 bg-violet-50/90 p-5">
                <strong className="flex items-center gap-1.5 text-xs font-black text-violet-900">
                  <span>📉</span>
                  <span>
                    {isAr
                      ? 'توصية تلاشي المساعدة للجلسة التالية'
                      : 'Prompt fading cue for the next session'}
                  </span>
                </strong>
                {summary.independenceDelta != null && (
                  <p className="text-[11px] font-bold text-violet-800/80">
                    {summary.independenceDelta > 0
                      ? isAr
                        ? `تحسّن الاستقلالية +${summary.independenceDelta}% عن الجلسة السابقة`
                        : `Independence up +${summary.independenceDelta}% vs last session`
                      : summary.independenceDelta < 0
                        ? isAr
                          ? `تراجع الاستقلالية ${summary.independenceDelta}% عن الجلسة السابقة`
                          : `Independence down ${summary.independenceDelta}% vs last session`
                        : isAr
                          ? 'الاستقلالية ثابتة عن الجلسة السابقة'
                          : 'Independence steady vs last session'}
                  </p>
                )}
                <p className="text-[11px] font-medium leading-6 text-violet-900">
                  {isAr
                    ? summary.promptFadingCueAr
                    : summary.promptFadingCueEn}
                </p>
              </div>
            )}

            <div
              className={`space-y-2 rounded-2xl border p-5 text-xs ${BAND_TONE[summary.band]}`}
            >
              <strong className="flex items-center gap-1.5 text-sm font-bold">
                <span>💡</span>
                <span>
                  {isAr
                    ? 'الملاحظة الإرشادية للأهل والأخصائي:'
                    : 'Guidance note for parent & specialist:'}
                </span>
              </strong>
              <p className="font-medium leading-relaxed">
                {isAr ? summary.clinicalNoteAr : summary.clinicalNoteEn}
              </p>
              <p className="pt-1 font-bold leading-relaxed">
                {isAr ? 'الخطوة القادمة المقترحة: ' : 'Recommended next step: '}
                {isAr
                  ? summary.recommendedNextStepAr
                  : summary.recommendedNextStepEn}
              </p>
            </div>

            {/* القراءة الانفعالية الختامية: تكتمل بها صورة الجلسة عند الأخصائي */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              {summary.moodBefore && (
                <p className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-600">
                  <span>
                    {isAr ? 'حالته قبل الجلسة:' : 'Zone before the session:'}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${zoneById(summary.moodBefore)?.tone}`}
                  >
                    {zoneById(summary.moodBefore)?.emoji}{' '}
                    {isAr
                      ? zoneById(summary.moodBefore)?.labelAr
                      : zoneById(summary.moodBefore)?.labelEn}
                  </span>
                </p>
              )}

              <MoodCheckStrip
                value={summary.moodAfter || null}
                onChange={recordMoodAfter}
                titleAr="🧭 كيف حال الطفل بعد الجلسة؟"
                titleEn="🧭 How is the child after the session?"
                hintAr="اختاري منطقته الآن ليُحفظ التحول الانفعالي مع بقية بيانات الجلسة."
                hintEn="Pick their zone now so the emotional shift is saved with the rest of the session data."
              />

              {(() => {
                const shift = describeMoodShift(
                  summary.moodBefore,
                  summary.moodAfter
                );
                if (!shift) return null;
                const tone =
                  shift.direction === 'improved'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : shift.direction === 'declined'
                      ? 'border-rose-200 bg-rose-50 text-rose-900'
                      : 'border-slate-200 bg-white text-slate-700';
                return (
                  <p
                    className={`rounded-xl border px-3 py-2.5 text-[11px] font-bold leading-6 ${tone}`}
                  >
                    {isAr ? shift.textAr : shift.textEn}
                  </p>
                );
              })()}
            </div>

            <SupportToolsCard
              goalText={summary.sourceGoalText || summary.goalTitleAr}
            />

            <div className="flex flex-col gap-3 pt-1 sm:flex-row">
              <button
                type="button"
                onClick={resetSession}
                className="flex-1 rounded-2xl bg-[#2E7D8E] py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-[#236372]"
              >
                {isAr ? 'تدريب هدف آخر ➔' : 'Train another goal ➔'}
              </button>
              <Link
                href="/dashboard"
                className="rounded-2xl bg-slate-200 px-6 py-3.5 text-center text-xs font-bold text-slate-700 transition hover:bg-slate-300"
              >
                {isAr ? 'العودة للوحة التحكم' : 'Return to dashboard'}
              </Link>
            </div>
          </div>
        ) : scheduleOn && !schedulePassed ? (
          <div id="visual-schedule">
            <VisualScheduleBoard
              firstCard={{
                emoji: target.imageUrl,
                labelAr: goal.titleAr,
                labelEn: goal.titleEn,
              }}
              soundOn={soundOn}
              onRewardChange={setReward}
              onStart={() => {
                cancelSpeech();
                setSchedulePassed(true);
              }}
              startLabelAr="ابدئي محاولات الهدف ➔"
              startLabelEn="Start the goal trials ➔"
            />
          </div>
        ) : (
          <>
            {!focusMode && (
              <div className="rounded-3xl border border-violet-200/80 bg-gradient-to-r from-violet-50/90 to-sky-50/90 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <strong className="flex items-center gap-2 text-sm font-black text-[#0b1f14]">
                      <span className="text-lg">🖥️</span>
                      <span>
                        {isAr
                          ? 'نمط التدريب البصري الهادئ'
                          : 'Sensory focus training mode'}
                      </span>
                    </strong>
                    <p className="mt-1 text-[11px] leading-6 text-slate-500">
                      {isAr
                        ? 'ملء الشاشة بخلفية هادئة — يُخفى التنقل ويبقى الهدف والعناصر التفاعلية فقط أمام الطفل.'
                        : 'Full-screen calm view — hides navigation and shows only the goal and touch targets for the child.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void enterFocusMode()}
                    className="shrink-0 rounded-2xl bg-[#5B7C9E] px-6 py-3.5 text-xs font-black text-white shadow-lg shadow-[#5B7C9E]/25 transition hover:bg-[#4a6885] active:scale-95 sm:text-sm"
                  >
                    {isAr
                      ? '🖥️ بدء نمط التركيز الهادئ'
                      : '🖥️ Start calm focus mode'}
                  </button>
                </div>
              </div>
            )}

          <div
            id="training-activity"
            className={`grid grid-cols-1 gap-6 lg:grid-cols-12 ${focusMode ? 'hidden' : ''}`}
          >
            {/* توجيه المساعد الذكي لولي الأمر */}
            <aside className="space-y-4 rounded-3xl border-2 border-amber-300/80 bg-amber-50/90 p-6 shadow-md backdrop-blur-xl lg:col-span-5">
              <div className="flex items-center gap-2 text-sm font-black text-amber-900 sm:text-base">
                <span className="text-xl">🎙️</span>
                <span>
                  {isAr
                    ? 'توجيه المساعد الذكي لكِ الآن:'
                    : 'AI coach instructions:'}
                </span>
              </div>

              <p className="text-xs leading-6 text-amber-900/80">
                {isAr ? goal.descriptionAr : goal.descriptionEn}
              </p>

              <CoachStep
                index={1}
                title={isAr ? 'تهيئة البيئة' : 'Set up the environment'}
              >
                <p className="leading-relaxed">{coach.setup}</p>
              </CoachStep>

              <CoachStep
                index={2}
                title={isAr ? 'ما تقولينه للطفل' : 'What to say to the child'}
                action={
                  <button
                    type="button"
                    onClick={() => speak(extractSpokenCue(coach.verbalCue), 0.75)}
                    disabled={!soundOn}
                    title={
                      isAr
                        ? 'اسمعي نطق الأمر اللفظي النموذجي'
                        : 'Hear the model verbal cue'
                    }
                    className="rounded-full border border-amber-300 bg-white px-2.5 py-1 text-sm transition hover:bg-amber-100 active:scale-95 disabled:opacity-40"
                  >
                    🔊
                  </button>
                }
              >
                <p className="rounded-xl border border-amber-200/60 bg-amber-100/50 p-2.5 text-sm font-bold leading-relaxed text-slate-900">
                  {coach.verbalCue}
                </p>
              </CoachStep>

              <CoachStep
                index={3}
                title={isAr ? 'المساعدة المتدرجة' : 'Graduated prompting'}
              >
                <p className="leading-relaxed">{coach.support}</p>
              </CoachStep>

              <div className="space-y-1.5">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-amber-200/70">
                  <div
                    className="h-full rounded-full bg-[#2E7D8E] transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-center text-[11px] font-semibold text-slate-500">
                  {isAr
                    ? `المحاولة ${currentTrial} من ${HOME_SESSION_TARGET_TRIALS}`
                    : `Trial ${currentTrial} of ${HOME_SESSION_TARGET_TRIALS}`}
                </p>
              </div>
            </aside>

            {/* الوسيلة الرقمية + رصد مستوى المساعدة */}
            <div className="space-y-5 lg:col-span-7">
              <div className="flex min-h-[300px] flex-col items-center justify-center gap-6 rounded-3xl border border-white/90 bg-white/85 p-6 text-center shadow-xl backdrop-blur-xl sm:p-8">
                <span className="rounded-full border border-[#2E7D8E]/20 bg-[#2E7D8E]/10 px-4 py-1.5 text-xs font-bold text-[#2E7D8E]">
                  {isAr ? goal.targetSkill : goal.targetSkillEn}
                </span>

                {goal.toolType !== 'receptive_discrimination' && (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => speak(targetName)}
                      disabled={!soundOn}
                      title={
                        isAr ? 'اسمعي نطق الكلمة' : 'Hear the word pronounced'
                      }
                      className="mx-auto flex h-32 w-32 items-center justify-center rounded-3xl border-2 border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 text-6xl shadow-inner transition hover:border-[#2E7D8E]/40 active:scale-95 disabled:cursor-default"
                    >
                      {target.imageUrl}
                    </button>
                    <h3 className="pt-2 text-2xl font-black text-[#0b1f14]">
                      {targetName}
                    </h3>
                    {soundOn && (
                      <p className="text-[11px] font-semibold text-slate-400">
                        {isAr
                          ? '🔊 اضغطي على البطاقة لسماع الكلمة'
                          : '🔊 Tap the card to hear the word'}
                      </p>
                    )}
                  </div>
                )}

                {goal.toolType === 'sorting_categories' ? (
                  <div className="w-full space-y-2">
                    <p className="text-xs font-semibold text-slate-500">
                      {isAr
                        ? 'اجعلي الطفل يلمس السلة الصحيحة'
                        : 'Let the child tap the correct basket'}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {(goal.sortingBins || []).map((bin) => (
                        <button
                          key={bin.id}
                          type="button"
                          onClick={() => handleBinTap(bin)}
                          className={`rounded-2xl border-2 p-4 transition hover:scale-[1.03] active:scale-95 ${tapTone(bin.id)}`}
                        >
                          <span className="block text-3xl">{bin.emoji}</span>
                          <span className="mt-1 block text-xs font-bold text-slate-700">
                            {isAr ? bin.labelAr : bin.labelEn}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : goal.toolType === 'functional_naming' ? (
                  <p className="text-xs leading-6 text-slate-500">
                    {isAr
                      ? 'انتظري أن يسمّي الطفل الأداة بنفسه قبل رصد المحاولة'
                      : 'Wait for the child to name the object before scoring the trial'}
                  </p>
                ) : (
                  <div className="w-full space-y-2">
                    <p className="text-xs font-semibold text-slate-500">
                      {goal.toolType === 'identical_matching'
                        ? isAr
                          ? 'اجعلي الطفل يلمس الصورة المطابقة'
                          : 'Let the child tap the identical picture'
                        : isAr
                          ? 'اجعلي الطفل يلمس العنصر الذي سمّيتِه'
                          : 'Let the child tap the item you named'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {choices.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleChoiceTap(item)}
                          className={`flex h-20 w-20 items-center justify-center rounded-2xl border-2 text-4xl transition hover:scale-105 active:scale-95 ${tapTone(item.id)}`}
                          aria-label={isAr ? item.nameAr : item.nameEn}
                        >
                          {item.imageUrl}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <PromptRecordingBar
                isAr={isAr}
                visible={showPromptBar}
                suggestedLevel={
                  awaitingPrompt ? suggestedPrompt : null
                }
                onRecord={recordTrial}
              />

              {trials.length > 0 && (
                <button
                  type="button"
                  onClick={undoLastTrial}
                  className="block w-full text-center text-[11px] font-semibold text-slate-400 underline transition hover:text-rose-600"
                >
                  {isAr
                    ? 'تراجع عن آخر محاولة'
                    : 'Undo last recorded trial'}
                </button>
              )}
            </div>
          </div>
          </>
        )}

        {focusMode && inTrainingActivity && (
          <SensoryFocusOverlay
            goal={goal}
            target={target}
            choices={choices}
            targetName={targetName}
            isAr={isAr}
            soundOn={soundOn}
            trialsDone={trials.length}
            pickedId={pickedId}
            feedback={feedback}
            tapTone={tapTone}
            onChoiceTap={handleChoiceTap}
            onBinTap={handleBinTap}
            onSpeakTarget={() => speak(targetName)}
            onExit={exitFocusMode}
          />
        )}

        <p className={`relative z-10 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-[11px] leading-6 text-slate-500 backdrop-blur-xl ${focusMode ? 'hidden' : ''}`}>
          {isAr
            ? 'الغرفة المنزلية أداة تدريب وتعميم مساندة للخطة التربوية الفردية، وليست تشخيصاً طبياً أو بديلاً عن جلسات الأخصائي.'
            : 'The home classroom is a supportive training and generalisation tool for the IEP — not a medical diagnosis or a replacement for specialist sessions.'}
        </p>
      </div>

      {/* التعبير وطلب المساعدة متاحان في أي لحظة دون مغادرة الجلسة */}
      {/* بعد اكتمال التقرير تكتب أداة التهدئة في القراءة الختامية لا الابتدائية */}
      {!focusMode && inTrainingActivity && (
        <SensoryPausePivot
          isAr={isAr}
          childId={child?.id || 'child_local'}
          goalId={goal.id}
          goalTitleAr={goal.titleAr}
          trials={trials}
          moodBefore={moodBefore}
          scheduleOn={scheduleOn}
          schedulePassed={schedulePassed}
          readiness={readinessState}
        />
      )}

      {!focusMode && (
        <ClassroomQuickTools
          openTool={quickTool}
          onOpenToolChange={setQuickTool}
          soundOn={soundOn}
          zone={summary ? summary.moodAfter || null : moodBefore}
          onZoneChange={summary ? recordMoodAfter : setMoodBefore}
        />
      )}
    </section>
  );
}

function CoachStep({
  index,
  title,
  action,
  children,
}: {
  index: number;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-amber-200 bg-white/80 p-4 text-xs text-slate-700">
      <div className="flex items-center justify-between gap-2">
        <strong className="flex items-center gap-2 font-bold text-amber-800">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-[10px] text-amber-900">
            {index}
          </span>
          <span>{title}</span>
        </strong>
        {action}
      </div>
      {children}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 text-center ${tone}`}>
      <span className="block text-xs font-bold">{label}</span>
      <strong className="text-2xl font-black">{value}</strong>
    </div>
  );
}
