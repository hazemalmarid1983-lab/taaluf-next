'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/components/LanguageProvider';
import FrictionlessNextAction from '@/components/flow/FrictionlessNextAction';
import { useParentNextAction } from '@/components/flow/useNextBestAction';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  PARENT_PATH_STEPS,
  PARENT_ROUTES,
  clearActiveChildSession,
  parentScreeningEntryHref,
  readParentJourneyState,
  type ParentJourneyState,
} from '@/lib/parentJourney';

export default function ParentHomeDashboard({
  unlocked,
  studentNameFromEntitlements,
}: {
  unlocked: boolean;
  studentNameFromEntitlements?: string;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const { t, dir } = useLanguage();
  const [journey, setJourney] = useState<ParentJourneyState | null>(null);
  const nextAction = useParentNextAction(studentNameFromEntitlements);

  useEffect(() => {
    setJourney(readParentJourneyState(studentNameFromEntitlements));
  }, [studentNameFromEntitlements, unlocked]);

  const handleStartNewChild = () => {
    clearActiveChildSession();
    router.push(PARENT_ROUTES.register);
  };

  if (!journey) {
    return (
      <p className="py-16 text-center text-sm text-slate-500">{t('loading')}</p>
    );
  }

  if (!journey.hasChild) {
    return (
      <div
        className="mx-auto my-8 max-w-xl rounded-3xl border border-white/90 bg-white/80 p-8 text-center shadow-xl backdrop-blur-2xl"
        dir={dir}
      >
        <h1 className="mb-3 text-2xl font-bold text-[#1F2A37]">
          {t('welcomeParentsTitle')}
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-gray-500">
          {t('welcomeParentsBody')}
        </p>
        <div className="space-y-3">
          <Link
            href={PARENT_ROUTES.register}
            className="block w-full rounded-xl bg-[#2E7D8E] py-3.5 font-bold text-white shadow transition hover:bg-[#256675]"
          >
            {t('registerNewChild')}
          </Link>
          <Link
            href="/login?portal=parent"
            className="block w-full rounded-xl border border-[#2E7D8E]/30 bg-[#FAF7F1] py-3 font-bold text-[#2E7D8E] transition hover:bg-gray-50"
          >
            {t('loginExisting')}
          </Link>
        </div>
      </div>
    );
  }

  const parentName = session?.user?.name || t('guardianFallback');
  const childName = journey.child?.name || t('yourChild');
  const { doneMap, progressPct, adaptiveSteps, selectedMode } = journey;
  const complete = journey.next.kind === 'done';
  const pathNote =
    selectedMode === 'independent_parent'
      ? t('pathIndependent')
      : selectedMode === 'specialist_guided'
        ? t('pathSpecialist')
        : t('pathDefault');

  return (
    <section className="mx-auto max-w-xl space-y-5" dir={dir}>
      <div className="mb-1 flex flex-col items-center justify-between gap-4 rounded-3xl border border-white/90 bg-white/80 p-6 shadow-xl backdrop-blur-2xl sm:flex-row">
        <div>
          <span className="rounded-full border border-[#2E7D8E]/20 bg-[#FAF7F1] px-3 py-1 text-xs font-bold text-[#2E7D8E]">
            {t('activeFile')}
          </span>
          <h2 className="mt-2 text-xl font-bold text-[#1F2A37]">
            {t('childLabel', { name: childName })}
          </h2>
          <p className="mt-1 text-xs text-gray-500">{t('followOrRegister')}</p>
        </div>
        <button
          type="button"
          onClick={handleStartNewChild}
          className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-200"
        >
          {t('registerAnotherChild')}
        </button>
      </div>

      <header className="rounded-3xl border border-white/90 bg-white/80 px-6 py-7 shadow-xl backdrop-blur-2xl">
        <p className="text-sm font-semibold text-[#2D8B5A]">
          {t('parentDashboard')}
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight text-[#0b1f14]">
          {t('welcomeParent', { name: parentName })}
        </h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          {t('assessmentPath')}{' '}
          <span className="font-semibold text-[#0b1f14]">{childName}</span>
          {pathNote}
        </p>
        {selectedMode ? (
          <p className="mt-3 inline-block rounded-full border border-[#2E7D8E]/20 bg-[#2E7D8E]/10 px-3 py-1 text-xs font-semibold text-[#2E7D8E]">
            {selectedMode === 'independent_parent'
              ? t('badgeFamily')
              : t('badgeSpecialist')}
          </p>
        ) : null}
      </header>

      <FrictionlessNextAction action={nextAction} isAr={dir === 'rtl'} />

      <details className="rounded-3xl border border-white/90 bg-white/80 px-5 py-4 shadow-xl backdrop-blur-2xl">
        <summary className="cursor-pointer text-sm font-bold text-[#0b1f14]">
          {t('assessmentPath')} · {t('percentDone', { n: progressPct })}
        </summary>
        <div className="mt-4">
          <ol className="grid grid-cols-4 gap-1">
          {PARENT_PATH_STEPS.map((step, idx) => {
            const done = doneMap[step.id];
            const current =
              !done &&
              PARENT_PATH_STEPS.slice(0, idx).every((s) => doneMap[s.id]);
            const href =
              step.id === 'child' && (done || current)
                ? PARENT_ROUTES.register
                : (step.id === 'screening' || step.id === 'results') &&
                    (done || current)
                  ? parentScreeningEntryHref()
                  : step.id === 'choose' && (done || current)
                    ? journey.next.href
                    : current
                      ? journey.next.href
                      : null;
            return (
              <li key={step.id} className="text-center">
                {href ? (
                  <Link href={href} className="block">
                    <div
                      className={cn(
                        'mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                        done && 'bg-[#2D8B5A] text-white',
                        current &&
                          'bg-[#2D8B5A]/15 text-[#2D8B5A] ring-2 ring-[#2D8B5A]/30',
                        !done && !current && 'bg-slate-100 text-slate-400'
                      )}
                    >
                      {done ? '✓' : idx + 1}
                    </div>
                    <p
                      className={cn(
                        'mt-2 text-[10px] font-semibold leading-4 sm:text-[11px]',
                        done || current ? 'text-[#0b1f14]' : 'text-slate-400'
                      )}
                    >
                      {t(step.labelKey)}
                    </p>
                  </Link>
                ) : (
                  <>
                    <div
                      className={cn(
                        'mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                        done && 'bg-[#2D8B5A] text-white',
                        current &&
                          'bg-[#2D8B5A]/15 text-[#2D8B5A] ring-2 ring-[#2D8B5A]/30',
                        !done && !current && 'bg-slate-100 text-slate-400'
                      )}
                    >
                      {done ? '✓' : idx + 1}
                    </div>
                    <p
                      className={cn(
                        'mt-2 text-[10px] font-semibold leading-4 sm:text-[11px]',
                        done || current ? 'text-[#0b1f14]' : 'text-slate-400'
                      )}
                    >
                      {t(step.labelKey)}
                    </p>
                  </>
                )}
              </li>
            );
          })}
        </ol>
        </div>
      </details>

      {adaptiveSteps.length > 0 ? (
        <div className="rounded-3xl border border-white/90 bg-white/80 px-5 py-6 shadow-xl backdrop-blur-2xl">
          <h2 className="text-base font-bold text-[#0b1f14]">
            {t('chosenPathSteps')}
          </h2>
          <ol className="mt-4 space-y-3">
            {adaptiveSteps.map((step) => (
              <li key={step.id}>
                <Link href={step.path} className="block">
                  <p className="text-sm font-semibold text-[#0b1f14]">
                    {step.isCompleted ? t('donePrefix') : ''}
                    {step.title}
                    {!step.isRequired ? (
                      <span className="ms-2 text-xs font-normal text-slate-400">
                        {t('optional')}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs leading-6 text-slate-500">
                    {step.description}
                  </p>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {complete && (
        <div className="flex flex-col gap-2">
          <Link href={PARENT_ROUTES.community}>
            <Button variant="secondary" className="h-11 w-full">
              {t('communitySupport')}
            </Button>
          </Link>
          <Link href={PARENT_ROUTES.goals}>
            <Button variant="outline" className="h-11 w-full">
              {t('viewGoals')}
            </Button>
          </Link>
        </div>
      )}

      {journey.hasScreening && (
        <Link
          href={PARENT_ROUTES.booking}
          className="block rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 py-5 backdrop-blur-xl"
        >
          <h2 className="text-base font-bold text-[#0b1f14]">
            {t('bookSpecialist')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t('bookSpecialistHint')}
          </p>
        </Link>
      )}
    </section>
  );
}
