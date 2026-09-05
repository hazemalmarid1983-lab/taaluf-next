/**
 * رايات تشغيل مركزية.
 *
 * النوع boolean صريح لا literal، حتى لا يضيّق TypeScript الشرط
 * ويعتبر الفرع الآخر شيفرة ميتة عند إعادة تفعيل الراية.
 */

/**
 * مسار صعوبات التعلم / الأكاديمي — مشروع مستقل في المرحلة القادمة.
 * افتراضياً معطّل: منصة تآلف الحالية تركز على التوحد والإعاقات النمائية.
 * فعّله بـ NEXT_PUBLIC_LEARNING_DIFFICULTIES_ENABLED=true.
 */
export const LEARNING_DIFFICULTIES_ENABLED: boolean =
  process.env.NEXT_PUBLIC_LEARNING_DIFFICULTIES_ENABLED === 'true';

export function isLearningDifficultiesEnabled(): boolean {
  return LEARNING_DIFFICULTIES_ENABLED;
}

/** مسارات صعوبات التعلم — تُعطّل عند LEARNING_DIFFICULTIES_ENABLED=false */
export const LEARNING_DIFFICULTIES_ROUTE_PREFIXES = [
  '/dashboard/pathways',
  '/dashboard/screening-learning',
  '/dashboard/academic-assessment',
  '/dashboard/academic-card',
] as const;

export function isLearningDifficultiesRoute(path: string): boolean {
  return LEARNING_DIFFICULTIES_ROUTE_PREFIXES.some((prefix) =>
    path.startsWith(prefix)
  );
}

/**
 * الأنشطة تعمل عبر الأدوات التفاعلية الداخلية حصراً.
 * حين تكون false: لا تُعرض توصيات التطبيقات الخارجية ولا روابط الوصول إليها،
 * ويبقى بنك الوسائل مرجعاً معرفياً للمختص وولي الأمر بلا خروج من المنصة.
 */
export const EXTERNAL_TOOL_LINKS_ENABLED: boolean = false;
