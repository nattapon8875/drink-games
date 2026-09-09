'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { BaseGameProps } from '@/types/game';
import { useMonopolyEngine } from './useMonopolyEngine';
import { Board } from './Board';
import { DiceRoller } from './DiceRoller';
import { Board3D } from './Board3D';
import { ActionCard } from './ActionCard';
import { CustomTilesModal } from './CustomTilesModal';
import { Avatar } from '@/components/common/Avatar';
import { DrinkCounter } from '@/components/common/DrinkCounter';
import { Wine, Sparkles, Settings, Eye, Box } from 'lucide-react';
import { PlatformType } from '@/lib/platforms/types';

export const MonopolyGame: React.FC<BaseGameProps> = (props) => {
  const { room, players, currentPlayer, isHost, onUpdateGameState } = props;
  const [showRulesModal, setShowRulesModal] = React.useState(false);
  const [is3DMode, setIs3DMode] = React.useState(true);

  const {
    tiles,
    positions,
    isMyTurn,
    currentTurnPlayer,
    isRolling,
    isMoving,
    diceResult,
    currentTile,
    activeActionModal,
    rollDice,
    completeAction,
    canAct,
    isBotTurn,
  } = useMonopolyEngine(props);

  const getPlatform = (p: any): PlatformType => {
    if (p.line_user_id?.startsWith('U')) return 'line';
    if (p.line_user_id?.startsWith('dc-') || /^\d{17,20}$/.test(p.line_user_id || '')) return 'discord';
    return 'web';
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-2 pb-8 pt-2 select-none">
      {/* Top Header: Compact Player Ribbon with Mini Icons & Turn Indicator */}
      <div className="w-full bg-[#2a1104]/95 border-2 border-[#54240a] rounded-2xl px-3 py-2 mb-2 relative shadow-xl">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Players mini avatar roster */}
          <div className="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-none">
            {players.map((p, pIdx) => {
              const isPlayerTurn = p.id === room.current_turn_player_id;
              const isMe = p.id === currentPlayer?.id;
              const costumeId = room.game_state?.costumes?.[p.id] ?? (pIdx % 20);
              const playerColor = [
                '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
                '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#e11d48',
                '#14b8a6', '#6366f1', '#d946ef', '#eab308', '#64748b',
                '#fb7185', '#0284c7', '#a855f7', '#4ade80', '#fbbf24',
              ][costumeId % 20];

              return (
                <div
                  key={p.id}
                  className={`relative flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all flex-shrink-0 ${
                    isPlayerTurn
                      ? 'bg-[#4a1c04] border-yellow-400 ring-2 ring-yellow-400/50 shadow-md scale-105'
                      : 'bg-[#1e0a02] border-[#421703] opacity-90'
                  }`}
                  title={`${p.display_name} (${p.drinks_count} ช็อต)`}
                >
                  <div
                    className="w-3 h-3 rounded-full border border-white/60 shadow-sm flex-shrink-0"
                    style={{ backgroundColor: playerColor }}
                    title="สีตัวละครบนกระดาน"
                  />
                  <Avatar
                    src={p.avatar_url}
                    name={p.display_name}
                    size="sm"
                    platform={getPlatform(p)}
                    isTurn={isPlayerTurn}
                  />
                  <span className="text-xs font-black text-amber-100 truncate max-w-[70px]">
                    {p.display_name}
                  </span>
                  <span className="text-[10px] font-black text-rose-300 bg-[#3a0d05] border border-rose-700/60 px-1.5 py-0.5 rounded-full shadow-inner">
                    🍷{p.drinks_count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right: Rules Button & 3D/2D Toggle */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setIs3DMode(!is3DMode)}
              className="flex items-center gap-1.5 text-xs font-black text-yellow-300 bg-[#3b1805] hover:bg-[#522207] px-3 py-1.5 rounded-xl border border-yellow-500/50 shadow transition active:scale-95"
              title="สลับมุมมอง 3D / 2D"
            >
              <Box className="w-3.5 h-3.5" />
              <span>{is3DMode ? '3D' : '2D'}</span>
            </button>

            <button
              onClick={() => setShowRulesModal(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-200 bg-[#351505] hover:bg-[#481c05] px-3 py-1.5 rounded-xl border border-[#6b2e0a] shadow transition active:scale-95"
              title="ดู/แก้ไขคำสั่งกระดาน 28 ช่อง"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>{isHost ? 'แก้กฎ' : 'ดูกฎ'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Turn Announcement Ribbon Banner */}
      <div
        className={`w-full py-2.5 px-4 rounded-2xl mb-2 text-center text-sm sm:text-base font-black transition-all ${
          canAct
            ? 'wood-btn-gold border-b-4 border-[#2f1103] shadow-lg animate-pulse'
            : 'bg-[#240d02] border-2 border-[#451803] text-amber-200/90 shadow-inner'
        }`}
      >
        {isRolling ? (
          <span className="drop-shadow">🎲 กำลังทอยลูกเต๋า...</span>
        ) : isMoving ? (
          <span className="drop-shadow">🎲 ทอยได้แต้ม {diceResult}! กำลังเดินตัวละคร...</span>
        ) : isMyTurn ? (
          <span className="drop-shadow">🎲 ตาของคุณแล้ว! กดปุ่มทอยลูกเต๋าได้เลย!</span>
        ) : isBotTurn && isHost ? (
          <span className="drop-shadow">🤖 ตาของบอท ({currentTurnPlayer?.display_name})! คุณในฐานะโฮสต์กดทอยแทนได้เลย</span>
        ) : (
          <span>⏳ กำลังรอให้ <b>{currentTurnPlayer?.display_name}</b> ทอยลูกเต๋า...</span>
        )}
      </div>

      {/* Main Board Stage: Hybrid 3D Canvas / 2D Grid with 2D Floating Overlay */}
      <div className="relative w-full flex flex-col items-center">
        {is3DMode ? (
          <div className="w-full relative">
            {/* 3D Canvas Scene */}
            <Board3D
              tiles={tiles}
              positions={positions}
              players={players}
              highlightTileIndex={room.game_state?.lastTileIndex}
              isRolling={isRolling}
              diceResult={diceResult}
              costumes={room.game_state?.costumes}
              currentTurnPlayerId={room.current_turn_player_id}
            />

            {/* 2D HUD Control Overlay for Rolling Dice & Info */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-auto">
              {canAct && (
                <button
                  onClick={rollDice}
                  disabled={activeActionModal || isRolling || isMoving}
                  className="wood-btn-gold rounded-2xl font-black text-base sm:text-lg px-8 py-3.5 shadow-[0_10px_25px_rgba(0,0,0,0.8)] flex items-center gap-2 border-2 border-yellow-200 hover:scale-105 active:scale-95 transition"
                >
                  <span>
                    {isRolling
                      ? '🎲 กำลังทอย...'
                      : isMoving
                      ? `🎲 ได้แต้ม ${diceResult}!`
                      : isBotTurn
                      ? `🤖 ทอยแทน ${currentTurnPlayer?.display_name}!`
                      : '🎲 ทอยลูกเต๋า 3D!'}
                  </span>
                </button>
              )}

              {room.game_state?.lastTileIndex !== undefined && (
                <div className="text-xs font-bold text-amber-200 bg-[#250e03]/95 px-4 py-1.5 rounded-full border border-[#6b2e0a] shadow-xl backdrop-blur-sm">
                  ช่องล่าสุด: <span className="text-yellow-300 font-black">{tiles[room.game_state.lastTileIndex]?.title}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Fallback 2D Grid Board */
          <Board
            tiles={tiles}
            positions={positions}
            players={players}
            highlightTileIndex={room.game_state?.lastTileIndex}
            currentTurnPlayerId={room.current_turn_player_id}
            centerContent={
              <div className="flex flex-col items-center justify-center text-center p-2 w-full h-full">
                <div className="wood-plaque px-3 py-1 rounded-xl mb-1 flex items-center gap-1">
                  <div className="wood-rivet" />
                  <h4 className="text-[10px] sm:text-xs font-black rpg-text-gold tracking-widest uppercase">
                    🐃 BUFFY MONOPOLY 🎲
                  </h4>
                  <div className="wood-rivet" />
                </div>

                <div className="mb-2">
                  <span className="text-xs sm:text-sm font-bold text-amber-100 drop-shadow">
                    {isMyTurn
                      ? 'คุณกำลังจะทอย'
                      : isBotTurn && isHost
                      ? `คุณทอยแทน ${currentTurnPlayer?.display_name}`
                      : `${currentTurnPlayer?.display_name || 'เพื่อน'} กำลังทอย`}
                  </span>
                </div>

                <DiceRoller
                  isMyTurn={canAct}
                  isRolling={isRolling}
                  diceResult={diceResult}
                  onRoll={rollDice}
                  disabled={activeActionModal}
                />

                {room.game_state?.lastTileIndex !== undefined && (
                  <div className="mt-2 text-[10px] font-bold text-amber-200 bg-[#250e03] px-3 py-1 rounded-full border border-[#522005] shadow-inner">
                    ช่องล่าสุด: <span className="text-yellow-300 font-black">{tiles[room.game_state.lastTileIndex]?.title}</span>
                  </div>
                )}
              </div>
            }
          />
        )}
      </div>

      {/* Action Card Modal (pops up on landing) */}
      <ActionCard
        isOpen={activeActionModal}
        tile={currentTile}
        targetPlayer={currentTurnPlayer || players[0]}
        isMyTurn={canAct}
        diceResult={diceResult}
        onComplete={completeAction}
      />

      {/* Custom Tiles Modal */}
      <CustomTilesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        currentTiles={tiles}
        isHost={isHost}
        onSaveTiles={async (updatedTiles) => {
          await onUpdateGameState({ custom_tiles: updatedTiles });
        }}
      />
    </div>
  );
};
