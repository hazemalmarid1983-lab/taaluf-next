'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';

class EmotionAudioEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  playHappyTone() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {
      /* ignore */
    }
  }

  playTryAgainTone() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {
      /* ignore */
    }
  }
}

type EmotionOption = {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: string;
};

type EmotionScenario = {
  id: string;
  scenarioAr: string;
  scenarioEn: string;
  characterVisual: string;
  correctEmotionId: string;
  options: EmotionOption[];
};

const EMOTIONS_POOL: EmotionOption[] = [
  { id: 'happy', labelAr: 'سعيد / فرحان', labelEn: 'Happy', icon: '😄' },
  { id: 'sad', labelAr: 'حزين', labelEn: 'Sad', icon: '😢' },
  { id: 'angry', labelAr: 'غاضب / منزعج', labelEn: 'Angry', icon: '😠' },
  { id: 'surprised', labelAr: 'متفاجئ / مندهش', labelEn: 'Surprised', icon: '😲' },
  { id: 'calm', labelAr: 'هادئ / مرتاح', labelEn: 'Calm', icon: '😌' },
];

const SCENARIOS: EmotionScenario[] = [
  {
    id: 'sc_1',
    scenarioAr:
      'حصلت سارة على هدية جميلة ومفاجئة من والدتها في يوم ميلادها! كيف تشعر سارة؟',
    scenarioEn:
      'Sarah received a lovely surprise gift from her mother on her birthday! How does Sarah feel?',
    characterVisual: '🎁👧',
    correctEmotionId: 'happy',
    options: [EMOTIONS_POOL[0], EMOTIONS_POOL[1], EMOTIONS_POOL[2]],
  },
  {
    id: 'sc_2',
    scenarioAr: 'سقط الآيس كريم من يد أحمد على الأرض قبل أن يتذوقه! كيف يشعر أحمد؟',
    scenarioEn:
      'Ahmed accidentally dropped his ice cream on the ground! How does Ahmed feel?',
    characterVisual: '🍦👦💧',
    correctEmotionId: 'sad',
    options: [EMOTIONS_POOL[1], EMOTIONS_POOL[0], EMOTIONS_POOL[4]],
  },
  {
    id: 'sc_3',
    scenarioAr: 'قام شخص بأخذ لعبة يوسف المفضلة من يده دون إذنه! كيف يشعر يوسف؟',
    scenarioEn:
      "Someone grabbed Yousef's favorite toy without asking! How does Yousef feel?",
    characterVisual: '🧸😤',
    correctEmotionId: 'angry',
    options: [EMOTIONS_POOL[2], EMOTIONS_POOL[4], EMOTIONS_POOL[0]],
  },
  {
    id: 'sc_4',
    scenarioAr:
      'يجلس فهد في حديقة هادئة يستمع لصوت العصافير والنسيم العليل. كيف يشعر فهد؟',
    scenarioEn:
      'Fahad is sitting in a quiet garden listening to birds and a gentle breeze. How does Fahad feel?',
    characterVisual: '🌳🕊️🧘',
    correctEmotionId: 'calm',
    options: [EMOTIONS_POOL[4], EMOTIONS_POOL[1], EMOTIONS_POOL[3]],
  },
  {
    id: 'sc_5',
    scenarioAr: 'فتح خالد الصندوق ووجد داخله بالوناً كبيراً يطير فجأة! كيف يشعر خالد؟',
    scenarioEn:
      'Khaled opened a box and a big balloon flew out unexpectedly! How does Khaled feel?',
    characterVisual: '🎈📦😲',
    correctEmotionId: 'surprised',
    options: [EMOTIONS_POOL[3], EMOTIONS_POOL[2], EMOTIONS_POOL[1]],
  },
];

export type EmotionRecognitionMetrics = {
  totalScenarios: number;
  correctAnswers: number;
  accuracyRate: number;
  averageResponseTimeMs: number;
  linkedCriteria: string[];
};

function emptyMetrics() {
  return {
    correctCount: 0,
    responseTimes: [] as number[],
    stepStartTime: Date.now(),
  };
}

