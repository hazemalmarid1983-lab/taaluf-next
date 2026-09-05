'use client';

import { FormEvent, useState } from 'react';
import {
  ADVISORY_MOU,
  HUB_MEMBERS,
  type HubActor,
  type MouOverallStatus,
  type MouState,
} from '@/lib/clinicalHub';

export default function HubMouSection({
  actor,
  mou,
  mouStatus,
  isAr,
  onSign,
  onReset,
}: {
  actor: HubActor;
  mou: MouState;
  mouStatus: MouOverallStatus;
  isAr: boolean;
  onSign: (signerName: string) => Promise<void>;
  onReset: () => Promise<void>;
}) {
  const own = actor.memberId === 'hazem' ? mou.hazem : mou.samer;
  const [signerName, setSignerName] = useState(
    isAr ? actor.nameAr : actor.nameEn
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const statusLabel =
    mouStatus === 'executed'
      ? isAr
        ? 'معتمدة ونافذة'
        : 'Executed and in force'
      : mouStatus === 'awaiting_hazem'
        ? isAr
          ? 'بانتظار تأكيد حازم'
          : 'Awaiting Hazem’s confirmation'
        : mouStatus === 'awaiting_samer'
          ? isAr
            ? 'بانتظار تأكيد د. سامر'
            : 'Awaiting Dr. Samer’s confirmation'
          : isAr
            ? 'غير موقّعة'
            : 'Unsigned';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSign(signerName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر التوقيع');
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    setError('');
    try {
      await onReset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الضبط');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-emerald-100 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#2E7D8E]">
              {isAr ? 'الشراكة والاتفاق' : 'Partnership & agreement'}
            </p>
            <h2 className="mt-2 text-xl font-bold text-[#0b1f14]">
              {isAr ? ADVISORY_MOU.titleAr : ADVISORY_MOU.titleEn}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {isAr ? 'الإصدار' : 'Version'} {ADVISORY_MOU.version} ·{' '}
              {isAr ? 'المدة سنتان' : 'Term: 2 years'}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              mouStatus === 'executed'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      <article
        className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <p className="text-sm leading-8 text-slate-700">
          {isAr ? ADVISORY_MOU.preambleAr : ADVISORY_MOU.preambleEn}
        </p>
        <div className="mt-6 space-y-5">
          {ADVISORY_MOU.clauses.map((clause, idx) => (
            <section key={clause.id}>
              <h3 className="text-sm font-black text-[#0b1f14]">
                {idx + 1}. {isAr ? clause.titleAr : clause.titleEn}
              </h3>
              <p className="mt-1 text-sm leading-8 text-slate-700">
                {isAr ? clause.bodyAr : clause.bodyEn}
              </p>
            </section>
          ))}
        </div>
        <p className="mt-6 text-sm leading-8 text-slate-600">
          {isAr ? ADVISORY_MOU.footerAr : ADVISORY_MOU.footerEn}
        </p>
      </article>

      <div className="grid gap-4 sm:grid-cols-2">
        <SignCard
          name={isAr ? HUB_MEMBERS.hazem.nameAr : HUB_MEMBERS.hazem.nameEn}
          title={isAr ? HUB_MEMBERS.hazem.titleAr : HUB_MEMBERS.hazem.titleEn}
          signed={mou.hazem.signed}
          signedAt={mou.hazem.signedAt}
          signerName={mou.hazem.signerName}
          isAr={isAr}
        />
        <SignCard
          name={isAr ? HUB_MEMBERS.samer.nameAr : HUB_MEMBERS.samer.nameEn}
          title={isAr ? HUB_MEMBERS.samer.titleAr : HUB_MEMBERS.samer.titleEn}
          signed={mou.samer.signed}
          signedAt={mou.samer.signedAt}
          signerName={mou.samer.signerName}
          isAr={isAr}
        />
      </div>

      <div className="rounded-3xl border border-emerald-100 bg-white p-6">
        {own.signed ? (
          <p className="text-sm leading-7 text-emerald-800">
            {isAr
              ? `تم تأكيد توقيعك (${own.signerName}) في ${formatWhen(own.signedAt, isAr)}.`
              : `Your sign-off (${own.signerName}) was recorded on ${formatWhen(own.signedAt, isAr)}.`}
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-sm leading-7 text-slate-600">
              {isAr
                ? 'أكتب اسمك الكامل لتأكيد الاطلاع على المذكرة والموافقة عليها.'
                : 'Enter your full name to confirm you have read and accept this memorandum.'}
            </p>
            <input
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              required
              className="w-full max-w-md rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-[#2D8B5A] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy
                ? isAr
                  ? 'جاري التأكيد…'
                  : 'Confirming…'
                : isAr
                  ? 'أؤكد التوقيع'
                  : 'Confirm sign-off'}
            </button>
          </form>
        )}

        {actor.role === 'admin' && (
          <button
            type="button"
            onClick={reset}
            disabled={busy}
            className="mt-4 text-xs font-semibold text-slate-400 underline hover:text-rose-600"
          >
            {isAr ? 'إعادة ضبط حالة التوقيع (إدارة)' : 'Reset sign-off status (admin)'}
          </button>
        )}
        {error && own.signed && (
          <p className="mt-2 text-sm text-rose-600">{error}</p>
        )}
      </div>
    </div>
  );
}

function SignCard({
  name,
  title,
  signed,
  signedAt,
  signerName,
  isAr,
}: {
  name: string;
  title: string;
  signed: boolean;
  signedAt?: string;
  signerName?: string;
  isAr: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-5 ${
        signed
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-dashed border-slate-200 bg-white'
      }`}
    >
      <p className="text-sm font-bold text-[#0b1f14]">{name}</p>
      <p className="text-xs text-slate-500">{title}</p>
      <p
        className={`mt-3 text-sm font-semibold ${
          signed ? 'text-emerald-800' : 'text-amber-700'
        }`}
      >
        {signed
          ? isAr
            ? 'تم التأكيد'
            : 'Confirmed'
          : isAr
            ? 'بانتظار التأكيد'
            : 'Awaiting confirmation'}
      </p>
      {signed && (
        <p className="mt-1 text-xs text-slate-500">
          {signerName} · {formatWhen(signedAt, isAr)}
        </p>
      )}
    </div>
  );
}

function formatWhen(iso: string | undefined, isAr: boolean) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(isAr ? 'ar' : 'en-GB');
}
