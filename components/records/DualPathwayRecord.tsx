'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import {
  readChildPathwayRecord,
  type ChildPathwayRecord,
  type PathwayLevel,
  type PathwaySnapshot,
} from '@/lib/childPathwayRecord';
import { localizeLabel } from '@/lib/i18n/pathwayLabels';
import { PARENT_ROUTES } from '@/lib/parentJourney';
import PdfExportButton from '@/components/reports/PdfExportButton';

function levelStyle(level: PathwayLevel) {
  if (level === 'high') return 'bg-rose-100 text-rose-800';
  if (level === 'moderate') return 'bg-amber-100 text-amber-800';
  if (level === 'low') return 'bg-emerald-100 text-emerald-800';
  return 'bg-slate-100 text-slate-500';
}

function PathwayCard({
  snapshot,
  accent,
}: {
  snapshot: PathwaySnapshot;
  accent: 'teal' | 'amber';
}) {
  const { lang, dir, t } = useLanguage();
  const border =
    accent === 'teal'
      ? 'border-teal-200/80 bg-teal-50/40'
      : 'border-amber-200/80 bg-amber-50/40';
  const emptySummary =
    snapshot.kind === 'developmental' ? t('noDevScreening') : t('noAcaScreening');
  return (
    <article
      dir={dir}
      className={`space-y-3 rounded-2xl border p-5 backdrop-blur-xl ${border} ${
        dir === 'rtl' ? 'text-right' : 'text-left'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-500">
            {snapshot.kind === 'developmental' ? t('pathDevShort') : t('pathAcaShort')}
          </p>
          <h3 className="mt-1 text-base font-bold text-slate-900">
            {localizeLabel(snapshot.title, lang)}
          </h3>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${levelStyle(snapshot.level)}`}
        >
          {snapshot.available ? snapshot.scoreText : t('incomplete')}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-slate-600">
        {snapshot.available ? localizeLabel(snapshot.summary, lang) : emptySummary}
      </p>
      {snapshot.domains.length > 0 && (
        <ul className="grid grid-cols-2 gap-2">
          {snapshot.domains.slice(0, 4).map((d) => (
            <li
              key={d.label}
              className="rounded-xl bg-white/80 px-2.5 py-2 text-[11px] text-slate-600"
            >
              <span className="block text-slate-400">{localizeLabel(d.label, lang)}</span>
              <strong className="text-slate-800">{d.value}</strong>
            </li>
          ))}
        </ul>
      )}
      <Link
        href={snapshot.href}
        className={`inline-block text-xs font-bold ${
          accent === 'teal' ? 'text-[#2E7D8E]' : 'text-amber-800'
        }`}
      >
        {snapshot.available ? t('viewDetails') : t('startThisPath')}
      </Link>
    </article>
  );
}

export default function DualPathwayRecord({
  childId,
  childName,
}: {
  childId?: string;
  childName?: string;
}) {
  const { lang, dir, t } = useLanguage();
  const [record, setRecord] = useState<ChildPathwayRecord | null>(null);

  useEffect(() => {
    setRecord(readChildPathwayRecord(childId));
  }, [childId]);

  if (!record) {
    return <p className="text-sm text-slate-500">{t('preparingRecord')}</p>;
  }

  const name = childName || record.childName || t('childFallback');

  return (
    <section
      dir={dir}
      className={`print-document space-y-4 rounded-3xl border border-white/90 bg-white/85 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl print:bg-white print:p-0 print:shadow-none sm:p-8 ${
        dir === 'rtl' ? 'text-right' : 'text-left'
      }`}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[#2E7D8E]">{t('cumulativeRecord')}</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">{name}</h2>
          <p className="mt-1 text-xs text-slate-500">{t('recordLead')}</p>
        </div>
        <div className="flex w-full flex-col gap-2 print:hidden sm:w-auto">
          <PdfExportButton
            documentTitle={`السجل_التراكمي_${name}`}
            label="تنزيل التقرير / بطاقة الدعم (PDF) 📥"
            className="h-12 w-full rounded-2xl bg-amber-500 text-sm font-black text-slate-900 hover:bg-amber-400 hover:text-slate-900"
          />
          <Link
            href={PARENT_ROUTES.pathways}
            className="rounded-xl bg-[#2E7D8E] px-4 py-2 text-xs font-bold text-white"
          >
            {t('pathwaysPortal')}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PathwayCard snapshot={record.developmental} accent="teal" />
        <PathwayCard snapshot={record.academic} accent="amber" />
      </div>

      {record.games.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-xs font-bold text-slate-600">{t('linkedGames')}</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {record.games.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs"
              >
                <span className="font-semibold text-slate-800">
                  {g.pathway === 'developmental' ? '🌱' : '📚'}{' '}
                  {localizeLabel(g.title, lang)}
                </span>
                <span className="text-slate-500">{localizeLabel(g.detail, lang)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
