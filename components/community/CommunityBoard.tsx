'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { COMMUNITY_DISCLAIMER } from '@/lib/communityContent';
import type { CommunityPost } from '@/lib/community/feedStore';

const ERRORS: Record<string, string> = {
  TEXT_REQUIRED: 'اكتب عنواناً ونصاً أوضح.',
  INVALID_LINK: 'الرابط يجب أن يكون Zoom أو YouTube عبر https.',
  FORBIDDEN: 'نشر المحاضرة متاح للمشرف والأخصائي.',
  POST_NOT_FOUND: 'المنشور غير موجود.',
};

export default function CommunityBoard() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [staff, setStaff] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureBody, setLectureBody] = useState('');
  const [lectureLink, setLectureLink] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const response = await fetch('/api/community');
    const data = (await response.json().catch(() => null)) as {
      posts?: CommunityPost[];
      staff?: boolean;
    } | null;
    if (!response.ok) {
      setError('تعذر فتح مجتمع تآلف.');
      return;
    }
    setPosts(data?.posts || []);
    setStaff(Boolean(data?.staff));
    setError('');
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 12000);
    return () => window.clearInterval(timer);
  }, [load]);

  const send = async (payload: Record<string, string>) => {
    const response = await fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setError(ERRORS[data?.error || ''] || 'تعذر النشر.');
      return false;
    }
    setError('');
    await load();
    return true;
  };

  const onDiscuss = async (event: FormEvent) => {
    event.preventDefault();
    const ok = await send({ action: 'discussion', title, body });
    if (ok) {
      setTitle('');
      setBody('');
    }
  };

  const onLecture = async (event: FormEvent) => {
    event.preventDefault();
    const ok = await send({
      action: 'lecture',
      title: lectureTitle,
      body: lectureBody,
      link: lectureLink,
    });
    if (ok) {
      setLectureTitle('');
      setLectureBody('');
      setLectureLink('');
    }
  };

  return (
    <section className="mx-auto max-w-2xl space-y-5 text-right" dir="rtl">
      <header className="rounded-3xl border border-slate-200 bg-white px-6 py-7">
        <p className="text-sm font-semibold text-[#2D8B5A]">مجتمع تآلف</p>
        <h1 className="mt-2 text-2xl font-bold text-[#0b1f14]">ساحة الأمهات</h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          مساحة للمسجّلين: أسئلة ونقاش عام. منشور توعوي مصور أو مرئي يُنشر آلياً
          مرتين كل أسبوع، يومي الأحد والأربعاء. المحادثة الخاصة تبقى داخل غرفة الطفل.
        </p>
        <Link href="/parent/community" className="mt-3 inline-block text-sm font-bold text-[#2E7D8E] underline">
          الأنشطة المنزلية المصورة
        </Link>
      </header>

      <form onSubmit={(event) => void onDiscuss(event)} className="rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-bold text-slate-900">سؤال أو مشاركة</h2>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="عنوان السؤال"
          className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          placeholder="اكتب سؤالك للمجتمع"
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <button type="submit" className="mt-3 rounded-xl bg-[#2E7D8E] px-4 py-2 text-sm font-bold text-white">
          نشر في الساحة
        </button>
      </form>

      {staff ? (
        <form onSubmit={(event) => void onLecture(event)} className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-base font-bold text-slate-900">لوحة المشرف</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            نشر محاضرة، وإضافة رابط Zoom أو YouTube، والتعليق يظهر بشارة المختص.
          </p>
          <input
            value={lectureTitle}
            onChange={(event) => setLectureTitle(event.target.value)}
            placeholder="عنوان المحاضرة"
            className="mt-3 w-full rounded-xl border border-amber-200 px-3 py-2 text-sm"
          />
          <textarea
            value={lectureBody}
            onChange={(event) => setLectureBody(event.target.value)}
            rows={3}
            placeholder="وصف المحاضرة"
            className="mt-2 w-full rounded-xl border border-amber-200 px-3 py-2 text-sm"
          />
          <input
            value={lectureLink}
            onChange={(event) => setLectureLink(event.target.value)}
            placeholder="https://zoom.us/... أو https://youtu.be/..."
            dir="ltr"
            className="mt-2 w-full rounded-xl border border-amber-200 px-3 py-2 text-sm"
          />
          <button type="submit" className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">
            نشر المحاضرة
          </button>
        </form>
      ) : null}

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="space-y-4">
        {posts.map((post) => (
          <article key={post.id} className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-[11px] font-semibold text-[#2E7D8E]">
              {post.kind === 'awareness'
                ? 'منشور توعوي مجدول'
                : post.kind === 'lecture'
                  ? 'محاضرة'
                  : 'نقاش'}
              {' · '}
              {post.authorName}
            </p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">{post.title}</h3>
            {post.mediaKind ? (
              <div
                className={
                  post.mediaKind === 'video'
                    ? 'mt-3 rounded-2xl bg-slate-900 px-4 py-6 text-white'
                    : 'mt-3 rounded-2xl bg-[#FAF7F1] px-4 py-6 text-slate-800'
                }
              >
                <p className="text-xs font-semibold">
                  {post.mediaKind === 'video' ? 'بطاقة مرئية' : 'بطاقة مصورة'}
                </p>
                <p className="mt-1 text-sm">{post.mediaCaption}</p>
              </div>
            ) : null}
            <p className="mt-3 text-sm leading-7 text-slate-700">{post.body}</p>
            {post.link ? (
              <a
                href={post.link.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm font-bold text-[#2E7D8E] underline"
              >
                {post.link.kind === 'zoom' ? 'رابط Zoom' : 'رابط YouTube'}
              </a>
            ) : null}
            <ul className="mt-4 space-y-2">
              {post.comments.map((comment) => (
                <li key={comment.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <p className="text-[11px] font-semibold text-slate-500">
                    {comment.authorName}
                    {comment.staff ? ' · تعليق المختص' : ''}
                  </p>
                  <p className="mt-1 leading-6 text-slate-800">{comment.body}</p>
                </li>
              ))}
            </ul>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const draft = commentDrafts[post.id] || '';
                void send({ action: 'comment', postId: post.id, body: draft }).then((ok) => {
                  if (!ok) return;
                  setCommentDrafts((current) => ({ ...current, [post.id]: '' }));
                });
              }}
            >
              <input
                value={commentDrafts[post.id] || ''}
                onChange={(event) =>
                  setCommentDrafts((current) => ({
                    ...current,
                    [post.id]: event.target.value,
                  }))
                }
                placeholder={staff ? 'تعليق المختص' : 'تعليق'}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">
                تعليق
              </button>
            </form>
          </article>
        ))}
      </div>

      <p className="px-1 text-center text-[11px] leading-6 text-slate-400">
        {COMMUNITY_DISCLAIMER} المنشور المجدول معلومة عامة، وليس تشخيصاً ولا إتقاناً لمعيار.
      </p>
    </section>
  );
}
