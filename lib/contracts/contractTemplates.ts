/**
 * نماذج العقود والاتفاقيات السريرية والمالية — تآلف.
 */

export type ContractType = 'parent' | 'provider';

export type ContractClause = {
  id: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
};

export type ContractTemplate = {
  type: ContractType;
  version: string;
  titleAr: string;
  titleEn: string;
  preambleAr: string;
  preambleEn: string;
  clauses: ContractClause[];
  footerAr: string;
  footerEn: string;
};

export const CONTRACT_TEMPLATE_VERSION = '2026.1';

export const PARENT_AGREEMENT: ContractTemplate = {
  type: 'parent',
  version: CONTRACT_TEMPLATE_VERSION,
  titleAr: 'اتفاقية ولي الأمر — الخدمات السريرية والمالية',
  titleEn: 'Parent Agreement — Clinical & Financial Services',
  preambleAr:
    'يُبرم هذا العقد بين مركز تآلف للتأهيل والدعم النمائي («المركز») وولي أمر الطفل المسجّل، ويُعدّ قبولاً إلكترونياً أو ورقياً ملزماً قانونياً وفق قوانين سلطنة عمان.',
  preambleEn:
    'This agreement is entered into between Taaluf Rehabilitation Center ("the Center") and the registered child\'s parent/guardian. Electronic or paper acceptance is legally binding under the laws of the Sultanate of Oman.',
  clauses: [
    {
      id: 'services',
      titleAr: 'بنود الخدمة',
      titleEn: 'Service terms',
      bodyAr:
        'يلتزم المركز بتقديم: (1) التقييم النمائي الشامل، (2) إعداد وتتبع خطة تعليمية فردية (IEP)، (3) الغرفة الصفية المنزلية المساندة، (4) الجناح الحسي الثماني، (5) التقارير السريرية الدورية. يلتزم ولي الأمر بالمشاركة الفاعلة في الجلسات المنزلية وتطبيق التوصيات.',
      bodyEn:
        'The Center provides: (1) comprehensive developmental assessment, (2) IEP planning and tracking, (3) virtual home co-classroom, (4) eight sensory rooms, (5) periodic clinical reports. The parent commits to active participation in home sessions and implementing recommendations.',
    },
    {
      id: 'financial',
      titleAr: 'السياسة المالية',
      titleEn: 'Financial policy',
      bodyAr:
        'تُحدَّد الرسوم وفق باقة الاشتراك المعتمدة عند التسجيل. الدفع مسبق لكل دورة أو جلسة حسب الخطة. لا يُسترد مبلغ الجلسات المُنجَزة. يُسمح بتعليق الخدمة مؤقتاً بإخطار كتابي 7 أيام.',
      bodyEn:
        'Fees follow the approved subscription plan at registration. Payment is due in advance per cycle or session. Completed sessions are non-refundable. Service may be suspended with 7 days written notice.',
    },
    {
      id: 'cancellation',
      titleAr: 'سياسة الإلغاء والتعويض',
      titleEn: 'Cancellation & compensation',
      bodyAr:
        'إلغاء موعد قبل 24 ساعة: إعادة جدولة دون رسوم. إلغاء خلال 24 ساعة: قد تُخصم 50% من قيمة الجلسة. عدم الحضور دون إخطار: تُحسب الجلسة كاملة. في حال تأخر المركز: جلسة تعويضية مجانية أو استرداد كامل.',
      bodyEn:
        'Cancellation 24+ hours ahead: free reschedule. Within 24 hours: up to 50% session fee. No-show without notice: full session charge. Center delay: complimentary make-up session or full refund.',
    },
    {
      id: 'clinical_consent',
      titleAr: 'الموافقة السريرية',
      titleEn: 'Clinical consent',
      bodyAr:
        'أُقرّ بموافقتي على: جمع بيانات التقييم والملاحظات السلوكية، مشاركة الملخص السريري مع الأخصائي المعتمد، واستخدام الذكاء الاصطناعي المساعد في توليد التقارير (مع مراجعة بشرية). البيانات تُخزَّن وفق سياسة الخصوصية المعتمدة.',
      bodyEn:
        'I consent to: collecting assessment and behavioral data, sharing clinical summaries with assigned specialists, and AI-assisted report generation (with human review). Data is stored per the approved privacy policy.',
    },
    {
      id: 'sensory_rooms',
      titleAr: 'استخدام الغرف الحسية',
      titleEn: 'Sensory rooms usage',
      bodyAr:
        'أُقرّ بأن الغرف الحسية أداة تنظيم حسّي وليست بديلاً عن العلاج. يلتزم ولي الأمر بالإشراف على الطفل أثناء الجلسات، ضبط مدة الاستخدام (الحد الأقصى الموصى به 20 دقيقة)، وإيقاف الجلسة عند أي إزعاج أو فرط تحفيز.',
      bodyEn:
        'Sensory rooms are sensory regulation tools, not therapy substitutes. The parent supervises the child, respects recommended duration limits (max ~20 min), and stops sessions upon distress or overstimulation.',
    },
  ],
  footerAr:
    'بالتوقيع أدناه أُقرّ بقراءة جميع البنود والموافقة عليها. نسخة إلكترونية أو ورقية موقّعة تُعتبر سارية المفعول.',
  footerEn:
    'By signing below I confirm reading and accepting all clauses. An signed electronic or paper copy is valid.',
};

