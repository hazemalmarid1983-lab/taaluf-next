/**
 * يولّد ملف المراجعة التربوية الكامل من مصادر المنصة الفعلية (البيانات + ثوابت المحركات).
 * التشغيل: npm run export:clinical-review
 */

import fs from 'fs';
import path from 'path';
import { ACADEMIC_SEVERITY_THRESHOLDS } from '@/lib/academicAssessmentEngine';
import { ACADEMIC_FULL_QUESTIONS } from '@/lib/academicFullQuestions';
import {
  SOURCE_LABEL_AR,
  SOURCE_WEIGHTS,
  gameResultToCriteriaScores,
  needLevelFromFusedScore,
  suggestedReassessmentDays,
} from '@/lib/fusion';
import {
  LEARNING_DOMAIN_MAX,
  LEARNING_SCREENING_THRESHOLDS,
  LEARNING_TOTAL_MAX,
} from '@/lib/learningScreeningEngine';
import {
  LEARNING_SCREENING_DOMAINS,
  LEARNING_SCREENING_QUESTIONS,
} from '@/lib/learningScreeningQuestions';
import { PARENT_ITEMS, PARENT_SCALE } from '@/lib/parentAssessment';
import {
  SCREENING_DIMENSIONS,
  SCREENING_DOMAIN_REFERRAL_PERCENT,
  SCREENING_ITEMS,
  SCREENING_LIKERT,
  SCREENING_RED_FLAGS,
  SCREENING_THRESHOLDS,
} from '@/lib/screeningEngine';
import {
  CLINICAL_PROMPT_LABELS_AR,
  CLINICAL_PROMPT_LEVELS,
  DEFAULT_SKILL_TYPE_CONFIGS,
  isDigitalAssistanceCue,
  stimulusSupportLabelAr,
  trialResponsePromptLevel,
  trialStimulusSupport,
} from '@/lib/skillMastery';
import {
  DIGITAL_STIMULUS_SUPPORT,
  STIMULUS_ARRAY_LABELS_AR,
  STIMULUS_ARRAY_LEVELS,
  STIMULUS_SUPPORT_STATUS,
} from '@/types/clinical';
import {
  FUNCTIONAL_INDICATOR_DISCLAIMER_AR,
  FUNCTIONAL_INDICATOR_LABELS,
  type FunctionalIndicatorDomain,
} from '@/lib/functionalIndicators';
import {
  TRAINING_DIGITAL_PROMPT_LEVELS,
  TRAINING_PROMPT_LEVELS,
} from '@/lib/training/engine/promptLevels';
import {
  AGE_BAND_LABELS,
  CLASSIFICATIONS,
  CRITERIA_LIST,
  DEVELOPMENTAL_DOMAIN_GAPS,
  DOMAINS,
  TAALOF_CRITERIA,
} from '@/types/taalof';
import screeningData from '@/data/taalof_screening.json';
import parentData from '@/data/taalof_parent_criteria.json';

const lines: string[] = [];
const w = (s = '') => lines.push(s);
const cell = (s: unknown) => String(s ?? '—').replace(/\|/g, '\\|').replace(/\n+/g, ' ');
const row = (cells: unknown[]) => w(`| ${cells.map(cell).join(' | ')} |`);
const table = (headers: string[], rows: unknown[][]) => {
  row(headers);
  w(`|${headers.map(() => '---').join('|')}|`);
  rows.forEach(row);
  w();
};

function signOff(section: string) {
  w(`**قرار الاستشاري — ${section}:** ☐ معتمد  ☐ معتمد مع تعديلات  ☐ غير معتمد`);
  w();
  w('ملاحظات الاستشاري:');
  w();
  w('> ');
  w();
  w('---');
  w();
}

/** نقاط تحوّل دالة متدرجة على مجال 0–3 (يستخرج الحدود من الشيفرة نفسها) */
function transitions(fn: (x: number) => string): Array<{ from: number; label: string }> {
  const out: Array<{ from: number; label: string }> = [];
  for (let i = 0; i <= 300; i++) {
    const x = i / 100;
    const label = fn(x);
    if (!out.length || out[out.length - 1].label !== label) out.push({ from: x, label });
  }
  return out;
}

const critById = new Map(CRITERIA_LIST.map((c) => [c.id, c]));
const devLabel = (id?: string) =>
  TAALOF_CRITERIA.developmentalDomains.find((d) => d.id === id)?.ar ?? id ?? '—';

/* ------------------------------------------------------------------ header */

