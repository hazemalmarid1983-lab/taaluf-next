/**
 * يولّد lib/data/autismToolsBank.ts من ملف بنك الوسائل (xlsx).
 *
 * الاستيراد خطوتان:
 *   1) powershell -File scripts/read-xlsx.ps1 -Path "<الملف>.xlsx" -OutJson "$env:TEMP\toolsbank.json"
 *   2) npx tsx scripts/generate-tools-bank.ts "$env:TEMP\toolsbank.json"
 *
 * لا تُحرّر الملف المولّد يدوياً — عدّل هذا السكربت أو ملف الإكسل ثم أعد التوليد.
 */

import fs from 'node:fs';
import path from 'node:path';

const EXPECTED_TOOL_COUNT = 184;

/**
 * وصف كل مجال نمائي: يُربط باسم ورقة الإكسل.
 * التسميات الإنجليزية والرموز مُصاغة هنا لأن الملف المصدر عربي فقط.
 */
const DOMAIN_META: Array<{
  sheet: string;
  id: string;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
  emoji: string;
}> = [
  {
    sheet: 'التواصل واللغة',
    id: 'communication',
    labelAr: 'مهارات التواصل واللغة',
    labelEn: 'Communication & language',
    descriptionAr: 'تطوير مهارات التعبير والاستيعاب اللغوي والتواصل البديل',
    descriptionEn: 'Expressive and receptive language, and augmentative communication',
    emoji: '🗣️',
  },
  {
    sheet: 'المهارات الاجتماعية',
    id: 'social',
    labelAr: 'المهارات الاجتماعية',
    labelEn: 'Social skills',
    descriptionAr: 'التفاعل الاجتماعي، فهم العلاقات، واللعب التعاوني',
    descriptionEn: 'Social interaction, understanding relationships, and cooperative play',
    emoji: '🤝',
  },
  {
    sheet: 'المهارات الأكاديمية',
    id: 'academic',
    labelAr: 'المهارات الأكاديمية',
    labelEn: 'Academic skills',
    descriptionAr: 'القراءة والكتابة والرياضيات والعلوم والمعرفة',
    descriptionEn: 'Reading, writing, mathematics, science, and general knowledge',
    emoji: '📚',
  },
  {
    sheet: 'المهارات الحياتية',
    id: 'life_skills',
    labelAr: 'المهارات الحياتية والاستقلالية',
    labelEn: 'Life skills & independence',
    descriptionAr: 'العناية الشخصية والاستقلال في الحياة اليومية',
    descriptionEn: 'Self-care and independence in daily living',
    emoji: '🧺',
  },
  {
    sheet: 'المهارات الحركية',
    id: 'motor',
    labelAr: 'المهارات الحركية',
    labelEn: 'Motor skills',
    descriptionAr: 'الحركات الدقيقة والكبيرة والتنسيق',
    descriptionEn: 'Fine and gross motor movement and coordination',
    emoji: '🤸',
  },
  {
    sheet: 'العاطفي والسلوكي',
    id: 'emotional_behavioral',
    labelAr: 'المهارات العاطفية والسلوكية',
    labelEn: 'Emotional & behavioural skills',
    descriptionAr: 'التنظيم العاطفي، إدارة السلوك، والمهارات التكيفية',
    descriptionEn: 'Emotional regulation, behaviour management, and adaptive skills',
    emoji: '💚',
  },
  {
    sheet: 'الاستشعاريات',
    id: 'sensory',
    labelAr: 'الاستشعاريات والتكيف الحسي',
    labelEn: 'Sensory regulation',
    descriptionAr: 'التكيف مع المداخل الحسية والتنظيم الحسي',
    descriptionEn: 'Adapting to sensory input and sensory regulation',
    emoji: '🌈',
  },
  {
    sheet: 'الترفيه والتواصل البصري',
    id: 'recreation',
    labelAr: 'الترفيه والتواصل البصري',
    labelEn: 'Arts, music & play',
    descriptionAr: 'الفنون والموسيقى والألعاب التفاعلية',
    descriptionEn: 'Arts, music, and interactive games',
    emoji: '🎨',
  },
];

/** تصحيحات لأخطاء إدخال في الملف المصدر */
const CORRECTIONS: Array<[RegExp, string]> = [
  [/الاجتمocialية/g, 'الاجتماعية'],
  [/\bgood Karma Apps\b/g, 'Good Karma Apps'],
];

function clean(raw: unknown) {
  let value = String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  CORRECTIONS.forEach(([pattern, replacement]) => {
    value = value.replace(pattern, replacement);
  });
  return value;
}

