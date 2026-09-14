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
  return (
    <div className="w-full min-h-screen bg-[#0d0704] bg-tavern text-amber-100 flex flex-col">
      {children}
    </div>
  );
}
