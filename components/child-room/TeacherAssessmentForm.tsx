'use client';

import { useState } from 'react';
import { PARENT_ITEMS } from '@/lib/parentAssessment';
import { saveTeacherForm } from '@/lib/childRoom/gate';

const ITEMS = PARENT_ITEMS.slice(0, 6);

export default function TeacherAssessmentForm({
  childId,
  filler,
  teacherName,
  inviteToken,
  onSaved,
}: {
  childId: string;
  filler: 'teacher' | 'parent';
  teacherName?: string;
  inviteToken?: string;
  onSaved: () => void;
}) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [error, setError] = useState('');

  const submit = async () => {
    if (ITEMS.some((item) => scores[item.id] == null)) {
      setError('أجب عن كل البنود قبل الحفظ.');
      return;
    }
    const payload = ITEMS.map((item) => ({
      criterionId: item.mappedCriterion,
      score: scores[item.id],
    }));
    if (inviteToken) {
      const response = await fetch(`/api/teacher-invites/${encodeURIComponent(inviteToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'form', scores: payload }),
      });
      if (!response.ok) {
        setError('تعذر حفظ النموذج على الخادم. حاول مرة أخرى.');
        return;
      }
    }
    saveTeacherForm({
      childId,
      filler,
      teacherName,
      scores: payload,
    });
    onSaved();
  };

  return (
    <div className="space-y-4 text-right">
      <p className="text-sm leading-6 text-slate-600">
        {filler === 'parent'
          ? 'لا يوجد مدرس مرتبط. عبّئ نموذج المدرس بنفسك حتى تكتمل مصادر الغرفة.'
          : 'بعد الربط، عبّئ نموذج تقييم المدرس لهذه الغرفة.'}
      </p>
      {ITEMS.map((item) => (
        <fieldset key={item.id} className="rounded-2xl border border-slate-200 p-4">
          <legend className="px-1 text-sm font-bold text-slate-800">
            {item.text || item.question}
          </legend>
          <div className="mt-3 grid gap-2">
            {(item.options ?? []).map((option) => (
              <label key={option.score} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={item.id}
                  checked={scores[item.id] === option.score}
                  onChange={() =>
                    setScores((current) => ({ ...current, [item.id]: option.score }))
                  }
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        type="button"
        onClick={submit}
        className="w-full rounded-xl bg-[#2E7D8E] px-4 py-3 text-sm font-bold text-white"
      >
        حفظ نموذج المدرس
      </button>
    </div>
  );
}
