import React from 'react';
import { SuperPropertyTile, PropertyOwnership, PlayerRecord } from '@/types/database';
import { SUPER_MONOPOLY_TILES, formatMoneyM } from './superMonopolyData';
import { Home, Building2 } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';

interface SuperBoardProps {
  positions: Record<string, number>;
  properties: Record<number, PropertyOwnership>;
  players: PlayerRecord[];
  currentTurnPlayerId: string | null;
  onTileClick: (tile: SuperPropertyTile) => void;
}

export const SuperBoard: React.FC<SuperBoardProps> = ({
  positions,
  properties,
  players,
  currentTurnPlayerId,
  onTileClick,
}) => {
  // Tile Coordinate Mapping: 32 Tiles (9 on each side)
  // Grid: 9 columns x 9 rows
  const getGridPosition = (index: number): { col: number; row: number } => {
    if (index >= 0 && index <= 8) {
      // Bottom side: col 9 -> 1, row 9
      return { col: 9 - index, row: 9 };
    } else if (index >= 9 && index <= 16) {
      // Left side: col 1, row 9 -> 1
      return { col: 1, row: 9 - (index - 8) };
    } else if (index >= 17 && index <= 24) {
      // Top side: col 1 -> 9, row 1
      return { col: 1 + (index - 16), row: 1 };
    } else {
      // Right side: col 9, row 1 -> 9
      return { col: 9, row: 1 + (index - 24) };
    }
  };

  const getPlayerColor = (pIdx: number): string => {
    const colors = [
      '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
      '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#e11d48',
    ];
    return colors[pIdx % colors.length];
  };

  return (
    <div className="relative w-full max-w-[620px] aspect-square bg-[#f5e6a2] border-4 border-[#3d1904] rounded-2xl shadow-2xl p-1 sm:p-2 select-none">
      {/* Grid Container (9x9) */}
      <div className="grid grid-cols-9 grid-rows-9 w-full h-full gap-0.5 sm:gap-1 relative bg-[#2a1306] p-0.5 sm:p-1 rounded-xl">
        {/* Render 32 Tiles */}
        {SUPER_MONOPOLY_TILES.map((tile) => {
          const { col, row } = getGridPosition(tile.index);
          const ownership = properties[tile.index];
          const ownerPlayer = ownership ? players.find((p) => p.id === ownership.ownerId) : null;
          const ownerIdx = ownerPlayer ? players.indexOf(ownerPlayer) : -1;
          const ownerColor = ownerIdx >= 0 ? getPlayerColor(ownerIdx) : '#f59e0b';
          const isCorner = tile.index === 0 || tile.index === 8 || tile.index === 16 || tile.index === 24;

          // Players on this tile
          const playersHere = players.filter((p) => (positions[p.id] ?? 0) === tile.index);

          return (
            <div
              key={tile.index}
              onClick={() => onTileClick(tile)}
              style={{
                gridColumn: col,
                gridRow: row,
              }}
              className={`relative flex flex-col justify-between p-0.5 sm:p-1 rounded-lg border transition-all cursor-pointer hover:border-yellow-300 hover:scale-[1.03] hover:z-20 ${
                isCorner
                  ? 'bg-[#ffe494] border-[#663b05] text-[#2e1302]'
                  : 'bg-[#fffdec] border-[#d4b465] text-[#1f0c02]'
              } shadow-sm overflow-hidden`}
              title={`${tile.name}${tile.cost ? ` (${formatMoneyM(tile.cost)})` : ''}`}
            >
              {/* Top Color Banner for Properties */}
              {tile.type === 'property' && tile.color && (
                <div
                  className="w-full h-2 sm:h-3.5 rounded-sm flex items-center justify-center -mt-0.5 -mx-0.5 mb-0.5"
                  style={{ backgroundColor: tile.color }}
                >
                  {ownership && ownership.houses > 0 && (
                    <div className="flex items-center gap-0.5">
                      {ownership.houses === 4 ? (
                        <Building2 className="w-2.5 h-2.5 text-white fill-rose-600" />
                      ) : (
                        Array.from({ length: ownership.houses }).map((_, hI) => (
                          <Home key={hI} className="w-2 h-2 text-white fill-cyan-400" />
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Title & Icon */}
              <div className="flex flex-col items-center justify-center flex-1 text-center min-w-0">
                <span className="text-xs sm:text-base leading-none drop-shadow">{tile.icon}</span>
                <span className="text-[8px] sm:text-[10px] font-black leading-tight tracking-tighter truncate w-full text-[#381604]">
                  {tile.name}
                </span>
                {tile.cost && (
                  <span className="text-[7px] sm:text-[9px] font-bold text-emerald-800">
                    {formatMoneyM(tile.cost)}
                  </span>
                )}
              </div>

              {/* Owner Indicator Pin */}
              {ownerPlayer && (
                <div
                  className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border border-white shadow flex items-center justify-center text-[6px] font-black text-white"
                  style={{ backgroundColor: ownerColor }}
                  title={`เจ้าของ: ${ownerPlayer.display_name}`}
                >
                  ✓
                </div>
              )}

              {/* Player Pawns / Avatars on this tile */}
              {playersHere.length > 0 && (
                <div className="absolute inset-0 bg-black/20 flex flex-wrap items-center justify-center gap-0.5 p-0.5 z-10 pointer-events-none">
                  {playersHere.map((p, pIdx) => {
                    const isTurn = p.id === currentTurnPlayerId;
                    const pColor = getPlayerColor(players.indexOf(p));
                    return (
                      <div
                        key={p.id}
                        className={`w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center overflow-hidden transition-transform ${
                          isTurn ? 'ring-2 ring-yellow-400 animate-bounce scale-110 z-20' : ''
                        }`}
                        style={{ backgroundColor: pColor }}
                        title={p.display_name}
                      >
                        <Avatar src={p.avatar_url} name={p.display_name} size="sm" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Center Nostalgic Board Area (7x7 Center) */}
        <div
          style={{
            gridColumn: '2 / 9',
            gridRow: '2 / 9',
          }}
          className="relative bg-[#fff2b2] rounded-xl border-2 border-[#b08b35] flex flex-col items-center justify-between p-3 sm:p-5 shadow-inner overflow-hidden"
        >
          {/* Top Logo / Title */}
          <div className="text-center">
            <h1 className="text-xl sm:text-3xl font-black text-[#d62828] tracking-widest drop-shadow-[0_2px_0_#fdf0d5] border-b-2 border-[#d62828] pb-1 uppercase">
              ซุปเปอร์เศรษฐี
            </h1>
            <p className="text-[10px] sm:text-xs font-black text-[#003049] tracking-wider mt-0.5">
              SUPER MONOPOLY CLASSIC • THAILAND
            </p>
          </div>

          {/* Center Decks: หีบสมบัติ & ประตูดวง */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 my-auto w-full">
            {/* Chest Deck (Pink) */}
            <div className="w-24 sm:w-32 aspect-[4/3] bg-gradient-to-br from-pink-400 via-rose-500 to-rose-700 rounded-xl border-2 border-pink-200 shadow-xl flex flex-col items-center justify-center text-white p-2 transform -rotate-3 hover:rotate-0 transition">
              <span className="text-2xl sm:text-3xl filter drop-shadow">🎁</span>
              <span className="text-[11px] sm:text-xs font-black tracking-wider drop-shadow mt-1">หีบสมบัติ</span>
              <span className="text-[8px] opacity-80 uppercase">CHEST</span>
            </div>

            {/* Chance Deck (Yellow/Gold) */}
            <div className="w-24 sm:w-32 aspect-[4/3] bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 rounded-xl border-2 border-amber-100 shadow-xl flex flex-col items-center justify-center text-amber-950 p-2 transform rotate-3 hover:rotate-0 transition">
              <span className="text-2xl sm:text-3xl filter drop-shadow">⛩️</span>
              <span className="text-[11px] sm:text-xs font-black tracking-wider drop-shadow mt-1">ประตูดวง</span>
              <span className="text-[8px] opacity-80 uppercase">CHANCE</span>
            </div>
          </div>

          {/* Bottom Classic Label */}
          <div className="text-center text-[9px] sm:text-[11px] font-black text-[#6b3e05] opacity-75">
            ★ สนุกสนาน เพลิดเพลิน ซื้อขายที่ดินทั่วสยาม ★
          </div>
        </div>
      </div>
    </div>
  );
};
