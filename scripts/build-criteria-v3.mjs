/**
 * يبني data/taalof_criteria_v3.json من البنك الحالي + إثراء Canon 3.0
 * ثم يزامن data/taalof_criteria.json ليبقى مصدر التشغيل.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = JSON.parse(
  fs.readFileSync(path.join(root, 'data/taalof_criteria.json'), 'utf8')
);
const geminiPath = path.join(
  process.env.USERPROFILE || '',
  'OneDrive/Desktop/كودات منصة تآلف/gemini-code-1786681225770.json'
);

const AGE_BAND_LABELS = {
  '3-4': { ar: 'نبت', en: 'sprout', months: '36–59' },
  '5-6': { ar: 'شتلة', en: 'seedling', months: '60–83' },
  '7-9': { ar: 'ثمرة', en: 'fruit', months: '84–119' },
  '10-12': { ar: 'نضج', en: 'ripeness', months: '120–155' },
};

const ALL_BANDS = ['3-4', '5-6', '7-9', '10-12'];

const AUTO_GOALS = {
  C1: 'أن ينفذ الطفل التوجيهات اللفظية المباشرة المكونة من خطوة واحدة بوجود حث إشاري خفيف بنسبة نجاح 80% خلال 3 أشهر.',
  C2: 'أن ينتقل الطفل بين نشاطين بعد إشارة بصرية أو مؤقت، دون نوبة غضب، في 4 من أصل 5 محاولات خلال 8 أسابيع.',
  C3: 'أن تنخفض مدة الحركات النمطية المعيقة خلال جلسة 15 دقيقة بنسبة 50% عبر إعادة التوجيه الحركي خلال 8 أسابيع.',
  C4: 'أن يبادر الطفل بتفاعل قصير مع قرين (نظر أو مشاركة أداة) مرة واحدة على الأقل في كل جلسة لعب خلال 3 أشهر.',
  C5: 'أن يحدد الطفل المجسمات أو الصور المطلوبة منه شفهياً من بين 3 خيارات بنسبة نجاح 80% خلال 3 أشهر.',
  C6: 'أن يطلب الطفل احتياجاً واحداً بكلمة أو جملة قصيرة وظيفية في 4 من أصل 5 فرص خلال 3 أشهر.',
  C7: 'أن يستخدم الطفل عبارة اجتماعية مناسبة (مثل شكراً أو دوري) في موقفين يوميين بنسبة 80% خلال 8 أسابيع.',
  C8: 'أن يستجيب الطفل لاستراتيجية تهدئة شفهية بتخفيض التوتر خلال دقيقة واحدة عند المنع بنسبة 80%.',
  C9: 'أن يبقى الطفل منتبهاً لمهمة مفضلة لمدة 5 دقائق متصلة دون نهوض، في 4 من أصل 5 محاولات خلال 8 أسابيع.',
  C10: 'أن يدخل الطفل موقفاً جديداً بعد قصة اجتماعية قصيرة ويبقى دقيقتين دون انسحاب في 3 من أصل 4 فرص خلال 8 أسابيع.',
  C11: 'أن يمثّل الطفل دوراً تخيلياً واحداً (إطعام دمية أو قيادة سيارة) لمدة دقيقتين في 4 جلسات من أصل 5 خلال 8 أسابيع.',
  C12: 'أن يتقبل الطفل البقاء في البيئة بوجود أصوات بيئية عادية أو خامات لمسية جديدة لمدة 3 دقائق دون انسحاب حسي.',
  C13: 'أن يمسك الطفل قلماً أو ملقطاً ويكمل 5 التقاطات/خطوط قصيرة بنسبة نجاح 80% خلال 8 أسابيع.',
  C14: 'أن يصعد الطفل 4 درجات أو يقفز في المكان 5 مرات بتوازن مقبول في 4 من أصل 5 محاولات خلال 8 أسابيع.',
  C15: 'أن يحافظ الطفل على التواصل البصري لمدة 3 ثوانٍ عند تقديم الطلب أو المناداة بنسبة نجاح 80%.',
  C16: 'أن يستجيب الطفل بالالتفات أو الابتسام عند مناداة اسمه في 4 من أصل 5 محاولات خلال 8 أسابيع.',
  C17: 'أن يسمي الطفل شعورين (فرح/حزن) من صورة أو موقف بنسبة نجاح 80% خلال 8 أسابيع.',
  C18: 'أن يتقبل الطفل الانتقال بين نشاطين مختلفين بناءً على الجدول البصري دون نوبات غضب في 4 من أصل 5 محاولات.',
  C19: 'أن يقبل الطفل نشاطاً بديلاً لمدة 3 دقائق بعد اهتمامه المفضل، 3 مرات أسبوعياً خلال 8 أسابيع.',
  C20: 'أن يقرأ الطفل أو يميز 10 كلمات/حروف مستهدفة بنسبة نجاح 80% خلال 3 أشهر (بما يناسب فئته العمرية).',
  C21: 'أن ينسخ الطفل 5 حروف أو أشكال بخط مقروء بنسبة نجاح 80% خلال 8 أسابيع.',
  C22: 'أن يجمع أو يطرح الطفل حتى 5 باستخدام أشياء ملموسة بنسبة نجاح 80% خلال 8 أسابيع.',
  C23: 'أن ينجز الطفل خطوة واحدة مستقلة من روتين اللبس أو النظافة يومياً بنسبة 80% خلال 8 أسابيع.',
  C24: 'أن يتوقف الطفل عند إشارة «قف» قبل عبور أو لمس خطر في 4 من أصل 5 تدريبات خلال 8 أسابيع.',
  C25: 'أن يجلس الطفل لمهمة قصيرة 4 دقائق مع حركة مسموحة منظمة، في 4 من أصل 5 جلسات خلال 8 أسابيع.',
  C26: 'أن تنخفض نوبات إيذاء الذات المسجّلة أسبوعياً بنسبة 50% عبر خطة دعم سلوكي إيجابي خلال 8 أسابيع.',
  C27: 'أن يلتزم الطفل بروتين نوم ثابت (تهيئة 20 دقيقة ثم سرير) 5 ليالٍ من أصل 7 خلال 8 أسابيع.',
  C28: 'أن يتقبل الطفل تذوّق طعام جديد واحد مرتين أسبوعياً دون رفض حاد خلال 8 أسابيع.',
  C29: 'أن يتقبل الطفل تغييراً معلناً مسبقاً في خطوة واحدة من الروتين 4 مرات من أصل 5 خلال 8 أسابيع.',
  C30: 'أن ينهي الطفل الاهتمام المكثف وينتقل لنشاط آخر بعد مؤقت بصري في 4 من أصل 5 فرص خلال 8 أسابيع.',
  C31: 'أن يستخدم الطفل جملة وظيفية قصيرة بدلاً من الصدى في 3 طلبات يومية بنسبة 80% خلال 3 أشهر.',
  C32: 'أن يحدد ويسمي الطفل 4 ألوان أساسية وشكلين هندسيين بشكل مستقل بنسبة نجاح 80%.',
  C33: 'أن يطابق الطفل 5 أزواج متشابهة ويصنّف مجموعة واحدة حسب اللون أو الشكل بنسبة 80% خلال 8 أسابيع.',
  C34: 'أن يعدّ الطفل حتى 10 مع الإشارة للأشياء بنسبة نجاح 80% خلال 8 أسابيع.',
  C35: 'أن يتناول الطفل 10 ملاعق باستقلال باستخدام أداة مناسبة في 4 وجبات من أصل 5 خلال 8 أسابيع.',
  C36: 'أن يعبر الطفل عن حاجته لدخول الحمام بكلمة أو رمز قبل التبول بنسبة نجاح 80% خلال 3 أشهر.',
};

function stripLevelPrefix(text) {
  return String(text || '').replace(
    /^(مستقر|متوسط|شديد جداً|شديد)\s*[:：]\s*/,
    ''
  );
}

