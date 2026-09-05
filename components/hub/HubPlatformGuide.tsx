'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import {
  ADVISOR_PLATFORM_SECTIONS,
  advisorGuideProgress,
  nextUnacknowledgedSectionId,
  type AdvisorGuideState,
} from '@/lib/advisorPlatformGuide';
import type { HubActor } from '@/lib/clinicalHub';

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p className="text-sm leading-8 text-slate-700">
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-bold text-[#0b1f14]">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

export default function HubPlatformGuide({
  actor,
  advisorGuide,
  isAr,
  onAcknowledge,
  onReset,
}: {
  actor: HubActor;
  advisorGuide: AdvisorGuideState;
  isAr: boolean;
  onAcknowledge: (sectionId: string, signerName: string) => Promise<AdvisorGuideState>;
  onReset: () => Promise<void>;
}) {
  const progress = advisorGuideProgress(advisorGuide);
  const isAdvisor = actor.role === 'scientific_advisor';
  const [openId, setOpenId] = useState<string>(
    ADVISOR_PLATFORM_SECTIONS.find(
      (s) => !advisorGuide.sections[s.id]?.acknowledged
    )?.id ?? ADVISOR_PLATFORM_SECTIONS[0].id
  );
  const [signerName, setSignerName] = useState(
    isAr ? actor.nameAr : actor.nameEn
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submitAck = async (e: FormEvent, sectionId: string) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const updated = await onAcknowledge(sectionId, signerName);
      const next = nextUnacknowledgedSectionId(updated);
      if (next) setOpenId(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الاعتماد');
    } finally {
      setBusy(false);
    }
  };

  const allDone = progress.completed === progress.total;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-emerald-100 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#2E7D8E]">
              {isAr ? 'دليل المنصة' : 'Platform guide'}
            </p>
            <h2 className="mt-2 text-xl font-bold text-[#0b1f14]">
              {isAr
                ? 'تعريف شامل بمنصة تآلف — منهجية ومحتوى وسير عمل'
                : 'Complete Taaluf overview — methodology, content & workflow'}
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {isAr
                ? 'اقرأ كل قسم بعناية ثم اضغط «أقرّ بمراجعة هذا القسم» قبل الانتقال للقسم التالي.'
                : 'Read each section carefully, then confirm acknowledgment before moving on.'}
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-[#2D8B5A]">
              {progress.completed}/{progress.total}
            </p>
            <p className="text-xs text-slate-500">
              {isAr ? 'أقسام معتمدة' : 'Sections acknowledged'}
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#2D8B5A] transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        {allDone && (
          <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
            {isAr
              ? '✓ أكملت مراجعة الدليل — يمكنك الآن توقيع اتفاقية الشراكة وبدء العمل في غرفة الاجتماعات.'
              : '✓ Guide complete — you may now sign the partnership agreement and start in the meeting room.'}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {ADVISOR_PLATFORM_SECTIONS.map((section, idx) => {
          const ack = advisorGuide.sections[section.id];
          const open = openId === section.id;
          return (
            <article
              key={section.id}
              className={`rounded-3xl border bg-white shadow-sm ${
                ack?.acknowledged
                  ? 'border-emerald-200'
                  : open
                    ? 'border-[#2E7D8E]'
                    : 'border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenId(section.id)}
                className="flex w-full items-start justify-between gap-3 p-5 text-start"
              >
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {isAr ? `القسم ${idx + 1}` : `Section ${idx + 1}`}
                  </p>
                  <h3 className="mt-1 text-base font-bold text-[#0b1f14]">
                    {isAr ? section.titleAr : section.titleEn}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {isAr ? section.summaryAr : section.summaryEn}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    ack?.acknowledged
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {ack?.acknowledged
                    ? isAr
                      ? 'معتمد'
                      : 'Acknowledged'
                    : isAr
                      ? 'بانتظار الاعتماد'
                      : 'Pending'}
                </span>
              </button>

              {open && (
                <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                  <RichText text={isAr ? section.bodyAr : section.bodyEn} />

                  <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                      {isAr ? 'منهجية العمل' : 'How it works'}
                    </p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-7 text-slate-700">
                      {(isAr ? section.methodologyAr : section.methodologyEn).map(
                        (line) => (
                          <li key={line}>{line}</li>
                        )
                      )}
                    </ul>
                  </div>

                  <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-emerald-800">
                      {isAr ? 'دورك كمستشار' : 'Your advisory role'}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-emerald-950">
                      {isAr ? section.advisorRoleAr : section.advisorRoleEn}
                    </p>
                  </div>

                  {section.explore?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {section.explore.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1f6b44] hover:bg-emerald-50"
                        >
                          {isAr ? link.labelAr : link.labelEn} →
                        </Link>
                      ))}
                    </div>
                  ) : null}

                  {isAdvisor ? (
                    ack?.acknowledged ? (
                      <p className="mt-4 text-sm text-emerald-800">
                        {isAr
                          ? `تم الاعتماد باسم ${ack.signerName} — ${formatWhen(ack.acknowledgedAt, isAr)}`
                          : `Acknowledged by ${ack.signerName} — ${formatWhen(ack.acknowledgedAt, isAr)}`}
                      </p>
                    ) : (
                      <form
                        onSubmit={(e) => submitAck(e, section.id)}
                        className="mt-4 space-y-3 rounded-2xl border border-dashed border-emerald-200 p-4"
                      >
                        <p className="text-sm text-slate-600">
                          {isAr
                            ? 'بعد قراءة هذا القسم، أكّد فهمك وموافقتك على محتواه.'
                            : 'After reading this section, confirm your understanding and acceptance.'}
                        </p>
                        <input
                          value={signerName}
                          onChange={(e) => setSignerName(e.target.value)}
                          required
                          className="w-full max-w-md rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        />
                        <button
                          type="submit"
                          disabled={busy}
                          className="rounded-xl bg-[#2D8B5A] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          {busy
                            ? isAr
                              ? 'جاري الاعتماد…'
                              : 'Confirming…'
                            : isAr
                              ? 'أقرّ بمراجعة هذا القسم'
                              : 'I acknowledge this section'}
                        </button>
                      </form>
                    )
                  ) : (
                    <p className="mt-4 text-xs text-slate-500">
                      {ack?.acknowledged
                        ? isAr
                          ? `اعتمدها المستشار: ${ack.signerName}`
                          : `Acknowledged by advisor: ${ack.signerName}`
                        : isAr
                          ? 'بانتظار اعتماد د. سامر'
                          : 'Awaiting Dr. Samer’s acknowledgment'}
                    </p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {actor.role === 'admin' && (
        <button
          type="button"
          onClick={() => {
            setBusy(true);
            onReset()
              .catch((err) =>
                setError(err instanceof Error ? err.message : 'تعذر الضبط')
              )
              .finally(() => setBusy(false));
          }}
          disabled={busy}
          className="text-xs font-semibold text-slate-400 underline hover:text-rose-600"
        >
          {isAr ? 'إعادة ضبط اعتمادات الدليل (إدارة)' : 'Reset guide acknowledgments (admin)'}
        </button>
      )}
    </div>
  );
}

function formatWhen(iso: string | undefined, isAr: boolean) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(isAr ? 'ar' : 'en-GB');
}
