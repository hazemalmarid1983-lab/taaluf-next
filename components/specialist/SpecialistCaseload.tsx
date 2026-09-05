'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPreviousAssessment } from '@/lib/assessmentHelpers';
import { loadGoalsLocal } from '@/lib/goalsStore';
import {
  readAcademicPathway,
  readDevelopmentalPathway,
} from '@/lib/childPathwayRecord';
import {
  addToCaseload,
  studentsForSpecialist,
  upsertLocalStudent,
  type SpecialistStudent,
} from '@/lib/specialistCaseload';
import { useLanguage } from '@/components/LanguageProvider';
import { localizeLabel } from '@/lib/i18n/pathwayLabels';

function ageFromDob(dob?: string, fallback?: number) {
  if (fallback != null && fallback > 0) return fallback;
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

export default function SpecialistCaseload() {
  const { lang, dir, t } = useLanguage();
  const { data: session } = useSession();
  const email = String(session?.user?.email || '');
  const specialistName = session?.user?.name || '';
  const [rows, setRows] = useState<SpecialistStudent[]>([]);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!email) return;
    const load = async () => {
      try {
        const res = await fetch('/api/students');
        const data = await res.json();
        const remote: SpecialistStudent[] =
          res.ok && Array.isArray(data.records)
            ? data.records.map(
                (r: { id: string; fields: Record<string, unknown> }) => ({
                  id: r.id,
                  name: String(r.fields.name || r.fields.Name || ''),
                  dob: String(r.fields.dob || r.fields.DOB || ''),
                  age: Number(r.fields.age || 0) || undefined,
                  parent_name: String(
                    r.fields.parent_name || r.fields.ParentName || ''
                  ),
                  parent_phone: String(
                    r.fields.parent_phone || r.fields.ParentPhone || ''
                  ),
                  notes: String(r.fields.notes || r.fields.Notes || ''),
                  status: String(r.fields.status || r.fields.Status || 'نشط'),
                  specialist_email: String(
                    r.fields.specialist_email || r.fields.SpecialistEmail || ''
                  ),
                })
              )
            : [];

        const adopted = studentsForSpecialist(email, remote).map((s) => {
          if (s.specialist_email) return s;
          const tagged = {
            ...s,
            specialist_email: email,
            specialist_name: specialistName,
          };
          addToCaseload(email, s.id);
          upsertLocalStudent(tagged);
          return tagged;
        });
        setRows(adopted);
        if (!adopted.length && data.message) setMsg(data.message);
      } catch {
        setRows(studentsForSpecialist(email));
        setMsg(t('loadCasesError'));
      }
    };
    void load();
  }, [email, specialistName, t]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = rows.map((s) => {
      const prev = getPreviousAssessment(s.id);
      const goals = loadGoalsLocal(s.id);
      return {
        ...s,
        ageValue: ageFromDob(s.dob, s.age),
        lastPct: prev?.percentage,
        classification: prev?.classification,
        goalsCount: goals.filter((g) => g.status === 'active').length,
      };
    });
    if (!query) return list;
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        String(s.parent_name || '').toLowerCase().includes(query)
    );
  }, [rows, q]);

  return (
    <section dir={dir} className={`space-y-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#2E7D8E]">{t('specialistPortal')}</p>
          <h1 className="mt-1 text-3xl font-bold text-[#0b1f14]">{t('myCases')}</h1>
          <p className="mt-2 text-sm leading-7 text-slate-600">{t('caseloadLead')}</p>
        </div>
        <Link href="/dashboard/students/new">
          <Button className="h-11">{t('registerNewCase')}</Button>
        </Link>
      </div>

      <Input
        placeholder={t('searchChild')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-md"
      />

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-emerald-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-600">
            {t('noCases')}
          </p>
          {msg ? <p className="mt-2 text-xs text-slate-400">{msg}</p> : null}
          <Link href="/dashboard/students/new" className="mt-4 inline-block">
            <Button variant="outline">{t('registerNewCase')}</Button>
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((s) => (
            <li key={s.id}>
              <Link
                href={`/dashboard/students/${s.id}`}
                className="block rounded-3xl border border-white/90 bg-white/85 p-5 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[#2E7D8E]/40"
                onClick={() => {
                  localStorage.setItem(
                    'taaluf.activeStudent',
                    JSON.stringify(s)
                  );
                }}
              >
                <p className="text-lg font-bold text-[#0b1f14]">
                    {s.name || t('unnamed')}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {s.ageValue != null
                      ? t('ageYears', { age: s.ageValue })
                      : t('ageUnknown')}
                    {s.parent_name ? ` · ${t('parentColon', { name: s.parent_name })}` : ''}
                  </p>
                  <p className="mt-3 text-xs font-semibold text-[#2E7D8E]">
                    {s.classification
                      ? `${t('lastAssessment', { label: localizeLabel(s.classification, lang) })}${s.lastPct != null ? ` · ${s.lastPct}%` : ''}`
                      : t('noSavedAssessment')}
                    {` · ${t('activeGoals', { n: s.goalsCount })}`}
                  </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(() => {
                    const dev = readDevelopmentalPathway(s.id);
                    const aca = readAcademicPathway(s.id);
                    return (
                      <>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            dev.available
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {t('pathDevShort')} {dev.available ? dev.scoreText : '—'}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            aca.available
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {t('pathAcaShort')} {aca.available ? aca.scoreText : '—'}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