w('# تآلف — ملف المراجعة التربوية الكامل (للاعتماد العلمي)');
w();
w(`> مولَّد تلقائياً من شيفرة المنصة بتاريخ ${new Date().toISOString().slice(0, 10)} عبر \`npm run export:clinical-review\`.`);
w('> كل نص وبند وعتبة هنا مقروء مباشرة من ملفات البيانات وثوابت المحركات التي تعمل بها المنصة — لا توجد صياغة يدوية.');
w('> أي تعديل يعتمده الاستشاري يُطبَّق في المصدر المذكور تحت كل قسم ثم يُعاد توليد هذا الملف.');
w();
table(
  ['#', 'الأداة', 'عدد البنود', 'مقياس الإجابة', 'الإصدار', 'المصدر'],
  [
    ['1', 'الفرز المجاني', SCREENING_ITEMS.length, '0–3', screeningData.version, 'data/taalof_screening.json · lib/screeningEngine.ts'],
    ['2', 'معايير تقييم الأخصائي', CRITERIA_LIST.length, '0–3', TAALOF_CRITERIA.version, 'data/taalof_criteria_v3.json · types/taalof.ts'],
    ['3', 'استبيان ولي الأمر', PARENT_ITEMS.length, '0–3', parentData.version, 'data/taalof_parent_criteria.json · lib/parentAssessment.ts'],
    ['4', 'فرز صعوبات التعلم', LEARNING_SCREENING_QUESTIONS.length, '0–2', '—', 'lib/learningScreeningQuestions.ts · lib/learningScreeningEngine.ts'],
    ['5', 'التقييم الأكاديمي الشامل', ACADEMIC_FULL_QUESTIONS.length, '0–3', '—', 'lib/academicFullQuestions.ts · lib/academicAssessmentEngine.ts'],
    ['6', 'دمج المصادر المتعددة', '—', 'متوسط موزون 0–3', 'Canon 4.0-unified', 'lib/fusion.ts'],
    ['7', 'تلقين الاستجابة ودعم مصفوفة المثيرات', TRAINING_DIGITAL_PROMPT_LEVELS.length, `بُعدان: ${CLINICAL_PROMPT_LEVELS.length} مستويات تلقين + ${STIMULUS_ARRAY_LEVELS.length} مستويات مصفوفة`, '—', 'types/clinical.ts · lib/skillMastery.ts · lib/goalSessionForm.ts'],
  ]
);
w('في كل الأدوات: **الدرجة الأعلى = حاجة دعم أكبر** (لا توجد بنود معكوسة الترميز في الحساب).');
w();
w('### التعديلات الإلزامية بناءً على ملاحظات المدقق التربوي');
w();
table(
  ['#', 'الملاحظة', 'ما طُبّق', 'القسم', 'الاختبارات'],
  [
    [
      '1',
      'تعدد بنود الأهل للمعيار الواحد يضاعف وزن الأهل',
      `«الدمج ثم الترجيح»: متوسط بنود المصدر الواحد للمعيار أولاً، ثم يدخل المعادلة مرة واحدة بوزن ${SOURCE_WEIGHTS.parent.toFixed(1)} (consolidateSourceScores)`,
      '3 · 6.1',
      '__tests__/fusion.test.ts',
    ],
    [
      '2',
      'خلط تعديل مصفوفة المثيرات بتلقين الاستجابة',
      'بُعدان مستقلان: تلقين الاستجابة (بشري) ودعم مصفوفة المثيرات (رقمي). الإتقان بالمجس البارد يشترط استقلالية 100% ومصفوفة كاملة غير معدّلة',
      '7',
      '__tests__/stimulusSupport.test.ts',
    ],
    [
      '3',
      'تسميات تشخيصية طبية في مخرجات الفرز والتقييم الأكاديمي',
      'معرّفات ووصف وظيفي محايد بدل التسميات التشخيصية، مع تنبيه ثابت على كل المخرجات',
      '4 · 5 · 5.2',
      '__tests__/functionalIndicators.test.ts',
    ],
  ]
);
w('---');
w();

/* --------------------------------------------------------------- screening */

