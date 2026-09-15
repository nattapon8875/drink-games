'use client';

import React, { useEffect, useState } from 'react';
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
  } = useRoomRealtime(roomCode, user);

  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [showDiscordModal, setShowDiscordModal] = useState(false);

  // Auto-join on load
  useEffect(() => {
    if (user && roomCode && !roomLoading && !platformLoading) {
      joinRoom();
    }
  }, [user, roomCode, roomLoading, platformLoading, joinRoom]);

  // Sync state transitions
  useEffect(() => {
    if (!room) return;

    if (user && room.game_state?.kicked_player_ids?.includes(user.id)) {
      showToast('คุณถูกหัวหน้าห้องเตะออกจากห้องแล้ว', 'warning');
      router.push('/super');
      return;
    }

    if (room.status === 'waiting') {
      router.push(`/super/lobby/${roomCode}`);
    }
    if (room.status === 'finished') {
      showToast('หัวหน้าห้องได้ทำการปิดห้องเกมแล้ว', 'info');
      router.push('/super');
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
            leaveRoom();
            router.push('/super');
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
      await closeRoom();
      router.push('/super');
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
      await leaveRoom();
      router.push('/super');
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
  };

  return (
    <div className="w-full min-h-screen flex flex-col justify-between p-2 sm:p-4 select-none">
      {/* Top minimal navigation bar */}
      <div className="max-w-7xl w-full mx-auto pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isHost ? (
            <button
              onClick={handleReturnToLobby}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-200 hover:text-white bg-[#331505] hover:bg-[#4a1e06] border border-[#692c0a] px-3 py-1.5 rounded-xl shadow-sm transition"
              title="กลับไปหน้าห้องรอ"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>กลับห้องรอ (Host)</span>
            </button>
          ) : (
            <button
              onClick={handleExitGame}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-300/70 hover:text-rose-300 bg-[#2b1204] border border-[#4d1f06] px-3 py-1.5 rounded-xl transition"
              title="ออกจากเกม"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ออกเกม</span>
            </button>
          )}

          {isHost && (
            <button
              onClick={handleCloseRoom}
              className="text-xs font-bold text-rose-300 hover:text-white bg-[#400e07] hover:bg-[#5c1309] border border-[#801c0c] px-3 py-1.5 rounded-xl shadow-sm transition"
              title="ยุบห้องและจบเกมสำหรับทุกคน"
            >
              ยุบห้อง
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Players Roster */}
          <button
            type="button"
            onClick={() => setShowPlayersModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-200 hover:text-white bg-[#2f1304] hover:bg-[#421b06] border border-[#59260a] px-3 py-1.5 rounded-xl shadow-sm transition active:scale-95"
            title="ดูรายชื่อผู้เล่นในห้อง"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>{players.length} คน</span>
          </button>

          {/* Room Code & Share Discord Modal Button */}
          <button
            type="button"
            onClick={() => setShowDiscordModal(true)}
            className="px-3 py-1 rounded-xl bg-[#270e02] hover:bg-[#381604] border border-[#522005] hover:border-yellow-400/50 shadow-inner text-xs text-amber-300 font-mono font-black cursor-pointer active:scale-95 transition flex items-center gap-1.5"
            title="คลิกเพื่อคัดลอกรหัส ลิงก์ และดูขั้นตอนการเข้า Discord"
          >
            <BuffaloLogo className="w-4 h-4" />
            <span>SUPER: {roomCode}</span>
            <span className="text-[10px] text-amber-300/80 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-600/40">แชร์/วิธีเข้า</span>
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
                    ? 'bg-[#3b1704] border-yellow-400/80 shadow-md'
                    : 'bg-[#1a0802] border-[#421704]'
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
