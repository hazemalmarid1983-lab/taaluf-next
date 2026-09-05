/**
 * اعتماد التقرير السريري الرسمي — تخزين محلي (قابل للربط بـ API لاحقاً).
 */

export const CLINICAL_REPORT_APPROVAL_KEY = 'taaluf.clinicalReportApproval.v1';

export type ClinicalReportApproval = {
  childId: string;
  approvedBy: string;
  approvedAt: string;
  role: string;
};

export function loadReportApproval(childId: string): ClinicalReportApproval | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CLINICAL_REPORT_APPROVAL_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, ClinicalReportApproval>) : {};
    return map[childId] ?? null;
  } catch {
    return null;
  }
}

export function saveReportApproval(record: ClinicalReportApproval) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CLINICAL_REPORT_APPROVAL_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, ClinicalReportApproval>) : {};
    map[record.childId] = record;
    localStorage.setItem(CLINICAL_REPORT_APPROVAL_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
}
