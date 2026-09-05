import { NextResponse } from 'next/server';
import {
  ADVISOR_PLATFORM_SECTIONS,
  advisorGuideProgress,
  type AdvisorGuideSectionId,
} from '@/lib/advisorPlatformGuide';
import { hubForbidden, requireHubActor } from '@/lib/clinicalHubApi';
import {
  acknowledgeAdvisorGuideSection,
  resetAdvisorGuide,
} from '@/lib/clinicalHubStore';

function isValidSectionId(id: string): id is AdvisorGuideSectionId {
  return ADVISOR_PLATFORM_SECTIONS.some((s) => s.id === id);
}

export async function POST(req: Request) {
  const gate = await requireHubActor();
  if ('response' in gate) return gate.response;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      sectionId?: string;
      signerName?: string;
    };
    const action = String(body.action || 'acknowledge');

    if (action === 'reset') {
      if (gate.actor.role !== 'admin') {
        return hubForbidden('إعادة ضبط الدليل محصورة بالمشرف العام');
      }
      const advisorGuide = await resetAdvisorGuide();
      return NextResponse.json({
        ok: true,
        advisorGuide,
        guideProgress: advisorGuideProgress(advisorGuide),
      });
    }

    if (gate.actor.role !== 'scientific_advisor') {
      return hubForbidden('اعتماد أقسام الدليل محصور بالمستشار العلمي');
    }

    const sectionId = String(body.sectionId || '');
    if (!isValidSectionId(sectionId)) {
      return NextResponse.json({ error: 'INVALID_SECTION' }, { status: 400 });
    }

    const signerName = String(body.signerName || '').trim();
    if (!signerName) {
      return NextResponse.json({ error: 'SIGNER_REQUIRED' }, { status: 400 });
    }

    const advisorGuide = await acknowledgeAdvisorGuideSection(
      sectionId,
      signerName
    );
    return NextResponse.json({
      ok: true,
      advisorGuide,
      guideProgress: advisorGuideProgress(advisorGuide),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'GUIDE_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
