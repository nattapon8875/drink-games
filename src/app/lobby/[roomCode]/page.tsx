'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlatform } from '@/hooks/usePlatform';
import { useRoomRealtime } from '@/hooks/useRoomRealtime';
import { PlayerList } from '@/components/lobby/PlayerList';
import { ShareInvite } from '@/components/lobby/ShareInvite';
import { Button } from '@/components/common/Button';
import { CustomTilesModal } from '@/components/games/monopoly/CustomTilesModal';
import { DoraemonRulesModal } from '@/components/games/doraemon_card/DoraemonRulesModal';
import { WheelCustomModal } from '@/components/games/wheel/WheelCustomModal';
import { CrocodileSettingsModal } from '@/components/games/crocodile/CrocodileSettingsModal';
import { CrocodilePenaltyConfig, DEFAULT_CROCODILE_CONFIG, getRandomTrapTeeth } from '@/components/games/crocodile/crocodileData';
import { Wine, Play, ArrowLeft, Loader2, AlertCircle, Edit2, Sparkles, Dice5 } from 'lucide-react';
import { BuffaloLogo } from '@/components/common/BuffaloLogo';
import { Avatar } from '@/components/common/Avatar';
import { Modal } from '@/components/common/Modal';
import { THAI_PARTY_NICKNAMES } from '@/lib/platforms/adapter';

