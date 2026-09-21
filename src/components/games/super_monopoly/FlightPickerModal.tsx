import React from 'react';
import { Modal } from '@/components/common/Modal';
import { SUPER_MONOPOLY_TILES, formatMoneyM, visitMultiplier } from './superMonopolyData';
import { PropertyOwnership, PlayerRecord } from '@/types/database';
import { PLAYER_3D_COLORS } from './SuperBoard3D';

interface FlightPickerModalProps {
  isOpen: boolean;
  fromIndex: number;
  properties: Record<number, PropertyOwnership>;
  players: PlayerRecord[];
  myId: string | null;
  onChoose: (destIndex: number) => void;
  onClose: () => void;
}

// Same ring the 2D board lays out, so picking a destination means pointing at
// the square where it actually sits rather than hunting through a list.
function getGridPosition(index: number): { col: number; row: number } {
  if (index >= 0 && index <= 10) return { col: 11 - index, row: 11 };
  if (index >= 11 && index <= 20) return { col: 1, row: 11 - (index - 10) };
  if (index >= 21 && index <= 30) return { col: 1 + (index - 20), row: 1 };
  return { col: 11, row: 1 + (index - 30) };
}

// Whether flying to a square passes the start the way walking there would.
function passesStart(fromIndex: number, destIndex: number) {
  return destIndex <= fromIndex;
}

