/**
 * الأدوات التفاعلية الداخلية للمنصة — البديل المعتمد عن التطبيقات الخارجية.
 *
 * الترشيح يتم بمطابقة مجالات الهدف النمائية (detectToolDomains) مع مجالات
 * كل أداة، فيرى ولي الأمر أدوات تعمل داخل المنصة بدل روابط تأخذه خارجها.
 */

import type { AutismToolDomainId } from './data/autismToolsBank';
import { detectToolDomains } from './toolsBank';

export type InternalTool = {
  id: string;
  emoji: string;
  href: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  domains: AutismToolDomainId[];
};

export const INTERNAL_TOOLS: InternalTool[] = [
  {
    id: 'visual_schedule',
    emoji: '🗓️',
    href: '/dashboard/home-classroom#visual-schedule',
    titleAr: 'الجدول البصري ونظام أولاً / ثم',
    titleEn: 'Visual schedule & First / Then board',
    descAr:
      'لوحة تمهيدية تُري الطفل المهمة ثم المعزز، مع مؤقت بصري هادئ يوضح الوقت المتبقي دون قلق.',
    descEn:
      'A priming board that shows the child the task then the reward, with a calm visual timer for the time left.',
    domains: ['life_skills', 'emotional_behavioral'],
  },
  {
    id: 'home_classroom',
    emoji: '🏡',
    href: '/dashboard/home-classroom',
    titleAr: 'الغرفة الصفية المنزلية',
    titleEn: 'Virtual home co-classroom',
    descAr:
      'مطابقة وتمييز استقبالي وفرز وتسمية، مع نطق عربي وإنجليزي ورصد خمس محاولات في ملف الطفل.',
    descEn:
      'Matching, receptive ID, sorting and naming with Arabic and English speech, plus five-trial tracking.',
    domains: ['communication', 'academic'],
  },
  {
    id: 'aac_board',
    emoji: '🗣️',
    href: '/dashboard/home-classroom?aac=1',
    titleAr: 'لوحة التواصل المعزز والبديل',
    titleEn: 'Augmentative & alternative communication board',
    descAr:
      'بطاقات مصوّرة يكوّن بها الطفل جملته وتُنطق بالعربية — بديل داخلي عن تطبيقات AAC الخارجية.',
    descEn:
      'Picture cards the child builds a sentence with, spoken aloud — an in-platform alternative to external AAC apps.',
    domains: ['communication', 'emotional_behavioral'],
  },
  {
    id: 'regulation_hub',
    emoji: '🧘',
    href: '/dashboard/home-classroom?calm=1',
    titleAr: 'محرك التنظيم الانفعالي ومناطق المشاعر',
    titleEn: 'Emotional regulation & feeling zones',
    descAr:
      'مناطق المشاعر الأربع مع تنفس متناغم وفقاعات حسية، وتسجيل حالة الطفل قبل الجلسة وبعدها.',
    descEn:
      'The four feeling zones with paced breathing and sensory bubbles, plus mood logging before and after the session.',
    domains: ['emotional_behavioral', 'sensory'],
  },
  {
    id: 'motor_tracing',
    emoji: '✏️',
    href: '/dashboard/home-classroom?tracing=1',
    titleAr: 'محرك التتبع البصري الحركي الدقيق',
    titleEn: 'Motor & line tracing engine',
    descAr:
      'مسارات متدرجة من خطوط وأشكال وأرقام، مع تقييم الدقة والسلاسة وتعزيز صوتي عند الإكمال.',
    descEn:
      'Progressive paths of lines, shapes and numbers, with accuracy and smoothness scoring plus spoken praise on completion.',
    domains: ['motor', 'academic'],
  },
  {
    id: 'sensory_matching',
    emoji: '🃏',
    href: '/sensory-matching',
    titleAr: 'لعبة المطابقة الحسية',
    titleEn: 'Sensory matching game',
    descAr: 'مطابقة بطاقات مصوّرة مع نطق اسم العنصر ونغمة تعزيز عند الإجابة الصحيحة.',
    descEn:
      'Picture-card matching that speaks the item name and plays a reinforcement tone on a correct answer.',
    domains: ['communication', 'academic'],
  },
  {
    id: 'bubble_seeker',
    emoji: '🫧',
    href: '/games/bubble-seeker',
    titleAr: 'لعبة اقتناص الفقاعات',
    titleEn: 'Bubble seeker',
    descAr: 'تتبّع بصري ولمس دقيق لأهداف متحركة، مع مؤثرات حسية لطيفة.',
    descEn: 'Visual tracking and precise tapping of moving targets with gentle sensory effects.',
    domains: ['sensory', 'motor'],
  },
  {
    id: 'friend_feeder',
    emoji: '🤝',
    href: '/games/friend-feeder',
    titleAr: 'لعبة إطعام الأصدقاء',
    titleEn: 'Friend feeder',
    descAr: 'تدريب على الدور والمشاركة وقراءة استجابة الطرف الآخر داخل موقف لعب.',
    descEn: 'Practises turn-taking, sharing and reading the other side’s response inside a play scene.',
    domains: ['social', 'emotional_behavioral'],
  },
  {
    id: 'sensory_hub',
    emoji: '🌌',
    href: '/sensory-rooms',
    titleAr: 'جناح الغرف الحسية والتنظيم الانفعالي',
    titleEn: 'Sensory integration & regulation hub',
    descAr:
      'ثلاث غرف تفاعلية: فقاعات، نجوم وتنفس، ورسم ضوئي — مع حماية حسية وتسجيل الجلسة.',
    descEn:
      'Three interactive rooms: bubbles, stars & breathing, and light tracing — with sensory protection and session logging.',
    domains: ['sensory', 'emotional_behavioral'],
  },
  {
    id: 'sensory_room',
    emoji: '🌊',
    href: '/sensory-room',
    titleAr: 'الغرفة الحسية الهادئة',
    titleEn: 'Calm sensory room',
    descAr: 'بيئة صوتية وبصرية مهدّئة لتنظيم الطفل قبل الجلسة أو بعد التوتر.',
    descEn: 'A calming audio-visual space to regulate the child before a session or after distress.',
    domains: ['sensory', 'emotional_behavioral'],
  },
  {
    id: 'games_hub',
    emoji: '🎮',
    href: '/dashboard/games',
    titleAr: 'مركز الألعاب التفاعلية',
    titleEn: 'Interactive games hub',
    descAr: 'كل الألعاب الداخلية في مكان واحد مع ربطها بتقرير الطفل.',
    descEn: 'All internal games in one place, linked to the child report.',
    domains: ['recreation', 'social'],
  },
];

export function internalToolById(id: string) {
  return INTERNAL_TOOLS.find((tool) => tool.id === id);
}

/**
 * يرتّب الأدوات الداخلية بحسب تقاطع مجالاتها مع مجالات الهدف.
 * يعود دائماً بقائمة غير فارغة، فالغرفة الصفية صالحة لأي هدف تدريبي.
 */
export function recommendInternalTools(goalText: string, limit = 3) {
  const domains = detectToolDomains(goalText);
  if (!domains.length) return INTERNAL_TOOLS.slice(0, limit);

  const scored = INTERNAL_TOOLS.map((tool, index) => ({
    tool,
    index,
    score: tool.domains.filter((domain) => domains.includes(domain)).length,
  }));

  const matched = scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.tool);

  // نُكمل النقص بالترتيب الافتراضي حتى لا تظهر البطاقة بأداة واحدة يتيمة
  const rest = INTERNAL_TOOLS.filter((tool) => !matched.includes(tool));
  return [...matched, ...rest].slice(0, limit);
}
