'use client';

import type { HubActor } from '@/lib/clinicalHub';

export default function HubAdvisorWelcome({
  actor,
  isAr,
  onContinue,
  busy,
}: {
  actor: HubActor;
  isAr: boolean;
  onContinue: () => Promise<void>;
  busy?: boolean;
}) {
  const name = isAr ? actor.nameAr : actor.nameEn;
  const title = isAr ? actor.titleAr : actor.titleEn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07140e]/70 p-4 backdrop-blur-sm">
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#2E7D8E]">
          {isAr ? 'أهلاً بك في تآلف' : 'Welcome to Taaluf'}
        </p>
        <h2 className="mt-3 text-2xl font-bold text-[#0b1f14]">
          {isAr ? `مرحباً ${name}` : `Welcome, ${name}`}
        </h2>
        <p className="mt-1 text-sm font-semibold text-[#2D8B5A]">{title}</p>

        <div className="mt-6 space-y-4 text-sm leading-8 text-slate-700">
          <p>
            {isAr
              ? 'يسعدنا انضمامك كرئيس المجلس الاستشاري والسريري العام لمنصة تآلف — مساحة تعاون خاصة بينك وبين الإدارة لبناء وتطوير البنية العلمية والبحثية للمنصة.'
              : 'We are glad to welcome you as Chief Advisory & Clinical Council Chair of Taaluf — a private collaboration space between you and Admin to develop the platform’s scientific and research foundation.'}
          </p>
          <ol className="list-inside list-decimal space-y-2 rounded-2xl bg-emerald-50/80 p-4 text-emerald-950">
            <li>
              {isAr ? (
                <>
                  <strong>الاتفاقية:</strong> قراءة وتوقيع اتفاقية الشراكة
                  الاستشارية
                </>
              ) : (
                <>
                  <strong>Agreement:</strong> Read and sign the advisory
                  partnership agreement
                </>
              )}
            </li>
            <li>
              {isAr ? (
                <>
                  <strong>الاجتماع الأول:</strong> التعرف على محتوى المنصة
                  ومنهجيتها
                </>
              ) : (
                <>
                  <strong>First meeting:</strong> Explore the platform overview
                  and methodology
                </>
              )}
            </li>
            <li>
              {isAr ? (
                <>
                  <strong>العمل:</strong> مشاركة ملاحظاتك واقتراحاتك عبر غرفة
                  الاجتماعات
                </>
              ) : (
                <>
                  <strong>Collaboration:</strong> Share notes and proposals in
                  the meeting room
                </>
              )}
            </li>
          </ol>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'بالضغط على «متابعة» ستنتقل مباشرة إلى اتفاقية الشراكة للقراءة والتوقيع.'
              : 'By continuing, you will go directly to the partnership agreement to read and sign.'}
          </p>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => onContinue()}
          className="mt-8 w-full rounded-2xl bg-[#2D8B5A] px-5 py-3.5 text-sm font-bold text-white shadow-lg disabled:opacity-60"
        >
          {busy
            ? isAr
              ? 'جاري التحميل…'
              : 'Loading…'
            : isAr
              ? 'متابعة — الاتفاقية والتوقيع'
              : 'Continue — agreement & sign-off'}
        </button>
      </div>
    </div>
  );
}
