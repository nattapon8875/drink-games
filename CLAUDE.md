# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server on :3000
npm run build    # production build - also the full type check
npm run lint     # next lint
npx tsc --noEmit # type check only, faster than a build
```

There is no test runner. Pure rule logic (in `superMonopolyData.ts`) is checked with throwaway scripts run through `npx tsx <file>.ts` from the repo root, then deleted. Anything visual is checked in the browser, usually in a solo game against bots (`/super` → "เล่นคนเดียวกับบอท").

If the dev server starts serving a stale or broken chunk after a large edit, stop it and delete `.next/cache` before restarting.

## What this is

A Thai party drinking-game hub ("Buffy Party Drink"), Next.js 14 App Router + React 18 + TypeScript + Tailwind. UI text is Thai. It runs as a normal website, inside a Discord Activity (iframe), and in LINE LIFF; `src/lib/platforms/` resolves who the user is on each.

Two separate front doors:
- `/` (route group `src/app/(party)/`) - the party games: `doraemon-card`, `spin-bottle`, `wheel`, `crocodile`, `monopoly`. `play/[roomCode]/page.tsx` switches on `room.game_type`.
- `/super` - Super Monopoly, a much larger standalone game with its own lobby, play page and layout. A `super-monopoly` room opened through the party route is redirected to `/super/play/...`.

The README describes an older state of the project (a 24-tile monopoly, Supabase as the only backend); trust the code over it.

## Rooms and realtime - the part that needs several files to understand

All shared state lives in one room record: `players` plus `room.game_state`, a free-form JSON object each game owns. Games never talk to the backend directly; they receive `BaseGameProps` (`src/types/game.ts`) and write through `onUpdateGameState(partial)`, which **shallow-merges** `partial` into `game_state`.

`src/hooks/useRoomRealtime.ts` has two backends, chosen by `isSupabaseConfigured()`:
- **Supabase** (realtime subscriptions) - the code path exists but no `.env.local` is configured anywhere, so it is not what runs.
- **Server fallback** - what actually runs, locally and in production. `src/app/api/room/route.ts` keeps rooms in `src/lib/serverRoomStore.ts`, two `Map`s on `globalThis`. Clients poll every 400ms and write with `POST /api/room {action, code, ...}`. There is no persistence and no TTL: **every server restart wipes every room.**

Consequences worth knowing before touching game logic:
- Writes are optimistic and the poll reconciles; each server write bumps `game_state.rev` so a client can ignore a poll older than its own write.
- Anything read inside an async callback (a dice walk, a bot turn) is a render-time snapshot. Rebuilding a table as `{ ...cash, [me]: x }` from that snapshot silently overwrites what other players or earlier steps wrote. Super Monopoly carries running tallies across a turn (`botCashAll`, `botProperties`) and reads live values through refs (`cashRef`, `propertiesRef`); follow that pattern.
- Injecting `game_state` from outside (devtools, a `POST update_state`) while a client is running gets overwritten by that client's next write.
- Bots have no server: they are played by the **host's** client inside the engine hook (`isHost`), so they stop if the host leaves.
- Presence (heartbeat, stale-player reaping, keeping seats during a party game) is also in `useRoomRealtime.ts`.

## Super Monopoly (`src/components/games/super_monopoly/`)

- `superMonopolyData.ts` - the board (40 tiles), chance/chest decks, and every pure rule: rent (`computeRent`, `rowBonusFor`), visit multipliers, build caps, the row bonus, the starting deal, province mottoes. Keep rules here so the engine and the UI quote the same numbers; the UI must never carry its own copy of a rent table.
- `useSuperMonopolyEngine.ts` - the whole game loop as one hook (~2400 lines): the human turn, the bot turn (one long async function in an effect), cards, jail/rest/airport, debt and bankruptcy. Human and bot paths are separate code for the same rules, so a rule change almost always has to be made in both.
- `SuperMonopolyGame.tsx` renders the board and the modals; `SuperBoard.tsx` is the 2D board, `SuperBoard3D.tsx` the react-three-fiber board (figures, dice, landmarks).
- House rules that differ from classic Monopoly are documented in comments at the point they are enforced; read those before assuming the classic rule.

## UI conventions

- Colours are CSS custom properties holding RGB triplets (`--c-bg`, `--c-ink`, `--c-mint`, ... in `src/app/globals.css`), exposed through Tailwind as `rgb(var(--c-x) / <alpha-value>)`. Light, dark (the default) and system themes redefine them. Use the tokens, not raw Tailwind palette colours - raw `indigo`/`cyan`/`gray` classes do not follow the theme. For text on a soft background use the `-label` variants (`--c-mint-label`, `--c-butter-label`, ...), which are the ones picked for contrast.
- Tailwind only emits classes it can see as literal strings. Arbitrary variants such as `[@media(max-height:820px)_and_(min-width:1024px)]:h-[100dvh]` must be written out in full, never assembled in a template string.
- `src/components/common/Modal.tsx` caps its height and scrolls its body. Put a modal's action buttons in its `footer` prop so they stay on screen; buttons left at the end of the body scroll away on short windows.
- The layout has to fit a short, wide Discord Activity window as well as a phone. `src/app/super/layout.tsx` caps the page height on short wide viewports; a `flex-1` child only fits if its flex parent is capped too.
- Thai needs more size and line-height than Latin at the same nominal size; below ~12px the vowel and tone marks collide.

## PWA

`public/manifest.json`, `public/sw.js` and `public/offline.html`, registered by `src/components/common/ServiceWorkerRegister.tsx` in production only and never inside Discord. The worker never intercepts `/api/*`; do not add caching that would serve room state.

## Deployment

Production is `https://drink.buffydevs.com`, served by pm2 (process `drink-games`) from `/var/www/drink-games` on port **3003** - port 3000 on that host is a different application. Deploy is `git pull && npm run build && pm2 restart drink-games` on the server, and restarting wipes all live rooms.
