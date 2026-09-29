import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'สถิติการเล่น | Buffy Party Drink',
  robots: { index: false, follow: false },
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[rgb(var(--c-bg))] text-[rgb(var(--c-ink))]">{children}</div>;
}
