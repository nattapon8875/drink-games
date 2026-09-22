import type { Metadata, Viewport } from 'next';
import { Chakra_Petch } from 'next/font/google';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/common/ServiceWorkerRegister';

const chakraPetch = Chakra_Petch({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-chakra',
});

export const metadata: Metadata = {
  title: 'Buffy Party Drink 🐃 | ศูนย์รวมเกมวงเหล้าออนไลน์',
  description: 'Buffy Party Drink ศูนย์รวมเกมวงเหล้าออนไลน์ เล่นหลายคนแบบเรียลไทม์ รองรับ LINE LIFF, Discord Activity และ Web Browser',
  manifest: '/manifest.json',
  applicationName: 'Buffy Party Drink',
  icons: {
    icon: '/buffy-mascot.png?v=4_1',
    shortcut: '/buffy-mascot.png?v=4_1',
    // iOS never composites transparency and does its own rounding, so it gets
    // a 180px opaque square of its own rather than the site favicon.
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Buffy Party',
    // 'black' and not 'black-translucent': translucent puts the page under the
    // notch, and nothing in this app reads env(safe-area-inset-*) yet, so the
    // top of every screen would be sitting behind the clock.
    statusBarStyle: 'black',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Matches --c-bg of the dark theme, which is the default.
  themeColor: '#101a2b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={chakraPetch.variable} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${chakraPetch.className} antialiased min-h-screen selection:bg-mint selection:text-white bg-bg text-ink`}
      >
        {/* Set the theme before anything paints, so nobody sees the wrong one
            flash on the way in. Dark is the default when there is no saved
            choice; "system" is something the visitor opts into. This sits at
            the top of the body rather than in a head tag, which the app router
            does not render from a layout. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('party_theme');if(t!=='light'&&t!=='dark'&&t!=='system'){t='dark';}if(t!=='system'){document.documentElement.setAttribute('data-theme',t);}}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`,
          }}
        />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
