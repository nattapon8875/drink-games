'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { RoomRecord, PlayerRecord } from '@/types/database';
import { UnifiedUser } from '@/lib/platforms/types';
import { getPreviousPlayerIds, forgetPreviousPlayerId } from '@/lib/platforms/customName';
import { RealtimeChannel } from '@supabase/supabase-js';

// Presence tuning. A client refreshes its own row every HEARTBEAT_INTERVAL_MS;
// the host removes anyone whose row has not been touched for STALE_AFTER_MS.
const HEARTBEAT_INTERVAL_MS = 15000;
const STALE_AFTER_MS = 45000;
const REAP_INTERVAL_MS = 20000;

function isBotPlayer(p: PlayerRecord): boolean {
  return p.line_user_id === 'bot' || p.id.startsWith('bot-');
}

export function useRoomRealtime(roomCode: string, currentUser: UnifiedUser | null) {
  const [room, setRoom] = useState<RoomRecord | null>(null);
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch from Server API (works across Incognito, Normal tabs, and all devices)
  const fetchData = useCallback(async () => {
    if (!roomCode) return;

    if (!isSupabaseConfigured()) {
      try {
        const res = await fetch(`/api/room?code=${roomCode}`);
        if (res.ok) {
          const data = await res.json();
          if (data.exists && data.room) {
            setRoom(data.room);
            setPlayers(data.players || []);
          } else if (currentUser && currentUser.id !== 'guest-init') {
            // Initialize room on server
            const initialRoom: RoomRecord = {
              code: roomCode,
              host_id: currentUser.id,
              game_type: 'monopoly',
              status: 'waiting',
              current_turn_player_id: currentUser.id,
              game_state: { positions: { [currentUser.id]: 0 } },
              created_at: new Date().toISOString(),
            };
            const initialPlayer: PlayerRecord = {
              id: currentUser.id,
              room_code: roomCode,
              line_user_id: currentUser.id,
              display_name: currentUser.displayName,
              avatar_url: currentUser.avatarUrl,
              drinks_count: 0,
              turn_order: 0,
              is_connected: true,
            };

            await fetch('/api/room', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'create',
                code: roomCode,
                room: initialRoom,
                player: initialPlayer,
              }),
            });

            setRoom(initialRoom);
            setPlayers([initialPlayer]);
          }
        }
      } catch (err) {
        console.error('[Mock API] Fetch error:', err);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', roomCode)
        .single();

      if (roomError && roomError.code !== 'PGRST116') {
        throw roomError;
      }

      if (roomData) {
        setRoom(roomData as RoomRecord);
      }

      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_code', roomCode)
        .order('turn_order', { ascending: true });

      if (playersError) throw playersError;

      if (playersData) {
        setPlayers(playersData as PlayerRecord[]);
      }
    } catch (err: any) {
      console.error('[Realtime] Fetch error:', err);
      setError(err.message || 'ไม่สามารถโหลดข้อมูลห้องได้');
    } finally {
      setLoading(false);
    }
  }, [roomCode, currentUser]);

  // Realtime subscription / Polling loop
  useEffect(() => {
    if (!roomCode) return;

    fetchData();

    if (!isSupabaseConfigured()) {
      // Fast polling (400ms) for snappy real-time sync across players
      const pollTimer = setInterval(async () => {
        try {
          const res = await fetch(`/api/room?code=${roomCode}`);
          if (res.ok) {
            const data = await res.json();
            if (data.exists && data.room) {
              setRoom(data.room);
              setPlayers(data.players || []);
            }
          }
        } catch {
          // ignore
        }
      }, 400);

      return () => clearInterval(pollTimer);
    }

    const channel = supabase
      .channel(`room_${roomCode}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${roomCode}` },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setRoom(payload.new as RoomRecord);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `room_code=eq.${roomCode}` },
        () => {
          supabase
            .from('players')
            .select('*')
            .eq('room_code', roomCode)
            .order('turn_order', { ascending: true })
            .then(({ data }) => {
              if (data) setPlayers(data as PlayerRecord[]);
            });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomCode, fetchData]);

  // Join Room
  const joinRoom = useCallback(async () => {
    if (!currentUser || !roomCode || currentUser.id === 'guest-init') return;

    // Never re-add someone the host kicked. The auto-join effect re-runs on every
    // room update, so without this it races the redirect and puts them back in.
    if (room?.game_state?.kicked_player_ids?.includes(currentUser.id)) return;

    if (!isSupabaseConfigured()) {
      const newPlayer: PlayerRecord = {
        id: currentUser.id,
        room_code: roomCode,
        line_user_id: currentUser.id,
        display_name: currentUser.displayName,
        avatar_url: currentUser.avatarUrl,
        drinks_count: 0,
        turn_order: players.length,
        is_connected: true,
      };

      try {
        const res = await fetch('/api/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'join',
            code: roomCode,
            player: newPlayer,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.room) setRoom(data.room);
          if (data.players) setPlayers(data.players);
        } else if (res.status === 403) {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || 'คุณถูกเตะออกจากห้องนี้แล้ว');
        }
      } catch (err) {
        console.error('[Mock API] Join error:', err);
      }
      return;
    }

    try {
      const { data: existing } = await supabase
        .from('players')
        .select('*')
        .eq('room_code', roomCode)
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!existing) {
        const newOrder = players.length;
        await supabase.from('players').insert({
          id: currentUser.id,
          room_code: roomCode,
          line_user_id: currentUser.id,
          display_name: currentUser.displayName,
          avatar_url: currentUser.avatarUrl,
          turn_order: newOrder,
          drinks_count: 0,
          is_connected: true,
        });

        if (room) {
          const positions = room.game_state?.positions || {};
          positions[currentUser.id] = 0;

          const costumes = { ...(room.game_state?.costumes || {}) };
          if (costumes[currentUser.id] === undefined) {
            const usedCostumes = new Set(Object.values(costumes));
            const availableCostumes = Array.from({ length: 20 }, (_, i) => i).filter(
              (c) => !usedCostumes.has(c)
            );
            const costumePool =
              availableCostumes.length > 0
                ? availableCostumes
                : Array.from({ length: 20 }, (_, i) => i);
            costumes[currentUser.id] =
              costumePool[Math.floor(Math.random() * costumePool.length)];
          }

          await supabase
            .from('rooms')
            .update({
              game_state: { ...room.game_state, positions, costumes },
            })
            .eq('code', roomCode);
        }
      } else if (
        existing.display_name !== currentUser.displayName ||
        existing.avatar_url !== currentUser.avatarUrl
      ) {
        await supabase
          .from('players')
          .update({
            display_name: currentUser.displayName,
            avatar_url: currentUser.avatarUrl,
            is_connected: true,
          })
          .eq('room_code', roomCode)
          .eq('id', currentUser.id);
      }
    } catch (err) {
      console.error('[Realtime] Join error:', err);
    }
  }, [currentUser, roomCode, players, room]);

  // Start Game (Host only)
  const startGame = useCallback(async () => {
    if (!room || players.length === 0) return;
    const firstPlayerId = players[0].id;

    if (!isSupabaseConfigured()) {
      await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          code: roomCode,
        }),
      });
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              status: 'playing',
              current_turn_player_id: firstPlayerId,
            }
          : null
      );
      return;
    }

    await supabase
      .from('rooms')
      .update({
        status: 'playing',
        current_turn_player_id: firstPlayerId,
      })
      .eq('code', roomCode);
  }, [room, players, roomCode]);

  // Return to Lobby (Host only)
  const returnToLobby = useCallback(async () => {
    if (!roomCode) return;

    if (!isSupabaseConfigured()) {
      await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          code: roomCode,
          status: 'waiting',
        }),
      });
      setRoom((prev) => (prev ? { ...prev, status: 'waiting' } : null));
      return;
    }

    await supabase
      .from('rooms')
      .update({ status: 'waiting' })
      .eq('code', roomCode);
  }, [roomCode]);

  // Close / End Room (Host only)
  const closeRoom = useCallback(async () => {
    if (!roomCode) return;

    if (!isSupabaseConfigured()) {
      await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close',
          code: roomCode,
        }),
      });
      setRoom((prev) => (prev ? { ...prev, status: 'finished' } : null));
      return;
    }

    await supabase
      .from('rooms')
      .update({ status: 'finished' })
      .eq('code', roomCode);
  }, [roomCode]);

  // Update Game State
  const updateGameState = useCallback(
    async (partialState: Record<string, any>) => {
      if (!room) return;
      const merged = { ...(room.game_state || {}), ...partialState };

      if (!isSupabaseConfigured()) {
        await fetch('/api/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_state',
            code: roomCode,
            partialState,
          }),
        });
        setRoom((prev) => (prev ? { ...prev, game_state: merged } : null));
        return;
      }

      await supabase
        .from('rooms')
        .update({ game_state: merged })
        .eq('code', roomCode);
    },
    [room, roomCode]
  );

  // Increment Drink Count
  const incrementDrink = useCallback(
    async (playerId: string, amount: number = 1) => {
      if (!isSupabaseConfigured()) {
        await fetch('/api/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'drink',
            code: roomCode,
            playerId,
            amount,
          }),
        });
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === playerId ? { ...p, drinks_count: p.drinks_count + amount } : p
          )
        );
        return;
      }

      const targetPlayer = players.find((p) => p.id === playerId);
      if (targetPlayer) {
        await supabase
          .from('players')
          .update({ drinks_count: targetPlayer.drinks_count + amount })
          .eq('id', playerId);
      }
    },
    [players, roomCode]
  );

  // Switch to next player's turn
  const nextTurn = useCallback(
    async (nextPlayerId: string) => {
      if (!room) return;

      if (!isSupabaseConfigured()) {
        await fetch('/api/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'next_turn',
            code: roomCode,
            nextPlayerId,
          }),
        });
        setRoom((prev) =>
          prev
            ? {
                ...prev,
                current_turn_player_id: nextPlayerId,
                game_state: {
                  ...prev.game_state,
                  activeActionModal: false,
                  isRolling: false,
                },
              }
            : null
        );
        return;
      }

      await supabase
        .from('rooms')
        .update({
          current_turn_player_id: nextPlayerId,
          game_state: {
            ...room.game_state,
            activeActionModal: false,
            isRolling: false,
          },
        })
        .eq('code', roomCode);
    },
    [room, roomCode]
  );

  // Leave Room (Non-host or any player exiting room)
  const leaveRoom = useCallback(async (customPlayerId?: string) => {
    const targetPlayerId = customPlayerId || currentUser?.id;
    if (!targetPlayerId || !roomCode || targetPlayerId === 'guest-init') return;

    // Optimistically remove from local state immediately
    setPlayers((prev) => prev.filter((p) => p.id !== targetPlayerId));

    if (!isSupabaseConfigured()) {
      const payload = JSON.stringify({
        action: 'leave',
        code: roomCode,
        playerId: targetPlayerId,
      });

      // Try sendBeacon if available, otherwise fetch with keepalive
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/room', blob);
      } else {
        await fetch('/api/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch((err) => console.error('[Mock API] Leave error:', err));
      }
      return;
    }

    try {
      await supabase
        .from('players')
        .delete()
        .eq('room_code', roomCode)
        .eq('id', targetPlayerId);

      if (room) {
        const positions = { ...(room.game_state?.positions || {}) };
        delete positions[targetPlayerId];

        const remaining = players.filter((p) => p.id !== targetPlayerId);
        const roomUpdate: Partial<RoomRecord> = {
          game_state: { ...room.game_state, positions },
        };

        // Hand over the room instead of leaving it headless (the mock API already does this)
        if (room.host_id === targetPlayerId) {
          if (remaining.length > 0) {
            roomUpdate.host_id = remaining[0].id;
          } else {
            roomUpdate.status = 'finished';
          }
        }

        // Never leave the turn pointing at someone who is gone
        if (room.current_turn_player_id === targetPlayerId && remaining.length > 0) {
          roomUpdate.current_turn_player_id = remaining[0].id;
          roomUpdate.game_state = {
            ...roomUpdate.game_state,
            activeActionModal: false,
            isRolling: false,
          };
        }

        await supabase.from('rooms').update(roomUpdate).eq('code', roomCode);
      }
    } catch (err) {
      console.error('[Realtime] Leave room error:', err);
    }
  }, [currentUser, roomCode, room, players]);

  // Reorder Players (Host only)
  const reorderPlayers = useCallback(
    async (orderedPlayerIds: string[]) => {
      if (!roomCode || orderedPlayerIds.length === 0) return;

      if (!isSupabaseConfigured()) {
        const res = await fetch('/api/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reorder_players',
            code: roomCode,
            orderedPlayerIds,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.players) setPlayers(data.players);
          if (data.room) setRoom(data.room);
        }
        return;
      }

      try {
        await Promise.all(
          orderedPlayerIds.map((id, idx) =>
            supabase
              .from('players')
              .update({ turn_order: idx })
              .eq('room_code', roomCode)
              .eq('id', id)
          )
        );

        if (orderedPlayerIds.length > 0) {
          await supabase
            .from('rooms')
            .update({ current_turn_player_id: orderedPlayerIds[0] })
            .eq('code', roomCode);
        }
      } catch (err) {
        console.error('[Realtime] Reorder players error:', err);
      }
    },
    [roomCode]
  );

  // Add Bot / Local Player (Host only)
  const addBotPlayer = useCallback(
    async (botName: string) => {
      if (!roomCode) return;
      const cleanName = botName.trim();
      if (!cleanName) return;

      const botId = `bot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newOrder = players.length;
      const botPlayer: PlayerRecord = {
        id: botId,
        room_code: roomCode,
        line_user_id: 'bot',
        display_name: cleanName,
        avatar_url: null,
        drinks_count: 0,
        turn_order: newOrder,
        is_connected: true,
      };

      if (!isSupabaseConfigured()) {
        try {
          const res = await fetch('/api/room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'join',
              code: roomCode,
              player: botPlayer,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.room) setRoom(data.room);
            if (data.players) setPlayers(data.players);
          }
        } catch (err) {
          console.error('[Mock API] Add bot error:', err);
        }
        return;
      }

      try {
        await supabase.from('players').insert(botPlayer);

        if (room) {
          const positions = { ...(room.game_state?.positions || {}) };
          positions[botId] = 0;

          const costumes = { ...(room.game_state?.costumes || {}) };
          if (costumes[botId] === undefined) {
            const usedCostumes = new Set(Object.values(costumes));
            const availableCostumes = Array.from({ length: 20 }, (_, i) => i).filter(
              (c) => !usedCostumes.has(c)
            );
            const costumePool =
              availableCostumes.length > 0
                ? availableCostumes
                : Array.from({ length: 20 }, (_, i) => i);
            costumes[botId] =
              costumePool[Math.floor(Math.random() * costumePool.length)];
          }

          await supabase
            .from('rooms')
            .update({
              game_state: { ...room.game_state, positions, costumes },
            })
            .eq('code', roomCode);
        }
      } catch (err) {
        console.error('[Realtime] Add bot error:', err);
      }
    },
    [roomCode, players.length, room]
  );

  // Remove Player / Bot (Host only or leaving)
  const removePlayer = useCallback(
    async (targetPlayerId: string) => {
      await leaveRoom(targetPlayerId);
    },
    [leaveRoom]
  );

  // Kick Player by Host (Works in lobby and during game, marks kicked_player_ids)
  const kickPlayer = useCallback(
    async (targetPlayerId: string) => {
      if (!roomCode || !targetPlayerId) return;

      // Optimistically remove from local list
      setPlayers((prev) => prev.filter((p) => p.id !== targetPlayerId));

      if (!isSupabaseConfigured()) {
        try {
          const res = await fetch('/api/room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'kick',
              code: roomCode,
              playerId: targetPlayerId,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.room) setRoom(data.room);
            if (data.players) setPlayers(data.players);
          }
        } catch (err) {
          console.error('[Mock API] Kick error:', err);
        }
        return;
      }

      try {
        await supabase
          .from('players')
          .delete()
          .eq('room_code', roomCode)
          .eq('id', targetPlayerId);

        if (room) {
          const positions = { ...(room.game_state?.positions || {}) };
          delete positions[targetPlayerId];

          const currentKicked = room.game_state?.kicked_player_ids || [];
          const newKicked = Array.from(new Set([...currentKicked, targetPlayerId]));

          const updatedPlayers = players.filter((p) => p.id !== targetPlayerId);
          let nextTurnId = room.current_turn_player_id;
          if (room.current_turn_player_id === targetPlayerId && updatedPlayers.length > 0) {
            nextTurnId = updatedPlayers[0].id;
          }

          await supabase
            .from('rooms')
            .update({
              current_turn_player_id: nextTurnId,
              game_state: {
                ...room.game_state,
                positions,
                kicked_player_ids: newKicked,
                activeActionModal: false,
                isRolling: false,
              },
            })
            .eq('code', roomCode);
        }
      } catch (err) {
        console.error('[Realtime] Kick player error:', err);
      }
    },
    [roomCode, room, players]
  );

  // Update Player Profile in Room
  const updatePlayerProfile = useCallback(
    async (displayName: string, avatarUrl?: string) => {
      if (!roomCode || !currentUser?.id) return;

      // Optimistically update local player record
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === currentUser.id
            ? {
                ...p,
                display_name: displayName,
                avatar_url: avatarUrl || p.avatar_url,
              }
            : p
        )
      );

      if (!isSupabaseConfigured()) {
        try {
          await fetch('/api/room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update_player',
              code: roomCode,
              playerId: currentUser.id,
              displayName,
              avatarUrl,
            }),
          });
        } catch (err) {
          console.error('[Mock API] Update player error:', err);
        }
        return;
      }

      try {
        await supabase
          .from('players')
          .update({
            display_name: displayName,
            avatar_url: avatarUrl || currentUser.avatarUrl,
          })
          .eq('room_code', roomCode)
          .eq('id', currentUser.id);
      } catch (err) {
        console.error('[Realtime] Update player profile error:', err);
      }
    },
    [roomCode, currentUser]
  );

  // ---- Identity reclaim ----------------------------------------------------
  // The same person can come back under a different id (the Discord OAuth path
  // gives the real account id, the fallback path a random local one), leaving
  // their previous row behind so they appear twice. As soon as we are in the
  // room under the new id, remove the rows we know were ours.
  const reclaimingRef = useRef(false);
  useEffect(() => {
    const myId = currentUser?.id;
    if (!roomCode || !myId || myId === 'guest-init' || !room) return;
    if (reclaimingRef.current) return;
    if (!players.some((p) => p.id === myId)) return; // wait until we are actually in

    const previousIds = getPreviousPlayerIds();
    if (previousIds.length === 0) return;

    const orphans = players.filter((p) => p.id !== myId && previousIds.includes(p.id));
    if (orphans.length === 0) return;

    reclaimingRef.current = true;
    (async () => {
      try {
        for (const orphan of orphans) {
          const orphanWasHost = room.host_id === orphan.id;
          console.log('[Identity] Removing own stale row:', orphan.display_name, orphan.id);
          await leaveRoomRef.current(orphan.id);
          forgetPreviousPlayerId(orphan.id);

          // Our old row held the crown, so take it back rather than letting
          // leaveRoom hand it to whoever happens to be first in turn order.
          if (orphanWasHost) {
            if (!isSupabaseConfigured()) {
              await fetch('/api/room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'set_host', code: roomCode, playerId: myId }),
              });
            } else {
              await supabase.from('rooms').update({ host_id: myId }).eq('code', roomCode);
            }
          }
        }
      } finally {
        reclaimingRef.current = false;
      }
    })();
  }, [roomCode, currentUser?.id, players, room]);

  // ---- Presence: heartbeat + stale player cleanup --------------------------
  // Discord can tear down the Activity iframe without ever firing pagehide
  // (force close, network drop, switching voice channel), so unload handlers
  // alone are not enough to keep ghost players out of the room.
  const playersRef = useRef<PlayerRecord[]>(players);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  // leaveRoom is rebuilt whenever `room` changes, which is on every game_state
  // update. Holding it in a ref keeps the reaper interval from being torn down
  // and restarted constantly (it would otherwise never live long enough to fire).
  const leaveRoomRef = useRef(leaveRoom);
  useEffect(() => {
    leaveRoomRef.current = leaveRoom;
  }, [leaveRoom]);

  // Each client only ever writes its OWN row, so heartbeats never contend
  // with each other or with game_state updates.
  useEffect(() => {
    const playerId = currentUser?.id;
    if (!roomCode || !playerId || playerId === 'guest-init') return;

    let cancelled = false;

    const beat = async () => {
      if (cancelled) return;
      try {
        if (!isSupabaseConfigured()) {
          await fetch('/api/room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'heartbeat', code: roomCode, playerId }),
          });
          return;
        }

        await supabase
          .from('players')
          .update({ last_seen: new Date().toISOString(), is_connected: true })
          .eq('room_code', roomCode)
          .eq('id', playerId);
      } catch {
        // a missed beat is harmless; the next one covers it
      }
    };

    beat();
    const timer = setInterval(beat, HEARTBEAT_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [roomCode, currentUser?.id]);

  // Exactly one client reaps, so leaveRoom's game_state write is never racing
  // itself. The reaper cannot be the host: when the host is the ghost, nobody
  // would be left to clean it up. Instead every client independently elects the
  // lowest id among players with a fresh heartbeat, so they all agree, and the
  // job moves on by itself once the current reaper goes stale.
  //
  // The election is computed fresh on every tick rather than memoised: it
  // depends on how old each heartbeat is *now*, and the players array can sit
  // unchanged for minutes while those heartbeats age out.
  useEffect(() => {
    const myId = currentUser?.id;
    if (!roomCode || !myId) return;

    let cancelled = false;

    const reap = async () => {
      if (cancelled) return;

      const cutoff = Date.now() - STALE_AFTER_MS;
      const roster = playersRef.current;

      const isFresh = (p: PlayerRecord) => {
        if (p.id === myId) return true; // we are demonstrably here
        if (!p.last_seen) return false;
        const seen = new Date(p.last_seen).getTime();
        return Number.isFinite(seen) && seen >= cutoff;
      };

      const alive = roster
        .filter((p) => !isBotPlayer(p) && isFresh(p))
        .map((p) => p.id)
        .sort();

      if (alive[0] !== myId) return; // someone else is on cleanup duty

      const stale = roster.filter(
        (p) => !isBotPlayer(p) && p.id !== myId && p.last_seen && !isFresh(p)
      );

      for (const p of stale) {
        console.log('[Presence] Removing stale player:', p.display_name, p.id);
        await leaveRoomRef.current(p.id);
      }
    };

    const timer = setInterval(reap, REAP_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [roomCode, currentUser?.id]);

  return {
    room,
    players,
    loading,
    error,
    joinRoom,
    leaveRoom,
    addBotPlayer,
    removePlayer,
    kickPlayer,
    updatePlayerProfile,
    startGame,
    returnToLobby,
    closeRoom,
    updateGameState,
    incrementDrink,
    nextTurn,
    reorderPlayers,
    refresh: fetchData,
  };
}
