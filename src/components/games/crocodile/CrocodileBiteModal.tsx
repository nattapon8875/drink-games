'use client';

import React from 'react';
import { PlayerRecord } from '@/types/database';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { RotateCcw, Wine, Sparkles, Skull } from 'lucide-react';
import { BITE_QUOTES } from './crocodileData';

interface CrocodileBiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  bittenPlayer: PlayerRecord | null;
  toothIndex: number;
  drinkCount: number;
  isHost: boolean;
  onStartNewRound: () => void;
}

export const CrocodileBiteModal: React.FC<CrocodileBiteModalProps> = ({
  isOpen,
  onClose,
  bittenPlayer,
  toothIndex,
  drinkCount,
  isHost,
  onStartNewRound,
}) => {
  const randomQuote = React.useMemo(() => {
    return BITE_QUOTES[Math.floor(Math.random() * BITE_QUOTES.length)];
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🐃 น้องควายงับมือแล้ว!"
      className="max-w-md text-center p-5"
    >
      <div className="flex flex-col items-center gap-3">
        {/* Animated Buffalo Chomp Badge */}
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-b from-amber-700 via-stone-800 to-stone-950 border-2 border-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.5)] flex items-center justify-center animate-bounce">
          <span className="text-5xl select-none">🐃💥</span>
          <div className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-black/80 border border-amber-400 text-[10px] font-black text-amber-300 uppercase tracking-wider">
            น้องควายงับคาปาก!
          </div>
        </div>

        {/* Player Name and Action */}
        <div className="mt-1">
          <div className="text-xs font-bold text-gray-300">ผู้รับเคราะห์ในรอบนี้:</div>
          <div className="text-2xl font-black text-amber-300 flex items-center justify-center gap-1.5 mt-0.5">
            <span>{bittenPlayer?.display_name || 'สหายร่วมวง'}</span>
          </div>
          <p className="text-xs text-rose-300/90 font-bold mt-1 px-3 py-1 rounded-xl bg-[#2e0b09] border border-rose-800/60">
            กดโดนฟันซี่ที่ {toothIndex + 1} ซึ่งเป็นฟันกับดัก!
          </p>
        </div>

        {/* Humorous Quote */}
        <p className="text-xs text-amber-200/80 italic font-medium px-2">
          &ldquo;{randomQuote}&rdquo;
        </p>

        {/* Penalty Display Box */}
        <div className="w-full bg-gradient-to-b from-[#2b0f04] to-[#1a0701] p-3.5 rounded-2xl border border-amber-500/50 shadow-inner flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-xl">
              🍺
            </div>
            <div className="text-left">
              <div className="text-[10px] font-bold text-gray-400 uppercase">บทลงโทษ</div>
              <div className="text-sm font-black text-white">
                {drinkCount === 4 ? '🍾 ยกหมดแก้ว!' : `ดื่ม ${drinkCount} อึก`}
              </div>
            </div>
          </div>
          <div className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs font-black text-amber-300">
            {drinkCount === 4 ? 'หมดแก้ว' : `+${drinkCount} อึก`}
          </div>
        </div>

        {/* Controls */}
        <div className="w-full pt-2 flex flex-col gap-2">
          {isHost ? (
            <Button
              variant="wood-gold"
              size="lg"
              fullWidth
              onClick={onStartNewRound}
              className="py-3.5 text-sm font-black flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              <span>เริ่มรอบใหม่ (สุ่มฟันใหม่)</span>
            </Button>
          ) : (
            <div className="text-xs text-gray-400 font-medium py-2 bg-black/40 rounded-xl border border-stone-800">
              รอหัวหน้าห้อง (Host) เริ่มรอบใหม่...
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
