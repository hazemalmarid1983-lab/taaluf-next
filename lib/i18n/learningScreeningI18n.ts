import type { LearningScreeningQuestion } from '@/lib/learningScreeningQuestions';
import type { Language } from '@/lib/i18n/translations';

const DOMAIN_EN: Record<string, string> = {
  dyslexia: 'Reading and decoding',
  dysgraphia: 'Writing and written expression',
  dyscalculia: 'Numeracy and number concepts',
  executive_adhd: 'Attention and classroom organization',
};

const QUESTIONS_EN: Record<
  string,
  {
    domainLabel: string;
    question: string;
    options: Record<number, { label: string; description: string }>;
  }
> = {
  sld_1: {
    domainLabel: 'Reading and decoding',
    question:
      'Does the child have difficulty linking letter sounds to their shapes or spelling simple words?',
    options: {
      0: {
        label: 'Stable, typical performance',
        description:
          'Recognizes letter sounds and spells age-appropriate words with ease.',
      },
      1: {
        label: 'Moderate, inconsistent difficulty',
        description:
          'Sometimes confuses similar letter sounds and needs slow phonetic help.',
      },
      2: {
        label: 'Clear, ongoing difficulty',
        description:
          'Struggles severely to decode even familiar letters and words and avoids reading.',
      },
    },
  },
  sld_2: {
    domainLabel: 'Reading fluency',
    question:
      'Does the child read noticeably slowly, with repetition, omissions, or substitutions?',
    options: {
      0: { label: 'Fluent reading', description: 'Reads sentences clearly without frequent stumbling.' },
      1: { label: 'Moderate slowness', description: 'Pauses often and substitutes some sounds in longer sentences.' },
      2: { label: 'Severe chopping', description: 'Reads word by word, and adds or drops words from the text.' },
    },
  },
  sld_3: {
    domainLabel: 'Reading comprehension',
    question:
      'Does the child struggle to understand the main idea of a paragraph or extract an answer from it?',
    options: {
      0: { label: 'Strong comprehension', description: 'Explains, summarizes, and answers direct questions easily.' },
      1: { label: 'Needs rereading', description: 'Understands if the text is read aloud or after several rereads.' },
      2: { label: 'Marked comprehension weakness', description: 'Uses all energy on decoding and forgets the paragraph immediately.' },
    },
  },
  sld_4: {
    domainLabel: 'Letter formation and spacing',
    question:
      'Is there a clear difficulty controlling letter size or staying on the line, with excessive slant?',
    options: {
      0: { label: 'Organized, readable handwriting', description: 'Controls pencil grip, letter size, line, and spacing.' },
      1: { label: 'Sometimes uneven writing', description: 'Letter size varies or leaves the line, with quick hand fatigue.' },
      2: { label: 'Clear motor difficulty', description: 'Illegible writing, tense grip, and sharp spacing differences.' },
    },
  },
  sld_5: {
    domainLabel: 'Spelling and copying',
    question:
      'Are there frequent spelling errors such as reversed letters or missing dots and long vowels?',
    options: {
      0: { label: 'Age-appropriate spelling', description: 'Spelling errors are few and typical for the grade.' },
      1: { label: 'Missing vowels or dots', description: 'Forgets tanween, long vowels, or dots in less familiar words.' },
      2: { label: 'Reversals and major errors', description: 'Reverses letters and drops whole syllables in dictation.' },
    },
  },
  sld_6: {
    domainLabel: 'Written expression',
    question:
      'Does the child avoid full sentences and find it very hard to organize ideas in writing?',
    options: {
      0: { label: 'Connected written expression', description: 'Writes clear, linked sentences that match the task.' },
      1: { label: 'Very short answers', description: 'Writes one or two words and avoids full paragraphs.' },
      2: { label: 'Unable to write ideas', description: 'Cannot turn spoken ideas into understandable written text.' },
    },
  },
  sld_7: {
    domainLabel: 'Number concepts and symbols',
    question:
      'Does the child confuse similar digits or struggle with greater/less and place value?',
    options: {
      0: { label: 'Strong number sense', description: 'Recognizes digits, place value, and comparisons easily.' },
      1: { label: 'Occasional number mix-ups', description: 'Sometimes confuses direction-sensitive digits in fast work.' },
      2: { label: 'Severe number-meaning gap', description: 'Cannot link a numeral to quantity and mixes + and − signs.' },
    },
  },
  sld_8: {
    domainLabel: 'Automatic math facts',
    question:
      'Does the child rely excessively on finger counting for very simple age-level calculations?',
    options: {
      0: { label: 'Quick mental recall', description: 'Recalls simple addition facts mentally and automatically.' },
      1: { label: 'Slow recall', description: 'Needs slow counting or fingers mainly for numbers above 10.' },
      2: { label: 'Full reliance on primitive counting', description: 'Cannot find 3+2 without counting fingers from the start each time.' },
    },
  },
  sld_9: {
    domainLabel: 'Math steps and word problems',
    question:
      'Does the child struggle to remember multi-step procedures such as regrouping in addition or subtraction?',
    options: {
      0: { label: 'Follows steps correctly', description: 'Follows calculation order and carrying accurately.' },
      1: { label: 'Forgets some steps', description: 'Sometimes forgets to add the carried ten unless reminded.' },
      2: { label: 'Lost in the sequence', description: 'Mixes the order of steps and does not know where to start.' },
    },
  },
  sld_10: {
    domainLabel: 'Sustained classroom focus',
    question:
      'Does the child lose focus quickly with any distraction and leave school tasks unfinished?',
    options: {
      0: { label: 'Sustained, complete focus', description: 'Finishes class tasks on time with stable attention.' },
      1: { label: 'Needs reminders', description: 'Drifts sometimes but returns to the task when prompted.' },
      2: { label: 'Constant distraction', description: 'Jumps between activities, finishes almost nothing, and is pulled by any sound or movement.' },
    },
  },
  sld_11: {
    domainLabel: 'Organization and school forgetting',
    question:
      'Does the child frequently forget homework or lose school materials and belongings?',
    options: {
      0: { label: 'Organized and follows materials', description: 'Keeps books and pencils and follows the daily timetable.' },
      1: { label: 'Occasional forgetting', description: 'Sometimes forgets items unless the family checks daily.' },
      2: { label: 'Ongoing mess and loss', description: 'Bag is constantly messy, belongings are lost almost daily, and direct instructions are forgotten.' },
    },
  },
  sld_12: {
    domainLabel: 'Impulsivity and excess movement',
    question:
      'Does the child find it hard to stay seated and answer before the question is finished?',
    options: {
      0: { label: 'Calm self-control', description: 'Waits for the question to end and manages movement well in class.' },
      1: { label: 'Mild restlessness', description: 'Fidgets or talks when the lesson is long but responds to guidance.' },
      2: { label: 'Constant impulsivity', description: 'Interrupts often, answers before thinking, and rarely stays in the seat.' },
    },
  },
};

export function localizeLearningQuestion(
  q: LearningScreeningQuestion,
  lang: Language
): LearningScreeningQuestion {
  if (lang !== 'en') return q;
  const en = QUESTIONS_EN[q.id];
  if (!en) {
    return { ...q, domainLabel: DOMAIN_EN[q.domain] || q.domainLabel };
  }
  return {
    ...q,
    domainLabel: en.domainLabel,
    question: en.question,
    text: en.question,
    options: q.options.map((opt) => ({
      ...opt,
      label: en.options[opt.score]?.label || opt.label,
      description: en.options[opt.score]?.description || opt.description,
    })) as LearningScreeningQuestion['options'],
  };
}