w('## 1. الفرز المجاني (12 سؤالاً)');
w();
w('### 1.1 مقياس الإجابة');
w();
table(['القيمة', 'التسمية'], SCREENING_LIKERT.map((l) => [l.value, l.label]));
w('### 1.2 المحاور');
w();
table(
  ['المعرّف', 'المحور', 'البنود'],
  SCREENING_DIMENSIONS.map((d) => [d.id, d.label_ar, SCREENING_ITEMS.filter((i) => i.dimension === d.id).map((i) => i.id).join('، ')])
);
w('### 1.3 البنود كاملة');
w();
const redFlagById = new Map(SCREENING_RED_FLAGS.map((f) => [f.itemId, f]));
for (const dim of SCREENING_DIMENSIONS) {
  w(`#### محور: ${dim.label_ar} (\`${dim.id}\`)`);
  w();
  for (const item of SCREENING_ITEMS.filter((i) => i.dimension === dim.id)) {
    const flag = redFlagById.get(item.id);
    w(`**${item.id}** — ${item.question || item.text}`);
    w();
    w(`- الوزن داخل المحور: ${item.weight ?? 1}${flag ? ` · **بند إنذار مبكر:** درجة ≥ ${flag.minScore} (${flag.label_ar})` : ''}`);
    for (const o of item.options || []) w(`- **${o.score} — ${o.label}:** ${o.description}`);
    w();
  }
}
w('### 1.4 منطق الحساب والإحالة');
w();
w('- **نسبة المحور** = مجموع (الدرجة × وزن البند) ÷ مجموع (3 × وزن البند) × 100، مقرّبة.');
w('- **المؤشر العام** = مجموع درجات البنود الاثني عشر (دون أوزان) ÷ 36 × 100، مقرّب.');
table(
  ['النطاق', 'المؤشر العام'],
  [
    ['متوازن', `< ${SCREENING_THRESHOLDS.moderate}%`],
    ['متوسط', `${SCREENING_THRESHOLDS.moderate}% – ${SCREENING_THRESHOLDS.elevated - 1}%`],
    ['مرتفع', `≥ ${SCREENING_THRESHOLDS.elevated}%`],
  ]
);
w('**يوصى بالتقييم الشامل إذا تحقق أيٌّ مما يلي:**');
w();
table(
  ['السبب', 'البند / المحور', 'العتبة'],
  [
    ...SCREENING_RED_FLAGS.map((f) => ['بند إنذار مبكر', `${f.itemId} — ${f.label_ar}`, `درجة ≥ ${f.minScore}`]),
    ['محور مرتفع', 'أي محور', `نسبة المحور ≥ ${SCREENING_DOMAIN_REFERRAL_PERCENT}%`],
    ['مؤشر عام مرتفع', 'المؤشر العام', `≥ ${SCREENING_THRESHOLDS.elevated}%`],
  ]
);
w('- النتيجة تعرض تنبيه «ليس تشخيصاً»، ولا تحويل تلقائي لصفحة الباقات.');
w(`- النتيجة (الشاشة واستجابة الخادم) تحمل التنبيه الثابت: «${FUNCTIONAL_INDICATOR_DISCLAIMER_AR}»`);
w('- يشترط الخادم إجابة صحيحة (عدد صحيح 0–3) لكل البنود الاثني عشر.');
w();
signOff('الفرز المجاني');

/* ---------------------------------------------------------------- criteria */

