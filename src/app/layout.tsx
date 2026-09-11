import type { Metadata, Viewport } from 'next';
import { Chakra_Petch } from 'next/font/google';
import './globals.css';

const chakraPetch = Chakra_Petch({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-chakra',
});

export const metadata: Metadata = {
  title: 'Buffy Party Drink 🐃 | ศูนย์รวมเกมวงเหล้าออนไลน์',
  description: 'Buffy Party Drink ศูนย์รวมเกมวงเหล้าออนไลน์ เล่นหลายคนแบบเรียลไทม์ รองรับ LINE LIFF, Discord Activity และ Web Browser',
  icons: {
    icon: '/buffy-mascot.png?v=4_1',
    shortcut: '/buffy-mascot.png?v=4_1',
    apple: '/buffy-mascot.png?v=4_1',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`dark ${chakraPetch.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning className={`${chakraPetch.className} antialiased min-h-screen selection:bg-neon-pink selection:text-white bg-[#0f0401]`}>
        {/* Desktop Container Wrapper: Centers the app and locks it to mobile proportions */}
        <div className="min-h-screen w-full flex justify-center items-start md:py-6 md:px-2">
          <div className="w-full max-w-[440px] min-h-screen md:min-h-[90vh] md:rounded-[36px] overflow-hidden relative shadow-[0_0_60px_rgba(0,0,0,0.95)] md:border-2 md:border-[#522108]/80 bg-tavern flex flex-col">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
