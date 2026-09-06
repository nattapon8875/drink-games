import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { serverStore } from '@/lib/serverRoomStore';
import { RoomRecord, PlayerRecord } from '@/types/database';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code')?.toUpperCase();

  if (!code) {
    return NextResponse.json({ error: 'Missing room code' }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    const room = serverStore.rooms.get(code) || null;
    const players = serverStore.players.get(code) || [];
    return NextResponse.json({
      exists: Boolean(room),
      room,
      players,
      mock: true,
    });
  }

  try {
    const supabase = createClient();
    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (roomErr) throw roomErr;

    const { data: players, error: playersErr } = await supabase
      .from('players')
      .select('*')
      .eq('room_code', code)
      .order('turn_order', { ascending: true });

    if (playersErr) throw playersErr;

    return NextResponse.json({
      exists: Boolean(room),
      room,
      players: players || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error checking room' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, code } = body;
    const roomCode = code?.toUpperCase();

    if (!roomCode) {
      return NextResponse.json({ error: 'Missing room code' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      switch (action) {
        case 'create': {
          const { room, player } = body;
          if (room) {
            const costumes = { ...(room.game_state?.costumes || {}) };
            if (player && costumes[player.id] === undefined) {
              costumes[player.id] = Math.floor(Math.random() * 20);
              room.game_state = { ...(room.game_state || {}), costumes };
            }
          }
          serverStore.rooms.set(roomCode, room);
          if (player) {
            serverStore.players.set(roomCode, [player]);
          }
          return NextResponse.json({ success: true, room, players: [player] });
        }

        case 'join': {
          const { player } = body;
          const currentPlayers = serverStore.players.get(roomCode) || [];
          const existingIdx = currentPlayers.findIndex((p) => p.id === player.id);

          let updatedPlayers: PlayerRecord[];
          if (existingIdx >= 0) {
            // Update existing player name/avatar if changed
            updatedPlayers = [...currentPlayers];
            updatedPlayers[existingIdx] = {
              ...updatedPlayers[existingIdx],
              ...player,
              is_connected: true,
            };
          } else {
            // If room had a dummy guest-init player, replace or filter it out
            const cleaned = currentPlayers.filter((p) => p.id !== 'guest-init');
            const newPlayer: PlayerRecord = {
              ...player,
              turn_order: cleaned.length,
            };
            updatedPlayers = [...cleaned, newPlayer];

            // If room host was guest-init, make this player host
            const room = serverStore.rooms.get(roomCode);
            if (room) {
              // Assign a random costume (0..19) not yet taken if possible
              const costumes = { ...(room.game_state?.costumes || {}) };
              if (costumes[newPlayer.id] === undefined) {
                const usedCostumes = new Set(Object.values(costumes));
                const availableCostumes = Array.from({ length: 20 }, (_, i) => i).filter(
                  (c) => !usedCostumes.has(c)
                );
                const costumePool = availableCostumes.length > 0
                  ? availableCostumes
                  : Array.from({ length: 20 }, (_, i) => i);
                const randomCostume = costumePool[Math.floor(Math.random() * costumePool.length)];
                costumes[newPlayer.id] = randomCostume;
                room.game_state = { ...(room.game_state || {}), costumes };
              }

              if (room.host_id === 'guest-init') {
                room.host_id = newPlayer.id;
                room.current_turn_player_id = newPlayer.id;
              }
              serverStore.rooms.set(roomCode, room);
            }
          }

          serverStore.players.set(roomCode, updatedPlayers);
          return NextResponse.json({
            success: true,
            room: serverStore.rooms.get(roomCode),
            players: updatedPlayers,
          });
        }

        case 'start': {
          const room = serverStore.rooms.get(roomCode);
          const players = serverStore.players.get(roomCode) || [];
          if (room && players.length > 0) {
            room.status = 'playing';
            room.current_turn_player_id = players[0].id;
            serverStore.rooms.set(roomCode, room);
          }
          return NextResponse.json({ success: true, room, players });
        }

        case 'close': {
          const room = serverStore.rooms.get(roomCode);
          if (room) {
            room.status = 'finished';
            serverStore.rooms.set(roomCode, room);
          }
          return NextResponse.json({ success: true, room });
        }

        case 'update_status': {
          const { status } = body;
          const room = serverStore.rooms.get(roomCode);
          if (room) {
            room.status = status;
            serverStore.rooms.set(roomCode, room);
          }
          return NextResponse.json({ success: true, room });
        }

        case 'update_state': {
          const { partialState } = body;
          const room = serverStore.rooms.get(roomCode);
          if (room) {
            room.game_state = { ...(room.game_state || {}), ...partialState };
            serverStore.rooms.set(roomCode, room);
          }
          return NextResponse.json({ success: true, room });
        }

        case 'drink': {
          const { playerId, amount } = body;
          const players = serverStore.players.get(roomCode) || [];
          const updated = players.map((p) =>
            p.id === playerId ? { ...p, drinks_count: p.drinks_count + amount } : p
          );
          serverStore.players.set(roomCode, updated);
          return NextResponse.json({ success: true, players: updated });
        }

        case 'reorder_players': {
          const { orderedPlayerIds } = body;
          const currentPlayers = serverStore.players.get(roomCode) || [];
          if (Array.isArray(orderedPlayerIds)) {
            const playerMap = new Map(currentPlayers.map((p) => [p.id, p]));
            const reordered: PlayerRecord[] = [];
            orderedPlayerIds.forEach((id, idx) => {
              const p = playerMap.get(id);
              if (p) {
                reordered.push({ ...p, turn_order: idx });
                playerMap.delete(id);
              }
            });
            // Append any remaining players
            playerMap.forEach((p) => {
              reordered.push({ ...p, turn_order: reordered.length });
            });
            serverStore.players.set(roomCode, reordered);

            const room = serverStore.rooms.get(roomCode);
            if (room && reordered.length > 0) {
              room.current_turn_player_id = reordered[0].id;
              serverStore.rooms.set(roomCode, room);
            }
            return NextResponse.json({ success: true, players: reordered, room });
          }
          return NextResponse.json({ success: false, message: 'Invalid player order' });
        }

        case 'next_turn': {
          const { nextPlayerId } = body;
          const room = serverStore.rooms.get(roomCode);
          if (room) {
            room.current_turn_player_id = nextPlayerId;
            room.game_state = {
              ...room.game_state,
              activeActionModal: false,
              isRolling: false,
            };
            serverStore.rooms.set(roomCode, room);
          }
          return NextResponse.json({ success: true, room });
        }

        case 'leave': {
          const { playerId } = body;
          const currentPlayers = serverStore.players.get(roomCode) || [];
          const updatedPlayers = currentPlayers.filter((p) => p.id !== playerId);
          serverStore.players.set(roomCode, updatedPlayers);

          const room = serverStore.rooms.get(roomCode);
          if (room) {
            // Remove player position
            if (room.game_state?.positions && room.game_state.positions[playerId] !== undefined) {
              delete room.game_state.positions[playerId];
            }
            // If current turn belonged to leaving player, advance to next player
            if (room.current_turn_player_id === playerId && updatedPlayers.length > 0) {
              room.current_turn_player_id = updatedPlayers[0].id;
              room.game_state = {
                ...room.game_state,
                activeActionModal: false,
                isRolling: false,
              };
            }
            // If host left, transfer host or close room
            if (room.host_id === playerId) {
              if (updatedPlayers.length > 0) {
                room.host_id = updatedPlayers[0].id;
              } else {
                room.status = 'finished';
              }
            }
            serverStore.rooms.set(roomCode, room);
          }

          return NextResponse.json({
            success: true,
            room: serverStore.rooms.get(roomCode),
            players: updatedPlayers,
          });
        }

        default:
          return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}
