import React from 'react';
import { Modal } from '@/components/common/Modal';
import { formatMoneyM } from './superMonopolyData';
import { Landmark, Skull, Wallet, ArrowRight } from 'lucide-react';

export interface DebtDecision {
  amount: number;
  creditorId: string | null;
  creditorName: string | null;
  tileName: string;
  tileIcon: string;
  reason: string;
  cashNow: number;
  raisable: number;
  canCover: boolean;
}

interface DebtModalProps {
  isOpen: boolean;
  debt: DebtDecision | null;
  onMortgage: () => void;
  onBankrupt: () => void;
}

export const DebtModal: React.FC<DebtModalProps> = ({ isOpen, debt, onMortgage, onBankrupt }) => {
  if (!isOpen || !debt) return null;

  const shortfall = Math.max(0, debt.amount - debt.cashNow);

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="⚠️ เงินสดไม่พอจ่าย">
      <div className="flex flex-col gap-3 text-center">
        <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-[rgb(var(--c-surface))] border-2 border-orange-700">
          <span className="text-3xl">{debt.tileIcon}</span>
          <span className="text-sm font-black text-amber-100">{debt.tileName}</span>
          <span className="text-[11px] font-bold text-amber-300/80">{debt.reason}</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
          <div className="p-2 rounded-xl bg-[rgb(var(--c-bg-deep))] border border-[rgb(var(--c-surface-2))]">
            <span className="block text-amber-400/85 text-[9px]">ต้องจ่าย</span>
            <span className="block text-rose-300 font-black font-mono">{formatMoneyM(debt.amount)}</span>
          </div>
          <div className="p-2 rounded-xl bg-[rgb(var(--c-bg-deep))] border border-[rgb(var(--c-surface-2))]">
            <span className="block text-amber-400/85 text-[9px]">เงินสดที่มี</span>
            <span className="block text-amber-100 font-black font-mono">{formatMoneyM(debt.cashNow)}</span>
          </div>
          <div className="p-2 rounded-xl bg-[rgb(var(--c-bg-deep))] border border-[rgb(var(--c-surface-2))]">
            <span className="block text-amber-400/85 text-[9px]">ยังขาด</span>
            <span className="block text-orange-300 font-black font-mono">{formatMoneyM(shortfall)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-sky-200 p-2 rounded-xl bg-sky-500/10 border border-sky-500/40">
          <Landmark className="w-4 h-4 text-sky-300" />
          <span>จำนองที่ดิน + บ้านทั้งหมดได้</span>
          <ArrowRight className="w-3.5 h-3.5 text-sky-400/85" />
          <span className="font-black font-mono text-sky-100">{formatMoneyM(debt.raisable)}</span>
        </div>

        {debt.canCover ? (
          <>
            <p className="text-[11px] font-bold text-emerald-300">
              จำนองแล้วพอจ่าย เลือกได้ว่าจะสู้ต่อหรือยอมแพ้
            </p>
            <button
              type="button"
              onClick={onMortgage}
              className="wood-btn-gold w-full py-3 rounded-2xl text-sm font-black shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              จำนองที่ดิน แล้วจ่าย {formatMoneyM(debt.amount)}
            </button>
            <button
              type="button"
              onClick={onBankrupt}
              className="w-full py-2.5 rounded-2xl text-xs font-black bg-[rgb(var(--c-surface))] border-2 border-[rgb(var(--c-surface-3))] text-rose-200 active:scale-95"
            >
              💀 ยอมล้มละลาย ออกจากเกม
            </button>
          </>
        ) : (
          <>
            <p className="text-[11px] font-bold text-rose-300 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/40">
              จำนองทั้งหมดแล้วก็ยังไม่พอจ่าย ต้องล้มละลาย
            </p>
            <button
              type="button"
              onClick={onBankrupt}
              className="w-full py-3 rounded-2xl text-sm font-black bg-[rgb(var(--c-surface))] border-2 border-[rgb(var(--c-surface-3))] text-rose-100 active:scale-95 flex items-center justify-center gap-2"
            >
              <Skull className="w-4 h-4" />
              ล้มละลาย ออกจากเกม
            </button>
          </>
        )}
      </div>
    </Modal>
  );
};
