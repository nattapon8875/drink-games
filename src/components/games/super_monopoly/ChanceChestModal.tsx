import React from 'react';
import { CardAction } from '@/types/database';
import { formatMoneyM } from './superMonopolyData';
import { Modal } from '@/components/common/Modal';
import { Gift, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';

interface ChanceChestModalProps {
  card: CardAction | null;
  isOpen: boolean;
  currentCash?: number;
  isMyTurn: boolean;
  onClose: () => void;
}

export const ChanceChestModal: React.FC<ChanceChestModalProps> = ({
  card,
  isOpen,
  currentCash,
  isMyTurn,
  onClose,
}) => {
  if (!card || !isOpen) return null;

  const isChest = card.type === 'chest';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isChest ? '🎁 หีบสมบัติ' : '⛩️ ประตูดวง'}
    >
      <div className="flex flex-col items-center text-center gap-3 py-2">
        {/* Card Header Icon & Banner */}
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center border-4 shadow-xl ${
            isChest
              ? 'bg-gradient-to-br from-pink-500 to-rose-700 border-pink-300 text-white'
              : 'bg-gradient-to-br from-amber-400 to-yellow-600 border-amber-200 text-amber-950'
          }`}
        >
          <span className="text-4xl drop-shadow">{isChest ? '🎁' : '⛩️'}</span>
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-[#290d02] border border-[#522005] text-amber-300">
            {isChest ? 'CHEST CARD' : 'CHANCE CARD'}
          </span>
          <h3 className="text-xl font-black rpg-text-gold mt-2">{card.title}</h3>
          <p className="text-xs sm:text-sm text-amber-100 font-bold mt-1 px-4 leading-relaxed">
            {card.description}
          </p>
        </div>

        {/* Reward / Penalty Badge */}
        {card.rewardMoney !== undefined && card.rewardMoney !== 0 && (
          <div
            className={`px-4 py-2 rounded-2xl border-2 font-black text-sm sm:text-base flex items-center gap-2 shadow-md ${
              card.rewardMoney > 0
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                : 'bg-rose-950/80 border-rose-600 text-rose-200'
            }`}
          >
            <span>{card.rewardMoney > 0 ? '💰 ได้รับเงิน:' : '💸 เสียเงิน:'}</span>
            <span className="text-lg sm:text-xl font-mono">
              {card.rewardMoney > 0 ? `+${formatMoneyM(card.rewardMoney)}` : `-${formatMoneyM(Math.abs(card.rewardMoney))}`}
            </span>
          </div>
        )}

        {card.collectFromAll && (
          <div className="px-4 py-2 rounded-2xl border-2 bg-emerald-950/80 border-emerald-500 text-emerald-200 font-black text-sm flex items-center gap-2 shadow-md">
            <span>💰 เก็บเงินจากเพื่อนทุกคน คนละ:</span>
            <span className="text-lg font-mono text-yellow-300">+{formatMoneyM(card.collectFromAll)}</span>
          </div>
        )}

        {card.goJail && (
          <div className="px-4 py-2 rounded-2xl border-2 bg-rose-950/80 border-rose-600 text-rose-200 font-black text-xs sm:text-sm flex items-center gap-2 shadow-md animate-pulse">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span>เข้าห้องขังทันที ข้ามการเดิน 1 รอบ!</span>
          </div>
        )}

        {/* Current Cash Bar */}
        {currentCash !== undefined && (
          <div className="w-full bg-[#180902] border border-[#522005] rounded-xl py-2 px-3 flex items-center justify-between shadow-inner">
            <span className="text-xs text-amber-300/80 font-bold">💵 เงินสดปัจจุบันของคุณ:</span>
            <span className="text-sm font-black font-mono text-yellow-400">{formatMoneyM(currentCash)}</span>
          </div>
        )}

        {/* Close / Proceed Button */}
        {isMyTurn && (
          <button
            type="button"
            onClick={onClose}
            className="wood-btn-gold w-full py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 mt-1 shadow active:scale-95 transition"
          >
            <span>รับทราบ / ดำเนินการต่อ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </Modal>
  );
};
