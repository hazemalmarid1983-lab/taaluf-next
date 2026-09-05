'use client';

import { FormEvent, Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import TaalufLogo from '@/components/branding/TaalufLogo';
import { LanguageToggleBtn, useLanguage } from '@/components/LanguageProvider';
import SubscriberGate from '@/components/access/SubscriberGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { homePathForRole } from '@/lib/access';
import type { TranslationKey } from '@/lib/i18n/translations';
import { resolvePostLoginDestination } from '@/lib/nextBestActionFlow';
import {
  demoEmailForPortal,
  parsePortalParam,
  portalFromEmail,
  safePostLoginPath,
  type PortalId,
} from '@/lib/loginPortal';

const PORTALS: {
  id: PortalId;
  title: TranslationKey;
  hint: string;
  blurb: TranslationKey;
}[] = [
  {
    id: 'admin',
    title: 'portalAdmin',
    hint: 'admin@taaluf.local',
    blurb: 'portalAdminBlurb',
  },
  {
    id: 'hub',
    title: 'portalHub',
    hint: 'samer@taaluf.local',
    blurb: 'portalHubBlurb',
  },
  {
    id: 'specialist',
    title: 'portalSpecialist',
    hint: 'specialist@taaluf.local',
    blurb: 'portalSpecialistBlurb',
  },
  {
    id: 'parent',
    title: 'portalParent',
    hint: 'parent@taaluf.local',
    blurb: 'portalParentBlurb',
  },
];

function LoginForm() {
  const { t, dir } = useLanguage();
  const params = useSearchParams();
  const initial = parsePortalParam(params);
  const [portal, setPortal] = useState<PortalId>(initial);
  const [email, setEmail] = useState(demoEmailForPortal(initial));
  const paymentsOff =
    process.env.NEXT_PUBLIC_PAYMENTS_DISABLED === 'true' ||
    process.env.NEXT_PUBLIC_TAALUF_PILOT_MODE === 'true';
  const [password, setPassword] = useState(paymentsOff ? 'taaluf123' : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(paymentsOff);

  const meta = useMemo(
    () => PORTALS.find((p) => p.id === portal) || PORTALS[1],
    [portal]
  );

  const selectPortal = (id: PortalId) => {
    setPortal(id);
    setEmail(demoEmailForPortal(id));
    setError('');
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setError(t('acceptTermsError'));
      return;
    }
    setLoading(true);
    setError('');
    const inferred = portalFromEmail(email) || portal;
    const roleGuess =
      inferred === 'admin'
        ? 'admin'
        : inferred === 'parent'
          ? 'parent'
          : inferred === 'hub'
            ? 'scientific_advisor'
            : 'specialist';
    const dest = safePostLoginPath(
      params.get('callbackUrl'),
      homePathForRole(roleGuess)
    );
    const res = await signIn('credentials', {
      email,
      password,
      portal: inferred,
      redirect: false,
      callbackUrl: dest,
    });
    if (res?.error) {
      setLoading(false);
      setError(t('loginError'));
      return;
    }
    try {
      const sessionRes = await fetch('/api/auth/session');
      const session = (await sessionRes.json()) as {
        user?: { role?: string };
      };
      const role = session?.user?.role || roleGuess;
      window.location.assign(
        resolvePostLoginDestination(role, params.get('callbackUrl'))
      );
    } catch {
      window.location.assign(dest);
    }
  };

  return (
    <main
      className="taaluf-hero-bg relative flex min-h-screen items-center justify-center px-4 py-12"
      dir={dir}
    >
      <div className="taaluf-mesh absolute inset-0 opacity-50" />
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl shadow-black/10">
        <div className="flex items-center justify-between gap-3">
          <TaalufLogo href="/" size="md" />
          <LanguageToggleBtn />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-[#0b1f14]">{t('loginGates')}</h1>
        <p className="mt-2 text-sm text-slate-500">{t('loginChoosePortal')}</p>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {PORTALS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPortal(p.id)}
              className={
                portal === p.id
                  ? 'rounded-2xl bg-[#2E7D8E] px-3 py-3 text-sm font-bold text-white backdrop-blur-xl'
                  : 'rounded-2xl border border-emerald-100 px-3 py-3 text-sm text-slate-600 hover:bg-emerald-50'
              }
            >
              {t(p.title)}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">{t(meta.blurb)}</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                const next = e.target.value;
                setEmail(next);
                const inferred = portalFromEmail(next);
                if (inferred && inferred !== portal) setPortal(inferred);
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-[#F0F9F4] p-4">
            <p className="text-sm font-semibold text-[#0b1f14]">{t('termsCheckboxTitle')}</p>
            <p className="mt-2 text-xs leading-6 text-slate-600">
              {t('termsCheckboxBody')}{' '}
              <Link
                href="/terms"
                className="font-semibold text-[#2D8B5A] underline"
                target="_blank"
              >
                {t('readTerms')}
              </Link>
            </p>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-medium text-[#2D8B5A]">
              <input
                type="checkbox"
                required
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="h-4 w-4 accent-[#2D8B5A]"
              />
              <span>{t('acceptTerms')}</span>
            </label>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('signingIn') : t('enterPortal', { portal: t(meta.title) })}
          </Button>
        </form>

        {portal === 'specialist' && !paymentsOff && (
          <p className="mt-4 text-sm text-slate-500">
            {t('noSpecialistAccount')}{' '}
            <Link href="/specialist/pay" className="font-semibold text-[#2D8B5A]">
              {t('payThenEnter')}
            </Link>
          </p>
        )}

        {paymentsOff && (
          <p className="mt-4 rounded-2xl bg-emerald-50 px-3 py-2 text-xs leading-6 text-emerald-900">
            {t('demoModeHint')}{' '}
            <span className="font-mono font-semibold">taaluf123</span>
          </p>
        )}

        <p className="mt-4 text-xs leading-6 text-slate-400">{meta.hint}</p>
      </div>
      <SubscriberGate />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFallback() {
  const { t } = useLanguage();
  return <main className="p-8 text-center">{t('loading')}</main>;
}
