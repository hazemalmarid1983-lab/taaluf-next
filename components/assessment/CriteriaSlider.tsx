'use client';

import { useRef } from 'react';
import OptionChoiceCards from '@/components/assessment/OptionChoiceCards';
import { recommendationForLevel } from '@/lib/assessmentGate';
import type { Criterion } from '@/types/taalof';

type Props = {
  criterion: Criterion;
  value: number | null;
  notes?: string;
  evidence?: string[];
  onChange: (value: number) => void;
  onNotesChange: (notes: string) => void;
  onEvidenceChange: (images: string[]) => void;
};

export default function CriteriaSlider({
  criterion,
  value,
  notes = '',
  evidence = [],
  onChange,
  onNotesChange,
  onEvidenceChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const question = criterion.question || criterion.description;
  const answered = value != null;
  const level =
    answered
      ? criterion.levels[String(value) as '0' | '1' | '2' | '3']
      : null;
  const dynamicRec = recommendationForLevel(
    criterion.recommendation,
    value,
    level?.label
  );

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const readers = Array.from(files)
      .slice(0, 3)
      .map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
              reject(new Error('IMAGE_ONLY'));
              return;
            }
            if (file.size > 1.5 * 1024 * 1024) {
              reject(new Error('TOO_LARGE'));
              return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          })
      );
    try {
      const imgs = await Promise.all(readers);
      onEvidenceChange([...evidence, ...imgs].slice(0, 4));
    } catch {
      /* تجاهل ملفات غير صالحة */
    }
  };

  return (
    <article className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium text-[#2D8B5A]/80">
            {criterion.id} · {criterion.domain}
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-slate-800">
            {criterion.name}
          </h3>
        </div>
      </div>

      <p className="rounded-xl bg-[#F0F9F4] px-3 py-3 text-sm font-medium leading-7 text-[#0b1f14]">
        {question}
      </p>

      <OptionChoiceCards
        options={[0, 1, 2, 3].map((n) => {
          const lv = criterion.levels[String(n) as '0' | '1' | '2' | '3'];
          return {
            score: n,
            label: lv?.label || String(n),
            description: lv?.description || '',
          };
        })}
        value={value}
        onChange={onChange}
      />

      <div
        className={
          answered
            ? 'rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-6 text-slate-700'
            : 'min-h-[3rem] rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-400'
        }
      >
        {answered ? (
          <>
            <span className="font-semibold text-amber-800">
              التوصية ({level?.label}):
            </span>{' '}
            {dynamicRec}
          </>
        ) : (
          'اختر أحد الخيارات لعرض التوصية التربوية المناسبة.'
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-600">
          ملاحظات الأخصائي
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={2}
          placeholder="ملاحظة اختيارية لهذا المؤشر…"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#2D8B5A] focus:ring-2 focus:ring-[#2D8B5A]/20"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-medium text-slate-600">
            أدلة مصوّرة (اختياري)
          </label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg bg-[#2D8B5A]/10 px-2.5 py-1 text-xs font-medium text-[#2D8B5A]"
          >
            رفع صورة
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              void onFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
        {!!evidence.length && (
          <div className="flex flex-wrap gap-2">
            {evidence.map((src, i) => (
              <div key={`${criterion.id}-ev-${i}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`دليل ${i + 1}`}
                  className="h-14 w-14 rounded-lg border border-slate-200 object-cover"
                />
                <button
                  type="button"
                  className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white"
                  onClick={() =>
                    onEvidenceChange(evidence.filter((_, idx) => idx !== i))
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
