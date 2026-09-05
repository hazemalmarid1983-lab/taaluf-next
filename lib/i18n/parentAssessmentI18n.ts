import type { ParentItem, ParentOption } from '@/lib/parentAssessment';
import type { Language } from '@/lib/i18n/translations';
import { localizeLabel } from '@/lib/i18n/pathwayLabels';

const SCALE_EN: Record<number, string> = {
  0: 'Stable',
  1: 'Moderate',
  2: 'High support',
  3: 'Very high support',
};

const QUESTION_EN: Record<string, string> = {
  P1: 'Does your child look you in the eye when you speak with them?',
  P2: 'Does your child understand when you make a simple request?',
  P3: 'Does your child express what they want with clear words?',
  P4: 'Does your child initiate play with other children?',
  P5: 'Do you notice repetitive movements (rocking, hand flapping)?',
  P6: 'Does your child respond when you ask them to follow instructions?',
  P7: 'Does your child move from one activity to another without strong distress?',
  P8: 'Does your child manage anger or emotions in an age-appropriate way?',
  P9: 'Does your child stay focused on one activity for a reasonable time?',
  P10: 'Does your child show anxiety or fear in new situations?',
  P11: 'Does your child play pretend games (cooking or driving)?',
  P12: 'Is your child distressed by certain sounds, lights, or touch?',
  P13: 'Can your child use their hands skillfully (holding a pencil, cutting)?',
  P14: 'Does your child move with coordination and age-appropriate agility?',
  P15: 'Does your child respond when you call their name?',
  P16: 'Does your child show feelings (joy, sadness) in a readable way?',
  P17: 'Is your child strongly distressed when routines change?',
  P18: 'Does your child get absorbed in one interest for very long periods?',
  P19: 'Does your child manage daily self-care (eating, dressing)?',
  P20: 'Does your child move a lot and find it hard to sit still?',
};

