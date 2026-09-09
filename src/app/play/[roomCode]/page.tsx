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
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { BuffaloLogo } from '@/components/common/BuffaloLogo';
import { Button } from '@/components/common/Button';
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
    updateGameState,
    incrementDrink,
    nextTurn,
  } = useRoomRealtime(roomCode, user);

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
    if (room && room.status === 'waiting') {
      router.push(`/lobby/${roomCode}`);
    }
    if (room && room.status === 'finished') {
      showToast('หัวหน้าห้องได้ทำการปิดห้องเกมแล้ว', 'info');
      router.push('/');
    }
  }, [room, roomCode, router]);

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

      {/* Render Active Game Component */}
      <main className="flex-1 w-full">{renderGame()}</main>
    </div>
  );
}