export const FlightPickerModal: React.FC<FlightPickerModalProps> = ({
  isOpen,
  fromIndex,
  properties,
  players,
  myId,
  onChoose,
}) => {
  if (!isOpen) return null;

  const colourOf = (p: PlayerRecord) =>
    PLAYER_3D_COLORS[players.indexOf(p) % PLAYER_3D_COLORS.length];

  // Who actually holds land, so the key only lists people worth avoiding.
  const landlords = players.filter((p) =>
    Object.values(properties).some((own) => own.ownerId === p.id)
  );

  return (
    // The flight is the whole turn, so there is nothing to close back to.
    <Modal isOpen={isOpen} title="✈️ เลือกจุดหมายปลายทาง" showCloseButton={false}>
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-bold text-[rgb(var(--c-sky-label))] text-center">
          แตะช่องที่ต้องการบินไป · บินผ่านจุดเริ่มต้นรับเงินเดือนตามปกติ
        </p>

        <div className="w-full aspect-square max-w-[min(78vh,520px)] mx-auto grid grid-cols-11 grid-rows-11 gap-[2px] p-1.5 rounded-2xl bg-[rgb(var(--c-bg-deep))] border-2 border-[rgb(var(--c-line))]">
          {SUPER_MONOPOLY_TILES.map((tile) => {
            const { col, row } = getGridPosition(tile.index);
            const owned = properties[tile.index];
            const owner = owned ? players.find((p) => p.id === owned.ownerId) : null;
            const isMine = Boolean(owned && myId && owned.ownerId === myId);
            const isHere = tile.index === fromIndex;
            const salary = passesStart(fromIndex, tile.index);
            const ownerColor = owner ? colourOf(owner) : null;
            const ownerSeat = owner ? players.indexOf(owner) + 1 : null;
            // Worth knowing before you book the seat: this square charges a
            // multiple of its rent.
            const boost = tile.isUtility && owned ? visitMultiplier(owned.visits) : 1;

            return (
              <button
                key={tile.index}
                type="button"
                disabled={isHere}
                onClick={() => onChoose(tile.index)}
                style={{
                  gridColumn: col,
                  gridRow: row,
                  // Someone else's square is ringed in their colour, so the map
                  // reads as who you would be landing on.
                  ...(owner && !isMine && ownerColor ? { borderColor: ownerColor } : {}),
                }}
                title={
                  owner
                    ? `${tile.name} · ที่ดินของ ${owner.display_name}${
                        owned && owned.houses > 0 ? ` (สิ่งปลูกสร้าง ${owned.houses})` : ''
                      }${boost > 1 ? ` · ค่าผ่านทางคูณ x${boost}` : ''}`
                    : `${tile.name}${tile.cost ? ` · ว่าง ${formatMoneyM(tile.cost)}` : ''}`
                }
                className={`relative flex flex-col items-center justify-center rounded-md border-2 overflow-hidden transition active:scale-90 ${
                  isHere
                    ? 'bg-[rgb(var(--c-surface-2))] border-[rgb(var(--c-line-strong))] opacity-60 cursor-default'
                    : boost >= 3
                    ? 'bg-[rgb(var(--c-berry-soft))] hover:brightness-110'
                    : boost === 2
                    ? 'bg-[rgb(var(--c-butter-soft))] hover:brightness-110'
                    : isMine
                    ? 'bg-[rgb(var(--c-mint-soft))] border-[rgb(var(--c-mint))]'
                    : owner
                    ? 'bg-[rgb(var(--c-surface-2))] hover:brightness-110'
                    : 'bg-[rgb(var(--c-surface))] border-[rgb(var(--c-line))] hover:border-[rgb(var(--c-sky))]'
                }`}
              >
                {ownerColor && (
                  <span
                    className="absolute inset-x-0 top-0 h-[4px]"
                    style={{ backgroundColor: ownerColor }}
                  />
                )}

                <span className="text-[9px] sm:text-xs leading-none mt-[2px]">
                  {tile.icon || '🏠'}
                </span>
                <span className="text-[5px] sm:text-[7px] font-black leading-tight text-center px-[1px] truncate w-full text-[rgb(var(--c-ink))]">
                  {isHere ? 'อยู่ตรงนี้' : tile.name}
                </span>

                {owner && (
                  <span
                    className="absolute top-[5px] left-[2px] w-[9px] h-[9px] sm:w-3 sm:h-3 rounded-full border border-white flex items-center justify-center text-[6px] sm:text-[8px] font-black leading-none text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]"
                    style={{ backgroundColor: ownerColor || undefined }}
                  >
                    {ownerSeat}
                  </span>
                )}

                {boost > 1 && (
                  <span className="absolute bottom-0 left-0 px-[2px] rounded-tr-[3px] bg-black/70 text-[5px] sm:text-[7px] font-black text-white leading-none">
                    x{boost}
                  </span>
                )}

                {salary && !isHere && (
                  <span className="absolute bottom-0 right-0 text-[5px] sm:text-[7px]">🏁</span>
                )}
              </button>
            );
          })}

          {/* Middle of the board: who owns what, and what the marks mean */}
          <div
            style={{ gridColumn: '2 / 11', gridRow: '2 / 11' }}
            className="flex flex-col items-center justify-center gap-2 rounded-xl bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-line))] px-3 py-2 text-center overflow-auto"
          >
            <span className="text-2xl leading-none">✈️</span>
            <span className="text-[11px] font-black text-[rgb(var(--c-sky-label))]">
              เลือกช่องที่จะบินไป
            </span>

            {landlords.length > 0 && (
              <div className="w-full">
                <span className="block text-[8px] font-black text-[rgb(var(--c-ink-faint))] mb-1">
                  เจ้าของที่ดิน (เลขในช่อง = เจ้าของ)
                </span>
                <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5">
                  {landlords.map((p) => {
                    const held = Object.values(properties).filter(
                      (own) => own.ownerId === p.id
                    ).length;
                    return (
                      <span
                        key={p.id}
                        className="flex items-center gap-1 text-[9px] sm:text-[11px] font-black text-[rgb(var(--c-ink))]"
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[8px] font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]"
                          style={{ backgroundColor: colourOf(p) }}
                        >
                          {players.indexOf(p) + 1}
                        </span>
                        <span className="truncate max-w-[84px]">
                          {p.id === myId ? 'คุณ' : p.display_name}
                        </span>
                        <span className="text-[rgb(var(--c-ink-faint))]">×{held}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <span className="text-[8px] font-bold text-[rgb(var(--c-ink-faint))]">
              🏁 = บินผ่านจุดเริ่มต้น รับ {formatMoneyM(2)} · ช่องสีเหลือง/แดง = ค่าผ่านทางถูกคูณ
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
