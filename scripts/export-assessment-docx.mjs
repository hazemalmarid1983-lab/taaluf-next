/**
 * يصدّر مرجع التقييم الكامل إلى ملف Word (.docx)
 * التشغيل: node scripts/export-assessment-docx.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  BorderStyle,
} from 'docx';

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

const children = [];

function h1(text) {
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 360, after: 200 },
      children: [new TextRun({ text, bold: true, size: 36, font: 'Arial', rightToLeft: true })],
    })
  );
}

function h2(text) {
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 280, after: 160 },
      children: [new TextRun({ text, bold: true, size: 28, font: 'Arial', rightToLeft: true })],
    })
  );
}

function h3(text) {
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 220, after: 120 },
      children: [new TextRun({ text, bold: true, size: 24, font: 'Arial', rightToLeft: true })],
    })
  );
}

function p(text, opts = {}) {
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text,
          bold: Boolean(opts.bold),
          size: opts.size || 22,
          font: 'Arial',
          rightToLeft: true,
        }),
      ],
    })
  );
}

function bullet(text) {
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      spacing: { after: 60 },
      indent: { right: 360 },
      children: [
        new TextRun({ text: `• ${text}`, size: 21, font: 'Arial', rightToLeft: true }),
      ],
    })
  );
}

function divider() {
  children.push(
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: '2D8B5A' },
      },
      spacing: { before: 120, after: 200 },
      children: [],
    })
  );
}

// —— العنوان ——
h1('تآلف — مرجع كامل لمعايير وأسئلة التقييم');
p('ملف مجمع من مصادر المنصة الرسمية كما هي معتمدة في الكود.', { bold: true });
p(`تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}`);
p('المصادر: taalof_criteria.json · taalof_screening.json · taalof_parent_criteria.json');
divider();

// —— نظرة عامة ——
h2('1) نظرة عامة');
p(`معايير تقييم الأخصائي: ${criteria.criteria.length} (الإصدار ${criteria.version})`);
p(`أسئلة الفرز الأولي: ${screening.items.length} (الإصدار ${screening.version})`);
p(`أسئلة استبيان الأهل: ${parent.items.length} (الإصدار ${parent.version})`);
p(`عدد مجالات التقييم: ${(criteria.domains || []).length}`);
h3('مجالات التقييم الثمانية');
(criteria.domains || []).forEach((d, i) => bullet(`${i + 1}. ${d}`));
h3('تصنيفات النتيجة الإجمالية');
(criteria.classifications || []).forEach((c) => {
  bullet(`${c.label}: من ${c.min} إلى ${c.max}`);
});
divider();

// —— الفرز ——
h2('2) الفرز الأولي (12 سؤالاً)');
h3('مقياس الإجابة الموحّد');
(screening.likert || []).forEach((l) => bullet(`${l.value} — ${l.label}`));
p('كل سؤال يعرض 4 خيارات تصف طبيعة الطفل. الدرجة الأعلى = مؤشر حاجة دعم أكبر.');

const byDim = {};
(screening.items || []).forEach((it) => {
  if (!byDim[it.dimension]) byDim[it.dimension] = [];
  byDim[it.dimension].push(it);
});
for (const dim of Object.keys(byDim)) {
  h3(`بُعد: ${dimLabel[dim] || dim}`);
  for (const it of byDim[dim]) {
    p(`${it.id} — ${it.question || it.text}`, { bold: true });
    bullet(`الوزن: ${it.weight}`);
    (it.options || []).forEach((o) => {
      bullet(`${o.score} — ${o.label}: ${o.description}`);
    });
  }
}
divider();

// —— الأهل ——
h2('3) استبيان الأهل (20 سؤالاً)');
h3('مقياس الإجابة الموحّد');
(parent.scale || []).forEach((l) => bullet(`${l.value} — ${l.label}`));
for (const it of parent.items || []) {
  const mapped = critById[it.mappedCriterion];
  p(`${it.id} — ${it.question || it.text}`, { bold: true });
  bullet(`المجال: ${it.domain}`);
  bullet(
    `المعيار المقابل: ${it.mappedCriterion}${mapped ? ` — ${mapped.name}` : ''}`
  );
  (it.options || []).forEach((o) => {
    bullet(`${o.score} — ${o.label}: ${o.description}`);
  });
}
divider();

// —— معايير الأخصائي ——
h2('4) معايير تقييم الأخصائي (36 معياراً)');
p('مقياس كل معيار: 0 مستقر · 1 متوسط · 2 شديد · 3 شديد جداً');

const byDomain = {};
(criteria.criteria || []).forEach((c) => {
  if (!byDomain[c.domain]) byDomain[c.domain] = [];
  byDomain[c.domain].push(c);
});

for (const domain of criteria.domains || []) {
  const list = byDomain[domain] || [];
  h3(`مجال: ${domain} (${list.length} معايير)`);
  for (const c of list) {
    p(`${c.id} — ${c.name}`, { bold: true, size: 24 });
    bullet(`السؤال: ${c.question || c.description}`);
    bullet(`المجال بالإنجليزية: ${c.domain_en || '—'}`);
    bullet(`الوزن: ${c.weight}`);
    bullet(`الفئات العمرية: ${(c.ageBands || []).join('، ') || '—'}`);
    bullet('الاختيارات (وصف طبيعة الطفل):');
    const levels = c.levels || {};
    for (const k of Object.keys(levels).sort()) {
      const lv = levels[k];
      bullet(`${k} — ${lv.label}: ${lv.description}`);
    }
    bullet(`التوصية التربوية: ${c.recommendation || '—'}`);
  }
}
divider();

// —— فهرس ——
h2('5) فهرس سريع');
(criteria.criteria || []).forEach((c) => {
  bullet(
    `${c.id} | ${c.name} | ${c.domain} | ${(c.ageBands || []).join(' / ') || '—'}`
  );
});

const doc = new Document({
  creator: 'Taaluf Platform',
  title: 'تآلف — مرجع معايير وأسئلة التقييم',
  description: 'مرجع كامل للفرز واستبيان الأهل ومعايير الأخصائي',
  sections: [
    {
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children,
    },
  ],
});

const outDir = path.join(root, 'docs');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'TAALUF_ASSESSMENT_CRITERIA_FULL.docx');
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buffer);

// نسخة على سطح المكتب لسهولة الوصول
const desktopCopy = path.join(
  process.env.USERPROFILE || '',
  'OneDrive',
  'Desktop',
  'تآلف_مرجع_التقييم_الكامل.docx'
);
try {
  fs.copyFileSync(outPath, desktopCopy);
  console.log('DESKTOP', desktopCopy);
} catch {
  const alt = path.join(process.env.USERPROFILE || '', 'Desktop', 'تآلف_مرجع_التقييم_الكامل.docx');
  try {
    fs.copyFileSync(outPath, alt);
    console.log('DESKTOP', alt);
  } catch (e) {
    console.log('DESKTOP_COPY_SKIPPED', e.message);
  }
}

console.log(
  JSON.stringify({
    out: outPath,
    bytes: buffer.length,
    criteria: criteria.criteria.length,
    screening: screening.items.length,
    parent: parent.items.length,
  })
);
