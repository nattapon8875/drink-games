'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { RoomRecord, PlayerRecord } from '@/types/database';
import { UnifiedUser } from '@/lib/platforms/types';
import { RealtimeChannel } from '@supabase/supabase-js';

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
        await supabase
          .from('rooms')
          .update({
            game_state: { ...room.game_state, positions },
          })
          .eq('code', roomCode);
      }
    } catch (err) {
      console.error('[Realtime] Leave room error:', err);
    }
  }, [currentUser, roomCode, room]);

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
