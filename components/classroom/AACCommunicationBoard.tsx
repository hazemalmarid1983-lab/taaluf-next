'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import {
  AAC_CATEGORIES,
  AAC_MAX_CARDS,
  aacCardsInCategory,
  buildAacSentence,
  type AacCard,
} from '@/lib/aacBoard';
import { speakText, stopSpeaking } from '@/lib/sensoryAudio';

/**
 * لوحة تواصل معزّز وبديل (AAC) داخل المنصة.
 *
 * مصمّمة للطفل غير الناطق أو محدود الكلام: بطاقات مصوّرة كبيرة، نطق فوري
 * لاسم البطاقة عند اللمس، وشريط يجمع الاختيارات في جملة واحدة تُنطق كاملة.
 */
export default function AACCommunicationBoard({
  soundOn = true,
  onSpeakSentence,
  className,
}: {
  soundOn?: boolean;
  onSpeakSentence?: (sentence: string) => void;
  className?: string;
}) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [picked, setPicked] = useState<AacCard[]>([]);
  const [clearing, setClearing] = useState(false);

  const sentence = useMemo(() => buildAacSentence(picked, lang), [picked, lang]);
  const isFull = picked.length >= AAC_MAX_CARDS;

  useEffect(() => () => stopSpeaking(), []);

  const speak = (text: string) => {
    if (!soundOn || !text) return;
    speakText(text, { lang, rate: 0.8 });
  };

  const addCard = (card: AacCard) => {
    if (isFull) return;
    setClearing(false);
    setPicked((prev) => [...prev, card]);
    speak(isAr ? card.labelAr : card.labelEn);
  };

  const removeAt = (index: number) =>
    setPicked((prev) => prev.filter((_, position) => position !== index));

  const speakSentence = () => {
    if (!sentence) return;
    speak(sentence);
    onSpeakSentence?.(sentence);
  };

  // تلاشٍ قصير قبل الإفراغ، فاختفاء الشريط دفعة واحدة مربك بصرياً
  const clearStrip = () => {
    if (!picked.length) return;
    stopSpeaking();
    setClearing(true);
    window.setTimeout(() => {
      setPicked([]);
      setClearing(false);
    }, 220);
  };

  return (
    <section
      className={`space-y-5 rounded-3xl border border-white/90 bg-white/85 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:p-6 ${className || ''}`}
    >
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-sm font-black text-[#0b1f14] sm:text-base">
          <span className="text-xl">🗣️</span>
          <span>
            {isAr
              ? 'لوحة التواصل المعزز والبديل'
              : 'Augmentative & alternative communication board'}
          </span>
        </h2>
        <p className="mt-1 text-[11px] leading-6 text-slate-500">
          {isAr
            ? 'دعي الطفل يلمس البطاقات ليكوّن جملته، ثم اسمعاها معاً — بديل داخلي عن تطبيقات التواصل الخارجية.'
            : 'Let the child tap cards to build a sentence, then hear it together — an in-platform alternative to external AAC apps.'}
        </p>
      </div>

      {/* شريط تكوين الجملة */}
      <div className="space-y-3 rounded-2xl border-2 border-dashed border-[#2E7D8E]/30 bg-[#2E7D8E]/[0.04] p-4">
        <div
          className={`flex min-h-[92px] flex-wrap items-center gap-2 transition-opacity duration-200 ${
            clearing ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {picked.length === 0 ? (
            <p className="w-full text-center text-[11px] font-bold leading-6 text-slate-400">
              {isAr
                ? 'الشريط فارغ — المس بطاقة ليبدأ تكوين الجملة.'
                : 'The strip is empty — tap a card to start building the sentence.'}
            </p>
          ) : (
            picked.map((card, index) => (
              <button
                key={`${card.id}-${index}`}
                type="button"
                onClick={() => removeAt(index)}
                title={isAr ? 'احذفي هذه البطاقة' : 'Remove this card'}
                className="taaluf-settle flex items-center gap-2 rounded-2xl border-2 border-[#2E7D8E]/30 bg-white px-3 py-2 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 active:scale-95"
              >
                <span className="text-2xl leading-none">{card.emoji}</span>
                <span className="text-xs font-black text-[#0b1f14]">
                  {isAr ? card.labelAr : card.labelEn}
                </span>
              </button>
            ))
          )}
        </div>

        {sentence && !clearing && (
          <p
            dir="auto"
            className="rounded-xl border border-[#2E7D8E]/20 bg-white px-3 py-2 text-center text-sm font-black text-[#0b1f14]"
          >
            «{sentence}»
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={speakSentence}
            disabled={!picked.length || !soundOn}
            className="flex-1 rounded-2xl bg-[#2E7D8E] px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-[#236372] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isAr ? '🔊 تشغيل الجملة كاملة' : '🔊 Speak the whole sentence'}
          </button>
          <button
            type="button"
            onClick={() => removeAt(picked.length - 1)}
            disabled={!picked.length}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 active:scale-95 disabled:opacity-40"
          >
            {isAr ? '⌫ تراجع' : '⌫ Undo'}
          </button>
          <button
            type="button"
            onClick={clearStrip}
            disabled={!picked.length}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 active:scale-95 disabled:opacity-40"
          >
            {isAr ? '🧹 مسح' : '🧹 Clear'}
          </button>
        </div>

        {isFull && (
          <p className="text-center text-[10px] font-bold text-amber-700">
            {isAr
              ? `اكتمل الشريط عند ${AAC_MAX_CARDS} بطاقات — اسمعي الجملة ثم امسحيها.`
              : `The strip is full at ${AAC_MAX_CARDS} cards — play the sentence, then clear it.`}
          </p>
        )}
      </div>

      {/* فئات البطاقات */}
      {AAC_CATEGORIES.map((category) => (
        <div
          key={category.id}
          className={`space-y-3 rounded-2xl border p-4 ${category.tone}`}
        >
          <strong className="flex items-center gap-2 text-xs font-black text-[#0b1f14]">
            <span className="text-base leading-none">{category.emoji}</span>
            <span>{isAr ? category.labelAr : category.labelEn}</span>
          </strong>

          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
            {aacCardsInCategory(category.id).map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => addCard(card)}
                disabled={isFull}
                aria-label={isAr ? card.labelAr : card.labelEn}
                className="flex flex-col items-center gap-1 rounded-2xl border-2 border-white bg-white p-3 shadow-sm transition hover:border-[#2E7D8E]/40 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="text-3xl leading-none">{card.emoji}</span>
                <span className="text-[11px] font-black leading-5 text-[#0b1f14]">
                  {isAr ? card.labelAr : card.labelEn}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <p className="text-[10px] leading-5 text-slate-400">
        {isAr
          ? 'اللوحة وسيلة تعبير مساندة للتدريب المنزلي، ولا تغني عن خطة تواصل يضعها أخصائي النطق.'
          : 'A supportive expression tool for home practice — not a replacement for a speech therapist’s communication plan.'}
      </p>
    </section>
  );
}
