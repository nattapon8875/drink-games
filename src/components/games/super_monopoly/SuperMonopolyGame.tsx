'use client';

import React, { useState } from 'react';
import { BaseGameProps } from '@/types/game';
import { useSuperMonopolyEngine } from './useSuperMonopolyEngine';
import { SuperBoard } from './SuperBoard';
import { PropertyCardModal } from './PropertyCardModal';
import { ChanceChestModal } from './ChanceChestModal';
import { SUPER_MONOPOLY_TILES, formatMoneyM } from './superMonopolyData';
import { Avatar } from '@/components/common/Avatar';
import { SuperPropertyTile } from '@/types/database';
import {
  Dices,
  Crown,
  Building2,
  Home,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Award,
  Scroll,
} from 'lucide-react';

export const SuperMonopolyGame: React.FC<BaseGameProps> = (props) => {
  const { room, players, currentPlayer, isHost } = props;

  const {
    diceResult,
    isRolling,
    isMoving,
    isMyTurn,
    currentTurnPlayer,
    positions,
    properties,
    cash,
    activePropertyModal,
    setActivePropertyModal,
    activeCard,
    setActiveCard,
    gameLogs,
    rollDice,
    handleBuyLand,
    handleBuildHouse,
    handleEndTurn,
  } = useSuperMonopolyEngine(props);

  const [inspectTile, setInspectTile] = useState<SuperPropertyTile | null>(null);

  const myCash = currentPlayer ? cash[currentPlayer.id] ?? 15.0 : 15.0;

  // Calculate net worth or property count per player
  const getPlayerPropertiesCount = (playerId: string) => {
    return Object.values(properties).filter((p) => p.ownerId === playerId).length;
  };

  return (
    <div className="w-full h-full min-h-[90vh] flex flex-col justify-between p-2 sm:p-4 select-none max-w-7xl mx-auto">
      {/* Top Status Header */}
      <div className="w-full flex items-center justify-between bg-[#2a1104]/90 border-2 border-[#54240a] rounded-2xl px-4 py-2 mb-2 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐃</span>
          <div>
            <h2 className="text-sm sm:text-base font-black rpg-text-gold tracking-wide">
              ซุปเปอร์เศรษฐี คลาสสิก • SUPER MONOPOLY
            </h2>
            <p className="text-[10px] text-amber-300/80 font-bold">
              ห้อง: <span className="font-mono text-yellow-400">{room.code}</span> | ทุนเริ่มต้น 15M
            </p>
          </div>
        </div>

        {/* Current Turn Announcement */}
        <div className="flex items-center gap-2 bg-[#1f0b02] border border-[#522005] px-3 py-1 rounded-xl">
          <Avatar
            src={currentTurnPlayer?.avatar_url}
            name={currentTurnPlayer?.display_name || 'Player'}
            size="sm"
            isTurn={true}
          />
          <div className="text-right">
            <span className="text-[10px] text-amber-400/80 block leading-tight font-bold">
              {isMyTurn ? 'ตาของคุณ!' : 'ตากำลังเล่น:'}
            </span>
            <span className="text-xs font-black text-amber-100 truncate max-w-[100px] block">
              {currentTurnPlayer?.display_name}
            </span>
          </div>
        </div>
      </div>

      {/* Main 3-Column Landscape Grid (Discord Widescreen Layout) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 items-start my-auto">
        {/* Left Column: Player Leaderboard & Net Worth (3 cols on large screen) */}
        <div className="lg:col-span-3 flex flex-col gap-2 order-2 lg:order-1">
          <div className="bg-[#240e03] border-2 border-[#54240a] rounded-2xl p-3 shadow-xl">
            <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-[#451803] pb-1.5">
              <Award className="w-4 h-4 text-yellow-400" />
              <span>มหาเศรษฐีในวง ({players.length} คน)</span>
            </h3>

            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto scrollbar-none pr-0.5">
              {players.map((p, idx) => {
                const playerCash = cash[p.id] ?? 15.0;
                const propCount = getPlayerPropertiesCount(p.id);
                const isCurrent = p.id === currentTurnPlayer?.id;
                const isMe = p.id === currentPlayer?.id;
                const isBankrupt = playerCash <= 0;

                return (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'bg-[#3d1805] border-yellow-400 ring-2 ring-yellow-400/40 shadow-lg'
                        : 'bg-[#1a0801] border-[#3d1503]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative">
                        <Avatar
                          src={p.avatar_url}
                          name={p.display_name}
                          size="md"
                          isTurn={isCurrent}
                        />
                        {isMe && (
                          <span className="absolute -bottom-1 -right-1 text-[8px] font-black bg-amber-500 text-amber-950 px-1 rounded-full border border-white">
                            คุณ
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-black text-amber-100 truncate max-w-[90px]">
                            {p.display_name}
                          </span>
                          {p.id === room.host_id && (
                            <Crown className="w-3 h-3 text-yellow-400 shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-amber-300/70 block">
                          โฉนด: <strong className="text-amber-200">{propCount}</strong> แห่ง
                        </span>
                      </div>
                    </div>

                    {/* Cash balance in M */}
                    <div className="text-right shrink-0">
                      {isBankrupt ? (
                        <span className="text-[10px] font-black text-red-400 bg-red-950 px-1.5 py-0.5 rounded border border-red-800">
                          ล้มละลาย
                        </span>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-black text-emerald-400 font-mono">
                            {formatMoneyM(playerCash)}
                          </span>
                          <span className="text-[9px] text-amber-400/60 font-bold">เงินสด</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center Column: Square Super Monopoly Classic Board (6 cols on large screen) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center order-1 lg:order-2">
          <SuperBoard
            positions={positions}
            properties={properties}
            players={players}
            currentTurnPlayerId={currentTurnPlayer?.id || null}
            onTileClick={(tile) => setInspectTile(tile)}
          />
        </div>

        {/* Right Column: Dice Roll Controls & Live Game Logs (3 cols on large screen) */}
        <div className="lg:col-span-3 flex flex-col gap-2 order-3">
          {/* Action & Dice Control Box */}
          <div className="bg-[#240e03] border-2 border-[#54240a] rounded-2xl p-3.5 shadow-xl text-center">
            <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5 border-b border-[#451803] pb-1.5">
              <Dices className="w-4 h-4 text-yellow-400" />
              <span>ทอยลูกเต๋าเดินกระดาน</span>
            </h3>

            {/* Big Dice Result Display */}
            <div className="flex items-center justify-center my-3">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-b from-[#fffef0] via-[#f7efd2] to-[#e6d8b3] border-2 border-b-4 border-[#8c6735] shadow-lg flex flex-col items-center justify-center text-amber-950 transition-transform ${
                  isRolling ? 'animate-spin' : ''
                }`}
              >
                <span className="text-3xl font-black font-mono">{diceResult}</span>
                <span className="text-[9px] font-black text-[#613b14]">แต้มเต๋า</span>
              </div>
            </div>

            {/* Turn Buttons */}
            {isMyTurn ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={isRolling || isMoving}
                  onClick={rollDice}
                  className="wood-btn-gold w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
                >
                  <Dices className="w-5 h-5" />
                  <span>{isRolling ? 'กำลังทอยลูกเต๋า...' : isMoving ? 'กำลังเดิน...' : 'กดทอยลูกเต๋า!'}</span>
                </button>

                <button
                  type="button"
                  disabled={isRolling || isMoving}
                  onClick={handleEndTurn}
                  className="wood-btn-brown w-full py-2 rounded-xl font-bold text-xs text-amber-200 border border-[#54240a] flex items-center justify-center gap-1 active:scale-95 transition"
                >
                  <span>จบรอบตาเดิน</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="py-3 px-2 rounded-xl bg-[#1c0801] border border-[#3d1503] text-xs text-amber-300/70 font-bold animate-pulse">
                ⏳ รอ {currentTurnPlayer?.display_name} ทอยลูกเต๋า...
              </div>
            )}
          </div>

          {/* Live History Feed Box */}
          <div className="bg-[#240e03] border-2 border-[#54240a] rounded-2xl p-3 shadow-xl flex-1 flex flex-col">
            <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-[#451803] pb-1.5">
              <Scroll className="w-3.5 h-3.5 text-yellow-400" />
              <span>ประวัติการเดิน (Live Feed)</span>
            </h3>

            <div className="flex flex-col gap-1.5 max-h-[30vh] overflow-y-auto pr-1 text-[11px] font-bold">
              {gameLogs.length === 0 ? (
                <span className="text-amber-400/50 text-center py-4">ยังไม่มีประวัติการเดิน</span>
              ) : (
                gameLogs.map((log, lI) => (
                  <div
                    key={lI}
                    className="p-1.5 rounded-lg bg-[#1a0801] border border-[#3d1503] text-left leading-relaxed flex items-start justify-between gap-1"
                  >
                    <span style={{ color: log.color || '#fef3c7' }}>{log.text}</span>
                    <span className="text-[9px] text-amber-400/50 shrink-0 font-mono">{log.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Property Buy/Upgrade Modal */}
      <PropertyCardModal
        isOpen={Boolean(activePropertyModal || inspectTile)}
        tile={activePropertyModal || inspectTile}
        ownership={
          (activePropertyModal || inspectTile)
            ? properties[(activePropertyModal || inspectTile)!.index] || null
            : null
        }
        currentCash={myCash}
        isMyTurn={Boolean(isMyTurn && activePropertyModal)}
        onClose={() => {
          setActivePropertyModal(null);
          setInspectTile(null);
        }}
        onBuyLand={handleBuyLand}
        onBuildHouse={handleBuildHouse}
      />

      {/* Chance / Chest Modal */}
      <ChanceChestModal
        isOpen={Boolean(activeCard)}
        card={activeCard}
        isMyTurn={isMyTurn}
        onClose={() => setActiveCard(null)}
      />
    </div>
  );
};
