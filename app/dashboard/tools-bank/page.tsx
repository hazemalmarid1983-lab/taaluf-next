'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import {
  AUTISM_TOOLS_BANK,
  AUTISM_TOOL_DOMAINS,
  type AutismTool,
  type AutismToolDomainId,
} from '@/lib/data/autismToolsBank';
import { EXTERNAL_TOOL_LINKS_ENABLED } from '@/lib/featureFlags';
import { INTERNAL_TOOLS } from '@/lib/internalTools';
import {
  arabicSupportingCount,
  domainById,
  filterTools,
  platformTags,
  supportsArabic,
  toolAccessLink,
  toolCountByDomain,
  TOOL_AGE_BANDS,
  TOOL_LEVELS,
  TOOL_PLATFORMS,
  type ToolAgeBandId,
  type ToolPlatformId,
} from '@/lib/toolsBank';

const PAGE_SIZE = 24;

export default function ToolsBankPage() {
  const { lang, dir } = useLanguage();
  const isAr = lang === 'ar';

  const [domain, setDomain] = useState<AutismToolDomainId | 'all'>('all');
  const [ageBand, setAgeBand] = useState<ToolAgeBandId | 'all'>('all');
  const [platform, setPlatform] = useState<ToolPlatformId | 'all'>('all');
  const [level, setLevel] = useState('');
  const [query, setQuery] = useState('');
  const [arabicOnly, setArabicOnly] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const counts = useMemo(() => toolCountByDomain(), []);
  const arabicCount = useMemo(() => arabicSupportingCount(), []);
  const results = useMemo(
    () => filterTools({ domain, ageBand, platform, level, query, arabicOnly }),
    [domain, ageBand, platform, level, query, arabicOnly]
  );

  const shown = results.slice(0, visible);
  const hasFilters =
    domain !== 'all' ||
    ageBand !== 'all' ||
    platform !== 'all' ||
    level !== '' ||
    query.trim() !== '' ||
    arabicOnly;

  /** كل تغيير في الفلاتر يرجع العرض لأول صفحة */
  const update = (apply: () => void) => {
    apply();
    setVisible(PAGE_SIZE);
  };

  const resetFilters = () =>
    update(() => {
      setDomain('all');
      setAgeBand('all');
      setPlatform('all');
      setLevel('');
      setQuery('');
      setArabicOnly(false);
    });

  return (
    <section dir={dir} className="relative mx-auto max-w-5xl">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 end-0 h-80 w-80 rounded-full bg-teal-400/20 blur-[70px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 start-0 h-80 w-80 rounded-full bg-amber-400/20 blur-[70px]"
      />

      <div className="relative z-10 space-y-6">
        <header className="rounded-3xl border border-white/90 bg-white/85 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧰</span>
            <h1 className="text-xl font-black text-[#0b1f14] sm:text-2xl">
              {isAr
                ? 'بنك الوسائل التعليمية الإلكترونية'
                : 'Digital learning tools bank'}
            </h1>
          </div>
          <p className="mt-1 text-xs leading-6 text-slate-500 sm:text-sm">
            {isAr
              ? `${AUTISM_TOOLS_BANK.length} وسيلة وتطبيقاً موزعة على ${AUTISM_TOOL_DOMAINS.length} مجالات نمائية — مراجع مساندة لأولياء الأمور والمختصين.`
              : `${AUTISM_TOOLS_BANK.length} tools and apps across ${AUTISM_TOOL_DOMAINS.length} developmental domains, for parents and specialists.`}
          </p>
        </header>

        <div className="rounded-3xl border border-amber-200/80 bg-amber-50/90 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
          <p className="text-sm font-black text-[#0b1f14]">
            {isAr
              ? 'التدريب يتم داخل المنصة حصراً'
              : 'Training runs inside the platform only'}
          </p>
          <p className="mt-1 text-[11px] leading-6 text-slate-600">
            {isAr
              ? 'هذا البنك مرجع معرفي للمختص وولي الأمر، وروابط التطبيقات الخارجية معطّلة. التدريب العملي ونطق المفردات بالعربية والرصد السلوكي كلها مبنية في أدوات المنصة التفاعلية.'
              : 'This bank is a knowledge reference for specialists and parents; external app links are disabled. Hands-on practice, Arabic pronunciation and behaviour tracking all live in the platform’s own interactive tools.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {INTERNAL_TOOLS.slice(0, 5).map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#2E7D8E]/30 bg-white px-3 py-1.5 text-[11px] font-black text-[#2E7D8E] transition hover:bg-[#2E7D8E]/10"
              >
                <span>{tool.emoji}</span>
                <span>{isAr ? tool.titleAr : tool.titleEn}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* المجالات النمائية */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <DomainTile
            active={domain === 'all'}
            emoji="🗂️"
            label={isAr ? 'كل المجالات' : 'All domains'}
            count={AUTISM_TOOLS_BANK.length}
            onClick={() => update(() => setDomain('all'))}
          />
          {AUTISM_TOOL_DOMAINS.map((entry) => (
            <DomainTile
              key={entry.id}
              active={domain === entry.id}
              emoji={entry.emoji}
              label={isAr ? entry.labelAr : entry.labelEn}
              count={counts[entry.id]}
              onClick={() => update(() => setDomain(entry.id))}
            />
          ))}
        </div>

        {/* الفلاتر */}
        <div className="space-y-3 rounded-3xl border border-white/90 bg-white/85 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl">
          <input
            value={query}
            onChange={(event) => update(() => setQuery(event.target.value))}
            placeholder={
              isAr
                ? 'ابحث باسم التطبيق أو بالهدف… مثال: التواصل البديل'
                : 'Search by app name or goal…'
            }
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 outline-none transition focus:border-[#2E7D8E] focus:bg-white sm:text-sm"
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect
              label={isAr ? 'الفئة العمرية' : 'Age group'}
              value={ageBand}
              onChange={(value) =>
                update(() => setAgeBand(value as ToolAgeBandId | 'all'))
              }
              options={[
                { value: 'all', label: isAr ? 'كل الأعمار' : 'All ages' },
                ...TOOL_AGE_BANDS.map((band) => ({
                  value: band.id,
                  label: isAr ? band.labelAr : band.labelEn,
                })),
              ]}
            />
            <FilterSelect
              label={isAr ? 'نظام التشغيل' : 'Platform'}
              value={platform}
              onChange={(value) =>
                update(() => setPlatform(value as ToolPlatformId | 'all'))
              }
              options={[
                { value: 'all', label: isAr ? 'كل الأنظمة' : 'All platforms' },
                ...TOOL_PLATFORMS.map((entry) => ({
                  value: entry.id,
                  label: isAr ? entry.labelAr : entry.labelEn,
                })),
              ]}
            />
            <FilterSelect
              label={isAr ? 'المستوى' : 'Level'}
              value={level}
              onChange={(value) => update(() => setLevel(value))}
              options={[
                { value: '', label: isAr ? 'كل المستويات' : 'All levels' },
                ...TOOL_LEVELS.map((entry) => ({
                  value: entry.id,
                  label: isAr ? entry.labelAr : entry.labelEn,
                })),
              ]}
            />

            {/* حصر بنقرة واحدة، فالأهل يبحثون عن المتوافق عربياً أولاً */}
            <div className="text-xs font-bold text-slate-600">
              <span className="mb-1.5 block">
                {isAr ? 'لغة الدعم' : 'Language'}
              </span>
              <button
                type="button"
                aria-pressed={arabicOnly}
                onClick={() => update(() => setArabicOnly((prev) => !prev))}
                className={`flex w-full items-center justify-center gap-1.5 rounded-2xl border px-4 py-2.5 text-xs font-bold transition ${
                  arabicOnly
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <span>🟢</span>
                <span>{isAr ? 'يدعم العربية' : 'Arabic supported'}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    arabicOnly
                      ? 'bg-white/20 text-white'
                      : 'bg-white text-emerald-700'
                  }`}
                >
                  {arabicCount}
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-[11px] font-bold text-slate-500">
              {isAr
                ? `${results.length} وسيلة مطابقة`
                : `${results.length} matching tools`}
            </span>
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-[11px] font-black text-[#2E7D8E] underline underline-offset-2"
              >
                {isAr ? 'إلغاء الفلاتر' : 'Clear filters'}
              </button>
            )}
          </div>
        </div>

        {/* النتائج */}
        {results.length === 0 ? (
          <div className="rounded-3xl border border-white bg-white/90 p-10 text-center shadow-sm">
            <p className="text-sm font-black text-[#0b1f14]">
              {isAr ? 'لا توجد وسيلة مطابقة' : 'No matching tools'}
            </p>
            <p className="mt-1 text-[11px] leading-6 text-slate-500">
              {isAr
                ? 'جرّب توسيع الفئة العمرية أو إلغاء أحد الفلاتر.'
                : 'Try widening the age group or clearing one of the filters.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {shown.map((tool) => (
                <ToolCard key={tool.id} tool={tool} isAr={isAr} />
              ))}
            </div>

            {visible < results.length && (
              <button
                type="button"
                onClick={() => setVisible((prev) => prev + PAGE_SIZE)}
                className="w-full rounded-2xl bg-[#2E7D8E] py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-[#236372]"
              >
                {isAr
                  ? `اعرض المزيد (${results.length - visible})`
                  : `Show more (${results.length - visible})`}
              </button>
            )}
          </>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard/home-classroom"
            className="flex-1 rounded-2xl border border-[#2E7D8E]/30 bg-white px-6 py-3.5 text-center text-xs font-bold text-[#2E7D8E] transition hover:bg-[#2E7D8E]/10"
          >
            {isAr
              ? '🏡 الغرفة الصفية المنزلية'
              : '🏡 Virtual home co-classroom'}
          </Link>
          <Link
            href="/dashboard"
            className="rounded-2xl bg-slate-200 px-6 py-3.5 text-center text-xs font-bold text-slate-700 transition hover:bg-slate-300"
          >
            {isAr ? 'العودة للوحة التحكم' : 'Return to dashboard'}
          </Link>
        </div>

        <p className="pb-2 text-center text-[10px] leading-5 text-slate-400">
          {isAr
            ? 'الوسائل مراجع معرفية لأغراض تعليمية مساندة بلا روابط خارجية، وليست بديلاً عن الخطة العلاجية أو رأي المختص.'
            : 'Knowledge references for supportive educational purposes with no outbound links — not a substitute for the therapy plan or specialist advice.'}
        </p>
      </div>
    </section>
  );
}

function DomainTile({
  active,
  emoji,
  label,
  count,
  onClick,
}: {
  active: boolean;
  emoji: string;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border p-3.5 text-start transition ${
        active
          ? 'border-[#2E7D8E] bg-[#2E7D8E]/10 shadow-sm'
          : 'border-white bg-white/85 hover:border-[#2E7D8E]/30'
      }`}
    >
      <span className="text-xl">{emoji}</span>
      <p className="mt-1 text-[11px] font-black leading-5 text-[#0b1f14]">
        {label}
      </p>
      <p className="text-[10px] font-bold text-slate-400">{count}</p>
    </button>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="text-xs font-bold text-slate-600">
      <span className="mb-1.5 block">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-800 outline-none transition hover:bg-slate-200"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToolCard({ tool, isAr }: { tool: AutismTool; isAr: boolean }) {
  const domain = domainById(tool.domain);
  const access = toolAccessLink(tool);

  return (
    <article className="flex flex-col gap-2 rounded-3xl border border-white bg-white/90 p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none">{domain?.emoji || '📱'}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black text-[#0b1f14]">{tool.toolName}</h2>
          <p className="text-[10px] font-bold text-[#2E7D8E]">
            {tool.goalCategory}
          </p>
          {supportsArabic(tool) && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
              🟢 {isAr ? 'يدعم العربية' : 'Arabic supported'}
            </span>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
          {tool.toolType}
        </span>
      </div>

      <p dir="auto" className="text-[11px] leading-6 text-slate-600">
        {tool.description}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {platformTags(tool).map((entry) => (
          <span
            key={entry.id}
            className="rounded-full bg-[#2E7D8E]/10 px-2 py-0.5 text-[10px] font-bold text-[#2E7D8E]"
          >
            {isAr ? entry.labelAr : entry.labelEn}
          </span>
        ))}
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
          {tool.targetAge}
        </span>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
          {tool.level}
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className="min-w-0 truncate text-[10px] font-bold text-slate-400">
          {tool.notes}
        </span>
        {EXTERNAL_TOOL_LINKS_ENABLED ? (
          <a
            href={access.href}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-[11px] font-black text-[#2E7D8E] underline underline-offset-2"
          >
            {access.kind === 'site'
              ? isAr
                ? 'زيارة الموقع ↗'
                : 'Visit site ↗'
              : isAr
                ? 'ابحث عن التطبيق ↗'
                : 'Search ↗'}
          </a>
        ) : (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
            {isAr ? 'مرجع معرفي' : 'Reference only'}
          </span>
        )}
      </div>
    </article>
  );
}
