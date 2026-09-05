import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { AI_OUTPUT_PREFIX_AR } from '@/lib/legalContent';
import { isGeminiConfigured } from '@/lib/gemini';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const notes = String(body.notes || '').trim();
    if (!notes) {
      return NextResponse.json({ error: 'NOTES_REQUIRED' }, { status: 400 });
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json({
        ok: true,
        source: 'local',
        analysis: `${AI_OUTPUT_PREFIX_AR}

لاحظتَ: ${notes}

اقتراح تربوي واحد: اختر موقفاً قصيراً (دقيقتان) وأعده غداً بنفس الترتيب، وسجّل هل استجاب الطفل بإيماءة أو كلمة أو حركة. هذا ليس تشخيصاً.`,
      });
    }

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    const model = (process.env.GEMINI_MODEL || 'gemini-3.5-flash').trim();
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${AI_OUTPUT_PREFIX_AR}
اكتب فقرة تربوية قصيرة بالعربية عن ملاحظات ولي الأمر التالية، بدون تشخيص طبي:
${notes}`,
                },
              ],
            },
          ],
        }),
      }
    );
    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'تعذر توليد التحليل. استخدم الملاحظات مع المختص.';
    return NextResponse.json({
      ok: true,
      source: 'gemini',
      analysis: `${AI_OUTPUT_PREFIX_AR}\n\n${text}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'VIDEO_ANALYZE_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