w(`## 2. معايير تقييم الأخصائي (${CRITERIA_LIST.length} معياراً)`);
w();
w('### 2.1 المجالات والفئات العمرية');
w();
table(
  ['المجال', 'عدد المعايير'],
  DOMAINS.map((d) => [d, CRITERIA_LIST.filter((c) => c.domain === d).length])
);
table(
  ['الفئة العمرية', 'الاسم', 'عدد المعايير الفعّالة'],
  Object.entries(AGE_BAND_LABELS).map(([band, l]) => [band, l.ar, CRITERIA_LIST.filter((c) => c.ageBands?.includes(band)).length])
);
if (DEVELOPMENTAL_DOMAIN_GAPS.length) {
  w(`> فجوة معلنة: مجالات نمائية بلا أي معيار — ${DEVELOPMENTAL_DOMAIN_GAPS.map(devLabel).join('، ')}.`);
  w();
}
w('### 2.2 المعايير كاملة');
w();
for (const domain of DOMAINS) {
  const list = CRITERIA_LIST.filter((c) => c.domain === domain);
  w(`#### مجال: ${domain} (${list.length})`);
  w();
  for (const c of list) {
    const ext = c as typeof c & {
      title?: string;
      question?: string;
      autoGoal?: string;
      referralRecommendation?: string;
      developmentalDomain?: string;
    };
    w(`##### ${c.id} — ${c.name}`);
    w();
    w(`- **السؤال:** ${ext.question || c.description || '—'}`);
    if (c.description && c.description !== ext.question) w(`- **الوصف:** ${c.description}`);
    w(`- **المجال النمائي:** ${devLabel(ext.developmentalDomain)} · **الوزن:** ${c.weight} · **الفئات العمرية:** ${(c.ageBands || []).join('، ') || '—'}`);
    for (const k of Object.keys(c.levels || {}).sort()) {
      const lv = (c.levels as Record<string, { label: string; description: string }>)[k];
      w(`- **${k} — ${lv.label}:** ${lv.description}`);
    }
    w(`- **التوصية:** ${c.recommendation || '—'}`);
    if (ext.autoGoal) w(`- **الهدف التلقائي (SMART):** ${ext.autoGoal}`);
    if (ext.referralRecommendation) w(`- **توصية الإحالة:** ${ext.referralRecommendation}`);
    w();
  }
}
w('### 2.3 منطق الحساب');
w();
w('- تُحتسب فقط المعايير الفعّالة لفئة الطفل العمرية (يُحدد العمر من تاريخ الميلاد: < 5 → 3-4، < 7 → 5-6، < 10 → 7-9، وإلا 10-12).');
w('- **النسبة الكلية** = مجموع (الدرجة × وزن المعيار) ÷ مجموع (3 × وزن المعيار) × 100، مقرّبة. المعيار غير المُقيَّم = 0.');
w('- **متوسط المجال** = متوسط درجات المعايير المُقيَّمة في المجال (0–3).');
w('- **توليد الأهداف:** كل معيار درجته ≥ 2 يولّد هدف SMART (يُفضَّل نص autoGoal)، مرتبة تنازلياً بالدرجة.');
w();
table(
  ['التصنيف الكلي', 'من %', 'إلى %', 'إعادة التقييم المقترحة (يوم)'],
  CLASSIFICATIONS.map((c) => [c.label, c.min, c.max, suggestedReassessmentDays(c.label)])
);
signOff('معايير تقييم الأخصائي');

/* ------------------------------------------------------------------ parent */

w(`## 3. استبيان ولي الأمر (${PARENT_ITEMS.length} سؤالاً)`);
w();
table(['القيمة', 'التسمية'], PARENT_SCALE.map((l) => [l.value, l.label]));
w('كل سؤال مربوط بمعيار أخصائي واحد. بنود الأهل المربوطة بالمعيار نفسه تُختزل أولاً إلى متوسط واحد، ثم يدخل هذا المتوسط محرك الدمج بوزن ولي الأمر مرة واحدة (القسم 6.1).');
w();
table(
  ['البند', 'المجال', 'المعيار المقابل'],
  PARENT_ITEMS.map((i) => [i.id, i.domain, `${i.mappedCriterion} — ${critById.get(i.mappedCriterion)?.name ?? 'غير موجود'}`])
);
for (const item of PARENT_ITEMS) {
  w(`**${item.id}** — ${item.question || item.text}`);
  w();
  w(`- المجال: ${item.domain} · المعيار المقابل: ${item.mappedCriterion} (${critById.get(item.mappedCriterion)?.domain ?? '—'})`);
  for (const o of item.options || []) w(`- **${o.score} — ${o.label}:** ${o.description}`);
  w();
}
const domainMismatch = PARENT_ITEMS.filter((i) => {
  const c = critById.get(i.mappedCriterion);
  return c && c.domain !== i.domain;
});
if (domainMismatch.length) {
  w('> **للمراجعة:** بنود يختلف مجالها في الاستبيان عن مجال المعيار المقابل لها:');
  w('>');
  domainMismatch.forEach((i) => w(`> - ${i.id}: «${i.domain}» ← ${i.mappedCriterion} في «${critById.get(i.mappedCriterion)?.domain}»`));
  w();
}
const parentRowsByCriterion = new Map<string, string[]>();
for (const item of PARENT_ITEMS) {
  parentRowsByCriterion.set(item.mappedCriterion, [...(parentRowsByCriterion.get(item.mappedCriterion) ?? []), item.id]);
}
const multiMapped = Array.from(parentRowsByCriterion.entries()).filter(([, ids]) => ids.length > 1);
if (multiMapped.length) {
  w('**معايير تتلقى أكثر من بند أهل — تُطبَّق عليها قاعدة «الدمج ثم الترجيح»:**');
  w();
  table(
    ['المعيار', 'البنود المغذّية', 'درجة الأهل الموحّدة', 'وزن الأهل في الدمج'],
    multiMapped.map(([cid, ids]) => [
      `${cid} — ${critById.get(cid)?.name}`,
      ids.join('، '),
      `متوسط (${ids.join(' + ')}) ÷ ${ids.length}`,
      SOURCE_WEIGHTS.parent.toFixed(1),
    ])
  );
  w(
    `وزن الأهل لا يتجاوز ${SOURCE_WEIGHTS.parent.toFixed(1)} لأي معيار مهما تعدّدت البنود، فيبقى الترتيب أخصائي ${SOURCE_WEIGHTS.specialist.toFixed(1)} > ألعاب ${SOURCE_WEIGHTS.game.toFixed(1)} > أهل ${SOURCE_WEIGHTS.parent.toFixed(1)} ثابتاً.`
  );
  w();
}
w('- بعد الإرسال يُقفل الاستبيان للطفل مدة تحددها الباقة (lib/assessmentCooldown.ts).');
w();
signOff('استبيان ولي الأمر');

