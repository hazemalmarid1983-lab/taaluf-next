'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import MerhidChat from '@/components/merhid/MerhidChat';
import { ADVISOR_PLATFORM_SECTIONS } from '@/lib/advisorPlatformGuide';
import type { HubActor, HubMerhidDirectives, HubPost } from '@/lib/clinicalHub';

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-bold text-[#0b1f14]">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function HubOnboardingMeeting({
  post,
  actor,
  merhidDirectives,
  isAr,
  canApprove,
  onReply,
  onToggleStatus,
  onSaveDirectives,
}: {
  post: HubPost;
  actor: HubActor;
  merhidDirectives: HubMerhidDirectives;
  isAr: boolean;
  canApprove: boolean;
  onReply: (id: string, reply: string) => Promise<void>;
  onToggleStatus: (id: string, status: 'pending' | 'approved') => Promise<void>;
  onSaveDirectives: (text: string) => Promise<void>;
}) {
  const [openSection, setOpenSection] = useState(ADVISOR_PLATFORM_SECTIONS[0].id);
  const [reply, setReply] = useState('');
  const [directivesDraft, setDirectivesDraft] = useState(merhidDirectives.text);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isAdmin = actor.role === 'admin';
  const advisorReplied = post.replies.some((r) => r.authorMemberId === 'samer');

  const sendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setBusy(true);
    setError('');
    try {
      await onReply(post.id, reply);
      setReply('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الإرسال');
    } finally {
      setBusy(false);
    }
  };

  const saveDirectives = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSaveDirectives(directivesDraft);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الحفظ');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-3xl border-2 border-[#2E7D8E]/30 bg-white shadow-md">
      <header className="bg-gradient-to-l from-[#0b1f14] to-[#1f6b44] px-6 py-5 text-white">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-200/80">
          {isAr ? 'الاجتماع الأول · غير متزامن' : 'First meeting · Async'}
        </p>
        <h2 className="mt-2 text-2xl font-bold">
          {isAr
            ? 'تعريف شامل بمنصة تآلف — المحتوى والمنهجية وآلية العمل'
            : 'Complete Taaluf overview — content, methodology & workflow'}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-emerald-50/90">
          {isAr
            ? 'اقرأ جميع الأقسام أدناه، ثم شارك ملاحظاتك واقتراحاتك في الدردشة بينك وبين الإدارة. مرشد تآلف بجوارك — يعمل بتوجيه الإدارة فقط.'
            : 'Read all sections below, then share your notes and proposals in the admin–advisor chat. Merhid is alongside you — admin-directed only.'}
        </p>
      </header>

      {isAdmin ? (
        <form
          onSubmit={saveDirectives}
          className="border-b border-amber-100 bg-amber-50/80 px-6 py-4"
        >
          <p className="text-xs font-black uppercase tracking-wide text-amber-900">
            {isAr
              ? 'توجيه مرشد تآلف (للإدارة فقط)'
              : 'Merhid directives (admin only)'}
          </p>
          <p className="mt-1 text-xs text-amber-800/80">
            {isAr
              ? 'يُلزم المساعد الذكي بهذه التوجيهات عند مساعدة المستشار.'
              : 'The AI assistant must follow these directives when helping the advisor.'}
          </p>
          <textarea
            value={directivesDraft}
            onChange={(e) => setDirectivesDraft(e.target.value)}
            rows={5}
            className="mt-3 w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm leading-7"
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isAr ? 'حفظ التوجيهات' : 'Save directives'}
          </button>
        </form>
      ) : (
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-3 text-xs leading-6 text-slate-600">
          <span className="font-bold text-slate-800">
            {isAr ? 'توجيه الإدارة لمرشد تآلف:' : 'Admin Merhid directives:'}
          </span>{' '}
          {merhidDirectives.text.slice(0, 200)}
          {merhidDirectives.text.length > 200 ? '…' : ''}
        </div>
      )}

      <div className="grid gap-0 lg:grid-cols-[1fr_340px]">
        <div className="border-b border-slate-100 p-4 lg:border-b-0 lg:border-e">
          <div className="space-y-2">
            {ADVISOR_PLATFORM_SECTIONS.map((section, idx) => {
              const open = openSection === section.id;
              return (
                <div
                  key={section.id}
                  className={`rounded-2xl border ${
                    open ? 'border-[#2E7D8E]/40 bg-emerald-50/30' : 'border-slate-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenSection(section.id)}
                    className="flex w-full items-start justify-between gap-2 p-4 text-start"
                  >
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">
                        {isAr ? `القسم ${idx + 1}` : `Section ${idx + 1}`}
                      </p>
                      <p className="font-bold text-[#0b1f14]">
                        {isAr ? section.titleAr : section.titleEn}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {isAr ? section.summaryAr : section.summaryEn}
                      </p>
                    </div>
                    <span className="text-lg text-slate-400">{open ? '−' : '+'}</span>
                  </button>
                  {open && (
                    <div className="border-t border-slate-100 px-4 pb-4 pt-2">
                      <p className="text-sm leading-8 text-slate-700">
                        <RichText text={isAr ? section.bodyAr : section.bodyEn} />
                      </p>
                      <div className="mt-3 rounded-xl bg-white p-3">
                        <p className="text-[10px] font-black uppercase text-slate-400">
                          {isAr ? 'المنهجية' : 'Methodology'}
                        </p>
                        <ul className="mt-1 list-inside list-disc text-sm leading-7 text-slate-700">
                          {(isAr
                            ? section.methodologyAr
                            : section.methodologyEn
                          ).map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      </div>
                      <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm leading-7 text-emerald-950">
                        <span className="font-bold">
                          {isAr ? 'دورك: ' : 'Your role: '}
                        </span>
                        {isAr ? section.advisorRoleAr : section.advisorRoleEn}
                      </p>
                      {section.explore?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {section.explore.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              target="_blank"
                              className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-[#2E7D8E]"
                            >
                              {isAr ? link.labelAr : link.labelEn} ↗
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col bg-slate-50/50 p-4">
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#2E7D8E]">
            {isAr ? 'مرشد تآلف — بتوجيه الإدارة' : 'Merhid — admin-directed'}
          </p>
          <MerhidChat
            scope={isAdmin ? 'admin' : 'scientific_advisor'}
            embedded
            hubDirectives={isAdmin ? undefined : merhidDirectives.text}
          />
        </div>
      </div>

      <footer className="border-t border-slate-200 bg-white px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-[#0b1f14]">
            {isAr ? 'دردشة الاجتماع — ملاحظات واقتراحات' : 'Meeting chat — notes & proposals'}
          </h3>
          {!advisorReplied && actor.role === 'scientific_advisor' && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800">
              {isAr ? 'شارك ملاحظاتك بعد القراءة' : 'Share notes after reading'}
            </span>
          )}
        </div>

        {post.replies.length > 0 && (
          <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {post.replies.map((item) => (
              <li
                key={item.id}
                className={`rounded-2xl px-4 py-3 text-sm leading-7 ${
                  item.authorMemberId === 'samer'
                    ? 'bg-emerald-50 text-emerald-950'
                    : item.authorMemberId === 'hazem'
                      ? 'bg-slate-100 text-slate-800'
                      : 'bg-slate-50 text-slate-700'
                }`}
              >
                <p className="text-[11px] font-bold text-slate-500">
                  {item.authorName} ·{' '}
                  {new Date(item.createdAt).toLocaleString(isAr ? 'ar' : 'en')}
                </p>
                <p className="whitespace-pre-wrap">{item.body}</p>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={sendReply} className="mt-4 space-y-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm leading-7"
            placeholder={
              isAr
                ? 'اكتب ملاحظاتك واقتراحاتك بعد مراجعة محتوى المنصة…'
                : 'Write your notes and proposals after reviewing the platform…'
            }
          />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={busy || !reply.trim()}
              className="rounded-xl bg-[#0b1f14] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isAr ? 'إرسال للنقاش' : 'Send to discussion'}
            </button>
            {canApprove && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onToggleStatus(post.id, 'approved')}
                className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-800"
              >
                {isAr ? 'تأكيد اطلاع المستشار' : 'Confirm advisor briefing'}
              </button>
            )}
          </div>
        </form>
      </footer>
    </article>
  );
}