function quote(value: string) {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

type Row = string[];

function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    throw new Error('حدّد مسار ملف JSON الناتج من read-xlsx.ps1');
  }

  const book = JSON.parse(
    fs.readFileSync(jsonPath, 'utf8').replace(/^\uFEFF/, '')
  ) as Record<string, Row[]>;

  const tools: Array<Record<string, string>> = [];

  DOMAIN_META.forEach((domain) => {
    const rows = book[domain.sheet];
    if (!rows) throw new Error(`ورقة مفقودة: ${domain.sheet}`);

    let category = '';
    let counter = 0;

    rows.forEach((row) => {
      const first = clean(row[0]);
      const filled = row.filter((cell) => clean(cell) !== '').length;

      // صف ترويسة الجدول
      if (first === 'م') return;
      // صف عنوان هدف: خلية واحدة بصيغة «الهدف 3: ...»
      if (filled <= 1) {
        const match = first.match(/^الهدف\s*\d+\s*[:：]\s*(.+)$/);
        if (match) category = clean(match[1]);
        return;
      }
      // صفوف البيانات مرقّمة
      if (!/^\d+$/.test(first)) return;

      counter += 1;
      tools.push({
        id: `${domain.id}_${String(counter).padStart(2, '0')}`,
        domain: domain.id,
        goalCategory: category,
        goal: clean(row[1]),
        toolName: clean(row[2]),
        toolType: clean(row[3]),
        platform: clean(row[4]),
        targetAge: clean(row[5]),
        level: clean(row[6]),
        description: clean(row[7]),
        linkOrKeywords: clean(row[8]),
        notes: clean(row[9]),
      });
    });

    console.log(`${domain.labelAr}: ${counter}`);
  });

  if (tools.length !== EXPECTED_TOOL_COUNT) {
    throw new Error(
      `عدد الوسائل ${tools.length} لا يطابق المتوقع ${EXPECTED_TOOL_COUNT}`
    );
  }

  const missing = tools.filter(
    (tool) => !tool.toolName || !tool.goal || !tool.goalCategory
  );
  if (missing.length) {
    throw new Error(`سجلات ناقصة: ${missing.map((t) => t.id).join(', ')}`);
  }

  const domainIds = DOMAIN_META.map((d) => `  | '${d.id}'`).join('\n');

  const domainEntries = DOMAIN_META.map(
    (d) => `  {
    id: '${d.id}',
    labelAr: ${quote(d.labelAr)},
    labelEn: ${quote(d.labelEn)},
    descriptionAr: ${quote(d.descriptionAr)},
    descriptionEn: ${quote(d.descriptionEn)},
    emoji: '${d.emoji}',
  },`
  ).join('\n');

  const toolEntries = tools
    .map(
      (tool) => `  {
    id: '${tool.id}',
    domain: '${tool.domain}',
    goalCategory: ${quote(tool.goalCategory)},
    goal: ${quote(tool.goal)},
    toolName: ${quote(tool.toolName)},
    toolType: ${quote(tool.toolType)},
    platform: ${quote(tool.platform)},
    targetAge: ${quote(tool.targetAge)},
    level: ${quote(tool.level)},
    description: ${quote(tool.description)},
    linkOrKeywords: ${quote(tool.linkOrKeywords)},
    notes: ${quote(tool.notes)},
  },`
    )
    .join('\n');

  const output = `/**
 * بنك الوسائل التعليمية الإلكترونية لأطفال التوحد — ${tools.length} وسيلة في ${DOMAIN_META.length} مجالات نمائية.
 *
 * ⚠️ ملف مولّد آلياً بواسطة scripts/generate-tools-bank.ts — لا تُحرّره يدوياً.
 * النصوص عربية كما وردت في المصدر؛ التسميات الإنجليزية للمجالات فقط لواجهة المنصة.
 * الوسائل مراجع مساندة لأولياء الأمور والمختصين، وليست بديلاً عن الخطة العلاجية.
 */

import { ARABIC_NATIVE_TOOLS } from './arabicNativeTools';
import {
  classifyLanguageSupport,
  type LanguageSupport,
} from './toolLanguage';

export type { LanguageSupport };

export type AutismToolDomainId =
${domainIds};

export interface AutismToolDomain {
  id: AutismToolDomainId;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
  emoji: string;
}

export interface AutismTool {
  id: string;
  domain: AutismToolDomainId;
  /** عنوان مجموعة الأهداف في المصدر، مثل «تطوير مهارات المحادثة» */
  goalCategory: string;
  /** الهدف التعليمي المختصر للوسيلة */
  goal: string;
  toolName: string;
  /** تطبيق | موقع | لعبة | كتاب… كما ورد في المصدر */
  toolType: string;
  platform: string;
  targetAge: string;
  level: string;
  description: string;
  /** نطاق الموقع إن وُجد، وإلا كلمات مفتاحية للبحث عن الوسيلة */
  linkOrKeywords: string;
  notes: string;
  /** ar يدعم العربية | bilingual ثنائي اللغة | en إنجليزي فقط */
  languageSupport: LanguageSupport;
}

export const AUTISM_TOOL_DOMAINS: AutismToolDomain[] = [
${domainEntries}
];

const RAW_AUTISM_TOOLS: Array<Omit<AutismTool, 'languageSupport'>> = [
${toolEntries}
];

export const AUTISM_TOOLS_BANK: AutismTool[] = [
  ...RAW_AUTISM_TOOLS.map((tool) => ({
    ...tool,
    languageSupport: classifyLanguageSupport(tool),
  })),
  ...ARABIC_NATIVE_TOOLS,
];
`;

  const target = path.join(process.cwd(), 'lib', 'data', 'autismToolsBank.ts');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, output, 'utf8');
  console.log(`\n✓ ${tools.length} وسيلة → ${path.relative(process.cwd(), target)}`);
}

main();
