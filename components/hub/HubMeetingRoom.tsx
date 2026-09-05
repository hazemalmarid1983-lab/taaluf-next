'use client';

import { FormEvent, useState } from 'react';
import {
  canApproveHubProposal,
  HUB_POST_CATEGORIES,
  type HubActor,
  type HubPost,
  type HubPostCategory,
  type HubPostStatus,
} from '@/lib/clinicalHub';

export default function HubMeetingRoom({
  actor,
  posts,
  isAr,
  onCreate,
  onReply,
  onToggleStatus,
}: {
  actor: HubActor;
  posts: HubPost[];
  isAr: boolean;
  onCreate: (input: {
    category: HubPostCategory;
    title: string;
    body: string;
  }) => Promise<void>;
  onReply: (id: string, reply: string) => Promise<void>;
  onToggleStatus: (id: string, status: HubPostStatus) => Promise<void>;
}) {
  const canApprove = canApproveHubProposal(actor.role);
  const [category, setCategory] = useState<HubPostCategory>('clinical_evaluation');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onCreate({ category, title, body });
      setTitle('');
      setBody('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الإرسال');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-emerald-100 bg-white p-6">
        <h2 className="text-xl font-bold text-[#0b1f14]">
          {isAr ? 'غرفة الاجتماعات' : 'Meeting room'}
        </h2>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">
                {isAr ? 'التصنيف' : 'Category'}
              </span>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as HubPostCategory)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                {(Object.keys(HUB_POST_CATEGORIES) as HubPostCategory[]).map(
                  (key) => (
                    <option key={key} value={key}>
                      {isAr
                        ? HUB_POST_CATEGORIES[key].ar
                        : HUB_POST_CATEGORIES[key].en}
                    </option>
                  )
                )}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">
                {isAr ? 'العنوان' : 'Title'}
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                placeholder={
                  isAr ? 'مثال: مقترح مؤشر هدوء الغرفة المطرية' : 'e.g. Rain room calm index'
                }
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-slate-500">
              {isAr ? 'المحتوى' : 'Note'}
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm leading-7"
              placeholder={
                isAr
                  ? 'اكتب التقييم أو الملاحظة أو المقياس المقترح…'
                  : 'Write the evaluation, research note, or proposed metric…'
              }
            />
          </label>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-[#2E7D8E] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy
              ? isAr
                ? 'جاري الإرسال…'
                : 'Sending…'
              : isAr
                ? 'إرسال للمراجعة'
                : 'Submit for review'}
          </button>
        </form>
      </div>

      <ul className="space-y-4">
        {posts.map((post) => (
          <HubPostCard
            key={post.id}
            post={post}
            isAr={isAr}
            canApprove={canApprove}
            onReply={onReply}
            onToggleStatus={onToggleStatus}
          />
        ))}
      </ul>
    </div>
  );
}

function HubPostCard({
  post,
  isAr,
  canApprove,
  onReply,
  onToggleStatus,
}: {
  post: HubPost;
  isAr: boolean;
  canApprove: boolean;
  onReply: (id: string, reply: string) => Promise<void>;
  onToggleStatus: (id: string, status: HubPostStatus) => Promise<void>;
}) {
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const approved = post.status === 'approved';
  const category = HUB_POST_CATEGORIES[post.category];

  const sendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setBusy(true);
    try {
      await onReply(post.id, reply);
      setReply('');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async () => {
    setBusy(true);
    try {
      await onToggleStatus(post.id, approved ? 'pending' : 'approved');
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-slate-400">
            {isAr ? category.ar : category.en} · {post.authorName}
          </p>
          <h3 className="mt-1 text-lg font-bold text-[#0b1f14]">{post.title}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold ${
              approved
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {approved
              ? isAr
                ? 'معتمد'
                : 'Approved'
              : isAr
                ? 'قيد المراجعة'
                : 'Pending'}
          </span>
          {canApprove && (
            <button
              type="button"
              disabled={busy}
              onClick={toggle}
              className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              {approved
                ? isAr
                  ? 'إرجاع للمراجعة'
                  : 'Mark pending'
                : isAr
                  ? 'اعتماد'
                  : 'Approve'}
            </button>
          )}
        </div>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
        {post.body}
      </p>
      <p className="mt-2 text-[11px] text-slate-400">
        {new Date(post.createdAt).toLocaleString(isAr ? 'ar' : 'en')}
        {post.statusChangedBy
          ? ` · ${isAr ? 'الحالة بواسطة' : 'status by'} ${post.statusChangedBy}`
          : ''}
      </p>

      {post.replies.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3">
          {post.replies.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl bg-slate-50 px-3 py-2 text-sm leading-7 text-slate-700"
            >
              <p className="text-[11px] font-semibold text-slate-400">
                {item.authorName}
              </p>
              <p className="whitespace-pre-wrap">{item.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={sendReply} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder={isAr ? 'أضف رداً للنقاش…' : 'Add a discussion reply…'}
        />
        <button
          type="submit"
          disabled={busy || !reply.trim()}
          className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isAr ? 'رد' : 'Reply'}
        </button>
      </form>
    </li>
  );
}
