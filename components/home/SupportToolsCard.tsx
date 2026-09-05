'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { recommendToolsForGoal } from '@/lib/activityGenerator';
import { EXTERNAL_TOOL_LINKS_ENABLED } from '@/lib/featureFlags';
import { recommendInternalTools } from '@/lib/internalTools';
import { domainById, platformTags, supportsArabic, toolAccessLink } from '@/lib/toolsBank';

/**
 * أدوات مساندة مقترحة لهذا الهدف، تُعرض في تقرير الجلسة المنزلية.
 * الترشيح داخلي بالكامل: أدوات تعمل داخل المنصة بالعربية وبرصد مرتبط بملف الطفل.
 * التطبيقات الخارجية تظهر فقط إن أُعيد تفعيل رايتها.
 */
export default function SupportToolsCard({
  goalText,
  level,
  limit,
}: {
  goalText: string;
  level?: string;
  limit?: number;
}) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const tools = useMemo(
    () => recommendInternalTools(goalText, limit),
    [goalText, limit]
  );

  return (
    <div className="space-y-3 rounded-2xl border border-[#2E7D8E]/20 bg-[#2E7D8E]/[0.06] p-5">
      <div className="min-w-0">
        <strong className="flex items-center gap-1.5 text-sm font-bold text-[#0b1f14]">
          <span>🧩</span>
          <span>
            {isAr
              ? 'أدوات المنصة التفاعلية المقترحة لهذا الهدف'
              : 'Suggested in-platform tools for this goal'}
          </span>
        </strong>
        <p className="mt-1 text-[11px] leading-6 text-slate-500">
          {isAr
            ? 'كل التدريب يتم داخل المنصة بالعربية، ويُرصد مباشرة في ملف الطفل — بلا تطبيقات خارجية.'
            : 'All practice runs inside the platform in Arabic and is logged straight into the child record — no external apps.'}
        </p>
      </div>

      <ul className="space-y-2">
        {tools.map((tool) => (
          <li
            key={tool.id}
            className="rounded-2xl border border-white bg-white/90 p-3.5 shadow-sm"
          >
            <Link href={tool.href} className="flex items-start gap-3">
              <span className="text-xl leading-none">{tool.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-black text-[#0b1f14]">
                    {isAr ? tool.titleAr : tool.titleEn}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                    🟢 {isAr ? 'داخل المنصة' : 'In-platform'}
                  </span>
                </div>
                <p dir="auto" className="mt-1 text-[11px] leading-6 text-slate-600">
                  {isAr ? tool.descAr : tool.descEn}
                </p>
                <span className="mt-1.5 inline-block text-[10px] font-black text-[#2E7D8E] underline underline-offset-2">
                  {isAr ? 'افتح الأداة ➔' : 'Open the tool ➔'}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {EXTERNAL_TOOL_LINKS_ENABLED && (
        <ExternalToolSuggestions goalText={goalText} level={level} />
      )}
    </div>
  );
}

/** مراجع خارجية — معطّلة افتراضياً عبر راية EXTERNAL_TOOL_LINKS_ENABLED */
function ExternalToolSuggestions({
  goalText,
  level,
}: {
  goalText: string;
  level?: string;
}) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const tools = useMemo(
    () => recommendToolsForGoal(goalText, level),
    [goalText, level]
  );

  if (!tools.length) return null;

  return (
    <div className="space-y-2 border-t border-[#2E7D8E]/15 pt-3">
      <strong className="text-[11px] font-black text-slate-500">
        {isAr ? 'مراجع خارجية إضافية' : 'Additional external references'}
      </strong>
      <ul className="space-y-2">
        {tools.map((tool) => {
          const domain = domainById(tool.domain);
          const access = toolAccessLink(tool);
          return (
            <li
              key={tool.id}
              className="rounded-2xl border border-white bg-white/90 p-3.5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl leading-none">{domain?.emoji || '📱'}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-black text-[#0b1f14]">
                      {tool.toolName}
                    </span>
                    {supportsArabic(tool) && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                        🟢 {isAr ? 'يدعم العربية' : 'Arabic'}
                      </span>
                    )}
                    {platformTags(tool).map((platform) => (
                      <span
                        key={platform.id}
                        className="rounded-full bg-[#2E7D8E]/10 px-2 py-0.5 text-[10px] font-bold text-[#2E7D8E]"
                      >
                        {isAr ? platform.labelAr : platform.labelEn}
                      </span>
                    ))}
                  </div>
                  <p dir="auto" className="mt-1 text-[11px] leading-6 text-slate-600">
                    {tool.description}
                  </p>
                  <a
                    href={access.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-block text-[10px] font-black text-[#2E7D8E] underline underline-offset-2"
                  >
                    {access.kind === 'site'
                      ? isAr
                        ? 'زيارة الموقع ↗'
                        : 'Visit site ↗'
                      : isAr
                        ? 'ابحث عن التطبيق ↗'
                        : 'Search for the app ↗'}
                  </a>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
