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
        {children}
      </body>
    </html>
  );
}
