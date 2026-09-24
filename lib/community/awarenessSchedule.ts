/**
 * منشورات توعوية مجدولة مرتين أسبوعياً (الأحد والأربعاء بتوقيت مسقط).
 * النصوص من بنك معلوماتي مراجع، وليست تشخيصاً ولا ناتجة عن نموذج توليدي.
 */

const MUSCAT_OFFSET_MS = 4 * 60 * 60 * 1000;
const SLOT_WEEKDAYS = new Set([0, 3]);

export type AwarenessMediaKind = 'image' | 'video';

export type AwarenessDraft = {
  id: string;
  title: string;
  body: string;
  mediaKind: AwarenessMediaKind;
  mediaCaption: string;
  createdAt: string;
};

type BankItem = {
  title: string;
  body: string;
  mediaKind: AwarenessMediaKind;
  mediaCaption: string;
};

const AWARENESS_BANK: BankItem[] = [
  {
    title: 'ما المقصود بالتدخل المبكر؟',
    body: 'التدخل المبكر يعني دعم التواصل واللعب والروتين في السنوات الأولى، بخطة يضعها مختص مؤهل مع الأسرة. المعلومة العامة هنا لا تشخّص طفلاً ولا تستبدل التقييم.',
    mediaKind: 'image',
    mediaCaption: 'بطاقة مصورة: الأسرة واللعب المشترك',
  },
  {
    title: 'الانتباه المشترك في دقائق اللعب',
    body: 'انظر إلى ما ينظر إليه الطفل، سمِّ الشيء مرة واحدة، وانتظر. المحاولة القصيرة المتكررة أوضح من درس طويل. هذا نشاط توعوي وليس معيار إتقان.',
    mediaKind: 'video',
    mediaCaption: 'بطاقة مرئية: انظر، سمِّ، وانتظر',
  },
  {
    title: 'الدعم البصري في الروتين',
    body: 'صورة لخطوة واحدة (غسل اليدين، الجلوس، الانتقال) تساعد بعض الأطفال على توقع ما يأتي. ابدأ بصورة واحدة مألوفة، وراجع المناسب مع المختص.',
    mediaKind: 'image',
    mediaCaption: 'بطاقة مصورة: خطوة واحدة واضحة',
  },
  {
    title: 'الانتظار دور مهارة',
    body: 'الانتظار القصير مع إشارة واضحة («دورك بعد») يبني التبادل. إن زاد الضيق، قصّر الانتظار. لا يُستخدم هذا المنشور للحكم على سلوك الطفل.',
    mediaKind: 'video',
    mediaCaption: 'بطاقة مرئية: دورك بعد إشارة قصيرة',
  },
  {
    title: 'متى نطلب مراجعة مختص؟',
    body: 'إذا قلقت الأسرة من التواصل أو اللعب أو الاستجابة للاسم، فالمراجعة مع مختص مؤهل هي الخطوة. مجتمع تآلف يجيب عن أسئلة عامة ولا يصدر تشخيصاً.',
    mediaKind: 'image',
    mediaCaption: 'بطاقة مصورة: سؤال الأسرة للمختص',
  },
  {
    title: 'الروتين الهادئ للحواس',
    body: 'خفّض الضوضاء المفاجئة، وامنح مكاناً واضحاً للراحة بعد اللعب. ما يريح طفلاً قد لا يناسب آخر، لذلك تُراجع التفاصيل مع من يعرف الطفل.',
    mediaKind: 'video',
    mediaCaption: 'بطاقة مرئية: مكان هادئ بعد اللعب',
  },
  {
    title: 'كل محاولة تواصل تُحتسب',
    body: 'النظر، المناولة، الصوت، أو الإشارة محاولات تواصل. ردّ واحد واضح عليها يشجّع المحاولة التالية. هذا تذكير أسري وليس قياساً سريرياً.',
    mediaKind: 'image',
    mediaCaption: 'بطاقة مصورة: الرد على محاولة واحدة',
  },
  {
    title: 'الأسرة جزء من الخطة',
    body: 'معلومة قصيرة تُطبَّق في المنزل أقوى من قائمة طويلة. دوّنوا ما نجح وما صعُب، وشاركوه في غرفة الطفل مع المدرس أو في موعد مراجعة التقدم.',
    mediaKind: 'video',
    mediaCaption: 'بطاقة مرئية: ملاحظة واحدة للمراجعة',
  },
];

type Ymd = { y: number; m: number; d: number; weekday: number };

export function muscatYmd(now: Date): Ymd {
  const shifted = new Date(now.getTime() + MUSCAT_OFFSET_MS);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  };
}

function shiftDays(day: Ymd, delta: number): Ymd {
  const utc = Date.UTC(day.y, day.m - 1, day.d) + delta * 86400000;
  const next = new Date(utc);
  return {
    y: next.getUTCFullYear(),
    m: next.getUTCMonth() + 1,
    d: next.getUTCDate(),
    weekday: next.getUTCDay(),
  };
}

function slotId(day: Ymd) {
  const month = String(day.m).padStart(2, '0');
  const date = String(day.d).padStart(2, '0');
  return `awareness_${day.y}-${month}-${date}`;
}

function draftFor(day: Ymd): AwarenessDraft {
  const serial = Math.floor(Date.UTC(day.y, day.m - 1, day.d) / 86400000);
  const item = AWARENESS_BANK[serial % AWARENESS_BANK.length];
  return {
    id: slotId(day),
    title: item.title,
    body: item.body,
    mediaKind: item.mediaKind,
    mediaCaption: item.mediaCaption,
    createdAt: new Date(Date.UTC(day.y, day.m - 1, day.d, 5, 0, 0)).toISOString(),
  };
}

/** أحدث موعدي أحد/أربعاء لم يُنشرا بعد، بحد أقصى موعدين. */
export function dueAwarenessPosts(
  now: Date,
  existingIds: ReadonlySet<string>
): AwarenessDraft[] {
  const today = muscatYmd(now);
  const slots: Ymd[] = [];
  for (let back = 0; back < 14; back += 1) {
    const day = shiftDays(today, -back);
    if (SLOT_WEEKDAYS.has(day.weekday)) slots.push(day);
  }
  return slots
    .slice(0, 2)
    .filter((day) => !existingIds.has(slotId(day)))
    .map(draftFor);
}

export function classifyCommunityLink(
  raw: string
):
  | { ok: true; kind: 'zoom' | 'youtube'; url: string }
  | { ok: false; error: 'INVALID_LINK' } {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false, error: 'INVALID_LINK' };
  }
  if (url.protocol !== 'https:') return { ok: false, error: 'INVALID_LINK' };
  const host = url.hostname.toLowerCase();
  if (host === 'zoom.us' || host.endsWith('.zoom.us')) {
    return { ok: true, kind: 'zoom', url: url.toString() };
  }
  if (
    host === 'youtu.be' ||
    host === 'youtube.com' ||
    host.endsWith('.youtube.com')
  ) {
    return { ok: true, kind: 'youtube', url: url.toString() };
  }
  return { ok: false, error: 'INVALID_LINK' };
}
