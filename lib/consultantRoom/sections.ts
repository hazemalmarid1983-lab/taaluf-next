import { isLearningDifficultiesEnabled } from '@/lib/featureFlags';
import { HUB_PATH } from '@/lib/clinicalHub';
import {
  CONSULTANT_MEETINGS_PATH,
  CONSULTANT_REVIEW_PATH,
  CONSULTANT_ROOM_PATH,
} from '@/lib/consultantRoom/access';
import type { ConsultantSection } from '@/lib/consultantRoom/types';

/** أقسام غرفة المستشار — تُحدَّث تدريجياً دون إعادة بناء الصفحة */
export function getConsultantSections(): readonly ConsultantSection[] {
  const ldEnabled = isLearningDifficultiesEnabled();

  return [
    {
      id: 'overview',
      titleAr: 'نظرة عامة على تآلف',
      descriptionAr:
        'هوية المنصة، الفئة المستهدفة، ورسالتها التربوية–التأهيلية.',
      status: 'ready',
      href: '/scientific-basis',
      explore: [
        { href: '/legal', labelAr: 'الوثائق القانونية' },
        { href: `${HUB_PATH}?focus=guide`, labelAr: 'دليل المنصة التفصيلي' },
      ],
      sourceNote: 'مستند من دليل المنصة للمستشار (قسم الترحيب)',
    },
    {
      id: 'scientific-review-form',
      titleAr: 'نموذج المراجعة العلمية',
      descriptionAr:
        'نموذج مخصص لمراجعة المنهجية والمحتوى العلمي للمنصة بعد الاطلاع عليها. يمكن استكمال المراجعة على عدة مراحل.',
      status: 'ready',
      href: CONSULTANT_REVIEW_PATH,
      sourceNote:
        'draft — مراجعة C1–C34 · إجابات محفوظة محلياً على جهاز المستشار',
    },
    {
      id: 'training-methodology',
      titleAr: 'منهجية بناء التدريب',
      descriptionAr:
        'بناء خطط التدريب، اختيار الأنشطة، وربطها بالأهداف العلاجية.',
      status: 'ready',
      href: '/dashboard/training/plans/new',
      explore: [
        { href: '/dashboard/training', labelAr: 'لوحة التدريب' },
        { href: '/dashboard/home-classroom', labelAr: 'الصف المنزلي' },
      ],
      sourceNote: 'مسارات التدريب والأنشطة التفاعلية الموجودة',
    },
    {
      id: 'assessment-system',
      titleAr: 'منظومة التقييم',
      descriptionAr:
        'الفرز المبكر، والتقييم الشامل (Canon 4.0 — ٤٠ مؤشراً / ٤ محاور)، ودمج مصادر البيانات.',
      status: 'ready',
      href: '/dashboard/screening',
      explore: [
        { href: '/dashboard/assessments/new', labelAr: 'التقييم الشامل' },
        { href: '/dashboard/parent-assessment', labelAr: 'استبيان الأهل' },
        { href: '/scientific-basis', labelAr: 'الأساس العلمي' },
      ],
      sourceNote:
        'دليل المنصة — الفرز والتقييم التشغيلي (Canon 4.0)؛ المراجعة العلمية الحالية C1–C34',
    },
    {
      id: 'goals-system',
      titleAr: 'منظومة الأهداف',
      descriptionAr:
        'توليد أهداف SMART، خطط IEP، ومتابعة التقدم.',
      status: 'ready',
      href: '/dashboard/goals',
      sourceNote: 'دليل المنصة — قسم الأهداف وخطط IEP',
    },
    {
      id: 'training-system',
      titleAr: 'منظومة التدريب',
      descriptionAr:
        'أنشطة الانتباه والتركيز، جلسات التدريب، والصف المنزلي.',
      status: 'ready',
      href: '/dashboard/training',
      explore: [
        { href: '/dashboard/home-classroom', labelAr: 'الصف المنزلي' },
        { href: '/dashboard/tools-bank', labelAr: 'بنك الأدوات' },
        { href: '/dashboard/games', labelAr: 'الألعاب التفاعلية' },
      ],
      sourceNote: 'مسارات التدريب والأدوات التفاعلية',
    },
    {
      id: 'measurement-progress',
      titleAr: 'القياس والتقدم',
      descriptionAr:
        'مقاييس الجلسات، مقارنة التقدم بين الجلسات، وتتبع الأهداف.',
      status: 'partial',
      href: '/dashboard/goals',
      explore: [
        { href: '/sensory-rooms', labelAr: 'مقاييس الغرف الحسية' },
      ],
      sourceNote: 'جزء من المنطق مطبّق — يحتاج توثيق علمي موحّد',
    },
    {
      id: 'ai-role',
      titleAr: 'الذكاء الاصطناعي ودوره',
      descriptionAr:
        'مرشد تآلف (Merhid)، حدود الاستخدام، ونطاق المساعدة للمستشار.',
      status: 'preparing',
      explore: [{ href: HUB_PATH, labelAr: 'Merhid في المركز السريري' }],
      sourceNote: 'قيد الإعداد — المرجع الحالي: Merhid في Hub',
    },
    {
      id: 'current-gaps',
      titleAr: 'الفجوات الحالية',
      descriptionAr:
        'مجالات تحتاج استكمالاً أو مراجعة علمية قبل الاعتماد الكامل.',
      status: 'ready',
      href: CONSULTANT_ROOM_PATH,
      sourceNote: 'مستندة على حالة المنصة الفعلية — انظر «حالة المنصة»',
    },
    {
      id: 'roadmap',
      titleAr: 'خارطة الطريق',
      descriptionAr:
        'أولويات التطوير العلمي والتربوي للمرحلة القادمة.',
      status: 'preparing',
      sourceNote: 'قيد الإعداد — تُبنى بالتعاون مع المستشار',
    },
    {
      id: 'advisor-notes',
      titleAr: 'ملاحظات المستشار',
      descriptionAr:
        'مساحة لتوثيق الملاحظات والقرارات الاستشارية — قيد البناء.',
      status: 'preparing',
      explore: [
        { href: `${HUB_PATH}?focus=meeting`, labelAr: 'المقترحات الحالية في Hub' },
      ],
      sourceNote: 'قيد الإعداد — المقترحات الحالية عبر غرفة Hub',
    },
    {
      id: 'meeting-hall',
      titleAr: 'قاعة الاجتماعات',
      descriptionAr:
        'مساحة للاجتماعات ومحاضر الجلسات والملاحظات — مهيأة للتوسع.',
      status: 'ready',
      href: CONSULTANT_MEETINGS_PATH,
      explore: [
        { href: `${HUB_PATH}?focus=meeting`, labelAr: 'غرفة الاجتماعات في Hub' },
      ],
      sourceNote: 'واجهة أولية — التعاون الحالي عبر Hub',
    },
    ...(ldEnabled
      ? ([
          {
            id: 'ld-track',
            titleAr: 'مسار صعوبات التعلم',
            descriptionAr: 'مسار أكاديمي/صعوبات التعلم — تجريبي.',
            status: 'partial',
            href: '/dashboard/ld',
            sourceNote: 'مفعّل عبر NEXT_PUBLIC_LEARNING_DIFFICULTIES_ENABLED',
          } satisfies ConsultantSection,
        ] as const)
      : []),
  ];
}

/** للاختبارات — التأكد من عدم عرض اتفاقية الشراكة في واجهة غرفة المستشار. */
export function consultantHomeSectionsIncludeAgreementUi(): boolean {
  const serialized = JSON.stringify(getConsultantSections());
  return (
    /focus=agreement/i.test(serialized) ||
    /اتفاقية الشراكة/.test(serialized) ||
    /اعتمد الشراكة/.test(serialized) ||
    /الشراكة والاتفاق/.test(serialized) ||
    /الشراكة والمذكرة/.test(serialized)
  );
}
