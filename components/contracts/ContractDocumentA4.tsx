'use client';

import type { ContractTemplate } from '@/lib/contracts/contractTemplates';
import { formatContractForDisplay } from '@/lib/contracts/contractTemplates';
import type { SignedContractRecord } from '@/lib/contracts/contractStore';

function formatSignedAt(iso: string, isAr: boolean) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(isAr ? 'ar-AE' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * وثيقة العقد — A4 جاهزة للطباعة.
 */
export default function ContractDocumentA4({
  template,
  record,
  isAr,
}: {
  template: ContractTemplate;
  record: SignedContractRecord;
  isAr: boolean;
}) {
  const doc = formatContractForDisplay(template, isAr, {
    childName: record.childName,
    providerName: record.providerName,
    childId: record.childId,
  });

  const signatureSrc =
    record.signatureImageBase64 || record.scannedCopyBase64 || null;

  return (
    <article
      className="contract-document-sheet print-document mx-auto max-w-[210mm] bg-white p-8 font-sans text-[#1F2A37]"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <header className="border-b-2 border-[#2E7D8E] pb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2E7D8E]">
          {isAr ? 'مركز تآلف · Taaluf Center' : 'Taaluf Center · مركز تآلف'}
        </p>
        <h1 className="mt-2 text-xl font-black text-[#0b1f14]">{doc.title}</h1>
        {doc.metaLine && (
          <p className="mt-1 text-[11px] text-slate-500">{doc.metaLine}</p>
        )}
        <p className="mt-1 text-[10px] text-slate-400">
          {isAr ? 'الإصدار' : 'Version'}: {doc.version}
        </p>
      </header>

      <p className="mt-5 text-[11px] leading-7 text-slate-700">{doc.preamble}</p>

      <div className="mt-6 space-y-4">
        {doc.clauses.map((clause, idx) => (
          <section key={clause.id}>
            <h2 className="text-sm font-black text-[#0b1f14]">
              {idx + 1}. {clause.title}
            </h2>
            <p className="mt-1 text-[11px] leading-7 text-slate-700">
              {clause.body}
            </p>
          </section>
        ))}
      </div>

      <p className="mt-6 text-[11px] leading-7 text-slate-600">{doc.footer}</p>

      <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <h2 className="text-sm font-black text-[#0b1f14]">
          {isAr ? 'بيانات التوقيع' : 'Signature details'}
        </h2>
        <ul className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2">
          <li>
            <span className="font-bold text-slate-500">
              {isAr ? 'الاسم:' : 'Name:'}
            </span>{' '}
            {record.signerName || '—'}
          </li>
          <li>
            <span className="font-bold text-slate-500">
              {isAr ? 'الدور:' : 'Role:'}
            </span>{' '}
            {record.signerRole || '—'}
          </li>
          <li>
            <span className="font-bold text-slate-500">
              {isAr ? 'التاريخ والوقت:' : 'Date & time:'}
            </span>{' '}
            {formatSignedAt(record.signedAt, isAr)}
          </li>
          <li>
            <span className="font-bold text-slate-500">
              {isAr ? 'طريقة التوقيع:' : 'Signature method:'}
            </span>{' '}
            {record.status === 'signed_electronic'
              ? isAr
                ? 'إلكتروني'
                : 'Electronic'
              : record.status === 'signed_paper'
                ? isAr
                  ? 'ورقي (مسح ضوئي)'
                  : 'Paper (scanned)'
                : '—'}
          </li>
        </ul>
        {signatureSrc && (
          <div className="mt-4">
            <p className="text-[10px] font-bold text-slate-500">
              {isAr ? 'التوقيع:' : 'Signature:'}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signatureSrc}
              alt={isAr ? 'التوقيع' : 'Signature'}
              className="mt-2 max-h-24 max-w-xs rounded-lg border border-slate-200 bg-white p-2"
            />
          </div>
        )}
      </section>
    </article>
  );
}

export { formatSignedAt };
