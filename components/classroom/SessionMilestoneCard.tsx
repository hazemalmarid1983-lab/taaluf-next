'use client';

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import type { HomeSessionSummary } from '@/lib/homeClassroomEngine';
import {
  buildMilestoneShareText,
  milestoneBadge,
  milestoneStarCount,
  whatsAppShareUrl,
} from '@/lib/reinforcerDelivery';
import { summarizePromptLevels } from '@/lib/promptHierarchy';

/**
 * بطاقة إنجاز الجلسة — قابلة للتصدير كصورة أو المشاركة فوراً.
 */
export default function SessionMilestoneCard({
  summary,
  childName,
  isAr,
  dir = 'rtl',
  className,
}: {
  summary: HomeSessionSummary;
  childName?: string;
  isAr: boolean;
  dir?: 'rtl' | 'ltr';
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<'export' | 'share' | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const stars = milestoneStarCount(summary.masteryPercentage);
  const badge = milestoneBadge(summary.band, isAr);
  const breakdown = summary.promptBreakdown;
  const promptSummary = breakdown
    ? summarizePromptLevels(breakdown, isAr)
    : null;
  const displayName = childName?.trim() || (isAr ? 'بطلنا الصغير' : 'Our little hero');
  const sessionDate = new Date(summary.sessionDate).toLocaleDateString(
    isAr ? 'ar-AE' : 'en-GB',
    { weekday: 'long', day: 'numeric', month: 'long' }
  );

  const shareText = buildMilestoneShareText(
    summary,
    childName,
    breakdown,
    isAr
  );

  const renderPng = async () => {
    const node = cardRef.current;
    if (!node) throw new Error('CARD_MISSING');
    return toPng(node, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#f0f9ff',
    });
  };

  const exportImage = async () => {
    setBusy('export');
    setStatus(null);
    try {
      const dataUrl = await renderPng();
      const link = document.createElement('a');
      link.download = `taaluf-milestone-${summary.goalId}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      setStatus(isAr ? '✓ تم حفظ البطاقة كصورة' : '✓ Card saved as image');
    } catch {
      setStatus(isAr ? 'تعذر تصدير الصورة' : 'Could not export the image');
    } finally {
      setBusy(null);
    }
  };

  const shareMilestone = async () => {
    setBusy('share');
    setStatus(null);
    try {
      const dataUrl = await renderPng();
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'taaluf-milestone.png', {
        type: 'image/png',
      });

      if (
        typeof navigator !== 'undefined' &&
        navigator.share &&
        (!navigator.canShare || navigator.canShare({ files: [file] }))
      ) {
        await navigator.share({
          title: isAr ? 'إنجاز جلسة تدريب' : 'Training session milestone',
          text: shareText,
          files: [file],
        });
        setStatus(isAr ? '✓ تمت المشاركة' : '✓ Shared');
      } else {
        window.open(whatsAppShareUrl(shareText), '_blank', 'noopener,noreferrer');
        setStatus(
          isAr
            ? '✓ فُتح واتساب — أرفقي الصورة من التصدير إن لزم'
            : '✓ WhatsApp opened — attach the exported image if needed'
        );
      }
    } catch {
      window.open(whatsAppShareUrl(shareText), '_blank', 'noopener,noreferrer');
      setStatus(isAr ? 'شاركي النص عبر واتساب' : 'Share the text via WhatsApp');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={`space-y-4 ${className || ''}`}>
      <div
        ref={cardRef}
        dir={dir}
        className="overflow-hidden rounded-3xl border border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-6 shadow-[0_20px_60px_rgba(46,125,142,0.12)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#2E7D8E]">
              {isAr ? 'تآلف · إنجاز جلسة' : 'Taaluf · Session milestone'}
            </p>
            <h3 className="mt-1 text-xl font-black text-[#0b1f14]">
              {displayName}
            </h3>
            <p className="mt-1 text-xs font-bold text-slate-600">
              {summary.goalTitleAr}
            </p>
          </div>
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-center">
            <span className="text-2xl leading-none">{badge.emoji}</span>
            <span className="mt-0.5 text-[8px] font-black text-amber-900">
              {badge.label}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-3 text-center">
            <span className="block text-2xl font-black text-emerald-800">
              {summary.masteryPercentage}%
            </span>
            <span className="text-[10px] font-bold text-emerald-700">
              {isAr ? 'الاستقلالية' : 'Independence'}
            </span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-center">
            <span className="block text-2xl font-black text-slate-800">
              {summary.independentCount}/{summary.totalTrials}
            </span>
            <span className="text-[10px] font-bold text-slate-600">
              {isAr ? 'محاولات مستقلة' : 'Independent trials'}
            </span>
          </div>
        </div>

        {promptSummary ? (
          <p className="mt-4 rounded-xl border border-white bg-white/70 px-3 py-2.5 text-center text-[11px] font-bold leading-6 text-slate-700">
            {promptSummary}
          </p>
        ) : null}

        <div className="mt-4 flex justify-center gap-1">
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              className={`text-2xl ${index < stars ? 'opacity-100' : 'opacity-20 grayscale'}`}
              aria-hidden
            >
              ⭐
            </span>
          ))}
        </div>

        <p className="mt-3 text-center text-[10px] font-semibold text-slate-400">
          {sessionDate}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => void exportImage()}
          disabled={busy !== null}
          className="flex-1 rounded-2xl border border-[#2E7D8E]/30 bg-white px-4 py-3 text-xs font-black text-[#2E7D8E] transition hover:bg-[#2E7D8E]/10 active:scale-95 disabled:opacity-50"
        >
          {busy === 'export'
            ? isAr
              ? 'جارٍ التصدير…'
              : 'Exporting…'
            : isAr
              ? '📥 تصدير البطاقة كصورة'
              : '📥 Export card as image'}
        </button>
        <button
          type="button"
          onClick={() => void shareMilestone()}
          disabled={busy !== null}
          className="flex-1 rounded-2xl bg-[#25D366] px-4 py-3 text-xs font-black text-white shadow-md transition hover:bg-[#1fb855] active:scale-95 disabled:opacity-50"
        >
          {busy === 'share'
            ? isAr
              ? 'جارٍ التحضير…'
              : 'Preparing…'
            : isAr
              ? '💬 مشاركة مع الأخصائي / العائلة'
              : '💬 Share with specialist / family'}
        </button>
      </div>

      {status ? (
        <p className="text-center text-[11px] font-bold text-slate-500">{status}</p>
      ) : null}
    </div>
  );
}
