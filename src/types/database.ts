export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface RoomRecord {
  code: string;
  host_id: string;
  game_type: string;
  status: 'waiting' | 'playing' | 'finished';
  current_turn_player_id: string | null;
  game_state: {
    positions?: Record<string, number>; // playerId -> tileIndex (0-23)
    diceResult?: number;
    lastTileIndex?: number;
    lastActionPlayerId?: string;
    isRolling?: boolean;
    activeActionModal?: boolean;
    [key: string]: any;
  } | null;
  created_at: string;
}

export interface PlayerRecord {
  id: string;
  room_code: string;
  line_user_id: string | null;
  display_name: string;
  avatar_url: string | null;
  drinks_count: number;
  turn_order: number;
  is_connected: boolean;
  created_at?: string;
}

export interface MonopolyTileRecord {
  tile_index: number;
  title: string;
  action_text: string;
  tile_type: 'drink' | 'order_others' | 'challenge' | 'safe';
  icon?: string;
}
