'use client';

import React, { useState } from 'react';
import { WheelItem } from './wheelData';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { PlayerRecord } from '@/types/database';
import { Sparkles, Wine, Users, Award, ShieldCheck } from 'lucide-react';

interface WheelResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WheelItem | null;
  spinnerPlayer: PlayerRecord | null;
  players: PlayerRecord[];
  currentUserId: string;
  isHost: boolean;
  onConfirm: (drinkPenalty: number, targetPlayerId?: string) => Promise<void>;
}

export const WheelResultModal: React.FC<WheelResultModalProps> = ({
  isOpen,
  onClose,
  item,
  spinnerPlayer,
  players,
  currentUserId,
  isHost,
  onConfirm,
}) => {
  const [selectedFriendId, setSelectedFriendId] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!item || !spinnerPlayer) return null;

  const isMyTurn = currentUserId === spinnerPlayer.id;
  const canAct = isMyTurn || isHost;

  // Neighbor calculations
  const spinnerIndex = players.findIndex((p) => p.id === spinnerPlayer.id);
  const leftIndex = (spinnerIndex - 1 + players.length) % Math.max(players.length, 1);
  const rightIndex = (spinnerIndex + 1) % Math.max(players.length, 1);
  const leftPlayer = players[leftIndex];
  const rightPlayer = players[rightIndex];

  const handleConfirm = async () => {
    if (!canAct) return;
    setSubmitting(true);
    try {
      if (item.actionType === 'choose') {
        const target = selectedFriendId || players.find((p) => p.id !== spinnerPlayer.id)?.id;
        await onConfirm(item.drinkCount, target);
      } else if (item.actionType === 'left') {
        await onConfirm(item.drinkCount, leftPlayer?.id);
      } else if (item.actionType === 'right') {
        await onConfirm(item.drinkCount, rightPlayer?.id);
      } else {
        await onConfirm(item.drinkCount, spinnerPlayer.id);
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      className="max-w-md bg-gradient-to-b from-[#2e1305] via-[#1c0c04] to-[#100602] border-2 border-amber-500/80 shadow-[0_0_50px_rgba(245,158,11,0.5)] p-5 text-center"
    >
      {/* Top Banner Badge */}
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black mb-3">
        <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
        <span>ผลลัพธ์วงล้อเสี่ยงทาย!</span>
      </div>

      {/* Result Display Box with Slice Color */}
      <div
        style={{ borderColor: item.color }}
        className="my-3 p-5 rounded-3xl bg-gradient-to-b from-[#1c0a02] to-[#120501] border-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center relative overflow-hidden"
      >
        <div
          style={{ backgroundColor: item.color }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2 border-white/40 mb-2.5"
        >
          {item.drinkCount === 4 ? '🍾' : item.drinkCount > 0 ? '🍺' : '🎉'}
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow">
          {item.text}
        </h3>

        <div className="mt-2 text-xs font-bold text-amber-300/80 flex items-center gap-1">
          <span>คนหมุน:</span>
          <b className="text-amber-100 font-black">{spinnerPlayer.display_name}</b>
        </div>
      </div>

      {/* Target Description & Interactive Friend Picker */}
      <div className="p-3.5 rounded-2xl bg-[#1a0701] border border-[#481c05] text-left text-xs my-2 space-y-2">
        {item.actionType === 'self' && (
          <p className="text-amber-100 font-bold leading-relaxed">
            👉 คนหมุนคือ <b>{spinnerPlayer.display_name}</b> ต้องรับบทลงโทษนี้!
            {item.drinkCount > 0 ? ` (ดื่ม ${item.drinkCount} อึก)` : ''}
          </p>
        )}

        {item.actionType === 'left' && (
          <p className="text-amber-100 font-bold leading-relaxed">
            👈 เพื่อนทางซ้ายของคนหมุนคือ <b>{leftPlayer?.display_name || 'เพื่อนคนซ้าย'}</b> ต้องดื่ม {item.drinkCount} อึก!
          </p>
        )}

        {item.actionType === 'right' && (
          <p className="text-amber-100 font-bold leading-relaxed">
            👉 เพื่อนทางขวาของคนหมุนคือ <b>{rightPlayer?.display_name || 'เพื่อนคนขวา'}</b> ต้องดื่ม {item.drinkCount} อึก!
          </p>
        )}

        {item.actionType === 'all' && (
          <p className="text-amber-100 font-bold leading-relaxed">
            🍻 สหายทุกคนในวงชนแก้วและยกพร้อมกัน 1 อึก!
          </p>
        )}

        {item.actionType === 'safe' && (
          <p className="text-emerald-300 font-black leading-relaxed flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>รอดตัวอย่างหวุดหวิด! ไม่มีใครต้องดื่มในตานี้! 🎉</span>
          </p>
        )}

        {/* Friend Selector if 'choose' */}
        {item.actionType === 'choose' && (
          <div>
            <label className="text-xs font-bold text-amber-300 block mb-1">
              🎯 เลือกเพื่อนในวง 1 คนเพื่อรับเคราะห์:
            </label>
            <select
              value={selectedFriendId}
              onChange={(e) => setSelectedFriendId(e.target.value)}
              disabled={!canAct}
              className="w-full bg-[#2a1004] border-2 border-amber-600/60 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
            >
              <option value="">-- เลือกเพื่อนร่วมวง --</option>
              {players
                .filter((p) => p.id !== spinnerPlayer.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name} {p.drinks_count > 0 ? `(🍺 ${p.drinks_count})` : ''}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Action Confirmation Button */}
      <div className="mt-4">
        {canAct ? (
          <Button
            variant="wood-gold"
            size="lg"
            fullWidth
            onClick={handleConfirm}
            disabled={submitting}
            className="py-3 text-sm sm:text-base font-black tracking-wide"
          >
            {submitting ? 'กำลังบันทึก...' : 'รับทราบคำสั่งและส่งต่อเทิร์น! 🍻'}
          </Button>
        ) : (
          <div className="p-3 bg-black/40 rounded-2xl border border-amber-900/40 text-xs text-amber-200/70 font-semibold">
            ⏳ กำลังรอให้ <b>{spinnerPlayer.display_name}</b> กดยืนยัน...
          </div>
        )}
      </div>
    </Modal>
  );
};
