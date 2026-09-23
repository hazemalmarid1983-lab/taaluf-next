'use client';

import { useLanguage } from '@/components/LanguageProvider';
import { updateGoalProgress, iepCompletionRate } from '@/lib/ldIep/engine';
import { saveLdIep } from '@/lib/ldIep/store';
import type { LdIndividualEducationPlan } from '@/lib/ldIep/types';

export default function LdIepGoalTracker({
  plan,
  onUpdate,
}: {
  plan: LdIndividualEducationPlan;
  onUpdate: (plan: LdIndividualEducationPlan) => void;
}) {
  const { lang, dir, t } = useLanguage();
  const completion = iepCompletionRate(plan);

  const recordProgress = (goalId: string, score: number) => {
    const updatedGoals = plan.goals.map((g) =>
      g.id === goalId
        ? updateGoalProgress(g, score, t('ldProgressRecorded'))
        : g
    );
    const updated = saveLdIep({ ...plan, goals: updatedGoals });
    onUpdate(updated);
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
        <p className="text-xs font-bold text-amber-800">{t('ldIepProgress')}</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-amber-100">
            <div
              className="h-full rounded-full bg-amber-600 transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
          <span className="text-sm font-bold text-amber-900">{completion}%</span>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {plan.schoolYear} · {plan.term} · {t('ldReviewDate')}: {plan.reviewDate}
        </p>
      </div>

      {plan.goals.map((goal) => {
        const range = goal.target - goal.baseline;
        const pct =
          range > 0
            ? Math.round(((goal.current - goal.baseline) / range) * 100)
            : 0;
        return (
          <div
            key={goal.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {lang === 'en' ? goal.titleEn : goal.titleAr}
                </p>
                <p className="mt-1 text-xs leading-6 text-slate-600">
                  {lang === 'en' ? goal.smartTextEn : goal.smartTextAr}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  goal.status === 'achieved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {goal.status}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span>
                {goal.baseline}% → {goal.current}% → {goal.target}%
              </span>
              <span className="font-bold text-amber-700">{pct}%</span>
            </div>

            {goal.interventions.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  {t('ldInterventions')}
                </p>
                <ul className="mt-1 space-y-1">
                  {goal.interventions.map((i) => (
                    <li key={i.id} className="text-xs text-slate-600">
                      {lang === 'en' ? i.nameEn : i.nameAr} · {i.frequency}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {goal.status === 'active' && (
              <div className="mt-4 flex flex-wrap gap-2">
                {[50, 65, 80, 90].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => recordProgress(goal.id, score)}
                    className="rounded-lg border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-50"
                  >
                    {score}%
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {plan.accommodations.filter((a) => a.approved).length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold text-slate-900">
            {t('examAccommodations')}
          </h3>
          <ul className="space-y-1">
            {plan.accommodations
              .filter((a) => a.approved)
              .map((a) => (
                <li
                  key={a.id}
                  className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700"
                >
                  {lang === 'en' ? a.descriptionEn : a.descriptionAr}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
