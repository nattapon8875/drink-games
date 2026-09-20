import React from 'react';
import { SuperPropertyTile, PropertyOwnership, PlayerRecord } from '@/types/database';
import { SUPER_MONOPOLY_TILES, formatMoneyM } from './superMonopolyData';
import { Home, Building2, Sparkles, Shield, Zap, Droplets } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';

interface SuperBoardProps {
  positions: Record<string, number>;
  properties: Record<number, PropertyOwnership>;
  players: PlayerRecord[];
  currentTurnPlayerId: string | null;
  activeStepTileIndex?: number | null;
  activeStepPlayerId?: string | null;
  bankrupt?: Record<string, boolean>;
  onTileClick: (tile: SuperPropertyTile) => void;
}

const SuperBoardBase: React.FC<SuperBoardProps> = ({
  positions,
  properties,
  players,
  currentTurnPlayerId,
  activeStepTileIndex,
  activeStepPlayerId,
  bankrupt,
  onTileClick,
}) => {
  // 40 Tiles Perimeter Mapping on 11x11 Grid
  // Grid: 11 columns x 11 rows (1-based index: 1 to 11)
  const getGridPosition = (index: number): { col: number; row: number } => {
    if (index >= 0 && index <= 10) {
      // Bottom row (Right to Left: 0 to 10): col 11 down to 1, row 11
      return { col: 11 - index, row: 11 };
    } else if (index >= 11 && index <= 20) {
      // Left row (Bottom to Top: 11 to 20): col 1, row 10 down to 1
      return { col: 1, row: 11 - (index - 10) };
    } else if (index >= 21 && index <= 30) {
      // Top row (Left to Right: 21 to 30): col 2 up to 11, row 1
      return { col: 1 + (index - 20), row: 1 };
    } else {
      // Right row (Top to Bottom: 31 to 39): col 11, row 2 up to 10
      return { col: 11, row: 1 + (index - 30) };
    }
  };

  const getPlayerColor = (pIdx: number): string => {
    const colors = [
      '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
      '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#e11d48',
    ];
    return colors[pIdx % colors.length];
  };

  // Compact display names that fit cleanly on 2D board tiles without ugly ellipsis truncation
  const getTileShortName = (name: string): string => {
    switch (name) {
      case 'โรงแรมเอเชีย กรุงเทพฯ': return 'รร.เอเชีย';
      case 'การประปานครหลวง': return 'การประปา';
      case 'โรงไฟฟ้านครหลวง': return 'โรงไฟฟ้า';
      case 'โรงแรมดุสิตธานี': return 'รร.ดุสิตธานี';
      case 'โรงแรมเซ็นทารา แกรนด์': return 'เซ็นทารา';
      case 'โรงแรมสยามเคมปินสกี้': return 'เคมปินสกี้';
      case 'โรงแรมแมนดาริน โอเรียนเต็ล': return 'โอเรียนเต็ล';
      case 'พระนครศรีอยุธยา': return 'อยุธยา';
      case 'ประจวบคีรีขันธ์': return 'ประจวบฯ';
      case 'สุราษฎร์ธานี': return 'สุราษฎร์ฯ';
      case 'นครราชสีมา': return 'โคราช';
      case 'สนามบิน': return 'สนามบิน';
      case 'เสียภาษีรายได้': return 'เสียภาษี';
      case 'จุดพักผ่อน': return 'จุดพักผ่อน';
      case 'ห้องขัง': return 'ห้องขัง';
      default: return name;
    }
  };

  return (
    // Same height as the 3D board so switching modes does not resize the page.
    // The grid has to stay square - eleven columns of eleven - so the width
    // follows the height, centred in whatever space the column has.
    <div className="relative mx-auto max-w-full w-full aspect-square sm:w-auto sm:h-[560px] lg:h-[640px] bg-gradient-to-b from-[rgb(var(--c-surface-2))] via-[rgb(var(--c-surface-2))] to-[rgb(var(--c-surface))] border-4 border-[rgb(var(--c-line))] rounded-3xl p-1.5 sm:p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] select-none">
      {/* 11x11 Grid Container */}
      <div className="grid grid-cols-11 grid-rows-11 w-full h-full gap-[1.5px] sm:gap-[2.5px] relative bg-[rgb(var(--c-bg-deep))] p-1 rounded-2xl border border-yellow-700/40">
        
        {/* Render All 40 Tiles on Perimeter */}
        {SUPER_MONOPOLY_TILES.map((tile) => {
          const { col, row } = getGridPosition(tile.index);
          const ownership = properties[tile.index];
          const ownerPlayer = ownership ? players.find((p) => p.id === ownership.ownerId) : null;
          const ownerIdx = ownerPlayer ? players.indexOf(ownerPlayer) : -1;
          const ownerColor = ownerIdx >= 0 ? getPlayerColor(ownerIdx) : '#f59e0b';
          const isCorner = tile.index === 0 || tile.index === 10 || tile.index === 20 || tile.index === 30;
          const isStepActive = activeStepTileIndex === tile.index;

          // Players currently standing on this tile
          const playersHere = players.filter((p) => {
            if (bankrupt?.[p.id]) return false;
            // The walking square belongs to whoever is walking, not to
            // whoever's turn it is - those differ for a moment when a turn
            // changes mid-walk.
            const isWalker = activeStepPlayerId
              ? p.id === activeStepPlayerId
              : p.id === currentTurnPlayerId;
            const pPos =
              isWalker && activeStepTileIndex !== null && activeStepTileIndex !== undefined
                ? activeStepTileIndex
                : positions[p.id] ?? 0;
            return pPos === tile.index;
          });

          // Special Custom Corner Designs
          if (isCorner) {
            return (
              <div
                key={tile.index}
                onClick={() => onTileClick(tile)}
                style={{ gridColumn: col, gridRow: row }}
                className={`relative flex flex-col justify-between p-1 rounded-xl transition-all cursor-pointer overflow-hidden border-2 ${
                  isStepActive
                    ? 'ring-4 ring-yellow-400 bg-yellow-200 z-30 scale-105 shadow-[0_0_20px_rgba(250,204,21,1)]'
                    : tile.index === 0
                    ? 'bg-gradient-to-br from-[#e8f5e9] via-[#c8e6c9] to-[#a5d6a7] border-emerald-600 text-emerald-950 shadow-md'
                    : tile.index === 10
                    ? 'bg-gradient-to-br from-[rgb(var(--c-butter-soft))] via-[rgb(var(--c-butter-soft))] to-[rgb(var(--c-butter))] border-amber-600 text-amber-950 shadow-md'
                    : tile.index === 20
                    ? 'bg-gradient-to-br from-[#e0f2fe] via-[#bae6fd] to-[#7dd3fc] border-sky-600 text-sky-950 shadow-md'
                    : 'bg-gradient-to-br from-[rgb(var(--c-butter-soft))] via-[rgb(var(--c-butter))] to-[rgb(var(--c-butter))] border-rose-600 text-rose-950 shadow-md'
                } hover:scale-[1.04] hover:z-20`}
                title={`${tile.name}: ${tile.description || ''}`}
              >
                {/* Tile 0: จุดเริ่มต้น (START / GO) */}
                {tile.index === 0 && (
                  <div className="flex flex-col items-center justify-between h-full text-center py-0.5">
                    <span className="text-[7px] sm:text-[9px] font-black uppercase text-emerald-800 tracking-wider">
                      รับเงินเดือน
                    </span>
                    <div className="flex items-center justify-center gap-0.5">
                      <span className="text-sm sm:text-xl">🏁</span>
                      <span className="text-xs sm:text-base font-black text-rose-600 animate-pulse">➔</span>
                    </div>
                    <span className="text-[8px] sm:text-[10.5px] font-black text-emerald-950 leading-tight">
                      จุดเริ่มต้น
                    </span>
                    <span className="text-[7px] sm:text-[9px] font-mono font-black text-white bg-emerald-700 px-1 py-0.2 rounded-full shadow-sm">
                      +2.0M
                    </span>
                  </div>
                )}

                {/* Tile 10: ช่องเข้าคุก (JAIL & VISITING) */}
                {tile.index === 10 && (
                  <div className="flex flex-col items-center justify-between h-full text-center py-0.5">
                    <span className="text-[7px] sm:text-[8.5px] font-bold text-amber-900">
                      แวะเยี่ยม
                    </span>
                    <div className="w-full bg-[rgb(var(--c-surface-2))] rounded-lg p-0.5 sm:p-1 border border-amber-800 text-center shadow-inner">
                      <span className="text-xs sm:text-base block">⛓️</span>
                      <span className="text-[7px] sm:text-[9px] font-black text-amber-200">
                        ห้องขัง
                      </span>
                    </div>
                    <span className="text-[6.5px] sm:text-[8px] font-bold text-red-700">
                      หยุด 1 ตา / 0.5M
                    </span>
                  </div>
                )}

                {/* Tile 20: จุดพักผ่อน (FREE REST) */}
                {tile.index === 20 && (
                  <div className="flex flex-col items-center justify-between h-full text-center py-0.5">
                    <span className="text-[7px] sm:text-[9px] font-bold text-sky-800">
                      พักผ่อน
                    </span>
                    <span className="text-base sm:text-2xl drop-shadow">🏖️</span>
                    <span className="text-[8px] sm:text-[10px] font-black text-sky-950 leading-tight">
                      จุดพัก
                    </span>
                    <span className="text-[6.5px] sm:text-[8px] font-black text-white bg-sky-600 px-1 py-0.2 rounded-full shadow-sm">
                      หยุดพัก 1 ตา
                    </span>
                  </div>
                )}

                {/* Tile 30: สนามบิน (AIRPORT) */}
                {tile.index === 30 && (
                  <div className="flex flex-col items-center justify-between h-full text-center py-0.5">
                    <span className="text-[7px] sm:text-[8.5px] font-black text-sky-700 uppercase">
                      ออกเดินทาง
                    </span>
                    <span className="text-sm sm:text-2xl drop-shadow">✈️</span>
                    <span className="text-[8px] sm:text-[10px] font-black text-sky-950 leading-tight">
                      สนามบิน
                    </span>
                    <span className="text-[6.5px] sm:text-[8px] font-mono font-black text-white bg-sky-600 px-1 py-0.2 rounded-full shadow-sm">
                      บินได้ทุกช่อง
                    </span>
                  </div>
                )}

                {/* Players Floating on Corner */}
                {playersHere.length > 0 && (
                  <div className="absolute bottom-0.5 left-0 right-0 flex items-center justify-center -space-x-1 z-20 pointer-events-none">
                    {playersHere.map((p) => {
                      const isTurn = p.id === currentTurnPlayerId;
                      const pColor = getPlayerColor(players.indexOf(p));
                      return (
                        <div
                          key={p.id}
                          className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white shadow-lg overflow-hidden ${
                            isTurn ? 'ring-2 ring-yellow-400 animate-bounce scale-110 z-30' : ''
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
          }

          // Regular Perimeter Tile
          return (
            <div
              key={tile.index}
              onClick={() => onTileClick(tile)}
              style={{ gridColumn: col, gridRow: row }}
              className={`relative flex flex-col justify-between rounded-lg transition-all cursor-pointer overflow-hidden border ${
                isStepActive
                  ? 'ring-4 ring-yellow-400 bg-yellow-100 z-30 scale-105 shadow-[0_0_20px_rgba(250,204,21,1)]'
                  : 'bg-[#fffef7] hover:bg-[rgb(var(--c-butter-soft))] border-[rgb(var(--c-butter))] shadow-sm'
              } hover:scale-[1.04] hover:z-20`}
              title={`${tile.name}${tile.cost ? ` (${formatMoneyM(tile.cost)})` : ''}`}
            >
              {/* Top Color Banner (Authentic Monopoly Property Bar) */}
              {tile.type === 'property' && (
                <div
                  className="w-full h-2.5 sm:h-3.5 flex items-center justify-center px-0.5 relative shadow-sm"
                  style={{ backgroundColor: tile.color || '#0284c7' }}
                >
                  {/* Houses / Hotel Indicators */}
                  {ownership && ownership.houses > 0 && (
                    <div className="flex items-center gap-0.5">
                      {/* Buildings are drawn in the owner's colour, not as generic emoji,
                          so you can tell whose street you are walking into. */}
                      {ownership.houses === 4 ? (
                        <span
                          className="px-1 rounded-[2px] border border-white/70 text-[6px] sm:text-[8px] font-black text-white leading-tight shadow"
                          style={{ backgroundColor: ownerColor }}
                          title="โรงแรมหรู"
                        >
                          ★
                        </span>
                      ) : (
                        <div className="flex items-center gap-[1px]">
                          {Array.from({ length: ownership.houses }).map((_, hI) => (
                            <span
                              key={hI}
                              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-[1px] border border-white/70 shadow"
                              style={{ backgroundColor: ownerColor }}
                              title={`บ้าน ${ownership.houses} หลัง`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Special Strip for Chest / Chance / Tax / Utility */}
              {tile.type !== 'property' && (
                <div
                  className={`w-full h-1.5 sm:h-2 ${
                    tile.type === 'chest'
                      ? 'bg-rose-500'
                      : tile.type === 'chance'
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                />
              )}

              {/* Tile Content (Icon + Short Name + Price) */}
              <div className="flex-1 flex flex-col items-center justify-center px-0.5 py-0.5 text-center leading-none">
                <span className="text-[11px] sm:text-base drop-shadow-sm mb-0.5">
                  {tile.icon}
                </span>

                <span className="text-[7.5px] sm:text-[9.5px] font-black text-[rgb(var(--c-surface))] tracking-tight truncate w-full">
                  {getTileShortName(tile.name)}
                </span>

                {tile.cost ? (
                  <span className="text-[6.5px] sm:text-[8px] font-mono font-black text-emerald-800 bg-emerald-100/90 px-1 py-0.2 rounded mt-0.5 shadow-inner">
                    {formatMoneyM(tile.cost)}
                  </span>
                ) : tile.type === 'tax' ? (
                  <span className="text-[6px] sm:text-[7.5px] font-bold text-rose-700 mt-0.5">
                    จ่าย 1.0M
                  </span>
                ) : (
                  <span className="text-[6px] sm:text-[7.5px] font-bold text-amber-700 mt-0.5 opacity-80">
                    พิเศษ
                  </span>
                )}
              </div>

              {/* Bought but not built on yet: plant the owner's flag so the
                  board itself shows who holds what */}
              {ownerPlayer && (!ownership || ownership.houses === 0) && (
                <div
                  className="absolute top-0.5 right-0.5 z-20 pointer-events-none flex items-start"
                  title={`เจ้าของ: ${ownerPlayer.display_name}`}
                >
                  <span className="w-[1.5px] h-2.5 sm:h-3 bg-[rgb(var(--c-butter-soft))] shadow" />
                  <span
                    className="w-2 h-1.5 sm:w-2.5 sm:h-2 border border-white/60 shadow"
                    style={{ backgroundColor: ownerColor }}
                  />
                </div>
              )}

              {/* Bottom Owner Ribbon if owned */}
              {ownerPlayer && (
                <div
                  className="w-full h-1 sm:h-1.5 shadow"
                  style={{ backgroundColor: ownerColor }}
                  title={`เจ้าของ: ${ownerPlayer.display_name}`}
                />
              )}

              {/* Player Pawns Floating on Tile */}
              {playersHere.length > 0 && (
                <div className="absolute inset-x-0 bottom-1 flex items-center justify-center -space-x-1 z-20 pointer-events-none">
                  {playersHere.map((p) => {
                    const isTurn = p.id === currentTurnPlayerId;
                    const pColor = getPlayerColor(players.indexOf(p));
                    return (
                      <div
                        key={p.id}
                        className={`w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full border-2 border-white shadow-lg overflow-hidden ${
                          isTurn ? 'ring-2 ring-yellow-400 animate-bounce scale-110 z-30' : ''
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

        {/* Center Nostalgic Luxury Board Area (9x9 Center: spanning 2 to 11 exactly without black gaps!) */}
        <div
          style={{
            gridColumn: '2 / 11',
            gridRow: '2 / 11',
          }}
          className="relative bg-gradient-to-br from-[rgb(var(--c-butter-soft))] via-[rgb(var(--c-butter-soft))] to-[rgb(var(--c-butter-soft))] rounded-2xl border-2 border-[rgb(var(--c-butter-deep))] flex flex-col items-center justify-between p-3 sm:p-5 shadow-inner overflow-hidden m-[1px]"
        >
          {/* Subtle Decorative Golden Border Lines inside */}
          <div className="absolute inset-1.5 border border-[rgb(var(--c-butter-deep))]/40 rounded-xl pointer-events-none" />
          <div className="absolute inset-3 border border-dashed border-[rgb(var(--c-butter-deep))]/30 rounded-lg pointer-events-none" />

          {/* Top Logo & Title */}
          <div className="text-center z-10 pt-1 sm:pt-2">
            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-200/50 border border-amber-400/40 text-[9px] sm:text-[11px] font-black text-amber-900 mb-1">
              <span>★</span>
              <span>เกมเศรษฐีคลาสสิกของไทย</span>
              <span>★</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-[rgb(var(--c-line))] tracking-widest drop-shadow-[0_2px_4px_rgba(185,28,28,0.25)] font-serif uppercase">
              ซุปเปอร์เศรษฐี
            </h1>
            <p className="text-[9px] sm:text-xs font-black text-[rgb(var(--c-line-strong))] tracking-widest mt-0.5">
              SUPER MONOPOLY CLASSIC • THAILAND
            </p>
          </div>

          {/* Clean Nostalgic Center Area - Decks removed as requested */}
          <div className="flex-1" />

          {/* Bottom Slogan & Quick Rule Badges */}
          <div className="flex flex-col items-center gap-1 z-10 pb-0.5 text-center">
            <span className="text-[9px] sm:text-[11.5px] font-black text-[rgb(var(--c-line))] opacity-85">
              ★ สนุกสนาน เพลิดเพลิน ซื้อขายที่ดินทั่วสยาม ★
            </span>
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-[7px] sm:text-[9px] font-bold text-amber-950/80 bg-amber-100/70 border border-amber-300/60 px-2.5 py-0.5 rounded-full shadow-sm">
              <span>🏁 ผ่านจุดเริ่มต้น รับ +2M</span>
              <span>•</span>
              <span>🏖️ จุดพัก หยุดพัก 1 ตา</span>
              <span>•</span>
              <span>⛓️ ติดคุก จ่าย 0.5M หรือหยุด 1 ตา</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Same reason as the 3D board: the walk animation and the poll both rewrite
// game_state several times a second, and re-rendering all 40 tiles each time
// made the labels shimmer.
export const SuperBoard = React.memo(SuperBoardBase);
