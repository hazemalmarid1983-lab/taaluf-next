'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';
import FrictionlessNextAction from '@/components/flow/FrictionlessNextAction';
import { useHubNextAction } from '@/components/flow/useNextBestAction';
import HubMeetingRoom from '@/components/hub/HubMeetingRoom';
import HubRbacPanel from '@/components/hub/HubRbacPanel';
import {
  HUB_MEMBERS,
  HUB_NAME_AR,
  HUB_NAME_EN,
  HUB_ONBOARDING_POST_ID,
  type ClinicalHubSnapshot,
  type HubActor,
  type HubPost,
  type HubPostCategory,
  type HubPostStatus,
} from '@/lib/clinicalHub';
import {
  defaultHubTab,
  hubFocusFromQuery,
} from '@/lib/nextBestActionFlow';

type TabId = 'overview' | 'meeting';

export default function HubWorkspace() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const searchParams = useSearchParams();
  const focusParam = hubFocusFromQuery(searchParams.get('focus'));
  const [tab, setTab] = useState<TabId>('overview');
  const [actor, setActor] = useState<HubActor | null>(null);
  const [snapshot, setSnapshot] = useState<ClinicalHubSnapshot | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const nextAction = useHubNextAction(actor, snapshot);

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/hub');
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'تعذر التحميل');
    }
    setActor(data.actor);
    setSnapshot(data.snapshot);
  }, []);

  useEffect(() => {
    load()
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'تعذر التحميل')
      )
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (focusParam) {
      setTab(focusParam);
      return;
    }
    if (!actor || !snapshot) return;
    setTab(
      defaultHubTab({
        pendingCount: snapshot.posts.filter((p) => p.status === 'pending')
          .length,
        actorRole: actor.role,
        posts: snapshot.posts,
      })
    );
  }, [focusParam, actor, snapshot]);

  const applyPost = (post: HubPost) => {
    setSnapshot((prev) => {
      if (!prev) return prev;
      const exists = prev.posts.some((p) => p.id === post.id);
      return {
        ...prev,
        posts: exists
          ? prev.posts.map((p) => (p.id === post.id ? post : p))
          : [post, ...prev.posts],
      };
    });
  };

  const applyMerhidDirectives = (
    merhidDirectives: ClinicalHubSnapshot['merhidDirectives']
  ) => {
    setSnapshot((prev) => (prev ? { ...prev, merhidDirectives } : prev));
  };

  const saveMerhidDirectives = async (text: string) => {
    const res = await fetch('/api/hub/merhid-directives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'تعذر الحفظ');
    applyMerhidDirectives(data.merhidDirectives);
  };

  const createPost = async (input: {
    category: HubPostCategory;
    title: string;
    body: string;
  }) => {
    const res = await fetch('/api/hub/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'تعذر الإرسال');
    applyPost(data.post);
  };

  const patchPost = async (
    id: string,
    body: { reply?: string; status?: HubPostStatus }
  ) => {
    const res = await fetch(`/api/hub/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'تعذر التحديث');
    applyPost(data.post);
  };

  const pendingCount =
    snapshot?.posts.filter((p) => p.status === 'pending').length ?? 0;
  const onboardingPost = snapshot?.posts.find((p) => p.id === HUB_ONBOARDING_POST_ID);
  const advisorBriefed = onboardingPost?.replies.some(
    (r) => r.authorMemberId === 'samer'
  );

  const tabs: { id: TabId; ar: string; en: string }[] = [
    { id: 'overview', ar: 'لوحة العمل', en: 'Workspace' },
    { id: 'meeting', ar: 'غرفة الاجتماعات', en: 'Meeting room' },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white p-7 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#2E7D8E]">
              {isAr ? 'مساحة خاصة · طرفان فقط' : 'Private workspace · two parties'}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#0b1f14]">
              {isAr ? HUB_NAME_AR : HUB_NAME_EN}
            </h1>
          </div>
          <button
            type="button"
            onClick={() =>
              load().catch((err) =>
                setError(err instanceof Error ? err.message : 'تعذر التحميل')
              )
            }
            className="rounded-xl bg-[#2D8B5A] px-4 py-2 text-sm font-semibold text-white"
          >
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {Object.values(HUB_MEMBERS).map((member) => {
            const active = actor?.memberId === member.id;
            return (
              <span
                key={member.id}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                {isAr ? member.nameAr : member.nameEn}
                <span className="ms-1 font-normal text-slate-500">
                  · {isAr ? member.titleAr : member.titleEn}
                </span>
              </span>
            );
          })}
        </div>

        {error && (
          <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>
        )}
      </div>

      {!loading && nextAction ? (
        <FrictionlessNextAction action={nextAction} isAr={isAr} />
      ) : null}

      <nav className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === item.id
                ? 'bg-[#0b1f14] text-white'
                : 'bg-white text-slate-600 shadow-sm hover:bg-emerald-50'
            }`}
          >
            {isAr ? item.ar : item.en}
            {item.id === 'meeting' && !advisorBriefed && actor?.role === 'scientific_advisor' ? (
              <span className="ms-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">
                {isAr ? 'الاجتماع الأول' : 'First meeting'}
              </span>
            ) : null}
            {item.id === 'meeting' && pendingCount > 0 ? (
              <span className="ms-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">
                {pendingCount}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {loading || !actor || !snapshot ? (
        <div className="rounded-3xl bg-white p-8 text-sm text-slate-500">
          {isAr ? 'جاري فتح المساحة الآمنة…' : 'Opening the secure workspace…'}
        </div>
      ) : tab === 'overview' ? (
        <HubRbacPanel
          actor={actor}
          pendingCount={pendingCount}
          isAr={isAr}
          onOpenMeeting={() => setTab('meeting')}
        />
      ) : tab === 'meeting' ? (
        <HubMeetingRoom
          actor={actor}
          posts={snapshot.posts}
          merhidDirectives={snapshot.merhidDirectives}
          isAr={isAr}
          onCreate={createPost}
          onReply={(id, reply) => patchPost(id, { reply })}
          onToggleStatus={(id, status) => patchPost(id, { status })}
          onSaveDirectives={saveMerhidDirectives}
        />
      ) : null}
    </section>
  );
}
