'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePlatform } from '@/hooks/usePlatform';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { THAI_PARTY_NICKNAMES, getRandomGuestUser } from '@/lib/platforms/adapter';
import { Avatar } from '@/components/common/Avatar';
import { Modal } from '@/components/common/Modal';
import {
  Building2,
  Home,
  Users,
  Dices,
  Sparkles,
  ArrowRight,
  Edit2,
  Bot,
  Play,
  ShieldAlert,
  Coins,
  ArrowLeft,
  Crown,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { BuffaloLogo } from '@/components/common/BuffaloLogo';

export default function SuperHomePage() {
  const router = useRouter();
  const { user, platform, discordRoomCode, isLoading, updateUserProfile } = usePlatform();

  const [joinCode, setJoinCode] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Discord Auto-join / Auto-create for voice channel
  const [isDiscordAutoConnecting, setIsDiscordAutoConnecting] = useState<boolean>(false);
  const [discordConnectStatus, setDiscordConnectStatus] = useState<string>('');
  const hasAttemptedAutoConnect = useRef<boolean>(false);

  // Edit Name Modal
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');

  useEffect(() => {
    if (user?.displayName) {
      setEditName(user.displayName);
    }
  }, [user?.displayName]);

  // Generate 4-character room code
  const generateRoomCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const getHostUser = () => {
    let hostUser = user;
    if (hostUser.id === 'guest-init') {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('party_drink_guest_user') : null;
      if (stored) {
        try {
          hostUser = JSON.parse(stored);
        } catch {}
      }
      if (!hostUser || hostUser.id === 'guest-init') {
        hostUser = getRandomGuestUser();
      }
    }
    return hostUser;
  };

  // Auto-connect to existing room or auto-create for first person in Discord Voice Channel
  const autoConnectDiscordRoom = useCallback(async (code: string) => {
    setIsDiscordAutoConnecting(true);
    setDiscordConnectStatus('กำลังตรวจหาห้องสำหรับ Discord Voice Channel...');

    try {
      let existingRoom: any = null;
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('code', code)
          .maybeSingle();
        if (!error && data) {
          existingRoom = data;
        }
      } else {
        const res = await fetch(`/api/room?code=${code}`);
        if (res.ok) {
          const json = await res.json();
          if (json.exists && json.room) {
            existingRoom = json.room;
          }
        }
      }

      // Case 1: Room already exists and is active!
      if (existingRoom && existingRoom.status !== 'finished') {
        if (existingRoom.status === 'playing') {
          setDiscordConnectStatus(`พบห้อง ${code} กำลังเล่นอยู่ กำลังเข้าสู่สนามประลอง...`);
          router.replace(`/super/play/${code}`);
        } else {
          setDiscordConnectStatus(`พบห้อง ${code} ของเพื่อนใน Voice กำลังพาเข้าห้องรอ...`);
          router.replace(`/super/lobby/${code}`);
        }
        return;
      }

      // Case 2: Room does not exist or was finished -> Auto create room for the first person!
      setDiscordConnectStatus(`คุณคือคนแรกในช่องสนทนา กำลังสร้างห้อง ${code} ให้อัตโนมัติ...`);
      const hostUser = getHostUser();

      if (isSupabaseConfigured()) {
        if (existingRoom && existingRoom.status === 'finished') {
          await supabase.from('players').delete().eq('room_code', code);
          await supabase.from('rooms').delete().eq('code', code);
        }

        const { error: roomError } = await supabase.from('rooms').insert({
          code,
          host_id: hostUser.id,
          game_type: 'super-monopoly',
          status: 'waiting',
          current_turn_player_id: hostUser.id,
          game_state: { positions: { [hostUser.id]: 0 } },
        });

        if (roomError && roomError.code !== '23505') {
          console.error('Error creating room in Supabase:', roomError);
        }

        await supabase.from('players').upsert({
          id: hostUser.id,
          room_code: code,
          line_user_id: hostUser.id,
          display_name: hostUser.displayName,
          avatar_url: hostUser.avatarUrl,
          turn_order: 0,
          drinks_count: 0,
          is_connected: true,
        });
      } else {
        // Mock API
        const initialRoom = {
          code,
          host_id: hostUser.id,
          game_type: 'super-monopoly',
          status: 'waiting',
          current_turn_player_id: hostUser.id,
          game_state: { positions: { [hostUser.id]: 0 } },
          created_at: new Date().toISOString(),
        };
        const initialPlayer = {
          id: hostUser.id,
          room_code: code,
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
            code,
            room: initialRoom,
            player: initialPlayer,
          }),
        });
      }

      setDiscordConnectStatus(`สร้างห้อง ${code} เรียบร้อย กำลังเข้าสู่ห้องรอ...`);
      router.replace(`/super/lobby/${code}`);
    } catch (err: any) {
      console.error('Discord auto-connect error:', err);
      setIsDiscordAutoConnecting(false);
      setErrorMsg('ไม่สามารถเชื่อมต่อห้อง Discord อัตโนมัติได้ กรุณากดปุ่มเข้าห้องด้วยตนเอง');
    }
  }, [router, user]);

  // Auto-connect effect when entering in Discord
  useEffect(() => {
    if (isLoading || !discordRoomCode || hasAttemptedAutoConnect.current) return;

    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const isManualParam = urlParams?.get('manual') === '1';
    const isManualStorage = typeof window !== 'undefined' && sessionStorage.getItem('discord_manual_exit') === discordRoomCode;

    if (isManualParam || isManualStorage) {
      setJoinCode(discordRoomCode);
      return;
    }

    hasAttemptedAutoConnect.current = true;
    autoConnectDiscordRoom(discordRoomCode);
  }, [isLoading, discordRoomCode, autoConnectDiscordRoom]);

  // Create standard Super Monopoly room
  const handleCreateRoom = async () => {
    setIsCreating(true);
    setErrorMsg(null);
    const hostUser = getHostUser();
    const roomCode = discordRoomCode || generateRoomCode();

    try {
      if (isSupabaseConfigured()) {
        const { error: roomError } = await supabase.from('rooms').insert({
          code: roomCode,
          host_id: hostUser.id,
          game_type: 'super-monopoly',
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
        const initialRoom = {
          code: roomCode,
          host_id: hostUser.id,
          game_type: 'super-monopoly',
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

      router.push(`/super/lobby/${roomCode}`);
    } catch (err: any) {
      console.error('Create room error:', err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการสร้างห้อง');
      setIsCreating(false);
    }
  };

  // Quick Solo vs 3 Bots
  const handleSoloVsBots = async () => {
    setIsCreating(true);
    setErrorMsg(null);
    const hostUser = getHostUser();
    const roomCode = generateRoomCode();

    const botNames = ['บอทน้องควาย 🐃', 'บอทเสี่ยชัช 🎩', 'บอทเจ๊ลั้ง 💎'];
    const botAvatars = [
      '/buffy-mascot.png',
      'https://api.dicebear.com/7.x/bottts/svg?seed=BotChad',
      'https://api.dicebear.com/7.x/bottts/svg?seed=BotMadame',
    ];

    try {
      const initialRoom = {
        code: roomCode,
        host_id: hostUser.id,
        game_type: 'super-monopoly',
        status: 'playing',
        current_turn_player_id: hostUser.id,
        game_state: {
          positions: { [hostUser.id]: 0, 'bot-1': 0, 'bot-2': 0, 'bot-3': 0 },
        },
        created_at: new Date().toISOString(),
      };

      const initialPlayers = [
        {
          id: hostUser.id,
          room_code: roomCode,
          line_user_id: hostUser.id,
          display_name: hostUser.displayName,
          avatar_url: hostUser.avatarUrl,
          turn_order: 0,
          drinks_count: 0,
          is_connected: true,
        },
        ...botNames.map((name, i) => ({
          id: `bot-${i + 1}`,
          room_code: roomCode,
          line_user_id: 'bot',
          display_name: name,
          avatar_url: botAvatars[i],
          turn_order: i + 1,
          drinks_count: 0,
          is_connected: true,
        })),
      ];

      if (isSupabaseConfigured()) {
        await supabase.from('rooms').insert(initialRoom);
        for (const p of initialPlayers) {
          await supabase.from('players').upsert(p);
        }
      } else {
        await fetch('/api/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            code: roomCode,
            room: initialRoom,
            player: initialPlayers[0],
          }),
        });

        for (let i = 1; i < initialPlayers.length; i++) {
          await fetch('/api/room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'join',
              code: roomCode,
              player: initialPlayers[i],
            }),
          });
        }
      }

      router.push(`/super/play/${roomCode}`);
    } catch (err: any) {
      console.error('Solo room error:', err);
      setErrorMsg('สร้างเกมกับบอทไม่สำเร็จ');
      setIsCreating(false);
    }
  };

  // Join Room
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

      router.push(`/super/lobby/${cleanCode}`);
    } catch (err: any) {
      setErrorMsg('เกิดข้อผิดพลาดในการตรวจสอบห้อง');
      setIsJoining(false);
    }
  };

  const handleSaveProfile = () => {
    if (editName.trim()) {
      // updateUserProfile persists the name scoped to this user id
      updateUserProfile(editName.trim());
      setShowEditModal(false);
    }
  };

  if (isDiscordAutoConnecting) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 select-none">
        <div className="w-full max-w-sm bg-[#240e03]/95 border-2 border-yellow-500/40 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
          <div className="relative mb-4">
            <BuffaloLogo className="w-16 h-16 drop-shadow-lg animate-bounce" />
            <span className="absolute -bottom-1 -right-1 text-2xl">🎮</span>
          </div>

          <h2 className="text-lg font-black text-amber-100 mb-1">
            Discord Voice Activity
          </h2>
          <p className="text-xs text-amber-300/80 font-semibold mb-4">
            ระบบซิงก์ห้องเกมอัตโนมัติสำหรับ Voice Channel
          </p>

          <div className="w-full bg-[#140501] border border-[#522107] rounded-2xl py-3 px-4 mb-4 flex items-center justify-center gap-3 shadow-inner">
            <span className="text-xs text-amber-400/80 font-bold">รหัสห้อง:</span>
            <span className="font-mono text-2xl font-black text-yellow-300 tracking-widest">
              {discordRoomCode}
            </span>
          </div>

          <div className="flex items-center gap-2.5 mb-5 bg-[#170601] px-4 py-2 rounded-xl border border-[#4a1c05]">
            <Loader2 className="w-4 h-4 text-yellow-400 animate-spin shrink-0" />
            <span className="text-xs font-bold text-amber-200">
              {discordConnectStatus || 'กำลังเชื่อมต่อห้อง...'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && discordRoomCode) {
                sessionStorage.setItem('discord_manual_exit', discordRoomCode);
              }
              setIsDiscordAutoConnecting(false);
            }}
            className="text-xs text-amber-400/70 hover:text-amber-200 underline font-semibold transition cursor-pointer"
          >
            ยกเลิก / ไปยังหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-between p-4 sm:p-8">
      {/* Container with widescreen max width */}
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
        {/* Top Navbar */}
        <header className="w-full flex items-center justify-between bg-[#240e03]/90 border-2 border-[#54240a] rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <BuffaloLogo className="w-10 h-10 drop-shadow-md" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black rpg-text-gold tracking-wide">
                  ซุปเปอร์เศรษฐี คลาสสิก
                </h1>
                <span className="text-[10px] font-black bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 px-2 py-0.5 rounded-full uppercase">
                  Widescreen Edition
                </span>
              </div>
              <p className="text-[11px] text-amber-300/70 font-semibold">
                Super Monopoly Thai Edition • Discord & Web Fullscreen
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Profile Card */}
            <div
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 bg-[#170601] border border-[#4d1d05] hover:border-yellow-400/60 px-3 py-1.5 rounded-xl cursor-pointer transition shadow-inner group"
              title="คลิกเพื่อเปลี่ยนชื่อ"
            >
              <Avatar src={user.avatarUrl} name={user.displayName} size="sm" />
              <div className="text-left">
                <span className="text-xs font-bold text-amber-100 group-hover:text-yellow-300 block leading-tight">
                  {user.displayName}
                </span>
                <span className="text-[9px] text-amber-400/60 font-semibold flex items-center gap-1">
                  <Edit2 className="w-2.5 h-2.5" /> เปลี่ยนชื่อ
                </span>
              </div>
            </div>

            {/* Link back to Drinking Games */}
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-amber-300/80 hover:text-white bg-[#301204] hover:bg-[#471b07] border border-[#5a2408] px-3 py-2 rounded-xl transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>โหมดเกมวงเหล้า</span>
            </Link>
          </div>
        </header>

        {/* Hero Banner */}
        <div className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#3a1505] via-[#240e04] to-[#1a0802] border-2 border-[#662a0c] p-6 sm:p-8 shadow-2xl">
          <div className="absolute -right-6 -bottom-8 opacity-20 pointer-events-none">
            <span className="text-[180px]">🏠</span>
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs font-black mb-3">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>เวอร์ชันกระดานเต็มตา 100% Widescreen สำหรับ Discord & PC</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-amber-100 leading-tight mb-2">
              ซื้อที่ดิน ปลูกบ้าน-โรงแรม <span className="rpg-text-gold">ก้าวสู่มหาเศรษฐี</span>
            </h2>
            <p className="text-xs sm:text-sm text-amber-200/80 leading-relaxed mb-6 font-semibold">
              หวนคืนความทรงจำวัยเด็กกับกระดานซุปเปอร์เศรษฐี 32 ช่องที่คุ้นเคย ยูนิตเงินระดับล้าน (M) 
              สร้างบ้าน 3 หลัง อัปเกรดเป็นโรงแรมหรูเพื่อเรียกค่าเช่ามหาโหด พร้อมการ์ดหีบสมบัติและเสี่ยงโชคสุดระทึก!
            </p>

            {/* Error Notification */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-200 font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Discord Voice Quick Join Banner */}
            {discordRoomCode && (
              <div className="mb-5 bg-[#5865F2]/25 border-2 border-[#5865F2]/70 p-4 rounded-2xl shadow-xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base">🎮</span>
                  <p className="text-xs sm:text-sm text-indigo-200 font-black">
                    ตรวจพบการเข้าเล่นผ่าน Discord Voice Channel
                  </p>
                </div>
                <p className="text-xs text-gray-200 mb-3 font-medium">
                  รหัสห้องอัตโนมัติสำหรับช่องสนทนานี้คือ: <b className="text-yellow-300 font-mono font-black text-sm">{discordRoomCode}</b>
                  <span className="block text-[11px] text-indigo-300/80 mt-0.5">
                    คลิกปุ่มด้านล่างเพื่อเข้าห้องทันที (หากห้องยังไม่มี ระบบจะสร้างห้องให้อัตโนมัติ)
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      sessionStorage.removeItem('discord_manual_exit');
                    }
                    autoConnectDiscordRoom(discordRoomCode);
                  }}
                  className="wood-btn-gold px-5 py-2.5 rounded-xl text-xs font-black shadow-md flex items-center gap-2 active:scale-95 transition"
                >
                  <span>เข้าสู่ห้องตี้ใน Discord ทันที ({discordRoomCode})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isCreating}
                onClick={handleCreateRoom}
                className="wood-btn-gold px-6 py-3.5 rounded-xl font-black text-sm flex items-center gap-2.5 shadow-xl active:scale-95 disabled:opacity-50"
              >
                <Crown className="w-5 h-5" />
                <span>{isCreating ? 'กำลังสร้างห้อง...' : 'สร้างห้องซุปเปอร์เศรษฐี'}</span>
              </button>

              <button
                type="button"
                disabled={isCreating}
                onClick={handleSoloVsBots}
                className="wood-btn-brown px-5 py-3.5 rounded-xl font-black text-sm text-amber-200 border border-[#6b2b0a] flex items-center gap-2 shadow-lg hover:text-white active:scale-95 transition"
              >
                <Bot className="w-5 h-5 text-yellow-400" />
                <span>เล่นคนเดียวกับบอท (Solo vs 3 Bots)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Action & Info Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Join Room Form (5 cols) */}
          <div className="md:col-span-5 bg-[#240e03]/90 border-2 border-[#54240a] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-base font-black text-amber-200 flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-yellow-400" />
                <span>เข้าร่วมห้องที่เพื่อนสร้าง</span>
              </h3>
              <p className="text-xs text-amber-300/70 font-semibold mb-4">
                กรอกรหัสห้อง 4 หลักเพื่อเข้าร่วมกระดานของเพื่อน
              </p>

              <form onSubmit={handleJoinRoom} className="flex flex-col gap-3">
                <div>
                  <label className="text-[11px] font-bold text-amber-300/80 block mb-1">
                    รหัสห้อง (Room Code):
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    placeholder="เช่น A8K2"
                    className="w-full text-center text-2xl font-black font-mono tracking-widest uppercase py-3 rounded-xl bg-[#140501] border-2 border-[#4d1c05] text-yellow-400 placeholder:text-amber-700/40 focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isJoining}
                  className="wood-btn-gold w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
                >
                  <span>{isJoining ? 'กำลังตรวจสอบ...' : 'เข้าสู่สนามประลอง'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-[#401804] text-[11px] text-amber-300/60 font-semibold flex items-center justify-between">
              <span>สามารถเล่นได้พร้อมกัน 2-8 คน</span>
              <span className="text-yellow-400/80">มีระบบบอท AI อัตโนมัติ</span>
            </div>
          </div>

          {/* Super Monopoly Feature Highlights (7 cols) */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#1f0b02]/90 border border-[#4a1c06] rounded-2xl p-4 shadow-lg flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-yellow-500/40 flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-100 mb-1">ทุนเริ่มต้น 15M (ล้าน)</h4>
                <p className="text-[11px] text-amber-300/70 font-semibold leading-relaxed">
                  ผู้เล่นทุกคนเริ่มต้นด้วยเงินสด 15 ล้าน และเมื่อเดินครบรอบผ่านจุดเริ่มต้น รับเพิ่มทันที 2M
                </p>
              </div>
            </div>

            <div className="bg-[#1f0b02]/90 border border-[#4a1c06] rounded-2xl p-4 shadow-lg flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-yellow-500/40 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-100 mb-1">ปลูกบ้าน & โรงแรม</h4>
                <p className="text-[11px] text-amber-300/70 font-semibold leading-relaxed">
                  ซื้อที่ดินแล้วสร้างบ้านได้สูงสุด 3 หลัง และอัปเกรดเป็นโรงแรมหรูเพื่อเรียกค่าเช่าสูงสุด!
                </p>
              </div>
            </div>

            <div className="bg-[#1f0b02]/90 border border-[#4a1c06] rounded-2xl p-4 shadow-lg flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-yellow-500/40 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-100 mb-1">หีบสมบัติ & เสี่ยงโชค</h4>
                <p className="text-[11px] text-amber-300/70 font-semibold leading-relaxed">
                  การ์ดสุ่มคำสั่งคลาสสิก: ได้เงินปันผล, ถูกปรับภาษี, ย้ายไปสถานีรถไฟ หรือถูกส่งเข้าคุก
                </p>
              </div>
            </div>

            <div className="bg-[#1f0b02]/90 border border-[#4a1c06] rounded-2xl p-4 shadow-lg flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-yellow-500/40 flex items-center justify-center shrink-0">
                <Dices className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-100 mb-1">ระบบบอท AI อัตโนมัติ</h4>
                <p className="text-[11px] text-amber-300/70 font-semibold leading-relaxed">
                  ขาดคนก็เล่นได้! เพิ่มบอทลงในห้อง บอทจะทอยเต๋า ซื้อที่ดิน และสร้างบ้านเองโดยอัตโนมัติ
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <footer className="w-full text-center py-4 text-xs text-amber-400/50 font-semibold">
          Buffy Super Monopoly Thai Edition • เล่นเพลินบน Discord Activity, Web Browser & แท็บเล็ต
        </footer>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="แก้ไขชื่อผู้เล่น"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-amber-200 block mb-1">ชื่อเล่นของคุณ:</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={20}
              className="w-full px-3 py-2 rounded-xl bg-[#140501] border border-[#4d1c05] text-amber-100 focus:outline-none focus:border-yellow-400 font-bold text-sm"
              placeholder="กรอกชื่อที่ต้องการ..."
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-amber-400/80 block mb-1.5">
              หรือสุ่มชื่อสไตล์วงเหล้า:
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {THAI_PARTY_NICKNAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setEditName(name)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-[#270e03] hover:bg-[#3d1605] border border-[#4d1d05] text-amber-200 font-bold transition active:scale-95"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveProfile}
            className="wood-btn-gold w-full py-2.5 rounded-xl font-black text-xs shadow-md mt-2"
          >
            บันทึกชื่อ
          </button>
        </div>
      </Modal>
    </div>
  );
}