const overlayById = {};
if (fs.existsSync(geminiPath)) {
  const samples = JSON.parse(fs.readFileSync(geminiPath, 'utf8'));
  for (const row of samples) overlayById[row.id] = row;
}

const criteria = src.criteria.map((c) => {
  const ov = overlayById[c.id];
  const levels = { ...c.levels };
  if (ov?.descriptions) {
    for (const key of ['0', '1', '2', '3']) {
      const raw = ov.descriptions[key];
      if (!raw) continue;
      levels[key] = {
        label: levels[key]?.label || ['مستقر', 'متوسط', 'شديد', 'شديد جداً'][Number(key)],
        description: stripLevelPrefix(raw),
      };
    }
  }

  const recommendation = ov?.referralRecommendation || c.recommendation;
  return {
    id: c.id,
    name: ov?.title || c.name,
    title: ov?.title || c.name,
    domain: c.domain,
    domain_en: c.domain_en,
    domain_raw: c.domain_raw,
    question: c.question,
    description: c.question || c.description,
    levels,
    autoGoal: AUTO_GOALS[c.id] || ov?.autoGoal || recommendation,
    recommendation,
    referralRecommendation: recommendation,
    weight: c.weight,
    is_reverse: Boolean(c.is_reverse),
    ageBands: ALL_BANDS,
  };
});

const out = {
  version: '3.0-unified',
  platform: 'تآلف',
  total_criteria: criteria.length,
  ageBandLabels: AGE_BAND_LABELS,
  domains: src.domains,
  classifications: src.classifications,
  criteria,
};

const v3Path = path.join(root, 'data/taalof_criteria_v3.json');
const livePath = path.join(root, 'data/taalof_criteria.json');
const json = JSON.stringify(out, null, 2) + '\n';
fs.writeFileSync(v3Path, json);
fs.writeFileSync(livePath, json);
console.log(
  'Wrote',
  criteria.length,
  'criteria to taalof_criteria_v3.json and taalof_criteria.json; overlays',
  Object.keys(overlayById).length
);
