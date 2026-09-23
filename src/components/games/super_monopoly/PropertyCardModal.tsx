import React, { useState } from 'react';
import { SuperPropertyTile, PropertyOwnership } from '@/types/database';
import {
  formatMoneyM,
  maxHousesForVisits,
  visitMultiplier,
  MAX_VISIT_MULTIPLIER,
  rowMultiplierFor,
  rowOfTile,
  ROW_NAMES,
  RowBonus,
  mottoOfTile,
  computeRent,
} from './superMonopolyData';
import { Modal } from '@/components/common/Modal';
import { Home, Building2, Shield, Check, X, Wallet, Coins, Quote, Zap } from 'lucide-react';

interface PropertyCardModalProps {
  isOpen: boolean;
  tile: SuperPropertyTile | null;
  ownership: PropertyOwnership | null;
  currentCash: number;
  isMyTurn: boolean;
  ownerName?: string | null;
  ownerColor?: string | null;
  isOwnedByMe?: boolean;
  rowBonus?: RowBonus | null;
  allProperties?: Record<number, PropertyOwnership>;
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
  ownerName,
  ownerColor,
  isOwnedByMe,
  rowBonus,
  allProperties,
  onClose,
  onBuyLand,
  onBuildHouse,
}) => {
  const [loading, setLoading] = useState(false);

  if (!tile || !isOpen) return null;

  const isOwner = ownership && ownership.ownerId;
  const houses = ownership?.houses || 0;
  const hasHotel = houses === 4;

  // Building is rationed by how many times the owner has landed here: two
  // houses on the first visit, the third on the second, the hotel on the third.
  const visits = ownership?.visits || 0;
  const buildCap = maxHousesForVisits(visits || 1);
  const atVisitCap = Boolean(isOwner) && !hasHotel && houses >= buildCap;
  const boost = visitMultiplier(visits);

  // A province is multiplied by whoever holds its side of the board.
  const rowMult =
    !tile.isUtility &&
    rowBonus &&
    ownership &&
    rowBonus.ownerId === ownership.ownerId &&
    rowBonus.row === rowOfTile(tile.index)
      ? rowMultiplierFor(rowBonus.count)
      : 1;

  // Buying and building close the card themselves and decide what happens to
  // the turn. Calling onClose as well ran the skip branch on top of the
  // purchase: the feed showed "did not buy" right after "bought", with the cash
  // from before the sale, and the turn was handed over twice. It also closed the
  // card when a purchase had been refused for lack of money.
  const handleBuy = async () => {
    setLoading(true);
    try {
      await onBuyLand();
    } finally {
      setLoading(false);
    }
  };

  const handleBuild = async () => {
    setLoading(true);
    try {
      await onBuildHouse();
    } finally {
      setLoading(false);
    }
  };

  const motto = mottoOfTile(tile);

  // What this square charges right now, and why. Both multipliers were only
  // ever visible in passing - the visit one lived in the buy prompt, so simply
  // looking at a square told you nothing about what it had grown into.
  const liveRent =
    isOwner && ownership ? computeRent(tile, ownership, allProperties || {}, rowBonus) : null;
  const visitMult = tile.isUtility ? boost : 1;
  const totalMult = visitMult * rowMult;

  const canAffordLand = tile.cost ? currentCash >= tile.cost : false;
  const houseCost = houses === 3 ? (tile.hotelCost || 2.0) : (tile.houseCost || 0.8);
  const canAffordHouse = hasHotel || atVisitCap ? false : currentCash >= houseCost;

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
        title: 'ห้องขัง (Jail)',
        badge: 'ติดคุก • หยุด 1 ตา',
        bgGradient: 'from-purple-900 to-slate-900 border-purple-500',
        description: 'เดินมาตกเองก็ติดคุก ถูกส่งมาจากช่อง 30 ก็ติดคุก ไม่มีสถานะผู้มาเยือน',
        details: [
          'ตกช่องนี้คือติดคุกทันที ถึงจะทอยได้แต้มคู่ก็ไม่ได้ทอยต่อ จบตานั้นเลย',
          'ตาถัดไปเลือกจ่ายค่าปรับ 0.5M เพื่อออกมาทอยทันที หรือรับโทษ 1 ตา (ข้ามตาเดิน)',
        ],
      },
      parking: {
        title: 'จุดพักผ่อน (Rest Area)',
        badge: 'จุดพักผ่อน • หยุด 1 ตา',
        bgGradient: 'from-sky-600 to-blue-800 border-sky-400',
        description: 'จุดพักผ่อนหย่อนใจ ปลอดภัยจากค่าผ่านทาง แต่ต้องพัก 1 ตา',
        details: [
          'ไม่มีการเรียกเก็บค่าผ่านทางใดๆ ทั้งสิ้นในช่องนี้',
          'กติกา: ตกช่องนี้ไม่เสียเงิน แต่ตาถัดไปต้องพัก 1 ตา และถึงจะทอยได้แต้มคู่ก็ไม่ได้ทอยต่อ',
        ],
      },
      airport: {
        title: 'สนามบิน (Airport)',
        badge: 'บินไปช่องไหนก็ได้',
        bgGradient: 'from-sky-600 to-slate-900 border-sky-400',
        description: 'ขึ้นเครื่องไปลงช่องไหนบนกระดานก็ได้ที่เลือกเอง',
        details: [
          'ถ้าทอยได้แต้มคู่แล้วมาตกช่องนี้พอดี: เลือกจุดหมายแล้วบินได้ทันทีในตานั้น',
          'ถ้าทอยปกติ: จองที่นั่งไว้ก่อน แล้วตาถัดไปค่อยเลือกจุดหมาย (ตานั้นไม่ต้องทอยเต๋า)',
          'ถ้าเส้นทางบินผ่านจุดเริ่มต้น รับเงินเดือน 2.0M ตามปกติ',
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
            <span className="text-[10px] font-black uppercase tracking-wider bg-[rgb(var(--c-surface))]/40 px-2.5 py-0.5 rounded-full mb-1">
              {config.badge}
            </span>
            <h3 className="text-lg font-black tracking-wide drop-shadow uppercase">{config.title}</h3>
          </div>

          {/* Description & Rules Box */}
          <div className="bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-2))] rounded-2xl p-3.5 text-xs text-left shadow-inner space-y-2.5">
            <p className="text-amber-100 font-bold leading-relaxed">{config.description}</p>
            <div className="border-t border-[rgb(var(--c-surface-2))] pt-2 space-y-1.5">
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`โฉนดที่ดิน: ${tile.name}`}
      footer={
        <>
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
                <div className="flex-1 py-2.5 text-center text-[11px] font-bold text-[rgb(var(--c-sky-label))] bg-[rgb(var(--c-sky-soft))] rounded-xl border border-cyan-700/60 leading-tight">
                  ⚡ กิจการนี้สร้างบ้านไม่ได้ — ค่าผ่านทางคูณ{' '}
                  <span className="text-yellow-300 font-black">x{boost}</span>
                  <br />
                  <span className="text-[10px] text-[rgb(var(--c-ink-soft))] font-normal">
                    {boost >= MAX_VISIT_MULTIPLIER
                      ? `ตัวคูณสูงสุดแล้ว (x${MAX_VISIT_MULTIPLIER})`
                      : `มาตกอีกครั้งจะเพิ่มเป็น x${boost + 1}`}
                  </span>
                </div>
              ) : atVisitCap ? (
                <div className="flex-1 py-2 text-center text-[11px] font-bold text-amber-300 bg-[rgb(var(--c-surface-2))] rounded-xl border border-[rgb(var(--c-surface-3))] leading-tight">
                  🔒 รอบนี้สร้างครบ {houses} หลังแล้ว
                  <br />
                  <span className="text-[10px] text-amber-200/80 font-normal">
                    ต้องเดินมาตกที่ดินนี้อีกครั้งจึงจะสร้าง
                    {houses >= 3 ? 'โรงแรม' : `หลังที่ ${houses + 1}`}ได้
                  </span>
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
                      <Home className="w-4 h-4 text-[rgb(var(--c-sky-label))]" />
                      <span>สร้างบ้านหลังที่ {houses + 1} ({tile.houseCost ? formatMoneyM(tile.houseCost) : ''})</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex-1 py-2 text-center text-xs font-bold text-amber-300 bg-[rgb(var(--c-surface-2))] rounded-xl border border-[rgb(var(--c-surface-3))]">
                  ⭐ พัฒนาที่ดินขั้นสูงสุดแล้ว (โรงแรม)
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="wood-btn-brown px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-amber-200 border border-[rgb(var(--c-surface-3))]"
              >
                {isOwnedByMe ? 'พอแล้ว / จบตา' : 'ข้าม / ปิด'}
              </button>
            </div>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Title Deed Card Header */}
        <div
          className="p-3.5 rounded-2xl text-white text-center shadow-lg border-2 border-white/20 flex flex-col items-center justify-center relative"
          style={{ backgroundColor: tile.color || '#3b1704' }}
        >
          <span className="text-2xl drop-shadow mb-0.5">{tile.icon || '🏛️'}</span>
          <h3 className="text-lg font-black tracking-wide drop-shadow uppercase">{tile.name}</h3>
          <span className="text-[11px] font-bold text-white/90 bg-[rgb(var(--c-surface))]/30 px-2.5 py-0.5 rounded-full mt-1">
            ราคาที่ดิน: {tile.cost ? formatMoneyM(tile.cost) : '-'}
          </span>
        </div>

        {/* คำขวัญประจำจังหวัด - flavour only, and only the 22 real provinces
            have one, so a hotel or a utility simply skips this strip. */}
        {motto && (
          <div className="relative px-5 py-3 rounded-2xl bg-[rgb(var(--c-surface-2))] border border-[rgb(var(--c-line))]">
            <Quote
              className="absolute left-2 top-2 w-3.5 h-3.5 text-[rgb(var(--c-butter-label))]/70"
              aria-hidden
            />
            <p className="text-[13px] font-semibold leading-[1.95] text-center text-[rgb(var(--c-ink))]">
              {motto}
            </p>
            <span className="block mt-1.5 text-[10px] font-black text-center text-[rgb(var(--c-ink-faint))]">
              คำขวัญประจำจังหวัด
            </span>
          </div>
        )}

        {/* Who owns this tile - the card never said before */}
        <div
          className={`rounded-2xl px-3 py-2 flex items-center justify-between gap-2 border-2 shadow-inner ${
            isOwner
              ? 'bg-[rgb(var(--c-bg-deep))] border-[rgb(var(--c-surface-3))]'
              : 'bg-[rgb(var(--c-mint-soft))] border-emerald-700/70'
          }`}
        >
          <span className="text-[11px] font-black text-amber-300/80 shrink-0">
            สถานะที่ดิน:
          </span>

          {isOwner ? (
            <span className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-3 h-3 rounded-full border border-white/40 shrink-0"
                style={{ backgroundColor: ownerColor || '#f59e0b' }}
              />
              <span className="text-xs font-black text-amber-100 truncate">
                {ownerName || 'มีเจ้าของแล้ว'}
              </span>
              {isOwnedByMe && (
                <span className="text-[10px] font-black text-yellow-300 bg-yellow-500/15 border border-yellow-500/40 px-1.5 py-0.5 rounded-full shrink-0">
                  ของคุณ
                </span>
              )}
            </span>
          ) : (
            <span className="text-xs font-black text-emerald-300">
              ✨ ที่ว่าง — ยังไม่มีเจ้าของ
            </span>
          )}
        </div>

        {/* ค่าผ่านทางตอนนี้ + ตัวคูณที่สะสมมาแล้ว */}
        {liveRent !== null && (
          <div className="rounded-2xl border-2 border-[rgb(var(--c-line-strong))] bg-[rgb(var(--c-bg-deep))] px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-black text-[rgb(var(--c-ink-soft))]">
                <Zap className="w-3.5 h-3.5 text-[rgb(var(--c-butter-label))]" />
                ค่าผ่านทางตอนนี้
              </span>
              <span className="text-lg font-mono font-black text-[rgb(var(--c-butter-label))]">
                {formatMoneyM(liveRent)}
              </span>
            </div>

            <div className="mt-1.5 pt-1.5 border-t border-[rgb(var(--c-line))] flex flex-wrap items-center justify-center gap-1.5">
              {totalMult > 1 ? (
                <>
                  {visitMult > 1 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[rgb(var(--c-sky-soft))] text-[rgb(var(--c-sky-label))] border border-[rgb(var(--c-line))]">
                      แวะเองแล้ว {visits} ครั้ง ➜ x{visitMult}
                      {visitMult >= MAX_VISIT_MULTIPLIER ? ' (สูงสุด)' : ''}
                    </span>
                  )}
                  {rowMult > 1 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[rgb(var(--c-grape-soft))] text-[rgb(var(--c-grape))] border border-[rgb(var(--c-line))]">
                      โบนัสแถว ➜ x{rowMult}
                    </span>
                  )}
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[rgb(var(--c-butter-soft))] text-[rgb(var(--c-butter-label))] border border-[rgb(var(--c-line-strong))]">
                    รวมคูณ x{totalMult}
                  </span>
                </>
              ) : (
                <span className="text-[10px] font-bold text-[rgb(var(--c-ink-faint))]">
                  ยังไม่มีตัวคูณ (x1)
                </span>
              )}
            </div>
          </div>
        )}

        {rowMult > 1 && (
          <div className="rounded-2xl border-2 border-[rgb(var(--c-grape))] bg-[rgb(var(--c-grape-soft))] px-3 py-2 text-center">
            <span className="block text-[11px] font-black text-[rgb(var(--c-grape))]">
              🎏 โบนัสแถว [{ROW_NAMES[rowBonus!.row]}] — ถือ {rowBonus!.count} ช่อง
            </span>
            <span className="block text-[10px] font-bold text-[rgb(var(--c-ink-soft))] mt-0.5">
              ค่าผ่านทางของที่ดินนี้คูณ{' '}
              <strong className="text-[rgb(var(--c-grape))]">x{rowMult}</strong> จนกว่าจะมีคนครองแถวอื่นครบ 3 ช่อง
            </span>
          </div>
        )}

        {/* Rent & Building Rates Table */}
        {tile.isUtility ? (
          tile.index === 5 || tile.index === 12 ? (
            <div className="bg-[rgb(var(--c-sky-soft))] border-2 border-yellow-600/70 rounded-2xl p-3 text-xs space-y-2 shadow-inner">
              <div className="flex items-center gap-2 pb-1 border-b border-yellow-700/60">
                <span className="text-xl">{tile.icon || '⚡'}</span>
                <div>
                  <span className="text-xs font-black text-yellow-300 block">กิจการสาธารณูปโภค (Utilities)</span>
                  <span className="text-[10px] text-amber-200/80">การประปานครหลวง & โรงไฟฟ้านครหลวง</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-amber-100">
                <span>ค่าผ่านทาง (ถือครอง 1 แห่ง):</span>
                <span className="font-bold font-mono text-yellow-400">0.50M</span>
              </div>
              <div className="flex justify-between items-center text-amber-100 font-bold border-t border-yellow-700/60 pt-1.5">
                <span className="text-yellow-300">ถือครองครบ 2 แห่ง (ประปา + ไฟฟ้า):</span>
                <span className="font-mono text-[rgb(var(--c-mint-label))] text-xs text-right">
                  1.20M 🔥
                </span>
              </div>
              <div className="flex justify-between items-center text-amber-100 font-bold border-t border-yellow-700/60 pt-1.5">
                <span className="text-yellow-300">เจ้าของมาตกเองแต่ละครั้ง:</span>
                <span className="font-mono text-[rgb(var(--c-mint-label))] text-xs text-right">
                  คูณเพิ่มทีละ x1 (สูงสุด x{MAX_VISIT_MULTIPLIER})
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-[rgb(var(--c-sky-soft))] border-2 border-cyan-700/60 rounded-2xl p-3 text-xs space-y-2 shadow-inner">
              <div className="flex items-center gap-2 pb-1 border-b border-cyan-800">
                <span className="text-xl">🏨</span>
                <div>
                  <span className="text-xs font-black text-[rgb(var(--c-sky-label))] block">โรงแรมระดับพรีเมียม (Hotel Chain)</span>
                  <span className="text-[10px] text-[rgb(var(--c-ink-soft))]">โรงแรมสำเร็จรูป ไม่ต้องสร้างบ้านเพิ่ม</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-amber-100">
                <span>ค่าผ่านทาง (ถือครอง 1 แห่ง):</span>
                <span className="font-bold font-mono text-yellow-400">{formatMoneyM(tile.baseRent || 0.4)}</span>
              </div>
              <div className="flex justify-between items-center text-amber-100 font-bold border-t border-cyan-800/80 pt-1.5">
                <span className="text-yellow-300">โบนัสเครือข่ายโรงแรม:</span>
                <span className="font-mono text-[rgb(var(--c-mint-label))] text-xs text-right">
                  คูณตามจำนวนโรงแรมในเครือที่ครอบครอง 🔥
                </span>
              </div>
              <div className="flex justify-between items-center text-amber-100 font-bold border-t border-cyan-800/80 pt-1.5">
                <span className="text-yellow-300">เจ้าของมาตกเองแต่ละครั้ง:</span>
                <span className="font-mono text-[rgb(var(--c-mint-label))] text-xs text-right">
                  คูณเพิ่มทีละ x1 (สูงสุด x{MAX_VISIT_MULTIPLIER})
                </span>
              </div>
            </div>
          )
        ) : (
          <>
            <div className="bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-2))] rounded-2xl p-3 text-xs space-y-1.5 shadow-inner">
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
              <div className="flex justify-between items-center text-amber-200 font-bold border-t border-[rgb(var(--c-surface-2))] pt-1">
                <span className="flex items-center gap-1 text-rose-300">
                  <Building2 className="w-3.5 h-3.5 text-rose-400 inline" /> โรงแรม:
                </span>
                <span className="font-bold text-rose-300">{tile.rentHotel ? formatMoneyM(tile.rentHotel) : '-'}</span>
              </div>
            </div>

            {/* Cost to Build Info */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-amber-200/80 bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-3))] p-2 rounded-xl text-center">
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
          <div className="bg-[rgb(var(--c-bg-deep))] border-2 border-[rgb(var(--c-surface-3))] rounded-2xl p-2.5 flex items-center justify-between shadow-lg">
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
                    canAffordLand ? 'text-[rgb(var(--c-mint-label))]' : 'text-red-400'
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
                    canAffordHouse ? 'text-[rgb(var(--c-mint-label))]' : 'text-red-400'
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

      </div>
    </Modal>
  );
};
