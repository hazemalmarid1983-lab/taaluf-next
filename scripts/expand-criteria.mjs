import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '..', 'data', 'taalof_criteria.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const allBands = ['3-4', '5-6', '7-9', '10-12'];
const academicBands = ['5-6', '7-9', '10-12'];
const earlyBands = ['3-4', '5-6'];

function bandsFor(id) {
  if (['C20', 'C21', 'C22'].includes(id)) return academicBands;
  if (['C32', 'C33', 'C34', 'C35', 'C36'].includes(id)) return earlyBands;
  if (id === 'C31') return ['3-4', '5-6', '7-9'];
  return allBands;
}

function L(a, b, c, d) {
  return {
    '0': { label: 'مستقر', description: a },
    '1': { label: 'متوسط', description: b },
    '2': { label: 'شديد', description: c },
    '3': { label: 'شديد جداً', description: d },
  };
}

// Remove any previously appended C25+ then rebuild ageBands
data.criteria = data.criteria
  .filter((c) => {
    const n = Number(String(c.id).replace(/^C/, ''));
    return n <= 24;
  })
  .map((c) => ({
    ...c,
    ageBands: bandsFor(c.id),
  }));

const news = [
  {
    id: 'C25',
    name: 'فرط الحركة والاندفاعية',
    domain: 'التربية الخاصة',
    domain_en: 'Special Education',
    description:
      'مدى قدرة الطفل على تنظيم الحركة والتحكم في الاندفاعية في مواقف التعلم واللعب',
    levels: L(
      'يتحكم في حركته ويندمج بهدوء',
      'نشاط حركي زائد أحياناً مع قدرة على التنظيم',
      'فرط حركة واضح يشتت الانتباه ويصعب التحكم',
      'حركة دائمة واندفاعية شديدة تعيق التعلم والتفاعل'
    ),
    recommendation:
      'يُوصى ببرنامج تربوي يدعم تنظيم الحركة + استراتيجيات تعديل السلوك في البيئة التعليمية',
    weight: 1.2,
    ageBands: allBands,
  },
  {
    id: 'C26',
    name: 'السلوكيات الإيذائية الذاتية',
    domain: 'النفسية',
    domain_en: 'Psychological',
    description:
      'وجود سلوكيات إيذاء النفس مثل الضرب أو الخدش أو العض الموجه نحو الذات',
    levels: L(
      'لا توجد سلوكيات إيذائية',
      'نادراً في حالات الإحباط الشديد',
      'تكرر عند الضغط أو التغيير',
      'يومي ومتكرر قد يسبب أذى'
    ),
    recommendation:
      'يُنصح بوضع خطة دعم سلوكي تربوي + تدريب الأهل على استراتيجيات التدخل الإيجابي',
    weight: 1.5,
    ageBands: allBands,
  },
  {
    id: 'C27',
    name: 'اضطرابات النوم',
    domain: 'التكيف',
    domain_en: 'Adaptive',
    description: 'جودة وانتظام النوم لدى الطفل',
    levels: L(
      'ينام بانتظام',
      'صعوبة أحياناً في النوم',
      'نوم غير منتظم ومتقطع',
      'أرق شديد يؤثر على النهار'
    ),
    recommendation:
      'يُقترح روتين نوم تربوي منظم + استراتيجيات بيئية لتحسين بيئة النوم',
    weight: 1.0,
    ageBands: allBands,
  },
  {
    id: 'C28',
    name: 'الانتقائية الغذائية',
    domain: 'الوظيفية',
    domain_en: 'Functional',
    description:
      'مدى تنوع الأطعمة التي يقبلها الطفل ومرونته في تجربة أطعمة جديدة',
    levels: L(
      'يتقبل أنواعاً متنوعة',
      'ينتقي بعض الأطعمة',
      'محدود في أنواع قليلة',
      'يرفض معظم الأطعمة'
    ),
    recommendation:
      'يُوصى ببرنامج تعريض غذائي تدريجي تحت إشراف أخصائي التغذية التربوية',
    weight: 1.0,
    ageBands: allBands,
  },
  {
    id: 'C29',
    name: 'الالتزام بالروتين والانزعاج من التغيير',
    domain: 'السلوك المقيد',
    domain_en: 'Restricted Behavior',
    description: 'مدى حاجة الطفل للروتين الثابت وانزعاجه من التغييرات',
    levels: L(
      'يتكيف مع التغيير',
      'يفضل الروتين لكنه يتكيف',
      'ينزعج كثيراً من التغيير',
      'يصاب بانهيار عند أي تغيير'
    ),
    recommendation:
      'يُقترح جدول بصري يومي + تدريب على المرونة المعرفية بشكل تربوي',
    weight: 1.1,
    ageBands: allBands,
  },
  {
    id: 'C30',
    name: 'الاهتمامات المكثفة المحددة',
    domain: 'السلوك المقيد',
    domain_en: 'Restricted Behavior',
    description: 'وجود اهتمامات شديدة ومحددة تستحوذ على انتباه الطفل',
    levels: L(
      'اهتمامات متنوعة',
      'اهتمام قوي بأشياء محددة',
      'اهتمام مكثف يعيق التفاعل',
      'انشغال كامل باهتمام واحد'
    ),
    recommendation:
      'يُوصى بتوظيف الاهتمامات في أنشطة تعليمية + توسيع دائرة الاهتمامات تدريجياً',
    weight: 1.0,
    ageBands: allBands,
  },
  {
    id: 'C31',
    name: 'تكرار العبارات أو الكلمات (Echolalia)',
    domain: 'النطق والتخاطب',
    domain_en: 'Speech',
    description:
      'تكرار الطفل لعبارات أو كلمات سمعها بدلاً من استخدامها تواصلياً',
    levels: L(
      'يستخدم اللغة تواصلياً',
      'يكرر أحياناً',
      'تكرار متكرر',
      'معظم تواصله تكرار'
    ),
    recommendation: 'يُنصح بجلسات تخاطب تربوية لتطوير التواصل الوظيفي',
    weight: 1.0,
    ageBands: ['3-4', '5-6', '7-9'],
  },
  {
    id: 'C32',
    name: 'تمييز الأشكال والألوان',
    domain: 'الأكاديمي',
    domain_en: 'Academic',
    description: 'قدرة الطفل على تمييز الأشكال الأساسية والألوان ومطابقتها',
    levels: L(
      'يميز ويطابق بشكل صحيح',
      'يميز بعضها',
      'صعوبة في التمييز',
      'لا يميز الأشكال أو الألوان'
    ),
    recommendation:
      'يُقترح أنشطة مطابقة وتصنيف تربوية لتعزيز المهارات قبل الأكاديمية',
    weight: 1.0,
    ageBands: earlyBands,
  },
  {
    id: 'C33',
    name: 'مطابقة وتصنيف',
    domain: 'الأكاديمي',
    domain_en: 'Academic',
    description: 'قدرة الطفل على مطابقة الأشياء المتشابهة وتصنيفها حسب الفئة',
    levels: L(
      'يطابق ويصنف بسهولة',
      'يطابق بعض الفئات',
      'صعوبة في التصنيف',
      'لا يطابق أو يصنف'
    ),
    recommendation:
      'يُوصى بألعاب تعليمية للمطابقة والتصنيف كأساس للمهارات المعرفية',
    weight: 1.0,
    ageBands: earlyBands,
  },
  {
    id: 'C34',
    name: 'عد ومعرفة الأرقام',
    domain: 'الأكاديمي',
    domain_en: 'Academic',
    description: 'قدرة الطفل على عد الأشياء ومعرفة الأرقام الأساسية',
    levels: L(
      'يعد ويعرف الأرقام',
      'يعد حتى 5-10',
      'يعرف بعض الأرقام',
      'لا يعرف الأرقام'
    ),
    recommendation: 'يُقترح أنشطة عدّ تربوية باستخدام أشياء ملموسة',
    weight: 1.0,
    ageBands: earlyBands,
  },
  {
    id: 'C35',
    name: 'الأكل المستقل',
    domain: 'التكيف',
    domain_en: 'Adaptive',
    description: 'قدرة الطفل على تناول الطعام بشكل مستقل دون مساعدة',
    levels: L(
      'يأكل بمفرده',
      'يحتاج مساعدة قليلة',
      'يحتاج مساعدة كثيرة',
      'معتمد كلياً على الغير'
    ),
    recommendation:
      'يُوصى ببرنامج تدريب على المهارات اليومية في بيئة تعليمية منظمة',
    weight: 1.0,
    ageBands: earlyBands,
  },
  {
    id: 'C36',
    name: 'استخدام الحمام بشكل مستقل',
    domain: 'التكيف',
    domain_en: 'Adaptive',
    description:
      'قدرة الطفل على استخدام الحمام والاهتمام بالنظافة الشخصية بشكل مستقل',
    levels: L(
      'يستخدم الحمام بمفرده',
      'يحتاج تذكيراً أحياناً',
      'يحتاج مساعدة مستمرة',
      'غير قادر على الاستقلالية'
    ),
    recommendation: 'يُقترح روتين تدريجي على استخدام الحمام بدعم تربوي',
    weight: 1.0,
    ageBands: earlyBands,
  },
];

data.criteria.push(...news);
data.total_criteria = data.criteria.length;
data.version = '2.1';
fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('OK', data.total_criteria, data.criteria.map((c) => c.id).join(','));