/* -------------------------------------------------------------- LD screen */

const indicatorLabel = (id: string) => FUNCTIONAL_INDICATOR_LABELS[id as FunctionalIndicatorDomain]?.ar ?? id;

w(`## 4. فرز المؤشرات الأكاديمية الوظيفية (${LEARNING_SCREENING_QUESTIONS.length} بنداً)`);
w();
w('مقياس ثلاثي: **0** طبيعي · **1** صعوبة متوسطة · **2** صعوبة واضحة.');
w();
w(`> كل مخرجات هذه الأداة تعرض: «${FUNCTIONAL_INDICATOR_DISCLAIMER_AR}»`);
w();
for (const d of LEARNING_SCREENING_DOMAINS) {
  w(`#### محور: ${d.label_ar} (\`${d.id}\`)`);
  w();
  w(`- **الوصف الظاهر في النتائج:** ${indicatorLabel(d.id)}`);
  w();
  for (const q of LEARNING_SCREENING_QUESTIONS.filter((x) => x.domain === d.id)) {
    w(`**${q.id}** — ${q.domainLabel}: ${q.question}`);
    w();
    for (const o of q.options) w(`- **${o.score} — ${o.label}:** ${o.description}`);
    w();
  }
}
w('### 4.1 منطق الحساب');
w();
table(
  ['المستوى', `درجة المحور (0–${LEARNING_DOMAIN_MAX})`],
  [
    ['مستقر', `< ${LEARNING_SCREENING_THRESHOLDS.domainModerate}`],
    ['متوسط', `${LEARNING_SCREENING_THRESHOLDS.domainModerate} – ${LEARNING_SCREENING_THRESHOLDS.domainHigh - 1}`],
    ['مرتفع', `≥ ${LEARNING_SCREENING_THRESHOLDS.domainHigh}`],
  ]
);
w(`- **الخطر العام مرتفع** إذا بلغ المجموع (0–${LEARNING_TOTAL_MAX}) ${LEARNING_SCREENING_THRESHOLDS.overallHigh} أو أكثر، أو كان أي محور مرتفعاً.`);
w(`- **الخطر العام متوسط** إذا بلغ المجموع ${LEARNING_SCREENING_THRESHOLDS.overallModerate} أو أكثر، أو كان أي محور متوسطاً.`);
w('- يوصى بالتقييم الأكاديمي الشامل عند الخطر العام المرتفع فقط.');
w();
signOff('فرز المؤشرات الأكاديمية الوظيفية');

/* --------------------------------------------------------------- academic */

