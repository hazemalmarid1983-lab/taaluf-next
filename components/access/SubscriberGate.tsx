'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const paymentsOff =
  process.env.NEXT_PUBLIC_PAYMENTS_DISABLED === 'true' ||
  process.env.NEXT_PUBLIC_TAALUF_PILOT_MODE === 'true';

export default function SubscriberGate({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // في الوضع التجريبي لا حاجة لزر «مشترك» — كل شيء مفتوح
  if (paymentsOff) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/access/entitlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'subscribe', code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'رمز غير صالح');
      setMsg(data.message);
      onSuccess?.();
      setTimeout(() => {
        router.push('/dashboard/screening');
        router.refresh();
      }, 400);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'فشل التفعيل');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-bold text-[#2D8B5A] shadow-md hover:bg-emerald-50"
      >
        مشترك
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#0b1f14]">دخول المشترك</h3>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              أدخل رمز الاشتراك لفتح البوابات دون عملية دفع. الرموز التجريبية:
              TAALUF-VIP
            </p>
            <form onSubmit={submit} className="mt-4 space-y-3">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="رمز الاشتراك"
                required
              />
              {msg && (
                <p className="text-sm font-medium text-[#2D8B5A]">{msg}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={busy}>
                  {busy ? 'جاري التحقق…' : 'تفعيل'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
