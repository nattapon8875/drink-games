import React from 'react';
import { MonopolyTileRecord, PlayerRecord } from '@/types/database';
import { Wine, Award, HelpCircle, ShieldCheck } from 'lucide-react';
import { getTileIcon } from '@/lib/mockTiles';
import { clsx } from 'clsx';

interface TileProps {
  tile: MonopolyTileRecord;
  index: number;
  playersHere: PlayerRecord[];
  isHighlighted?: boolean;
  currentTurnPlayerId?: string | null;
}

export const Tile: React.FC<TileProps> = ({
  tile,
  index,
  playersHere,
  isHighlighted = false,
  currentTurnPlayerId,
}) => {
  // RPG themed icon color & badge styling for categories
  const typeConfig = {
    drink: {
      icon: <Wine className="w-3 h-3 text-red-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" />,
      // Reddish mahogany wood
      bg: 'from-[#8c2d19] via-[#631c0d] to-[#3a0d05]',
      borderTop: 'border-t-[#e2735b]',
      ribbon: 'bg-[#5c1307] text-rose-200 border-[#852313]',
    },
    order_others: {
      icon: <Award className="w-3 h-3 text-amber-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" />,
      // Golden teak wood
      bg: 'from-[#a15e19] via-[#78400b] to-[#472203]',
      borderTop: 'border-t-[#fcd34d]',
      ribbon: 'bg-[#6b3504] text-amber-200 border-[#944d08]',
    },
    challenge: {
      icon: <HelpCircle className="w-3 h-3 text-purple-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" />,
      // Dark enchanted mystic wood
      bg: 'from-[#672e7d] via-[#481c5a] to-[#2b0e37]',
      borderTop: 'border-t-[#d8b4fe]',
      ribbon: 'bg-[#3b114d] text-purple-200 border-[#5e2079]',
    },
    safe: {
      icon: <ShieldCheck className="w-3 h-3 text-emerald-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" />,
      // Forest moss wood
      bg: 'from-[#256e3b] via-[#164e28] to-[#0c2f17]',
      borderTop: 'border-t-[#86efac]',
      ribbon: 'bg-[#103a1d] text-emerald-200 border-[#1d6332]',
    },
  };

  const config = typeConfig[tile.tile_type] || typeConfig.safe;

  return (
    <div
      className={clsx(
        'relative flex flex-col items-center justify-between p-0.5 sm:p-1 w-full h-full rounded-lg sm:rounded-xl select-none transition-all duration-200 overflow-hidden',
        // 3D Wooden block construction with thick bottom bevel & inner light
        'bg-gradient-to-b border-x-2 border-b-[3px] sm:border-b-[4px] border-[#200b02] shadow-[0_3px_6px_rgba(0,0,0,0.65),inset_0_2px_1px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.5)]',
        config.bg,
        config.borderTop,
        isHighlighted
          ? 'ring-2 ring-yellow-400 -translate-y-0.5 shadow-[0_8px_16px_rgba(252,211,77,0.6),inset_0_2px_2px_rgba(255,255,255,0.8)] z-20 scale-105 brightness-110'
          : 'hover:brightness-105'
      )}
    >
      {/* Top Bar: Corner index badge + mini category icon */}
      <div className="w-full flex items-center justify-between z-10 px-0.5">
        <span className="text-[9px] sm:text-[10px] font-black px-1 rounded bg-[#250d03] text-amber-300 border border-[#54240a] shadow-inner">
          #{index}
        </span>
        <span className="text-xs sm:text-sm drop-shadow" title={tile.title}>
          {getTileIcon(tile)}
        </span>
      </div>

      {/* Main Title: Full slot, bold, centered, readable */}
      <div className="w-full text-center my-auto px-0.5 z-10">
        <span className="text-[10px] sm:text-xs font-black text-amber-100 leading-tight block drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.95)]">
          {tile.title}
        </span>
      </div>

      {/* Players Standing on this Tile */}
      {playersHere.length > 0 && (
        <div className="flex items-center justify-center gap-0.5 mt-0.5 -space-x-1.5 overflow-hidden z-10 w-full">
          {playersHere.map((p) => {
            const isTurn = p.id === currentTurnPlayerId;
            return (
              <div
                key={p.id}
                className={clsx(
                  'w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 overflow-hidden bg-[#2d1104] flex-shrink-0 transition-transform',
                  isTurn
                    ? 'border-yellow-400 ring-2 ring-yellow-300 ring-offset-1 ring-offset-black animate-bounce z-20 scale-125'
                    : 'border-amber-300 shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
                )}
                title={`${p.display_name}${isTurn ? ' (ตานี้!)' : ''}`}
              >
                {p.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatar_url} alt={p.display_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[7px] sm:text-[8px] flex items-center justify-center h-full text-amber-200 font-black">
                    {p.display_name[0]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
