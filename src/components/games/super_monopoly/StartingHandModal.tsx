import React from 'react';
import { Modal } from '@/components/common/Modal';
import { PlayerRecord } from '@/types/database';
import { SUPER_MONOPOLY_TILES, formatMoneyM, ROW_NAMES, rowOfTile } from './superMonopolyData';
import { PLAYER_3D_COLORS } from './SuperBoard3D';
import { Wallet, ArrowRight } from 'lucide-react';

export interface StartingHand {
  tiles: number[];
  spend: number;
  cashBefore: number;
  cashAfter: number;
}

export interface StartingDeal {
  at: number;
  hands: Record<string, StartingHand>;
}

interface StartingHandModalProps {
  isOpen: boolean;
  deal: StartingDeal | null;
  players: PlayerRecord[];
  myId: string | null;
  onClose: () => void;
}

export const StartingHandModal: React.FC<StartingHandModalProps> = ({
  isOpen,
  deal,
  players,
  myId,
  onClose,
}) => {
  if (!isOpen || !deal) return null;

  const mine = myId ? deal.hands[myId] : null;
  const others = players.filter((p) => p.id !== myId && deal.hands[p.id]);

  const colourOf = (p: PlayerRecord) =>
    PLAYER_3D_COLORS[players.indexOf(p) % PLAYER_3D_COLORS.length];

  return (
    <Modal isOpen={isOpen} title="🎴 ที่ดินตั้งต้นของคุณ" showCloseButton={false}>
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-bold text-[rgb(var(--c-sky-label))] text-center leading-relaxed">
          เริ่มเกมทุกคนได้ที่ดินสุ่มคนละ {mine?.tiles.length ?? 3} แปลง
          <br />
          และถูกหักเงินตามราคาที่ดินที่ได้ทันที
        </p>

        {mine && (
          <>
            <div className="flex flex-col gap-1.5">
              {mine.tiles.map((idx) => {
                const tile = SUPER_MONOPOLY_TILES[idx];
                if (!tile) return null;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-[rgb(var(--c-surface-2))] border border-[rgb(var(--c-line))]"
                  >
                    <span
                      className="w-1.5 h-8 rounded-full shrink-0"
                      style={{ backgroundColor: tile.color || 'rgb(var(--c-line-strong))' }}
                    />
                    <span className="text-lg leading-none shrink-0">{tile.icon || '🏠'}</span>
                    <span className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-black text-[rgb(var(--c-ink))] truncate">
                        {tile.name}
                      </span>
                      <span className="text-[10px] font-bold text-[rgb(var(--c-ink-faint))]">
                        {ROW_NAMES[rowOfTile(idx)]} · ช่องที่ {idx}
                      </span>
                    </span>
                    <span className="text-xs font-mono font-black text-[rgb(var(--c-berry-label))] shrink-0">
                      -{formatMoneyM(tile.cost || 0)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* What it cost, start to finish */}
            <div className="flex flex-col gap-1 px-3 py-2.5 rounded-2xl bg-[rgb(var(--c-surface))] border-2 border-[rgb(var(--c-line-strong))]">
              <div className="flex items-center justify-between text-[11px] font-bold text-[rgb(var(--c-ink-soft))]">
                <span>ทุนเริ่มต้น</span>
                <span className="font-mono font-black text-[rgb(var(--c-ink))]">
                  {formatMoneyM(mine.cashBefore)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-[rgb(var(--c-berry-label))]">
                <span>ค่าที่ดินรวม {mine.tiles.length} แปลง</span>
                <span className="font-mono font-black">- {formatMoneyM(mine.spend)}</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 mt-0.5 border-t border-[rgb(var(--c-line))]">
                <span className="flex items-center gap-1.5 text-xs font-black text-[rgb(var(--c-ink))]">
                  <Wallet className="w-4 h-4 text-[rgb(var(--c-mint))]" />
                  เงินสดคงเหลือ
                </span>
                <span className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-[rgb(var(--c-ink-faint))]" />
                  <span className="text-base font-mono font-black text-[rgb(var(--c-mint-label))]">
                    {formatMoneyM(mine.cashAfter)}
                  </span>
                </span>
              </div>
            </div>
          </>
        )}

        {/* Who else is holding what, so the first lap is not a blind walk */}
        {others.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-[rgb(var(--c-ink-faint))]">
              ที่ดินตั้งต้นของคนอื่น
            </span>
            {others.map((p) => {
              const hand = deal.hands[p.id];
              return (
                <div
                  key={p.id}
                  className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-[rgb(var(--c-surface-2))] border border-[rgb(var(--c-line))]"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/70 shrink-0 mt-[3px]"
                    style={{ backgroundColor: colourOf(p) }}
                  />
                  <span className="flex flex-col min-w-0 flex-1">
                    <span className="text-[10px] font-black text-[rgb(var(--c-ink))] truncate">
                      {p.display_name}
                    </span>
                    <span className="text-[9px] font-bold text-[rgb(var(--c-ink-soft))] leading-snug">
                      {hand.tiles
                        .map((i) => SUPER_MONOPOLY_TILES[i]?.name)
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                  <span className="text-[9px] font-mono font-black text-[rgb(var(--c-ink-faint))] shrink-0 mt-[3px]">
                    -{formatMoneyM(hand.spend)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="wood-btn-gold w-full py-3 rounded-2xl text-sm font-black shadow-lg active:scale-95"
        >
          เริ่มเล่น
        </button>
      </div>
    </Modal>
  );
};
