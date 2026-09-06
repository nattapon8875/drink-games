import React from 'react';
import { MonopolyTileRecord, PlayerRecord } from '@/types/database';
import { Tile } from './Tile';

interface BoardProps {
  tiles: MonopolyTileRecord[];
  positions: Record<string, number>;
  players: PlayerRecord[];
  highlightTileIndex?: number;
  centerContent?: React.ReactNode;
  currentTurnPlayerId?: string | null;
}

export const Board: React.FC<BoardProps> = ({
  tiles,
  positions,
  players,
  highlightTileIndex,
  centerContent,
  currentTurnPlayerId,
}) => {
  const getPlayersOnTile = (tileIndex: number) => {
    return players.filter((p) => (positions[p.id] ?? 0) === tileIndex);
  };

  // 28-tile layout in an 8x8 perimeter grid:
  // Top row (cols 1..8): indices 0..7 (8 tiles)
  // Right col (rows 2..7, col 8): indices 8..13 (6 tiles)
  // Bottom row (cols 8..1, reversed): indices 21 down to 14 (8 tiles)
  // Left col (rows 7..2, col 1): indices 27 down to 22 (6 tiles)
  // Total = 8 + 6 + 8 + 6 = 28 tiles

  const topRowIndices = [0, 1, 2, 3, 4, 5, 6, 7];
  const rightColIndices = [8, 9, 10, 11, 12, 13];
  const bottomRowIndices = [21, 20, 19, 18, 17, 16, 15, 14];
  const leftColIndices = [27, 26, 25, 24, 23, 22];

  return (
    <div className="w-full flex items-center justify-center p-0.5 sm:p-2">
      {/* Wooden Board Frame: Responsive square board that fits portrait and landscape screens */}
      <div className="wood-panel rounded-2xl sm:rounded-3xl p-1 sm:p-2.5 relative shadow-[0_12px_28px_rgba(0,0,0,0.85)] w-full max-w-[min(96vw,82vh,700px)] aspect-square flex flex-col justify-center">
        {/* Board Brass Corner Rivets */}
        <div className="wood-rivet absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 z-30" />
        <div className="wood-rivet absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 z-30" />
        <div className="wood-rivet absolute bottom-1.5 left-1.5 sm:bottom-2.5 sm:left-2.5 z-30" />
        <div className="wood-rivet absolute bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5 z-30" />

        {/* 8-column x 8-row CSS Grid with equal square cells */}
        <div className="grid grid-cols-8 grid-rows-8 gap-0.5 sm:gap-1.5 w-full h-full relative">
          {/* Top Row (0-7) */}
          {topRowIndices.map((idx) => (
            <div key={`tile-${idx}`} className="col-span-1 row-span-1 w-full h-full">
              <Tile
                tile={tiles[idx]}
                index={idx}
                playersHere={getPlayersOnTile(idx)}
                isHighlighted={highlightTileIndex === idx}
                currentTurnPlayerId={currentTurnPlayerId}
              />
            </div>
          ))}

          {/* Middle 6 Rows */}
          {[0, 1, 2, 3, 4, 5].map((rowIdx) => {
            const leftTileIdx = leftColIndices[rowIdx];
            const rightTileIdx = rightColIndices[rowIdx];

            return (
              <React.Fragment key={`mid-row-${rowIdx}`}>
                {/* Left Tile */}
                <div className="col-span-1 row-span-1 w-full h-full">
                  <Tile
                    tile={tiles[leftTileIdx]}
                    index={leftTileIdx}
                    playersHere={getPlayersOnTile(leftTileIdx)}
                    isHighlighted={highlightTileIndex === leftTileIdx}
                    currentTurnPlayerId={currentTurnPlayerId}
                  />
                </div>

                {/* Center Stage: Recessed Teakwood Table Arena (spans 6 columns and 6 rows) */}
                {rowIdx === 0 && (
                  <div className="col-span-6 row-span-6 flex flex-col items-center justify-center p-1.5 sm:p-4 rounded-xl sm:rounded-2xl wood-recessed relative overflow-hidden w-full h-full">
                    {/* Subtle wood grain lighting glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-black/40 pointer-events-none" />
                    <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                      {centerContent}
                    </div>
                  </div>
                )}

                {/* Right Tile */}
                <div className="col-span-1 row-span-1 w-full h-full">
                  <Tile
                    tile={tiles[rightTileIdx]}
                    index={rightTileIdx}
                    playersHere={getPlayersOnTile(rightTileIdx)}
                    isHighlighted={highlightTileIndex === rightTileIdx}
                    currentTurnPlayerId={currentTurnPlayerId}
                  />
                </div>
              </React.Fragment>
            );
          })}

        {/* Bottom Row (21 down to 14) */}
        {bottomRowIndices.map((idx) => (
          <div key={`tile-${idx}`} className="col-span-1 row-span-1 w-full h-full">
            <Tile
              tile={tiles[idx]}
              index={idx}
              playersHere={getPlayersOnTile(idx)}
              isHighlighted={highlightTileIndex === idx}
              currentTurnPlayerId={currentTurnPlayerId}
            />
          </div>
        ))}
        </div>
      </div>
    </div>
  );
};
