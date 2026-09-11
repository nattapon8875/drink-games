import { PlayerRecord, RoomRecord } from './database';

export interface BaseGameProps {
  room: RoomRecord;
  players: PlayerRecord[];
  currentPlayer: PlayerRecord | null;
  isHost: boolean;
  onUpdateGameState: (partialState: Record<string, any>) => Promise<void>;
  onUpdatePlayerDrink: (playerId: string, incrementBy: number) => Promise<void>;
  onNextTurn: (nextPlayerId: string) => Promise<void>;
  onKickPlayer?: (playerId: string) => Promise<void>;
}

export interface GameInfo {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  badge: 'ready' | 'coming_soon';
  icon: string;
  coverImage?: string;
}
