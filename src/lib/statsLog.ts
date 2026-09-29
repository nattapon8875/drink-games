import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Usage log for /stats. One JSON object per line, appended to a file so it
// survives the restarts that wipe every room. It holds counts, never names or
// IP addresses: a player appears only as a salted hash of their id, which is
// enough to count distinct players and nothing more.

export type StatsEventType =
  | 'room_created'
  | 'player_joined'
  | 'game_started'
  | 'game_finished'
  | 'room_closed';

export type StatsPlatform = 'web' | 'discord' | 'line';

export interface StatsEvent {
  t: string; // ISO time
  type: StatsEventType;
  game: string;
  room: string;
  platform?: StatsPlatform;
  player?: string; // salted hash of the player id
  humans?: number;
  bots?: number;
}

const LOG_PATH = process.env.STATS_LOG_PATH || path.join(process.cwd(), 'data', 'events.jsonl');

export function hashPlayerId(id: string): string {
  const salt = process.env.STATS_SALT || 'buffy-drink-stats';
  return crypto.createHash('sha256').update(salt + id).digest('hex').slice(0, 16);
}

// Discord serves the activity from <app id>.discordsays.com and proxies the API
// calls, so the page it was called from says where the player is. LINE's
// in-app browser names itself in the user agent.
export function platformOf(req: Request): StatsPlatform {
  const from = `${req.headers.get('origin') || ''} ${req.headers.get('referer') || ''}`;
  if (from.includes('discordsays.com')) return 'discord';
  const ua = req.headers.get('user-agent') || '';
  if (/\bLine\/|LIFF/i.test(ua)) return 'line';
  return 'web';
}

// Writes go one after another, so lines land in the order they happened.
let writeQueue: Promise<void> = Promise.resolve();

// Fire and forget: a room action must never fail or wait because the log could
// not be written.
export function logStatsEvent(event: Omit<StatsEvent, 't'>): void {
  const line = JSON.stringify({ t: new Date().toISOString(), ...event }) + '\n';
  writeQueue = writeQueue
    .then(() => fs.mkdir(path.dirname(LOG_PATH), { recursive: true }))
    .then(() => fs.appendFile(LOG_PATH, line, 'utf8'))
    .catch((err) => console.error('[stats] could not write event:', err));
}

export async function readStatsEvents(): Promise<StatsEvent[]> {
  let raw: string;
  try {
    raw = await fs.readFile(LOG_PATH, 'utf8');
  } catch {
    return [];
  }
  const events: StatsEvent[] = [];
  for (const line of raw.split('\n')) {
    if (!line) continue;
    try {
      events.push(JSON.parse(line));
    } catch {
      // a line cut short by a crash mid-write; skip it
    }
  }
  return events;
}

// The /stats password is kept only as `scrypt:<salt hex>:<hash hex>` in
// STATS_PASSWORD_HASH (not `$`: Next expands `$name` inside .env files). Make one with:
//   node -e "const c=require('crypto'),s=c.randomBytes(16);console.log('scrypt:'+s.toString('hex')+':'+c.scryptSync(process.argv[1],s,32).toString('hex'))" '<password>'
export function checkStatsPassword(password: string): boolean {
  const stored = process.env.STATS_PASSWORD_HASH;
  if (!stored || typeof password !== 'string') return false;
  const [scheme, saltHex, hashHex] = stored.split(':');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}
