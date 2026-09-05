'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  CLINICAL_ROLES,
  isRoleSwitcherEnabled,
  ROLE_LABELS,
} from '@/lib/permissions';
import {
  RBAC_WIDGET_COLLAPSED_KEY,
  shouldHideRbacWidget,
} from '@/lib/immersiveExperience';
import { usePermissionsOptional } from '@/components/access/PermissionsProvider';
import { useLanguage } from '@/components/LanguageProvider';

/**
 * مفتاح تبديل الأدوار للاختبار — يظهر في التطوير فقط (مُعطّل تلقائياً في الإنتاج).
 */
export default function RoleSwitcher() {
  const ctx = usePermissionsOptional();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const pathname = usePathname() || '/';
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(sessionStorage.getItem(RBAC_WIDGET_COLLAPSED_KEY) === '1');
    } catch {
      setCollapsed(false);
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        if (next) sessionStorage.setItem(RBAC_WIDGET_COLLAPSED_KEY, '1');
        else sessionStorage.removeItem(RBAC_WIDGET_COLLAPSED_KEY);
      } catch {
        /* private mode */
      }
      return next;
    });
  };

  if (!isRoleSwitcherEnabled() || !ctx) return null;
  if (shouldHideRbacWidget(pathname)) return null;

  const { role, mockRole, setMockRole, clearMockRole, sessionRole } = ctx;

  if (collapsed) {
    return (
      <button
        type="button"
        data-taaluf-rbac-widget
        onClick={toggleCollapsed}
        className="fixed bottom-4 start-4 z-[300] rounded-full border border-violet-400/60 bg-violet-950/90 px-3 py-2 text-[10px] font-black text-violet-100 shadow-lg backdrop-blur-md print:hidden"
        aria-label={isAr ? 'فتح معاينة RBAC' : 'Expand RBAC preview'}
        title={isAr ? 'معاينة الأدوار' : 'Role preview'}
      >
        🔧 RBAC
      </button>
    );
  }

  return (
    <div
      data-taaluf-rbac-widget
      className="fixed bottom-4 start-4 z-[300] max-w-xs rounded-2xl border border-violet-300/80 bg-violet-950/95 p-3 text-white shadow-2xl backdrop-blur-md print:hidden"
      role="region"
      aria-label={isAr ? 'مبدّل الأدوار للاختبار' : 'Role switcher for testing'}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-violet-300">
          {isAr ? '🔧 RBAC · معاينة الدور' : '🔧 RBAC · Role preview'}
        </p>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="rounded-full px-2 py-0.5 text-[10px] font-bold text-violet-200 hover:bg-white/10"
          aria-label={isAr ? 'تصغير' : 'Minimize'}
          title={isAr ? 'تصغير' : 'Minimize'}
        >
          −
        </button>
      </div>
      <p className="mt-1 text-[10px] text-violet-200/80">
        {isAr ? 'الجلسة:' : 'Session:'} {sessionRole || '—'}
        {mockRole ? (isAr ? ' · محاكاة' : ' · mock') : ''}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {CLINICAL_ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setMockRole(r)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
              role === r
                ? 'bg-white text-violet-900'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {ROLE_LABELS[r].emoji}{' '}
            {isAr ? ROLE_LABELS[r].ar : ROLE_LABELS[r].en}
          </button>
        ))}
      </div>
      {mockRole && (
        <button
          type="button"
          onClick={clearMockRole}
          className="mt-2 w-full text-center text-[10px] font-bold text-violet-300 underline"
        >
          {isAr ? 'إلغاء المحاكاة' : 'Clear mock role'}
        </button>
      )}
    </div>
  );
}
