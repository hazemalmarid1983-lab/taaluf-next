'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  CONSENT_LAYERS,
  CONSENT_STORAGE_KEY,
} from '@/lib/consentConstants';

export default function ConsentPage() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({
    general_platform: false,
    assessment: false,
    data_privacy: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const allChecked = useMemo(
    () => CONSENT_LAYERS.every((l) => checked[l.type]),
    [checked]
  );

  const submit = async () => {
    if (!allChecked) return;
    setBusy(true);
    setError('');
    try {
      const childRaw = localStorage.getItem('taaluf.activeStudent');
      let childId = '';
      if (childRaw) {
        try {
          childId = String(JSON.parse(childRaw)?.id || '');
        } catch {
          /* ignore */
        }
      }

      const res = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر حفظ الموافقة');

      localStorage.setItem(CONSENT_STORAGE_KEY, 'true');
      document.cookie = `${CONSENT_STORAGE_KEY}=true; path=/; max-age=${
        60 * 60 * 24 * 365
      }; samesite=lax`;
      router.push('/dashboard/assessments/new');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ الموافقة');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f0f9f4_0%,#eef7f2_45%,#f8fafc_100%)] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold text-[#2D8B5A]">تآلف</p>
        <h1 className="mt-2 text-3xl font-bold text-[#0b1f14]">
          موافقات قبل التقييم التربوي
        </h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          يرجى قراءة الطبقات الثلاث والموافقة عليها قبل بدء التقييم.
        </p>

        <div className="mt-8 space-y-4">
          {CONSENT_LAYERS.map((layer) => (
            <label
              key={layer.type}
              className="flex cursor-pointer gap-3 rounded-2xl border border-emerald-100 bg-white/90 p-5 shadow-sm"
            >
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 accent-[#2D8B5A]"
                checked={!!checked[layer.type]}
                onChange={(e) =>
                  setChecked((prev) => ({
                    ...prev,
                    [layer.type]: e.target.checked,
                  }))
                }
              />
              <span className="space-y-2">
                <span className="block text-lg font-bold text-[#0b1f14]">
                  {layer.title}
                </span>
                <span className="block text-sm leading-7 text-slate-600">
                  {layer.text}
                </span>
              </span>
            </label>
          ))}
        </div>

        {error ? (
          <p className="mt-4 text-sm text-rose-600">{error}</p>
        ) : null}

        <Button
          className="mt-8 h-12 w-full text-base"
          disabled={!allChecked || busy}
          onClick={submit}
        >
          {busy ? 'جاري الحفظ…' : 'أوافق وأكمل'}
        </Button>
      </div>
    </main>
  );
}
