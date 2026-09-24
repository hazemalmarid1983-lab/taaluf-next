'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { SENSORY_FOCUS_BODY_CLASS } from '@/lib/sensoryFocusMode';

export default function ActivityFocusShell({ children }: { children: ReactNode }) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    document.body.classList.add(SENSORY_FOCUS_BODY_CLASS);
    setPortalRoot(document.body);
    void document.documentElement.requestFullscreen?.().catch(() => undefined);
    return () => {
      document.body.classList.remove(SENSORY_FOCUS_BODY_CLASS);
      if (document.fullscreenElement) {
        void document.exitFullscreen?.().catch(() => undefined);
      }
    };
  }, []);

  const canvas = (
    <div
      className="fixed inset-0 z-[200] overflow-hidden bg-[#F7F3EB]"
      data-activity-focus
    >
      <button
        type="button"
        onClick={() => {
          if (document.fullscreenElement) {
            void document.exitFullscreen?.().catch(() => undefined);
          }
          window.history.back();
        }}
        className="absolute start-3 top-3 z-10 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-500"
      >
        إيقاف
      </button>
      {children}
    </div>
  );

  if (!portalRoot) return canvas;
  return createPortal(canvas, portalRoot);
}