const academicDomains = Array.from(new Set(ACADEMIC_FULL_QUESTIONS.map((q) => q.domain)));
w(`## 5. التقييم الأكاديمي الشامل (${ACADEMIC_FULL_QUESTIONS.length} بنداً)`);
w();
w('مقياس رباعي: **0** متقن · **1** جزئي · **2** صعوبة · **3** احتياج مكثف (النص الدقيق لكل خيار أدناه).');
w();
for (const d of academicDomains) {
  const list = ACADEMIC_FULL_QUESTIONS.filter((q) => q.domain === d);
  w(`#### محور: ${list[0].domainLabel} (\`${d}\`، ${list.length} بنود)`);
  w();
  w(`- **الوصف الظاهر في النتائج:** ${indicatorLabel(d)}`);
  w();
  for (const q of list) {
    w(`**${q.id}** — ${q.skillName}: ${q.question}`);
    w();
    for (const o of q.options) w(`- **${o.score} — ${o.label}:** ${o.description}`);
    w();
  }
}
w('### 5.1 منطق الحساب');
w();
table(
  ['الشدة', 'مجموع المحور الخام (0–27)'],
  [
    ['ضمن المعدل المتوقع', `< ${ACADEMIC_SEVERITY_THRESHOLDS.mild}`],
    ['احتياج مساندة خفيفة', `${ACADEMIC_SEVERITY_THRESHOLDS.mild} – ${ACADEMIC_SEVERITY_THRESHOLDS.moderate - 1}`],
    ['احتياج تدخلي متوسط', `${ACADEMIC_SEVERITY_THRESHOLDS.moderate} – ${ACADEMIC_SEVERITY_THRESHOLDS.severe - 1}`],
    ['احتياج تدخلي مكثف', `≥ ${ACADEMIC_SEVERITY_THRESHOLDS.severe}`],
  ]
);
w('- كل بند درجته ≥ 2 يُسجَّل «نقطة ضعف» باسم المهارة.');
w('- **الخلاصة العامة:** «مؤشرات مرتفعة» إذا وُجد محور مكثف أو محوران متوسطان فأكثر؛ «احتياج مساندة» إذا وُجد محور متوسط واحد أو أي محور خفيف؛ وإلا «ملف متوازن».');
w('- محور الأولوية = الأعلى مجموعاً، وتُقترح أهدافه الثلاثة؛ تُجمع تسهيلات الاختبار من المحاور المتوسطة والمكثفة.');
w();
w('### 5.2 إزالة التسميات التشخيصية (الأقسام 1 و4 و5 وكل الواجهات)');
w();
table(
  ['المعرّف القديم (يُحوَّل تلقائياً في السجلات المحفوظة)', 'المعرّف الحالي', 'الوصف الوظيفي الظاهر'],
  [
    ['dyslexia', 'reading_decoding', indicatorLabel('reading_decoding')],
    ['dysgraphia', 'written_expression', indicatorLabel('written_expression')],
    ['dyscalculia', 'numeracy_processing', indicatorLabel('numeracy_processing')],
    ['executive_adhd', 'attention_focus', indicatorLabel('attention_focus')],
  ]
);
w('- الخلاصة العامة حقل «خلاصة المؤشرات» (primaryIndicatorSummary) بدل «التشخيص الأساسي»؛ يُحوَّل الحقل القديم عند قراءة تقرير محفوظ.');
w('- لا يظهر أي مصطلح تشخيصي (عسر القراءة/الكتابة/الحساب، فرط الحركة وتشتت الانتباه) في بنود الأداتين ولا في مخرجاتهما — يتحقق منه اختبار آلي.');
w(`- التنبيه الثابت «${FUNCTIONAL_INDICATOR_DISCLAIMER_AR}» يُرفق بكل نتيجة (الفرز النمائي، فرز المؤشرات الأكاديمية، التقييم الأكاديمي الشامل) ويُعرض في شاشات النتائج وبطاقة التسهيلات وتقرير الخطة الفردية وتقرير الوزارة.`);
w();
signOff('التقييم الأكاديمي الشامل');

/* ------------------------------------------------------------------ fusion */

