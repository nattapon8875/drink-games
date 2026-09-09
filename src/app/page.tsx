'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlatform } from '@/hooks/usePlatform';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { Modal } from '@/components/common/Modal';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  Sparkles,
  Gamepad2,
  Users,
  Wine,
  ArrowRight,
  Edit2,
  Dice5,
  Disc,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { BuffaloLogo } from '@/components/common/BuffaloLogo';
import { GameInfo } from '@/types/game';

const AVAILABLE_GAMES: GameInfo[] = [
  {
    id: 'monopoly',
    title: 'เกมเศรษฐีวงเหล้า',
    subtitle: 'Drinking Board Game',
    description: 'ทอยเต๋าเดินกระดาน 24 ช่องสไตล์วงเหล้าไทย ใครตกช่องไหนมีหนาว!',
    minPlayers: 2,
    maxPlayers: 10,
    badge: 'ready',
    icon: 'dice',
  },
  {
    id: 'spin-bottle',
    title: 'หมุนขวดวัดใจ',
    subtitle: 'Spin the Bottle',
    description: 'หมุนขวดสุ่มชี้ชะตา ตอบความจริงหรือยอมยกหมดแก้ว',
    minPlayers: 2,
    maxPlayers: 12,
    badge: 'ready',
    icon: 'bottle',
  },
  {
    id: 'doraemon-card',
    title: 'เกมไพ่โดราเอมอน',
    subtitle: 'Doraemon Drinking Card',
    description: 'จั่วไพ่ 52 ใบ ลุ้นบทลงโทษสุดฮา บัดดี้ คนไร้ตัวตน และจิ๊กซอว์คิง 4 ส่วน!',
    minPlayers: 2,
    maxPlayers: 15,
    badge: 'ready',
    icon: 'cards',
  },
  {
    id: 'wheel',
    title: 'วงล้อเสี่ยงทายวงเหล้า',
    subtitle: 'Spin the Wheel',
    description: 'หมุนวงล้อเสี่ยงดวงชี้ชะตา ปรับแต่งบทลงโทษสุดแสบตามใจเจ้าภาพ!',
    minPlayers: 2,
    maxPlayers: 15,
    badge: 'ready',
    icon: 'wheel',
  },
  {
    id: 'crocodile',
    title: 'เกมน้องควายงับนิ้ว',
    subtitle: 'Buffy Dentist 3D',
    description: 'ท้าความกล้าจิ้มฟันควายบ๊อง! ใครกดโดนฟันกับดัก ปากควายงับฉับโดนดื่มยกวง!',
    minPlayers: 2,
    maxPlayers: 15,
    badge: 'ready',
    icon: 'crocodile',
  },
];

