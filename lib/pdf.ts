import { ArabicShaper } from 'arabic-persian-reshaper';
import { jsPDF } from 'jspdf';
import { CLOSING_NEXT_STEP_AR, DISCLAIMER_AR } from '@/lib/content';
import { PDF_FOOTER_LEGAL_AR } from '@/lib/legalContent';
import { SOURCE_LABEL_AR } from '@/lib/fusion';
import type { ProposedGoal } from '@/lib/goalsEngine';
import type { AiAnalysisPayload } from '@/lib/openai';
import type { AssessmentResult } from '@/types/taalof';
import { CRITERIA_LIST } from '@/types/taalof';

const FONT_PATH = '/fonts/NotoNaskhArabic-Regular.ttf';
const FONT_NAME = 'NotoNaskhArabic';

let fontBase64Cache: string | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode.apply(null, Array.from(slice) as number[]);
  }
  return btoa(binary);
}

async function loadArabicFontBase64() {
  if (fontBase64Cache) return fontBase64Cache;
  const res = await fetch(FONT_PATH);
  if (!res.ok) throw new Error('تعذر تحميل الخط العربي للتقرير');
  fontBase64Cache = arrayBufferToBase64(await res.arrayBuffer());
  return fontBase64Cache;
}

/**
 * jsPDF يرسم يسار→يمين: نعيد التشكيل ثم نعكس الحروف
 * بدون bidi إضافي (كان يسبب قلباً مزدوجاً وتشويهاً).
 */
function prepareArabic(text: string) {
  const raw = String(text ?? '');
  if (!raw.trim()) return '';
  try {
    const reshaped = ArabicShaper.convertArabic(raw);
    return reshaped.split('').reverse().join('');
  } catch {
    return raw.split('').reverse().join('');
  }
}

function ensureArabicFont(doc: jsPDF, base64: string) {
  doc.addFileToVFS(`${FONT_NAME}.ttf`, base64);
  doc.addFont(`${FONT_NAME}.ttf`, FONT_NAME, 'normal');
  doc.setFont(FONT_NAME, 'normal');
}

