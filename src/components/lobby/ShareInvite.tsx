'use client';

import React, { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Share2, Copy, Check, MessageCircle, Disc } from 'lucide-react';
import { PlatformType } from '@/lib/platforms/types';
import { shareInvite } from '@/lib/platforms/adapter';
import { showToast } from '@/lib/alerts';

interface ShareInviteProps {
  roomCode: string;
  hostName: string;
  platform: PlatformType;
}

export const ShareInvite: React.FC<ShareInviteProps> = ({
  roomCode,
  hostName,
  platform,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleCopyCode = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      showToast(`คัดลอกรหัสห้อง ${roomCode} เรียบร้อย!`, 'success');
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return;
    try {
      const url = `${window.location.origin}/lobby/${roomCode}`;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      showToast('คัดลอกลิงก์เทียบเชิญเรียบร้อย!', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const res = await shareInvite(platform, roomCode, hostName);
      if (res && platform === 'web') {
        setCopiedLink(true);
        showToast('คัดลอกลิงก์เทียบเชิญเรียบร้อย!', 'success');
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {platform === 'line' ? (
        <Button
          variant="neon-green"
          onClick={handleShare}
          disabled={sharing}
          fullWidth
          className="bg-[#06C755] border-[#06C755] text-white hover:bg-[#05a346] shadow-[0_0_15px_rgba(6,199,85,0.5)]"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          {sharing ? 'กำลังเปิด LINE...' : 'แชร์การ์ดชวนเพื่อนเข้า LINE'}
        </Button>
      ) : platform === 'discord' ? (
        <div className="p-3 bg-[#5865F2]/20 border border-[#5865F2]/40 rounded-xl text-center">
          <div className="flex items-center justify-center gap-2 text-[#5865F2] font-bold mb-1">
            <Disc className="w-5 h-5 animate-spin" />
            <span>ซิงก์ใน Discord Voice Channel เรียบร้อย!</span>
          </div>
          <p className="text-xs text-gray-300">
            เพื่อนที่กดเข้ามาใน Activity ผ่านห้องพูดคุยนี้ จะเข้ามาอยู่ในห้องเกมเดียวกันทันที
          </p>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        {/* Room Code Badge (Clickable to copy code) */}
        <button
          type="button"
          onClick={handleCopyCode}
          className="flex-1 bg-[#200c02] hover:bg-[#2d1204] border-2 border-[#54240a] hover:border-yellow-400/60 rounded-2xl px-3 py-2.5 text-center font-mono font-black tracking-widest text-lg sm:text-xl text-yellow-300 shadow-inner flex items-center justify-center gap-2 transition active:scale-95 group cursor-pointer"
          title="คลิกเพื่อคัดลอกรหัสห้อง"
        >
          <span>{roomCode}</span>
          <Copy className="w-4 h-4 text-amber-300/50 group-hover:text-yellow-300 transition shrink-0" />
        </button>

        {/* Copy Code Button */}
        <Button
          variant="wood-brown"
          size="md"
          onClick={handleCopyCode}
          className="flex-shrink-0 px-3 py-2.5 text-xs font-black border-2 border-[#5c280b]"
          title="คัดลอกรหัสห้อง 6 ตัว"
        >
          {copiedCode ? (
            <>
              <Check className="w-4 h-4 mr-1 text-emerald-300" />
              <span>ก๊อปแล้ว</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-1" />
              <span>ก๊อปรหัส</span>
            </>
          )}
        </Button>

        {/* Copy Link Button */}
        <Button
          variant="wood-gold"
          size="md"
          onClick={handleCopyLink}
          className="flex-shrink-0 px-3 py-2.5 text-xs font-black"
          title="คัดลอกลิงก์เทียบเชิญเข้าห้อง"
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4 mr-1 text-emerald-200" />
              <span>ก๊อปแล้ว</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 mr-1" />
              <span>ก๊อปลิงก์</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
