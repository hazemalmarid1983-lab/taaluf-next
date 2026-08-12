import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const criteria = JSON.parse(
  fs.readFileSync(path.join(root, 'data/taalof_criteria.json'), 'utf8')
);
const screening = JSON.parse(
  fs.readFileSync(path.join(root, 'data/taalof_screening.json'), 'utf8')
);
const parent = JSON.parse(
  fs.readFileSync(path.join(root, 'data/taalof_parent_criteria.json'), 'utf8')
);

const dimLabel = Object.fromEntries(
  (screening.dimensions || []).map((d) => [d.id, d.label_ar])
);
const critById = Object.fromEntries(
  (criteria.criteria || []).map((c) => [c.id, c])
);

const lines = [];
const w = (s = '') => lines.push(s);

w('# تآلف — مرجع كامل لمعايير وأسئلة التقييم');
w();
w('> ملف مجمع من مصادر المنصة الرسمية كما هي معتمدة في الكود.');
w('>');
w('> المصادر:');
w('> - `data/taalof_criteria.json` (تقييم الأخصائي — 36 معياراً)');
w('> - `data/taalof_screening.json` (الفرز الأولي — 12 سؤالاً)');
w('> - `data/taalof_parent_criteria.json` (استبيان الأهل — 20 سؤالاً)');
w();
w('---');
w();
w('## 1) نظرة عامة');
w();
w('| المكوّن | العدد | الإصدار |');
w('|---------|------|---------|');
w(
  `| معايير تقييم الأخصائي | ${criteria.total_criteria || criteria.criteria.length} | ${criteria.version} |`
);
w(
  `| أسئلة الفرز الأولي | ${screening.total_items || screening.items.length} | ${screening.version} |`
);
w(
  `| أسئلة استبيان الأهل | ${parent.total_items || parent.items.length} | ${parent.version} |`
);
w(`| مجالات التقييم | ${(criteria.domains || []).length} | — |`);
w();
w('### مجالات التقييم الثمانية');
w();
(criteria.domains || []).forEach((d, i) => w(`${i + 1}. ${d}`));
w();
w('### تصنيفات النتيجة الإجمالية (تقييم الأخصائي)');
w();
w('| التصنيف | من | إلى | اللون |');
w('|---------|----|----|-------|');
(criteria.classifications || []).forEach((c) => {
  w(`| ${c.label} | ${c.min} | ${c.max} | ${c.color} |`);
});
w();
w('---');
w();
w('## 2) الفرز الأولي (12 سؤالاً)');
w();
w('**مقياس الإجابة الموحّد:**');
w();
(screening.likert || []).forEach((l) => w(`- **${l.value}** — ${l.label}`));
w();
w(
  '> كل سؤال يعرض 4 خيارات تصف طبيعة الطفل. الدرجة الأعلى = مؤشر حاجة دعم أكبر.'
);
w();

const byDim = {};
(screening.items || []).forEach((it) => {
  if (!byDim[it.dimension]) byDim[it.dimension] = [];
  byDim[it.dimension].push(it);
});

for (const dim of Object.keys(byDim)) {
  w(`### بُعد: ${dimLabel[dim] || dim} (\`${dim}\`)`);
  w();
  for (const it of byDim[dim]) {
    w(`#### ${it.id}`);
    w(`- **السؤال:** ${it.question || it.text}`);
    w(`- **الوزن:** ${it.weight}`);
    w('- **الاختيارات:**');
    (it.options || []).forEach((o) => {
      w(`  - **${o.score} — ${o.label}:** ${o.description}`);
    });
    w();
  }
}

w('---');
w();
w('## 3) استبيان الأهل (20 سؤالاً)');
w();
w('**مقياس الإجابة الموحّد:**');
w();
(parent.scale || []).forEach((l) => w(`- **${l.value}** — ${l.label}`));
w();
w(
  '> كل سؤال مربوط بمعيار أخصائي (`mappedCriterion`) وبنفس صيغة السؤال + الخيارات الوصفية.'
);
w();

for (const it of parent.items || []) {
  const mapped = critById[it.mappedCriterion];
  w(`### ${it.id}`);
  w(`- **السؤال:** ${it.question || it.text}`);
  w(`- **المجال:** ${it.domain}`);
  w(
    `- **المعيار المقابل:** ${it.mappedCriterion}${mapped ? ` — ${mapped.name}` : ''}`
  );
  w('- **الاختيارات:**');
  (it.options || []).forEach((o) => {
    w(`  - **${o.score} — ${o.label}:** ${o.description}`);
  });
  w();
}

w('---');
w();
w('## 4) معايير تقييم الأخصائي (36 معياراً)');
w();
w('مقياس كل معيار: **0 مستقر · 1 متوسط · 2 شديد · 3 شديد جداً**');
w();

const byDomain = {};
(criteria.criteria || []).forEach((c) => {
  if (!byDomain[c.domain]) byDomain[c.domain] = [];
  byDomain[c.domain].push(c);
});

for (const domain of criteria.domains || []) {
  const list = byDomain[domain] || [];
  w(`### مجال: ${domain} (${list.length} معايير)`);
  w();
  for (const c of list) {
    w(`#### ${c.id} — ${c.name}`);
    w();
    w(`- **السؤال:** ${c.question || c.description}`);
    w(`- **المجال بالإنجليزية:** ${c.domain_en || '—'}`);
    w(`- **الوزن:** ${c.weight}`);
    w(`- **الفئات العمرية:** ${(c.ageBands || []).join('، ') || '—'}`);
    w('- **الاختيارات (وصف طبيعة الطفل):**');
    const levels = c.levels || {};
    for (const k of Object.keys(levels).sort()) {
      const lv = levels[k];
      w(`  - **${k} — ${lv.label}:** ${lv.description}`);
    }
    w(`- **التوصية التربوية:** ${c.recommendation || '—'}`);
    w();
  }
}

w('---');
w();
w('## 5) فهرس سريع (معايير الأخصائي)');
w();
w('| الرمز | الاسم | المجال | الفئات العمرية |');
w('|-------|------|--------|----------------|');
(criteria.criteria || []).forEach((c) => {
  w(
    `| ${c.id} | ${c.name} | ${c.domain} | ${(c.ageBands || []).join(' / ') || '—'} |`
  );
});
w();
w('---');
w();
w('*تم التوليد تلقائياً من ملفات بيانات منصة تآلف.*');
w();

const out = path.join(root, 'docs', 'TAALUF_ASSESSMENT_CRITERIA_FULL.md');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, lines.join('\n'), 'utf8');
console.log(
  JSON.stringify({
    out: 'docs/TAALUF_ASSESSMENT_CRITERIA_FULL.md',
    criteria: criteria.criteria.length,
    screening: screening.items.length,
    parent: parent.items.length,
    bytes: Buffer.byteLength(lines.join('\n'), 'utf8'),
  })
);