w('## 6. دمج المصادر المتعددة وأوزانها');
w();
table(
  ['المصدر', 'الوزن'],
  Object.entries(SOURCE_WEIGHTS).map(([k, v]) => [SOURCE_LABEL_AR[k] ?? k, v.toFixed(1)])
);
w('### 6.1 المعادلة');
w();
w('1. **الدمج أولاً:** لكل معيار ولكل مصدر، تُختزل كل صفوف ذلك المصدر إلى **درجة موحّدة واحدة** = متوسطها. كل درجة محصورة في 0–3.');
w('2. **ثم الترجيح:** **الدرجة المدمجة** = Σ(الدرجة الموحّدة للمصدر × وزن المصدر) ÷ Σ(أوزان المصادر المتوفرة لهذا المعيار)، مقرّبة لمنزلتين. كل مصدر يُحتسب مرة واحدة بوزنه — عدد البنود لا يغيّر الوزن.');
w('3. المعيار الذي لم يُقيّمه أي مصدر **لا يدخل** في النسبة الكلية (حتى لا يُخفَّف التقييم الأسري).');
w('4. **نسبة الاحتياج الكلية** = Σ(الدرجة المدمجة × وزن المعيار) ÷ Σ(3 × وزن المعيار) للمعايير المُقيَّمة × 100.');
w('5. التصنيف الكلي من جدول التصنيفات في القسم 2.3.');
w('6. **الوضع:** «شامل» إذا وُجدت درجة أخصائي، وإلا «أسري» (أهل ± ألعاب).');
w();
w('**مثال:** أخصائي 2، أهل 1، ألعاب 3 ← (2×2 + 1×1 + 3×1.5) ÷ (2 + 1 + 1.5) = 9.5 ÷ 4.5 = **2.11**.');
w();
if (multiMapped.length) {
  const [cid, ids] = multiMapped.find(([, list]) => list.length >= 3) ?? multiMapped[0];
  const n = ids.length;
  const before = Math.round(((n * 3) / (SOURCE_WEIGHTS.specialist + n * SOURCE_WEIGHTS.parent)) * 100) / 100;
  const after = Math.round((3 / (SOURCE_WEIGHTS.specialist + SOURCE_WEIGHTS.parent)) * 100) / 100;
  w(
    `**مثال تعدد بنود الأهل (${cid}):** أخصائي 0، و${ids.join(' و')} كلها 3 ← الدرجة الموحّدة للأهل = 3 ← (0×${SOURCE_WEIGHTS.specialist} + 3×${SOURCE_WEIGHTS.parent}) ÷ (${SOURCE_WEIGHTS.specialist} + ${SOURCE_WEIGHTS.parent}) = **${after}**. (الحساب التراكمي السابق كان يعطي ${before} لأن وزن الأهل الفعلي بلغ ${(n * SOURCE_WEIGHTS.parent).toFixed(1)}.)`
  );
  w();
}
w('### 6.2 مستوى الاحتياج لكل معيار (من الدرجة المدمجة)');
w();
const need = transitions((x) => needLevelFromFusedScore(x));
table(
  ['المستوى', 'الدرجة المدمجة'],
  need.map((t, i) => [t.label, i + 1 < need.length ? `${t.from.toFixed(2)} – أقل من ${need[i + 1].from.toFixed(2)}` : `≥ ${t.from.toFixed(2)}`])
);
w('### 6.3 تحويل نتائج الألعاب إلى درجات معايير');
w();
w('درجة القلق = تقريب((1 − نسبة الدقة) × 3). إذا تكرر معيار من أكثر من لعبة تُعتمد آخر قيمة.');
w();
const games = ['imitation', 'visual_tracking', 'little_hero', 'bubble_seeker', 'friend_feeder', 'emotions', 'emotion_mirror', 'letter_hunter', 'sensory_matching'];
table(
  ['اللعبة', 'المقياس المستخدم', 'المعايير المتأثرة'],
  games.map((g) => {
    const ids = Array.from(new Set(gameResultToCriteriaScores({ gameCode: g }).map((s) => s.criterionId)));
    const metric: Record<string, string> = {
      imitation: 'نسبة التقليد',
      visual_tracking: 'دقة التتبع',
      little_hero: 'التقليد + التتبع + المشاعر',
      bubble_seeker: 'دقة التتبع / الانتباه المشترك',
      friend_feeder: 'تبادل الأدوار',
      emotions: 'دقة المشاعر',
      emotion_mirror: 'دقة المشاعر',
      letter_hunter: 'الدقة',
      sensory_matching: 'الدقة',
    };
    return [g, metric[g], ids.map((id) => `${id} ${critById.get(id)?.name ?? ''}`).join('، ')];
  })
);
signOff('دمج المصادر');

/* ------------------------------------------------------------------ prompts */

