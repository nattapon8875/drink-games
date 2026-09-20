import React from 'react';
import { Modal } from '@/components/common/Modal';
import { SUPER_MONOPOLY_TILES, formatMoneyM } from './superMonopolyData';
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
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="✈️ เลือกจุดหมายปลายทาง">
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-bold text-sky-200/90 text-center">
          แตะช่องที่ต้องการบินไป · บินผ่านจุดเริ่มต้นรับเงินเดือนตามปกติ
        </p>

        <div className="w-full aspect-square max-w-[min(78vh,520px)] mx-auto grid grid-cols-11 grid-rows-11 gap-[2px] p-1.5 rounded-2xl bg-[rgb(var(--c-bg-deep))] border-2 border-yellow-700/40">
          {SUPER_MONOPOLY_TILES.map((tile) => {
            const { col, row } = getGridPosition(tile.index);
            const owned = properties[tile.index];
            const owner = owned ? players.find((p) => p.id === owned.ownerId) : null;
            const isMine = Boolean(owned && myId && owned.ownerId === myId);
            const isHere = tile.index === fromIndex;
            const salary = passesStart(fromIndex, tile.index);
            const ownerColor = owner
              ? PLAYER_3D_COLORS[players.indexOf(owner) % PLAYER_3D_COLORS.length]
              : null;

            return (
              <button
                key={tile.index}
                type="button"
                disabled={isHere}
                onClick={() => onChoose(tile.index)}
                style={{ gridColumn: col, gridRow: row }}
                title={`${tile.name}${owner ? ` · ของ ${owner.display_name}` : ''}`}
                className={`relative flex flex-col items-center justify-center rounded-md border overflow-hidden transition active:scale-90 ${
                  isHere
                    ? 'bg-[rgb(var(--c-surface-2))] border-amber-500 opacity-60 cursor-default'
                    : isMine
                    ? 'bg-[rgb(var(--c-mint-soft))] border-emerald-500 hover:border-emerald-300'
                    : owner
                    ? 'bg-[rgb(var(--c-surface))] border-[rgb(var(--c-surface-3))] hover:border-amber-400'
                    : 'bg-[rgb(var(--c-butter-soft))] border-[rgb(var(--c-butter-deep))] hover:border-sky-400'
                }`}
              >
                {ownerColor && (
                  <span
                    className="absolute top-0 left-0 right-0 h-[3px]"
                    style={{ backgroundColor: ownerColor }}
                  />
                )}

                <span className="text-[9px] sm:text-xs leading-none">{tile.icon || '🏠'}</span>
                <span
                  className={`text-[5px] sm:text-[7px] font-black leading-tight text-center px-[1px] truncate w-full ${
                    isHere || isMine || owner ? 'text-amber-100' : 'text-[rgb(var(--c-ink))]'
                  }`}
                >
                  {isHere ? 'อยู่ตรงนี้' : tile.name}
                </span>

                {salary && !isHere && (
                  <span className="absolute bottom-0 right-0 text-[5px] sm:text-[7px]">🏁</span>
                )}
              </button>
            );
          })}

          {/* Middle of the board: the legend, where the play mat would be */}
          <div
            style={{ gridColumn: '2 / 11', gridRow: '2 / 11' }}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-2))] px-3 text-center"
          >
            <span className="text-2xl">✈️</span>
            <span className="text-[11px] font-black text-sky-200">เลือกช่องที่จะบินไป</span>
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[8px] font-bold text-amber-200/85">
              <span>🏁 = ผ่านจุดเริ่มต้น รับ {formatMoneyM(2)}</span>
              <span>· ขอบสี = เจ้าของที่ดิน</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
