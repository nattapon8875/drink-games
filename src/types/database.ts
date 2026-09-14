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
    kicked_player_ids?: string[];
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

export type SuperTileType =
  | 'start'
  | 'property'
  | 'chest'
  | 'chance'
  | 'jail'
  | 'parking'
  | 'go_to_jail'
  | 'tax';

export interface SuperPropertyTile {
  index: number;
  name: string;
  type: SuperTileType;
  color?: string;
  isUtility?: boolean;
  cost?: number; // Price in Millions (M)
  houseCost?: number; // in M
  hotelCost?: number; // in M
  baseRent?: number; // in M
  rent1House?: number; // in M
  rent2House?: number; // in M
  rent3House?: number; // in M
  rentHotel?: number; // in M
  icon?: string;
  description?: string;
}

export interface PropertyOwnership {
  ownerId: string;
  houses: number; // 0 = empty land, 1-3 = houses, 4 = hotel
}

export interface CardAction {
  id: string;
  type: 'chest' | 'chance';
  title: string;
  description: string;
  rewardMoney?: number; // in M
  teleportToIndex?: number;
  goJail?: boolean;
  collectFromAll?: number; // in M
}

export interface SuperMonopolyGameState {
  cash: Record<string, number>;
  positions: Record<string, number>;
  properties: Record<number, PropertyOwnership>;
  inJailTurns: Record<string, number>;
  isBankrupt: Record<string, boolean>;
  activeCard?: CardAction | null;
  activePropertyModal?: number | null;
  gameLogs: Array<{ text: string; time: string; color?: string }>;
  costumes?: Record<string, number>;
}

