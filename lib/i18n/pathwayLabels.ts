import { ACADEMIC_DOMAIN_LABEL } from '@/lib/academicFullI18n';
import { FUNCTIONAL_INDICATOR_LABELS } from '@/lib/functionalIndicators';
import type { Language } from '@/lib/i18n/translations';

const LABEL_EN: Record<string, string> = {
  'المسار النمائي والتواصلي': 'Developmental & communication pathway',
  'المسار الأكاديمي والدعم المدرسي': 'Academic & school-support pathway',
  'لم يُحفظ فرز نمائي بعد.': 'No developmental screening saved yet.',
  'لم يخضع لفرز نمائي بعد.': 'Has not completed a developmental screening yet.',
  'لم يُحفظ فرز أكاديمي بعد.': 'No academic screening saved yet.',
  'الغرفة الحسية · بحيرة الأسماك': 'Sensory room · fish pond',
  'مطابقة الصور والتعريف الصوتي': 'Picture matching with voice',
  صحيحة: 'correct',
  'صائد الفقاعات': 'Bubble Seeker',
  'قطار الذاكرة': 'Memory Train',
  'صائد الحروف': 'Letter Hunter',
  'جلسة مكتملة': 'Session completed',
  دقة: 'accuracy',
  'انتباه مشترك': 'joint attention',
  'القراءة والوعي الفونيمي': ACADEMIC_DOMAIN_LABEL.reading_decoding.en,
  'الكتابة والتعبير التحريري': ACADEMIC_DOMAIN_LABEL.written_expression.en,
  'الحساب والمفاهيم الرياضية': ACADEMIC_DOMAIN_LABEL.numeracy_processing.en,
  'الانتباه والوظائف التنفيذية': ACADEMIC_DOMAIN_LABEL.attention_focus.en,
  ...Object.fromEntries(
    Object.values(FUNCTIONAL_INDICATOR_LABELS).map((l) => [l.ar, l.en])
  ),
  'التواصل الاستجابي والتعبيري': 'Receptive and expressive communication',
  'التفاعل والاندماج الاجتماعي واللعب': 'Social interaction, inclusion, and play',
  'النمو المعرفي والحلول الإدراكية': 'Cognitive growth and problem-solving',
  'السلوك والتكيف والحواس واستقلالية الذات':
    'Behavior, adaptation, senses, and self-independence',
  'التواصل': 'Communication',
  'التفاعل واللعب': 'Interaction and play',
  'النمو المعرفي': 'Cognitive growth',
  'السلوك والتكيف': 'Behavior and adaptation',
};

export function localizeLabel(text: string, lang: Language): string {
  if (lang !== 'en' || !text) return text;
  if (LABEL_EN[text]) return LABEL_EN[text];
  return Object.entries(LABEL_EN).reduce(
    (out, [ar, en]) => out.replaceAll(ar, en),
    text
  );
}
