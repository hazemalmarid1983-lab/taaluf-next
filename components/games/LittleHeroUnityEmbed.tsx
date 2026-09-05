'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isLittleHeroMessage, type LittleHeroResult } from '@/lib/littleHero';
import { saveGameSession } from '@/lib/gameSession';

function resolveChildId(childId?: string) {
  if (childId) return childId;
  try {
    const s = JSON.parse(localStorage.getItem('taaluf.activeStudent') || 'null');
    return s?.id || 'child_local';
  } catch {
    return 'child_local';
  }
}

type Props = {
  childId?: string;
  appearance?: { skin: number; shirt: number };
  onComplete?: (result: LittleHeroResult) => void;
};

/**
 * يحمّل بناء Unity WebGL إن وُجد في public/games/little-hero، وإلا يُرجع null.
 */
export function useUnityBuildAvailable() {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch('/games/little-hero/index.html', { method: 'HEAD' })
      .then((res) => {
        if (!cancelled) setAvailable(res.ok);
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return available;
}

export default function LittleHeroUnityEmbed({
  childId,
  appearance,
  onComplete,
}: Props) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const child = useMemo(() => resolveChildId(childId), [childId]);
  const [msg, setMsg] = useState('');

  const send = useCallback((fn: string, arg: string) => {
    const win = frameRef.current?.contentWindow as
      | (Window & {
          unityInstance?: { SendMessage: (o: string, m: string, v: string) => void };
        })
      | null;
    try {
      win?.unityInstance?.SendMessage('LittleHeroRoot', fn, arg);
    } catch {
      /* build may use a different instance name */
    }
  }, []);

  useEffect(() => {
    const onMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!isLittleHeroMessage(event.data)) return;
      const payload = event.data.payload;
      if (payload.type === 'ready') {
        send('SetChildId', child);
        send(
          'SetAppearance',
          `${appearance?.skin ?? 0},${appearance?.shirt ?? 0}`
        );
        send('StartAdventureFromPage', '1');
      }
      if (payload.type === 'complete') {
        const result = payload.result;
        try {
          await saveGameSession({
            childId: payload.childId || child,
            gameCode: 'little_hero',
            score: result.score,
            levelReached: result.levelReached,
            metrics: result.metrics,
            trials: result.trials,
            startedAt: result.startedAt,
            endedAt: result.endedAt,
          });
          setMsg('تم حفظ جلسة المغامرة');
        } catch (err) {
          setMsg(err instanceof Error ? err.message : 'تعذر الحفظ');
        }
        onComplete?.(result);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [appearance?.shirt, appearance?.skin, child, onComplete, send]);

  return (
    <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-black">
      <iframe
        ref={frameRef}
        title="مغامرة البطل الصغير"
        src="/games/little-hero/index.html"
        className="h-[640px] w-full"
        allow="autoplay; microphone; camera"
      />
      {msg && (
        <p className="bg-white px-4 py-2 text-sm text-[#2D8B5A]">{msg}</p>
      )}
    </div>
  );
}
