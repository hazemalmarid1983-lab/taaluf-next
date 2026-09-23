'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { readChildPathwayRecord } from '@/lib/childPathwayRecord';
import { getActiveLdIep } from '@/lib/ldIep/store';
import { listResourceRoomSessions } from '@/lib/resourceRoom/store';
import { upcomingSessions } from '@/lib/resourceRoom/engine';
import { LD_ROUTES } from '@/lib/parentJourney';
import { listLdStudentProfiles } from '@/lib/tracks/studentProfile';
import { readLdActiveStudent } from '@/lib/tracks/trackContext';
import { TRACK_DEFINITIONS } from '@/lib/tracks/types';

export default function LdHubPage() {
  const { t, dir } = useLanguage();
  const track = TRACK_DEFINITIONS.learning_disabilities;
  const [stats, setStats] = useState({
    students: 0,
    hasScreening: false,
    hasAssessment: false,
    hasIep: false,
    upcomingSessions: 0,
  });

  useEffect(() => {
    const child = readLdActiveStudent();
    const profiles = listLdStudentProfiles();
    const record = readChildPathwayRecord(child?.id);
    const iep = child ? getActiveLdIep(child.id) : null;
    const sessions = listResourceRoomSessions(child?.id);
    const upcoming = upcomingSessions(sessions, child?.id);

    setStats({
      students: profiles.length,
      hasScreening: record.academic.available && record.academic.source === 'screening',
      hasAssessment:
        record.academic.available &&
        (record.academic.source === 'comprehensive' ||
          record.academic.source === 'assessment'),
      hasIep: !!iep,
      upcomingSessions: upcoming.length,
    });
  }, []);

  const cards = [
    {
      href: LD_ROUTES.screening,
      icon: '🔍',
      title: t('ldScreening'),
      desc: t('ldScreeningDesc'),
      done: stats.hasScreening,
    },
    {
      href: LD_ROUTES.assessment,
      icon: '📋',
      title: t('ldAssessment'),
      desc: t('ldAssessmentDesc'),
      done: stats.hasAssessment,
    },
    {
      href: LD_ROUTES.iep,
      icon: '🎯',
      title: t('ldIep'),
      desc: t('ldIepDesc'),
      done: stats.hasIep,
    },
    {
      href: LD_ROUTES.resourceRoom,
      icon: '🏫',
      title: t('ldResourceRoom'),
      desc: t('ldResourceRoomDesc'),
      done: stats.upcomingSessions > 0,
    },
    {
      href: LD_ROUTES.reports,
      icon: '📊',
      title: t('ldReports'),
      desc: t('ldReportsDesc'),
      done: stats.hasAssessment,
    },
    {
      href: LD_ROUTES.studentsNew,
      icon: '➕',
      title: t('ldNewStudent'),
      desc: t('ldNewStudentDesc'),
      done: false,
    },
  ];

  return (
    <div dir={dir}>
      <div className="mb-8 rounded-3xl border border-amber-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl sm:p-8">
        <p className="text-xs font-bold text-amber-700">{track.regulatoryLabelAr}</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
          {track.labelAr}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          {t('ldHubIntro')}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800">
            {t('ldStudentsCount', { n: String(stats.students) })}
          </span>
          {stats.upcomingSessions > 0 && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
              {t('ldUpcomingCount', { n: String(stats.upcomingSessions) })}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group relative rounded-2xl border border-white bg-white/90 p-5 shadow-sm transition hover:border-amber-200 hover:shadow-md"
          >
            {card.done && (
              <span className="absolute end-3 top-3 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                ✓
              </span>
            )}
            <span className="text-2xl">{card.icon}</span>
            <h2 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-amber-800">
              {card.title}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {card.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