export const PROVIDER_AGREEMENT: ContractTemplate = {
  type: 'provider',
  version: CONTRACT_TEMPLATE_VERSION,
  titleAr: 'اتفاقية مقدم الخدمة — أخصائي / معلم / طبيب',
  titleEn: 'Provider Agreement — Specialist / Teacher / Physician',
  preambleAr:
    'يُبرم هذا العقد بين مركز تآلف ومقدم الخدمة السريرية المعتمد، ويحدّد التزامات التقديم والتوثيق والسرية وآلية المستحقات.',
  preambleEn:
    'This agreement is between Taaluf Center and an approved clinical service provider, defining delivery, documentation, confidentiality, and compensation.',
  clauses: [
    {
      id: 'delivery',
      titleAr: 'تقديم الجلسات',
      titleEn: 'Session delivery',
      bodyAr:
        'يلتزم مقدم الخدمة بتقديم الجلسات وفق المعايير السريرية المعتمدة، تسجيل المحاولات والتلميحات، وتحديث خطة الطفل الفردية بعد كل دورة. يُحظر تقديم تشخيص طبي نهائي دون اعتماد مشرف.',
      bodyEn:
        'The provider delivers sessions per approved clinical standards, records trials and prompts, and updates the child IEP after each cycle. Final medical diagnosis requires supervisor approval.',
    },
    {
      id: 'documentation',
      titleAr: 'شرط التوثيق السريري',
      titleEn: 'Clinical documentation requirement',
      bodyAr:
        'لا تُعتمد المستحقات المالية إلا بعد: (1) إكمال سجل الجلسة في المنصة، (2) توثيق 80% على الأقل من المحاولات، (3) اعتماد التقرير الدوري من المشرف العام. التأخر في التوثيق يُعلّق الصرف.',
      bodyEn:
        'Payment is approved only after: (1) session record completed on platform, (2) ≥80% trials documented, (3) periodic report approved by super admin. Late documentation suspends payout.',
    },
    {
      id: 'confidentiality',
      titleAr: 'سرية بيانات الحالات',
      titleEn: 'Case confidentiality',
      bodyAr:
        'يُحظر مشاركة بيانات الأطفال أو التقارير خارج المنصة دون موافقة كتابية. يُمنع التصوير أو التسجيل دون موافقة ولي الأمر. أي خرق يُعرّض العقد للإنهاء الفوري والمساءلة القانونية.',
      bodyEn:
        'Sharing child data or reports outside the platform is prohibited without written consent. Recording without parent approval is forbidden. Breach may result in immediate termination and legal action.',
    },
    {
      id: 'compensation',
      titleAr: 'آلية احتساب المستحقات',
      titleEn: 'Compensation mechanism',
      bodyAr:
        'تُحسب المستحقات إما بنسبة مئوية من قيمة الجلسة (60–75% حسب التخصص) أو مبلغ مقطوع لكل جلسة معتمدة. تُصرف المبالغ خلال 15 يوم عمل من اعتماد التوثيق السريري. يُخصم 10% عند عدم إكمال التوثيق في 48 ساعة.',
      bodyEn:
        'Compensation is either a percentage of session value (60–75% by specialty) or a flat fee per approved session. Payout within 15 business days of clinical documentation approval. 10% deduction if documentation incomplete within 48 hours.',
    },
  ],
  footerAr:
    'بالتوقيع أُقرّ بالالتزام بجميع البنود وسرية البيانات. نسخة موقّعة إلكترونياً أو ورقياً سارية.',
  footerEn:
    'By signing I commit to all terms and data confidentiality. Signed electronic or paper copy is valid.',
};

export function getContractTemplate(type: ContractType): ContractTemplate {
  return type === 'parent' ? PARENT_AGREEMENT : PROVIDER_AGREEMENT;
}

export function formatContractForDisplay(
  template: ContractTemplate,
  isAr: boolean,
  meta?: { childName?: string; providerName?: string; childId?: string }
) {
  const preamble = isAr ? template.preambleAr : template.preambleEn;
  const metaLine = meta?.childName
    ? isAr
      ? `الطفل: ${meta.childName}${meta.childId ? ` · الملف: ${meta.childId}` : ''}`
      : `Child: ${meta.childName}${meta.childId ? ` · File: ${meta.childId}` : ''}`
    : meta?.providerName
      ? isAr
        ? `مقدم الخدمة: ${meta.providerName}`
        : `Provider: ${meta.providerName}`
      : '';

  return {
    title: isAr ? template.titleAr : template.titleEn,
    preamble,
    metaLine,
    clauses: template.clauses.map((c) => ({
      id: c.id,
      title: isAr ? c.titleAr : c.titleEn,
      body: isAr ? c.bodyAr : c.bodyEn,
    })),
    footer: isAr ? template.footerAr : template.footerEn,
    version: template.version,
  };
}
