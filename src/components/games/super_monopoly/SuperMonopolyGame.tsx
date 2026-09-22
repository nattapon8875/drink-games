'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BaseGameProps } from '@/types/game';
import { useSuperMonopolyEngine } from './useSuperMonopolyEngine';
import { SuperBoard } from './SuperBoard';
import { SuperBoard3D, PLAYER_3D_COLORS } from './SuperBoard3D';
import { PropertyCardModal } from './PropertyCardModal';
import { StartingHandModal } from './StartingHandModal';
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

// The feed stores a colour with every line, and those were picked when the page
// was always dark - on paper they wash out to nothing. The colour is carrying
// meaning (money in, money out, a handover), so keep the meaning and swap the
// shade for the theme's readable version of it.
const LOG_INK: Record<string, string> = {
  '#22c55e': '--c-mint-label',
  '#10b981': '--c-mint-label',
  '#06b6d4': '--c-sky-label',
  '#38bdf8': '--c-sky-label',
  '#0ea5e9': '--c-sky-label',
  '#93c5fd': '--c-sky-label',
  '#ef4444': '--c-berry-label',
  '#dc2626': '--c-berry-label',
  '#f59e0b': '--c-butter-label',
  '#f97316': '--c-butter-label',
  '#eab308': '--c-butter-label',
  '#facc15': '--c-butter-label',
  '#fef08a': '--c-butter-label',
  '#a855f7': '--c-grape-deep',
  '#9ca3af': '--c-ink-faint',
};

function logColor(c?: string): string {
  const token = LOG_INK[(c || '').toLowerCase()];
  return token ? `rgb(var(${token}))` : 'rgb(var(--c-ink))';
}

