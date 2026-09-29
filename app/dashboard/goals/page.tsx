'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import GeneralizationProbeDialog from '@/components/goals/GeneralizationProbeDialog';
import GoalSessionDialog from '@/components/goals/GoalSessionDialog';
import MaintenanceProbeDialog from '@/components/goals/MaintenanceProbeDialog';
import FbaPlanDialog from '@/components/goals/FbaPlanDialog';
import IoaDialog from '@/components/goals/IoaDialog';
import IoaReviewPanel from '@/components/goals/IoaReviewPanel';
import { GOAL_PHASE_LABELS_AR } from '@/lib/maintenanceSchedule';
import {
  cacheServerGoal,
  postGoalAction,
  postIoa,
  syncChildClinicalRecord,
  type GoalActionResponse,
} from '@/lib/clinicalRecordClient';
import {
  BEHAVIOR_FUNCTION_LABELS_AR,
  FBA_ANTECEDENT_LABELS_AR,
  FBA_CONSEQUENCE_LABELS_AR,
  buildFbaPlan,
  summarizeFba,
  type FbaPlanError,
  type FbaPlanInput,
} from '@/lib/fba';
import { IOA_METHOD_LABELS_AR, ioaSessionOptions, type IoaInput } from '@/lib/ioa';
import type { GeneralizationProbe } from '@/lib/generalizationIndex';
import {
  loadGeneralizationProbes,
  saveGeneralizationProbe,
  type GeneralizationProbeInput,
} from '@/lib/generalizationProbeStore';
import { goalSessionFormFields, type GoalSessionFormInput } from '@/lib/goalSessionForm';
import type { MaintenanceProbeInput } from '@/lib/maintenanceSchedule';
import {
  createTrackedGoalsFromScores,
  todayPracticeFromGoal,
  type TrackedGoal,
} from '@/lib/goalsEngine';
import { loadGoalsLocal, saveGoalsLocal, upsertGoalLocal } from '@/lib/goalsStore';
import { loadStoredAssessments } from '@/lib/assessmentHelpers';
import { toGoalTrackingItem } from '@/lib/progressTracker';
import {
  SKILL_MASTERY_BLOCKER_LABELS_AR,
  SKILL_TYPE_CONFIGS,
  sessionPromptLabelAr,
} from '@/lib/skillMastery';
import { useLanguage } from '@/components/LanguageProvider';
import SensoryHubRecommendationsCard from '@/components/sensory-hub/SensoryHubRecommendationsCard';

function WeekChart({ values }: { values: number[] }) {
  const w = 280;
  const h = 80;
  const max = Math.max(100, ...values, 1);
  const pts = values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * (w - 16) + 8;
      const y = h - 10 - (v / max) * (h - 20);
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full">
      <polyline
        fill="none"
        stroke="#2D8B5A"
        strokeWidth="3"
        points={pts}
      />
      {values.map((v, i) => {
        const x = (i / Math.max(1, values.length - 1)) * (w - 16) + 8;
        const y = h - 10 - (v / max) * (h - 20);
        return <circle key={i} cx={x} cy={y} r="3.5" fill="#2D8B5A" />;
      })}
    </svg>
  );
}