function wrapLogical(text: string, maxChars: number): string[] {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

export async function buildAssessmentPdf(input: {
  studentName: string;
  childAge?: number;
  result: AssessmentResult;
  ai?: AiAnalysisPayload | null;
  goals?: ProposedGoal[];
  nextAssessmentDate?: string;
  comparison?: {
    previousPercentage: number;
    delta: number;
    improved: boolean;
  } | null;
  domainSources?: Record<string, string[]>;
}) {
  const fontBase64 = await loadArabicFontBase64();
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  ensureArabicFont(doc, fontBase64);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const contentWidth = pageWidth - margin * 2;
  const charsPerLine = 58;
  let y = margin;

  const PDF_DISCLAIMER = PDF_FOOTER_LEGAL_AR;

  const paintFooter = (pageNumber: number) => {
    ensureArabicFont(doc, fontBase64);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const footerLines = wrapLogical(PDF_DISCLAIMER, 70);
    let fy = pageHeight - 28 - (footerLines.length - 1) * 10;
    for (const logical of footerLines) {
      doc.text(prepareArabic(logical), pageWidth / 2, fy, { align: 'center' });
      fy += 10;
    }
    doc.text(String(pageNumber), margin, pageHeight - 16);
    doc.setTextColor(15, 23, 42);
  };

  const newPageIfNeeded = (need = 40) => {
    if (y > pageHeight - need - 36) {
      doc.addPage();
      ensureArabicFont(doc, fontBase64);
      y = margin;
    }
  };

  const paintHeader = () => {
    doc.setFillColor(45, 139, 90);
    doc.rect(0, 0, pageWidth, 72, 'F');
    ensureArabicFont(doc, fontBase64);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(prepareArabic('تقرير تقييم تآلف التربوي'), pageWidth - margin, 34, {
      align: 'right',
    });
    doc.setFontSize(10);
    doc.text(
      prepareArabic('ملامح سلوكية واستراتيجيات — بلا تشخيص طبي'),
      pageWidth - margin,
      54,
      { align: 'right' }
    );
    doc.setTextColor(15, 23, 42);
    y = 96;
  };

  const sectionTitle = (title: string) => {
    newPageIfNeeded(50);
    doc.setFillColor(240, 249, 244);
    doc.roundedRect(margin, y - 4, contentWidth, 22, 4, 4, 'F');
    ensureArabicFont(doc, fontBase64);
    doc.setFontSize(12);
    doc.setTextColor(45, 139, 90);
    doc.text(prepareArabic(title), pageWidth - margin - 8, y + 11, {
      align: 'right',
    });
    doc.setTextColor(15, 23, 42);
    y += 34;
  };

  const line = (text: string, size = 11, gap = 4) => {
    ensureArabicFont(doc, fontBase64);
    doc.setFontSize(size);
    const logicalLines = wrapLogical(text, charsPerLine);
    for (const logical of logicalLines) {
      newPageIfNeeded(size + 16);
      doc.text(prepareArabic(logical), pageWidth - margin, y, {
        align: 'right',
      });
      y += size + 5;
    }
    y += gap;
  };

  paintHeader();
  line(DISCLAIMER_AR, 9, 8);

  const dateAr = new Date(input.result.assessmentDate).toLocaleString('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  sectionTitle('بيانات الطالب والنتيجة');
  line(`الطالب: ${input.studentName}`);
  if (input.childAge != null) line(`العمر: ${input.childAge} سنة`);
  line(`تاريخ التقييم: ${dateAr}`);
  line(
    `النتيجة: ${input.result.totalScore} من ${input.result.maxScore}  |  ${input.result.percentage}%  |  التصنيف: ${input.result.classification}`
  );
  if (input.nextAssessmentDate) {
    line(`موعد التقييم القادم: ${input.nextAssessmentDate}`);
  }
  if (input.comparison) {
    const status = input.comparison.improved
      ? 'تحسّن'
      : input.comparison.delta > 0
        ? 'تراجع'
        : 'بدون تغيير';
    line(
      `مقارنة مع السابق: ${input.comparison.previousPercentage}% إلى ${input.result.percentage}% (${status})`
    );
  }

  sectionTitle('متوسط المجالات');
  Object.entries(input.result.domainAverages).forEach(([domain, avg]) => {
    line(`${domain}: ${avg.toFixed(2)} من 3`);
  });

  if (input.domainSources && Object.keys(input.domainSources).length) {
    sectionTitle('مصادر التقييم');
    Object.entries(input.domainSources).forEach(([domain, sources]) => {
      if (!sources?.length) return;
      const labels = sources
        .map((s) => SOURCE_LABEL_AR[s] || s)
        .join(' · ');
      line(`${domain}: ${labels}`, 10, 3);
    });
  }

  if (input.goals?.length) {
    sectionTitle('الأهداف المقترحة للعمل مع الطالب');
    input.goals.forEach((g, i) => {
      line(`${i + 1}. [${g.priority}] ${g.title} — درجة ${g.score}/3`);
      line(`المجال: ${g.domain}`, 10, 2);
      line(`لماذا: ${g.why}`, 10, 2);
      line(`استراتيجية: ${g.strategy}`, 10, 8);
    });
  }

  if (input.ai) {
    sectionTitle('تحليل الذكاء الاصطناعي (تربوي)');
    line(input.ai.analysis);
    if (input.ai.strengths?.length) {
      line('نقاط القوة:', 11, 2);
      input.ai.strengths.forEach((s) => line(`• ${s}`, 10, 2));
    }
    if (input.ai.weaknesses?.length) {
      line('مجالات التركيز:', 11, 2);
      input.ai.weaknesses.forEach((s) => line(`• ${s}`, 10, 2));
    }
    if (input.ai.intervention_plan) {
      line('خطة التدخل:', 11, 2);
      line(input.ai.intervention_plan, 10, 6);
    }
    const labels: Record<string, string> = {
      special_education: 'تربية خاصة',
      speech: 'نطق وتخاطب',
      psychological: 'نفسي/تربوي',
      occupational: 'وظيفي',
    };
    Object.entries(input.ai.recommendations || {}).forEach(([key, val]) => {
      if (!val) return;
      line(`${labels[key] || key}: ${val}`, 10, 4);
    });
  }

  sectionTitle('درجات المؤشرات');
  input.result.scores.forEach((s) => {
    const c = CRITERIA_LIST.find((x) => x.id === s.criterionId);
    line(`${s.criterionId} — ${c?.name || ''}: ${s.score}/3`, 10, 2);
    if (s.specialistNotes) line(`ملاحظة: ${s.specialistNotes}`, 9, 4);
  });

  line(CLOSING_NEXT_STEP_AR, 10, 6);
  line(
    'للحاجة لتقييم أكثر شمولية: يُنصح بحجز موعد مع فريق متعدد التخصصات عبر المنصة.',
    9,
    0
  );

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    paintFooter(i);
  }

  return doc;
}

export async function downloadAssessmentPdf(
  filename: string,
  input: Parameters<typeof buildAssessmentPdf>[0]
) {
  const doc = await buildAssessmentPdf(input);
  doc.save(filename);
}
