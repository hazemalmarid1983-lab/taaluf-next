'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/components/LanguageProvider';
import { LD_ROUTES } from '@/lib/parentJourney';
import {
  createLdStudentProfile,
  GRADE_LEVEL_LABELS,
  type LdGradeLevel,
} from '@/lib/tracks/studentProfile';
import { saveLdActiveStudent } from '@/lib/tracks/trackContext';

function computeAge(dob: string) {
  if (!dob) return 0;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age > 0 ? age : 0;
}

const GRADES = Object.keys(GRADE_LEVEL_LABELS) as LdGradeLevel[];

export default function LdNewStudentPage() {
  const { t, dir } = useLanguage();
  const router = useRouter();
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [gradeLevel, setGradeLevel] = useState<LdGradeLevel>('grade1');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const age = useMemo(() => computeAge(dob), [dob]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dob) return;
    setLoading(true);

    const id = `ld_${Date.now()}`;
    const profile = createLdStudentProfile({
      id,
      name: name.trim(),
      dob,
      age,
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      schoolName: schoolName.trim(),
      gradeLevel,
      specialistEmail: String(session?.user?.email || ''),
      notes: notes.trim(),
    });

    saveLdActiveStudent({
      id: profile.id,
      name: profile.name,
      age: profile.age,
      dob: profile.dob,
    });

    router.push(LD_ROUTES.hub);
  };

  return (
    <div className="mx-auto max-w-lg" dir={dir}>
      <h1 className="text-xl font-black text-slate-900">{t('ldNewStudent')}</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500">{t('ldNewStudentSubtitle')}</p>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-amber-100 bg-white p-6 shadow-sm"
      >
        <div>
          <Label htmlFor="name">{t('childName')}</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="dob">{t('childDob')}</Label>
          <Input
            id="dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
            className="mt-1"
          />
          {age > 0 && (
            <p className="mt-1 text-xs text-slate-400">
              {t('computedAge', { age: String(age) })}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="school">{t('ldSchoolName')}</Label>
          <Input
            id="school"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="grade">{t('ldGradeLevel')}</Label>
          <select
            id="grade"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value as LdGradeLevel)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {GRADE_LEVEL_LABELS[g].ar}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="parent">{t('guardianFallback')}</Label>
          <Input
            id="parent"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="phone">{t('phoneLabel')}</Label>
          <Input
            id="phone"
            value={parentPhone}
            onChange={(e) => setParentPhone(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="notes">{t('ldNotes')}</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-600 hover:bg-amber-700"
        >
          {loading ? t('loading') : t('ldCreateProfile')}
        </Button>
      </form>
    </div>
  );
}
