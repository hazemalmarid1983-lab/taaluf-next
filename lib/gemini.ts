/**
 * عميل Gemini لكتابة التقرير التوجيهي وفق دستور تآلف.
 */

import {
  PARENT_REPORT_CONSTITUTION_AR,
  sanitizeAiPayload,
} from '@/lib/reportLanguage';
import {
  CRITERIA_LIST,
  type AssessmentScore,
  type AssessmentResult,
} from '@/types';
import type { AiAnalysisPayload } from '@/lib/openai';

const apiKey = (process.env.GEMINI_API_KEY || '').trim();
const model = (process.env.GEMINI_MODEL || 'gemini-3.5-flash').trim();

export function isGeminiConfigured() {
  return Boolean(apiKey);
}

function extractJson(text: string): AiAnalysisPayload {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1]?.trim() || trimmed;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  const slice = start >= 0 && end > start ? raw.slice(start, end + 1) : raw;
  return JSON.parse(slice) as AiAnalysisPayload;
}

export async function analyzeAssessmentWithGemini(input: {
  studentName?: string;
  childAge?: number;
  parentNotes?: string;
  scores: AssessmentScore[];
  result:
    | AssessmentResult
    | {
        percentage: number;
        classification: string | { label: string };
        domainAverages: Record<string, number>;
      };
}): Promise<AiAnalysisPayload> {
  if (!apiKey) {
    throw new Error('GEMINI_NOT_CONFIGURED: عيّن GEMINI_API_KEY');
  }

  const scored = input.scores.map((s) => {
    const c = CRITERIA_LIST.find((x) => x.id === s.criterionId);
    return {
      id: s.criterionId,
      name: c?.name,
      domain: c?.domain,
      score: s.score,
      level: c?.levels[String(s.score) as '0' | '1' | '2' | '3']?.label,
      description: c?.levels[String(s.score) as '0' | '1' | '2' | '3']?.description,
    };
  });

  const domainAverages = input.result.domainAverages || {};
  const affectedDomains = Object.entries(domainAverages)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 5)
    .map(([domain, avg]) => ({ domain, average: avg }));

  const system = `${PARENT_REPORT_CONSTITUTION_AR}

أرجع JSON فقط (بدون Markdown) بالمفاتيح التالية:
{
  "analysis": "النص الكامل للتقرير التوجيهي بهيكله الإلزامي أعلاه (عنوان، مقدمة، ملامح عامة، تفاصيل تخصصية، توصيات عملية، رسالة ختامية)",
  "strengths": ["نقاط قوة قصيرة"],
  "weaknesses": ["مجالات تركيز قصيرة"],
  "recommendations": {
    "special_education": "توصية تربية خاصة/سلوك",
    "speech": "توصية نطق وتواصل",
    "psychological": "توصية نفسية/انتباه (تربوية)",
    "occupational": "توصية حسية/حركية"
  },
  "intervention_plan": "ملخص خطة العمل المنزلية في فقرة قصيرة",
  "confidence": 0.0
}`;

  const userPayload = {
    studentName: input.studentName || 'الطفل',
    childAge: input.childAge ?? null,
    parentNotes: input.parentNotes || null,
    percentage: input.result.percentage,
    classification:
      typeof input.result.classification === 'string'
        ? input.result.classification
        : input.result.classification.label,
    domainAverages,
    mostAffectedDomains: affectedDomains,
    scores: scored,
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `حلل البيانات التالية واكتب التقرير وفق الدستور:\n${JSON.stringify(
                userPayload,
                null,
                2
              )}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`GEMINI_HTTP_${res.status}: ${errText.slice(0, 240)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') ||
    '{}';

  const parsed = extractJson(text);
  return sanitizeAiPayload({
    analysis: parsed.analysis || '',
    strengths: parsed.strengths || [],
    weaknesses: parsed.weaknesses || [],
    recommendations: {
      special_education: parsed.recommendations?.special_education || '',
      speech: parsed.recommendations?.speech || '',
      psychological: parsed.recommendations?.psychological || '',
      occupational: parsed.recommendations?.occupational || '',
    },
    intervention_plan: parsed.intervention_plan || '',
    confidence: Number(parsed.confidence ?? 0.7),
  });
}
