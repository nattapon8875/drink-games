import { RoomRecord, PlayerRecord } from '@/types/database';

// Global singleton in-memory store for local development without cloud Supabase
// This allows Regular and Incognito browser windows to share rooms and sync state seamlessly.

interface ServerStore {
  rooms: Map<string, RoomRecord>;
  players: Map<string, PlayerRecord[]>;
}

declare global {
  // eslint-disable-next-line no-var
  var __serverStore: ServerStore | undefined;
}

if (!globalThis.__serverStore) {
  globalThis.__serverStore = {
    rooms: new Map(),
    players: new Map(),
  };
}

export const serverStore = globalThis.__serverStore;
