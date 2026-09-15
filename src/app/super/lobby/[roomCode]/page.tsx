'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlatform } from '@/hooks/usePlatform';
import { useRoomRealtime } from '@/hooks/useRoomRealtime';
import { Avatar } from '@/components/common/Avatar';
import { showToast, showConfirm } from '@/lib/alerts';
import {
  Crown,
  Bot,
  Users,
  Play,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Copy,
  Share2,
  UserPlus,
  Trash2,
  Coins,
} from 'lucide-react';
import { BuffaloLogo } from '@/components/common/BuffaloLogo';

export default function SuperLobbyPage() {
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
    addBotPlayer,
    removePlayer,
    kickPlayer,
    startGame,
    closeRoom,
  } = useRoomRealtime(roomCode, user);

  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showDiscordModal, setShowDiscordModal] = useState(false);

  // Auto-join room
  useEffect(() => {
    if (user && roomCode && !roomLoading && !platformLoading) {
      joinRoom();
    }
  }, [user, roomCode, roomLoading, platformLoading, joinRoom]);

  // Redirect on game start or room close
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

    if (room.status === 'playing') {
      router.push(`/super/play/${roomCode}`);
    }
    if (room.status === 'finished') {
      if (typeof window !== 'undefined' && roomCode) {
        sessionStorage.setItem('discord_manual_exit', roomCode);
      }
      showToast('หัวหน้าห้องได้ทำการปิดห้องเกมแล้ว', 'info');
      router.push('/super?manual=1');
    }
  }, [room, roomCode, router, user]);

  const isHost = Boolean(room && user && room.host_id === user.id);

  const handleStartGame = async () => {
    if (!isHost || starting) return;
    if (players.length < 1) {
      showToast('ต้องมีผู้เล่นอย่างน้อย 1 คน', 'warning');
      return;
    }
    setStarting(true);
    router.push(`/super/play/${roomCode}`);
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
      if (typeof window !== 'undefined' && roomCode) {
        sessionStorage.setItem('discord_manual_exit', roomCode);
      }
      await closeRoom();
      router.push('/super?manual=1');
    }
  };

  const handleLeave = async () => {
    const confirmed = await showConfirm(
      'ออกจากห้อง?',
      'คุณต้องการออกจากห้องรอนี้หรือไม่',
      'ออกจากห้อง',
      'ยกเลิก'
    );
    if (confirmed) {
      if (typeof window !== 'undefined' && roomCode) {
        sessionStorage.setItem('discord_manual_exit', roomCode);
      }
      await leaveRoom();
      router.push('/super?manual=1');
    }
  };

  const handleCopyCode = async () => {
    if (typeof window !== 'undefined' && roomCode) {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      showToast(`คัดลอกรหัสห้อง ${roomCode} เรียบร้อย!`, 'success');
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleCopyLink = async () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/super/lobby/${roomCode}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast('คัดลอกลิงก์ชวนเพื่อนเรียบร้อย!', 'success');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopyFullMessage = async () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/super/lobby/${roomCode}`;
      const message = `🎲 ขอเชิญร่วมวงประลอง "ซุปเปอร์เศรษฐี คลาสสิก"!\n🔑 รหัสห้อง: ${roomCode}\n🔗 ลิงก์เข้าห้อง: ${url}\n(เล่นผ่าน Discord Activity หรือกดเปิดลิงก์บน Browser ได้ทันที)`;
      await navigator.clipboard.writeText(message);
      showToast('คัดลอกข้อความชวนเพื่อนเรียบร้อย! นำไปวางในแชท Discord หรือ LINE ได้เลย', 'success');
    }
  };

  const handleAddBot = async () => {
    if (players.length >= 8) {
      showToast('ผู้เล่นเต็ม 8 คนแล้ว', 'warning');
      return;
    }
    const botNames = ['บอทน้องควาย 🐃', 'บอทเสี่ยชัช 🎩', 'บอทเจ๊ลั้ง 💎', 'บอทผู้ใหญ่ลี 🌾', 'บอทเจ้าสัว 💰', 'บอทอาเสี่ย 🚗'];
    const usedNames = new Set(players.map((p) => p.display_name));
    const available = botNames.find((n) => !usedNames.has(n)) || `บอทตัวที่ ${players.length + 1} 🤖`;
    await addBotPlayer(available);
    showToast(`เพิ่ม ${available} สำเร็จ`, 'success');
  };

  if (platformLoading || roomLoading) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-yellow-400 animate-spin mb-3" />
        <p className="text-sm font-bold text-amber-200">กำลังเข้าสู่ห้องรอซุปเปอร์เศรษฐี...</p>
      </div>
    );
  }

  if (!room || error) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 max-w-md mx-auto text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
        <h2 className="text-lg font-black text-amber-100 mb-1">ไม่พบห้องที่ระบุ</h2>
        <p className="text-xs text-amber-300/70 mb-4">{error || 'ห้องนี้อาจถูกปิดไปแล้วหรือรหัสไม่ถูกต้อง'}</p>
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && roomCode) {
              sessionStorage.setItem('discord_manual_exit', roomCode);
            }
            router.push('/super?manual=1');
          }}
          className="wood-btn-gold px-6 py-2.5 rounded-xl font-bold text-xs"
        >
          กลับสู่หน้าซุปเปอร์เศรษฐี
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-between p-4 sm:p-8 select-none">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
        {/* Top Navbar */}
        <header className="w-full flex items-center justify-between bg-[#240e03]/90 border-2 border-[#54240a] rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={handleLeave}
              className="p-2 rounded-xl bg-[#1a0802] border border-[#4d1d05] text-amber-300 hover:text-white transition"
              title="ออกจากห้อง"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <BuffaloLogo className="w-10 h-10 drop-shadow-md" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black rpg-text-gold tracking-wide">
                  ห้องรอ: ซุปเปอร์เศรษฐี คลาสสิก
                </h1>
                <span className="text-[10px] font-black bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 px-2 py-0.5 rounded-full">
                  {players.length}/8 คน
                </span>
              </div>
              <p className="text-[11px] text-amber-300/70 font-semibold">
                Super Monopoly Classic Widescreen Lobby
              </p>
            </div>
          </div>

          {/* Room Code Badge */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDiscordModal(true)}
              className="flex items-center gap-2 bg-[#170601] hover:bg-[#2b1003] border-2 border-yellow-500/40 hover:border-yellow-400 px-3.5 py-1.5 rounded-xl shadow-inner cursor-pointer transition active:scale-95"
              title="คลิกเพื่อดูรหัส ลิงก์ และขั้นตอนการเข้า Discord"
            >
              <span className="text-xs text-amber-400/80 font-bold">รหัสห้อง:</span>
              <span className="font-mono text-base font-black text-yellow-300 tracking-wider">
                {roomCode}
              </span>
              <span className="text-[10px] text-amber-300/80 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-600/40">แชร์/วิธีเข้า</span>
            </button>

            {isHost && (
              <button
                onClick={handleCloseRoom}
                className="text-xs font-bold text-rose-300 hover:text-white bg-[#400e07] hover:bg-[#5c1309] border border-[#801c0c] px-3 py-2 rounded-xl shadow-sm transition"
                title="ยุบห้องนี้"
              >
                ยุบห้อง
              </button>
            )}
          </div>
        </header>

        {/* Main 2-Column Content */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Room Settings & Rules Overview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Rules & Setup Card */}
            <div className="bg-[#240e03]/90 border-2 border-[#54240a] rounded-2xl p-5 shadow-xl">
              <h2 className="text-sm font-black text-amber-200 flex items-center gap-2 mb-3 border-b border-[#471a06] pb-2">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span>กติกาและค่าตั้งต้น (Game Config)</span>
              </h2>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-[#170601] border border-[#421704]">
                  <span className="text-[10px] text-amber-400/70 block font-bold">ทุนเริ่มต้น:</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">15.00 M</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#170601] border border-[#421704]">
                  <span className="text-[10px] text-amber-400/70 block font-bold">ผ่านจุดเริ่มต้นรับ:</span>
                  <span className="text-sm font-black text-yellow-400 font-mono">+2.00 M</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#170601] border border-[#421704]">
                  <span className="text-[10px] text-amber-400/70 block font-bold">จำนวนบ้านสูงสุด:</span>
                  <span className="text-sm font-black text-amber-100">3 หลัง + 1 โรงแรม</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#170601] border border-[#421704]">
                  <span className="text-[10px] text-amber-400/70 block font-bold">จำนวนช่องกระดาน:</span>
                  <span className="text-sm font-black text-amber-100">32 ช่องคลาสสิก</span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-[#1a0802] border border-[#471a06] text-[11px] text-amber-300/80 font-semibold leading-relaxed">
                💡 <strong>เคล็ดลับ:</strong> เดินตกที่ดินว่างสามารถซื้อได้ทันที หากเป็นเจ้าของที่ดินสีเดียวกัน สามารถสร้างบ้านเพื่อเรียกเก็บค่าเช่าทวีคูณจากผู้เล่นคนอื่นได้!
              </div>
            </div>

            {/* Bot Management Card (Host Only) */}
            {isHost && (
              <div className="bg-[#240e03]/90 border-2 border-[#54240a] rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-yellow-400" />
                    <span>จัดการบอท AI ({players.filter((p) => p.line_user_id === 'bot' || p.id.startsWith('bot-')).length} ตัว)</span>
                  </h3>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={players.length >= 8}
                    onClick={handleAddBot}
                    className="wood-btn-gold flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>เพิ่มบอท AI (+1)</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const bots = players.filter(
                        (p) => p.line_user_id === 'bot' || p.id.startsWith('bot-')
                      );
                      for (const b of bots) {
                        await removePlayer(b.id);
                      }
                      showToast('ลบบอททั้งหมดแล้ว', 'info');
                    }}
                    className="wood-btn-brown px-3 py-2.5 rounded-xl font-bold text-xs text-amber-200 border border-[#521f06] hover:text-white transition"
                    title="ลบบอททั้งหมด"
                  >
                    ล้างบอท
                  </button>
                </div>
              </div>
            )}

            {/* Invite Share & Discord Guide Card */}
            <div className="bg-[#240e03]/90 border-2 border-[#54240a] rounded-2xl p-4 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#471a06] pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center shrink-0">
                    <Share2 className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-100">ชวนเพื่อนเข้าเล่น</h4>
                    <p className="text-[10px] text-amber-300/70 font-semibold">
                      คัดลอกรหัสหรือลิงก์ส่งให้เพื่อนใน Discord / LINE
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDiscordModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/50 text-[11px] font-bold text-indigo-200 flex items-center gap-1 transition"
                  title="ดูขั้นตอนการเข้าเล่นผ่าน Discord อย่างละเอียด"
                >
                  <span>🎮 วิธีเข้า Discord</span>
                </button>
              </div>

              {/* Room Code Display & Copy Actions */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#170601] border border-[#421704] rounded-xl px-3 py-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400/80">รหัสห้อง:</span>
                  <span className="font-mono text-base font-black text-yellow-300 tracking-wider">
                    {roomCode}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="wood-btn-brown px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow active:scale-95 shrink-0"
                  title="คัดลอกเฉพาะรหัสห้อง 6 ตัว"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode ? 'ก๊อปรหัสแล้ว!' : 'คัดลอกรหัส'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="wood-btn-gold px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow active:scale-95 shrink-0"
                  title="คัดลอกลิงก์ตรงสำหรับเปิดบนบราวเซอร์"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'ก๊อปลิงก์แล้ว!' : 'คัดลอกลิงก์'}</span>
                </button>
              </div>

              {/* Full Message Button */}
              <button
                type="button"
                onClick={handleCopyFullMessage}
                className="w-full py-2 rounded-xl bg-[#2e1305] hover:bg-[#421b06] border border-[#662908] text-[11px] font-bold text-amber-200 hover:text-white flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
              >
                <span>💬 คัดลอกข้อความชวนเพื่อน (รหัส + ลิงก์ + วิธีเข้า)</span>
              </button>

              {/* Quick Discord Instructions Snippet */}
              <div className="p-2.5 rounded-xl bg-[#141527] border border-[#5865F2]/40 text-[11px] text-indigo-100 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[#5865F2] font-black">
                  <span>🚀 เข้าผ่าน Discord:</span>
                </div>
                <p className="text-[10px] text-indigo-200/80 leading-relaxed">
                  เข้าห้องคุยเสียง (Voice) ➔ กดไอคอนรูปจรวด <strong>Start Activity</strong> ➔ เลือก <strong>Drink Games</strong> ➔ ใส่รหัส <span className="font-mono text-yellow-300 font-bold">{roomCode}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Player Roster & Start Control (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="bg-[#240e03]/90 border-2 border-[#54240a] rounded-2xl p-5 shadow-xl flex flex-col justify-between min-h-[460px]">
              <div>
                <div className="flex items-center justify-between border-b border-[#471a06] pb-3 mb-3">
                  <h3 className="text-sm font-black text-amber-200 flex items-center gap-2">
                    <Users className="w-4 h-4 text-yellow-400" />
                    <span>ผู้เล่นที่เข้าร่วม ({players.length}/8 คน)</span>
                  </h3>
                  <span className="text-[11px] text-amber-300/60 font-semibold">
                    พร้อมลุยกระดานเศรษฐี
                  </span>
                </div>

                {/* Player Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {players.map((p, idx) => {
                    const isMe = p.id === user?.id;
                    const isPlayerHost = p.id === room.host_id;
                    const isBot = p.line_user_id === 'bot' || p.id.startsWith('bot-');

                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          isMe
                            ? 'bg-[#3d1805] border-yellow-400/80 shadow-md'
                            : 'bg-[#170601] border-[#3d1503]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar
                            src={p.avatar_url}
                            name={p.display_name}
                            size="md"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-amber-100 truncate max-w-[110px]">
                                {p.display_name}
                              </span>
                              {isPlayerHost && (
                                <span title="หัวหน้าห้อง" className="shrink-0">
                                  <Crown className="w-3.5 h-3.5 text-yellow-400" />
                                </span>
                              )}
                              {isBot && (
                                <span className="text-[9px] font-bold bg-amber-950 text-amber-300 px-1 rounded border border-amber-800">
                                  BOT
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold block">
                              เงินเริ่มต้น: 15.00M
                            </span>
                          </div>
                        </div>

                        {/* Kick player (Host only) */}
                        {isHost && !isMe && (
                          <button
                            type="button"
                            onClick={async () => {
                              const confirmed = await showConfirm(
                                isBot ? `ลบบอท "${p.display_name}"?` : `เตะ "${p.display_name}" ออกจากห้อง?`,
                                'ผู้เล่นนี้จะถูกนำออกจากห้องทันที',
                                'ยืนยัน',
                                'ยกเลิก',
                                'warning'
                              );
                              if (confirmed) {
                                if (isBot) {
                                  await removePlayer(p.id);
                                } else {
                                  await kickPlayer(p.id);
                                }
                              }
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 transition"
                            title="เตะออกจากห้อง"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Start Game Control */}
              <div className="pt-4 border-t border-[#471a06] mt-4">
                {isHost ? (
                  <button
                    type="button"
                    disabled={starting || players.length === 0}
                    onClick={handleStartGame}
                    className="wood-btn-gold w-full py-4 rounded-xl font-black text-base flex items-center justify-center gap-3 shadow-2xl active:scale-95 disabled:opacity-50 tracking-wide"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>{starting ? 'กำลังเข้าสู่กระดาน...' : 'เริ่มเกมซุปเปอร์เศรษฐี!'}</span>
                  </button>
                ) : (
                  <div className="py-3.5 px-4 rounded-xl bg-[#170601] border border-[#3d1503] flex items-center justify-center gap-2 text-xs font-bold text-amber-300/80 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                    <span>รอหัวหน้าห้องกดเริ่มเกม...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
