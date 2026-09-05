import type {
  AcademicFullDomain,
  ComprehensiveQuestion,
} from '@/lib/academicFullQuestions';
import type { Language } from '@/lib/i18n/translations';

export const ACADEMIC_DOMAIN_LABEL: Record<
  AcademicFullDomain,
  { ar: string; en: string }
> = {
  dyslexia: {
    ar: 'القراءة والوعي الفونيمي',
    en: 'Reading and phonemic awareness',
  },
  dysgraphia: {
    ar: 'الكتابة والتعبير التحريري',
    en: 'Writing and written expression',
  },
  dyscalculia: {
    ar: 'الحساب والمفاهيم الرياضية',
    en: 'Numeracy and mathematical concepts',
  },
  executive_adhd: {
    ar: 'الانتباه والوظائف التنفيذية',
    en: 'Attention and executive functions',
  },
};

export const ACADEMIC_SKILL_LABEL_EN: Record<string, string> = {
  full_dys_1: 'Phonemic and phonological awareness',
  full_dys_2: 'Similar-sound letter discrimination',
  full_dys_3: 'Decoding unfamiliar words',
  full_dys_4: 'Oral reading fluency',
  full_dys_5: 'Omissions, additions, and substitutions',
  full_dys_6: 'Literal reading comprehension',
  full_dys_7: 'Inference and reading connections',
  full_dys_8: 'High-frequency sight words',
  full_dys_9: 'Line tracking and visual field',
  full_gra_1: 'Pencil grip and motor pressure',
  full_gra_2: 'Line alignment and writing direction',
  full_gra_3: 'Letter size and spacing',
  full_gra_4: 'Letter and number reversals',
  full_gra_5: 'Spelling and orthographic patterns',
  full_gra_6: 'Copying speed from the board',
  full_gra_7: 'Sentence construction',
  full_gra_8: 'Written expression of ideas',
  full_gra_9: 'Punctuation and page layout',
  full_num_1: 'Number sense and quantity',
  full_num_2: 'Linking numerals to meaning',
  full_num_3: 'Place value',
  full_num_4: 'Basic addition and subtraction facts',
  full_num_5: 'Math operation signs',
  full_num_6: 'Multi-step calculations',
  full_num_7: 'Word-problem solving',
  full_num_8: 'Time concepts and clock reading',
  full_num_9: 'Money and everyday transactions',
  full_exe_1: 'Sustained classroom focus',
  full_exe_2: 'Ignoring environmental distractions',
  full_exe_3: 'Following multi-step instructions',
  full_exe_4: 'Organizing school materials',
  full_exe_5: 'Impulse control',
  full_exe_6: 'Seat-based movement and restlessness',
  full_exe_7: 'Cognitive flexibility and transitions',
  full_exe_8: 'Initiating school tasks',
  full_exe_9: 'Self-monitoring and error checking',
};

export function localizeDomainBadge(
  q: ComprehensiveQuestion,
  lang: Language
): { domainLabel: string; skillName: string } {
  if (lang === 'en') {
    return {
      domainLabel: ACADEMIC_DOMAIN_LABEL[q.domain].en,
      skillName: ACADEMIC_SKILL_LABEL_EN[q.id] || q.skillName,
    };
  }
  return {
    domainLabel: q.domainLabel,
    skillName: q.skillName,
  };
}

export function fillTemplate(
  template: string,
  values: Record<string, string | number>
) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template
  );
}
