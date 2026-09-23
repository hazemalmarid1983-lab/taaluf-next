'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { computeLdAdminMetrics } from '@/lib/ldReporting/reportBuilder';
import type { LdAdminMetrics } from '@/lib/ldReporting/reportBuilder';
import { listLdIepPlans } from '@/lib/ldIep/store';
import { listResourceRoomSessions } from '@/lib/resourceRoom/store';
import { listLdStudentProfiles } from '@/lib/tracks/studentProfile';
import { LD_ROUTES } from '@/lib/parentJourney';

export default function LdAdminPage() {
  const { t, dir } = useLanguage();
  const [metrics, setMetrics] = useState<LdAdminMetrics | null>(null);

  useEffect(() => {
    const profiles = listLdStudentProfiles();
    const ieps = listLdIepPlans();
    const sessions = listResourceRoomSessions();
    setMetrics(computeLdAdminMetrics(profiles, ieps, sessions));
  }, []);

  if (!metrics) return null;

  const statCards = [
    { label: t('ldAdminStudents'), value: metrics.totalStudents },
    { label: t('ldAdminActiveIep'), value: metrics.activeIepPlans },
    { label: t('ldAdminSessionsWeek'), value: metrics.resourceRoomSessionsThisWeek },
    { label: t('ldAdminIepCompletion'), value: `${metrics.averageIepCompletion}%` },
    { label: t('ldAdminAttendance'), value: `${metrics.attendanceRate}%` },
  ];

  return (
    <div dir={dir}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900">{t('ldAdminTitle')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('ldAdminSubtitle')}</p>
        </div>
        <Link
          href={LD_ROUTES.hub}
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
        >
          {t('ldHub')}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm"
          >
            <p className="text-xs text-slate-500">{card.label}</p>
            <p className="mt-1 text-2xl font-black text-amber-800">{card.value}</p>
          </div>
        ))}
      </div>

      {metrics.domainBreakdown.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-sm font-bold text-slate-900">
            {t('ldAdminDomainBreakdown')}
          </h2>
          <div className="space-y-2">
            {metrics.domainBreakdown.map((d) => (
              <div
                key={d.domain}
                className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm"
              >
                <span className="text-slate-700">{d.domain}</span>
                <span className="font-bold text-amber-700">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
