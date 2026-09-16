import React from 'react';
import { Modal } from '@/components/common/Modal';
import { formatMoneyM } from './superMonopolyData';
import { Coins, ArrowRight, Wallet } from 'lucide-react';

// Broadcast through game_state so the landlord is told about a payment that
// happened on someone else's turn - until now their balance just quietly went up.
export interface RentReceipt {
  ownerId: string;
  payerName: string;
  tileName: string;
  tileIcon?: string;
  amount: number;
  ownerCashAfter: number;
  at: number;
}

interface RentReceiptModalProps {
  isOpen: boolean;
  receipt: RentReceipt | null;
  onClose: () => void;
}

export const RentReceiptModal: React.FC<RentReceiptModalProps> = ({
  isOpen,
  receipt,
  onClose,
}) => {
  if (!isOpen || !receipt) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💰 มีคนตกที่ดินของคุณ">
      <div className="flex flex-col gap-3 text-center">
        <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-[#0d2818] border-2 border-emerald-700">
          <span className="text-3xl">{receipt.tileIcon || '🏨'}</span>
          <span className="text-sm font-black text-emerald-100">{receipt.tileName}</span>
          <span className="text-[11px] font-bold text-emerald-300/80">
            [{receipt.payerName}] จ่ายค่าผ่านทางให้คุณ
          </span>
        </div>

        <div className="flex items-center justify-center gap-2 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/50">
          <Coins className="w-5 h-5 text-emerald-300" />
          <span className="text-2xl font-black text-emerald-300">
            + {formatMoneyM(receipt.amount)}
          </span>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-200/90">
          <Wallet className="w-4 h-4 text-amber-300" />
          <span>เงินคงเหลือของคุณ</span>
          <ArrowRight className="w-3.5 h-3.5 text-amber-400/70" />
          <span className="text-amber-100 font-black">{formatMoneyM(receipt.ownerCashAfter)}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="wood-btn-gold w-full py-3 rounded-2xl text-sm font-black shadow-lg active:scale-95"
        >
          รับทราบ
        </button>
      </div>
    </Modal>
  );
};
