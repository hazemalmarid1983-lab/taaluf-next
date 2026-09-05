import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

/**
 * نطق عربي مضمون للغرفة الصفية المنزلية والألعاب.
 * يعمل حتى لو خلا نظام تشغيل ولي الأمر من حزم أصوات عربية،
 * لأن الصوت يُجلب من الخدمة ولا يُولَّد على جهازه.
 */
const TTS_ENDPOINT = 'https://translate.google.com/translate_tts';

/** الخدمة ترفض النصوص الأطول من ذلك، وكلماتنا وعباراتنا التوجيهية أقصر بكثير */
const MAX_TEXT_LENGTH = 200;

const DAY_IN_SECONDS = 60 * 60 * 24;

/** لغات الواجهة فقط — نمنع تمرير أي قيمة أخرى إلى الخدمة الخارجية */
const SUPPORTED_LANGS = ['ar', 'en'] as const;

function clampSpeed(raw: string | null) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.min(1, Math.max(0.3, value));
}

function resolveLang(raw: string | null) {
  const value = (raw || '').toLowerCase().slice(0, 2);
  return SUPPORTED_LANGS.find((lang) => lang === value) || 'ar';
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const params = new URL(req.url).searchParams;
  const text = (params.get('text') || '').trim();

  if (!text) {
    return NextResponse.json({ error: 'TEXT_REQUIRED' }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: 'TEXT_TOO_LONG' }, { status: 413 });
  }

  const speed = clampSpeed(params.get('speed'));
  const lang = resolveLang(params.get('tl'));
  const source = `${TTS_ENDPOINT}?ie=UTF-8&q=${encodeURIComponent(
    text
  )}&tl=${lang}&client=tw-ob&ttsspeed=${speed}`;

  try {
    const upstream = await fetch(source, {
      headers: {
        // الخدمة ترد 403 على الطلبات التي لا تحمل ترويسة متصفح
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept-Language': lang,
        Referer: 'https://translate.google.com/',
      },
      // الكلمة نفسها تُنطق دائماً بالصوت ذاته، فالتخزين يقلّل الطلبات الخارجية
      next: { revalidate: DAY_IN_SECONDS },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: 'TTS_UPSTREAM_FAILED', status: upstream.status },
        { status: 502 }
      );
    }

    const audio = await upstream.arrayBuffer();
    if (!audio.byteLength) {
      return NextResponse.json({ error: 'TTS_EMPTY_AUDIO' }, { status: 502 });
    }

    return new NextResponse(audio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audio.byteLength),
        'Cache-Control': `private, max-age=${DAY_IN_SECONDS}`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'TTS_FETCH_FAILED' }, { status: 502 });
  }
}
