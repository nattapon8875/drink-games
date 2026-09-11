'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlatform } from '@/hooks/usePlatform';
import { useRoomRealtime } from '@/hooks/useRoomRealtime';
import { MonopolyGame } from '@/components/games/monopoly/MonopolyGame';
import { SpinBottleGame } from '@/components/games/spin-bottle/SpinBottleGame';
import { DoraemonCardGame } from '@/components/games/doraemon_card/DoraemonCardGame';
import { WheelGame } from '@/components/games/wheel/WheelGame';
import { CrocodileGame } from '@/components/games/crocodile/CrocodileGame';
import { Loader2, AlertCircle, ArrowLeft, Users, Trash2, Bot, Crown } from 'lucide-react';
import { BuffaloLogo } from '@/components/common/BuffaloLogo';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Avatar } from '@/components/common/Avatar';
import { DrinkCounter } from '@/components/common/DrinkCounter';
import { showToast, showConfirm } from '@/lib/alerts';

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params?.roomCode as string)?.toUpperCase();

  const { user, isLoading: platformLoading } = usePlatform();
  const {
    room,
    players,
    loading: roomLoading,
    error,
    returnToLobby,
    closeRoom,
    leaveRoom,
    kickPlayer,
    updateGameState,
    incrementDrink,
    nextTurn,
  } = useRoomRealtime(roomCode, user);

  const [showPlayersModal, setShowPlayersModal] = React.useState(false);

  // Cleanly notify server if non-host leaves or closes tab
  React.useEffect(() => {
    if (!user || user.id === 'guest-init' || !roomCode) return;

    const handleBeforeUnload = () => {
      if (room && room.host_id !== user.id) {
        leaveRoom();
      }
    };

    window.addEventListener('pagehide', handleBeforeUnload);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('pagehide', handleBeforeUnload);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, roomCode, room, leaveRoom]);

  // When room status changes to 'waiting', send everyone back to lobby
  // When room status changes to 'finished', send everyone to home
  React.useEffect(() => {
    if (!room) return;

    // Check if current user has been kicked by host
    if (user && room.game_state?.kicked_player_ids?.includes(user.id)) {
      showToast('คุณถูกหัวหน้าห้องเตะออกจากห้องแล้ว', 'warning');
      router.push('/');
      return;
    }

    if (room.status === 'waiting') {
      router.push(`/lobby/${roomCode}`);
    }
    if (room.status === 'finished') {
      showToast('หัวหน้าห้องได้ทำการปิดห้องเกมแล้ว', 'info');
      router.push('/');
    }
  }, [room, roomCode, router, user]);

  if (platformLoading || roomLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-neon-pink animate-spin mb-3" />
        <p className="text-sm font-bold text-gray-300">กำลังเข้าสู่สนามประลอง...</p>
      </div>
    );
  }

  if (!room || error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 max-w-sm mx-auto text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <h2 className="text-lg font-bold text-white mb-1">ไม่พบข้อมูลห้อง</h2>
        <p className="text-xs text-gray-400 mb-4">{error || 'ห้องนี้อาจถูกปิดไปแล้ว'}</p>
        <Button variant="ghost" onClick={() => { leaveRoom(); router.push('/'); }}>
          กลับสู่หน้าหลัก
        </Button>
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
      router.push(`/lobby/${roomCode}`);
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
      router.push('/');
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
      router.push('/');
    }
  };

  // Base props passed to whichever modular game is active
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

  // Modular Game Dynamic Switcher
  const renderGame = () => {
    switch (room.game_type) {
      case 'crocodile':
        return <CrocodileGame {...baseGameProps} />;
      case 'wheel':
        return <WheelGame {...baseGameProps} />;
      case 'doraemon-card':
        return <DoraemonCardGame {...baseGameProps} />;
      case 'spin-bottle':
        return <SpinBottleGame {...baseGameProps} />;
      case 'monopoly':
      default:
        return <MonopolyGame {...baseGameProps} />;
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between">
      {/* Top minimal back control (Tavern Sign) */}
      <div className="px-4 pt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleReturnToLobby}
            className="flex items-center gap-1 text-xs font-bold text-amber-200 hover:text-white bg-[#331505] hover:bg-[#4a1e06] border border-[#692c0a] px-2.5 py-1 rounded-xl shadow-sm transition"
            title="กลับไปหน้าห้องรอ"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>กลับห้องรอ {isHost && '(Host)'}</span>
          </button>

          {isHost ? (
            <button
              onClick={handleCloseRoom}
              className="text-xs font-bold text-rose-300 hover:text-white bg-[#400e07] hover:bg-[#5c1309] border border-[#801c0c] px-2.5 py-1 rounded-xl shadow-sm transition"
              title="ยุบห้องและจบเกมสำหรับทุกคน"
            >
              ยุบห้อง (Host)
            </button>
          ) : (
            <button
              onClick={handleExitGame}
              className="text-xs font-bold text-amber-300/70 hover:text-rose-300 bg-[#2b1204] border border-[#4d1f06] px-2 py-1 rounded-xl transition"
              title="ออกจากเกม"
            >
              ออกเกม
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Players Roster & Kick Button */}
          <button
            type="button"
            onClick={() => setShowPlayersModal(true)}
            className="flex items-center gap-1 text-xs font-bold text-amber-200 hover:text-white bg-[#2f1304] hover:bg-[#421b06] border border-[#59260a] px-2 py-1 rounded-xl shadow-sm transition active:scale-95"
            title="ดูรายชื่อผู้เล่นในวง / จัดการคน"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>{players.length}</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              if (typeof window !== 'undefined' && roomCode) {
                await navigator.clipboard.writeText(roomCode);
                showToast(`คัดลอกรหัสห้อง ${roomCode} แล้ว!`, 'success');
              }
            }}
            className="px-2.5 py-0.5 rounded-lg bg-[#270e02] hover:bg-[#381604] border border-[#522005] hover:border-yellow-400/50 shadow-inner text-[10px] text-amber-300 font-mono font-black cursor-pointer active:scale-95 transition flex items-center gap-1.5"
            title="คลิกเพื่อคัดลอกรหัสห้อง"
          >
            <BuffaloLogo className="w-4 h-4" />
            <span>BUFFY: {roomCode}</span>
            <span className="text-[9px] text-amber-300/60">📋</span>
          </button>
        </div>
      </div>

      {/* Render Active Game Component */}
      <main className="flex-1 w-full">{renderGame()}</main>

      {/* In-game Player Roster & Kick Modal */}
      <Modal
        isOpen={showPlayersModal}
        onClose={() => setShowPlayersModal(false)}
        title={`สหายในวง (${players.length} คน)`}
      >
        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
          {players.map((p, idx) => {
            const isMe = p.id === user?.id;
            const isPlayerHost = p.id === room.host_id;
            const isBot = p.line_user_id === 'bot' || p.id.startsWith('bot-');

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                  isMe
                    ? 'bg-[#3b1704] border-yellow-400/70 shadow'
                    : 'bg-[#220c02] border-[#481c05]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                  <Avatar src={p.avatar_url} name={p.display_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-black text-xs text-amber-100">
                      <span className="truncate max-w-[120px] drop-shadow">{p.display_name}</span>
                      {isMe && (
                        <span className="text-[9px] bg-amber-500 text-[#301103] font-black px-1.5 py-0.2 rounded-md shrink-0">
                          คุณ
                        </span>
                      )}
                      {isBot && (
                        <span className="text-[9px] bg-[#3a1d6e] border border-purple-400/50 text-purple-200 font-black px-1.5 py-0.2 rounded-md shrink-0 flex items-center gap-0.5">
                          <Bot className="w-2.5 h-2.5" /> บอท
                        </span>
                      )}
                      {isPlayerHost && (
                        <span title="หัวหน้าห้อง" className="shrink-0">
                          <Crown className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-amber-300/80 font-semibold">
                      ลำดับที่ {idx + 1} • ดื่มไปแล้ว {p.drinks_count} จิบ
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <DrinkCounter count={p.drinks_count} size="sm" />
                  {/* Host can kick players during active game! */}
                  {isHost && !isMe && (
                    <button
                      type="button"
                      onClick={async () => {
                        const confirmed = await showConfirm(
                          isBot ? `ลบบอท "${p.display_name}"?` : `เตะ "${p.display_name}" ออกจากเกมทันที?`,
                          isBot
                            ? 'บอทตัวนี้จะถูกลบออกจากเกมทันที'
                            : 'ผู้เล่นนี้จะถูกส่งกลับสู่หน้าแรกทันที และหลุดออกจากเกมนี้ถาวร',
                          isBot ? 'ลบเลย' : 'เตะออกจากเกม',
                          'ยกเลิก',
                          'warning'
                        );
                        if (confirmed) {
                          await kickPlayer(p.id);
                          showToast(`เตะ ${p.display_name} สำเร็จ`, 'success');
                        }
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-800/70 text-red-300 hover:text-red-100 transition active:scale-95"
                      title="เตะออกจากเกมนี้ทันที"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
