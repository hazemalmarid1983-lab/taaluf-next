'use client';

import { useMemo, useState } from 'react';
import ContractDocumentA4, {
  formatSignedAt,
} from '@/components/contracts/ContractDocumentA4';
import ContractSignModal, {
  PRINT_BODY_CLASS,
} from '@/components/contracts/ContractSignModal';
import { getContractTemplate } from '@/lib/contracts/contractTemplates';
import {
  isContractSigned,
  loadContract,
  type SignedContractRecord,
} from '@/lib/contracts/contractStore';

/**
 * بطاقة «الاتفاقية المعتمدة» — أرشيف العقد في ملف الطفل.
 */
export default function ContractArchiveCard({
  childId,
  childName,
  isAr,
}: {
  childId: string;
  childName?: string;
  isAr: boolean;
}) {
  const [refresh, setRefresh] = useState(0);
  const [printOpen, setPrintOpen] = useState(false);
  const [signOpen, setSignOpen] = useState(false);

  const record = useMemo(() => {
    void refresh;
    return loadContract(childId, 'parent');
  }, [childId, refresh]);

  const signed = isContractSigned(childId, 'parent');
  const template = getContractTemplate('parent');

  const handlePrint = () => {
    if (!record) return;
    const originalTitle = document.title;
    document.title = isAr ? `اتفاقية_${childName || childId}` : `Agreement_${childName || childId}`;
    document.body.classList.add(PRINT_BODY_CLASS);
    setPrintOpen(true);
    window.setTimeout(() => {
      window.print();
      window.setTimeout(() => {
        document.title = originalTitle;
        document.body.classList.remove(PRINT_BODY_CLASS);
        setPrintOpen(false);
      }, 500);
    }, 100);
  };

  return (
    <div
      className={`rounded-3xl border border-white/90 bg-white/85 p-6 backdrop-blur-xl ${
        isAr ? 'text-right' : 'text-left'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#2E7D8E]">
            {isAr ? 'الاتفاقية المعتمدة' : 'Approved agreement'}
          </p>
          <h2 className="mt-1 text-lg font-black text-[#0b1f14]">
            {isAr ? 'عقد ولي الأمر' : 'Parent agreement'}
          </h2>
        </div>
        {signed && record ? (
          <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-800">
            {record.status === 'signed_electronic'
              ? isAr
                ? '✓ موقّع إلكترونياً'
                : '✓ E-signed'
              : isAr
                ? '✓ موقّع ورقياً'
                : '✓ Paper signed'}
          </span>
        ) : (
          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[10px] font-black text-amber-800">
            {isAr ? '⏳ بانتظار التوقيع' : '⏳ Pending signature'}
          </span>
        )}
      </div>

      {signed && record ? (
        <>
          <ul className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
            <li>
              <span className="font-bold text-slate-500">
                {isAr ? 'الموقّع:' : 'Signed by:'}
              </span>{' '}
              {record.signerName}
            </li>
            <li>
              <span className="font-bold text-slate-500">
                {isAr ? 'الدور:' : 'Role:'}
              </span>{' '}
              {record.signerRole}
            </li>
            <li className="sm:col-span-2">
              <span className="font-bold text-slate-500">
                {isAr ? 'تاريخ التوقيع:' : 'Signed at:'}
              </span>{' '}
              {formatSignedAt(record.signedAt, isAr)}
            </li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-2xl bg-[#2E7D8E] px-4 py-2 text-xs font-black text-white shadow-md hover:bg-[#236372]"
            >
              {isAr ? '🖨️ طباعة A4 رسمية' : '🖨️ Print official A4'}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-xs leading-6 text-slate-500">
            {isAr
              ? 'لم تُوقَّع اتفاقية ولي الأمر بعد. يُطلب التوقيع قبل الجلسات المنزلية وتصدير التقرير النهائي.'
              : 'Parent agreement not signed yet. Required before home sessions and final report export.'}
          </p>
          <button
            type="button"
            onClick={() => setSignOpen(true)}
            className="mt-4 rounded-2xl bg-amber-500 px-4 py-2 text-xs font-black text-slate-900 hover:bg-amber-400"
          >
            {isAr ? '✍️ توقيع الاتفاقية' : '✍️ Sign agreement'}
          </button>
        </>
      )}

      <ContractSignModal
        open={signOpen}
        onClose={() => setSignOpen(false)}
        childId={childId}
        childName={childName}
        contractType="parent"
        signerRoleDefault={isAr ? 'ولي أمر' : 'Parent'}
        isAr={isAr}
        onSigned={() => {
          setRefresh((n) => n + 1);
          setSignOpen(false);
        }}
      />

      {printOpen && record && (
        <div className="pointer-events-none fixed inset-0 z-[300] overflow-y-auto bg-white p-8 print:pointer-events-auto print:static">
          <ContractDocumentA4
            template={template}
            record={record}
            isAr={isAr}
          />
        </div>
      )}
    </div>
  );
}

export type { SignedContractRecord };
