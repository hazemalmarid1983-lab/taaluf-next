import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import SessionProvider from '@/components/providers/SessionProvider';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'تآلف — منصة تقييم تربوي ذكية للأطفال',
  description:
    'تقييم تربوي علمي مساعد لاضطرابات طيف التوحد وصعوبات التعلم للأطفال من 3 إلى 12 سنة',
  openGraph: {
    title: 'تآلف — منصة تقييم تربوي ذكية للأطفال',
    description:
      'تقييم تربوي علمي مساعد لاضطرابات طيف التوحد وصعوبات التعلم للأطفال من 3 إلى 12 سنة',
    locale: 'ar_AE',
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
      <body className={`${cairo.variable} font-sans antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
