import React, { useState } from 'react';
import { SuperPropertyTile, PropertyOwnership } from '@/types/database';
import { formatMoneyM } from './superMonopolyData';
import { Modal } from '@/components/common/Modal';
import { Home, Building2, Shield, Check, X, Wallet, Coins } from 'lucide-react';

interface PropertyCardModalProps {
  isOpen: boolean;
  tile: SuperPropertyTile | null;
  ownership: PropertyOwnership | null;
  currentCash: number;
  isMyTurn: boolean;
  onClose: () => void;
  onBuyLand: () => Promise<void>;
  onBuildHouse: () => Promise<void>;
}

export const PropertyCardModal: React.FC<PropertyCardModalProps> = ({
  isOpen,
  tile,
  ownership,
  currentCash,
  isMyTurn,
  onClose,
  onBuyLand,
  onBuildHouse,
}) => {
  const [loading, setLoading] = useState(false);

  if (!tile || !isOpen) return null;

  const isOwner = ownership && ownership.ownerId;
  const houses = ownership?.houses || 0;
  const hasHotel = houses === 4;

  const handleBuy = async () => {
    setLoading(true);
    try {
      await onBuyLand();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleBuild = async () => {
    setLoading(true);
    try {
      await onBuildHouse();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const canAffordLand = tile.cost ? currentCash >= tile.cost : false;
  const houseCost = houses === 3 ? (tile.hotelCost || 2.0) : (tile.houseCost || 0.8);
  const canAffordHouse = hasHotel ? false : currentCash >= houseCost;

  const remainingAfterBuy = tile.cost ? currentCash - tile.cost : currentCash;
  const remainingAfterBuild = currentCash - houseCost;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`โฉนดที่ดิน: ${tile.name}`}>
      <div className="flex flex-col gap-3">
        {/* Title Deed Card Header */}
        <div
          className="p-3.5 rounded-2xl text-white text-center shadow-lg border-2 border-white/20 flex flex-col items-center justify-center relative"
          style={{ backgroundColor: tile.color || '#3b1704' }}
        >
          <span className="text-2xl drop-shadow mb-0.5">{tile.icon || '🏛️'}</span>
          <h3 className="text-lg font-black tracking-wide drop-shadow uppercase">{tile.name}</h3>
          <span className="text-[11px] font-bold text-white/90 bg-black/30 px-2.5 py-0.5 rounded-full mt-1">
            ราคาที่ดิน: {tile.cost ? formatMoneyM(tile.cost) : '-'}
          </span>
        </div>

        {/* Rent & Building Rates Table */}
        <div className="bg-[#200c02] border border-[#522005] rounded-2xl p-3 text-xs space-y-1.5 shadow-inner">
          <div className="flex justify-between items-center text-amber-200">
            <span>ค่าผ่านทาง (ที่ดินเปล่า):</span>
            <span className="font-bold text-yellow-400">{tile.baseRent ? formatMoneyM(tile.baseRent) : '-'}</span>
          </div>
          <div className="flex justify-between items-center text-amber-200/90">
            <span className="flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-cyan-400 inline" /> บ้าน 1 หลัง:
            </span>
            <span className="font-bold text-yellow-400">{tile.rent1House ? formatMoneyM(tile.rent1House) : '-'}</span>
          </div>
          <div className="flex justify-between items-center text-amber-200/90">
            <span className="flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-cyan-400 inline" /> บ้าน 2 หลัง:
            </span>
            <span className="font-bold text-yellow-400">{tile.rent2House ? formatMoneyM(tile.rent2House) : '-'}</span>
          </div>
          <div className="flex justify-between items-center text-amber-200/90">
            <span className="flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-cyan-400 inline" /> บ้าน 3 หลัง:
            </span>
            <span className="font-bold text-yellow-400">{tile.rent3House ? formatMoneyM(tile.rent3House) : '-'}</span>
          </div>
          <div className="flex justify-between items-center text-amber-200 font-bold border-t border-[#421703] pt-1">
            <span className="flex items-center gap-1 text-rose-300">
              <Building2 className="w-3.5 h-3.5 text-rose-400 inline" /> โรงแรม:
            </span>
            <span className="font-bold text-rose-300">{tile.rentHotel ? formatMoneyM(tile.rentHotel) : '-'}</span>
          </div>
        </div>

        {/* Cost to Build Info */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-amber-200/80 bg-[#2a1003] border border-[#522207] p-2 rounded-xl text-center">
          <div>
            ค่าสร้างบ้าน: <strong className="text-yellow-400">{tile.houseCost ? formatMoneyM(tile.houseCost) : '-'}</strong> /หลัง
          </div>
          <div>
            อัปเกรดโรงแรม: <strong className="text-rose-300">{tile.hotelCost ? formatMoneyM(tile.hotelCost) : '-'}</strong>
          </div>
        </div>

        {/* Cash Balance & Remaining After Purchase Bar */}
        {isMyTurn && (
          <div className="bg-[#180902] border-2 border-[#5c2709] rounded-2xl p-2.5 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-lg shadow">
                💵
              </div>
              <div>
                <span className="text-[10px] text-amber-300/80 font-bold block leading-tight">
                  เงินสดในกระเป๋าคุณ:
                </span>
                <span className="text-sm sm:text-base font-black font-mono text-yellow-400">
                  {formatMoneyM(currentCash)}
                </span>
              </div>
            </div>

            {/* Remaining Amount After Transaction */}
            {!isOwner && tile.cost && (
              <div className="text-right">
                <span className="text-[10px] text-amber-300/80 font-bold block leading-tight">
                  เงินคงเหลือหลังซื้อ:
                </span>
                <span
                  className={`text-sm sm:text-base font-black font-mono ${
                    canAffordLand ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {canAffordLand
                    ? formatMoneyM(remainingAfterBuy)
                    : `ขาดอีก ${formatMoneyM(tile.cost - currentCash)}`}
                </span>
              </div>
            )}

            {isOwner && !hasHotel && (
              <div className="text-right">
                <span className="text-[10px] text-amber-300/80 font-bold block leading-tight">
                  เงินคงเหลือหลังสร้าง:
                </span>
                <span
                  className={`text-sm sm:text-base font-black font-mono ${
                    canAffordHouse ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {canAffordHouse
                    ? formatMoneyM(remainingAfterBuild)
                    : `ขาดอีก ${formatMoneyM(houseCost - currentCash)}`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {isMyTurn && (
          <div className="flex gap-2 mt-1">
            {!isOwner ? (
              <button
                type="button"
                disabled={loading || !canAffordLand}
                onClick={handleBuy}
                className="wood-btn-gold flex-1 py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg active:scale-95 disabled:opacity-40"
              >
                <Check className="w-4 h-4" />
                <span>
                  {canAffordLand
                    ? `ซื้อที่ดิน (${tile.cost ? formatMoneyM(tile.cost) : ''})`
                    : `เงินไม่พอ (ขาด ${formatMoneyM(tile.cost! - currentCash)})`}
                </span>
              </button>
            ) : !hasHotel ? (
              <button
                type="button"
                disabled={loading || !canAffordHouse}
                onClick={handleBuild}
                className="wood-btn-gold flex-1 py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg active:scale-95 disabled:opacity-40"
              >
                {houses === 3 ? (
                  <>
                    <Building2 className="w-4 h-4 text-rose-300" />
                    <span>สร้างโรงแรม ({tile.hotelCost ? formatMoneyM(tile.hotelCost) : ''})</span>
                  </>
                ) : (
                  <>
                    <Home className="w-4 h-4 text-cyan-300" />
                    <span>สร้างบ้านหลังที่ {houses + 1} ({tile.houseCost ? formatMoneyM(tile.houseCost) : ''})</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex-1 py-2 text-center text-xs font-bold text-amber-300 bg-[#381604] rounded-xl border border-[#6b2c08]">
                ⭐ พัฒนาที่ดินขั้นสูงสุดแล้ว (โรงแรม)
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="wood-btn-brown px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-amber-200 border border-[#522207]"
            >
              ข้าม / ปิด
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
