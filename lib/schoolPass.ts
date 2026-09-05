/**
 * بطاقة التسهيلات الصفية — إرشادات ميدانية للمعلم فقط.
 * لا تُضمَّن النسب أو التصنيف أو أي صياغة تشخيصية.
 */

import { getAgeBandLabel, type AssessmentScore } from '@/types/taalof';

export type SchoolPassData = {
  childName: string;
  ageBand: string;
  date: string;
  /** كيف يوجَّه الطالب داخل الصف */
  communicationStyle: string;
  sensoryTriggers: string[];
  calmingStrategies: string[];
  academicSupportTips: string[];
  emergencyContact: string;
};

function scoreOf(scores: AssessmentScore[], id: string): number {
  const row = scores.find((s) => s.criterionId === id);
  const n = Number(row?.score);
  return Number.isFinite(n) ? Math.min(3, Math.max(0, n)) : 0;
}

function formatAgeBand(ageBand?: string): string {
  if (!ageBand) return 'غير محددة';
  const label = getAgeBandLabel(ageBand);
  return label?.ar ? `${label.ar} · ${ageBand}` : ageBand;
}

function todayAr(date?: string): string {
  if (date) return date;
  return new Date().toLocaleDateString('ar-OM', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function buildCommunication(scores: AssessmentScore[]): string {
  const parts: string[] = [];
  if (scoreOf(scores, 'C2') >= 2) {
    parts.push(
      'نادِ باسمه واقترب منه بهدوء قبل إعطاء أي تعليم؛ قد لا يلتفت من بعيد.'
    );
  }
  if (scoreOf(scores, 'C3') >= 2 || scoreOf(scores, 'C4') >= 2) {
    parts.push(
      'أعطِ تعليماً واحداً قصيراً مع إشارة باليد أو صورة، ثم انتظر التنفيذ قبل إضافة خطوة ثانية.'
    );
  }
  if (scoreOf(scores, 'C8') >= 2 || scoreOf(scores, 'C1') >= 2) {
    parts.push(
      'اقبل كلمة واحدة أو إشارة أو بطاقة صورة كطلب صحيح، وقدّم خيارين واضحين بدلاً من سؤال مفتوح.'
    );
  }
  if (scoreOf(scores, 'C12') >= 2 || scoreOf(scores, 'C11') >= 2) {
    parts.push(
      'وجّه انتباهه إلى الشيء المشار إليه (كتاب، سبورة، أداة) بدل الاعتماد على النظر في العينين.'
    );
  }
  if (scoreOf(scores, 'C20') >= 2) {
    parts.push(
      'بعد التعليم الجماعي، كرّر المطلوب له بهدوء مرة واحدة دون توبيخ على عدم الاستجابة من المرة الأولى.'
    );
  }
  if (!parts.length) {
    return 'يُوجَّه بجمل قصيرة هادئة مع تعزيز فوري عند الاستجابة. أبقِ التعليم واضحاً وخطوة واحدة كلما أمكن.';
  }
  return parts.join(' ');
}

function buildTriggers(scores: AssessmentScore[]): string[] {
  const items: string[] = [];
  if (scoreOf(scores, 'C33') >= 2) {
    items.push(
      'أصوات مفاجئة (جرس، مكبر) أو أضواء قوية أو لمس غير متوقع من الخلف'
    );
  }
  if (scoreOf(scores, 'C31') >= 2) {
    items.push('تغيير مفاجئ في الجدول أو مكان الجلوس دون إشارة بصرية مسبقة');
  }
  if (scoreOf(scores, 'C19') >= 2) {
    items.push('انتظار الدور فترة طويلة دون مؤقت مرئي أو إشارة واضحة لدوره');
  }
  if (scoreOf(scores, 'C40') >= 2) {
    items.push('تقديم طعام جديد في الوجبة دون الإبقاء على صنف مألوف بجانبه');
  }
  if (scoreOf(scores, 'C32') >= 2) {
    items.push('المنع المفاجئ أو أخذ أداة دون بديل أو دون عدّ تنازلي قصير');
  }
  if (!items.length) {
    items.push(
      'لا تظهر من التقييم الحالي مثيرات صفية بارزة — راقب إشارات التوتر الفردية (تغطية الأذنين أو الانسحاب).'
    );
  }
  return items.slice(0, 5);
}

function buildCalming(scores: AssessmentScore[]): string[] {
  const items: string[] = [
    'قدّم جدولاً بصرياً لخطوات الحصة (الآن / بعد قليل / ثم) قبل البدء.',
  ];
  if (scoreOf(scores, 'C32') >= 2 || scoreOf(scores, 'C31') >= 2) {
    items.push(
      'عند التوتر: اسمح بركن هدوء قصير (دقيقتان) ثم عد إلى المهمة بخطوة واحدة.'
    );
  } else {
    items.push(
      'عند الإحباط: اخفض الصوت، قدّم خيارين، وانتظر دون إكثار الكلام.'
    );
  }
  if (scoreOf(scores, 'C19') >= 2 || scoreOf(scores, 'C25') >= 2) {
    items.push('استخدم مؤقتاً مرئياً لانتظار الدور أو لإنهاء المهمة القصيرة.');
  } else {
    items.push('كافئ البقاء في المهمة بجملة قصيرة فورية («أحسنت، أكملت الخطوة»).');
  }
  return items.slice(0, 4);
}

function buildAcademicTips(scores: AssessmentScore[]): string[] {
  const pool: { id: string; tip: string }[] = [
    {
      id: 'C25',
      tip: 'جزّئ الشرح إلى مهام من دقيقة–دقيقتين مع إشارة بصرية للبدء والانتهاء.',
    },
    {
      id: 'C20',
      tip: 'بعد التعليم الجماعي، أعِد المطلوب له بجملة واحدة وهو ينظر إلى النموذج.',
    },
    {
      id: 'C4',
      tip: 'لا تجمع خطوتين في جملة واحدة؛ نفّذ الأولى ثم أضف الثانية.',
    },
    {
      id: 'C19',
      tip: 'حدّد دوره بلون أو بطاقة «دورك» حتى لا يقاطع أو ينسحب من الحلقة.',
    },
    {
      id: 'C15',
      tip: 'اعرض الحركة أو المطلوب عملياً أولاً (انظر ثم افعل) قبل الشرح اللفظي الطويل.',
    },
  ];
  const ranked = pool
    .map((row) => ({ ...row, score: scoreOf(scores, row.id) }))
    .sort((a, b) => b.score - a.score);
  const picked = ranked.slice(0, 3).map((r) => r.tip);
  while (picked.length < 3) {
    const next = pool[picked.length];
    if (!next || picked.includes(next.tip)) break;
    picked.push(next.tip);
  }
  return picked.slice(0, 3);
}

export function buildSchoolPassData(input: {
  childName: string;
  ageBand?: string;
  date?: string;
  scores: AssessmentScore[];
  emergencyContact?: string;
}): SchoolPassData {
  const name = String(input.childName || '').trim() || 'الطالب';
  return {
    childName: name,
    ageBand: formatAgeBand(input.ageBand),
    date: todayAr(input.date),
    communicationStyle: buildCommunication(input.scores),
    sensoryTriggers: buildTriggers(input.scores),
    calmingStrategies: buildCalming(input.scores),
    academicSupportTips: buildAcademicTips(input.scores),
    emergencyContact:
      String(input.emergencyContact || '').trim() ||
      'ولي الأمر — يُحدَّد من ملف الطفل في المنصة',
  };
}