const OPTION_DESC_EN: Record<string, Record<number, string>> = {
  P1: {
    0: 'Looks into eyes naturally and keeps eye contact during conversation.',
    1: 'Looks briefly at times, or needs their name called to lift their gaze.',
    2: 'Rarely looks at the eyes and prefers looking at nearby objects.',
    3: 'Avoids eye contact completely, as if they do not see you.',
  },
  P2: {
    0: 'Understands simple sentences and follows the request without repetition.',
    1: 'Understands simple words but may need a gesture or repetition.',
    2: 'Understands few words and needs physical guidance to follow through.',
    3: 'Does not appear to understand any spoken request directed at them.',
  },
  P3: {
    0: 'Uses useful words and sentences to request needs clearly.',
    1: 'Uses single words or short sentences, sometimes hard to understand.',
    2: 'Very few words, or repeats others’ speech without clear meaning.',
    3: 'Does not produce understandable words and relies on gestures or crying.',
  },
  P4: {
    0: 'Initiates interaction and play with children easily.',
    1: 'Joins if others start, but rarely begins on their own.',
    2: 'Prefers playing alone and avoids approaching children.',
    3: 'Shows no interest in other children, as if they are not there.',
  },
  P5: {
    0: 'These movements appear only very rarely.',
    1: 'They appear daily but can be interrupted and redirected.',
    2: 'They appear intensely and take a large part of the child’s time.',
    3: 'They dominate most of the day and are hard to interrupt.',
  },
  P6: {
    0: 'Follows instructions immediately and consistently.',
    1: 'Follows them but needs repetition or a short delay.',
    2: 'Often ignores instructions or needs physical help.',
    3: 'Almost never responds to spoken commands, even when repeated.',
  },
  P7: {
    0: 'Finishes an activity and moves to the next without resistance.',
    1: 'Shows brief protest, then complies within a minute or two.',
    2: 'A tantrum (crying/shouting) lasts several minutes at transitions.',
    3: 'A long, intense tantrum that may include self-injury or hurting others.',
  },
  P8: {
    0: 'Has typical feelings and recovers within minutes without much help.',
    1: 'Gets angry or cries, then calms with distraction or a hug.',
    2: 'Strong tantrums last a long time and are hard to stop.',
    3: 'Extreme outbursts (biting/head-banging) that do not settle.',
  },
  P9: {
    0: 'Focuses and completes the activity without easy distraction.',
    1: 'Pays attention then drifts and needs a reminder to finish.',
    2: 'Great difficulty sitting to finish any task.',
    3: 'Constant movement; cannot focus for more than seconds.',
  },
  P10: {
    0: 'Age-typical fears that pass quickly.',
    1: 'Clear anxiety in some situations; calms if you are nearby.',
    2: 'Fear that blocks new activities, school, or going out.',
    3: 'Persistent, disabling anxiety with refusal to go out and physical signs.',
  },
  P11: {
    0: 'Creates pretend scenarios and changes roles flexibly.',
    1: 'Limited pretend play, or repeats the same scene.',
    2: 'Does not use imagination and prefers stacking or lining up.',
    3: 'Does not use toys by function; only moves or stares at them.',
  },
  P12: {
    0: 'Handles sensory input in a typical way.',
    1: 'Dislikes some sounds or foods, without constant severe distress.',
    2: 'Covers ears, screams, or runs from certain stimuli.',
    3: 'Reactions that block places or clothes and affect daily life.',
  },
  P13: {
    0: 'Holds a pencil and uses scissors or buttons with age-typical ease.',
    1: 'Imprecise grip and difficulty with some shapes or buttons.',
    2: 'Great difficulty controlling small objects.',
    3: 'Cannot do fine tasks and depends fully on help.',
  },
  P14: {
    0: 'Walks, jumps, and balances in an age-typical way.',
    1: 'Difficulty with some skills such as hopping or stairs.',
    2: 'Unsteady walking, frequent falls, or refusal of movement play.',
    3: 'Cannot walk without help, or balance is very weak.',
  },
  P15: {
    0: 'Responds quickly and shows interest when called.',
    1: 'Responds sometimes, with limited enthusiasm or after repetition.',
    2: 'Rarely responds and seems indifferent to being called.',
    3: 'Ignores the call completely, as if they do not hear their name.',
  },
  P16: {
    0: 'Shows feelings clearly with words or facial expressions.',
    1: 'Limited expression, sometimes exaggerated or hard to read.',
    2: 'Feelings that do not match the situation.',
    3: 'Almost flat face and little emotional response to others.',
  },
  P17: {
    0: 'Accepts change flexibly and adapts easily.',
    1: 'Prefers routine and accepts change after brief protest.',
    2: 'Gets very angry at small changes, with shouting or crying.',
    3: 'Very long outbursts at any change, sometimes breaking things.',
  },
  P18: {
    0: 'Varied interests and plays with different things.',
    1: 'A limited interest, but accepts new things with encouragement.',
    2: 'Rejects anything outside one interest that dominates play.',
    3: 'Occupied with one thing only and cannot be redirected.',
  },
  P19: {
    0: 'Manages most daily tasks independently.',
    1: 'Needs a reminder or help with some complex tasks.',
    2: 'Depends on you for most basic tasks.',
    3: 'Can do almost nothing alone and depends on you for nearly everything.',
  },
  P20: {
    0: 'Controls movement and sits quietly when needed.',
    1: 'A little active, but sits if interested or motivated.',
    2: 'Clear hyperactivity; hard to sit more than a few minutes.',
    3: 'Constant movement and cannot settle even for seconds.',
  },
};

export function localizeParentItem(
  item: ParentItem,
  lang: Language
): { question: string; domain: string; options: ParentOption[] } {
  const options = (item.options || []).map((opt) => ({
    ...opt,
    label: lang === 'en' ? SCALE_EN[opt.score] || opt.label : opt.label,
    description:
      lang === 'en'
        ? OPTION_DESC_EN[item.id]?.[opt.score] || opt.description
        : opt.description,
  }));

  return {
    question:
      lang === 'en'
        ? QUESTION_EN[item.id] || item.question || item.text
        : item.question || item.text,
    domain: localizeLabel(item.domain, lang),
    options,
  };
}
