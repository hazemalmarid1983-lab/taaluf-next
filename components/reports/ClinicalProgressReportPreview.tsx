'use client';

import { useEffect, useState } from 'react';
import PermissionGate from '@/components/access/PermissionGate';
import { usePermissions } from '@/components/access/PermissionsProvider';
import ClinicalProgressReportDocument from '@/components/reports/ClinicalProgressReportDocument';
import type { ClinicalProgressReport } from '@/lib/clinicalReportAggregator';
import {
  loadReportApproval,
  saveReportApproval,
} from '@/lib/clinicalReportApproval';
import { assertContractSigned } from '@/lib/contracts/contractGate';

const PRINT_BODY_CLASS = 'printing-clinical-report';

/**
 * معاينة سريعة + طباعة/تحميل PDF للتقرير السريري الشامل.
 */
export default function ClinicalProgressReportPreview({
  open,
  onClose,
  report,
  isAr,
}: {
  open: boolean;
  onClose: () => void;
  report: ClinicalProgressReport | null;
  isAr: boolean;
}) {
  const { role, sessionRole } = usePermissions();
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (!open || !report) return;
    setApproved(Boolean(loadReportApproval(report.meta.childId)));
  }, [open, report]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !report) return null;

  const handlePrint = () => {
    if (!assertContractSigned(report.meta.childId, 'clinical_report_export')) {
      window.alert(
        isAr
          ? 'يُرجى توقيع اتفاقية ولي الأمر قبل طباعة التقرير النهائي.'
          : 'Please sign the parent agreement before printing the final report.'
      );
      return;
    }
    const originalTitle = document.title;
    document.title = `تقرير_سريري_${report.meta.childName}`;
    document.body.classList.add(PRINT_BODY_CLASS);

    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      document.title = originalTitle;
      document.body.classList.remove(PRINT_BODY_CLASS);
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.print();
    window.setTimeout(restore, 1500);
  };

  const handleApprove = () => {
    saveReportApproval({
      childId: report.meta.childId,
      approvedBy: report.meta.specialistName,
      approvedAt: new Date().toISOString(),
      role,
    });
    setApproved(true);
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black/50 print:hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-900 px-4 py-3 text-white">
        <div>
          <strong className="text-sm font-black">
            {isAr ? 'معاينة التقرير السريري' : 'Clinical report preview'}
          </strong>
          {approved && (
            <span className="ms-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              {isAr ? '✓ معتمد رسمياً' : '✓ Officially approved'}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <PermissionGate permission="export_clinical_report">
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-xl bg-[#2E7D8E] px-4 py-2 text-xs font-black shadow-md hover:bg-[#236372]"
            >
              {isAr ? '🖨️ طباعة / PDF' : '🖨️ Print / PDF'}
            </button>
          </PermissionGate>
          <PermissionGate permission="approve_clinical_report">
            {!approved && (
              <button
                type="button"
                onClick={handleApprove}
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-slate-900 shadow-md hover:bg-amber-400"
              >
                {isAr ? '🛡️ اعتماد التقرير الرسمي' : '🛡️ Approve official report'}
              </button>
            )}
          </PermissionGate>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/20 px-4 py-2 text-xs font-bold"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-8">
        <ClinicalProgressReportDocument
          report={report}
          isAr={isAr}
          approved={approved}
          approverRole={sessionRole || role}
        />
      </div>
    </div>
  );
}

export { PRINT_BODY_CLASS };
