'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type GazeSample = {
  x: number;
  y: number;
  present: boolean;
};

/**
 * تقدير اتجاه النظر محلياً عبر MediaPipe Face Landmarker.
 * لا يُرفع الفيديو. تجريبي وليس قياساً طبياً.
 */
export function useGazeTracker(enabled: boolean) {
  const [gaze, setGaze] = useState<GazeSample | null>(null);
  const [status, setStatus] = useState<'off' | 'loading' | 'live' | 'denied' | 'unavailable'>('off');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    setGaze(null);
    setStatus('off');
  }, []);

  const start = useCallback(async () => {
    if (!enabled || typeof window === 'undefined') return;
    setStatus('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      const video = document.createElement('video');
      video.setAttribute('playsinline', 'true');
      video.muted = true;
      video.srcObject = stream;
      await video.play();
      videoRef.current = video;

      const load = new Function('u', 'return import(u)') as (
        u: string
      ) => Promise<{
        FilesetResolver: {
          forVisionTasks: (p: string) => Promise<unknown>;
        };
        FaceLandmarker: {
          createFromOptions: (
            files: unknown,
            opts: Record<string, unknown>
          ) => Promise<{
            detectForVideo: (
              v: HTMLVideoElement,
              ts: number
            ) => { faceLandmarks?: Array<Array<{ x: number; y: number }>> };
            close: () => void;
          }>;
        };
      }>;
      const vision = await load(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm'
      );

      const files = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      const landmarker = await vision.FaceLandmarker.createFromOptions(files, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      });

      let raf = 0;
      const loop = () => {
        const now = performance.now();
        const result = landmarker.detectForVideo(video, now);
        const face = result.faceLandmarks?.[0];
        if (face && face.length > 473) {
          const left = face[473];
          const right = face[468] || face[473];
          setGaze({
            x: 1 - (left.x + right.x) / 2,
            y: (left.y + right.y) / 2,
            present: true,
          });
        } else {
          setGaze({ x: 0.5, y: 0.5, present: false });
        }
        raf = window.requestAnimationFrame(loop);
      };
      raf = window.requestAnimationFrame(loop);
      setStatus('live');

      stopRef.current = () => {
        window.cancelAnimationFrame(raf);
        landmarker.close();
        stream.getTracks().forEach((t) => t.stop());
        video.srcObject = null;
      };
    } catch (err) {
      const name = err instanceof Error ? err.name : '';
      setStatus(name === 'NotAllowedError' ? 'denied' : 'unavailable');
    }
  }, [enabled]);

  useEffect(() => () => stop(), [stop]);

  return { gaze, status, start, stop, videoRef };
}
