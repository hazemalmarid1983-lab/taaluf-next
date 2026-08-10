'use client';

import { useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { LEVEL_THEME } from '@/lib/assessmentHelpers';
import type { Criterion } from '@/types/taalof';
import { cn } from '@/lib/utils';

type Props = {
  criterion: Criterion;
  value: number;
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
  const levelKey = String(value) as '0' | '1' | '2' | '3';
  const level = criterion.levels[levelKey];
  const theme = LEVEL_THEME[value] || LEVEL_THEME[0];

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
    <article className="space-y-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium text-[#2D8B5A]/80">
            {criterion.id} · {criterion.domain}
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-slate-800">
            {criterion.name}
          </h3>
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-semibold',
            theme.badge
          )}
        >
          {value} · {level?.label}
        </span>
      </div>

      <p className="text-xs leading-6 text-slate-500">{criterion.description}</p>

      <div
        className={cn(
          'rounded-xl p-3 transition-colors',
          value === 0 && 'bg-emerald-50',
          value === 1 && 'bg-sky-50',
          value === 2 && 'bg-orange-50',
          value === 3 && 'bg-rose-50'
        )}
      >
        <Slider
          value={[value]}
          min={0}
          max={3}
          step={1}
          onValueChange={(vals) => onChange(vals[0] ?? 0)}
          aria-label={criterion.name}
          className={cn(
            '[&_[role=slider]]:border-2 [&_[role=slider]]:bg-white',
            theme.thumb,
            value === 0 && '[&_span.absolute]:!bg-emerald-500',
            value === 1 && '[&_span.absolute]:!bg-sky-500',
            value === 2 && '[&_span.absolute]:!bg-orange-500',
            value === 3 && '[&_span.absolute]:!bg-rose-600'
          )}
        />
        <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className={cn('h-full rounded-full transition-all', theme.track)}
            style={{ width: `${(value / 3) * 100}%` }}
          />
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px] text-slate-400">
          {[0, 1, 2, 3].map((n) => (
            <span
              key={n}
              className={n === value ? 'font-semibold text-slate-700' : ''}
            >
              {criterion.levels[String(n) as '0' | '1' | '2' | '3']?.label}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-[#F0F9F4] px-3 py-2 text-xs leading-6 text-slate-700">
        <p>
          <span className="font-semibold text-[#2D8B5A]">وصف المستوى:</span>{' '}
          {level?.description}
        </p>
        <p className="mt-1.5">
          <span className="font-semibold text-amber-700">التوصية:</span>{' '}
          {criterion.recommendation}
        </p>
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
