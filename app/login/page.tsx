'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
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
  isPrivilegedPasswordPortal,
  isSelfSignupPortal,
  parsePortalParam,
  portalAllowsEmail,
  portalFromEmail,
  portalMatchesEmail,
  safePostLoginPath,
  type PortalId,
} from '@/lib/loginPortal';

const IS_DEV = process.env.NODE_ENV !== 'production';

const SIGNUP_ERRORS_AR: Record<string, string> = {
  NAME_REQUIRED: 'اكتب اسمك (حرفان على الأقل).',
  EMAIL_INVALID: 'البريد الإلكتروني غير صحيح.',
  EMAIL_RESERVED: 'هذا النطاق محجوز لحسابات المنصة الداخلية.',
  PASSWORD_TOO_SHORT: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.',
  PASSWORD_MISMATCH: 'كلمتا المرور غير متطابقتين.',
  ROLE_NOT_ALLOWED: 'لا يمكن إنشاء حساب لهذه البوابة.',
  EMAIL_TAKEN: 'هذا البريد مسجّل مسبقاً — سجّل الدخول بدلاً من ذلك.',
  TOO_MANY_ATTEMPTS: 'محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.',
  STORAGE_UNAVAILABLE:
    'تعذّر حفظ الحساب: التخزين الدائم للمنصة غير متاح حالياً. لم يُنشأ الحساب — تواصل مع إدارة المنصة.',
  AUTH_NOT_CONFIGURED:
    'نظام الدخول غير مهيأ على الخادم (سر الجلسة مفقود). لم يُنشأ الحساب — تواصل مع إدارة المنصة.',
  REGISTRATION_FAILED: 'حدث خطأ في الخادم أثناء إنشاء الحساب. أعد المحاولة بعد قليل.',
};

const SIGNUP_ERRORS_EN: Record<string, string> = {
  NAME_REQUIRED: 'Enter your name (at least 2 characters).',
  EMAIL_INVALID: 'The email address is not valid.',
  EMAIL_RESERVED: 'This domain is reserved for internal platform accounts.',
  PASSWORD_TOO_SHORT: 'The password must be at least 8 characters.',
  PASSWORD_MISMATCH: 'The passwords do not match.',
  ROLE_NOT_ALLOWED: 'Accounts cannot be created for this portal.',
  EMAIL_TAKEN: 'This email is already registered — sign in instead.',
  TOO_MANY_ATTEMPTS: 'Too many attempts. Please wait and try again.',
  STORAGE_UNAVAILABLE:
    'The account could not be saved: platform storage is unavailable. No account was created — contact the platform admin.',
  AUTH_NOT_CONFIGURED:
    'Sign-in is not configured on the server (session secret missing). No account was created — contact the platform admin.',
  REGISTRATION_FAILED: 'A server error occurred while creating the account. Please try again shortly.',
};

const SESSION_REJECTED_AR =
  'تم تسجيل دخولك، لكن الخادم لم يقبل الجلسة عند فتح الصفحة المطلوبة (إعدادات المصادقة غير متطابقة). تواصل مع إدارة المنصة.';