export default function GoalsPage() {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';
  const [childId, setChildId] = useState('child_local');
  const [goals, setGoals] = useState<TrackedGoal[]>([]);
  const { data: authSession } = useSession();
  const [noteGoalId, setNoteGoalId] = useState<string | null>(null);
  const [probeGoalId, setProbeGoalId] = useState<string | null>(null);
  const [maintenanceGoalId, setMaintenanceGoalId] = useState<string | null>(null);
  const [fbaGoalId, setFbaGoalId] = useState<string | null>(null);
  const [ioaGoalId, setIoaGoalId] = useState<string | null>(null);
  const [ioaRefresh, setIoaRefresh] = useState(0);
  const [probes, setProbes] = useState<GeneralizationProbe[]>([]);
  const [serverBacked, setServerBacked] = useState(false);
  const [msg, setMsg] = useState('');
  const isParent = authSession?.user?.role === 'parent';
  const reportedBy: GeneralizationProbe['reported_by'] = isParent ? 'parent_report' : 'professional';

  useEffect(() => {
    setProbes(loadGeneralizationProbes());
  }, []);

  useEffect(() => {
    let cancelled = false;
    let id = 'child_local';
    let childName: string | undefined;
    try {
      const active = JSON.parse(
        localStorage.getItem('taaluf.activeStudent') || 'null'
      );
      id = active?.id || 'child_local';
      childName = active?.name;
      setChildId(id);
      let list = loadGoalsLocal(id);
      if (!list.length) {
        const assessments = loadStoredAssessments().filter(
          (a) => a.studentId === id
        );
        const latest = assessments[0];
        if (latest?.scores?.length) {
          list = createTrackedGoalsFromScores(id, latest.scores);
          const all = [...list, ...loadGoalsLocal()];
          saveGoalsLocal(all);
        }
      }
      setGoals(list);
    } catch {
      /* ignore */
    }
    void syncChildClinicalRecord(id, { childName }).then((result) => {
      if (cancelled || result.source !== 'server') return;
      setServerBacked(true);
      setGoals(result.goals);
      setProbes(loadGeneralizationProbes());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const applyServerGoal = (goal: TrackedGoal, serverProbes?: GeneralizationProbe[]) => {
    cacheServerGoal(goal, serverProbes);
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)));
    if (serverProbes) setProbes(loadGeneralizationProbes());
  };

  const serverError = (res: Extract<GoalActionResponse, { ok: false }>) =>
    res.status === 403
      ? 'لا تملك صلاحية هذا الإجراء على ملف الطفل'
      : `تعذّر الحفظ على الخادم (${res.error})`;

  const practice = useMemo(
    () => todayPracticeFromGoal(goals[0] || null),
    [goals]
  );

  const weekValues = useMemo(() => {
    const key = `taaluf.goals.week.${childId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as number[];
    } catch {
      /* ignore */
    }
    const mock = [20, 28, 35, 40, 48, 55, goals[0]?.current ?? 60];
    localStorage.setItem(key, JSON.stringify(mock));
    return mock;
  }, [childId, goals]);

  const statusColor = (g: TrackedGoal) => {
    const pct =
      g.target === g.baseline
        ? 0
        : ((g.current - g.baseline) / (g.target - g.baseline)) * 100;
    if (pct >= 70) return 'bg-emerald-500';
    if (pct >= 35) return 'bg-amber-400';
    return 'bg-rose-500';
  };

  const saveLocalGoal = (updated: TrackedGoal) => {
    upsertGoalLocal(updated);
    setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
  };

  const saveSession = async (updated: TrackedGoal, input: GoalSessionFormInput) => {
    setNoteGoalId(null);
    if (!serverBacked) {
      saveLocalGoal(updated);
      setMsg('تم حفظ الجلسة على هذا الجهاز');
      return;
    }
    const res = await postGoalAction(childId, updated.id, {
      action: 'session',
      input: input as Record<string, unknown>,
    });
    if (res.ok) {
      applyServerGoal(res.goal);
      setMsg('تم حفظ الجلسة في السجل التربوي');
    } else if (res.status === 0) {
      // تُرفع الجلسة في المزامنة التالية (session_entry)
      saveLocalGoal(updated);
      setMsg('لا اتصال — حُفظت الجلسة على الجهاز وستُرفع عند المزامنة');
    } else {
      setMsg(serverError(res));
    }
  };

  const saveMaintenance = async (
    updated: TrackedGoal,
    input: MaintenanceProbeInput,
    messageFor: (withdrawn: boolean, passed: boolean) => string,
    local: { withdrawn: boolean; passed: boolean }
  ) => {
    setMaintenanceGoalId(null);
    if (!serverBacked) {
      saveLocalGoal(updated);
      setMsg(messageFor(local.withdrawn, local.passed));
      return;
    }
    const res = await postGoalAction(childId, updated.id, {
      action: 'maintenance_probe',
      input: input as Record<string, unknown>,
    });
    if (res.ok) {
      applyServerGoal(res.goal);
      setMsg(messageFor(res.withdrawn, res.passed ?? false));
    } else {
      setMsg(serverError(res));
    }
  };

  const saveGeneralization = async (
    probe: GeneralizationProbe,
    countsLocal: boolean,
    input: GeneralizationProbeInput
  ) => {
    setProbeGoalId(null);
    const message = (counts: boolean) =>
      counts
        ? 'تم حفظ قياس التعميم'
        : 'تم الحفظ — لا يُحتسب في مؤشر التعميم لأنه لم يختبر ظرفاً جديداً';
    if (!serverBacked) {
      setProbes(saveGeneralizationProbe(probe));
      setMsg(message(countsLocal));
      return;
    }
    const res = await postGoalAction(childId, probe.goal_id, {
      action: 'generalization_probe',
      input: input as Record<string, unknown>,
    });
    if (res.ok) {
      applyServerGoal(res.goal, res.generalizationProbes);
      setMsg(message(res.countsTowardIndex ?? false));
    } else {
      setMsg(serverError(res));
    }
  };

  const saveFbaPlan = async (goal: TrackedGoal, input: FbaPlanInput): Promise<FbaPlanError[] | null> => {
    if (!serverBacked) {
      const built = buildFbaPlan(input, authSession?.user?.name ?? undefined);
      if (!built.ok) return built.errors;
      saveLocalGoal({ ...goal, fbaPlan: built.plan, lastUpdate: built.plan.updated_at });
      setFbaGoalId(null);
      setMsg('تم حفظ خطة التقييم الوظيفي على هذا الجهاز');
      return null;
    }
    const res = await postGoalAction(childId, goal.id, { action: 'fba_plan', input: input as Record<string, unknown> });
    if (res.ok) {
      applyServerGoal(res.goal);
      setFbaGoalId(null);
      setMsg('تم حفظ خطة التقييم الوظيفي في السجل التربوي');
      return null;
    }
    if (res.errors?.length) return res.errors as FbaPlanError[];
    setFbaGoalId(null);
    setMsg(serverError(res));
    return null;
  };

  const submitIoa = async (input: IoaInput): Promise<string[] | null> => {
    const res = await postIoa(childId, input);
    if (!res.ok) {
      if (res.status === 403) return ['لا تملك صلاحية تسجيل اتفاق الملاحظين'];
      return res.errors?.length ? res.errors : [`تعذّر الحفظ (${res.error})`];
    }
    setIoaGoalId(null);
    setIoaRefresh((n) => n + 1);
    const r = res.record;
    setMsg(
      `اتفاق الملاحظين (${IOA_METHOD_LABELS_AR[r.method]}): ${r.agreement_pct}%` +
        (r.meets_standard ? ' — ضمن الحد المقبول' : ' — دون الحد المقبول، راجع التعريف الإجرائي أو أعد التدريب')
    );
    return null;
  };

  const noteGoal = goals.find((g) => g.id === noteGoalId) || null;
  const fbaGoal = goals.find((g) => g.id === fbaGoalId) || null;
  const ioaGoal = goals.find((g) => g.id === ioaGoalId) || null;
  const maintenanceGoal = goals.find((g) => g.id === maintenanceGoalId) || null;
  const probeGoal = goals.find((g) => g.id === probeGoalId) || null;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0b1f14]">{t('educationalGoals')}</h1>
        <p className="mt-2 text-sm text-slate-600">
          أهداف SMART من المعايير ذات الدرجة ≥ 2 مع تتبّع أسبوعي.
        </p>
      </div>

      <div className="rounded-3xl border-2 border-[#2D8B5A] bg-emerald-50/60 p-6">
        <p className="text-xs font-semibold text-[#2D8B5A]">تمرين اليوم</p>
        <h2 className="mt-1 text-xl font-bold text-[#0b1f14]">{practice.title}</h2>
        <ol className="mt-3 list-decimal space-y-1 pr-5 text-sm leading-7 text-slate-700">
          {practice.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>

      <div className="rounded-3xl border border-emerald-100 bg-white p-6">
        <h2 className="text-lg font-bold text-[#0b1f14]">التقدّم الأسبوعي</h2>
        <WeekChart values={weekValues} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
      {goals.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-emerald-200 bg-white p-8 text-center text-sm text-slate-500">
          لا أهداف بعد — أكمل تقييماً للطفل لتوليد أهداف تلقائياً.
        </p>
      ) : (
        <div className="grid gap-4">
          {goals.map((g) => {
            const range = Math.max(1, g.target - g.baseline);
            const fill = Math.min(
              100,
              Math.max(0, ((g.current - g.baseline) / range) * 100)
            );
            const tracking = toGoalTrackingItem(g, probes);
            const lastSession = g.sessions[g.sessions.length - 1];
            const lastPromptLabel = lastSession ? sessionPromptLabelAr(lastSession) : undefined;
            const behaviorGoal = goalSessionFormFields(g).frequencyMode;
            const fba = behaviorGoal ? summarizeFba(g) : null;
            const canIoa = serverBacked && !isParent && ioaSessionOptions(g).length > 0;
            return (
              <article
                key={g.id}
                className="rounded-3xl border border-emerald-100 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${statusColor(g)}`}
                      />
                      <h3 className="text-lg font-bold text-[#0b1f14]">
                        {g.title}
                      </h3>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-[#2D8B5A]">
                      {g.domain}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNoteGoalId(g.id)}
                    >
                      سجّل جلسة
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProbeGoalId(g.id)}
                    >
                      قياس تعميم
                    </Button>
                    {!isParent &&
                    (tracking.phase === 'maintenance' || tracking.phase === 'maintained') ? (
                      <Button
                        variant={tracking.maintenanceDueNow ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setMaintenanceGoalId(g.id)}
                      >
                        مجس صيانة
                      </Button>
                    ) : null}
                    {!isParent && behaviorGoal ? (
                      <Button variant="ghost" size="sm" onClick={() => setFbaGoalId(g.id)}>
                        خطة FBA
                      </Button>
                    ) : null}
                    {canIoa ? (
                      <Button variant="ghost" size="sm" onClick={() => setIoaGoalId(g.id)}>
                        اتفاق ملاحظين
                      </Button>
                    ) : null}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {g.smartText}
                </p>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>
                      {g.baseline} → {g.target}
                    </span>
                    <span>الحالي {g.current}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-emerald-50">
                    <div
                      className="h-full rounded-full bg-[#2D8B5A]"
                      style={{ width: `${fill}%` }}
                    />
                  </div>
                </div>
                <div className="mt-3 space-y-1 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                  <p>
                    <span className="font-semibold">
                      {SKILL_TYPE_CONFIGS[tracking.skillType].label_ar}:
                    </span>{' '}
                    {tracking.status === 'mastered'
                      ? 'متقن ✓'
                      : tracking.masteryBlockers
                          .map((b) => SKILL_MASTERY_BLOCKER_LABELS_AR[b])
                          .join(' · ') || 'قيد التدريب'}
                  </p>
                  <p>
                    <span className="font-semibold">المرحلة:</span>{' '}
                    {GOAL_PHASE_LABELS_AR[tracking.phase]}
                    {tracking.nextMaintenanceDueAt
                      ? ` · ${tracking.nextMaintenanceKind === 'confirmation' ? 'مجس تأكيدي' : 'المجس التالي'} ${new Date(tracking.nextMaintenanceDueAt).toLocaleDateString('ar-EG')}${tracking.maintenanceDueNow ? ' (مستحق الآن)' : ''}`
                      : ''}
                  </p>
                  {lastPromptLabel ? (
                    <p>
                      <span className="font-semibold">مساعدة آخر جلسة:</span> {lastPromptLabel}
                    </p>
                  ) : null}
                  {tracking.generalization ? (
                    <p>
                      <span className="font-semibold">مؤشر التعميم:</span>{' '}
                      {tracking.generalization.generalization_index}% ·{' '}
                      {tracking.generalization.gen_status}
                    </p>
                  ) : null}
                  {fba ? (
                    <div className="space-y-0.5 border-t border-slate-200 pt-1">
                      {g.fbaPlan ? (
                        <p>
                          <span className="font-semibold">السلوك البديل:</span> {g.fbaPlan.replacement_behavior}
                          {g.fbaPlan.hypothesized_function
                            ? ` · الوظيفة: ${BEHAVIOR_FUNCTION_LABELS_AR[g.fbaPlan.hypothesized_function]}`
                            : ''}
                        </p>
                      ) : (
                        <p className="text-amber-800">لا توجد خطة تقييم وظيفي (FBA) — حدّد السلوك البديل قبل التدخل.</p>
                      )}
                      {fba.incidents > 0 ? (
                        <p>
                          <span className="font-semibold">ABC:</span> {fba.incidents} حادثة
                          {fba.antecedents[0] ? ` · قبلي: ${FBA_ANTECEDENT_LABELS_AR[fba.antecedents[0].key]}` : ''}
                          {fba.consequences[0] ? ` · بعدي: ${FBA_CONSEQUENCE_LABELS_AR[fba.consequences[0].key]}` : ''}
                          {fba.replacementUsePct !== null ? ` · البديل ${fba.replacementUsePct}%` : ''}
                        </p>
                      ) : null}
                      {fba.suggestedFunction && fba.suggestedFunction !== g.fbaPlan?.hypothesized_function ? (
                        <p className="text-blue-800">
                          بيانات ABC ترجّح وظيفة «{BEHAVIOR_FUNCTION_LABELS_AR[fba.suggestedFunction]}» (ترجيح وصفي)
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  جلسات: {g.sessions.length}
                  {g.lastUpdate
                    ? ` · آخر تحديث ${new Date(g.lastUpdate).toLocaleDateString('ar-EG')}`
                    : ''}
                </p>
              </article>
            );
          })}
        </div>
      )}

      {serverBacked && !isParent ? (
        <IoaReviewPanel childId={childId} goals={goals} refreshKey={ioaRefresh} />
      ) : null}
        </div>

        <SensoryHubRecommendationsCard goals={goals} isAr={isAr} />
      </div>

      {noteGoal && (
        <GoalSessionDialog
          goal={noteGoal}
          defaultTrainerName={authSession?.user?.name ?? undefined}
          onSaved={(updated, input) => void saveSession(updated, input)}
          onCancel={() => setNoteGoalId(null)}
        />
      )}

      {probeGoal && (
        <GeneralizationProbeDialog
          goalId={probeGoal.id}
          goalTitle={probeGoal.title}
          reportedBy={reportedBy}
          onSaved={(probe, counts, input) => void saveGeneralization(probe, counts, input)}
          onCancel={() => setProbeGoalId(null)}
        />
      )}

      {maintenanceGoal && (
        <MaintenanceProbeDialog
          goal={maintenanceGoal}
          defaultTrainerName={authSession?.user?.name ?? undefined}
          onSaved={(result, input) =>
            void saveMaintenance(
              result.goal,
              input,
              (withdrawn, passed) =>
                withdrawn
                  ? 'سُحب الإتقان: مجسّا صيانة متتاليان دون 80% — عاد الهدف إلى إعادة الاكتساب'
                  : passed
                    ? 'تم حفظ مجس الصيانة — ناجح'
                    : 'مجس دون 80% — أجرِ مجساً تأكيدياً خلال 48 ساعة',
              { withdrawn: result.withdrawn, passed: result.passed }
            )
          }
          onCancel={() => setMaintenanceGoalId(null)}
        />
      )}

      {fbaGoal && (
        <FbaPlanDialog
          goal={fbaGoal}
          onSave={(input) => saveFbaPlan(fbaGoal, input)}
          onCancel={() => setFbaGoalId(null)}
        />
      )}

      {ioaGoal && (
        <IoaDialog
          goal={ioaGoal}
          defaultObserverName={authSession?.user?.name ?? undefined}
          onSubmit={submitIoa}
          onCancel={() => setIoaGoalId(null)}
        />
      )}

      {msg && <p className="text-sm text-[#2D8B5A]">{msg}</p>}
    </section>
  );
}
