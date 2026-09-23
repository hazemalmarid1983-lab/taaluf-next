'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import {
  INTRO_TOUR_STEPS,
  markIntroTourCompleted,
  markIntroTourSkipped,
  shouldShowIntroTour,
  type IntroTourStep,
} from '@/lib/consultantRoom/introTour';

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function getAnchorRect(anchorId: string): Rect | null {
  const el = document.querySelector(`[data-tour-id="${anchorId}"]`);
  if (!el) return null;
  const box = el.getBoundingClientRect();
  return {
    top: box.top,
    left: box.left,
    width: box.width,
    height: box.height,
  };
}

function getTooltipStyle(rect: Rect | null): CSSProperties {
  const margin = 12;
  const cardWidth = 320;
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 360;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 640;

  if (!rect) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: Math.min(cardWidth, viewportW - margin * 2),
    };
  }

  const centeredLeft = Math.min(
    Math.max(margin, rect.left + rect.width / 2 - cardWidth / 2),
    viewportW - cardWidth - margin
  );

  const belowTop = rect.top + rect.height + margin;
  const aboveTop = rect.top - margin;
  const estimatedHeight = 220;
  const placeBelow = belowTop + estimatedHeight <= viewportH - margin;

  return {
    top: placeBelow ? belowTop : Math.max(margin, aboveTop - estimatedHeight),
    left: centeredLeft,
    width: Math.min(cardWidth, viewportW - margin * 2),
  };
}

export default function ConsultantIntroTour() {
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [anchorRect, setAnchorRect] = useState<Rect | null>(null);

  const step: IntroTourStep = INTRO_TOUR_STEPS[stepIndex];
  const totalSteps = INTRO_TOUR_STEPS.length;

  const refreshAnchor = useCallback(() => {
    setAnchorRect(getAnchorRect(step.anchorId));
  }, [step.anchorId]);

  useEffect(() => {
    setVisible(shouldShowIntroTour());
  }, []);

  useEffect(() => {
    if (!visible) return;
    refreshAnchor();
    const onLayout = () => refreshAnchor();
    window.addEventListener('resize', onLayout);
    window.addEventListener('scroll', onLayout, true);
    return () => {
      window.removeEventListener('resize', onLayout);
      window.removeEventListener('scroll', onLayout, true);
    };
  }, [visible, stepIndex, refreshAnchor]);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        markIntroTourSkipped();
        setVisible(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible]);

  const dismiss = useCallback((status: 'skipped' | 'completed') => {
    if (status === 'skipped') {
      markIntroTourSkipped();
    } else {
      markIntroTourCompleted();
    }
    setVisible(false);
  }, []);

  if (!visible) return null;

  const highlightStyle: CSSProperties | undefined = anchorRect
    ? {
        top: anchorRect.top - 4,
        left: anchorRect.left - 4,
        width: anchorRect.width + 8,
        height: anchorRect.height + 8,
      }
    : undefined;

  const tooltipStyle = getTooltipStyle(anchorRect);

  return (
    <div
      className="fixed inset-0 z-[100] print:hidden"
      role="presentation"
      aria-hidden={false}
    >
      <div
        className="absolute inset-0 bg-slate-900/45"
        aria-hidden="true"
        onClick={() => dismiss('skipped')}
      />

      {highlightStyle ? (
        <div
          className="pointer-events-none absolute rounded-2xl border-2 border-[#2E7D8E] ring-2 ring-[#2E7D8E]/30"
          style={highlightStyle}
          aria-hidden="true"
        />
      ) : null}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consultant-intro-tour-title"
        aria-describedby="consultant-intro-tour-body"
        aria-label={`جولة تعريفية — الخطوة ${stepIndex + 1} من ${totalSteps}`}
        className="absolute rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
        style={tooltipStyle}
        dir="rtl"
      >
        <p
          className="text-[11px] font-semibold text-slate-500"
          aria-live="polite"
        >
          {stepIndex + 1}/{totalSteps}
        </p>
        <h2
          id="consultant-intro-tour-title"
          className="mt-1 text-base font-bold text-slate-900"
        >
          {step.titleAr}
        </h2>
        <p
          id="consultant-intro-tour-body"
          className="mt-2 text-sm leading-relaxed text-slate-600"
        >
          {step.bodyAr}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {step.isFinal ? (
            <>
              {step.secondaryAction ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-10"
                  aria-label={step.secondaryAction.labelAr}
                  onClick={() => dismiss('completed')}
                >
                  {step.secondaryAction.labelAr}
                </Button>
              ) : null}
              {step.primaryAction ? (
                <Button
                  type="button"
                  className="min-h-10 bg-[#2E7D8E] hover:bg-[#256b7a]"
                  aria-label={step.primaryAction.labelAr}
                  onClick={() => {
                    dismiss('completed');
                  }}
                  asChild
                >
                  <Link href={step.primaryAction.href}>
                    {step.primaryAction.labelAr}
                  </Link>
                </Button>
              ) : null}
            </>
          ) : (
            <>
              {stepIndex > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-10"
                  aria-label="السابق"
                  onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                >
                  السابق
                </Button>
              ) : null}
              <Button
                type="button"
                className="min-h-10 bg-[#2E7D8E] hover:bg-[#256b7a]"
                aria-label="التالي"
                onClick={() =>
                  setStepIndex((i) => Math.min(totalSteps - 1, i + 1))
                }
              >
                التالي
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="ghost"
            className="min-h-10 text-slate-500"
            aria-label="تخطي الجولة"
            onClick={() => dismiss('skipped')}
          >
            تخطي الجولة
          </Button>
        </div>
      </div>
    </div>
  );
}