export default function HomePage() {
  const router = useRouter();
  const { user, platform, discordRoomCode, isLoading, updateUserProfile } = usePlatform();

  const [selectedGame, setSelectedGame] = useState<string>('monopoly');
  const [joinCode, setJoinCode] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile Edit Modal
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');

  useEffect(() => {
    if (user?.displayName) {
      setEditName(user.displayName);
    }
  }, [user]);

  // Auto-redirect or suggest if in Discord Voice Activity
  useEffect(() => {
    if (discordRoomCode) {
      setJoinCode(discordRoomCode);
    }
  }, [discordRoomCode]);

  // Generate random 4-digit code (e.g. "A7K9")
  const generateRoomCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Handle Create Room
  const handleCreateRoom = async () => {
    setIsCreating(true);
    setErrorMsg(null);

    // Ensure we have a persistent user ID (not initial placeholder)
    let hostUser = user;
    if (hostUser.id === 'guest-init') {
      const stored = localStorage.getItem('party_drink_guest_user');
      if (stored) {
        try {
          hostUser = JSON.parse(stored);
        } catch {}
      }
    }

    const roomCode = discordRoomCode || generateRoomCode();

    try {
      if (isSupabaseConfigured()) {
        const { error: roomError } = await supabase.from('rooms').insert({
          code: roomCode,
          host_id: hostUser.id,
          game_type: selectedGame,
          status: 'waiting',
          current_turn_player_id: hostUser.id,
          game_state: { positions: { [hostUser.id]: 0 } },
        });

        if (roomError && roomError.code !== '23505') {
          throw roomError;
        }

        await supabase.from('players').upsert({
          id: hostUser.id,
          room_code: roomCode,
          line_user_id: hostUser.id,
          display_name: hostUser.displayName,
          avatar_url: hostUser.avatarUrl,
          turn_order: 0,
          drinks_count: 0,
          is_connected: true,
        });
      } else {
        // Local Server-backed Store (syncs Regular + Incognito browsers)
        const initialRoom = {
          code: roomCode,
          host_id: hostUser.id,
          game_type: selectedGame,
          status: 'waiting',
          current_turn_player_id: hostUser.id,
          game_state: { positions: { [hostUser.id]: 0 } },
          created_at: new Date().toISOString(),
        };
        const initialPlayer = {
          id: hostUser.id,
          room_code: roomCode,
          line_user_id: hostUser.id,
          display_name: hostUser.displayName,
          avatar_url: hostUser.avatarUrl,
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
      }

      router.push(`/lobby/${roomCode}`);
    } catch (err: any) {
      console.error('Create room error:', err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการสร้างห้อง');
      setIsCreating(false);
    }
  };

  // Handle Join Room
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 4) {
      setErrorMsg('กรุณากรอกรหัสห้อง 4 หลัก');
      return;
    }

    setIsJoining(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/room?code=${cleanCode}`);
      if (res.ok) {
        const data = await res.json();
        if (!data.exists) {
          setErrorMsg('ไม่พบห้องที่ระบุ กรุณาตรวจสอบรหัสอีกครั้ง');
          setIsJoining(false);
          return;
        }
      }

      router.push(`/lobby/${cleanCode}`);
    } catch (err: any) {
      setErrorMsg('เกิดข้อผิดพลาดในการตรวจสอบห้อง');
      setIsJoining(false);
    }
  };

  const handleSaveProfile = () => {
    if (editName.trim()) {
      updateUserProfile(editName.trim());
      setShowEditModal(false);
    }
  };

  return (
    <main className="w-full flex-1 flex flex-col items-center justify-between p-4 sm:p-5 select-none">
      {/* Top Bar: User Profile & Platform Info (Rustic Wood Plaque) */}
      <header className="w-full flex items-center justify-between py-2 border-b border-[#5e2802] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-2xl bg-[#3b1704] border-2 border-[#6d3009] shadow-md flex items-center justify-center">
            <BuffaloLogo className="w-8 h-8 drop-shadow" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-widest rpg-text-gold uppercase flex items-center gap-1.5">
              <span>BUFFY PARTY DRINK</span>
            </h1>
            <p className="text-[10px] text-amber-300/80 font-bold">โรงเตี๊ยมเกมวงเหล้าออนไลน์ 🐃🍻</p>
          </div>
        </div>

        {/* Profile Chip */}
        <div
          onClick={() => setShowEditModal(true)}
          className="flex items-center gap-2 bg-[#2d1204] border-2 border-[#572408] px-3 py-1.5 rounded-full cursor-pointer hover:border-amber-400 transition shadow-inner"
          title="คลิกเพื่อแก้ไขโปรไฟล์"
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

      {/* Hero Section */}
      <section className="text-center my-3 w-full">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#381604] border border-[#78370b] text-amber-300 text-xs font-black mb-3 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
          <span>Multi-platform (LINE + Discord + Web)</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black rpg-text-gold tracking-tight mb-2">
          ชนแก้ว เปิดตี้ เริ่มเกม!
        </h2>
        <p className="text-xs sm:text-sm text-amber-200/80 font-bold max-w-sm mx-auto">
          ชวนสหายร่วมวงมาประลองแบบ Real-time ไม่ต้องติดตั้งแอป เปิดบนเว็บลุยได้ทันที
        </p>
      </section>

      {/* Discord Quick Join Banner if detected */}
      {discordRoomCode && (
        <div className="w-full bg-[#5865F2]/20 border-2 border-[#5865F2]/60 p-3.5 rounded-3xl mb-4 text-center shadow-lg">
          <p className="text-xs text-indigo-300 font-black mb-1">
            🎮 ตรวจพบ Discord Voice Channel
          </p>
          <p className="text-xs text-gray-200 mb-2 font-medium">
            รหัสห้องอัตโนมัติสำหรับห้องพูดคุยนี้คือ: <b className="text-yellow-300 font-mono font-black">{discordRoomCode}</b>
          </p>
          <Button
            variant="wood-gold"
            size="sm"
            fullWidth
            onClick={() => router.push(`/lobby/${discordRoomCode}`)}
          >
            เข้าห้องตี้ใน Discord ทันที
          </Button>
        </div>
      )}

      {/* Game Selector Catalog */}
      <section className="w-full space-y-3 my-2">
        <div className="flex items-center justify-between text-xs font-black text-amber-300 px-1">
          <span>เลือกมินิเกมในโรงเตี๊ยม</span>
          <span className="rpg-text-gold">{AVAILABLE_GAMES.filter((g) => g.badge === 'ready').length} เกมพร้อมเปิดศึก</span>
        </div>

        <div className="space-y-3">
          {AVAILABLE_GAMES.map((game) => {
            const isSelected = selectedGame === game.id;
            const isReady = game.badge === 'ready';

            return (
              <div
                key={game.id}
                onClick={() => isReady && setSelectedGame(game.id)}
                className={`p-4 rounded-3xl border-2 transition-all select-none relative ${
                  !isReady
                    ? 'opacity-50 bg-[#1c0a02] border-[#361302] cursor-not-allowed'
                    : isSelected
                    ? 'wood-panel border-[#451a03] ring-2 ring-yellow-400/80 shadow-[0_10px_20px_rgba(0,0,0,0.8)] cursor-pointer scale-[1.02]'
                    : 'bg-[#2b1104] border-[#572408] hover:border-amber-500/60 shadow-md cursor-pointer'
                }`}
              >
                {isSelected && isReady && (
                  <div className="rpg-corner-gold rpg-corner-tr" />
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-3 rounded-2xl border-2 shadow-inner ${
                        isSelected
                          ? 'bg-[#3b1704] border-[#703209] text-amber-300'
                          : 'bg-[#1e0a02] border-[#421703] text-amber-200/50'
                      }`}
                    >
                      {game.icon === 'dice' && <Dice5 className="w-6 h-6" />}
                      {game.icon === 'bottle' && <Disc className="w-6 h-6" />}
                      {game.icon === 'cards' && <Layers className="w-6 h-6" />}
                      {game.icon === 'wheel' && <Disc className="w-6 h-6 animate-spin-slow" />}
                      {game.icon === 'crocodile' && <span className="text-2xl leading-none select-none">🐃</span>}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm sm:text-base text-amber-100 drop-shadow">
                          {game.title}
                        </h3>
                        <span
                          className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                            isReady
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                              : 'bg-stone-900 text-stone-400 border-stone-700'
                          }`}
                        >
                          {isReady ? 'เปิดให้เล่น' : 'เร็วๆ นี้'}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-200/70 font-semibold mt-1 leading-snug">
                        {game.description}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-amber-300/80 font-black mt-2">
                        <Users className="w-3 h-3 text-amber-400" />
                        <span>รองรับ {game.minPlayers}-{game.maxPlayers} คน</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Action Zone: Create Room or Join Room */}
      <section className="w-full space-y-3 mt-4">
        {errorMsg && (
          <div className="p-2.5 bg-red-950/80 border-2 border-red-700 rounded-2xl text-xs text-rose-200 text-center font-bold shadow-md">
            {errorMsg}
          </div>
        )}

        {/* Create Room Button */}
        <Button
          variant="wood-gold"
          size="lg"
          fullWidth
          onClick={handleCreateRoom}
          disabled={isCreating}
          className="text-base py-3.5 shadow-xl tracking-wider"
        >
          <Gamepad2 className="w-5 h-5 mr-2" />
          <span>{isCreating ? 'กำลังสร้างห้อง...' : 'สร้างห้องใหม่ (เป็น Host)'}</span>
        </Button>

        {/* Join Code Input Form */}
        <form onSubmit={handleJoinRoom} className="flex gap-2">
          <input
            type="text"
            maxLength={4}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="รหัสห้อง 4 หลัก"
            className="flex-1 bg-[#250e03] border-2 border-[#5c2709] rounded-2xl px-4 py-3 text-center text-lg font-mono font-black tracking-widest text-yellow-300 placeholder:text-amber-800 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 uppercase transition shadow-inner"
          />
          <Button
            type="submit"
            variant="wood-green"
            size="md"
            disabled={isJoining || joinCode.length < 4}
            className="px-6 font-black flex-shrink-0"
          >
            <span>{isJoining ? '...' : 'เข้าร่วม'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>
      </section>

      {/* Footer */}
      <footer className="w-full text-center text-[10px] text-amber-300/60 font-bold mt-6 pt-3 border-t border-[#421703] flex items-center justify-center gap-1.5">
        <BuffaloLogo className="w-4 h-4 inline-block opacity-75" />
        <span>Buffy Party Drink • เล่นอย่างมีความรับผิดชอบ ไม่เมาแล้วขับนะสหาย 🍻</span>
      </footer>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="แก้ไขชื่อในวงเหล้า"
      >
        <div className="space-y-4">
          <div className="flex justify-center my-2">
            <Avatar src={user.avatarUrl} name={editName} size="xl" platform={platform} />
          </div>

          <div>
            <label className="text-xs font-bold text-amber-200 block mb-1">ชื่อเล่นประจำวง</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={20}
              placeholder="กรอกชื่อเล่นของคุณ"
              className="w-full bg-[#200c02] border-2 border-[#54240a] rounded-2xl p-3 text-amber-100 font-bold focus:outline-none focus:border-amber-400 shadow-inner"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="wood-brown"
              size="md"
              fullWidth
              onClick={() => {
                const randomSeed = Math.random().toString(36).substring(2, 8);
                updateUserProfile(
                  editName,
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`
                );
              }}
            >
              สุ่มรูปใหม่
            </Button>
            <Button
              variant="wood-gold"
              size="md"
              fullWidth
              onClick={handleSaveProfile}
            >
              บันทึก
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