import { showToast, showConfirm } from '@/lib/alerts';

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params?.roomCode as string)?.toUpperCase();

  const { user, platform, isLoading: platformLoading, updateUserProfile } = usePlatform();
  const {
    room,
    players,
    loading: roomLoading,
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
    reorderPlayers,
  } = useRoomRealtime(roomCode, user);

  const [hasJoined, setHasJoined] = useState(false);
  const [starting, setStarting] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Edit Profile Modal State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState<string>('');
  const [editAvatar, setEditAvatar] = useState<string>('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user?.displayName) {
      setEditName(user.displayName);
      setEditAvatar(user.avatarUrl || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    const trimmed = editName.trim();
    if (!trimmed || isSavingProfile) return;
    setIsSavingProfile(true);
    try {
      await updatePlayerProfile(trimmed, editAvatar || undefined);
      updateUserProfile(trimmed, editAvatar || undefined);
      setShowEditProfileModal(false);
      showToast('อัปเดตชื่อสำเร็จ!', 'success');
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Auto-join room when user profile is ready
  useEffect(() => {
    if (!platformLoading && user && user.id !== 'guest-init' && roomCode && !hasJoined) {
      joinRoom();
      setHasJoined(true);
    }
  }, [platformLoading, user, roomCode, hasJoined, joinRoom]);

  // Cleanly notify server if user closes window or navigates back
  useEffect(() => {
    if (!user || user.id === 'guest-init' || !roomCode) return;

    const handleBeforeUnload = () => {
      // If player is not host, notify room departure immediately
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

  // Preload play page so transition is instant
  useEffect(() => {
    if (roomCode) {
      router.prefetch(`/play/${roomCode}`);
    }
  }, [roomCode, router]);

  // When room status turns to 'playing', redirect to /play/[roomCode]
  useEffect(() => {
    if (!room) return;

    // Check if current user has been kicked by host
    if (user && room.game_state?.kicked_player_ids?.includes(user.id)) {
      showToast('คุณถูกหัวหน้าห้องเตะออกจากห้องแล้ว', 'warning');
      router.push('/');
      return;
    }

    if (room.status === 'playing') {
      router.push(`/play/${roomCode}`);
    }
    if (room.status === 'finished') {
      showToast('หัวหน้าห้องได้ทำการปิดห้องเกมแล้ว', 'info');
      router.push('/');
    }
  }, [room, roomCode, router, user]);

  const isHost = Boolean(room && user && room.host_id === user.id);

  const handleStartGame = async () => {
    if (!isHost || starting) return;
    setStarting(true);
    // Trigger transition immediately while sync request runs
    router.push(`/play/${roomCode}`);
    try {
      await startGame();
    } catch (err) {
      console.error('Failed to start game:', err);
      setStarting(false);
    }
  };

  const handleCloseRoom = async () => {
    if (!isHost) return;
    const confirmed = await showConfirm(
      'ยุบห้องและปิดเกมนี้?',
      'ผู้เล่นทุกคนในห้องจะถูกพากลับสู่หน้าหลัก',
      'ยุบห้องเลย',
      'ยกเลิก',
      'warning'
    );
    if (confirmed) {
      await closeRoom();
      router.push('/');
    }
  };

  const handleLeaveRoom = async () => {
    const confirmed = await showConfirm(
      'ออกจากห้องรอ?',
      'คุณจะออกจากห้องนี้กลับสู่หน้าแรก',
      'ออกจากห้อง',
      'ยกเลิก'
    );
    if (confirmed) {
      await leaveRoom();
      router.push('/');
    }
  };

  if (platformLoading || roomLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-neon-pink animate-spin mb-3" />
        <p className="text-sm font-bold text-gray-300">กำลังเชื่อมต่อวงเหล้า...</p>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 max-w-sm mx-auto text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <h2 className="text-lg font-bold text-white mb-1">ไม่พบห้องเล่นเกม</h2>
        <p className="text-xs text-gray-400 mb-4">{error}</p>
        <Button variant="ghost" onClick={() => router.push('/')}>
          กลับหน้าหลัก
        </Button>
      </div>
    );
  }

  const hostPlayer = players.find((p) => p.id === room?.host_id);

  return (
    <main className="w-full flex-1 flex flex-col justify-between p-4 sm:p-5 select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between py-2 border-b border-[#54240a] mb-4">
        <button
          onClick={handleLeaveRoom}
          className="flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-white bg-[#301304] border border-[#5c2609] px-2.5 py-1 rounded-xl shadow-sm transition active:scale-95"
          title="ออกจากห้องนี้"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ออกห้อง</span>
        </button>

        {/* Profile Chip (Edit Name/Avatar) */}
        <div
          onClick={() => setShowEditProfileModal(true)}
          className="flex items-center gap-2 bg-[#2d1204] border-2 border-[#572408] px-3 py-1.5 rounded-full cursor-pointer hover:border-amber-400 transition shadow-inner active:scale-95"
          title="คลิกเพื่อแก้ไขชื่อ / รูปโปรไฟล์"
        >
          <Avatar
            src={user.avatarUrl}
            name={user.displayName}
            size="sm"
            platform={platform}
          />
          <span
            suppressHydrationWarning
            className="text-xs font-black text-amber-100 truncate max-w-[80px]"
          >
            {user.displayName}
          </span>
          <Edit2 className="w-3 h-3 text-amber-400" />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Game Title Badge / Quest Header */}
        <div className="text-center py-2">
          <span className="text-[10px] font-black tracking-widest uppercase text-amber-300 px-3 py-1 rounded-full bg-[#351505] border border-[#6b2f0a] shadow-inner">
              {room?.game_type === 'monopoly'
                ? 'เกมเศรษฐีวงเหล้า'
                : room?.game_type === 'spin-bottle'
                ? 'หมุนขวดวัดใจ'
                : room?.game_type === 'doraemon-card'
                ? 'เกมไพ่โดราเอมอน'
                : room?.game_type === 'wheel'
                ? 'วงล้อเสี่ยงทายวงเหล้า'
                : room?.game_type === 'crocodile'
                ? 'เกมจระเข้งับนิ้ว'
                : room?.game_type || 'มินิเกม'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black rpg-text-gold mt-2">
            ห้องรอเปิดศึก 🍻
          </h2>
          <p className="text-xs text-amber-200/70 font-semibold mt-0.5">
            ส่งเทียบเชิญหรือรหัสห้องให้สหายร่วมวงเข้าสู่โรงเตี๊ยม
          </p>
        </div>

        {/* Share Invite Card */}
        <ShareInvite
          roomCode={roomCode}
          hostName={hostPlayer?.display_name || user.displayName}
          platform={platform}
        />

        {/* Player List */}
        <PlayerList
          players={players}
          hostId={room?.host_id || ''}
          currentUserId={user.id}
          isHostUser={isHost}
          costumes={room?.game_state?.costumes}
          onReorderPlayers={reorderPlayers}
          onAddBotPlayer={addBotPlayer}
          onRemovePlayer={kickPlayer}
          onUpdateMyName={async (newName, avatarUrl) => {
            await updatePlayerProfile(newName, avatarUrl);
            updateUserProfile(newName, avatarUrl);
          }}
        />

        {/* Custom Rules Button */}
        {room?.game_type === 'monopoly' && (
          <Button
            variant="wood-brown"
            size="md"
            fullWidth
            onClick={() => setShowCustomModal(true)}
            className="text-xs sm:text-sm font-black border-2 border-[#54240a]"
          >
            ⚙️ {isHost ? 'ปรับแต่งคำสั่งกระดาน (28 ช่อง)' : 'ดูกฎและคำสั่งกระดาน (28 ช่อง)'}
          </Button>
        )}

        {room?.game_type === 'doraemon-card' && (
          <Button
            variant="wood-brown"
            size="md"
            fullWidth
            onClick={() => setShowCustomModal(true)}
            className="text-xs sm:text-sm font-black border-2 border-[#54240a]"
          >
            📜 {isHost ? 'ปรับแต่งกฎไพ่โดราเอมอน (A-K)' : 'ดูกฎไพ่โดราเอมอน (A-K)'}
          </Button>
        )}

        {room?.game_type === 'wheel' && (
          <Button
            variant="wood-brown"
            size="md"
            fullWidth
            onClick={() => setShowCustomModal(true)}
            className="text-xs sm:text-sm font-black border-2 border-[#54240a]"
          >
            🎡 {isHost ? 'ปรับแต่งคำสั่งวงล้อเสี่ยงทาย' : 'ดูคำสั่งในวงล้อเสี่ยงทาย'}
          </Button>
        )}

        {room?.game_type === 'crocodile' && (
          <Button
            variant="wood-brown"
            size="md"
            fullWidth
            onClick={() => setShowCustomModal(true)}
            className="text-xs sm:text-sm font-black border-2 border-[#54240a]"
          >
            🐃 {isHost ? 'ตั้งค่าจำนวนฟันและกับดักน้องควาย' : 'ดูกติกาน้องควายงับนิ้ว'}
          </Button>
        )}
      </div>

      {/* Bottom Start Game Controls */}
      <div className="pt-4 border-t border-[#54240a] mt-4">
        {isHost ? (
          <>
            <Button
              variant="wood-gold"
              size="lg"
              fullWidth
              onClick={handleStartGame}
              disabled={starting || players.length === 0}
              className={`text-base py-3.5 shadow-xl tracking-wider transition-all ${
                starting ? 'opacity-70 cursor-not-allowed pointer-events-none scale-98 ring-2 ring-yellow-400' : ''
              }`}
            >
              {starting ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin text-amber-300" />
              ) : (
                <Play className="w-5 h-5 mr-2 fill-current" />
              )}
              <span>{starting ? 'กำลังเข้าสู่สนามประลอง...' : 'เริ่มเกมเลย! (Host)'}</span>
            </Button>
            <button
              onClick={handleCloseRoom}
              className="w-full mt-2 py-1 text-xs text-rose-400 hover:text-rose-300 font-bold transition text-center"
            >
              ยุบห้อง / ปิดเกมนี้ (Host)
            </button>
          </>
        ) : (
          <div className="space-y-2">
            <div className="p-3 rounded-2xl bg-[#240d02] border-2 border-[#4d1e05] shadow-inner text-center">
              <p className="text-xs text-amber-200 font-bold flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span>
                  กำลังรอ <b>{hostPlayer?.display_name || 'หัวหน้าห้อง'}</b> กดเริ่มเกม...
                </span>
              </p>
            </div>
            <button
              onClick={handleLeaveRoom}
              className="w-full py-1.5 text-xs text-amber-300/60 hover:text-rose-400 font-bold transition text-center"
            >
              ออกจากห้องนี้
            </button>
          </div>
        )}
      </div>

      {/* Custom Tiles Modal (Monopoly) */}
      {room?.game_type === 'monopoly' && (
        <CustomTilesModal
          isOpen={showCustomModal}
          onClose={() => setShowCustomModal(false)}
          currentTiles={room?.game_state?.custom_tiles || []}
          isHost={isHost}
          onSaveTiles={async (updatedTiles) => {
            await updateGameState({ custom_tiles: updatedTiles });
          }}
        />
      )}

      {/* Doraemon Rules Modal (Doraemon Card) */}
      {room?.game_type === 'doraemon-card' && (
        <DoraemonRulesModal
          isOpen={showCustomModal}
          onClose={() => setShowCustomModal(false)}
          customRules={room?.game_state?.custom_rules}
          kingMode={room?.game_state?.king_mode}
          kingPresetRules={room?.game_state?.king_preset_rules}
          isHost={isHost}
          onSaveRules={async (updatedRules, updatedKingMode, updatedKingPresetRules) => {
            const updates: Record<string, any> = {
              custom_rules: updatedRules,
            };
            if (updatedKingMode) updates.king_mode = updatedKingMode;
            if (updatedKingPresetRules) updates.king_preset_rules = updatedKingPresetRules;
            await updateGameState(updates);
          }}
        />
      )}

      {/* Wheel Custom Modal (Wheel Game) */}
      {room?.game_type === 'wheel' && (
        <WheelCustomModal
          isOpen={showCustomModal}
          onClose={() => setShowCustomModal(false)}
          wheelItems={room?.game_state?.wheel_items}
          isHost={isHost}
          onSaveItems={async (updatedItems) => {
            await updateGameState({ wheel_items: updatedItems });
          }}
        />
      )}

      {/* Crocodile Settings Modal (Crocodile Game) */}
      {room?.game_type === 'crocodile' && (
        <CrocodileSettingsModal
          isOpen={showCustomModal}
          onClose={() => setShowCustomModal(false)}
          config={room?.game_state?.penalty_config || DEFAULT_CROCODILE_CONFIG}
          isHost={isHost}
          onSaveConfig={async (newConfig: CrocodilePenaltyConfig) => {
            const newTraps = getRandomTrapTeeth(newConfig.totalTeeth, newConfig.trapCount);
            await updateGameState({
              penalty_config: newConfig,
              trap_teeth: newTraps,
              pressed_teeth: [],
              is_bitten: false,
              bitten_player_id: null,
            });
          }}
        />
      )}

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        title="แก้ไขชื่อในวงเหล้า"
      >
        <div className="space-y-4">
          <div className="flex justify-center my-2">
            <Avatar src={editAvatar || user.avatarUrl} name={editName} size="xl" platform={platform} />
          </div>

          <div>
            <label className="text-xs font-bold text-amber-200 block mb-1">ชื่อเล่นประจำวง</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={20}
                placeholder="กรอกชื่อเล่นของคุณ"
                className="flex-1 bg-[#200c02] border-2 border-[#54240a] rounded-2xl p-3 text-amber-100 font-bold focus:outline-none focus:border-amber-400 shadow-inner"
              />
              <button
                type="button"
                onClick={() => {
                  const randomName = THAI_PARTY_NICKNAMES[Math.floor(Math.random() * THAI_PARTY_NICKNAMES.length)];
                  setEditName(randomName);
                }}
                className="p-3 rounded-2xl bg-[#381604] hover:bg-[#522207] border-2 border-[#6b2e0a] text-yellow-400 text-sm font-bold transition active:scale-95 shrink-0 shadow"
                title="สุ่มชื่อใหม่"
              >
                <Dice5 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="wood-brown"
              size="md"
              fullWidth
              onClick={() => {
                const randomSeed = Math.random().toString(36).substring(2, 8);
                const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`;
                setEditAvatar(newAvatar);
              }}
            >
              <Sparkles className="w-4 h-4 mr-1.5 inline text-amber-300" /> สุ่มรูปใหม่
            </Button>
            <Button
              variant="wood-gold"
              size="md"
              fullWidth
              disabled={isSavingProfile || !editName.trim()}
              onClick={handleSaveProfile}
            >
              {isSavingProfile ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
