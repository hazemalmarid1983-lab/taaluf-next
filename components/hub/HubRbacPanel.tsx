'use client';

import Link from 'next/link';
import { HUB_MEMBERS, type HubActor, type MouOverallStatus } from '@/lib/clinicalHub';

const MATRIX: {
  actionAr: string;
  actionEn: string;
  hazem: boolean;
  samer: boolean;
}[] = [
  {
    actionAr: 'مراجعة غرفة الاجتماعات',
    actionEn: 'Review the meeting room',
    hazem: true,
    samer: true,
  },
  {
    actionAr: 'اقتراح تقييمات / ملاحظات / مقاييس حسية',
    actionEn: 'Propose evaluations, notes, sensory metrics',
    hazem: true,
    samer: true,
  },
  {
    actionAr: 'اختبار بيئات الغرف الحسية ولوحة المختص',
    actionEn: 'Test sensory rooms and specialist tools',
    hazem: true,
    samer: true,
  },
  {
    actionAr: 'اعتماد المقترح (معتمد / قيد المراجعة)',
    actionEn: 'Toggle Approved / Pending',
    hazem: true,
    samer: false,
  },
  {
    actionAr: 'تعديلات هيكلية على المنصة',
    actionEn: 'Structural platform modifications',
    hazem: true,
    samer: false,
  },
  {
    actionAr: 'تحديثات الشيفرة ونشر الإنتاج',
    actionEn: 'Code updates and production deploys',
    hazem: true,
    samer: false,
  },
  {
    actionAr: 'لوحة الإدارة العليا',
    actionEn: 'Super-admin panel',
    hazem: true,
    samer: false,
  },
];

export default function HubRbacPanel({
  actor,
  pendingCount,
  mouStatus,
  isAr,
  onOpenMeeting,
  onOpenAgreement,
}: {
  actor: HubActor;
  pendingCount: number;
  mouStatus: MouOverallStatus;
  isAr: boolean;
  onOpenMeeting: () => void;
  onOpenAgreement: () => void;
}) {
  const isAdvisor = actor.role === 'scientific_advisor';
  const mouLabel =
    mouStatus === 'executed'
      ? isAr
        ? 'نافذة بعد توقيع الطرفين'
        : 'In force — both signed'
      : mouStatus === 'awaiting_hazem'
        ? isAr
          ? 'بانتظار تأكيد حازم'
          : 'Awaiting Hazem'
        : mouStatus === 'awaiting_samer'
          ? isAr
            ? 'بانتظار تأكيد د. سامر'
            : 'Awaiting Dr. Samer'
          : isAr
            ? 'غير موقّعة بعد'
            : 'Not yet signed';

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={onOpenMeeting}
          className="rounded-3xl border border-emerald-100 bg-white p-5 text-start shadow-sm"
        >
          <p className="text-xs text-slate-500">
            {isAr ? 'غرفة الاجتماعات' : 'Meeting room'}
          </p>
          <p className="mt-1 text-2xl font-bold text-[#2D8B5A]">{pendingCount}</p>
          <p className="mt-1 text-xs text-slate-500">
            {isAr ? 'مقترحات قيد المراجعة' : 'Proposals pending review'}
          </p>
        </button>
        <button
          type="button"
          onClick={onOpenAgreement}
          className="rounded-3xl border border-emerald-100 bg-white p-5 text-start shadow-sm"
        >
          <p className="text-xs text-slate-500">
            {isAr ? 'مذكرة التفاهم' : 'Advisory MOU'}
          </p>
          <p className="mt-1 text-lg font-bold text-[#0b1f14]">{mouLabel}</p>
          <p className="mt-1 text-xs text-slate-500">
            {isAr ? 'سنتان · اعتماد رسمي' : 'Two-year · formal sign-off'}
          </p>
        </button>
        <div className="rounded-3xl border border-emerald-100 bg-white p-5">
          <p className="text-xs text-slate-500">
            {isAr ? 'جلستك الحالية' : 'Signed in as'}
          </p>
          <p className="mt-1 text-lg font-bold text-[#0b1f14]">
            {isAr ? actor.nameAr : actor.nameEn}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {isAr ? actor.titleAr : actor.titleEn}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-100 bg-white p-6">
        <h2 className="text-xl font-bold text-[#0b1f14]">
          {isAr ? 'صلاحيات الأدوار' : 'Role permissions'}
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-start text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pe-3 font-semibold">
                  {isAr ? 'الإجراء' : 'Action'}
                </th>
                <th className="py-2 px-3 font-semibold">
                  {isAr ? HUB_MEMBERS.hazem.nameAr : HUB_MEMBERS.hazem.nameEn}
                </th>
                <th className="py-2 ps-3 font-semibold">
                  {isAr ? HUB_MEMBERS.samer.nameAr : HUB_MEMBERS.samer.nameEn}
                </th>
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((row) => (
                <tr key={row.actionEn} className="border-b border-slate-50">
                  <td className="py-2.5 pe-3 text-slate-700">
                    {isAr ? row.actionAr : row.actionEn}
                  </td>
                  <td className="px-3 py-2.5">
                    <Allow allowed={row.hazem} isAr={isAr} />
                  </td>
                  <td className="py-2.5 ps-3">
                    <Allow allowed={row.samer} isAr={isAr} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 p-6">
        <h2 className="text-lg font-bold text-[#0b1f14]">
          {isAr ? 'بيئات الاختبار' : 'Test environments'}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/sensory-rooms"
            className="rounded-xl bg-[#2E7D8E] px-4 py-2 text-sm font-semibold text-white"
          >
            {isAr ? 'الغرف الحسية' : 'Sensory rooms'}
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-[#1f6b44]"
          >
            {isAr ? 'معاينة أدوات المختص' : 'Specialist tools preview'}
          </Link>
          {!isAdvisor && (
            <Link
              href="/admin"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
            >
              {isAr ? 'لوحة الإدارة' : 'Admin panel'}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Allow({ allowed, isAr }: { allowed: boolean; isAr: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
        allowed
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-slate-100 text-slate-400'
      }`}
    >
      {allowed
        ? isAr
          ? 'مسموح'
          : 'Allowed'
        : isAr
          ? 'محظور'
          : 'Restricted'}
    </span>
  );
}