export default function EmotionMirrorGame({
  onFinishGame,
}: {
  childId?: string;
  onFinishGame?: (metrics: EmotionRecognitionMetrics) => void;
}) {
  const { lang, dir } = useLanguage();
  const audioRef = useRef<EmotionAudioEngine | null>(null);
  const onFinishRef = useRef(onFinishGame);
  const timerRef = useRef<number | null>(null);
  const metricsRef = useRef(emptyMetrics());

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentScenario = SCENARIOS[currentIndex];

  useEffect(() => {
    onFinishRef.current = onFinishGame;
  }, [onFinishGame]);

  useEffect(() => {
    audioRef.current = new EmotionAudioEngine();
    metricsRef.current.stepStartTime = Date.now();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const finishGame = () => {
    setIsCompleted(true);
    const avgTime = metricsRef.current.responseTimes.length
      ? Math.round(
          metricsRef.current.responseTimes.reduce((a, b) => a + b, 0) /
            metricsRef.current.responseTimes.length
        )
      : 0;
    const accuracy = Math.round(
      (metricsRef.current.correctCount / SCENARIOS.length) * 100
    );
    onFinishRef.current?.({
      totalScenarios: SCENARIOS.length,
      correctAnswers: metricsRef.current.correctCount,
      accuracyRate: accuracy,
      averageResponseTimeMs: avgTime,
      linkedCriteria: ['C12', 'C14'],
    });
  };

  const handleChoice = (emotionId: string) => {
    if (feedback !== null) return;
    metricsRef.current.responseTimes.push(
      Date.now() - metricsRef.current.stepStartTime
    );
    setSelectedEmotion(emotionId);

    const isCorrect = emotionId === currentScenario.correctEmotionId;
    if (isCorrect) {
      audioRef.current?.playHappyTone();
      setFeedback('correct');
      setScore((s) => s + 20);
      metricsRef.current.correctCount += 1;
    } else {
      audioRef.current?.playTryAgainTone();
      setFeedback('wrong');
    }

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      if (currentIndex < SCENARIOS.length - 1) {
        setCurrentIndex((i) => i + 1);
        setSelectedEmotion(null);
        setFeedback(null);
        metricsRef.current.stepStartTime = Date.now();
      } else {
        finishGame();
      }
    }, 1200);
  };

  const restart = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    metricsRef.current = emptyMetrics();
    setCurrentIndex(0);
    setSelectedEmotion(null);
    setFeedback(null);
    setScore(0);
    setIsCompleted(false);
  };

  const accuracyNow = Math.round(
    (metricsRef.current.correctCount / SCENARIOS.length) * 100
  );

  return (
    <div
      className="relative flex min-h-[76vh] w-full select-none flex-col justify-between overflow-hidden rounded-3xl border-4 border-[#2A475E] bg-gradient-to-b from-[#182635] via-[#1E3345] to-[#121E2B] p-6 font-sans text-white shadow-2xl sm:p-8"
      dir={dir}
    >
      <div className="pointer-events-none absolute right-1/4 top-0 h-80 w-80 rounded-full bg-cyan-400/15 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-teal-400/15 blur-[100px]" />

      <div className="relative z-10 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🪞</span>
          <div>
            <h3 className="text-sm font-bold text-cyan-200">
              {lang === 'ar' ? 'مرآة المشاعر والتعابير' : 'Emotion Mirror'}
            </h3>
            <p className="text-xs text-slate-300">
              {lang === 'ar'
                ? 'انظر للموقف واختر الشعور والتعبير الوجهي المناسب'
                : 'Observe the situation and match the facial expression'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5">
            {lang === 'ar'
              ? `الموقف ${currentIndex + 1} من ${SCENARIOS.length}`
              : `Scene ${currentIndex + 1} of ${SCENARIOS.length}`}
          </span>
          <span className="rounded-xl border border-teal-400/30 bg-teal-600/40 px-3 py-1.5 font-bold text-yellow-300">
            {score}
          </span>
        </div>
      </div>

      <div className="relative z-10 mx-auto my-6 flex max-w-xl flex-col items-center justify-center space-y-5 text-center">
        <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-4 border-cyan-400/30 bg-white/10 text-6xl shadow-[0_0_30px_rgba(46,125,142,0.25)] backdrop-blur-xl transition-all duration-300 sm:h-44 sm:w-44">
          {currentScenario.characterVisual}
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 p-5 shadow-md backdrop-blur-md">
          <p className="text-base font-bold leading-relaxed text-slate-100 sm:text-lg">
            {lang === 'ar'
              ? currentScenario.scenarioAr
              : currentScenario.scenarioEn}
          </p>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
        <span className="mb-3 block text-center text-xs font-bold text-slate-300">
          {lang === 'ar'
            ? 'أي تعبير وجه يطابق هذا الشعور؟'
            : 'Which facial expression matches this feeling?'}
        </span>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {currentScenario.options.map((opt) => {
            const isChosen = selectedEmotion === opt.id;
            let btnStyle =
              'bg-white/10 border-white/20 hover:bg-white/20 hover:border-cyan-400';
            if (isChosen && feedback === 'correct') {
              btnStyle =
                'bg-emerald-500/40 border-emerald-400 scale-105 shadow-[0_0_20px_rgba(52,211,153,0.4)]';
            } else if (isChosen && feedback === 'wrong') {
              btnStyle = 'bg-rose-500/40 border-rose-400 scale-95';
            }
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleChoice(opt.id)}
                disabled={feedback !== null}
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 shadow-md transition-all ${btnStyle}`}
              >
                <span className="text-4xl sm:text-5xl">{opt.icon}</span>
                <span className="text-xs font-bold text-slate-100 sm:text-sm">
                  {lang === 'ar' ? opt.labelAr : opt.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {isCompleted && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 p-6 backdrop-blur-md">
          <div className="w-full max-w-md space-y-5 rounded-3xl border border-cyan-500/40 bg-[#152533] p-8 text-center text-white shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/20 text-3xl text-cyan-300">
              🌟
            </div>
            <h2 className="text-2xl font-bold text-cyan-200">
              {lang === 'ar'
                ? 'أحسنت! اكتملت جولة مرآة المشاعر'
                : 'Great job! Emotion round completed'}
            </h2>
            <div
              className="space-y-2 rounded-2xl border border-white/10 bg-black/40 p-4 text-xs"
              dir={dir}
            >
              <span className="mb-1 block font-bold text-cyan-400">
                {lang === 'ar'
                  ? 'مؤشرات قراءة المشاعر والتواصل غير اللفظي (C12 · C14)'
                  : 'Emotion recognition metrics (C12 · C14)'}
              </span>
              <div className="flex justify-between">
                <span className="text-slate-400">
                  {lang === 'ar' ? 'نسبة التعرف الدقيق:' : 'Accuracy rate:'}
                </span>
                <strong className="text-emerald-400">%{accuracyNow}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">
                  {lang === 'ar' ? 'الإجابات الصحيحة:' : 'Correct answers:'}
                </span>
                <strong className="text-white">
                  {metricsRef.current.correctCount} / {SCENARIOS.length}
                </strong>
              </div>
            </div>
            <button
              type="button"
              onClick={restart}
              className="w-full rounded-xl bg-cyan-600 py-3.5 font-bold text-slate-950 shadow-lg transition hover:bg-cyan-500"
            >
              {lang === 'ar' ? 'جولة جديدة' : 'Play again'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
