'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BaseGameProps } from '@/types/game';
import { useSuperMonopolyEngine } from './useSuperMonopolyEngine';
import { SuperBoard } from './SuperBoard';
import { SuperBoard3D, PLAYER_3D_COLORS } from './SuperBoard3D';
import { PropertyCardModal } from './PropertyCardModal';
import { ChanceChestModal } from './ChanceChestModal';
import { PenaltyModal } from './PenaltyModal';
import { RentReceiptModal } from './RentReceiptModal';
import { FlightPickerModal } from './FlightPickerModal';
import { DebtModal } from './DebtModal';
import { RulesModal } from './RulesModal';
import { RollOrderModal } from './RollOrderModal';
import { showConfirm } from '@/lib/alerts';
import { CHEST_CARDS, CHANCE_CARDS } from './superMonopolyData';
import { Modal } from '@/components/common/Modal';
import { SUPER_MONOPOLY_TILES, formatMoneyM } from './superMonopolyData';
import { Avatar } from '@/components/common/Avatar';
import { SuperPropertyTile, PlayerRecord } from '@/types/database';
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
    activeStepPlayerId,
    isMyTurn,
    drawnCard,
    rentReceipt,
    isProxying,
    startProxyTurn,
    isBotTurn,
    currentTurnPlayer,
    positions,
    properties,
    cash,
    activePropertyModal,
    setActivePropertyModal,
    activeCard,
    setActiveCard,
    activePenaltyModal,
    handleAcknowledgePenalty,
    jailNotice,
    handleAcknowledgeJail,
    restNotice,
    handleAcknowledgeRest,
    gameLogs,
    isCurrentPlayerInJail,
    isCurrentPlayerResting,
    inJailTurns,
    restTurns,
    rollDice,
    handleServeJailTurn,
    bankrupt,
    winnerId,
    debtDecision,
    handleMortgageAndPay,
    handleDeclareBankrupt,
    isCurrentPlayerBoarding,
    showFlightPicker,
    handleOpenFlightPicker,
    handleChooseFlight,
    closeFlightPicker,
    handlePayJailBail,
    jailBailCost,
    handleServeRestTurn,
    handleBuyLand,
    handleBuildHouse,
    handleEndTurn,
    isEndingTurn,
    handleCloseActiveModal,
    orderedPlayers,
    rollOrderDone,
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
        className={`w-14 h-14 rounded-2xl bg-gradient-to-b from-[#ffffff] via-[#f7f5e8] to-[rgb(var(--c-butter))] border-2 border-b-4 border-[rgb(var(--c-line-strong))] shadow-xl flex items-center justify-center ${
          isRollingAnim ? 'animate-spin' : ''
        }`}
      >
        <div className="grid grid-cols-3 grid-rows-3 w-10 h-10 p-1 gap-0.5 pointer-events-none">
          {dotClasses.map((cls) => (
            <span
              key={cls}
              className={`w-2.5 h-2.5 rounded-full ${
                val === 1 ? 'bg-red-600 ring-1 ring-red-400' : 'bg-[rgb(var(--c-bg-deep))]'
              } shadow-inner justify-self-center self-center ${cls}`}
            />
          ))}
        </div>
      </div>
    );
  };

  // Ownership of whichever tile the card is showing (landed on, or tapped to inspect)
  const shownTile = activePropertyModal || inspectTile;
  const shownTileOwnership = shownTile ? properties[shownTile.index] || null : null;
  const shownTileOwner = shownTileOwnership
    ? players.find((p) => p.id === shownTileOwnership.ownerId) || null
    : null;

  // The host may only stand in once a turn has sat idle, so nobody gets their
  // dice taken away while they are still deciding.
  const PROXY_UNLOCK_SECONDS = 20;
  const [turnIdleSeconds, setTurnIdleSeconds] = useState(0);

  useEffect(() => {
    setTurnIdleSeconds(0);
    const timer = setInterval(() => setTurnIdleSeconds((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [room.current_turn_player_id]);

  const canOfferProxy = Boolean(isHost && !isMyTurn && !isBotTurn && !isProxying && currentTurnPlayer);
  const proxySecondsLeft = Math.max(0, PROXY_UNLOCK_SECONDS - turnIdleSeconds);

  const handleStartProxy = async () => {
    if (!currentTurnPlayer) return;
    const ok = await showConfirm(
      `เล่นแทนเพื่อน?`,
      `คุณจะทอยเต๋าและตัดสินใจแทนในตานี้ ทุกคนในห้องจะเห็นว่าหัวหน้าห้องเล่นแทน [${currentTurnPlayer.display_name}]`,
      'เล่นแทนเลย',
      'ยกเลิก'
    );
    if (ok) await startProxyTurn();
  };

  // Card draws are announced through game_state so the whole table sees them.
  // The player who drew keeps their own interactive card; everyone else gets a
  // read-only copy that clears itself.
  const [dismissedDrawAt, setDismissedDrawAt] = useState<number | null>(null);

  // Landlords were only told through the log that someone had paid them. This is
  // theirs alone - it is keyed on the receipt's owner, so nobody else sees it.
  const [dismissedReceiptAt, setDismissedReceiptAt] = useState<number | null>(null);
  const myReceipt =
    rentReceipt &&
    currentPlayer &&
    rentReceipt.ownerId === currentPlayer.id &&
    dismissedReceiptAt !== rentReceipt.at
      ? rentReceipt
      : null;

  useEffect(() => {
    if (!drawnCard) return;
    setDismissedDrawAt(null);
    // A card someone is holding closes for the whole table when they close it,
    // so it does not need a timer counting down behind their back. Only a bot's
    // card, which nobody can dismiss, still clears itself - and its own turn
    // ending clears it too, whichever comes first.
    if (!drawnCard.playerId.startsWith('bot-')) return;
    const timer = setTimeout(() => setDismissedDrawAt(drawnCard.at), 7000);
    return () => clearTimeout(timer);
  }, [drawnCard?.at, drawnCard?.playerId]);

  const spectatorCard =
    drawnCard && !activeCard && dismissedDrawAt !== drawnCard.at
      ? [...CHEST_CARDS, ...CHANCE_CARDS].find((c) => c.id === drawnCard.cardId) || null
      : null;
  const spectatorCardOwner = drawnCard
    ? players.find((p) => p.id === drawnCard.playerId) || null
    : null;

  // A fresh arrow here on every render would defeat the memo on both boards.
  const handleTileClick = useCallback((tile: SuperPropertyTile) => {
    setInspectTile(tile);
  }, []);

  // Seats around the 3D board. The ring stays balanced whatever the table size:
  // two face off, three make a triangle, four take the corners, and anything
  // larger fills the edge midpoints between them.

  // The dice panel used to be tied to isRolling/isMoving, and the turn passes
  // through a moment where both are false - between revealing the dice and the
  // token starting to walk. Spectators saw the panel blink out and back twice a
  // turn. Latch it instead: once a roll starts it stays up until the turn moves.
  // Never let someone else's walk freeze your own controls. If the walking
  // flags are on but the walk belongs to another player, they are leftovers,
  // not something this player has to wait for.
  const walkIsMine = !activeStepPlayerId || activeStepPlayerId === currentPlayer?.id;
  const controlsBusy = (isRolling || isMoving) && walkIsMine;

  const [diceShownForTurn, setDiceShownForTurn] = useState(false);

  useEffect(() => {
    setDiceShownForTurn(false);
  }, [room.current_turn_player_id]);

  useEffect(() => {
    if (isRolling || isMoving || hasRolledThisTurn) setDiceShownForTurn(true);
  }, [isRolling, isMoving, hasRolledThisTurn]);

  return (
    <div className="w-full h-full min-h-[90vh] flex flex-col justify-between p-2 sm:p-4 select-none mx-auto max-w-none">
      {/* Top Status Header */}
      <div className="w-full flex items-center justify-between bg-[rgb(var(--c-surface))]/90 border-2 border-[rgb(var(--c-surface-3))] rounded-2xl px-4 py-2 mb-2 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐃</span>
          <div>
            <h2 className="text-sm sm:text-base font-black rpg-text-gold tracking-wide">
              ซุปเปอร์เศรษฐี คลาสสิก • SUPER MONOPOLY
            </h2>
            <p className="text-[10px] text-amber-300/80 font-bold">
              ห้อง: <span className="font-mono text-yellow-400">{room.code}</span> | ทุนเริ่มต้น 15.00M | ลูกเต๋า 2 ลูก 🎲🎲
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

          <div className="flex items-center gap-2 bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-2))] px-3 py-1 rounded-xl">
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
      <div className="w-full bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-3))] rounded-2xl px-3 sm:px-4 py-2 mb-2.5 shadow-xl flex items-center justify-between gap-2 transition hover:border-amber-500/50">
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
            className="px-2.5 py-1 rounded-xl bg-[rgb(var(--c-surface-2))] hover:bg-[rgb(var(--c-surface-3))] border border-[rgb(var(--c-line))] text-[11px] font-black text-amber-200 hover:text-white flex items-center gap-1.5 transition active:scale-95 shadow cursor-pointer"
            title="ดูกฎและกติกาการเล่นซุปเปอร์เศรษฐี"
          >
            <BookOpen className="w-3.5 h-3.5 text-yellow-400" />
            <span>📖 กติกา</span>
          </button>
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="px-2.5 py-1 rounded-xl bg-[rgb(var(--c-surface-2))] hover:bg-[rgb(var(--c-surface-3))] border border-[rgb(var(--c-line))] text-[11px] font-black text-yellow-300 flex items-center gap-1.5 transition active:scale-95 shadow cursor-pointer"
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
      {/* Both board modes get the whole screen; 2D was boxed into max-w-7xl,
          which squeezed its square board below the height it is allowed. */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 items-start my-auto w-full max-w-none">
        {/* Left Column: Player Leaderboard & Net Worth (3 cols) */}
        <div className={`lg:col-span-3 flex-col gap-2 order-2 lg:order-1 ${is3DMode ? 'hidden' : 'flex'}`}>
          <div className="bg-[rgb(var(--c-surface))] border-2 border-[rgb(var(--c-surface-3))] rounded-2xl p-3 shadow-xl">
            <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-[rgb(var(--c-surface-2))] pb-1.5">
              <Award className="w-4 h-4 text-yellow-400" />
              <span>ผู้เล่นในกระดาน ({players.length} คน)</span>
            </h3>

            {/* Side padding: the scroller clips horizontally as well, and the
                current player's ring sits outside the border. */}
            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto scrollbar-none px-1">
              {orderedPlayers.map((p: PlayerRecord) => {
                const playerCash = cash[p.id] ?? 15.0;
                const propCount = getPlayerPropertiesCount(p.id);
                const isCurrent = p.id === currentTurnPlayer?.id;
                const isMe = p.id === currentPlayer?.id;
                const isBankrupt = Boolean(bankrupt[p.id]);
                const isBot = p.line_user_id === 'bot' || p.id.startsWith('bot-');
                const scoreInfo = room.game_state?.roll_order_scores?.[p.id];

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
                        ? 'bg-[rgb(var(--c-surface-2))] border-yellow-400 ring-2 ring-yellow-400/40 shadow-lg'
                        : 'bg-[rgb(var(--c-bg-deep))] border-[rgb(var(--c-surface-2))]'
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
                            <span className="text-xs font-black text-amber-100 truncate max-w-[85px]">
                              {p.display_name}
                            </span>
                            {p.id === room.host_id && (
                              <Crown className="w-3 h-3 text-yellow-400 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-amber-300/70">
                              โฉนด: <strong className="text-amber-200">{propCount}</strong>
                            </span>
                            {scoreInfo && (
                              <span
                                className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-yellow-300 border border-yellow-500/40 flex items-center gap-0.5 shadow-sm"
                                title={`ทอยตัดสินลำดับได้ ${scoreInfo.total} แต้ม (${scoreInfo.d1}+${scoreInfo.d2})`}
                              >
                                <span>
                                  {scoreInfo.rank === 1
                                    ? '🥇'
                                    : scoreInfo.rank === 2
                                    ? '🥈'
                                    : scoreInfo.rank === 3
                                    ? '🥉'
                                    : `#${scoreInfo.rank}`}
                                </span>
                                <span>🎲{scoreInfo.total}</span>
                              </span>
                            )}
                          </div>
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

                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center Column: 3D / 2D Super Monopoly Classic Board (6 cols) */}
        <div className={`${is3DMode ? 'lg:col-span-9' : 'lg:col-span-6'} flex flex-col items-center justify-center order-1 lg:order-2 w-full`}>
          {/* 3D / 2D Toggle Button Bar */}
          <div className="w-full flex items-center justify-between pb-1.5 px-1">
            <span className="text-[11px] font-bold text-amber-300/80 flex items-center gap-1">
              <span>กระดานซุปเปอร์เศรษฐี</span>
            </span>

            <div className="flex items-center gap-1 bg-[rgb(var(--c-bg-deep))] p-0.5 rounded-xl border border-[rgb(var(--c-surface-2))]">
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
          <div className="relative w-full">
          {/* One column in the top left, in turn order, rather than seats
              scattered around the board - the running order is the thing people
              actually want to read off it. */}
          {is3DMode && (
            <div className="absolute top-2 left-2 z-20 flex flex-col items-stretch gap-1 pointer-events-none max-w-[40%]">
          {orderedPlayers.slice(0, 8).map((seatPlayer, seatIdx) => {
              const colour = PLAYER_3D_COLORS[players.indexOf(seatPlayer) % PLAYER_3D_COLORS.length];
              const isSeatTurn = seatPlayer.id === currentTurnPlayer?.id;
              const seatCash = cash[seatPlayer.id] ?? 15;
              const seatJailed = (inJailTurns[seatPlayer.id] ?? 0) > 0;

              return (
                <div
                  key={seatPlayer.id}
                  className={`rounded-xl border-2 bg-[rgb(var(--c-bg-deep))]/95 px-2 py-1 shadow-xl ${
                    isSeatTurn ? 'border-yellow-300' : 'border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/50"
                      style={{ backgroundColor: colour }}
                    />
                    <span className="text-[10px] font-black text-amber-50 truncate max-w-[84px]">
                      {seatPlayer.display_name}
                    </span>
                    {seatPlayer.id === room.host_id && <span className="text-[9px]">👑</span>}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black text-amber-300/70 shrink-0">
                      ที่ {seatIdx + 1}
                    </span>
                    <span
                      className={`text-[11px] font-black font-mono ${
                        seatCash <= 0 ? 'text-red-400' : 'text-emerald-300'
                      }`}
                    >
                      {bankrupt[seatPlayer.id] ? 'ออกแล้ว' : formatMoneyM(seatCash)}
                    </span>
                  </div>

                  {seatJailed && (
                    <div className="text-[9px] font-black text-rose-300 leading-tight">⛓️</div>
                  )}
                </div>
              );
          })}
            </div>
          )}

          {/* Dice roll in the middle of the board, the way they would on a table.
              Non-interactive so tiles underneath stay clickable. */}
          {diceShownForTurn && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
              <div
                // Solid, not translucent: a blurred backdrop over the animating
                // WebGL board repaints every frame and makes the dice shimmer
                // while a token is walking.
                className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-3xl bg-[rgb(var(--c-bg-deep))] border-2 shadow-2xl ${
                  isRolling ? 'border-yellow-400/90' : 'border-amber-600/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {renderDiceFace(dice[0], isRolling)}
                  {renderDiceFace(dice[1], isRolling)}
                </div>

                {isRolling ? (
                  <span className="text-[11px] font-black text-yellow-300 animate-pulse">
                    กำลังทอย...
                  </span>
                ) : (
                  <span className="text-[11px] font-black text-amber-100">
                    {dice[0] + dice[1]} แต้ม
                    {dice[0] === dice[1] && (
                      // A double normally buys another roll, but not one that
                      // landed you in jail - saying "double!" there reads like a
                      // reroll is coming when the turn is actually over.
                      <span
                        className={
                          isCurrentPlayerInJail || isCurrentPlayerResting ? 'text-rose-300' : 'text-yellow-300'
                        }
                      >
                        {isCurrentPlayerInJail
                          ? ' · แต้มคู่ (ติดคุก ไม่ได้ทอยต่อ)'
                          : isCurrentPlayerResting
                          ? ' · แต้มคู่ (ต้องพัก ไม่ได้ทอยต่อ)'
                          : ' · แต้มคู่!'}
                      </span>
                    )}
                  </span>
                )}

                <span className="text-[9px] font-bold text-amber-300/80 max-w-[160px] truncate">
                  {currentTurnPlayer?.display_name || ''}
                </span>
              </div>
            </div>
          )}

          {is3DMode ? (
            <SuperBoard3D
              positions={positions}
              properties={properties}
              players={players}
              currentTurnPlayerId={currentTurnPlayer?.id || null}
              activeStepTileIndex={activeStepTileIndex}
              activeStepPlayerId={activeStepPlayerId}
              bankrupt={bankrupt}
              onTileClick={handleTileClick}
            />
          ) : (
            <SuperBoard
              positions={positions}
              properties={properties}
              players={players}
              currentTurnPlayerId={currentTurnPlayer?.id || null}
              activeStepTileIndex={activeStepTileIndex}
              activeStepPlayerId={activeStepPlayerId}
              bankrupt={bankrupt}
              onTileClick={handleTileClick}
            />
          )}

        {(isMyTurn || isProxying) &&
          rollOrderDone &&
          !activePropertyModal &&
          !activeCard &&
          !activePenaltyModal &&
          !jailNotice &&
          !restNotice &&
          !showFlightPicker &&
          !debtDecision &&
          !winnerId &&
          !isEndingTurn && (
            <div
              // On the board itself, at the bottom edge - reachable without
              // scrolling past the whole board, and centred on the game rather
              // than on the browser window.
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1 pointer-events-none"
            >
              <span
                className={`pointer-events-none px-2 py-0.5 rounded-full border text-[10px] font-black shadow ${
                  isProxying
                    ? 'bg-purple-950 border-purple-400 text-purple-100'
                    : 'bg-black/70 border-amber-600/50 text-amber-200'
                }`}
              >
                {isProxying && currentTurnPlayer
                  ? `เล่นแทน ${currentTurnPlayer.display_name}`
                  : 'ตาของคุณ'}
              </span>

              {isCurrentPlayerBoarding ? (
                <button
                  type="button"
                  disabled={controlsBusy}
                  onClick={handleOpenFlightPicker}
                  className="pointer-events-auto px-7 py-3.5 rounded-full font-black text-sm shadow-2xl active:scale-95 disabled:opacity-40 bg-[#0b2b3d] border-2 border-sky-400 text-sky-100"
                >
                  ✈️ เลือกจุดหมายบิน
                </button>
              ) : isCurrentPlayerInJail ? (
                // Two ways out: buy your way out and take the turn, or sit it out.
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={controlsBusy || myCash < jailBailCost}
                    onClick={handlePayJailBail}
                    title={myCash < jailBailCost ? `เงินไม่พอจ่ายค่าปรับ ${formatMoneyM(jailBailCost)}` : undefined}
                    className="pointer-events-auto px-5 py-3.5 rounded-full font-black text-sm shadow-2xl active:scale-95 disabled:opacity-40 wood-btn-gold border-2 border-yellow-300/70"
                  >
                    💸 จ่าย {formatMoneyM(jailBailCost)} ออกมาทอย
                  </button>
                  <button
                    type="button"
                    disabled={controlsBusy}
                    onClick={handleServeJailTurn}
                    className={`pointer-events-auto px-5 py-3.5 rounded-full font-black text-sm shadow-2xl active:scale-95 disabled:opacity-40 ${isProxying ? 'bg-purple-800 hover:bg-purple-700 border-2 border-purple-300 text-purple-50' : 'bg-[rgb(var(--c-surface-2))] border-2 border-[rgb(var(--c-line))] text-amber-200'}`}
                  >
                    ⛓️ รับโทษ (ส่งตา)
                  </button>
                </div>
              ) : isCurrentPlayerResting ? (
                <button
                  type="button"
                  disabled={controlsBusy}
                  onClick={handleServeRestTurn}
                  className={`pointer-events-auto px-7 py-3.5 rounded-full font-black text-sm shadow-2xl active:scale-95 disabled:opacity-40 ${isProxying ? 'bg-purple-800 hover:bg-purple-700 border-2 border-purple-300 text-purple-50' : 'wood-btn-gold border-2 border-yellow-300/70'}`}
                >
                  🏖️ หยุดพัก (ส่งตา)
                </button>
              ) : !hasRolledThisTurn ? (
                <button
                  type="button"
                  disabled={controlsBusy}
                  onClick={rollDice}
                  className={`pointer-events-auto px-8 py-4 rounded-full font-black text-base shadow-2xl active:scale-95 disabled:opacity-50 ${isProxying ? 'bg-purple-800 hover:bg-purple-700 border-2 border-purple-300 text-purple-50' : 'wood-btn-gold border-2 border-yellow-300/70'}`}
                >
                  {controlsBusy && isRolling ? 'กำลังทอย...' : controlsBusy && isMoving ? 'กำลังเดิน...' : '🎲 ทอยลูกเต๋า'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={controlsBusy}
                  onClick={handleEndTurn}
                  className={`pointer-events-auto px-7 py-3.5 rounded-full font-black text-sm shadow-2xl active:scale-95 disabled:opacity-40 ${isProxying ? 'bg-purple-800 hover:bg-purple-700 border-2 border-purple-300 text-purple-50' : 'bg-[rgb(var(--c-surface-2))] border-2 border-[rgb(var(--c-line))] text-amber-200'}`}
                >
                  ส่งตาเดิน ➜
                </button>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Right Column: 2 Dice Roll Controls & Live Game Logs (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-2 order-3">
          {/* Turn status. Rolling, ending the turn and acknowledging jail
              all live on the floating action now, so only the things it
              cannot show are kept here. */}
          <div className="bg-[rgb(var(--c-surface))] border-2 border-[rgb(var(--c-surface-3))] rounded-2xl p-3 shadow-xl">
            {/* Host standing in for an absent player */}
            {isProxying && currentTurnPlayer && (
              <div className="mb-2 px-3 py-2 rounded-2xl bg-purple-950/80 border-2 border-purple-500 text-purple-100 font-black text-xs flex items-center justify-center gap-2 shadow-lg">
                <span>👑</span>
                <span>กำลังเล่นแทน [{currentTurnPlayer.display_name}]</span>
              </div>
            )}

            {canOfferProxy && currentTurnPlayer && (
              <div className="mb-2 p-2.5 rounded-2xl bg-[#1b0f2e] border-2 border-purple-600/70 shadow-lg flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-purple-300 flex items-center gap-1">
                  <span>👑</span>
                  <span>เครื่องมือหัวหน้าห้อง</span>
                </span>
                <button
                  type="button"
                  disabled={proxySecondsLeft > 0}
                  onClick={handleStartProxy}
                  className="w-full py-2 rounded-xl font-black text-[11px] bg-purple-800 hover:bg-purple-700 border border-purple-400 text-purple-50 shadow active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {proxySecondsLeft > 0
                    ? `รอเจ้าตัวกดเองก่อน (${proxySecondsLeft} วิ)`
                    : `🎲 เล่นแทน [${currentTurnPlayer.display_name}]`}
                </button>
                <span className="text-[9px] text-purple-300/70 font-semibold text-center">
                  ใช้เมื่อเพื่อนหลุดหรือไม่สะดวกกด
                </span>
              </div>
            )}

            {!isMyTurn && !isProxying && (
              isBotTurn ? (
                <div className="py-3 px-2 rounded-xl bg-[rgb(var(--c-surface))] border border-yellow-600/40 text-xs text-yellow-300 font-bold flex items-center justify-center gap-2">
                  <Bot className="w-4 h-4 text-yellow-400" />
                  <span>🤖 {currentTurnPlayer?.display_name} กำลังคิดและทอยเต๋า...</span>
                </div>
              ) : (
                <div className="py-3 px-2 rounded-xl bg-[rgb(var(--c-bg-deep))] border border-[rgb(var(--c-surface-2))] text-xs text-amber-300/70 font-bold text-center">
                  ⏳ รอ {currentTurnPlayer?.display_name} ทอยลูกเต๋า...
                </div>
              )
            )}
          </div>

          {/* Live History Feed Box */}
          <div className="bg-[rgb(var(--c-surface))] border-2 border-[rgb(var(--c-surface-3))] rounded-2xl p-3 shadow-xl flex-1 flex flex-col min-h-[160px]">
            <div className="flex items-center justify-between border-b border-[rgb(var(--c-surface-2))] pb-1.5 mb-2">
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
                    className="p-2 rounded-xl bg-[rgb(var(--c-bg-deep))] border border-[rgb(var(--c-surface-2))] text-left leading-relaxed flex items-start justify-between gap-1.5 shadow-sm"
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

      {/* Floating turn action.
          Keeps the one action the turn needs within thumb reach at every width.
          The right-hand column drops below the board once the layout stacks, so
          on a phone rolling meant scrolling past the whole board first. */}
      {/* Property Buy/Upgrade Modal */}
      <PropertyCardModal
        isOpen={Boolean(activePropertyModal || inspectTile)}
        tile={activePropertyModal || inspectTile}
        ownership={shownTileOwnership}
        currentCash={myCash}
        isMyTurn={Boolean(isMyTurn && activePropertyModal)}
        ownerName={shownTileOwner?.display_name || null}
        ownerColor={
          shownTileOwner ? PLAYER_3D_COLORS[players.indexOf(shownTileOwner) % PLAYER_3D_COLORS.length] : null
        }
        isOwnedByMe={Boolean(shownTileOwner && currentPlayer && shownTileOwner.id === currentPlayer.id)}
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

      {/* Read-only copy of whatever someone else just drew */}
      <ChanceChestModal
        isOpen={Boolean(spectatorCard)}
        card={spectatorCard}
        isMyTurn={false}
        spectatorName={spectatorCardOwner?.display_name || null}
        onClose={() => setDismissedDrawAt(drawnCard?.at ?? null)}
      />

      {/* Being sent to jail ends the turn even on a double - say so out loud */}
      <Modal
        isOpen={Boolean(jailNotice)}
        onClose={handleAcknowledgeJail}
        title="⛓️ โดนจับเข้าห้องขัง"
      >
        <div className="flex flex-col gap-3 text-center">
          <span className="text-5xl">🚓</span>
          <p className="text-sm font-black text-rose-200">
            คุณเดินไปตกช่อง [{jailNotice?.tileName}] ➜ ถูกส่งเข้าห้องขังทันที
          </p>
          {jailNotice?.wasDouble && (
            <p className="text-xs font-bold text-rose-300/90 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/40">
              แม้จะทอยได้แต้มคู่ ก็ไม่ได้ทอยต่อ เพราะโดนจับเข้าคุกแล้ว จบตานี้ทันที
            </p>
          )}
          <p className="text-[11px] font-bold text-amber-200/80">
            ตาถัดไปของคุณจะเลือกได้ว่าจะจ่ายค่าปรับ {formatMoneyM(jailBailCost)} เพื่อออกมาทอยทันที
            หรือรับโทษ 1 ตาแล้วค่อยออกมาเดินต่อ
          </p>
          <button
            type="button"
            onClick={handleAcknowledgeJail}
            className="wood-btn-gold w-full py-3 rounded-2xl text-sm font-black shadow-lg active:scale-95"
          >
            รับทราบ (ส่งตาให้คนถัดไป)
          </button>
        </div>
      </Modal>

      {/* The rest stop costs a turn as well, so it says so */}
      <Modal
        isOpen={Boolean(restNotice)}
        onClose={handleAcknowledgeRest}
        title="🏖️ แวะพักที่จุดพักผ่อน"
      >
        <div className="flex flex-col gap-3 text-center">
          <span className="text-5xl">🏖️</span>
          <p className="text-sm font-black text-sky-200">
            คุณเดินมาถึง [{restNotice?.tileName}] ➜ ปลอดภัยจากค่าผ่านทาง แต่ต้องพัก 1 ตา
          </p>
          {restNotice?.wasDouble && (
            <p className="text-xs font-bold text-sky-300/90 px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/40">
              แม้จะทอยได้แต้มคู่ ก็ไม่ได้ทอยต่อ เพราะต้องพักที่จุดนี้ จบตานี้ทันที
            </p>
          )}
          <p className="text-[11px] font-bold text-amber-200/80">
            ตาถัดไปของคุณจะเป็นการพัก 1 ตา แล้วจึงออกมาเดินต่อได้ตามปกติ
          </p>
          <button
            type="button"
            onClick={handleAcknowledgeRest}
            className="wood-btn-gold w-full py-3 rounded-2xl text-sm font-black shadow-lg active:scale-95"
          >
            รับทราบ (ส่งตาให้คนถัดไป)
          </button>
        </div>
      </Modal>

      {/* Cannot cover the bill: sell up, or go out */}
      <DebtModal
        isOpen={Boolean(debtDecision)}
        debt={debtDecision}
        onMortgage={handleMortgageAndPay}
        onBankrupt={handleDeclareBankrupt}
      />

      {/* Last one standing */}
      <Modal isOpen={Boolean(winnerId)} onClose={() => {}} title="🏆 จบเกม">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-6xl">🏆</span>
          <span className="text-lg font-black text-yellow-300">
            {players.find((p) => p.id === winnerId)?.display_name || 'ผู้ชนะ'}
          </span>
          <span className="text-xs font-bold text-amber-200/80">
            เป็นคนสุดท้ายที่ยังไม่ล้มละลาย · ชนะการแข่งขันนี้!
          </span>
          <div className="w-full flex flex-col gap-1.5 mt-1">
            {orderedPlayers.map((p) => (
              <div
                key={p.id}
                className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-black ${
                  p.id === winnerId
                    ? 'bg-[rgb(var(--c-surface-3))] border-yellow-400 text-yellow-100'
                    : 'bg-[rgb(var(--c-bg-deep))] border-[rgb(var(--c-surface-2))] text-amber-300/60'
                }`}
              >
                <span className="truncate">
                  {p.id === winnerId ? '🏆 ' : bankrupt[p.id] ? '💀 ' : ''}
                  {p.display_name}
                </span>
                <span className="font-mono shrink-0">
                  {bankrupt[p.id] ? 'ล้มละลาย' : formatMoneyM(cash[p.id] ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Where to? */}
      <FlightPickerModal
        isOpen={showFlightPicker}
        fromIndex={currentPlayer ? positions[currentPlayer.id] ?? 0 : 0}
        properties={properties}
        players={players}
        myId={currentPlayer?.id || null}
        onChoose={handleChooseFlight}
        onClose={closeFlightPicker}
      />

      {/* What the other side of a rent payment looks like */}
      <RentReceiptModal
        isOpen={Boolean(myReceipt)}
        receipt={myReceipt}
        onClose={() => setDismissedReceiptAt(rentReceipt?.at ?? null)}
      />

      {/* Penalty / Rent Fee Modal */}
      <PenaltyModal
        isOpen={Boolean(activePenaltyModal)}
        notice={activePenaltyModal}
        onAcknowledge={handleAcknowledgePenalty}
      />

      {/* Game Rules Modal */}
      <RulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

      {/* Pre-Game Roll for Turn Order Modal */}
      <RollOrderModal
        isOpen={!rollOrderDone}
        players={players}
        currentPlayer={currentPlayer}
        isHost={isHost}
        hostId={room.host_id}
        roomGameState={room.game_state}
        onUpdateGameState={props.onUpdateGameState}
        onReorderPlayers={props.onReorderPlayers}
        onNextTurn={props.onNextTurn}
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
                className="p-2.5 rounded-xl bg-[rgb(var(--c-bg-deep))] border border-[rgb(var(--c-surface-2))] flex items-start justify-between gap-2 shadow-sm"
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
                <span className="text-[10px] font-mono text-amber-400/60 shrink-0 bg-[rgb(var(--c-surface))] px-2 py-0.5 rounded-lg border border-[rgb(var(--c-surface-2))]">
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
