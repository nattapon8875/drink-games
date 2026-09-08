import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Buffy Party Drink 🐃 | ศูนย์รวมเกมวงเหล้าออนไลน์',
  description: 'Buffy Party Drink ศูนย์รวมเกมวงเหล้าออนไลน์ เล่นหลายคนแบบเรียลไทม์ รองรับ LINE LIFF, Discord Activity และ Web Browser',
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
    <html lang="th" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning className="antialiased min-h-screen selection:bg-neon-pink selection:text-white bg-[#0f0401]">
        {/* Desktop Container Wrapper: Centers the app and locks it to mobile proportions */}
        <div className="min-h-screen w-full flex justify-center items-center md:py-4 md:px-2">
          <div className="w-full max-w-[480px] min-h-screen md:min-h-[92vh] md:max-h-[96vh] md:rounded-[36px] overflow-y-auto overflow-x-hidden relative shadow-[0_0_60px_rgba(0,0,0,0.95)] md:border-4 md:border-[#522108]/80 bg-tavern flex flex-col">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
