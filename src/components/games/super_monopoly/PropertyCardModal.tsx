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

  // Special Non-Property Tiles (ประตูดวง, หีบสมบัติ, คุก, จุดเริ่มต้น, จุดพักผ่อน, เสียภาษี, ไปเข้าคุก)
  if (tile.type !== 'property') {
    const specialConfig: Record<
      string,
      { title: string; badge: string; bgGradient: string; description: string; details: string[] }
    > = {
      start: {
        title: 'จุดเริ่มต้น (GO)',
        badge: 'รับเงินทุน / เงินเดือน',
        bgGradient: 'from-emerald-600 to-green-800 border-emerald-400',
        description: 'จุดเริ่มต้นของการเดินทางรอบกระดานซุปเปอร์เศรษฐี',
        details: [
          'ทุกครั้งที่เดินผ่านจุดนี้ จะได้รับเงินเดือน 2.0M ทันที',
          'หากทอยลูกเต๋ามาตกที่ช่องนี้พอดี จะได้รับเงินเดือน 2.0M เช่นกัน',
          'นำเงินที่ได้ไปลงทุนซื้อที่ดินและพัฒนาสิ่งปลูกสร้างเพื่อเก็บค่าผ่านทาง',
        ],
      },
      chance: {
        title: 'ประตูดวง (Chance)',
        badge: 'สุ่มการ์ดดวงชะตา',
        bgGradient: 'from-amber-500 to-yellow-700 border-amber-300',
        description: 'ช่องวัดดวง ลุ้นเหตุการณ์พลิกผันที่จะเปลี่ยนสถานการณ์ในเกม!',
        details: [
          'เมื่อเดินมาตกช่องนี้ จะได้สุ่มเปิดการ์ดประตูดวง 1 ใบ',
          'มีโอกาสได้รับการ์ดรับเงินรางวัลพิเศษ, วาร์ปไปยังเมืองต่างๆ',
          'หรืออาจต้องเสียเงินค่าปรับ หรือถูกตำรวจส่งตัวเข้าห้องขังทันที!',
        ],
      },
      chest: {
        title: 'หีบสมบัติ (Community Chest)',
        badge: 'สุ่มการ์ดโชคลาภ',
        bgGradient: 'from-pink-600 to-rose-800 border-pink-400',
        description: 'ช่องเปิดหีบสมบัติ ลุ้นรับผลประโยชน์ โบนัส หรือการแบ่งปันในวงเพื่อน',
        details: [
          'เมื่อเดินมาตกช่องนี้ จะได้สุ่มเปิดการ์ดหีบสมบัติ 1 ใบ',
          'มีโอกาสได้รับเงินปันผลหุ้น, ของขวัญวันเกิด',
          'หรือการ์ดเก็บเงินสนับสนุนจากเพื่อนทุกคนในวง!',
        ],
      },
      jail: {
        title: 'ห้องขัง / แวะเยี่ยมคุก (Jail & Visiting)',
        badge: 'คุกคุมขัง / ผู้มาเยือน',
        bgGradient: 'from-purple-900 to-slate-900 border-purple-500',
        description: 'สถานที่คุมขังผู้เล่นที่ทำผิดกฎ หรือพื้นที่แวะเยี่ยมเยียน',
        details: [
          'หากเดินมาตกช่องนี้ตามปกติ: คุณมาในฐานะ "ผู้มาเยี่ยม" ปลอดภัย ไม่ต้องเสียเงินและไม่ถูกขัง',
          'หากถูกตำรวจจับส่งเข้าคุก: ต้องติดคุกจนกว่าจะจ่ายค่าประกัน 0.5M, เสี่ยงทอยแต้มคู่ หรือดื่ม 1 ช็อตเพื่อแหกคุก',
        ],
      },
      parking: {
        title: 'จุดพักผ่อน (Free Parking)',
        badge: 'พื้นที่พักผ่อน ปลอดภัย',
        bgGradient: 'from-sky-600 to-blue-800 border-sky-400',
        description: 'จุดจอดพักผ่อนหย่อนใจ ปลอดภัย 100%',
        details: [
          'ไม่มีการเรียกเก็บเงินค่าผ่านทางใดๆ ทั้งสิ้น',
          'ผู้เล่นสามารถพักผ่อนได้อย่างปลอดภัยเพื่อเตรียมพร้อมเดินต่อในรอบถัดไป',
        ],
      },
      go_to_jail: {
        title: 'ไปเข้าคุกทันที (Go to Jail)',
        badge: 'คำสั่งจับกุมตัว',
        bgGradient: 'from-red-600 to-rose-950 border-red-500',
        description: 'จุดอันตรายที่สุดบนกระดาน!',
        details: [
          'หากเดินมาตกช่องนี้ ตัวหมากของคุณจะถูกจับส่งเข้าห้องขัง (ช่องที่ 8) ทันที',
          'ไม่สามารถเดินผ่านจุดเริ่มต้น และไม่ได้รับเงินเดือน 2.0M',
          'จบรอบตาเดินของคุณทันที',
        ],
      },
      tax: {
        title: 'เสียภาษี (Tax)',
        badge: 'ชำระภาษีเข้ารัฐ',
        bgGradient: 'from-orange-600 to-amber-900 border-orange-400',
        description: 'ช่องเรียกเก็บภาษีบำรุงประเทศ',
        details: [
          `เมื่อเดินมาตกช่องนี้ จะต้องจ่ายภาษีเข้ารัฐทันที ${tile.index === 23 ? '1.5M (ภาษีมรดก)' : '1.0M (ภาษีรายได้)'}`,
          'หากเงินสดไม่เพียงพอ จะถูกหักจนเหลือ 0',
        ],
      },
    };

    const config = specialConfig[tile.type] || {
      title: tile.name,
      badge: 'ช่องพิเศษ',
      bgGradient: 'from-amber-600 to-amber-900 border-amber-500',
      description: tile.description || 'ช่องพิเศษบนกระดาน',
      details: [tile.description || 'ช่องกิจกรรมพิเศษ'],
    };

    return (
      <Modal isOpen={isOpen} onClose={onClose} title={`ช่องพิเศษ: ${tile.name}`}>
        <div className="flex flex-col gap-3 text-center">
          {/* Header Banner */}
          <div
            className={`p-4 rounded-2xl text-white shadow-xl border-2 bg-gradient-to-br ${config.bgGradient} flex flex-col items-center justify-center relative`}
          >
            <span className="text-4xl drop-shadow mb-1">{tile.icon || '⭐'}</span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/40 px-2.5 py-0.5 rounded-full mb-1">
              {config.badge}
            </span>
            <h3 className="text-lg font-black tracking-wide drop-shadow uppercase">{config.title}</h3>
          </div>

          {/* Description & Rules Box */}
          <div className="bg-[#200c02] border border-[#522005] rounded-2xl p-3.5 text-xs text-left shadow-inner space-y-2.5">
            <p className="text-amber-100 font-bold leading-relaxed">{config.description}</p>
            <div className="border-t border-[#421703] pt-2 space-y-1.5">
              <span className="text-[11px] font-black text-amber-300 block">📌 กฎของช่องนี้:</span>
              <ul className="space-y-1.5 text-amber-200/90 text-[11px]">
                {config.details.map((d, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-yellow-400 font-bold shrink-0">•</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="wood-btn-gold w-full py-2.5 rounded-xl font-black text-xs sm:text-sm shadow active:scale-95 transition mt-1"
          >
            เข้าใจแล้ว / ปิดหน้าต่าง
          </button>
        </div>
      </Modal>
    );
  }

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
        {tile.isUtility ? (
          <div className="bg-[#102336] border-2 border-cyan-700/60 rounded-2xl p-3 text-xs space-y-2 shadow-inner">
            <div className="flex items-center gap-2 pb-1 border-b border-cyan-800">
              <span className="text-lg">{tile.index === 4 ? '🚰' : '⚡'}</span>
              <div>
                <span className="text-xs font-black text-cyan-200 block">กิจการสาธารณูปโภค</span>
                <span className="text-[10px] text-cyan-300/70">ไม่สามารถสร้างบ้านหรือโรงแรมได้</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-amber-100">
              <span>ค่าบริการ (ครอบครอง 1 แห่ง):</span>
              <span className="font-bold font-mono text-yellow-400">0.5M</span>
            </div>
            <div className="flex justify-between items-center text-amber-100 font-bold border-t border-cyan-800/80 pt-1.5">
              <span className="text-yellow-300">ครอบครองทั้ง 2 แห่ง (ประปา + โรงไฟฟ้า):</span>
              <span className="font-mono text-emerald-400 text-sm">1.2M 🔥</span>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}

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
                    ? `ซื้อ${tile.isUtility ? 'กิจการ' : 'ที่ดิน'} (${tile.cost ? formatMoneyM(tile.cost) : ''})`
                    : `เงินไม่พอ (ขาด ${formatMoneyM(tile.cost! - currentCash)})`}
                </span>
              </button>
            ) : tile.isUtility ? (
              <div className="flex-1 py-2.5 text-center text-xs font-bold text-cyan-300 bg-[#0c2438] rounded-xl border border-cyan-700/60">
                ⚡ คุณเป็นเจ้าของกิจการนี้แล้ว (ไม่สามารถสร้างบ้านได้)
              </div>
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
