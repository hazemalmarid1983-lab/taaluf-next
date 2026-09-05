import type { Metadata } from 'next';
import { Amiri, Tajawal } from 'next/font/google';
import SessionProvider from '@/components/providers/SessionProvider';
import RbacShell from '@/components/access/RbacShell';
import { LanguageProvider } from '@/components/LanguageProvider';
import LegalBanner from '@/components/layout/LegalBanner';
import SiteFooter from '@/components/layout/SiteFooter';
import './globals.css';

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-tajawal',
  display: 'swap',
});

const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'تآلف — منصة تقييم تربوي ذكية للأطفال',
  description:
    'تقييم تربوي علمي مساعد لاضطرابات طيف التوحد وصعوبات التعلم — سلطنة عمان',
  openGraph: {
    title: 'تآلف — منصة تقييم تربوي ذكية للأطفال',
    description:
      'تقييم تربوي علمي مساعد لاضطرابات طيف التوحد وصعوبات التعلم — سلطنة عمان',
    locale: 'ar_OM',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${tajawal.variable} ${amiri.variable} bg-cream font-body antialiased text-ink`}
      >
        <SessionProvider>
          <RbacShell>
            <LanguageProvider>
              <LegalBanner />
              {children}
              <SiteFooter />
            </LanguageProvider>
          </RbacShell>
        </SessionProvider>
      </body>
    </html>
  );
}
