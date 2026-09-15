'use client';

import React, { useState } from 'react';
import { BaseGameProps } from '@/types/game';
import { useSuperMonopolyEngine } from './useSuperMonopolyEngine';
import { SuperBoard } from './SuperBoard';
import { SuperBoard3D } from './SuperBoard3D';
import { PropertyCardModal } from './PropertyCardModal';
import { ChanceChestModal } from './ChanceChestModal';
import { RulesModal } from './RulesModal';
import { Modal } from '@/components/common/Modal';
import { SUPER_MONOPOLY_TILES, formatMoneyM } from './superMonopolyData';
import { Avatar } from '@/components/common/Avatar';
import { SuperPropertyTile } from '@/types/database';
import {
  Dices,
  BookOpen,
  Crown,
  Building2,
  Home,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Award,
  Scroll,
  Bot,
  Zap,
} from 'lucide-react';

export const SuperMonopolyGame: React.FC<BaseGameProps> = (props) => {
  const { room, players, currentPlayer, isHost } = props;

  const {
    dice,
    diceTotal,
    isDouble,
    hasRolledThisTurn,
    isRolling,
    isMoving,
    activeStepTileIndex,
    isMyTurn,
    isBotTurn,
    currentTurnPlayer,
    positions,
    properties,
    cash,
    activePropertyModal,
    setActivePropertyModal,
    activeCard,
    setActiveCard,
    gameLogs,
    isCurrentPlayerInJail,
    isCurrentPlayerResting,
    inJailTurns,
    restTurns,
    rollDice,
    handleServeJailTurn,
    handlePayJailBail,
    handleDrinkForJail,
    handleServeRestTurn,
    handleBuyLand,
    handleBuildHouse,
    handleEndTurn,
    handleCloseActiveModal,
  } = useSuperMonopolyEngine(props);

  const [inspectTile, setInspectTile] = useState<SuperPropertyTile | null>(null);
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  const myCash = currentPlayer ? cash[currentPlayer.id] ?? 15.0 : 15.0;

  const getPlayerPropertiesCount = (playerId: string) => {
    return Object.values(properties).filter((p) => p.ownerId === playerId).length;
  };

  // Render authentic 3D dice faces (Red dot for 1, black dots for 2-6)
  const renderDiceFace = (val: number, isRollingAnim: boolean) => {
    const dots: Record<number, string[]> = {
      1: ['col-start-2 row-start-2'],
      2: ['col-start-1 row-start-1', 'col-start-3 row-start-3'],
      3: ['col-start-1 row-start-1', 'col-start-2 row-start-2', 'col-start-3 row-start-3'],
      4: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
      5: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-2 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
      6: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-2', 'col-start-3 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
    };
    const dotClasses = dots[val] || dots[1];

    return (
      <div
        className={`w-14 h-14 rounded-2xl bg-gradient-to-b from-[#ffffff] via-[#f7f5e8] to-[#e8dec0] border-2 border-b-4 border-[#826131] shadow-xl flex items-center justify-center transition-all ${
          isRollingAnim ? 'animate-spin' : 'hover:scale-105'
        }`}
      >
        <div className="grid grid-cols-3 grid-rows-3 w-10 h-10 p-1 gap-0.5 pointer-events-none">
          {dotClasses.map((cls, idx) => (
            <span
              key={idx}
              className={`w-2.5 h-2.5 rounded-full ${
                val === 1 ? 'bg-red-600 ring-1 ring-red-400' : 'bg-[#1c0802]'
              } shadow-inner justify-self-center self-center ${cls}`}
            />
          ))}
        </div>
      </div>
    );
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
              ห้อง: <span className="font-mono text-yellow-400">{room.code}</span> | ทุนเริ่มต้น 15M | ลูกเต๋า 2 ลูก 🎲🎲
            </p>
          </div>
        </div>

        {/* Right Header: Rules & Current Turn Announcement */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-500 border border-yellow-500/50 text-xs font-black text-amber-100 shadow flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="ดูกฎและกติกาการเล่นซุปเปอร์เศรษฐี"
          >
            <BookOpen className="w-4 h-4 text-yellow-300" />
            <span className="hidden sm:inline">กติกาการเล่น</span>
            <span className="sm:hidden">กติกา</span>
          </button>

          <div className="flex items-center gap-2 bg-[#1f0b02] border border-[#522005] px-3 py-1 rounded-xl">
            <Avatar
              src={currentTurnPlayer?.avatar_url}
              name={currentTurnPlayer?.display_name || 'Player'}
              size="sm"
              isTurn={true}
            />
            <div className="text-right">
              <span className="text-[10px] text-amber-400/80 block leading-tight font-bold">
                {isMyTurn ? 'ตาของคุณ!' : isBotTurn ? 'บอทกำลังเล่น:' : 'ตากำลังเล่น:'}
              </span>
              <span className="text-xs font-black text-amber-100 truncate max-w-[110px] block">
                {currentTurnPlayer?.display_name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Live Action Ticker (Always Visible on all devices!) */}
      <div className="w-full bg-[#250f04] border border-[#6b2a09] rounded-2xl px-3 sm:px-4 py-2 mb-2.5 shadow-xl flex items-center justify-between gap-2 transition hover:border-amber-500/50">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="flex h-2.5 w-2.5 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
          </span>
          <span className="text-[11px] font-black uppercase text-amber-400 flex items-center gap-1 shrink-0">
            <Scroll className="w-3.5 h-3.5 text-yellow-400" />
            <span className="hidden sm:inline">การเดินล่าสุด:</span>
            <span className="sm:hidden">ล่าสุด:</span>
          </span>
          {gameLogs.length > 0 ? (
            <span
              className="text-xs font-bold truncate cursor-pointer hover:underline text-left"
              style={{ color: gameLogs[0]?.color || '#fef3c7' }}
              onClick={() => setShowHistoryModal(true)}
              title="คลิกเพื่อเปิดดูประวัติการเดินทั้งหมด"
            >
              {gameLogs[0]?.text}
            </span>
          ) : (
            <span className="text-xs text-amber-400/50">ยังไม่มีประวัติการเดิน เริ่มเกมโดยการทอยลูกเต๋าได้เลย!</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {gameLogs[0]?.time && (
            <span className="text-[10px] font-mono text-amber-400/60 hidden md:inline">
              {gameLogs[0].time}
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="px-2.5 py-1 rounded-xl bg-[#3d1806] hover:bg-[#522108] border border-[#7d320b] text-[11px] font-black text-amber-200 hover:text-white flex items-center gap-1.5 transition active:scale-95 shadow cursor-pointer"
            title="ดูกฎและกติกาการเล่นซุปเปอร์เศรษฐี"
          >
            <BookOpen className="w-3.5 h-3.5 text-yellow-400" />
            <span>📖 กติกา</span>
          </button>
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="px-2.5 py-1 rounded-xl bg-[#3d1806] hover:bg-[#522108] border border-[#7d320b] text-[11px] font-black text-yellow-300 flex items-center gap-1.5 transition active:scale-95 shadow cursor-pointer"
            title="ดูประวัติการเดินและซื้อที่ดินทั้งหมด"
          >
            <span>📜 ประวัติ</span>
            <span className="px-1.5 py-0.2 rounded-full bg-yellow-400/20 text-yellow-300 text-[10px] font-mono">
              {gameLogs.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Landscape Grid (Discord Widescreen Layout) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 items-start my-auto">
        {/* Left Column: Player Leaderboard & Net Worth (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-2 order-2 lg:order-1">
          <div className="bg-[#240e03] border-2 border-[#54240a] rounded-2xl p-3 shadow-xl">
            <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-[#451803] pb-1.5">
              <Award className="w-4 h-4 text-yellow-400" />
              <span>ผู้เล่นในกระดาน ({players.length} คน)</span>
            </h3>

            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto scrollbar-none pr-0.5">
              {players.map((p) => {
                const playerCash = cash[p.id] ?? 15.0;
                const propCount = getPlayerPropertiesCount(p.id);
                const isCurrent = p.id === currentTurnPlayer?.id;
                const isMe = p.id === currentPlayer?.id;
                const isBankrupt = playerCash <= 0;
                const isBot = p.line_user_id === 'bot' || p.id.startsWith('bot-');

                const ownedProps = Object.entries(properties)
                  .filter(([_, prop]) => prop.ownerId === p.id)
                  .map(([idxStr, prop]) => ({
                    tile: SUPER_MONOPOLY_TILES[Number(idxStr)],
                    houses: prop.houses,
                  }))
                  .filter((item) => item.tile);

                return (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                      isCurrent
                        ? 'bg-[#3d1805] border-yellow-400 ring-2 ring-yellow-400/40 shadow-lg'
                        : 'bg-[#1a0801] border-[#3d1503]'
                    }`}
                  >
                    {/* Top row: Avatar, Name, Cash */}
                    <div className="w-full flex items-center justify-between">
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
                          {isBot && (
                            <span className="absolute -top-1 -right-1 text-[7px] font-black bg-purple-950 text-purple-200 px-1 rounded border border-purple-700">
                              BOT
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

                      {/* Jail status badge & Cash balance */}
                      <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                        {inJailTurns[p.id] > 0 && (
                          <span className="text-[9px] font-bold bg-red-950 text-red-300 border border-red-700 px-1.5 py-0.5 rounded-full">
                            ⛓️ ในคุก
                          </span>
                        )}
                        {restTurns && restTurns[p.id] > 0 && (
                          <span className="text-[9px] font-bold bg-sky-950 text-sky-300 border border-sky-600 px-1.5 py-0.5 rounded-full">
                            🏖️ จุดพัก
                          </span>
                        )}
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

                    {/* Owned Properties List: แสดงว่าใครได้/ถือครองที่ดินอะไรบ้าง */}
                    {ownedProps.length > 0 && (
                      <div className="w-full flex flex-wrap gap-1 mt-0.5 pt-1.5 border-t border-[#3b1704]">
                        {ownedProps.map(({ tile, houses }) => (
                          <span
                            key={tile.index}
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 border shadow-sm transition hover:scale-105 cursor-pointer"
                            style={{
                              backgroundColor: tile.color ? `${tile.color}2b` : '#2d1406',
                              borderColor: tile.color || '#d97706',
                              color: '#fef3c7',
                            }}
                            title={`${tile.name}${houses === 4 ? ' (โรงแรม)' : houses > 0 ? ` (บ้าน ${houses} หลัง)` : ' (ที่ดินเปล่า)'}`}
                            onClick={() => setInspectTile(tile)}
                          >
                            <span className="text-[10px]">{tile.icon || '🏛️'}</span>
                            <span className="truncate max-w-[65px]">{tile.name}</span>
                            {houses > 0 && (
                              <span className="text-[8px] font-mono text-yellow-300 ml-0.5">
                                {houses === 4 ? '🏨' : `🏠x${houses}`}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center Column: 3D / 2D Super Monopoly Classic Board (6 cols) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center order-1 lg:order-2 w-full">
          {/* 3D / 2D Toggle Button Bar */}
          <div className="w-full flex items-center justify-between pb-1.5 px-1">
            <span className="text-[11px] font-bold text-amber-300/80 flex items-center gap-1">
              <span>กระดานซุปเปอร์เศรษฐี</span>
            </span>

            <div className="flex items-center gap-1 bg-[#1c0801] p-0.5 rounded-xl border border-[#4d1d05]">
              <button
                type="button"
                onClick={() => setIs3DMode(true)}
                className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                  is3DMode
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-amber-950 shadow'
                    : 'text-amber-300/70 hover:text-white'
                }`}
              >
                🧊 โหมด 3D
              </button>
              <button
                type="button"
                onClick={() => setIs3DMode(false)}
                className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                  !is3DMode
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-amber-950 shadow'
                    : 'text-amber-300/70 hover:text-white'
                }`}
              >
                📜 โหมด 2D
              </button>
            </div>
          </div>

          {/* Active Board Display */}
          {is3DMode ? (
            <SuperBoard3D
              positions={positions}
              properties={properties}
              players={players}
              currentTurnPlayerId={currentTurnPlayer?.id || null}
              activeStepTileIndex={activeStepTileIndex}
              onTileClick={(tile) => setInspectTile(tile)}
            />
          ) : (
            <SuperBoard
              positions={positions}
              properties={properties}
              players={players}
              currentTurnPlayerId={currentTurnPlayer?.id || null}
              activeStepTileIndex={activeStepTileIndex}
              onTileClick={(tile) => setInspectTile(tile)}
            />
          )}
        </div>

        {/* Right Column: 2 Dice Roll Controls & Live Game Logs (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-2 order-3">
          {/* Action & 2 Dice Control Box */}
          <div className="bg-[#240e03] border-2 border-[#54240a] rounded-2xl p-3.5 shadow-xl text-center">
            <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5 border-b border-[#451803] pb-1.5">
              <Dices className="w-4 h-4 text-yellow-400" />
              <span>ทอยลูกเต๋า 2 ลูก (2 DICE)</span>
            </h3>

            {/* 2 Physical 3D Dice Display */}
            <div className="flex flex-col items-center justify-center my-3">
              <div className="flex items-center justify-center gap-3">
                {/* Die 1 */}
                <div className="flex flex-col items-center gap-1">
                  {renderDiceFace(dice[0], isRolling)}
                  <span className="text-[9px] font-bold text-amber-400/70">ลูกที่ 1</span>
                </div>

                <span className="text-xl font-black text-yellow-400/80">+</span>

                {/* Die 2 */}
                <div className="flex flex-col items-center gap-1">
                  {renderDiceFace(dice[1], isRolling)}
                  <span className="text-[9px] font-bold text-amber-400/70">ลูกที่ 2</span>
                </div>
              </div>

              {/* Total Roll Result - Only shown AFTER dice finish spinning! */}
              <div className="mt-2.5 flex items-center justify-center gap-2 min-h-[36px]">
                {isRolling ? (
                  <div className="flex items-center gap-1.5 text-xs text-yellow-300 font-bold animate-pulse">
                    <span className="text-sm animate-spin">🎲</span>
                    <span>
                      {isMyTurn
                        ? 'กำลังทอยลูกเต๋า...'
                        : `${currentTurnPlayer?.display_name || 'ผู้เล่น'} กำลังทอยเต๋า...`}
                    </span>
                  </div>
                ) : hasRolledThisTurn || isMoving ? (
                  <div className="flex items-center justify-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                    <span className="text-xs text-amber-300/80 font-bold">รวมแต้มเต๋า:</span>
                    <span className="text-2xl font-black font-mono text-yellow-400 drop-shadow">
                      {diceTotal}
                    </span>
                    <span className="text-xs text-amber-300/80 font-bold">ช่อง</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-amber-400/60 font-bold">
                    {isMyTurn
                      ? '🎲 กดทอยเพื่อสุ่มแต้มเดิน'
                      : `🎲 รอ ${currentTurnPlayer?.display_name || 'ผู้เล่น'} ทอยลูกเต๋า`}
                  </span>
                )}
              </div>

              {/* Double Roll Badge - Only shown AFTER dice finish spinning! */}
              {!isRolling && isDouble && (hasRolledThisTurn || isMoving) && (
                <div className="mt-1 px-3 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-400 text-yellow-300 text-[11px] font-black animate-bounce flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ได้แต้มคู่ ({dice[0]}-{dice[1]}) ได้ทอยต่ออีกรอบ!</span>
                </div>
              )}
            </div>

            {/* Turn Buttons & Prompts */}
            {isMyTurn ? (
              isCurrentPlayerInJail ? (
                <div className="flex flex-col gap-2 p-3 rounded-2xl bg-[#360e06] border-2 border-red-600/70 shadow-2xl text-center">
                  <div className="flex items-center justify-center gap-1.5 text-red-300 font-black text-xs sm:text-sm">
                    <span className="text-base">⛓️</span>
                    <span>คุณถูกคุมขังอยู่ในห้องขัง!</span>
                  </div>
                  <p className="text-[10px] text-amber-200/90 font-bold">
                    เลือกหยุดรับโทษ 1 ตา หรือจ่ายค่าปรับเพื่อออกทันที:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 mt-1">
                    <button
                      type="button"
                      disabled={isRolling || isMoving}
                      onClick={handleServeJailTurn}
                      className="wood-btn-brown py-2.5 px-1 rounded-xl font-black text-[11px] text-yellow-300 border border-yellow-500/60 flex flex-col items-center justify-center shadow active:scale-95"
                      title="หยุดรับโทษ 1 ตา โดยข้ามการทอยในรอบนี้ รอบถัดไปจะได้รับอิสรภาพ"
                    >
                      <span>⛓️ หยุดรับโทษ 1 ตา</span>
                      <span className="text-[9px] text-amber-300/80 font-bold">(ข้ามตาเดิน)</span>
                    </button>

                    <button
                      type="button"
                      disabled={isRolling || isMoving || myCash < 0.5}
                      onClick={handlePayJailBail}
                      className="wood-btn-gold py-2.5 px-1 rounded-xl font-black text-[11px] flex flex-col items-center justify-center shadow active:scale-95 disabled:opacity-40"
                      title="จ่ายค่าปรับ 0.5M เพื่อออกจากห้องขังและทอยเต๋าได้ทันที"
                    >
                      <span>💸 จ่ายค่าปรับ 0.5M</span>
                      <span className="text-[9px] text-amber-950 font-bold">(ออกคุกทันที)</span>
                    </button>

                    <button
                      type="button"
                      disabled={isRolling || isMoving}
                      onClick={handleDrinkForJail}
                      className="py-2.5 px-1 rounded-xl font-black text-[11px] bg-[#541208] hover:bg-[#70180a] border border-rose-500 text-rose-200 flex flex-col items-center justify-center shadow active:scale-95"
                      title="ดื่ม 1 ช็อตเพื่อแหกคุกทันที (โหมดวงเหล้า)"
                    >
                      <span>🍺 ดื่ม 1 ช็อต</span>
                      <span className="text-[9px] text-rose-300/80 font-bold">(โหมดวงเหล้า)</span>
                    </button>
                  </div>
                </div>
              ) : isCurrentPlayerResting ? (
                <div className="flex flex-col gap-2 p-3 rounded-2xl bg-[#0c2438] border-2 border-sky-400/80 shadow-2xl text-center">
                  <div className="flex items-center justify-center gap-1.5 text-sky-300 font-black text-xs sm:text-sm">
                    <span className="text-base">🏖️</span>
                    <span>คุณกำลังหยุดพักผ่อนที่จุดพัก!</span>
                  </div>
                  <p className="text-[10px] text-sky-200/90 font-bold">
                    ตามกฎจุดพักผ่อน: คุณต้องหยุดทอยลูกเต๋า 1 ตาในรอบนี้
                  </p>

                  <button
                    type="button"
                    disabled={isRolling || isMoving}
                    onClick={handleServeRestTurn}
                    className="wood-btn-gold w-full py-3 rounded-xl font-black text-xs text-amber-950 flex items-center justify-center gap-1.5 shadow-lg active:scale-95"
                  >
                    <span>🏖️ หยุดพักผ่อน 1 ตา (ส่งตาเดิน)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={isRolling || isMoving || hasRolledThisTurn}
                    onClick={rollDice}
                    className="wood-btn-gold w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-40"
                  >
                    <Dices className="w-5 h-5" />
                    <span>
                      {isRolling
                        ? 'กำลังทอยลูกเต๋า...'
                        : isMoving
                        ? 'กำลังเดินบนกระดาน...'
                        : hasRolledThisTurn
                        ? 'ทอยไปแล้วในรอบนี้'
                        : 'กดทอยลูกเต๋า 2 ลูก!'}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isRolling || isMoving}
                    onClick={handleEndTurn}
                    className="wood-btn-brown w-full py-2 rounded-xl font-bold text-xs text-amber-200 border border-[#54240a] flex items-center justify-center gap-1 active:scale-95 transition"
                  >
                    <span>จบรอบตาเดิน (ส่งตา)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            ) : isBotTurn ? (
              <div className="py-3 px-2 rounded-xl bg-[#2a0e03] border border-yellow-600/40 text-xs text-yellow-300 font-bold flex items-center justify-center gap-2 animate-pulse">
                <Bot className="w-4 h-4 text-yellow-400" />
                <span>🤖 {currentTurnPlayer?.display_name} กำลังคิดและทอยเต๋า...</span>
              </div>
            ) : (
              <div className="py-3 px-2 rounded-xl bg-[#1c0801] border border-[#3d1503] text-xs text-amber-300/70 font-bold animate-pulse">
                ⏳ รอ {currentTurnPlayer?.display_name} ทอยลูกเต๋า...
              </div>
            )}
          </div>

          {/* Live History Feed Box */}
          <div className="bg-[#240e03] border-2 border-[#54240a] rounded-2xl p-3 shadow-xl flex-1 flex flex-col min-h-[160px]">
            <div className="flex items-center justify-between border-b border-[#451803] pb-1.5 mb-2">
              <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Scroll className="w-3.5 h-3.5 text-yellow-400" />
                <span>ประวัติการเดิน (Live Feed)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="text-[10px] font-bold text-amber-400/80 hover:text-yellow-300 flex items-center gap-1 transition"
                title="เปิดดูแบบเต็มจอ"
              >
                <span>ดูทั้งหมด ({gameLogs.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 max-h-[35vh] overflow-y-auto pr-1 text-[11px] font-bold">
              {gameLogs.length === 0 ? (
                <span className="text-amber-400/50 text-center py-4">ยังไม่มีประวัติการเดิน</span>
              ) : (
                gameLogs.map((log, lI) => (
                  <div
                    key={lI}
                    className="p-2 rounded-xl bg-[#1a0801] border border-[#3d1503] text-left leading-relaxed flex items-start justify-between gap-1.5 shadow-sm"
                  >
                    <span style={{ color: log.color || '#fef3c7' }} className="break-words">
                      {log.text}
                    </span>
                    <span className="text-[9px] text-amber-400/50 shrink-0 font-mono pt-0.5">
                      {log.time}
                    </span>
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
          if (activePropertyModal) {
            handleCloseActiveModal();
          } else {
            setInspectTile(null);
          }
        }}
        onBuyLand={handleBuyLand}
        onBuildHouse={handleBuildHouse}
      />

      {/* Chance / Chest Modal */}
      <ChanceChestModal
        isOpen={Boolean(activeCard)}
        card={activeCard}
        currentCash={myCash}
        isMyTurn={isMyTurn}
        onClose={handleCloseActiveModal}
      />

      {/* Game Rules Modal */}
      <RulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

      {/* All Moves & Game History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title={`📜 ประวัติการเดินและการซื้อที่ดิน (${gameLogs.length} รายการ)`}
      >
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
          {gameLogs.length === 0 ? (
            <div className="py-8 text-center text-amber-400/60 text-xs font-bold">
              ยังไม่มีประวัติการเดินในเกมนี้
            </div>
          ) : (
            gameLogs.map((log, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-[#1d0801] border border-[#421704] flex items-start justify-between gap-2 shadow-sm"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <span className="text-xs text-amber-400/50 font-mono shrink-0 pt-0.5">
                    #{gameLogs.length - idx}
                  </span>
                  <span
                    className="text-xs font-bold leading-relaxed break-words"
                    style={{ color: log.color || '#fef3c7' }}
                  >
                    {log.text}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-amber-400/60 shrink-0 bg-[#2b0e03] px-2 py-0.5 rounded-lg border border-[#4d1a06]">
                  {log.time}
                </span>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};
