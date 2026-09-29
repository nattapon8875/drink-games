'use client';

import React, { useState } from 'react';
import { Loader2, Lock, RefreshCw } from 'lucide-react';

interface DayRow {
  day: string;
  rooms: number;
  games: number;
  finished: number;
  players: number;
}

interface Stats {
  days: number;
  since: string | null;
  totals: { rooms: number; games: number; finished: number; players: number };
  byDay: DayRow[];
  byGame: { game: string; rooms: number; games: number; finished: number }[];
  byPlatform: { platform: string; players: number }[];
}

const GAME_NAMES: Record<string, string> = {
  'super-monopoly': 'ซุปเปอร์เศรษฐี',
  monopoly: 'เกมเศรษฐีวงเหล้า',
  'spin-bottle': 'หมุนขวดวัดใจ',
  'doraemon-card': 'เกมไพ่คิงส์',
  wheel: 'วงล้อเสี่ยงทายวงเหล้า',
  crocodile: 'เกมน้องควายงับนิ้ว',
};

const PLATFORM_NAMES: Record<string, string> = {
  web: 'เว็บ',
  discord: 'Discord',
  line: 'LINE',
};

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const dayLabel = (d: string) => `${Number(d.slice(8, 10))} ${THAI_MONTHS[Number(d.slice(5, 7)) - 1]}`;

