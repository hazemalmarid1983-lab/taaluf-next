/**
 * يبني الملف الموحّد + data/taalof_criteria.json
 * التشغيل: node scripts/build-unified-criteria.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { UNIFIED_ITEMS } from './unified-criteria-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const DOMAIN_MAP = {
  'التربية الخاصة': { domain: 'التربية الخاصة', domain_en: 'Special Education' },
  'النطق والتخاطب': { domain: 'النطق والتخاطب', domain_en: 'Speech' },
  'الجانب النفسي': { domain: 'النفسية', domain_en: 'Psychological' },
  'الجانب الوظيفي (الحسي)': { domain: 'الوظيفية', domain_en: 'Occupational' },
  'الجانب الوظيفي (الحركي)': { domain: 'الوظيفية', domain_en: 'Occupational' },
  'التواصل الاجتماعي': {
    domain: 'التواصل الاجتماعي',
    domain_en: 'Social Communication',
  },
  'السلوك المقيد': { domain: 'السلوك المقيد', domain_en: 'Restricted Behavior' },
  الأكاديمي: { domain: 'الأكاديمي', domain_en: 'Academic' },
  'التكيف (الحياة اليومية)': { domain: 'التكيف', domain_en: 'Adaptive' },
};

function normalizeAge(g) {
  const m = String(g).match(/^(\d+)\s*-\s*(\d+)$/);
  if (!m) return g;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return a <= b ? `${a}-${b}` : `${b}-${a}`;
}

if (UNIFIED_ITEMS.length !== 36) {
  throw new Error(`Expected 36 items, got ${UNIFIED_ITEMS.length}`);
}

const unifiedPath = path.join(root, 'data/taalof_unified_criteria.json');
const unifiedDoc = {
  version: '3.0',
  platform: 'تآلف',
  format: 'question+options',
  total_items: UNIFIED_ITEMS.length,
  note: 'مصدر موحّد: سؤال واضح + 4 خيارات كل منها يصف طبيعة الطفل',
  items: UNIFIED_ITEMS,
};
fs.writeFileSync(unifiedPath, JSON.stringify(unifiedDoc, null, 2), 'utf8');

const oldPath = path.join(root, 'data/taalof_criteria.json');
const old = JSON.parse(fs.readFileSync(oldPath, 'utf8'));
const oldById = Object.fromEntries((old.criteria || []).map((c) => [c.id, c]));

const criteria = UNIFIED_ITEMS.map((item) => {
  const mapped = DOMAIN_MAP[item.domain] || {
    domain: item.domain,
    domain_en: item.domain,
  };
  const levels = {};
  for (const opt of item.options || []) {
    levels[String(opt.score)] = {
      label: opt.label,
      description: opt.description,
    };
  }
  const prev = oldById[item.id];
  return {
    id: item.id,
    name: item.category,
    domain: mapped.domain,
    domain_en: mapped.domain_en,
    domain_raw: item.domain,
    question: item.question,
    description: item.question,
    levels,
    recommendation:
      prev?.recommendation ||
      'يُقترح وضع هدف تربوي بسيط قابل للقياس ومتابعة أسبوعية قصيرة.',
    weight: item.weight ?? 1,
    is_reverse: Boolean(item.is_reverse),
    ageBands: (item.age_groups || []).map(normalizeAge),
  };
});

const out = {
  version: '3.0-unified',
  platform: 'تآلف',
  total_criteria: criteria.length,
  domains: [
    'التربية الخاصة',
    'النطق والتخاطب',
    'النفسية',
    'الوظيفية',
    'التواصل الاجتماعي',
    'السلوك المقيد',
    'الأكاديمي',
    'التكيف',
  ],
  classifications: old.classifications,
  criteria,
};

fs.writeFileSync(oldPath, JSON.stringify(out, null, 2), 'utf8');
console.log(
  JSON.stringify(
    {
      unified: 'data/taalof_unified_criteria.json',
      criteria: 'data/taalof_criteria.json',
      count: criteria.length,
      c31: {
        question: criteria.find((c) => c.id === 'C31')?.question,
        opt0: criteria.find((c) => c.id === 'C31')?.levels['0']?.description,
      },
    },
    null,
    2
  )
);
