import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import type { PortalRole } from '@/lib/access';
import { buildMerhidPlatformKnowledge } from '@/lib/advisorPlatformGuide';
import { authOptions } from '@/lib/auth';
import { merhidLocalReply, merhidSystemPrompt, MERHID_NAME } from '@/lib/merhid';
import { getOpenAI, isOpenAIConfigured } from '@/lib/openai';
import { sanitizeDiagnosticLanguage } from '@/lib/reportLanguage';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = await req.json();
  const message = String(body.message || '').trim();
  const scope = (body.scope || session.user.role || 'specialist') as
    | PortalRole
    | 'admin';
  const hubDirectives =
    body.hubDirectives != null ? String(body.hubDirectives) : undefined;
  const promptOptions =
    scope === 'scientific_advisor'
      ? {
          hubDirectives,
          platformKnowledge: buildMerhidPlatformKnowledge(true),
        }
      : undefined;
  const localOptions =
    scope === 'scientific_advisor' ? { hubDirectives } : undefined;

  if (!message) {
    return NextResponse.json({ error: 'EMPTY' }, { status: 400 });
  }

  // الأهل والمختص: رفض صريح لمواضيع خارجة شائعة قبل النموذج
  if (scope !== 'admin') {
    const offTopic =
      /وصفة طبخ|سعر البيتكوين|برمجة بايثون|كود جافا|انتخابات|مراهنة/i.test(
        message
      );
    if (offTopic) {
      return NextResponse.json({
        ok: true,
        name: MERHID_NAME,
        reply: merhidLocalReply(scope, message, localOptions),
        source: 'guard',
      });
    }
  }

  if (!isOpenAIConfigured()) {
    return NextResponse.json({
      ok: true,
      name: MERHID_NAME,
      reply: merhidLocalReply(scope, message, localOptions),
      source: 'local',
    });
  }

  try {
    const client = getOpenAI();
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: scope === 'admin' ? 0.6 : 0.35,
      messages: [
        { role: 'system', content: merhidSystemPrompt(scope, promptOptions) },
        { role: 'user', content: message },
      ],
    });
    const reply = sanitizeDiagnosticLanguage(
      completion.choices[0]?.message?.content ||
        merhidLocalReply(scope, message, localOptions)
    );
    return NextResponse.json({
      ok: true,
      name: MERHID_NAME,
      reply,
      source: 'openai',
    });
  } catch {
    return NextResponse.json({
      ok: true,
      name: MERHID_NAME,
      reply: merhidLocalReply(scope, message, localOptions),
      source: 'local-fallback',
    });
  }
}
