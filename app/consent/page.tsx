'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import TaalufLogo from '@/components/branding/TaalufLogo';
import { LanguageToggleBtn, useLanguage } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import {
  CONSENT_LAYERS,
  CONSENT_STORAGE_KEY,
  REQUIRED_CONSENT_LAYERS,
} from '@/lib/consentConstants';
import type { TranslationKey } from '@/lib/i18n/translations';
import { PARENT_ROUTES } from '@/lib/parentJourney';

const CONSENT_COPY: Record<
  string,
  { title: TranslationKey; text: TranslationKey }
> = {
  general_platform: { title: 'consent1Title', text: 'consent1Text' },
  assessment: { title: 'consent2Title', text: 'consent2Text' },
  data_privacy: { title: 'consent3Title', text: 'consent3Text' },
  video_analysis: { title: 'consent4Title', text: 'consent4Text' },
};

export default function ConsentPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t, dir } = useLanguage();
  const [checked, setChecked] = useState<Record<string, boolean>>({
    general_platform: false,
    assessment: false,
    data_privacy: false,
    video_analysis: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const allChecked = useMemo(
    () => REQUIRED_CONSENT_LAYERS.every((l) => checked[l.type]),
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
      if (!res.ok) throw new Error(data.error || t('saveConsentError'));

      localStorage.setItem(CONSENT_STORAGE_KEY, 'true');
      document.cookie = `${CONSENT_STORAGE_KEY}=true; path=/; max-age=${
        60 * 60 * 24 * 365
      }; samesite=lax`;
      const role = session?.user?.role;
      router.push(
        role === 'parent' ? PARENT_ROUTES.home : '/dashboard/assessments/new'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveConsentError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#F1F5F9] px-4 py-10"
      dir={dir}
    >
      <div className="pointer-events-none absolute -right-16 top-16 h-80 w-80 rounded-full bg-teal-400/20 blur-[110px]" />
      <div className="pointer-events-none absolute -left-16 bottom-16 h-80 w-80 rounded-full bg-amber-500/20 blur-[110px]" />
      <div className="relative z-10 mx-auto max-w-lg rounded-3xl border border-white/90 bg-white/80 p-6 shadow-xl backdrop-blur-2xl sm:p-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <TaalufLogo href="/" size="sm" />
          <LanguageToggleBtn />
        </div>
        <h1 className="mt-2 text-2xl font-bold text-amber-700 sm:text-3xl">
          {t('consentTitle')}
        </h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          {t('consentIntro')}
        </p>

        <div className="mt-6 space-y-4">
          {CONSENT_LAYERS.map((layer) => (
            <label
              key={layer.type}
              className="flex cursor-pointer gap-3 rounded-2xl border border-emerald-100 bg-[#F0F9F4]/50 p-4"
            >
              <input
                type="checkbox"
                required={layer.required}
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
                <span className="block text-base font-bold text-[#0b1f14]">
                  {t(CONSENT_COPY[layer.type].title)}
                  {!layer.required ? (
                    <span className="ms-2 text-xs font-semibold text-slate-400">
                      {t('optional')}
                    </span>
                  ) : null}
                </span>
                <span className="block text-sm leading-7 text-slate-600">
                  {t(CONSENT_COPY[layer.type].text)}
                </span>
              </span>
            </label>
          ))}
        </div>

        {error ? (
          <p className="mt-4 text-sm text-rose-600">{error}</p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3">
          <Button
            className="h-12 w-full bg-amber-500 text-base font-bold text-[#0b1f14] hover:bg-amber-400"
            disabled={!allChecked || busy || status === 'loading'}
            onClick={submit}
          >
            {busy ? t('consentSaving') : t('consentAccept')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 w-full"
            disabled={busy}
            onClick={() => router.back()}
          >
            {t('consentCancel')}
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          <Link href={PARENT_ROUTES.home} className="text-[#2D8B5A] underline">
            {t('backHome')}
          </Link>
          {' · '}
          <Link href="/terms" className="text-[#2E7D8E] underline">
            {t('terms')}
          </Link>
          {' · '}
          <Link href="/privacy" className="text-[#2E7D8E] underline">
            {t('privacy')}
          </Link>
        </p>
      </div>
    </main>
  );
}
