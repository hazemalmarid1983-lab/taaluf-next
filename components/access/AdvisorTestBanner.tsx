'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';

/** شريط للمستشار العلمي عند دخول بيئات الاختبار — بلا صلاحيات إنتاج. */
export default function AdvisorTestBanner() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-950 print:hidden">
      <p>
        {isAr
          ? 'وضع اختبار للمستشار العلمي: يمكنك المراجعة والتجربة والاقتراح. التعديل الهيكلي ونشر الإنتاج محصوران بحازم.'
          : 'Scientific advisor test mode: you may review, try, and propose. Structural changes and production deploys stay with Hazem.'}{' '}
        <Link href="/hub" className="font-semibold underline">
          {isAr ? 'العودة للمركز البحثي' : 'Back to the research hub'}
        </Link>
      </p>
    </div>
  );
}
