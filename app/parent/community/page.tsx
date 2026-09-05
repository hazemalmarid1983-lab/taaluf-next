'use client';

import { useMemo, useState } from 'react';
import { DISCLAIMER_AR } from '@/lib/content';
import {
  COMMUNITY_DISCLAIMER,
  HOME_STRATEGIES,
  SUPPORT_CIRCLES,
  communityDomains,
  getCircleWithChallenge,
  getCommunityByDomain,
  type HomeStrategy,
  type WeeklyChallenge,
} from '@/lib/communityContent';
import { useLanguage } from '@/components/LanguageProvider';
import { localizeLabel } from '@/lib/i18n/pathwayLabels';

function ChallengeCard({ challenge }: { challenge: WeeklyChallenge }) {
  const { t } = useLanguage();
  return (
    <article className="rounded-2xl border border-[#2E7D8E]/20 bg-[#FAF7F1] p-4">
      <p className="text-[11px] font-semibold text-[#2E7D8E]">
        {t('weeklyChallenge', { duration: challenge.videoDuration })}
      </p>
      <h3 className="mt-1 text-base font-bold text-[#1F2A37]">
        {challenge.title}
      </h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{challenge.goal}</p>
      <ol className="mt-3 list-inside list-decimal space-y-1 text-sm leading-7 text-slate-700">
        {challenge.actionSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </article>
  );
}

function StrategyCard({ strategy }: { strategy: HomeStrategy }) {
  const { t } = useLanguage();
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold text-[#2D8B5A]">
        {t('picturedStrategy', { minutes: strategy.durationMinutes })}
      </p>
      <h3 className="mt-1 text-base font-bold text-[#1F2A37]">
        {strategy.title}
      </h3>
      <p className="mt-1 text-xs leading-6 text-slate-500">
        {t('sceneLabel', { cue: strategy.visualCue })}
      </p>
      <ol className="mt-3 grid gap-2 sm:grid-cols-3">
        {strategy.panels.map((panel) => (
          <li
            key={panel.order}
            className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2E7D8E] text-xs font-bold text-white">
              {panel.order}
            </span>
            <p className="mt-2 text-xs leading-6 text-slate-700">
              {panel.caption}
            </p>
          </li>
        ))}
      </ol>
      {strategy.materials.length > 0 && (
        <p className="mt-3 text-[11px] text-slate-400">
          {t('materialsLabel', { items: strategy.materials.join(' · ') })}
        </p>
      )}
    </article>
  );
}

export default function ParentCommunityPage() {
  const { lang, t, dir } = useLanguage();
  const domains = communityDomains();
  const [domain, setDomain] = useState<string>(domains[0] || '');
  const pack = useMemo(() => getCommunityByDomain(domain), [domain]);
  const circle = pack.circle
    ? getCircleWithChallenge(pack.circle)
    : null;
  const featured = pack.challenges.find((c) => c.featured) || pack.challenges[0];

  return (
    <section className="mx-auto max-w-2xl space-y-5" dir={dir}>
      <header className="rounded-3xl border border-slate-200 bg-white px-6 py-7">
        <p className="text-sm font-semibold text-[#2D8B5A]">{t('communityBrand')}</p>
        <h1 className="mt-2 text-2xl font-bold text-[#0b1f14]">{t('communityTitle')}</h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">{t('communityLead')}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {domains.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDomain(d)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              domain === d
                ? 'bg-[#2E7D8E] text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {localizeLabel(d, lang)}
          </button>
        ))}
      </div>

      {circle && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#0b1f14]">{circle.title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {circle.description}
              </p>
            </div>
            <p className="text-[11px] text-slate-400">
              {t('parentsCount', { n: circle.activeParents })} ·{' '}
              {t('discussionsCount', { n: circle.discussionsCount })}
            </p>
          </div>
          {featured ? (
            <div className="mt-4">
              <ChallengeCard challenge={featured} />
            </div>
          ) : null}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-base font-bold text-[#0b1f14]">
          {t('homeStrategiesTitle')}
        </h2>
        {(pack.strategies.length ? pack.strategies : HOME_STRATEGIES).map(
          (strategy) => (
            <StrategyCard key={strategy.id} strategy={strategy} />
          )
        )}
      </div>

      {SUPPORT_CIRCLES.length > 1 && pack.challenges.length > 1 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-bold text-[#0b1f14]">
            {t('extraChallenges')}
          </h2>
          <div className="mt-3 space-y-3">
            {pack.challenges
              .filter((c) => c.id !== featured?.id)
              .map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
          </div>
        </div>
      )}

      <p className="px-1 text-center text-[11px] leading-6 text-slate-400">
        {COMMUNITY_DISCLAIMER} {DISCLAIMER_AR}
      </p>
    </section>
  );
}