export const SuperMonopolyGame: React.FC<BaseGameProps> = (props) => {
  const { room, players, currentPlayer, isHost, onUpdateGameState, onReturnToLobby } = props;

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
    flightNotice,
    handleAcknowledgeFlight,
    handleAcknowledgeRest,
    gameLogs,
    isCurrentPlayerInJail,
    isCurrentPlayerResting,
    inJailTurns,
    restTurns,
    rollDice,
    handleServeJailTurn,
    bankrupt,
    bankruptcyNotice,
    rowBonus,
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
    startingDeal,
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
        className={`w-14 h-14 rounded-2xl bg-gradient-to-b from-[#ffffff] via-[#fbfbf7] to-[#e9e9e0] border-2 border-b-4 border-[#9a9a90] shadow-xl flex items-center justify-center ${
          isRollingAnim ? 'animate-spin' : ''
        }`}
      >
        <div className="grid grid-cols-3 grid-rows-3 w-10 h-10 p-1 gap-0.5 pointer-events-none">
          {dotClasses.map((cls) => (
            <span
              key={cls}
              style={{ backgroundColor: val === 1 ? '#d42a2a' : '#1b1b1b' }}
              className={`w-2.5 h-2.5 rounded-full shadow-inner justify-self-center self-center ${cls}`}
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
  // A winner is only declared when exactly one player is left standing, so a
  // table where the last two went out together ended with no winner, no end
  // screen and nothing to press at all. The game is over when nobody is left
  // to play it, whether or not somebody won.
  const activePlayers = orderedPlayers.filter((p) => !bankrupt[p.id]);
  const anyBankrupt = Object.values(bankrupt).some(Boolean);
  const gameOver = Boolean(winnerId) || (anyBankrupt && activePlayers.length <= 1);
  const endWinner = winnerId || (activePlayers.length === 1 ? activePlayers[0].id : null);

  // The winner card can be put aside to look at the final board.
  const [endGameDismissed, setEndGameDismissed] = useState(false);
  useEffect(() => {
    if (!gameOver) setEndGameDismissed(false);
  }, [gameOver]);

  // Starting over wipes the finished game rather than leaving its wreckage in
  // the room: a fresh lobby, not a board that still remembers who went out.
  const handlePlayAgain = useCallback(async () => {
    if (!isHost || !onReturnToLobby) return;
    await onUpdateGameState({
      positions: {},
      cash: {},
      properties: {},
      inJailTurns: {},
      restTurns: {},
      pendingFlights: {},
      bankrupt: {},
      rowBonus: null,
      winnerId: null,
      startingDeal: null,
      bankruptcyNotice: null,
      rentReceipt: null,
      drawnCard: null,
      dice: null,
      gameLogs: [],
      roll_order_done: false,
      roll_order_rolls: {},
      roll_order_scores: {},
      isRolling: false,
      isMoving: false,
      activeStepTileIndex: null,
      activeStepPlayerId: null,
    });
    await onReturnToLobby();
  }, [isHost, onReturnToLobby, onUpdateGameState]);

  // Everybody at the table should be told who just went out, once.
  const [dismissedBustAt, setDismissedBustAt] = useState<number | null>(null);
  const showBust = Boolean(
    bankruptcyNotice && dismissedBustAt !== bankruptcyNotice.at && !gameOver
  );

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
  // The opening hand is worth reading once, and only once: a refresh mid-game
  // should not push the board aside to tell you what you already know.
  const startingHandKey = startingDeal ? `superStartHand:${room.code}:${startingDeal.at}` : null;
  const [startingHandSeen, setStartingHandSeen] = useState(true);

  useEffect(() => {
    if (!startingHandKey) return;
    try {
      setStartingHandSeen(localStorage.getItem(startingHandKey) === '1');
    } catch {
      // blocked storage just means it shows again
      setStartingHandSeen(false);
    }
  }, [startingHandKey]);

  const showStartingHand = Boolean(
    startingDeal && rollOrderDone && !startingHandSeen && currentPlayer && startingDeal.hands[currentPlayer.id]
  );

  const dismissStartingHand = useCallback(() => {
    setStartingHandSeen(true);
    if (!startingHandKey) return;
    try {
      localStorage.setItem(startingHandKey, '1');
    } catch {
      // the dismissal still holds for this visit
    }
  }, [startingHandKey]);

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
      <div className="w-full hidden sm:flex items-center justify-between bg-[rgb(var(--c-surface))]/90 border-2 border-[rgb(var(--c-surface-3))] rounded-2xl px-4 py-2 mb-2 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐃</span>
          {/* On a phone the full title wrapped over five lines and pushed the
              board off the screen; the room code is already in the bar above. */}
          <div className="min-w-0 hidden sm:block">
            <h2 className="text-sm sm:text-base font-black rpg-text-gold tracking-wide truncate">
              ซุปเปอร์เศรษฐี คลาสสิก • SUPER MONOPOLY
            </h2>
            <p className="text-[10px] text-amber-300/80 font-bold truncate">
              ห้อง: <span className="font-mono text-yellow-400">{room.code}</span> | ทุนเริ่มต้น 15.00M | ลูกเต๋า 2 ลูก 🎲🎲
            </p>
          </div>
        </div>

        {/* Right Header: Rules & Current Turn Announcement */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="px-3 py-1.5 rounded-xl bg-mint hover:from-amber-600 hover:to-amber-500 border border-yellow-500/50 text-xs font-black text-[rgb(var(--c-on-accent))] shadow flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="ดูกฎและกติกาการเล่นซุปเปอร์เศรษฐี"
          >
            <BookOpen className="w-4 h-4 text-yellow-300" />
            <span className="hidden sm:inline">กติกาการเล่น</span>
          </button>

          <div className="flex items-center gap-2 bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-2))] px-3 py-1 rounded-xl">
            <Avatar
              src={currentTurnPlayer?.avatar_url}
              name={currentTurnPlayer?.display_name || 'Player'}
              size="sm"
              isTurn={true}
            />
            {/* The arrow over the avatar already says whose turn it is, so the
                caption is only worth its space on a wider screen. */}
            <div className="text-right hidden sm:block">
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
      {/* The ticker and its two buttons shared one line, which left the latest
          move cut off mid-word on a phone. They stack there instead. */}
      <div className="w-full bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-3))] rounded-2xl px-3 sm:px-4 py-2 mb-2.5 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 transition hover:border-amber-500/50">
        <div className="flex items-center gap-2 min-w-0 w-full sm:flex-1">
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
              style={{ color: logColor(gameLogs[0]?.color) }}
              onClick={() => setShowHistoryModal(true)}
              title="คลิกเพื่อเปิดดูประวัติการเดินทั้งหมด"
            >
              {gameLogs[0]?.text}
            </span>
          ) : (
            <span className="text-xs text-amber-400/80">ยังไม่มีประวัติการเดิน เริ่มเกมโดยการทอยลูกเต๋าได้เลย!</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          {gameLogs[0]?.time && (
            <span className="text-[10px] font-mono text-amber-400/80 hidden md:inline">
              {gameLogs[0].time}
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="px-2.5 py-1 rounded-xl bg-[rgb(var(--c-surface-2))] hover:bg-[rgb(var(--c-surface-3))] border border-[rgb(var(--c-line))] text-[11px] font-black text-amber-200 hover:text-[rgb(var(--c-ink))] flex items-center gap-1.5 transition active:scale-95 shadow cursor-pointer"
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
                            <span className="absolute -bottom-1 -right-1 text-[8px] font-black bg-amber-500 text-[rgb(var(--c-on-accent))] px-1 rounded-full border border-white">
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
                            <span className="text-[10px] text-amber-300/85">
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
                            <span className="text-xs font-black text-[rgb(var(--c-mint-label))] font-mono">
                              {formatMoneyM(playerCash)}
                            </span>
                            <span className="text-[9px] text-amber-400/80 font-bold">เงินสด</span>
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
          <div className="w-full flex items-center justify-end sm:justify-between pb-1 sm:pb-1.5 px-1">
            <span className="hidden sm:flex text-[11px] font-bold text-amber-300/80 items-center gap-1">
              <span>กระดานซุปเปอร์เศรษฐี</span>
            </span>

            <div className="flex items-center gap-1 bg-[rgb(var(--c-bg-deep))] p-0.5 rounded-xl border border-[rgb(var(--c-surface-2))]">
              <button
                type="button"
                onClick={() => setIs3DMode(true)}
                className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                  is3DMode
                    ? 'bg-mint text-[rgb(var(--c-on-accent))] shadow'
                    : 'text-[rgb(var(--c-ink-soft))] hover:text-[rgb(var(--c-ink))]'
                }`}
              >
                🧊 โหมด 3D
              </button>
              <button
                type="button"
                onClick={() => setIs3DMode(false)}
                className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                  !is3DMode
                    ? 'bg-mint text-[rgb(var(--c-on-accent))] shadow'
                    : 'text-[rgb(var(--c-ink-soft))] hover:text-[rgb(var(--c-ink))]'
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
            // On a phone this used to float over the board and cover the
            // squares behind it. It is a strip above the board there, and only
            // returns to the corner of the board where there is room for it.
            <div className="mb-1 flex flex-nowrap overflow-x-auto scrollbar-none gap-1 lg:mb-0 lg:overflow-visible lg:flex-wrap lg:absolute lg:top-2 lg:left-2 lg:z-20 lg:flex-col lg:items-stretch lg:pointer-events-none lg:max-w-[40%]">
          {orderedPlayers.slice(0, 8).map((seatPlayer, seatIdx) => {
              const colour = PLAYER_3D_COLORS[players.indexOf(seatPlayer) % PLAYER_3D_COLORS.length];
              const isSeatTurn = seatPlayer.id === currentTurnPlayer?.id;
              const seatCash = cash[seatPlayer.id] ?? 15;
              const seatJailed = (inJailTurns[seatPlayer.id] ?? 0) > 0;
              const seatProps = getPlayerPropertiesCount(seatPlayer.id);
              const seatHouses = Object.values(properties).filter(
                (pr) => pr.ownerId === seatPlayer.id && pr.houses > 0
              ).length;

              return (
                <div
                  key={seatPlayer.id}
                  className={`shrink-0 rounded-xl border-2 bg-[rgb(var(--c-surface))]/95 px-1.5 py-1 shadow-lg ${
                    isSeatTurn ? 'border-mint' : 'border-[rgb(var(--c-line))]'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {isSeatTurn && <span className="text-mint text-[9px] leading-none">▶</span>}
                    <span
                      className="w-2 h-2 rounded-full shrink-0 border border-[rgb(var(--c-line-strong))]"
                      style={{ backgroundColor: colour }}
                    />
                    <span className="text-[10px] font-black text-amber-50 truncate max-w-[72px]">
                      {seatPlayer.display_name}
                    </span>
                    {seatPlayer.id === room.host_id && <span className="text-[9px]">👑</span>}
                    {seatJailed && <span className="text-[9px]">⛓️</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-black font-mono ${
                        bankrupt[seatPlayer.id] ? 'text-rose-400' : 'text-emerald-300'
                      }`}
                    >
                      {bankrupt[seatPlayer.id] ? '💀' : formatMoneyM(seatCash)}
                    </span>
                    <span
                      className="text-[9px] font-black text-amber-300/85 flex items-center gap-0.5"
                      title={`ที่ดิน ${seatProps} แปลง · มีสิ่งปลูกสร้าง ${seatHouses} แปลง`}
                    >
                      🏠 {seatProps}
                      {seatHouses > 0 && <span className="text-sky-300">· 🏨 {seatHouses}</span>}
                    </span>
                  </div>
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
              rowBonus={rowBonus}
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
              rowBonus={rowBonus}
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
          !flightNotice &&
          !showFlightPicker &&
          !debtDecision &&
          !gameOver &&
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
                    ? 'bg-[rgb(var(--c-grape-soft))] border-[rgb(var(--c-grape))] text-[rgb(var(--c-ink))]'
                    : 'bg-[rgb(var(--c-surface))] border-[rgb(var(--c-line))] text-[rgb(var(--c-ink))]'
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
                  className="pointer-events-auto px-7 py-3.5 rounded-full font-black text-sm shadow-2xl active:scale-95 disabled:opacity-40 bg-[rgb(var(--c-sky-soft))] border-2 border-sky-400 text-sky-100"
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
              cannot show are kept here - and every one of them is optional,
              so on your own turn the panel drew an empty bordered box. */}
          {((isProxying && currentTurnPlayer) ||
            (canOfferProxy && currentTurnPlayer) ||
            (!isMyTurn && !isProxying)) && (
          <div className="bg-[rgb(var(--c-surface))] border-2 border-[rgb(var(--c-surface-3))] rounded-2xl p-3 shadow-xl">
            {/* Host standing in for an absent player */}
            {isProxying && currentTurnPlayer && (
              <div className="mb-2 px-3 py-2 rounded-2xl bg-[rgb(var(--c-grape-soft))] border-2 border-[rgb(var(--c-grape))] text-[rgb(var(--c-ink))] font-black text-xs flex items-center justify-center gap-2 shadow-lg">
                <span>👑</span>
                <span>กำลังเล่นแทน [{currentTurnPlayer.display_name}]</span>
              </div>
            )}

            {canOfferProxy && currentTurnPlayer && (
              <div className="mb-2 p-2.5 rounded-2xl bg-[rgb(var(--c-sky-soft))] border-2 border-purple-600/70 shadow-lg flex flex-col gap-1.5">
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
                <div className="py-3 px-2 rounded-xl bg-[rgb(var(--c-bg-deep))] border border-[rgb(var(--c-surface-2))] text-xs text-amber-300/85 font-bold text-center">
                  ⏳ รอ {currentTurnPlayer?.display_name} ทอยลูกเต๋า...
                </div>
              )
            )}
          </div>
          )}

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
                <span className="text-amber-400/80 text-center py-4">ยังไม่มีประวัติการเดิน</span>
              ) : (
                gameLogs.map((log, lI) => (
                  <div
                    key={lI}
                    className="p-2 rounded-xl bg-[rgb(var(--c-bg-deep))] border border-[rgb(var(--c-surface-2))] text-left leading-relaxed flex items-start justify-between gap-1.5 shadow-sm"
                  >
                    <span style={{ color: logColor(log.color) }} className="break-words">
                      {log.text}
                    </span>
                    <span className="text-[9px] text-amber-400/80 shrink-0 font-mono pt-0.5">
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
        rowBonus={rowBonus}
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
          <p className="text-sm font-black text-[rgb(var(--c-sky-label))]">
            คุณเดินมาถึง [{restNotice?.tileName}] ➜ ปลอดภัยจากค่าผ่านทาง แต่ต้องพัก 1 ตา
          </p>
          {restNotice?.wasDouble && (
            <p className="text-xs font-bold text-[rgb(var(--c-ink-soft))] px-3 py-2 rounded-xl bg-[rgb(var(--c-sky-soft))] border border-[rgb(var(--c-sky))]">
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

      {/* Landing on the airport books the seat; it is taken next turn. Saying so
          is the whole point - the map used to flash open here and disappear. */}
      <Modal
        isOpen={Boolean(flightNotice)}
        onClose={handleAcknowledgeFlight}
        title="✈️ ถึงสนามบินแล้ว"
      >
        <div className="flex flex-col gap-3 text-center">
          <span className="text-5xl">✈️</span>
          <p className="text-sm font-black text-[rgb(var(--c-sky-label))]">
            คุณเดินมาถึง [{flightNotice?.tileName}] ➜ จองตั๋วเรียบร้อย
          </p>
          <p className="text-xs font-bold text-[rgb(var(--c-ink-soft))] px-3 py-2 rounded-xl bg-[rgb(var(--c-sky-soft))] border border-[rgb(var(--c-sky))] leading-relaxed">
            <strong className="text-[rgb(var(--c-sky-label))]">ตาถัดไปของคุณจะได้เลือกบินไปช่องไหนก็ได้</strong>
            <br />
            แผนที่จะเปิดให้เลือกเองเมื่อถึงตาคุณ ไม่ต้องทอยเต๋า
          </p>
          <p className="text-[11px] font-bold text-amber-200/80">
            ถ้าทอยได้แต้มคู่แล้วตกสนามบิน จะได้บินทันทีโดยไม่ต้องรอ
          </p>
          <button
            type="button"
            onClick={handleAcknowledgeFlight}
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
      {/* The end of the game used to be a dead end: a card with no close that
          worked and nothing to press. */}
      <Modal
        isOpen={gameOver && !endGameDismissed}
        onClose={() => setEndGameDismissed(true)}
        title="🏆 จบเกม"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-6xl">{endWinner ? '🏆' : '💀'}</span>
          <span className="text-lg font-black text-[rgb(var(--c-butter-label))]">
            {endWinner
              ? players.find((p) => p.id === endWinner)?.display_name || 'ผู้ชนะ'
              : 'ไม่มีผู้ชนะ'}
          </span>
          <span className="text-xs font-bold text-[rgb(var(--c-ink-soft))]">
            {endWinner
              ? 'เป็นคนสุดท้ายที่ยังไม่ล้มละลาย · ชนะการแข่งขันนี้!'
              : 'ทุกคนล้มละลายหมด · จบเกมโดยไม่มีผู้ชนะ'}
          </span>
          <div className="w-full flex flex-col gap-1.5 mt-1">
            {orderedPlayers.map((p) => (
              <div
                key={p.id}
                className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-black ${
                  p.id === endWinner
                    ? 'bg-[rgb(var(--c-butter-soft))] border-[rgb(var(--c-butter))] text-[rgb(var(--c-butter-label))]'
                    : 'bg-[rgb(var(--c-bg-deep))] border-[rgb(var(--c-surface-2))] text-[rgb(var(--c-ink-soft))]'
                }`}
              >
                <span className="truncate">
                  {p.id === endWinner ? '🏆 ' : bankrupt[p.id] ? '💀 ' : ''}
                  {p.display_name}
                </span>
                <span className="font-mono shrink-0">
                  {bankrupt[p.id] ? 'ล้มละลาย' : formatMoneyM(cash[p.id] ?? 0)}
                </span>
              </div>
            ))}
          </div>

          <div className="w-full flex flex-col gap-2 mt-2">
            {isHost && onReturnToLobby ? (
              <button
                type="button"
                onClick={handlePlayAgain}
                className="wood-btn-gold w-full py-3 rounded-2xl text-sm font-black shadow-lg active:scale-95"
              >
                🔄 เล่นเกมใหม่ (กลับห้องรอ)
              </button>
            ) : (
              <span className="text-[11px] font-bold text-[rgb(var(--c-ink-faint))]">
                รอหัวหน้าห้องเริ่มเกมใหม่
              </span>
            )}
            <button
              type="button"
              onClick={() => setEndGameDismissed(true)}
              className="w-full py-2.5 rounded-2xl text-xs font-black bg-[rgb(var(--c-surface-2))] border border-[rgb(var(--c-line))] text-[rgb(var(--c-ink-soft))] active:scale-95"
            >
              ปิดหน้าต่าง (ดูกระดานต่อ)
            </button>
          </div>
        </div>
      </Modal>

      {/* Somebody is out. Said plainly, once, to everyone - the feed line went
          past while the table was still working out who was left. */}
      <Modal
        isOpen={showBust}
        onClose={() => setDismissedBustAt(bankruptcyNotice?.at ?? null)}
        title="💀 มีคนล้มละลาย"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-5xl">💀</span>
          <span className="text-lg font-black text-[rgb(var(--c-berry-label))]">
            {bankruptcyNotice?.name}
          </span>
          <span className="text-xs font-bold text-[rgb(var(--c-ink-soft))]">
            {bankruptcyNotice?.playerId === currentPlayer?.id
              ? 'คุณล้มละลายและออกจากเกมแล้ว'
              : 'ล้มละลายและออกจากเกมแล้ว'}
          </span>
          <span className="text-[11px] font-bold text-[rgb(var(--c-ink-faint))] px-3 py-2 rounded-xl bg-[rgb(var(--c-surface-2))] border border-[rgb(var(--c-line))]">
            สาเหตุ: {bankruptcyNotice?.cause}
            <br />
            ที่ดินทั้งหมดกลับมาเป็นที่ว่าง · เหลือผู้เล่นอีก{' '}
            {players.filter((p) => !bankrupt[p.id]).length} คน
          </span>
          <button
            type="button"
            onClick={() => setDismissedBustAt(bankruptcyNotice?.at ?? null)}
            className="wood-btn-gold w-full py-3 rounded-2xl text-sm font-black shadow-lg active:scale-95"
          >
            รับทราบ
          </button>
        </div>
      </Modal>

      {/* Where to? */}
      <StartingHandModal
        isOpen={showStartingHand}
        deal={startingDeal}
        players={players}
        myId={currentPlayer?.id || null}
        onClose={dismissStartingHand}
      />

      <FlightPickerModal
        isOpen={showFlightPicker}
        fromIndex={currentPlayer ? positions[currentPlayer.id] ?? 0 : 0}
        properties={properties}
        players={players}
        myId={currentPlayer?.id || null}
        rowBonus={rowBonus}
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
            <div className="py-8 text-center text-amber-400/80 text-xs font-bold">
              ยังไม่มีประวัติการเดินในเกมนี้
            </div>
          ) : (
            gameLogs.map((log, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-[rgb(var(--c-bg-deep))] border border-[rgb(var(--c-surface-2))] flex items-start justify-between gap-2 shadow-sm"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <span className="text-xs text-amber-400/80 font-mono shrink-0 pt-0.5">
                    #{gameLogs.length - idx}
                  </span>
                  <span
                    className="text-xs font-bold leading-relaxed break-words"
                    style={{ color: logColor(log.color) }}
                  >
                    {log.text}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-amber-400/80 shrink-0 bg-[rgb(var(--c-surface))] px-2 py-0.5 rounded-lg border border-[rgb(var(--c-surface-2))]">
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
