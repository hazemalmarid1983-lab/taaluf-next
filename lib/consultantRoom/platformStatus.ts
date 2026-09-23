import { isLearningDifficultiesEnabled } from '@/lib/featureFlags';
import type { PlatformStatusItem } from '@/lib/consultantRoom/types';

/** حالة المنصة — مستندة على ما هو مطبّق فعلياً في الكود */
export function getPlatformStatusItems(): readonly PlatformStatusItem[] {
  const ldEnabled = isLearningDifficultiesEnabled();

  return [
    {
      id: 'screening',
      labelAr: 'الفرز والتوجيه المبكر',
      level: 'implemented',
      noteAr: '١٢ سؤالاً عبر ٤ أبعاد — مسار /dashboard/screening',
    },
    {
      id: 'assessment-canon',
      labelAr: 'التقييم الشامل — Canon 4.0-unified',
      level: 'partial',
      noteAr:
        '٤٠ مؤشراً موزّعة على ٤ محاور كبرى، بمقياس ٠–٣. ويُفعَّل عدد المؤشرات في الجلسة وفق شريحة العمر (٣٩ أو ٤٠). مطبّق تشغيلياً — المراجعة العلمية للصياغة والمنهجية مستمرة.',
    },
    {
      id: 'assessment-c35-c40-pending',
      labelAr: 'C35–C40 — معايير تشغيلية بانتظار المنهجية والمراجعة',
      level: 'needs_review',
      noteAr:
        'مُعرّفة ضمن التقييم التشغيلي الحالي، لكنها لم تدخل بعد في المنهجية التفصيلية أو بنك مراجعة المستشار. يحتاج نطاق مراجعتها إلى قرار علمي.',
    },
    {
      id: 'fusion',
      labelAr: 'دمج المصادر والتقارير',
      level: 'needs_review',
      noteAr: 'أوزان الدمج (مختص + أهل + ألعاب) — يحتاج مراجعة منهجية',
    },
    {
      id: 'goals-iep',
      labelAr: 'الأهداف وخطط IEP',
      level: 'implemented',
      noteAr: 'توليد SMART من البنود ≥٢ — /dashboard/goals',
    },
    {
      id: 'training',
      labelAr: 'منظومة التدريب',
      level: 'partial',
      noteAr: 'أنشطة انتباه وتركيز وخطط تدريب — التوسع مستمر',
    },
    {
      id: 'training-c11',
      labelAr: 'C11 — الانتباه المشترك (تدريب)',
      level: 'needs_review',
      noteAr:
        'Implemented — Scientific Review Pending: يوجد تنفيذ تدريبي، لكن الحالة العلمية بانتظار المراجعة؛ لا يُفسَّر النشاط الرقمي كإتقان مباشر للانتباه المشترك.',
    },
    {
      id: 'training-c25',
      labelAr: 'C25 — الانتباه والتركيز في المهمة (تدريب)',
      level: 'needs_review',
      noteAr:
        'Implemented — Scientific Review Pending: يوجد تنفيذ تدريبي، لكن الحالة العلمية بانتظار المراجعة؛ الأنشطة الحالية مرشّحة تدريب مقترحة وليست تغطية معتمدة علميًا.',
    },
    {
      id: 'training-c26',
      labelAr: 'C26 — goalLinks (بيانات تربوية)',
      level: 'needs_review',
      noteAr:
        'Pedagogical metadata — not structural training coverage: goalLinks وصفية تربوية فقط ولا تمثل تغطية تدريبية هيكلية.',
    },
    {
      id: 'training-chapter-communication',
      labelAr: 'فصل التواصل واللغة — تدريب رقمي',
      level: 'needs_review',
      noteAr: 'فصل التواصل واللغة — قيد التطوير / يحتاج مراجعة علمية',
    },
    {
      id: 'home-classroom',
      labelAr: 'الصف المنزلي وبنك الأدوات',
      level: 'implemented',
      noteAr: 'أنشطة ABA/TEACCH رقمية + بنك استراتيجيات',
    },
    {
      id: 'sensory',
      labelAr: 'الغرف الحسية',
      level: 'needs_review',
      noteAr: '٩ بيئات تجريبية — مقاييس الجلسة تحتاج اعتماد علمي',
    },
    {
      id: 'clinical-hub',
      labelAr: 'المركز السريري والبحثي (Hub)',
      level: 'implemented',
      noteAr: 'تعاون المستشار والإدارة — مقترحات واعتماد',
    },
    {
      id: 'consultant-room',
      labelAr: 'غرفة المستشار العلمي',
      level: 'in_progress',
      noteAr: 'هذه الغرفة — MVP قابل للتوسع',
    },
    {
      id: 'measurement',
      labelAr: 'القياس والتقدم (GAS)',
      level: 'partial',
      noteAr: 'متابعة أسبوعية جزئية — يحتاج توثيق علمي موحّد',
    },
    {
      id: 'merhid-ai',
      labelAr: 'مرشد تآلف (Merhid)',
      level: 'partial',
      noteAr: 'مساعد ذكي بحدود — دوره الاستشاري قيد التوثيق',
    },
    {
      id: 'ld-track',
      labelAr: 'مسار صعوبات التعلم',
      level: ldEnabled ? 'in_progress' : 'partial',
      noteAr: ldEnabled
        ? 'مفعّل تجريبياً — /dashboard/ld'
        : 'معطّل افتراضياً — NEXT_PUBLIC_LEARNING_DIFFICULTIES_ENABLED',
    },
  ];
}

export const PLATFORM_STATUS_LABELS: Record<
  PlatformStatusItem['level'],
  { ar: string; className: string }
> = {
  implemented: {
    ar: 'مطبّق',
    className: 'bg-emerald-100 text-emerald-800',
  },
  partial: {
    ar: 'مطبّق جزئياً',
    className: 'bg-amber-100 text-amber-800',
  },
  in_progress: {
    ar: 'قيد التطوير',
    className: 'bg-sky-100 text-sky-800',
  },
  needs_review: {
    ar: 'يحتاج مراجعة علمية',
    className: 'bg-violet-100 text-violet-800',
  },
};