const SESSION_REJECTED_EN =
  'You are signed in, but the server rejected the session when opening the requested page (authentication settings mismatch). Contact the platform admin.';

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
  const { t, dir, lang } = useLanguage();
  const isAr = lang === 'ar';
  const params = useSearchParams();
  const initial = parsePortalParam(params);
  const [portal, setPortal] = useState<PortalId>(initial);
  const [email, setEmail] = useState(IS_DEV ? demoEmailForPortal(initial) : '');
  const [mode, setMode] = useState<'login' | 'signup'>(
    params.get('mode') === 'signup' && isSelfSignupPortal(initial) ? 'signup' : 'login'
  );
  const [fullName, setFullName] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const paymentsOff =
    process.env.NEXT_PUBLIC_PAYMENTS_DISABLED === 'true' ||
    process.env.NEXT_PUBLIC_TAALUF_PILOT_MODE === 'true';
  const showDevDemoPassword = paymentsOff && process.env.NODE_ENV !== 'production';
  const [password, setPassword] = useState(
    showDevDemoPassword && !isPrivilegedPasswordPortal(initial) ? 'taaluf123' : ''
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(paymentsOff);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);

  const privilegedPortal = isPrivilegedPasswordPortal(portal);

  const meta = useMemo(
    () => PORTALS.find((p) => p.id === portal) || PORTALS[1],
    [portal]
  );

  const selectPortal = (id: PortalId) => {
    setPortal(id);
    if (!isSelfSignupPortal(id)) setMode('login');
    if (IS_DEV) setEmail(demoEmailForPortal(id));
    else if (portalFromEmail(email)) setEmail('');
    setError('');
    setPasswordMsg('');
    if (showDevDemoPassword && !isPrivilegedPasswordPortal(id)) {
      setPassword('taaluf123');
    } else if (isPrivilegedPasswordPortal(id)) {
      setPassword('');
    }
  };

  const onChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordBusy(true);
    try {
      if (!portalMatchesEmail(portal, email)) {
        setPasswordMsg(t('portalMismatchError'));
        return;
      }
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          currentPassword,
          newPassword,
          confirmPassword,
          portal,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordMsg(data.message || t('passwordChangeError'));
        return;
      }
      setPasswordMsg(t('passwordSaved'));
      setPassword(newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordMsg(t('passwordChangeError'));
    } finally {
      setPasswordBusy(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setError(t('acceptTermsError'));
      return;
    }
    setLoading(true);
    setError('');
    if (!portalAllowsEmail(portal, email)) {
      setLoading(false);
      setError(t('portalMismatchError'));
      return;
    }

    if (mode === 'signup') {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email,
          password,
          confirmPassword: signupConfirm,
          role: portal,
        }),
      }).catch(() => null);
      const data = (await res?.json().catch(() => null)) as { error?: string } | null;
      if (!res?.ok) {
        setLoading(false);
        const code = data?.error || '';
        setError(
          (isAr ? SIGNUP_ERRORS_AR : SIGNUP_ERRORS_EN)[code] ||
            (isAr ? 'تعذّر إنشاء الحساب. أعد المحاولة.' : 'Could not create the account. Try again.')
        );
        return;
      }
    }

    await signInAndGo();
  };

  const signInAndGo = async () => {
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
      portal,
      redirect: false,
      callbackUrl: dest,
    }).catch(() => undefined);
    if (!res || res.error) {
      setLoading(false);
      if (res?.error === 'Configuration') {
        setError(isAr ? SIGNUP_ERRORS_AR.AUTH_NOT_CONFIGURED : SIGNUP_ERRORS_EN.AUTH_NOT_CONFIGURED);
      } else if (mode === 'signup') {
        setMode('login');
        setError(
          isAr
            ? 'أُنشئ حسابك، لكن تعذّر الدخول التلقائي. سجّل الدخول ببريدك وكلمة مرورك.'
            : 'Your account was created, but automatic sign-in failed. Sign in with your email and password.'
        );
      } else {
        setError(!res ? (isAr ? 'تعذّر الاتصال بالخادم. تحقّق من الاتصال.' : 'Could not reach the server.') : t('loginError'));
      }
      return;
    }
    const session = (await fetch('/api/auth/session')
      .then((r) => r.json())
      .catch(() => null)) as { user?: { role?: string } } | null;
    if (!session?.user) {
      setLoading(false);
      setError(isAr ? SESSION_REJECTED_AR : SESSION_REJECTED_EN);
      return;
    }
    window.location.assign(
      resolvePostLoginDestination(session.user.role || roleGuess, params.get('callbackUrl'))
    );
  };

  // وصول لصفحة الدخول مع callbackUrl بينما الجلسة صالحة = الـ middleware رفضها؛ لا نعيد التوجيه كي لا تتكرر الحلقة
  useEffect(() => {
    if (!params.get('callbackUrl')) return;
    let cancelled = false;
    void fetch('/api/auth/session')
      .then((r) => r.json())
      .then((session: { user?: unknown } | null) => {
        if (!cancelled && session?.user) setError(isAr ? SESSION_REJECTED_AR : SESSION_REJECTED_EN);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [params, isAr]);

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

        {isSelfSignupPortal(portal) && (
          <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1" role="tablist">
            {(['login', 'signup'] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => {
                  setMode(value);
                  setError('');
                }}
                className={`rounded-xl py-2 text-sm font-bold transition ${
                  mode === value ? 'bg-white text-[#2E7D8E] shadow-sm' : 'text-slate-500'
                }`}
              >
                {value === 'login'
                  ? isAr ? 'تسجيل الدخول' : 'Sign in'
                  : isAr ? 'إنشاء حساب جديد' : 'Create account'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="fullName">{isAr ? 'الاسم الكامل' : 'Full name'}</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                minLength={2}
                maxLength={80}
                required
              />
            </div>
          )}
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
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={mode === 'signup' ? 8 : undefined}
              required
            />
          </div>
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="signupConfirm">{t('confirmPassword')}</Label>
              <Input
                id="signupConfirm"
                type="password"
                value={signupConfirm}
                onChange={(e) => setSignupConfirm(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
          )}

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
            {loading
              ? t('signingIn')
              : mode === 'signup'
                ? isAr ? 'إنشاء الحساب والدخول' : 'Create account & sign in'
                : t('enterPortal', { portal: t(meta.title) })}
          </Button>
        </form>

        {privilegedPortal && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <p className="text-sm font-bold text-amber-950">
              {t('privilegedPasswordTitle')}
            </p>
            <p className="mt-1 text-xs leading-6 text-amber-900/90">
              {t('privilegedPasswordHint')}
            </p>
            <p className="mt-2 text-xs font-semibold text-amber-800">
              {t('privilegedPortalSecurity')}
            </p>
            <form onSubmit={onChangePassword} className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('newPassword')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              {passwordMsg && (
                <p
                  className={`text-sm ${
                    passwordMsg === t('passwordSaved')
                      ? 'text-emerald-700'
                      : 'text-rose-600'
                  }`}
                >
                  {passwordMsg}
                </p>
              )}
              <Button
                type="submit"
                variant="outline"
                className="w-full border-amber-300 bg-white text-amber-950 hover:bg-amber-100"
                disabled={passwordBusy}
              >
                {passwordBusy ? t('savingPassword') : t('savePrivatePassword')}
              </Button>
            </form>
          </div>
        )}

        {portal === 'specialist' && !paymentsOff && (
          <p className="mt-4 text-sm text-slate-500">
            {t('noSpecialistAccount')}{' '}
            <Link href="/specialist/pay" className="font-semibold text-[#2D8B5A]">
              {t('payThenEnter')}
            </Link>
          </p>
        )}

        {showDevDemoPassword && !privilegedPortal && (
          <p className="mt-4 rounded-2xl bg-emerald-50 px-3 py-2 text-xs leading-6 text-emerald-900">
            {t('demoModeHint')}{' '}
            <span className="font-mono font-semibold">taaluf123</span>
          </p>
        )}

        {IS_DEV && <p className="mt-4 text-xs leading-6 text-slate-400">{meta.hint}</p>}
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
