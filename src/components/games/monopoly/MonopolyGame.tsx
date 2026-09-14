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
import { Modal } from '@/components/common/Modal';
import { Wine, Sparkles, Settings, Eye, Box, Users, Crown, Bot } from 'lucide-react';
import { PlatformType } from '@/lib/platforms/types';

export const MonopolyGame: React.FC<BaseGameProps> = (props) => {
  const { room, players, currentPlayer, isHost, onUpdateGameState } = props;
  const [showRulesModal, setShowRulesModal] = React.useState(false);
  const [showPlayersModal, setShowPlayersModal] = React.useState(false);
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
      {/* Top Header: Compact Player Ribbon showing ONLY Avatars */}
      <div className="w-full bg-[#2a1104]/95 border-2 border-[#54240a] rounded-2xl px-3 py-2 mb-2 relative shadow-xl">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Mini Avatar roster (Only avatars, clickable to view details) */}
          <div
            onClick={() => setShowPlayersModal(true)}
            className="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-none cursor-pointer flex-1 min-w-0"
            title="แตะเพื่อดูรายชื่อผู้เล่นทั้งหมด"
          >
            {players.map((p, pIdx) => {
              const isPlayerTurn = p.id === room.current_turn_player_id;
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
                  className={`relative flex items-center justify-center p-0.5 rounded-full border transition-all flex-shrink-0 active:scale-95 ${
                    isPlayerTurn
                      ? 'bg-[#4a1c04] border-yellow-400 ring-2 ring-yellow-400 shadow-lg scale-110'
                      : 'bg-[#1e0a02] border-[#421703] opacity-80 hover:opacity-100'
                  }`}
                  title={`${p.display_name} (${p.drinks_count} ช็อต)${isPlayerTurn ? ' - กำลังเล่นตานี้' : ''}`}
                >
                  <Avatar
                    src={p.avatar_url}
                    name={p.display_name}
                    size="sm"
                    platform={getPlatform(p)}
                    isTurn={isPlayerTurn}
                  />
                  {/* Miniature player color badge in bottom-right corner */}
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2a1104] shadow"
                    style={{ backgroundColor: playerColor }}
                  />
                </div>
              );
            })}

            {/* Tap to inspect badge */}
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-300/80 bg-[#381604] border border-[#632808] px-2 py-1 rounded-xl shadow-inner shrink-0 hover:text-amber-200">
              <Users className="w-3 h-3" />
              <span>{players.length}</span>
            </span>
          </div>

          {/* Right: Rules Button & 3D/2D Toggle */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setIs3DMode(!is3DMode)}
              className="flex items-center gap-1.5 text-xs font-black text-yellow-300 bg-[#3b1805] hover:bg-[#522207] px-2.5 py-1.5 rounded-xl border border-yellow-500/50 shadow transition active:scale-95"
              title="สลับมุมมอง 3D / 2D"
            >
              <Box className="w-3.5 h-3.5" />
              <span>{is3DMode ? '3D' : '2D'}</span>
            </button>

            <button
              onClick={() => setShowRulesModal(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-200 bg-[#351505] hover:bg-[#481c05] px-2.5 py-1.5 rounded-xl border border-[#6b2e0a] shadow transition active:scale-95"
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

      {/* Player List Modal */}
      <Modal
        isOpen={showPlayersModal}
        onClose={() => setShowPlayersModal(false)}
        title={`สหายร่วมวง (${players.length} คน)`}
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {players.map((p, idx) => {
            const isPlayerTurn = p.id === room.current_turn_player_id;
            const isMe = p.id === currentPlayer?.id;
            const isPlayerHost = p.id === room.host_id;
            const isBot = p.id.startsWith('bot-');
            const costumeId = room.game_state?.costumes?.[p.id] ?? (idx % 20);
            const playerColor = [
              '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
              '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#e11d48',
              '#14b8a6', '#6366f1', '#d946ef', '#eab308', '#64748b',
              '#fb7185', '#0284c7', '#a855f7', '#4ade80', '#fbbf24',
            ][costumeId % 20];
            const playerPosition = positions[p.id] ?? 0;
            const currentTileName = tiles[playerPosition]?.title || 'จุดเริ่มต้น';

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isPlayerTurn
                    ? 'bg-[#3b1704] border-yellow-400 ring-2 ring-yellow-400/40 shadow-lg'
                    : 'bg-[#200c02] border-[#4a1c04]'
                }`}
              >
                {/* Left: Avatar & Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <Avatar
                      src={p.avatar_url}
                      name={p.display_name}
                      size="md"
                      platform={getPlatform(p)}
                      isTurn={isPlayerTurn}
                    />
                    <span
                      className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#200c02] shadow"
                      style={{ backgroundColor: playerColor }}
                      title="สีตัวละครบนกระดาน"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-black text-amber-100 truncate">
                        {p.display_name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] font-bold text-amber-300 bg-[#3b1704] border border-amber-600/50 px-1.5 py-0.2 rounded-md">
                          คุณ
                        </span>
                      )}
                      {isPlayerHost && (
                        <span title="เจ้าของห้อง" className="inline-flex">
                          <Crown className="w-3.5 h-3.5 text-yellow-400 inline shrink-0" />
                        </span>
                      )}
                      {isBot && (
                        <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-700/50 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                          <Bot className="w-2.5 h-2.5 inline" /> บอท
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-amber-300/70 mt-0.5">
                      <span>อยู่ที่: <strong className="text-yellow-400">{currentTileName}</strong></span>
                      {isPlayerTurn && (
                        <span className="text-yellow-300 font-bold animate-pulse">• กำลังเล่นตา</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Drinks counter badge */}
                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <div className="flex items-center gap-1 bg-[#330c04] border border-rose-800/80 px-2.5 py-1 rounded-xl shadow-inner">
                    <Wine className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-xs font-black text-rose-200">
                      {p.drinks_count} <span className="text-[10px] font-normal text-rose-300/70">ช็อต</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};
