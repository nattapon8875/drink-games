'use client';

import React, { useState } from 'react';
import {
  PlayingCard,
  DoraemonRule,
  SUIT_SYMBOLS,
  KingMode,
  KingPresetRule,
  DEFAULT_KING_PRESET_RULES,
} from './doraemonCardData';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { PlayerRecord } from '@/types/database';
import { Sparkles, Wine, Users, Skull, Crown } from 'lucide-react';

interface DoraemonActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: PlayingCard | null;
  rule: DoraemonRule | null;
  drawerPlayer: PlayerRecord | null;
  players: PlayerRecord[];
  currentUserId: string;
  isHost: boolean;
  onCompleteAction: (data: {
    drinkPenalty?: number;
    targetPlayerId?: string;
    toiletPassPlayerId?: string;
    ghostPlayerId?: string;
    buddyPair?: [string, string];
    kingPartInput?: string;
  }) => Promise<void>;
  kingCount: number; // 1 to 4
  kingMode?: KingMode;
  kingPresetRules?: Record<string, KingPresetRule>;
  kingSentences?: Record<string, string>;
  kingParts?: {
    what?: string;
    where?: string;
    howMany?: string;
    who?: string;
  };
}

export const DoraemonActionModal: React.FC<DoraemonActionModalProps> = ({
  isOpen,
  onClose,
  card,
  rule,
  drawerPlayer,
  players,
  currentUserId,
  isHost,
  onCompleteAction,
  kingCount,
  kingMode = 'preset',
  kingPresetRules = DEFAULT_KING_PRESET_RULES,
  kingSentences = {},
  kingParts = {},
}) => {
  const [selectedBuddyId, setSelectedBuddyId] = useState<string>('');
  const [kingInput, setKingInput] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!card || !rule || !drawerPlayer) return null;

  const isMyTurn = currentUserId === drawerPlayer.id;
  const canAct = isMyTurn || isHost;
  const suitInfo = SUIT_SYMBOLS[card.suit];

  const handleConfirm = async () => {
    if (!canAct) return;
    setSubmitting(true);
    try {
      if (rule.type === 'buddy') {
        const targetId = selectedBuddyId || players.find((p) => p.id !== drawerPlayer.id)?.id;
        if (targetId) {
          await onCompleteAction({
            buddyPair: [drawerPlayer.id, targetId],
          });
        }
      } else if (rule.type === 'toilet_pass') {
        await onCompleteAction({
          toiletPassPlayerId: drawerPlayer.id,
        });
      } else if (rule.type === 'ghost') {
        await onCompleteAction({
          ghostPlayerId: drawerPlayer.id,
        });
      } else if (rule.type === 'king_punishment') {
        const inputVal =
          kingMode === 'preset'
            ? (kingPresetRules[String(kingCount)]?.description || getDefaultKingText(kingCount, drawerPlayer.display_name))
            : (kingInput.trim() || getDefaultKingText(kingCount, drawerPlayer.display_name));
        await onCompleteAction({
          kingPartInput: inputVal,
        });
      } else if (rule.type === 'neighbor') {
        // Handled via rule drink penalty
        await onCompleteAction({
          drinkPenalty: rule.drinkCount,
        });
      } else {
        await onCompleteAction({
          drinkPenalty: rule.drinkCount,
        });
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  function getDefaultKingText(part: number, name: string): string {
    switch (part) {
      case 1:
        return 'วิดพื้น';
      case 2:
        return 'ใต้โต๊ะ';
      case 3:
        return '10 ครั้ง';
      case 4:
        return `${name} หรือคนที่แพ้เกม`;
      default:
        return 'ดื่ม 1 แก้ว';
    }
  }

  // Determine label for King stages
  const getKingQuestionLabel = (k: number) => {
    switch (k) {
      case 1:
        return { prompt: 'ไพ่ K ใบที่ 1: ให้ระบุ "ทำอะไร"', placeholder: 'เช่น วิดพื้น, ร้องเพลง, เต้นท่าไก่...' };
      case 2:
        return { prompt: 'ไพ่ K ใบที่ 2: ให้ระบุ "ทำที่ไหน"', placeholder: 'เช่น กลางวง, ใต้โต๊ะ, นอกระเบียง...' };
      case 3:
        return { prompt: 'ไพ่ K ใบที่ 3: ให้ระบุ "ทำกี่ครั้ง / นานแค่ไหน"', placeholder: 'เช่น 10 ครั้ง, 20 วินาที, 3 รอบ...' };
      case 4:
        return { prompt: 'ไพ่ K ใบที่ 4 (ใบสุดท้าย!): ระบุ "ใครต้องทำ!"', placeholder: 'เช่น คนจั่วใบนี้, เพื่อนทางขวา, ทุกคนในวง...' };
      default:
        return { prompt: 'ระบุบทลงโทษ', placeholder: 'กรอกบทลงโทษ...' };
    }
  };

  const currentKingPreset = kingPresetRules[String(kingCount)] || DEFAULT_KING_PRESET_RULES[String(kingCount)] || {
    title: `K ใบที่ ${kingCount}`,
    description: 'ทำตามคำสั่งของไพ่ K',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      className="max-w-md bg-gradient-to-b from-[#2e1305] via-[#1c0c04] to-[#100602] border-2 border-amber-500/80 shadow-[0_0_50px_rgba(245,158,11,0.5)] p-5 text-center"
    >
      {/* Top Banner */}
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black mb-3">
        <Sparkles className="w-3.5 h-3.5" />
        <span>ผลการจั่วไพ่โดราเอมอน</span>
      </div>

      {/* Card Presentation Display */}
      <div className="flex flex-col items-center justify-center my-3">
        <div className="w-32 h-44 sm:w-36 sm:h-52 bg-gradient-to-b from-[#faf6ee] to-[#f0e6d2] rounded-2xl border-4 border-[#b47a32] shadow-[0_15px_30px_rgba(0,0,0,0.9)] flex flex-col justify-between p-3 relative select-none animate-scaleUp">
          {/* Top Left Corner */}
          <div className="text-left font-black leading-none" style={{ color: suitInfo.color }}>
            <div className="text-2xl sm:text-3xl font-serif">{card.value}</div>
            <div className="text-lg sm:text-xl">{suitInfo.symbol}</div>
          </div>

          {/* Center Big Icon */}
          <div className="text-center">
            <span className="text-4xl sm:text-5xl drop-shadow">{rule.icon}</span>
          </div>

          {/* Bottom Right Corner */}
          <div className="text-right font-black leading-none rotate-180" style={{ color: suitInfo.color }}>
            <div className="text-2xl sm:text-3xl font-serif">{card.value}</div>
            <div className="text-lg sm:text-xl">{suitInfo.symbol}</div>
          </div>
        </div>

        <div className="mt-3">
          <h3 className="text-lg sm:text-xl font-black text-amber-100 rpg-text-gold">
            {rule.type === 'king_punishment' && kingMode === 'preset'
              ? currentKingPreset.title
              : rule.title}
          </h3>
          <p className="text-xs text-amber-300/80 font-bold mt-0.5">
            คนจั่ว: <span className="text-white font-black">{drawerPlayer.display_name}</span>
          </p>
        </div>
      </div>

      {/* Action Instruction Box */}
      <div className="p-3.5 rounded-2xl bg-[#1c0a02]/90 border border-[#522106] my-2 text-left">
        <p className="text-xs sm:text-sm text-amber-100 font-medium leading-relaxed">
          {rule.type === 'king_punishment' && kingMode === 'preset'
            ? currentKingPreset.description
            : rule.actionText}
        </p>

        {/* Special interactive input: 5 Buddy Dropdown */}
        {rule.type === 'buddy' && (
          <div className="mt-3 pt-3 border-t border-[#421703]">
            <label className="text-xs font-bold text-amber-300 block mb-1.5">
              🤝 เลือกสหายในวง 1 คนเพื่อผูกชะตาบัดดี้:
            </label>
            <select
              value={selectedBuddyId}
              onChange={(e) => setSelectedBuddyId(e.target.value)}
              disabled={!canAct}
              className="w-full bg-[#2a1004] border-2 border-amber-600/60 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-amber-400"
            >
              <option value="">-- เลือกเพื่อนร่วมวง --</option>
              {players
                .filter((p) => p.id !== drawerPlayer.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name} {p.drinks_count > 0 ? `(🍺 ${p.drinks_count})` : ''}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Special interactive input: K King punishment sequence */}
        {rule.type === 'king_punishment' && (
          <div className="mt-3 pt-3 border-t border-[#421703] space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-amber-300">
              <span className="flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-yellow-400" />
                <span>👑 ไพ่ King ใบที่ {kingCount} / 4</span>
              </span>
              <span className="text-[10px] text-amber-400/90 font-bold px-2 py-0.5 rounded-full bg-[#2a1004] border border-amber-900/60">
                {kingMode === 'preset' ? 'โหมด: คำสั่งตายตัว' : 'โหมด: พิมพ์สด'}
              </span>
            </div>

            {/* Past K Parts Summary */}
            <div className="bg-[#120501] p-2.5 rounded-xl border border-amber-900/60 text-[11px] space-y-1 text-gray-300">
              <div>
                • ใบที่ 1: <b className="text-amber-200">{kingSentences['1'] || kingParts.what || (kingCount === 1 ? '(กำลังดำเนินการ...)' : '-')}</b>
              </div>
              <div>
                • ใบที่ 2: <b className="text-amber-200">{kingSentences['2'] || kingParts.where || (kingCount === 2 ? '(กำลังดำเนินการ...)' : '-')}</b>
              </div>
              <div>
                • ใบที่ 3: <b className="text-amber-200">{kingSentences['3'] || kingParts.howMany || (kingCount === 3 ? '(กำลังดำเนินการ...)' : '-')}</b>
              </div>
              <div>
                • ใบที่ 4: <b className="text-amber-200">{kingSentences['4'] || kingParts.who || (kingCount === 4 ? '(กำลังดำเนินการ...)' : '-')}</b>
              </div>
            </div>

            {/* Input or Preset Instruction */}
            {kingMode === 'preset' ? (
              <div className="p-3 bg-gradient-to-br from-[#2f1304] to-[#1a0701] rounded-xl border border-amber-500/40 text-center">
                <div className="text-xs font-black text-amber-300 mb-1">
                  {currentKingPreset.title}
                </div>
                <div className="text-xs text-amber-100 font-bold">
                  "{currentKingPreset.description}"
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1">
                  ✍️ {getKingQuestionLabel(kingCount).prompt}
                </label>
                <input
                  type="text"
                  value={kingInput}
                  onChange={(e) => setKingInput(e.target.value)}
                  disabled={!canAct}
                  placeholder={getKingQuestionLabel(kingCount).placeholder}
                  className="w-full bg-[#2a1004] border border-amber-600/60 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400 placeholder-gray-500"
                />
              </div>
            )}
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
            {submitting
              ? 'กำลังบันทึก...'
              : rule.type === 'king_punishment'
              ? `รับทราบคำสั่ง K ใบที่ ${kingCount}! 👑`
              : 'รับทราบคำสั่งและดำเนินการต่อ! 🍻'}
          </Button>
        ) : (
          <div className="p-3 bg-black/40 rounded-2xl border border-amber-900/40 text-xs text-amber-200/70 font-semibold">
            ⏳ กำลังรอให้ <b>{drawerPlayer.display_name}</b> กดดำเนินการ...
          </div>
        )}
      </div>
    </Modal>
  );
};
