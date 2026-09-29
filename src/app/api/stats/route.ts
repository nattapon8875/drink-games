import { NextResponse } from 'next/server';
import { checkStatsPassword, readStatsEvents, StatsEvent } from '@/lib/statsLog';

export const dynamic = 'force-dynamic';

// A wrong password costs an attempt; after MAX_FAILURES in the window that
// address is refused until the window passes. In memory, like the rooms.
const MAX_FAILURES = 8;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const failures = new Map<string, { count: number; since: number }>();

const DAYS = 30;

function clientAddress(req: Request): string {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'local'
  );
}

// The day as it is in Thailand, where the players are.
function bangkokDay(iso: string): string {
  return new Date(new Date(iso).getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

interface DayRow {
  day: string;
  rooms: number;
  games: number;
  finished: number;
  players: number;
}

function summarise(events: StatsEvent[]) {
  const today = bangkokDay(new Date().toISOString());
  const firstDay = bangkokDay(new Date(Date.now() - (DAYS - 1) * 86400000).toISOString());
  const recent = events.filter((e) => {
    const d = bangkokDay(e.t);
    return d >= firstDay && d <= today;
  });

  const days = new Map<string, { rooms: number; games: number; finished: number; players: Set<string> }>();
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = bangkokDay(new Date(Date.now() - i * 86400000).toISOString());
    days.set(d, { rooms: 0, games: 0, finished: 0, players: new Set() });
  }

  const games = new Map<string, { rooms: number; games: number; finished: number }>();
  const platformPlayers = new Map<string, Set<string>>();
  const allPlayers = new Set<string>();

  for (const e of recent) {
    const day = days.get(bangkokDay(e.t));
    const g = games.get(e.game) || { rooms: 0, games: 0, finished: 0 };
    games.set(e.game, g);

    if (e.type === 'room_created') {
      g.rooms++;
      if (day) day.rooms++;
    } else if (e.type === 'game_started') {
      g.games++;
      if (day) day.games++;
    } else if (e.type === 'game_finished') {
      g.finished++;
      if (day) day.finished++;
    }

    if (e.player) {
      allPlayers.add(e.player);
      if (day) day.players.add(e.player);
      const p = e.platform || 'web';
      if (!platformPlayers.has(p)) platformPlayers.set(p, new Set());
      platformPlayers.get(p)!.add(e.player);
    }
  }

  const byDay: DayRow[] = Array.from(days, ([d, v]) => ({
    day: d,
    rooms: v.rooms,
    games: v.games,
    finished: v.finished,
    players: v.players.size,
  }));

  return {
    days: DAYS,
    since: events.length ? events[0].t : null,
    totals: {
      rooms: byDay.reduce((s, r) => s + r.rooms, 0),
      games: byDay.reduce((s, r) => s + r.games, 0),
      finished: byDay.reduce((s, r) => s + r.finished, 0),
      players: allPlayers.size,
    },
    byDay,
    byGame: Array.from(games, ([game, v]) => ({ game, ...v })).sort((a, b) => b.rooms - a.rooms),
    byPlatform: Array.from(platformPlayers, ([platform, s]) => ({ platform, players: s.size })).sort(
      (a, b) => b.players - a.players
    ),
  };
}

export async function POST(req: Request) {
  const addr = clientAddress(req);
  const now = Date.now();
  const f = failures.get(addr);
  if (f && now - f.since < FAILURE_WINDOW_MS && f.count >= MAX_FAILURES) {
    return NextResponse.json({ error: 'ใส่รหัสผิดหลายครั้งเกินไป ลองใหม่ในอีก 15 นาที' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  if (!process.env.STATS_PASSWORD_HASH) {
    return NextResponse.json({ error: 'ยังไม่ได้ตั้งรหัสสำหรับหน้าสถิติบนเซิร์ฟเวอร์' }, { status: 503 });
  }
  if (!checkStatsPassword(body.password)) {
    const fresh = !f || now - f.since >= FAILURE_WINDOW_MS;
    failures.set(addr, { count: fresh ? 1 : f!.count + 1, since: fresh ? now : f!.since });
    return NextResponse.json({ error: 'รหัสไม่ถูกต้อง' }, { status: 401 });
  }
  failures.delete(addr);

  return NextResponse.json(summarise(await readStatsEvents()), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
