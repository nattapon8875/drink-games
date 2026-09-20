import React from 'react';
import { Modal } from '@/components/common/Modal';
import { formatMoneyM } from './superMonopolyData';
import { AlertTriangle, ArrowRight, Coins, Building, Home, Skull, ShieldAlert } from 'lucide-react';

export interface PenaltyNotice {
  type: 'rent' | 'tax' | 'jail_bail' | 'penalty';
  tileName: string;
  tileIcon?: string;
  reason: string;
  amount: number;
  recipientName?: string;
  previousCash: number;
  remainingCash: number;
  houses?: number;
  isUtility?: boolean;
}

interface PenaltyModalProps {
  isOpen: boolean;
  notice: PenaltyNotice | null;
  onAcknowledge: () => void;
}

export const PenaltyModal: React.FC<PenaltyModalProps> = ({
  isOpen,
  notice,
  onAcknowledge,
}) => {
  if (!isOpen || !notice) return null;

  const isBankrupt = notice.remainingCash <= 0;
  const isRent = notice.type === 'rent';
  const isTax = notice.type === 'tax';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onAcknowledge}
      title={isRent ? '💸 ชำระค่าผ่านทาง' : isTax ? '💰 ชำระภาษีทรัพย์สิน' : '⚠️ แจ้งเตือนการเสียค่าปรับ'}
      className="max-w-md"
      showCloseButton={false}
    >
      <div className="flex flex-col items-center text-center gap-3 py-1">
        {/* Animated Icon Badge */}
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center border-4 shadow-2xl relative ${
            isBankrupt
              ? 'bg-gradient-to-br from-red-950 via-rose-900 to-black border-red-500 text-red-300 animate-pulse'
              : isRent
              ? 'bg-gradient-to-br from-rose-900 via-red-900 to-amber-950 border-rose-500/80 text-white'
              : 'bg-mint to-stone-900 border-amber-500 text-yellow-300'
          }`}
        >
          <span className="text-4xl drop-shadow-lg">
            {isBankrupt ? '💀' : notice.tileIcon || (isRent ? '🏨' : '💸')}
          </span>
          {notice.houses !== undefined && notice.houses > 0 && (
            <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black border border-white shadow">
              {notice.houses === 4 ? '🏨 โรงแรม' : `🏠 x${notice.houses}`}
            </span>
          )}
        </div>

        {/* Title & Reason */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-2))] text-amber-300">
            {isRent ? 'PROPERTY RENT FEE' : isTax ? 'GOVERNMENT TAX' : 'PENALTY FEE'}
          </span>
          <h3 className="text-lg sm:text-xl font-black text-white mt-1.5 flex items-center justify-center gap-1.5">
            <span>{notice.tileName}</span>
          </h3>
          <p className="text-xs text-amber-200/90 font-bold mt-1 px-3 leading-relaxed">
            {notice.reason}
          </p>
        </div>

        {/* Recipient info if Rent */}
        {notice.recipientName && (
          <div className="w-full py-1.5 px-3 rounded-xl bg-[rgb(var(--c-bg-deep))] border border-[rgb(var(--c-surface-2))] flex items-center justify-between text-xs">
            <span className="text-amber-400/80 font-bold">จ่ายให้แก่เจ้าของ:</span>
            <span className="font-black text-amber-100">{notice.recipientName}</span>
          </div>
        )}

        {/* Financial Details Box */}
        <div className="w-full flex flex-col gap-2 bg-[rgb(var(--c-bg-deep))] border-2 border-[rgb(var(--c-surface-3))] rounded-2xl p-3 shadow-inner">
          {/* Deducted Amount */}
          <div className="flex items-center justify-between border-b border-[rgb(var(--c-surface-2))] pb-2">
            <span className="text-xs font-bold text-red-300 flex items-center gap-1">
              <span>💸 ยอดที่ต้องจ่าย:</span>
            </span>
            <span className="text-lg sm:text-xl font-black font-mono text-rose-400 drop-shadow">
              -{formatMoneyM(notice.amount)}
            </span>
          </div>

          {/* Remaining Cash */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-amber-300/90 flex items-center gap-1">
              <span>💵 เงินสดคงเหลือของคุณ:</span>
            </span>
            <span
              className={`text-base sm:text-lg font-black font-mono drop-shadow ${
                isBankrupt ? 'text-red-500 font-extrabold animate-bounce' : 'text-yellow-400'
              }`}
            >
              {formatMoneyM(notice.remainingCash)}
            </span>
          </div>
        </div>

        {/* Bankruptcy Alert if Cash <= 0 */}
        {isBankrupt && (
          <div className="w-full p-2.5 rounded-xl bg-red-950/80 border border-red-600 text-red-200 text-xs font-black flex items-center gap-2 animate-pulse">
            <Skull className="w-5 h-5 text-red-400 shrink-0" />
            <span className="text-left">
              เงินสดของคุณหมดแล้ว! คุณเข้าสู่ภาวะล้มละลายในตานี้
            </span>
          </div>
        )}

        {/* Acknowledge Button */}
        <button
          type="button"
          onClick={onAcknowledge}
          className="wood-btn-gold w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 mt-1 shadow-xl active:scale-95 transition"
        >
          <span>รับทราบ</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </Modal>
  );
};
