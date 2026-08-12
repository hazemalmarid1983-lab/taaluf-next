import OpenAI from 'openai';
import {
  PARENT_REPORT_CONSTITUTION_AR,
  sanitizeAiPayload,
} from '@/lib/reportLanguage';
import {
  CRITERIA_LIST,
  type AssessmentScore,
  type AssessmentResult,
} from '@/types';

const apiKey = process.env.OPENAI_API_KEY || '';

export function getOpenAI() {
  if (!apiKey) {
    throw new Error('OPENAI_NOT_CONFIGURED: عيّن OPENAI_API_KEY');
  }
  return new OpenAI({ apiKey });
}

export function isOpenAIConfigured() {
  return Boolean(apiKey);
}

export type AiAnalysisPayload = {
  analysis: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: {
    special_education: string;
    speech: string;
    psychological: string;
    occupational: string;
  };
  intervention_plan: string;
  confidence: number;
};

export async function analyzeAssessment(input: {
  studentName?: string;
  childAge?: number;
  scores: AssessmentScore[];
  result: AssessmentResult | {
    percentage: number;
    classification: string | { label: string };
    domainAverages: Record<string, number>;
  };
}): Promise<AiAnalysisPayload> {
  const client = getOpenAI();
  const scored = input.scores.map((s) => {
    const c = CRITERIA_LIST.find((x) => x.id === s.criterionId);
    return {
      id: s.criterionId,
      name: c?.name,
      domain: c?.domain,
      score: s.score,
      level: c?.levels[String(s.score) as '0' | '1' | '2' | '3']?.label,
    };
  });

  const system = `${PARENT_REPORT_CONSTITUTION_AR}

أرجع JSON فقط بالمفاتيح المطلوبة.
حقل analysis يجب أن يحتوي التقرير الكامل بهيكله الإلزامي.
schema:
{
  "analysis": "التقرير التوجيهي الكامل",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": {
    "special_education": "...",
    "speech": "...",
    "psychological": "...",
    "occupational": "..."
  },
  "intervention_plan": "...",
  "confidence": 0.0
}`;

  const user = JSON.stringify({
    studentName: input.studentName || 'الطفل',
    childAge: input.childAge ?? null,
    percentage: input.result.percentage,
    classification:
      typeof input.result.classification === 'string'
        ? input.result.classification
        : input.result.classification.label,
    domainAverages: input.result.domainAverages,
    mostAffectedDomains: Object.entries(input.result.domainAverages || {})
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 5),
    scores: scored,
  });

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  const raw = completion.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(raw) as AiAnalysisPayload;
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
