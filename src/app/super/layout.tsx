import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'ซุปเปอร์เศรษฐี คลาสสิก 🏠 | Classic Super Monopoly Thai Edition',
  description: 'เกมซุปเปอร์เศรษฐี ยุค 90s ฉบับคลาสสิกเต็มจอ ซื้อขายที่ดิน ปลูกบ้าน โรงแรม ยูนิตเงินหลักล้าน (M) เล่นง่ายบน Discord และ Web Browser',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function SuperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // A page inside here is flex-1, which the flex algorithm sizes from this
  // wrapper - so capping the page alone did nothing until the wrapper was
  // capped too. On a short, wide window (a Discord activity) there is exactly
  // one screen to grow into.
  return (
    <div className="w-full min-h-screen [@media(max-height:820px)_and_(min-width:1024px)]:min-h-0 [@media(max-height:820px)_and_(min-width:1024px)]:h-[100dvh] [@media(max-height:820px)_and_(min-width:1024px)]:overflow-hidden bg-bg bg-tavern text-ink flex flex-col">
      {children}
    </div>
  );
}