// The password stays in this component's memory only, so a refresh of the
// numbers can resend it; reloading the page asks for it again.
export default function StatsPage() {
  const [password, setPassword] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'โหลดสถิติไม่สำเร็จ');
        setStats(null);
      } else {
        setStats(data);
      }
    } catch {
      setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    } finally {
      setLoading(false);
    }
  };

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <form
          onSubmit={load}
          className="w-full max-w-sm bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-3))] rounded-2xl p-6 flex flex-col gap-4"
        >
          <h1 className="text-lg font-black flex items-center gap-2">
            <Lock className="w-5 h-5" /> สถิติการเล่น
          </h1>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="รหัสผ่าน"
            className="w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--c-bg-deep))] border border-[rgb(var(--c-surface-2))] focus:outline-none focus:border-[rgb(var(--c-mint))] text-sm"
          />
          {error && <p className="text-sm font-bold text-[rgb(var(--c-berry-label))]">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="wood-btn-gold py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>ดูสถิติ</span>
          </button>
        </form>
      </div>
    );
  }

  const maxPlayers = Math.max(1, ...stats.byDay.map((d) => d.players));
  const tiles = [
    { label: 'ผู้เล่น (ไม่ซ้ำ)', value: stats.totals.players },
    { label: 'ห้องที่สร้าง', value: stats.totals.rooms },
    { label: 'เกมที่เริ่มเล่น', value: stats.totals.games },
    { label: 'เกมที่เล่นจบ', value: stats.totals.finished },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black">สถิติการเล่น</h1>
          <p className="text-sm text-[rgb(var(--c-ink-soft))]">
            {stats.days} วันล่าสุด
            {stats.since && ` · เริ่มเก็บตั้งแต่ ${dayLabel(stats.since.slice(0, 10))}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="px-3 py-2 rounded-xl bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-3))] text-sm font-bold flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>รีเฟรช</span>
        </button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-3))] rounded-2xl p-4">
            <div className="text-sm text-[rgb(var(--c-ink-soft))] font-semibold">{t.label}</div>
            <div className="text-3xl font-black tabular-nums mt-1">{t.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <section className="bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-3))] rounded-2xl p-4">
        <h2 className="text-base font-black mb-3">ผู้เล่นต่อวัน</h2>
        <div className="flex items-end gap-[2px] h-40 border-b border-[rgb(var(--c-surface-3))]" role="img" aria-label="กราฟจำนวนผู้เล่นต่อวัน">
          {stats.byDay.map((d) => (
            <div key={d.day} className="group relative flex-1 h-full flex items-end">
              <div
                className="w-full rounded-t bg-[rgb(var(--c-mint))] group-hover:opacity-80"
                style={{ height: d.players ? `${(d.players / maxPlayers) * 100}%` : 0 }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap rounded-lg bg-[rgb(var(--c-bg-deep))] border border-[rgb(var(--c-surface-3))] px-2 py-1 text-xs font-semibold z-10">
                {dayLabel(d.day)} · ผู้เล่น {d.players} · ห้อง {d.rooms} · เริ่มเกม {d.games}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-[rgb(var(--c-ink-soft))] mt-1.5">
          <span>{dayLabel(stats.byDay[0].day)}</span>
          <span>สูงสุด {maxPlayers} คน/วัน</span>
          <span>{dayLabel(stats.byDay[stats.byDay.length - 1].day)}</span>
        </div>
      </section>

      <div className="grid sm:grid-cols-2 gap-3">
        <section className="bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-3))] rounded-2xl p-4">
          <h2 className="text-base font-black mb-2">แยกตามเกม</h2>
          {stats.byGame.length === 0 ? (
            <p className="text-sm text-[rgb(var(--c-ink-soft))]">ยังไม่มีข้อมูล</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-[rgb(var(--c-ink-soft))]">
                <tr>
                  <th className="text-left font-semibold py-1">เกม</th>
                  <th className="text-right font-semibold py-1">ห้อง</th>
                  <th className="text-right font-semibold py-1">เริ่ม</th>
                  <th className="text-right font-semibold py-1">จบ</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {stats.byGame.map((g) => (
                  <tr key={g.game} className="border-t border-[rgb(var(--c-surface-2))]">
                    <td className="py-1.5">{GAME_NAMES[g.game] || g.game}</td>
                    <td className="text-right">{g.rooms}</td>
                    <td className="text-right">{g.games}</td>
                    <td className="text-right">{g.finished}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-xs text-[rgb(var(--c-ink-faint))] mt-2">&ldquo;จบ&rdquo; นับเฉพาะซุปเปอร์เศรษฐีที่มีผู้ชนะ</p>
        </section>

        <section className="bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-3))] rounded-2xl p-4">
          <h2 className="text-base font-black mb-2">ผู้เล่นมาจากไหน</h2>
          {stats.byPlatform.length === 0 ? (
            <p className="text-sm text-[rgb(var(--c-ink-soft))]">ยังไม่มีข้อมูล</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="tabular-nums">
                {stats.byPlatform.map((p) => (
                  <tr key={p.platform} className="border-t first:border-t-0 border-[rgb(var(--c-surface-2))]">
                    <td className="py-1.5">{PLATFORM_NAMES[p.platform] || p.platform}</td>
                    <td className="text-right">{p.players} คน</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <details className="bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-3))] rounded-2xl p-4">
        <summary className="text-base font-black cursor-pointer">ตารางรายวัน</summary>
        <table className="w-full text-sm mt-2">
          <thead className="text-[rgb(var(--c-ink-soft))]">
            <tr>
              <th className="text-left font-semibold py-1">วัน</th>
              <th className="text-right font-semibold py-1">ผู้เล่น</th>
              <th className="text-right font-semibold py-1">ห้อง</th>
              <th className="text-right font-semibold py-1">เริ่มเกม</th>
              <th className="text-right font-semibold py-1">จบ</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {[...stats.byDay].reverse().map((d) => (
              <tr key={d.day} className="border-t border-[rgb(var(--c-surface-2))]">
                <td className="py-1.5">{dayLabel(d.day)}</td>
                <td className="text-right">{d.players}</td>
                <td className="text-right">{d.rooms}</td>
                <td className="text-right">{d.games}</td>
                <td className="text-right">{d.finished}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <p className="text-xs text-[rgb(var(--c-ink-faint))] leading-relaxed">
        ผู้เล่นนับจากรหัสประจำเครื่องหรือบัญชี ไม่เก็บชื่อหรือ IP · บอทไม่ถูกนับ
      </p>
    </div>
  );
}
