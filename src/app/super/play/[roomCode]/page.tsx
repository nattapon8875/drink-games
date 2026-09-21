'use client';

import React, { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useParams, useRouter } from 'next/navigation';
import { usePlatform } from '@/hooks/usePlatform';
import { useRoomRealtime } from '@/hooks/useRoomRealtime';
import { SuperMonopolyGame } from '@/components/games/super_monopoly/SuperMonopolyGame';
import { Avatar } from '@/components/common/Avatar';
import { Modal } from '@/components/common/Modal';
import { DiscordGuideModal } from '@/components/games/super_monopoly/DiscordGuideModal';
import { showToast, showConfirm } from '@/lib/alerts';
import {
  ArrowLeft,
  Users,
  Loader2,
  AlertCircle,
  Crown,
  Bot,
  Trash2,
  Share2,
} from 'lucide-react';
import { BuffaloLogo } from '@/components/common/BuffaloLogo';

export default function SuperPlayPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.roomCode as string)?.toUpperCase();

  const { user, isLoading: platformLoading } = usePlatform();
  const {
    room,
    players,
    loading: roomLoading,
    error,
    joinRoom,
    leaveRoom,
    kickPlayer,
    returnToLobby,
    closeRoom,
    updateGameState,
    incrementDrink,
    nextTurn,
    reorderPlayers,
  } = useRoomRealtime(roomCode, user);

  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [showDiscordModal, setShowDiscordModal] = useState(false);

  // Auto-join on load
  useEffect(() => {
    if (user && roomCode && !roomLoading && !platformLoading) {
      joinRoom();
    }
  }, [user, roomCode, roomLoading, platformLoading, joinRoom]);

  // Discord closes the Activity iframe without any navigation, so without this the
  // player row is never removed and they linger in the room as a ghost.
  useEffect(() => {
    if (!user || user.id === 'guest-init' || !roomCode) return;

    const handleLeaveOnClose = () => {
      // Host is kept so a quick refresh does not orphan the room
      if (room && room.host_id !== user.id) {
        leaveRoom();
      }
    };

    window.addEventListener('pagehide', handleLeaveOnClose);
    window.addEventListener('beforeunload', handleLeaveOnClose);

    return () => {
      window.removeEventListener('pagehide', handleLeaveOnClose);
      window.removeEventListener('beforeunload', handleLeaveOnClose);
    };
  }, [user, roomCode, room, leaveRoom]);

  // Sync state transitions
  useEffect(() => {
    if (!room) return;

    if (user && room.game_state?.kicked_player_ids?.includes(user.id)) {
      if (typeof window !== 'undefined' && roomCode) {
        sessionStorage.setItem('discord_manual_exit', roomCode);
      }
      showToast('คุณถูกหัวหน้าห้องเตะออกจากห้องแล้ว', 'warning');
      router.push('/super?manual=1');
      return;
    }

    if (room.status === 'waiting') {
      router.push(`/super/lobby/${roomCode}`);
    }
    if (room.status === 'finished') {
      if (typeof window !== 'undefined' && roomCode) {
        sessionStorage.setItem('discord_manual_exit', roomCode);
      }
      showToast('หัวหน้าห้องได้ทำการปิดห้องเกมแล้ว', 'info');
      router.push('/super?manual=1');
    }
  }, [room, roomCode, router, user]);

  if (platformLoading || roomLoading) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-yellow-400 animate-spin mb-3" />
        <p className="text-sm font-bold text-amber-200">กำลังเข้าสู่สนามประลองซุปเปอร์เศรษฐี...</p>
      </div>
    );
  }

  if (!room || error) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 max-w-sm mx-auto text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <h2 className="text-lg font-bold text-white mb-1">ไม่พบข้อมูลห้อง</h2>
        <p className="text-xs text-gray-400 mb-4">{error || 'ห้องนี้อาจถูกปิดไปแล้ว'}</p>
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && roomCode) {
              sessionStorage.setItem('discord_manual_exit', roomCode);
            }
            leaveRoom();
            router.push('/super?manual=1');
          }}
          className="wood-btn-gold px-6 py-2.5 rounded-xl font-bold text-xs"
        >
          กลับสู่หน้าหลัก
        </button>
      </div>
    );
  }

  const currentPlayer = players.find((p) => p.id === user.id) || null;
  const isHost = room.host_id === user.id;

  const handleReturnToLobby = async () => {
    if (!isHost) return;
    const confirmed = await showConfirm(
      'ต้องการกลับไปห้องรอ?',
      'เกมจะหยุดชั่วคราว และพาผู้เล่นทุกคนกลับไปที่ห้องรอ Lobby',
      'กลับห้องรอ',
      'เล่นต่อ'
    );
    if (confirmed) {
      await returnToLobby();
      router.push(`/super/lobby/${roomCode}`);
    }
  };

  const handleCloseRoom = async () => {
    if (!isHost) return;
    const confirmed = await showConfirm(
      'ยุบห้องและปิดเกม?',
      'ผู้เล่นทุกคนในห้องจะถูกส่งกลับสู่หน้าหลัก',
      'ยุบห้องเลย',
      'ยกเลิก',
      'warning'
    );
    if (confirmed) {
      if (typeof window !== 'undefined' && roomCode) {
        sessionStorage.setItem('discord_manual_exit', roomCode);
      }
      await closeRoom();
      router.push('/super?manual=1');
    }
  };

  const handleExitGame = async () => {
    const confirmed = await showConfirm(
      'ออกจากเกม?',
      'คุณจะออกจากห้องเกมนี้และชื่อของคุณจะออกจากวงทันที',
      'ออกจากเกม',
      'เล่นต่อ'
    );
    if (confirmed) {
      if (typeof window !== 'undefined' && roomCode) {
        sessionStorage.setItem('discord_manual_exit', roomCode);
      }
      await leaveRoom();
      router.push('/super?manual=1');
    }
  };

  const baseGameProps = {
    room,
    players,
    currentPlayer,
    isHost,
    onUpdateGameState: updateGameState,
    onUpdatePlayerDrink: incrementDrink,
    onNextTurn: nextTurn,
    onKickPlayer: kickPlayer,
    onReorderPlayers: reorderPlayers,
  };

  return (
    <div className="w-full min-h-screen flex flex-col justify-between p-2 sm:p-4 select-none">
      {/* Top minimal navigation bar */}
      <div className="max-w-7xl w-full mx-auto pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isHost ? (
            <button
              onClick={handleReturnToLobby}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-200 hover:text-[rgb(var(--c-ink))] bg-[rgb(var(--c-surface-2))] hover:bg-[rgb(var(--c-surface-2))] border border-[rgb(var(--c-surface-3))] px-3 py-1.5 rounded-xl shadow-sm transition"
              title="กลับไปหน้าห้องรอ"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">กลับห้องรอ (Host)</span>
            </button>
          ) : (
            <button
              onClick={handleExitGame}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-300/85 hover:text-rose-300 bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-2))] px-3 py-1.5 rounded-xl transition"
              title="ออกจากเกม"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">ออกเกม</span>
            </button>
          )}

          {isHost && (
            <button
              onClick={handleCloseRoom}
              className="text-xs font-bold text-rose-300 hover:text-[rgb(var(--c-ink))] bg-[rgb(var(--c-surface))] hover:bg-[rgb(var(--c-surface-2))] border border-[rgb(var(--c-surface-3))] px-3 py-1.5 rounded-xl shadow-sm transition"
              title="ยุบห้องและจบเกมสำหรับทุกคน"
            >
              <span className="hidden sm:inline">ยุบห้อง</span>
              <span className="sm:hidden" aria-hidden>✕</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Players Roster */}
          <button
            type="button"
            onClick={() => setShowPlayersModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-200 hover:text-[rgb(var(--c-ink))] bg-[rgb(var(--c-surface))] hover:bg-[rgb(var(--c-surface-2))] border border-[rgb(var(--c-surface-3))] px-3 py-1.5 rounded-xl shadow-sm transition active:scale-95"
            title="ดูรายชื่อผู้เล่นในห้อง"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>{players.length}</span>
            <span className="hidden sm:inline">คน</span>
          </button>

          {/* Room Code & Share Discord Modal Button */}
          <button
            type="button"
            onClick={() => setShowDiscordModal(true)}
            className="px-3 py-1 rounded-xl bg-[rgb(var(--c-surface))] hover:bg-[rgb(var(--c-surface-2))] border border-[rgb(var(--c-surface-2))] hover:border-yellow-400/50 shadow-inner text-xs text-amber-300 font-mono font-black cursor-pointer active:scale-95 transition flex items-center gap-1.5"
            title="คลิกเพื่อคัดลอกรหัส ลิงก์ และดูขั้นตอนการเข้า Discord"
          >
            <BuffaloLogo className="w-4 h-4" />
            <span>{roomCode}</span>
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Main Game Screen */}
      <main className="w-full flex-1 flex flex-col items-center justify-center">
        <SuperMonopolyGame {...baseGameProps} />
      </main>

      {/* Players List Modal */}
      <Modal
        isOpen={showPlayersModal}
        onClose={() => setShowPlayersModal(false)}
        title={`ผู้เล่นในเกม (${players.length} คน)`}
      >
        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
          {players.map((p, idx) => {
            const isMe = p.id === user?.id;
            const isPlayerHost = p.id === room.host_id;
            const isBot = p.line_user_id === 'bot' || p.id.startsWith('bot-');

            return (
              <div
                key={p.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                  isMe
                    ? 'bg-[rgb(var(--c-surface-2))] border-yellow-400/80 shadow-md'
                    : 'bg-[rgb(var(--c-bg-deep))] border-[rgb(var(--c-surface-2))]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar src={p.avatar_url} name={p.display_name} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-amber-100 truncate max-w-[120px]">
                        {p.display_name}
                      </span>
                      {isMe && (
                        <span className="text-[9px] font-bold text-yellow-400">(คุณ)</span>
                      )}
                      {isBot && (
                        <span className="text-[9px] font-bold bg-amber-950 text-amber-300 px-1 rounded border border-amber-800 flex items-center gap-0.5">
                          <Bot className="w-2.5 h-2.5" /> บอท
                        </span>
                      )}
                      {isPlayerHost && (
                        <Crown className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>

                {isHost && !isMe && (
                  <button
                    type="button"
                    onClick={async () => {
                      const confirmed = await showConfirm(
                        isBot ? `ลบบอท "${p.display_name}"?` : `เตะ "${p.display_name}" ออกจากเกม?`,
                        'ผู้เล่นจะถูกนำออกจากเกมทันที',
                        'เตะออก',
                        'ยกเลิก',
                        'warning'
                      );
                      if (confirmed) {
                        await kickPlayer(p.id);
                        showToast(`นำ ${p.display_name} ออกแล้ว`, 'success');
                      }
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-800/70 text-red-300 hover:text-red-100 transition active:scale-95"
                    title="เตะออกจากเกม"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Modal>

      {/* Discord Guide & Share Modal */}
      <DiscordGuideModal
        isOpen={showDiscordModal}
        roomCode={roomCode}
        onClose={() => setShowDiscordModal(false)}
      />
    </div>
  );
}