w('## 7. تلقين الاستجابة ودعم مصفوفة المثيرات (بُعدان مستقلان)');
w();
w('كل محاولة تُسجَّل على بُعدين لا يُطابَق أحدهما مع الآخر:');
w();
w('- **البُعد الأول — مستوى تلقين الاستجابة (بشري/سلوكي):** ما قدّمه المدرّب قبل الاستجابة.');
w('- **البُعد الثاني — مستوى دعم مصفوفة المثيرات (رقمي/بيئي):** ما عدّلته الشاشة في المثيرات المعروضة.');
w();
w('### 7.1 البُعد الأول: تلقين الاستجابة (من الأقل إلى الأكثر تدخلاً)');
w();
table(
  ['الترتيب', 'المستوى', 'بالعربية'],
  CLINICAL_PROMPT_LEVELS.map((l, i) => [i + 1, l, CLINICAL_PROMPT_LABELS_AR[l]])
);
w('### 7.2 البُعد الثاني: دعم مصفوفة المثيرات');
w();
table(
  ['الترتيب', 'المستوى', 'بالعربية'],
  STIMULUS_ARRAY_LEVELS.map((l, i) => [i + 1, l, STIMULUS_ARRAY_LABELS_AR[l]])
);
w('### 7.3 تسجيل كل مستوى يسجله محرك التدريب على البُعدين');
w();
const digital = new Set<string>(TRAINING_DIGITAL_PROMPT_LEVELS);
table(
  ['قيمة المحرك', 'رقمي؟', 'ما يحدث على الشاشة', 'بُعد تلقين الاستجابة', 'بُعد مصفوفة المثيرات', 'صالحة للإتقان؟', 'سبب التصنيف'],
  TRAINING_PROMPT_LEVELS.map((l) => {
    const response = trialResponsePromptLevel(l);
    const cue = trialStimulusSupport(l);
    const rule = isDigitalAssistanceCue(l) ? DIGITAL_STIMULUS_SUPPORT[l] : undefined;
    return [
      l,
      digital.has(l) ? 'نعم' : 'لا',
      rule?.on_screen_ar ?? '—',
      response ? `${response} — ${CLINICAL_PROMPT_LABELS_AR[response]}` : 'غير معروف',
      stimulusSupportLabelAr(cue),
      response === 'Independent' && !cue ? 'نعم' : 'لا',
      rule?.rationale_ar ?? '—',
    ];
  })
);
w(`حالة تصنيف المساعدات على مستويات المصفوفة: **${STIMULUS_SUPPORT_STATUS === 'approved' ? 'معتمدة' : 'بانتظار اعتماد الخبير التربوي'}** (\`DIGITAL_STIMULUS_SUPPORT\` في types/clinical.ts). الفصل بين البُعدين نفسه مطبّق بطلب المدقق.`);
w();
const coldProbe = DEFAULT_SKILL_TYPE_CONFIGS.closed_cognitive;
w('### 7.4 القواعد المطبّقة');
w();
w('- **لا تُطابَق أي مساعدة رقمية** (مصفوفة مخفّضة أو إبراز بصري مباشر) مع «تلقين بالإشارة» أو «نموذج» أو أي مستوى تلقين استجابة. المحاولة التي تلقّت دعماً رقمياً فقط تُسجَّل «مستقل» على بُعد الاستجابة و«مدعومة» على بُعد المثير.');
w('- **المحاولة المستقلة الصالحة** = استجابة مستقلة **و**مصفوفة كاملة غير معدّلة (بلا تقليل ولا إبراز). محاولات المصفوفة المخفّضة تُسجَّل تحت دعم المثير ولا تُحتسب في نسبة الاستقلالية.');
w(
  `- **إتقان المجس البارد (${coldProbe.label_ar}):** استقلالية استجابة ${coldProbe.mastery_threshold_pct}% **و**مصفوفة كاملة غير معدّلة في ${coldProbe.consecutive_sessions_required} جلسات متتالية، مع محاولة أولى (Cold probe) مستقلة على مصفوفة كاملة. جلسة واحدة بدعم للمثير تكسر السلسلة.`
);
w('- في أنواع المهارات ذات العتبة الأقل من 100% تبقى المحاولة الأولى مشروطة بالاستقلال على مصفوفة كاملة.');
w('- مستوى الجلسة على كل بُعد = **الأكثر تدخلاً** بين محاولاتها.');
w('- نموذج الجلسة يرفض: مساعدة رقمية مُدخلة كمستوى تلقين، واستقلالية 100% مع مصفوفة معدّلة.');
w('- وصف ما يحدث على الشاشة مأخوذ من محرك «ابحث عن الهدف» (lib/training/findTheTargetEngine.ts)، وقد يختلف شكل الإبراز بين الألعاب.');
w();
w('> **مطلوب اعتماد علمي:** تصنيف كل مساعدة رقمية على مستويات المصفوفة الثلاثة (العمود «بُعد مصفوفة المثيرات» أعلاه).');
w();
signOff('تلقين الاستجابة ودعم مصفوفة المثيرات');

w('## التوقيع النهائي');
w();
table(['البند', 'القيمة'], [['اسم الاستشاري', ''], ['المؤهل / رقم الاعتماد', ''], ['تاريخ المراجعة', ''], ['التوقيع', '']]);

const out = path.join(process.cwd(), 'docs', 'CLINICAL_REVIEW_DOSSIER.md');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, lines.join('\n'), 'utf8');
console.log(
  JSON.stringify({
    out: 'docs/CLINICAL_REVIEW_DOSSIER.md',
    screening: SCREENING_ITEMS.length,
    criteria: CRITERIA_LIST.length,
    parent: PARENT_ITEMS.length,
    learning: LEARNING_SCREENING_QUESTIONS.length,
    academic: ACADEMIC_FULL_QUESTIONS.length,
    lines: lines.length,
  })
);
