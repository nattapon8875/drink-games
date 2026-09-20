'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlatform } from '@/hooks/usePlatform';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Modal } from '@/components/common/Modal';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { THAI_PARTY_NICKNAMES } from '@/lib/platforms/adapter';
import { isDiscordActivity } from '@/lib/platforms/discord';
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
    category: 'drinking',
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
    category: 'drinking',
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
    category: 'drinking',
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
    category: 'drinking',
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
    category: 'drinking',
  },
];

export default function HomePage() {
  const router = useRouter();
  const { user, platform, discordRoomCode, isLoading, updateUserProfile } = usePlatform();

  const [joinCode, setJoinCode] = useState<string>('');
  const [isCreatingGameId, setIsCreatingGameId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile Edit Modal
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');

  // Auto-redirect to Super Monopoly immediately if opened in Discord Activity
  const [isDiscordRedirecting, setIsDiscordRedirecting] = useState<boolean>(false);

  useEffect(() => {
    if (isDiscordActivity() || platform === 'discord') {
      setIsDiscordRedirecting(true);
      const search = typeof window !== 'undefined' ? window.location.search : '';
      router.replace(`/super${search}`);
    }
  }, [platform, router]);

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

  // Handle Create Room for a specific game
  const handleCreateRoom = async (gameId: string) => {
    setIsCreatingGameId(gameId);
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
          game_type: gameId,
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
          game_type: gameId,
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

      if (gameId === 'super-monopoly') {
        router.push(`/super/lobby/${roomCode}`);
      } else {
        router.push(`/lobby/${roomCode}`);
      }
    } catch (err: any) {
      console.error('Create room error:', err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการสร้างห้อง');
      setIsCreatingGameId(null);
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

  if (isDiscordRedirecting) {
    return (
      <main className="w-full min-h-screen flex flex-col items-center justify-center p-6 bg-[rgb(var(--c-bg-deep))] text-amber-100">
        <div className="animate-spin w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full mb-4" />
        <p className="text-base font-black text-amber-200">กำลังเข้าสู่เกมซุปเปอร์เศรษฐีใน Discord...</p>
        <p className="text-xs text-amber-400/80 font-semibold mt-1">กรุณารอสักครู่ ระบบกำลังพาไปยังหน้าเกม</p>
      </main>
    );
  }

  return (
    <main className="w-full flex-1 flex flex-col items-center justify-between p-4 sm:p-5 select-none">
      {/* Top Bar: User Profile & Platform Info (Rustic Wood Plaque) */}
      <header className="w-full flex items-center justify-between py-2 border-b border-[rgb(var(--c-surface-3))] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-2xl bg-[rgb(var(--c-surface-2))] border-2 border-[rgb(var(--c-surface-3))] shadow-md flex items-center justify-center">
            <BuffaloLogo className="w-8 h-8 drop-shadow" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-widest rpg-text-gold uppercase flex items-center gap-1.5">
              <span>BUFFY PARTY DRINK</span>
            </h1>
            <p className="text-[10px] text-amber-300/80 font-bold">โรงเตี๊ยมเกมวงเหล้าออนไลน์ 🐃🍻</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* Profile Chip */}
        <div
          onClick={() => setShowEditModal(true)}
          className="flex items-center gap-2 bg-[rgb(var(--c-surface))] border-2 border-[rgb(var(--c-surface-3))] px-3 py-1.5 rounded-full cursor-pointer hover:border-amber-400 transition shadow-inner"
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
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center my-2 w-full">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[rgb(var(--c-surface-2))] border border-[rgb(var(--c-line))] text-amber-300 text-xs font-black mb-2 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
          <span>Multi-platform (LINE + Discord + Web)</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black rpg-text-gold tracking-tight mb-1">
          ชนแก้ว เปิดตี้ เริ่มเกม!
        </h2>
        <p className="text-xs text-amber-200/80 font-bold max-w-sm mx-auto">
          ชวนสหายร่วมวงมาประลองแบบ Real-time บนเว็บได้ทันที
        </p>
      </section>

      {/* Error Alert */}
      {errorMsg && (
        <div className="w-full p-2.5 bg-red-950/80 border-2 border-red-700 rounded-2xl text-xs text-rose-200 text-center font-bold shadow-md my-1">
          {errorMsg}
        </div>
      )}

      {/* Top Section: Join Room (Moved to the Top!) */}
      <section className="w-full wood-panel p-3.5 rounded-3xl relative shadow-xl my-2 border-2 border-[rgb(var(--c-surface-3))]">
        <div className="wood-rivet absolute top-2 left-2" />
        <div className="wood-rivet absolute top-2 right-2" />
        <div className="wood-rivet absolute bottom-2 left-2" />
        <div className="wood-rivet absolute bottom-2 right-2" />

        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Users className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black text-amber-300">มีรหัสห้องอยู่แล้ว? เข้าร่วมห้อง</span>
        </div>

        <form onSubmit={handleJoinRoom} className="flex items-center gap-2">
          <input
            type="text"
            maxLength={4}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="รหัสห้อง 4 หลัก"
            className="flex-1 min-w-0 h-12 bg-[rgb(var(--c-bg-deep))] border-2 border-[rgb(var(--c-surface-3))] rounded-2xl px-3 text-center text-lg font-mono font-black tracking-widest text-yellow-300 placeholder:text-amber-800/80 focus:outline-none focus:border-amber-400 uppercase transition shadow-inner"
          />
          <Button
            type="submit"
            variant="wood-gold"
            disabled={isJoining || joinCode.length < 4}
            className="h-12 px-4 sm:px-5 text-sm font-black flex-shrink-0 flex items-center justify-center gap-1.5 shadow-md"
          >
            <span>{isJoining ? '...' : 'เข้าร่วม'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </section>

      {/* Game Selector Catalog */}
      <section className="w-full space-y-3 my-2">
        <div className="flex items-center justify-between text-xs font-black text-amber-300 px-1">
          <span>เลือกเกม &amp; เปิดโต๊ะ</span>
          <span className="rpg-text-gold">
            {AVAILABLE_GAMES.filter((g) => g.badge === 'ready').length} เกมพร้อมเปิดศึก
          </span>
        </div>

        <div className="space-y-3">
          {AVAILABLE_GAMES.map((game) => {
            const isReady = game.badge === 'ready';
            const isThisGameCreating = isCreatingGameId === game.id;

            return (
              <div
                key={game.id}
                className={`p-4 rounded-3xl border-2 transition-all select-none relative ${
                  !isReady
                    ? 'opacity-50 bg-[rgb(var(--c-bg-deep))] border-[rgb(var(--c-surface))]'
                    : 'bg-[rgb(var(--c-surface))] border-[rgb(var(--c-surface-3))] hover:border-amber-500/60 shadow-md'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`p-3 rounded-2xl border-2 shadow-inner shrink-0 ${
                      isReady
                        ? 'bg-[rgb(var(--c-surface-2))] border-[rgb(var(--c-surface-3))] text-amber-300'
                        : 'bg-[rgb(var(--c-bg-deep))] border-[rgb(var(--c-surface-2))] text-amber-200/80'
                    }`}
                  >
                    {game.icon === 'dice' && <Dice5 className="w-6 h-6" />}
                    {game.icon === 'bottle' && <Disc className="w-6 h-6" />}
                    {game.icon === 'cards' && <Layers className="w-6 h-6" />}
                    {game.icon === 'wheel' && <Disc className="w-6 h-6 animate-spin-slow" />}
                    {game.icon === 'crocodile' && <span className="text-2xl leading-none select-none">🐃</span>}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm sm:text-base text-amber-100 drop-shadow">
                        {game.title}
                      </h3>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                          isReady
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                            : 'bg-stone-900 text-stone-400 border-stone-700'
                        }`}
                      >
                        {isReady ? 'พร้อมลุย' : 'เร็วๆ นี้'}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-200/85 font-semibold mt-1 leading-snug">
                      {game.description}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-amber-300/80 font-black mt-1.5">
                      <Users className="w-3 h-3 text-amber-400" />
                      <span>รองรับ {game.minPlayers}-{game.maxPlayers} คน</span>
                    </div>
                  </div>
                </div>

                {/* Direct Create Room Button for each game */}
                {isReady && (
                  <div className="flex flex-col gap-1.5 w-full">
                    {game.id === 'super-monopoly' && (
                      <button
                        type="button"
                        onClick={() => router.push('/super')}
                        className="w-full py-2 px-3 rounded-xl bg-mint text-[rgb(var(--c-on-accent))] font-black text-xs flex items-center justify-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>เข้าสู่โหมดเต็มจอ Discord & Web (/super)</span>
                      </button>
                    )}
                    <Button
                      variant={game.id === 'super-monopoly' ? 'wood-brown' : 'wood-gold'}
                      size="md"
                      fullWidth
                      disabled={Boolean(isCreatingGameId)}
                      onClick={() => handleCreateRoom(game.id)}
                      className="text-xs sm:text-sm font-black py-2.5 shadow-md flex items-center justify-center gap-2"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      <span>
                        {isThisGameCreating
                          ? 'กำลังเปิดโต๊ะ...'
                          : `เปิดโต๊ะเล่น "${game.title}"`}
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full text-center text-[10px] text-amber-300/80 font-bold mt-6 pt-3 border-t border-[rgb(var(--c-surface-2))] flex items-center justify-center gap-1.5">
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
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={20}
                placeholder="กรอกชื่อเล่นของคุณ"
                className="flex-1 bg-[rgb(var(--c-surface))] border-2 border-[rgb(var(--c-surface-3))] rounded-2xl p-3 text-amber-100 font-bold focus:outline-none focus:border-amber-400 shadow-inner"
              />
              <button
                type="button"
                onClick={() => {
                  const randomName = THAI_PARTY_NICKNAMES[Math.floor(Math.random() * THAI_PARTY_NICKNAMES.length)];
                  setEditName(randomName);
                }}
                className="p-3 rounded-2xl bg-[rgb(var(--c-surface-2))] hover:bg-[rgb(var(--c-surface-3))] border-2 border-[rgb(var(--c-surface-3))] text-yellow-400 text-sm font-bold transition active:scale-95 shrink-0 shadow"
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
                updateUserProfile(
                  editName,
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`
                );
              }}
            >
              <Sparkles className="w-4 h-4 mr-1.5 inline text-amber-300" /> สุ่มรูปใหม่
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
