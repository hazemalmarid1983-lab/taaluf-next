'use client';

import { FormEvent, Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import SubscriberGate from '@/components/access/SubscriberGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { homePathForRole } from '@/lib/access';
import { BRAND } from '@/lib/content';

const PORTALS = [
  {
    id: 'admin' as const,
    title: 'الإدارة العليا',
    hint: 'admin@taaluf.local',
    blurb: 'تشغيل المنصة · مرشد تآلف حر',
  },
  {
    id: 'specialist' as const,
    title: 'المختصون',
    hint: 'specialist@taaluf.local',
    blurb: 'التقييم والتقارير · مرشد مقيد',
  },
  {
    id: 'parent' as const,
    title: 'أولياء الأمور',
    hint: 'parent@taaluf.local',
    blurb: 'تسجيل الطفل · تقييم · متابعة',
  },
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = (params.get('portal') as 'admin' | 'specialist' | 'parent') || 'specialist';
  const [portal, setPortal] = useState<'admin' | 'specialist' | 'parent'>(initial);
  const [email, setEmail] = useState(
    initial === 'admin'
      ? 'admin@taaluf.local'
      : initial === 'parent'
        ? 'parent@taaluf.local'
        : 'specialist@taaluf.local'
  );
  // على العميل نعتمد العلم العام؛ السيرفر يعطّل الدفع أيضاً عند غياب Tap
  const paymentsOff =
    process.env.NEXT_PUBLIC_PAYMENTS_DISABLED === 'true' ||
    process.env.NEXT_PUBLIC_TAALUF_PILOT_MODE === 'true';
  const [password, setPassword] = useState(paymentsOff ? 'taaluf123' : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const meta = useMemo(
    () => PORTALS.find((p) => p.id === portal) || PORTALS[1],
    [portal]
  );

  const selectPortal = (id: 'admin' | 'specialist' | 'parent') => {
    setPortal(id);
    setEmail(
      id === 'admin'
        ? 'admin@taaluf.local'
        : id === 'parent'
          ? 'parent@taaluf.local'
          : 'specialist@taaluf.local'
    );
    setError('');
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signIn('credentials', {
      email,
      password,
      portal,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError('بيانات الدخول غير صحيحة لهذه البوابة');
      return;
    }
    const roleGuess =
      portal === 'admin' ? 'admin' : portal === 'parent' ? 'parent' : 'specialist';
    router.push(homePathForRole(roleGuess));
    router.refresh();
  };

  return (
    <main className="taaluf-hero-bg relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="taaluf-mesh absolute inset-0 opacity-50" />
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl shadow-black/10">
        <Link href="/" className="text-3xl font-bold text-[#2D8B5A]">
          {BRAND.name}
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-[#0b1f14]">بوابات الدخول</h1>
        <p className="mt-2 text-sm text-slate-500">
          اختر بوابتك — الإدارة منفصلة عن المختصين وأولياء الأمور
        </p>

        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          {PORTALS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPortal(p.id)}
              className={
                portal === p.id
                  ? 'rounded-2xl bg-[#2D8B5A] px-3 py-3 text-sm font-bold text-white'
                  : 'rounded-2xl border border-emerald-100 px-3 py-3 text-sm text-slate-600 hover:bg-emerald-50'
              }
            >
              {p.title}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">{meta.blurb}</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">البريد</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'جاري الدخول…' : `دخول ${meta.title}`}
          </Button>
        </form>

        {portal === 'specialist' && !paymentsOff && (
          <p className="mt-4 text-sm text-slate-500">
            ليس لديك حساب مختص؟{' '}
            <Link href="/specialist/pay" className="font-semibold text-[#2D8B5A]">
              ادفع أولاً ثم ادخل
            </Link>
          </p>
        )}

        {paymentsOff && (
          <p className="mt-4 rounded-2xl bg-emerald-50 px-3 py-2 text-xs leading-6 text-emerald-900">
            وضع تجريبي: الدفع معطّل. كلمة المرور التجريبية:{' '}
            <span className="font-mono font-semibold">taaluf123</span>
          </p>
        )}

        <p className="mt-4 text-xs leading-6 text-slate-400">
          {meta.hint}
        </p>
      </div>
      <SubscriberGate />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="p-8 text-center">جاري التحميل…</main>}>
      <LoginForm />
    </Suspense>
  );
}
