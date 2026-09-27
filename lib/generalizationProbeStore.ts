/**
 * قياسات التعميم (Generalization probes): إدخال وتحقق وحفظ محلي.
 */

import {
  probeTestsNovelCondition,
  type GeneralizationDimension,
  type GeneralizationProbe,
} from '@/lib/generalizationIndex';

export const GENERALIZATION_PROBES_STORAGE_KEY = 'taaluf.generalizationProbes.v1';

type PersonType = NonNullable<GeneralizationProbe['details']['person_type']>;
type ProbeSetting = NonNullable<GeneralizationProbe['details']['setting']>;

export const PROBE_DIMENSION_LABELS_AR: Record<GeneralizationDimension, string> = {
  person: 'شخص جديد',
  place: 'مكان جديد',
  material_stimulus: 'مادة / مثير جديد',
};

export const PROBE_PERSON_LABELS_AR: Record<PersonType, string> = {
  primary_specialist: 'الأخصائي الأساسي',
  secondary_specialist: 'أخصائي آخر',
  parent: 'ولي الأمر',
  teacher: 'المعلم',
  peer: 'طفل / قرين',
};

export const PROBE_PROMPT_LABELS_AR: Record<GeneralizationProbe['prompt_level'], string> = {
  Independent: 'مستقل',
  Verbal: 'تلقين لفظي',
  Gestural: 'تلقين بالإشارة',
  'Partial Physical': 'مساعدة جسدية جزئية',
  'Full Physical': 'مساعدة جسدية كاملة',
};

export type GeneralizationProbeInput = {
  dimension?: GeneralizationDimension | '';
  personType?: PersonType | '';
  personName?: string;
  setting?: ProbeSetting | '';
  materialUsed?: string;
  isNovelMaterial?: boolean;
  independencePct?: number | string;
  promptLevel?: GeneralizationProbe['prompt_level'] | '';
  isFirstTrialColdProbe?: boolean;
  moodState?: string;
  notes?: string;
};

export type GeneralizationProbeError =
  | 'DIMENSION_REQUIRED'
  | 'PERSON_REQUIRED'
  | 'SETTING_REQUIRED'
  | 'MATERIAL_REQUIRED'
  | 'INDEPENDENCE_REQUIRED'
  | 'PROMPT_REQUIRED';

export const GENERALIZATION_PROBE_ERRORS_AR: Record<GeneralizationProbeError, string> = {
  DIMENSION_REQUIRED: 'اختر بُعد التعميم',
  PERSON_REQUIRED: 'اختر من نفّذ القياس',
  SETTING_REQUIRED: 'اختر مكان القياس',
  MATERIAL_REQUIRED: 'اكتب المادة أو المثير المستخدم',
  INDEPENDENCE_REQUIRED: 'أدخل نسبة الاستقلالية بين 0 و100',
  PROMPT_REQUIRED: 'اختر مستوى المساعدة',
};

export type GeneralizationProbeBuildResult =
  | { ok: true; probe: GeneralizationProbe; countsTowardIndex: boolean }
  | { ok: false; errors: GeneralizationProbeError[] };

export function buildGeneralizationProbe(
  input: GeneralizationProbeInput,
  context: {
    goalId: string;
    reportedBy: GeneralizationProbe['reported_by'];
    now?: Date;
    probeId?: string;
  }
): GeneralizationProbeBuildResult {
  const errors: GeneralizationProbeError[] = [];
  const dimension = input.dimension || undefined;
  if (!dimension) errors.push('DIMENSION_REQUIRED');
  if (dimension === 'person' && !input.personType) errors.push('PERSON_REQUIRED');
  if (dimension === 'place' && !input.setting) errors.push('SETTING_REQUIRED');
  if (dimension === 'material_stimulus' && !input.materialUsed?.trim()) {
    errors.push('MATERIAL_REQUIRED');
  }
  const pctRaw = input.independencePct;
  const pct = pctRaw === '' || pctRaw === undefined ? NaN : Number(pctRaw);
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) errors.push('INDEPENDENCE_REQUIRED');
  if (!input.promptLevel) errors.push('PROMPT_REQUIRED');
  if (errors.length) return { ok: false, errors };

  const now = context.now ?? new Date();
  const probe: GeneralizationProbe = {
    probe_id: context.probeId ?? `probe_${now.getTime().toString(36)}`,
    goal_id: context.goalId,
    date: now.toISOString(),
    dimension: dimension!,
    details: {
      person_type: input.personType || undefined,
      person_id: input.personName?.trim() || undefined,
      setting: input.setting || undefined,
      material_used: input.materialUsed?.trim() || undefined,
      is_novel_material: dimension === 'material_stimulus' ? input.isNovelMaterial === true : undefined,
    },
    independence_pct: Math.round(pct),
    prompt_level: input.promptLevel as GeneralizationProbe['prompt_level'],
    is_first_trial_cold_probe: input.isFirstTrialColdProbe === true,
    mood_state: input.moodState || undefined,
    reported_by: context.reportedBy,
    notes: input.notes?.trim() || undefined,
  };
  return { ok: true, probe, countsTowardIndex: probeTestsNovelCondition(probe) };
}

function isProbe(value: unknown): value is GeneralizationProbe {
  const p = value as GeneralizationProbe;
  return Boolean(
    p &&
      typeof p.probe_id === 'string' &&
      typeof p.goal_id === 'string' &&
      typeof p.date === 'string' &&
      (p.dimension === 'person' || p.dimension === 'place' || p.dimension === 'material_stimulus') &&
      typeof p.independence_pct === 'number'
  );
}

export function loadGeneralizationProbes(goalId?: string): GeneralizationProbe[] {
  try {
    const raw = localStorage.getItem(GENERALIZATION_PROBES_STORAGE_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    const probes = Array.isArray(list) ? list.filter(isProbe) : [];
    return goalId ? probes.filter((p) => p.goal_id === goalId) : probes;
  } catch {
    return [];
  }
}

export function saveGeneralizationProbe(probe: GeneralizationProbe): GeneralizationProbe[] {
  const all = loadGeneralizationProbes().filter((p) => p.probe_id !== probe.probe_id);
  const next = [...all, probe];
  try {
    localStorage.setItem(GENERALIZATION_PROBES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  return next;
}
