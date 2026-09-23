// What each player looks like: a colour and a character, drawn at random for
// every game.
//
// Both used to follow the seat, so a solo game against bots dealt the same
// red straw hat to the host and the same three bots every time. Now the host
// draws from the whole palette and the whole cast when the game starts, and
// the draw is stored in game_state.looks so every client paints the same
// thing. Colours and characters are drawn separately, and nobody at a table
// shares either one.

export const PLAYER_3D_COLORS = [
  '#ef4444', // Crimson Red
  '#3b82f6', // Royal Blue
  '#10b981', // Emerald Green
  '#f59e0b', // Golden Amber
  '#8b5cf6', // Purple Violet
  '#ec4899', // Hot Pink
  '#06b6d4', // Electric Cyan
  '#84cc16', // Lime Green
  '#f97316', // Bright Orange
  '#e11d48', // Ruby Rose
  '#14b8a6', // Teal Mint
  '#6366f1', // Indigo Blue
  '#d946ef', // Neon Fuchsia
  '#eab308', // Bright Yellow
  '#64748b', // Slate Steel
  '#fb7185', // Coral Salmon
  '#0284c7', // Deep Sky Blue
  '#a855f7', // Vivid Violet
  '#4ade80', // Light Green
  '#fbbf24', // Sun Gold
];

// hat: 0 straw hat · 1 headband · 2 twin tails · 3 spiked up
// face: one of the six expressions createAnimeFaceTexture draws.
export const FIGURE_CAST = [
  { hair: '#2b2440', skin: '#ffe0c4', eyes: '#0ea5e9', face: 0, hat: 0 },
  { hair: '#1e3a5f', skin: '#f8d3b0', eyes: '#0369a1', face: 2, hat: 1 },
  { hair: '#0f766e', skin: '#ffd8bc', eyes: '#059669', face: 3, hat: 3 },
  { hair: '#c2410c', skin: '#eec6a6', eyes: '#b45309', face: 4, hat: 2 },
  { hair: '#4c1d95', skin: '#ffe6d0', eyes: '#7c3aed', face: 5, hat: 0 },
  { hair: '#9d174d', skin: '#ffe0c4', eyes: '#e11d48', face: 1, hat: 1 },
  { hair: '#155e75', skin: '#f3cba8', eyes: '#06b6d4', face: 0, hat: 2 },
  { hair: '#3f6212', skin: '#f8d3b0', eyes: '#4d7c0f', face: 2, hat: 3 },
  { hair: '#7c2d12', skin: '#ffd8bc', eyes: '#ea580c', face: 3, hat: 0 },
  { hair: '#881337', skin: '#ffe6d0', eyes: '#be123c', face: 4, hat: 1 },
  { hair: '#134e4a', skin: '#eec6a6', eyes: '#0d9488', face: 5, hat: 2 },
  { hair: '#312e81', skin: '#ffe0c4', eyes: '#4f46e5', face: 1, hat: 3 },
];

export interface PlayerLook {
  color: number; // index into PLAYER_3D_COLORS
  figure: number; // index into FIGURE_CAST
}

export type PlayerLooks = Record<string, PlayerLook>;

// A random pick from what nobody at the table is using yet. When everything is
// taken (more players than options) it falls back to the whole range.
function drawFrom(size: number, taken: Set<number>, rand: () => number): number {
  const free: number[] = [];
  for (let i = 0; i < size; i++) if (!taken.has(i)) free.push(i);
  const pool = free.length > 0 ? free : Array.from({ length: size }, (_, i) => i);
  return pool[Math.floor(rand() * pool.length)];
}

// Gives a look to every player who has none, keeping the ones already drawn so
// a player joining mid-game does not repaint everyone else. Returns null when
// there is nothing to add.
export function assignLooks(
  playerIds: string[],
  existing: PlayerLooks,
  rand: () => number = Math.random
): PlayerLooks | null {
  const missing = playerIds.filter((id) => !existing[id]);
  if (missing.length === 0) return null;

  const next: PlayerLooks = { ...existing };
  const colors = new Set(playerIds.filter((id) => next[id]).map((id) => next[id].color));
  const figures = new Set(playerIds.filter((id) => next[id]).map((id) => next[id].figure));

  for (const id of missing) {
    const look = {
      color: drawFrom(PLAYER_3D_COLORS.length, colors, rand),
      figure: drawFrom(FIGURE_CAST.length, figures, rand),
    };
    colors.add(look.color);
    figures.add(look.figure);
    next[id] = look;
  }
  return next;
}

// The drawn look, or the seat's old fixed one for the moment before the host's
// draw has arrived.
export function lookOf(
  looks: PlayerLooks | null | undefined,
  players: { id: string }[],
  playerId: string
): PlayerLook {
  const drawn = looks?.[playerId];
  if (drawn) return drawn;
  const seat = Math.max(0, players.findIndex((p) => p.id === playerId));
  return { color: seat % PLAYER_3D_COLORS.length, figure: seat % FIGURE_CAST.length };
}

export function colorOf(
  looks: PlayerLooks | null | undefined,
  players: { id: string }[],
  playerId: string
): string {
  return PLAYER_3D_COLORS[lookOf(looks, players, playerId).color];
}
