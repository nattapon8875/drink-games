import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { BaseGameProps } from '@/types/game';
import {
  SuperMonopolyGameState,
  DiceRollState,
  PropertyOwnership,
  CardAction,
  SuperPropertyTile,
  PlayerRecord,
} from '@/types/database';
import {
  SUPER_MONOPOLY_TILES,
  CHEST_CARDS,
  CHANCE_CARDS,
  drawFromDeck,
  formatMoneyM,
  HOTEL_TILE_INDICES,
  UTILITY_TILE_INDICES,
  maxHousesForVisits,
  visitMultiplier,
  MAX_VISIT_MULTIPLIER,
  INITIAL_CASH_M,
  RowBonus,
  rowOfTile,
  rowMultiplierFor,
  recomputeRowBonus,
  ROW_NAMES,
  rowBonusFor,
  computeRent,
} from './superMonopolyData';
import { sfx } from '@/lib/sound';
import confetti from 'canvas-confetti';
import { showToast } from '@/lib/alerts';
import { PenaltyNotice } from './PenaltyModal';
import { RentReceipt } from './RentReceiptModal';
import { StartingDeal } from './StartingHandModal';

// Buying your way out of jail costs a turn's worth of nothing if it is free, and
// a fortune if it is steep. Half a million is roughly two bare-land rents.
const JAIL_BAIL_M = 0.5;
const SALARY_M = 2.0; // 2M for passing GO


// Rent for landing on someone else's tile, including the utility and hotel-chain rules.
// Half of everything sunk into a square - the land plus whatever was built on
// it - which is what the bank pays to take it back.
function mortgageValueOf(
  tile: SuperPropertyTile | undefined,
  ownership: PropertyOwnership | undefined
): number {
  if (!tile || !ownership || tile.type !== 'property') return 0;
  const built =
    Math.min(ownership.houses, 3) * (tile.houseCost ?? 0.8) +
    (ownership.houses === 4 ? tile.hotelCost ?? 2.0 : 0);
  return ((tile.cost ?? 0) + built) / 2;
}

// Everything this player could raise by handing the lot back.
function raisableFor(
  playerId: string,
  props: Record<number, PropertyOwnership>
): number {
  return Object.entries(props).reduce((sum, [idxStr, own]) => {
    if (own.ownerId !== playerId) return sum;
    return sum + mortgageValueOf(SUPER_MONOPOLY_TILES[Number(idxStr)], own);
  }, 0);
}

// Sell back the cheapest squares first, only as many as the debt needs.
function mortgageUntil(
  playerId: string,
  props: Record<number, PropertyOwnership>,
  needed: number
): { props: Record<number, PropertyOwnership>; raised: number; soldNames: string[] } {
  const mine = Object.entries(props)
    .filter(([, own]) => own.ownerId === playerId)
    .map(([idxStr, own]) => ({
      index: Number(idxStr),
      value: mortgageValueOf(SUPER_MONOPOLY_TILES[Number(idxStr)], own),
    }))
    .sort((a, b) => a.value - b.value);

  const next = { ...props };
  let raised = 0;
  const soldNames: string[] = [];
  for (const item of mine) {
    if (raised >= needed) break;
    delete next[item.index];
    raised += item.value;
    soldNames.push(SUPER_MONOPOLY_TILES[item.index]?.name || String(item.index));
  }
  return { props: next, raised, soldNames };
}

// Whose turn comes after this one, skipping anyone who is out of the game.
function nextActiveAfter(
  list: PlayerRecord[],
  fromId: string | null | undefined,
  bankrupt: Record<string, boolean>
): PlayerRecord | null {
  if (list.length === 0) return null;
  const start = Math.max(0, list.findIndex((p) => p.id === fromId));
  for (let step = 1; step <= list.length; step++) {
    const candidate = list[(start + step) % list.length];
    if (!bankrupt[candidate.id]) return candidate;
  }
  return null;
}

// How many times a bot may roll in one turn. Doubles roll again, so this is
// only a stop against a turn that never ends - six is about one turn in eight
// thousand, where two was one turn in six.
const BOT_MAX_ROLLS_PER_TURN = 6;

export function useSuperMonopolyEngine(props: BaseGameProps) {
  const { room, players, currentPlayer, isHost, onUpdateGameState, onNextTurn, onUpdatePlayerDrink } = props;

  // Extract game_state with safe defaults (Realtime Single Source of Truth like useMonopolyEngine)
  const rawState = room.game_state || {};
  const positions: Record<string, number> = rawState.positions || {};
  const properties: Record<number, PropertyOwnership> = rawState.properties || {};
  const cash: Record<string, number> = rawState.cash || {};
  const inJailTurns: Record<string, number> = rawState.inJailTurns || {};
  const restTurns: Record<string, number> = rawState.restTurns || {};
  // Who is holding a boarding pass: landing on the airport without a double
  // books the flight for their next turn instead of taking it right away.
  const pendingFlights: Record<string, boolean> = rawState.pendingFlights || {};
  // Which side of the board is paying its holder a bonus right now. Only ever
  // one, and it moves to whoever completed a side most recently.
  const rowBonus: RowBonus | null = rawState.rowBonus || null;
  // The hands dealt at the start, kept so the summary can be shown once.
  const startingDeal: StartingDeal | null = rawState.startingDeal || null;
  // Out of the game: no token, no turn, and their land is back on the market.
  const bankrupt: Record<string, boolean> = rawState.bankrupt || {};
  const winnerId: string | null = (rawState.winnerId as string | null) || null;
  const gameLogs: Array<{ text: string; time: string; color?: string }> = rawState.gameLogs || [];
  const rentReceipt: RentReceipt | null = (rawState.rentReceipt as RentReceipt | null) || null;
  // Going out of the game was only ever a line in the feed, which scrolls away
  // while the table is still working out who is left.
  const bankruptcyNotice: { playerId: string; name: string; cause: string; at: number } | null =
    (rawState.bankruptcyNotice as { playerId: string; name: string; cause: string; at: number } | null) || null;

  // Synchronized across all screens via Supabase Realtime
  const isRolling = Boolean(rawState.isRolling);
  const isMoving = Boolean(rawState.isMoving);
  const serverDice: [number, number] = rawState.dice || [1, 1];
  const activeStepTileIndex: number | null = rawState.activeStepTileIndex ?? null;
  // Who that stepping square belongs to. Without it the board drew whoever's
  // turn it happened to be on the walker's square, so a turn that changed
  // mid-walk dragged the wrong token along with it.
  const activeStepPlayerId: string | null = (rawState.activeStepPlayerId as string | null) ?? null;

  // Local rapid tumbling animation while isRolling is true
  const [shuffleDice, setShuffleDice] = useState<[number, number]>([1, 1]);
  useEffect(() => {
    if (!isRolling) return;
    const interval = setInterval(() => {
      setShuffleDice([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]);
    }, 80);
    return () => clearInterval(interval);
  }, [isRolling]);

  const dice: [number, number] = isRolling ? shuffleDice : serverDice;

  const [activePropertyModal, setActivePropertyModal] = useState<SuperPropertyTile | null>(null);
  const [activeCard, setActiveCard] = useState<CardAction | null>(null);
  const [activePenaltyModal, setActivePenaltyModal] = useState<PenaltyNotice | null>(null);
  // Being sent to jail on a double used to just end the turn while the dice
  // still said "double!", which reads like another roll is coming. Say it.
  const [jailNotice, setJailNotice] = useState<{ tileName: string; wasDouble: boolean } | null>(null);
  const [restNotice, setRestNotice] = useState<{ tileName: string; wasDouble: boolean } | null>(null);
  // Booking a seat is not the same as taking it. Landing on the airport without
  // a double used to flash the map open for the instant before the turn ended,
  // which read as the flight being taken away again.
  const [flightNotice, setFlightNotice] = useState<{ tileName: string } | null>(null);
  // Open while the traveller is choosing where to land.
  const [showFlightPicker, setShowFlightPicker] = useState(false);
  // A bill the player cannot cover in cash: sell up, or go out.
  const [debtDecision, setDebtDecision] = useState<{
    amount: number;
    creditorId: string | null;
    creditorName: string | null;
    tileName: string;
    tileIcon: string;
    reason: string;
    cashNow: number;
    raisable: number;
    canCover: boolean;
  } | null>(null);
  const [hasRolledThisTurn, setHasRolledThisTurn] = useState<boolean>(false);
  const [isDouble, setIsDouble] = useState<boolean>(false);

  // Turn management ref to prevent duplicate or frozen bot turns
  // A teleport card drops you on a new tile, and that tile has to be resolved
  // too - otherwise you warp onto empty land and are never offered the purchase.
  const [pendingTeleportTile, setPendingTeleportTile] = useState<number | null>(null);
  // A card that hands you the choice of where to go. The picker cannot open
  // while the card is still on screen, so it waits here until the card closes.
  const [pendingCardFlight, setPendingCardFlight] = useState<boolean>(false);

  const handledTurnKeyRef = useRef<string>('');
  // Whether a bot turn is actually in flight. Without this, a turn torn down
  // mid-flight stays blocked forever: the key still matches, so the effect
  // refuses to start it again and the bot freezes with no watchdog left.
  const botTurnRunningRef = useRef<boolean>(false);
  const botWatchdogTimerRef = useRef<NodeJS.Timeout | null>(null);
  // When the running bot turn last wrote anything.
  const botProgressAtRef = useRef<number>(0);

  // Ordered players based on initial roll order scores / database turn_order
  const orderedPlayers = useMemo<PlayerRecord[]>(() => {
    const scores = rawState.roll_order_scores;
    return [...players].sort((a, b) => {
      const rankA = scores?.[a.id]?.rank ?? (a.turn_order ?? 99);
      const rankB = scores?.[b.id]?.rank ?? (b.turn_order ?? 99);
      return rankA - rankB;
    });
  }, [players, rawState.roll_order_scores]);

  // The bot turn effect must not depend on this array. It is rebuilt whenever the
  // roster is refetched, and its cleanup aborts whatever bot turn is in flight.
  const orderedPlayersRef = useRef<PlayerRecord[]>(orderedPlayers);
  orderedPlayersRef.current = orderedPlayers;

  // Whose turn it is comes from the room, never from the roster. The room
  // update and the players update arrive on different polls, so there are
  // renders where the roster does not contain the player whose turn it is - and
  // the fallback below is then simply whoever sorts first. Reading the turn off
  // that fallback told the first player it was their turn in the middle of
  // someone else's walk, with the action reading "walking..." because the board
  // really was moving. It showed up on phones first, where the slower polling
  // leaves the two updates further apart.
  const turnPlayerId = room.current_turn_player_id || null;
  const turnPlayerRow = orderedPlayers.find((p) => p.id === turnPlayerId) || null;
  // Only for display, so a name is shown rather than a blank while the roster catches up.
  const currentTurnPlayer = turnPlayerRow || orderedPlayers[0];

  const isMyTurn = Boolean(currentPlayer && turnPlayerId && currentPlayer.id === turnPlayerId);
  const isBotTurn = Boolean(
    turnPlayerId && (turnPlayerId.startsWith('bot-') || turnPlayerRow?.line_user_id === 'bot')
  );

  const isCurrentPlayerInJail = Boolean(turnPlayerId && (inJailTurns[turnPlayerId] ?? 0) > 0);
  const isCurrentPlayerResting = Boolean(turnPlayerId && (restTurns[turnPlayerId] ?? 0) > 0);
  const isCurrentPlayerBoarding = Boolean(turnPlayerId && pendingFlights[turnPlayerId]);

  // Host standing in for a player who is away. Everything the turn owner could
  // do is unlocked for the host while this is on, and it clears itself as soon
  // as the turn moves so it can never leak into the next player's turn.
  const [isProxying, setIsProxying] = useState(false);
  const canActThisTurn = isMyTurn || (isHost && isProxying);


  // Synchronized sound effects across all clients based on room.game_state
  const prevIsRollingRef = useRef(isRolling);
  const prevStepTileRef = useRef<number | null>(activeStepTileIndex);

  useEffect(() => {
    if (!prevIsRollingRef.current && isRolling) {
      sfx.playDiceRoll();
    } else if (prevIsRollingRef.current && !isRolling) {
      sfx.playTileLand();
    }
    prevIsRollingRef.current = isRolling;
  }, [isRolling]);

  useEffect(() => {
    if (activeStepTileIndex !== null && activeStepTileIndex !== prevStepTileRef.current) {
      sfx.playStep();
    }
    prevStepTileRef.current = activeStepTileIndex;
  }, [activeStepTileIndex]);

  // Whose turn we have already handed over. Several paths end a turn - a modal
  // being acknowledged, a delayed timer after a purchase, the walk finishing
  // with nothing to decide - and two of them firing meant the feed showed the
  // handover twice and the turn skipped a player.
  const endedTurnRef = useRef<string>('');
  // True from the moment a turn is handed over until the new turn actually
  // arrives. Without it the action flashed "roll the dice" on the way out:
  // handing over clears hasRolledThisTurn immediately, but the turn id takes a
  // round trip to change, so for a beat it still looked like your turn and you
  // had not rolled yet.
  const [isEndingTurn, setIsEndingTurn] = useState(false);

  // Reset local turn modal state when current turn player changes
  useEffect(() => {
    // Declared before the bot effect, so this runs first on a turn change and
    // lets the same bot take its next turn instead of being skipped forever.
    handledTurnKeyRef.current = '';
    setIsProxying(false);
    setHasRolledThisTurn(false);
    setIsDouble(false);
    setActivePropertyModal(null);
    setActiveCard(null);
    setActivePenaltyModal(null);
    setJailNotice(null);
    setRestNotice(null);
    setFlightNotice(null);
    setShowFlightPicker(false);
    setDebtDecision(null);
    setIsEndingTurn(false);
    endedTurnRef.current = '';
  }, [room.current_turn_player_id]);

  // Ensure cash initialized for all players
  useEffect(() => {
    if (!isHost || players.length === 0) return;
    let needInit = false;
    const initialCash = { ...cash };
    const initialPositions = { ...positions };

    players.forEach((p) => {
      if (initialCash[p.id] === undefined) {
        initialCash[p.id] = INITIAL_CASH_M;
        needInit = true;
      }
      if (initialPositions[p.id] === undefined) {
        initialPositions[p.id] = 0;
        needInit = true;
      }
    });

    if (needInit) {
      onUpdateGameState({
        cash: initialCash,
        positions: initialPositions,
      });
    }
  }, [players, isHost, cash, positions, onUpdateGameState]);

  // The history as of right now, not as of the render this callback was built
  // in. A walk writes its lines and immediately opens a modal; acknowledging it
  // added the next line onto the snapshot from before the walk, which dropped
  // the rent and penalty lines that had just been written.
  const gameLogsRef = useRef(gameLogs);
  gameLogsRef.current = gameLogs;

  // Closing the card has to judge ownership on the live board: a purchase made
  // moments earlier must not be reported as a refusal.
  const propertiesRef = useRef(properties);
  propertiesRef.current = properties;
  // The live cash table. A walk spreads `cash` on every step, and `cash` is the
  // snapshot from the render the roll was clicked on - so a payment another
  // client made while the token was walking would be spread away again. The
  // walker's own balance still comes from its running total; only the base
  // everyone else sits in is taken fresh.
  const cashRef = useRef(cash);
  cashRef.current = cash;

  const addLog = useCallback(
    (text: string, color?: string, currentLogs?: Array<{ text: string; time: string; color?: string }>) => {
      const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const base = currentLogs ?? gameLogsRef.current;
      const newLogs = [{ text, time, color }, ...base.slice(0, 50)];
      return newLogs;
    },
    []
  );

  // Says out loud when a side of the board changes hands, gains a square, or
  // is broken up. Without it the rent simply changes and nobody knows why.
  const rowBonusAnnouncement = (
    before: RowBonus | null | undefined,
    after: RowBonus | null,
    logs: Array<{ text: string; time: string; color?: string }>
  ) => {
    const same =
      (!before && !after) ||
      (before &&
        after &&
        before.row === after.row &&
        before.ownerId === after.ownerId &&
        before.count === after.count);
    if (same) return logs;

    const nameOf = (id: string) =>
      orderedPlayersRef.current.find((p) => p.id === id)?.display_name || 'ผู้เล่น';

    if (!after) {
      return addLog('🎏 ไม่มีใครครองแถวไหนครบ 3 ช่องแล้ว โบนัสแถวถูกปิด', '#9ca3af', logs);
    }

    const moved = !before || before.row !== after.row || before.ownerId !== after.ownerId;
    return addLog(
      `🎏 ${moved ? 'โบนัสแถวย้ายไป' : 'โบนัสแถวแรงขึ้น'} [${ROW_NAMES[after.row]}] ของ ${nameOf(
        after.ownerId
      )} — ถือ ${after.count} ช่อง ค่าผ่านทางจังหวัดในแถวนี้คูณ x${rowMultiplierFor(after.count)}`,
      '#a855f7',
      logs
    );
  };

  // End Turn & Pass to Next Player
  const handleEndTurn = useCallback(async () => {
    const endingTurnId = currentTurnPlayer?.id;
    if (endingTurnId) {
      if (endedTurnRef.current === endingTurnId) return;
      endedTurnRef.current = endingTurnId;
    }

    setIsEndingTurn(true);
    setActivePropertyModal(null);
    setActiveCard(null);
    setActivePenaltyModal(null);
    setHasRolledThisTurn(false);
    setIsDouble(false);

    if (orderedPlayers.length === 0) return;

    // Skip anyone who is out of the game.
    const nextPlayer = nextActiveAfter(orderedPlayers, currentTurnPlayer?.id, bankrupt);
    if (!nextPlayer) return;

    const newLogs = addLog(`🎲 ส่งตาให้ [${nextPlayer.display_name}]`, '#93c5fd');

    await onUpdateGameState({
      gameLogs: newLogs,
      isRolling: false,
      isMoving: false,
      activeStepTileIndex: null,
      drawnCard: null,
    });
    await onNextTurn(nextPlayer.id);
  }, [orderedPlayers, currentTurnPlayer, addLog, gameLogs, onUpdateGameState, onNextTurn]);

  // Execute walking and landing logic for Human player (Synchronized step-by-step across all clients)
  const executeHumanWalk = useCallback(
    async (d1: number, d2: number) => {
      const totalRoll = d1 + d2;
      const isDoubleRoll = d1 === d2;

      const startPos = positions[currentTurnPlayer.id] ?? 0;
      let currentStep = 0;
      let currentStepPos = startPos;
      let playerCash = cash[currentTurnPlayer.id] ?? INITIAL_CASH_M;
      let passedGoInWalk = false;

      const stepInterval = setInterval(async () => {
        currentStep++;
        currentStepPos = (currentStepPos + 1) % 40;

        if (currentStepPos === 0) {
          passedGoInWalk = true;
          playerCash += SALARY_M;
          sfx.playSuccess();
        }

        const stepPositions = { ...positions, [currentTurnPlayer.id]: currentStepPos };
        await onUpdateGameState({
          positions: stepPositions,
          activeStepTileIndex: currentStepPos,
          activeStepPlayerId: currentTurnPlayer.id,
          isRolling: false,
          isMoving: true,
          cash: { ...cashRef.current, [currentTurnPlayer.id]: playerCash },
        });

        // Destination reached
        if (currentStep >= totalRoll) {
          clearInterval(stepInterval);
          sfx.playTileLand();

          const finalPos = currentStepPos;
          const targetTile = SUPER_MONOPOLY_TILES[finalPos];

          let moveLog = `🎯 ${currentTurnPlayer.display_name} ทอยได้ [${d1}][${d2}] (${totalRoll} แต้ม) ➔ ตกที่ [${targetTile.name}]`;
          if (passedGoInWalk) {
            moveLog += ` (ผ่านจุดเริ่มต้น รับ +${formatMoneyM(SALARY_M)})`;
          }
          if (isDoubleRoll) {
            // Jail and the rest stop cancel the extra roll, so the line should
            // not celebrate one the player is not getting.
            moveLog +=
              targetTile.type === 'airport'
                ? ' (แต้มคู่ ➜ บินได้ทันที)'
                : targetTile.type === 'jail'
                ? ' (แต้มคู่ แต่ติดคุก ไม่ได้ทอยต่อ)'
                : targetTile.type === 'parking'
                ? ' (แต้มคู่ แต่ต้องพัก ไม่ได้ทอยต่อ)'
                : ' 🎉 แต้มคู่ (Double)!';
          }

          let newLogs = addLog(moveLog, '#f59e0b');
          const updatedPositions = { ...positions, [currentTurnPlayer.id]: finalPos };
          const updatedCash = { ...cashRef.current, [currentTurnPlayer.id]: playerCash };
          const updatedJail = { ...inJailTurns, [currentTurnPlayer.id]: 0 };
          const updatedRest = { ...restTurns, [currentTurnPlayer.id]: 0 };
          const updatedFlights = { ...pendingFlights, [currentTurnPlayer.id]: false };
          // Only set when the landing changed the land itself - a visit counted
          // or, later, a purchase.
          let updatedProperties: Record<number, PropertyOwnership> | null = null;
          let updatedChestDeck: string[] | undefined;
          let updatedChanceDeck: string[] | undefined;
          // Everyone should see what was drawn, not just the person who drew it
          let drawnCardBroadcast: { cardId: string; playerId: string; at: number } | null = null;
          // The owner of the land only saw their balance quietly go up. Tell them
          // who paid, how much, and what they are holding now.
          let rentReceiptBroadcast: RentReceipt | null = null;

          // Wait 500ms on final tile before showing action/modal
          setTimeout(async () => {
            await onUpdateGameState({
              positions: updatedPositions,
              cash: updatedCash,
              inJailTurns: updatedJail,
              restTurns: updatedRest,
              activeStepTileIndex: null,
              isRolling: false,
              isMoving: false,
              gameLogs: newLogs,
            });

            let requiresUserModalAction = false;

            // Handle landing tile
            if (targetTile.type === 'property') {
              const ownership = properties[finalPos];
              if (!ownership) {
                // UNOWNED PROPERTY -> SHOW BUY MODAL
                setActivePropertyModal(targetTile);
                requiresUserModalAction = true;
              } else if (ownership.ownerId === currentTurnPlayer.id) {
                // Landing on your own land is what unlocks building: the first
                // visit puts up two houses at once, the second adds the third,
                // the third buys the hotel. A hotel or a utility cannot be built
                // on, so the visit raises its rent multiplier instead.
                const visits = (ownership.visits || 0) + 1;
                updatedProperties = {
                  ...properties,
                  [finalPos]: { ...ownership, visits },
                };
                sfx.playSuccess();
                if (targetTile.isUtility) {
                  const boost = visitMultiplier(visits);
                  newLogs = addLog(
                    `🏨 ${currentTurnPlayer.display_name} แวะกิจการของตัวเอง [${targetTile.name}] ➜ ค่าผ่านทางคูณ x${boost}${
                      boost >= MAX_VISIT_MULTIPLIER ? ' (สูงสุดแล้ว)' : ''
                    }`,
                    '#06b6d4',
                    newLogs
                  );
                } else {
                  const cap = maxHousesForVisits(visits);
                  newLogs = addLog(
                    `🏡 ${currentTurnPlayer.display_name} เดินมาตกที่ดินของตัวเอง [${targetTile.name}] (ครั้งที่ ${visits}) ➜ พัฒนาได้ถึง${
                      cap >= 4 ? 'โรงแรม' : `บ้าน ${cap} หลัง`
                    }`,
                    '#06b6d4',
                    newLogs
                  );
                }
                setActivePropertyModal(targetTile);
                requiresUserModalAction = true;
              } else if (ownership.ownerId !== currentTurnPlayer.id) {
                // Pay Rent
                const owner = players.find((p) => p.id === ownership.ownerId);
                const rentAmount = computeRent(targetTile, ownership, properties, rowBonus);

                if (playerCash < rentAmount) {
                  // Cannot cover it in cash: offer the sale, or the exit.
                  const raisable = raisableFor(currentTurnPlayer.id, properties);
                  setDebtDecision({
                    amount: rentAmount,
                    creditorId: owner?.id ?? null,
                    creditorName: owner?.display_name ?? null,
                    tileName: targetTile.name,
                    tileIcon: targetTile.icon || '🏨',
                    reason: `ค่าผ่านทางที่ดินของ [${owner?.display_name || 'เจ้าของที่ดิน'}]`,
                    cashNow: playerCash,
                    raisable,
                    canCover: playerCash + raisable >= rentAmount,
                  });
                  requiresUserModalAction = true;
                  newLogs = addLog(
                    `⚠️ ${currentTurnPlayer.display_name} เงินสดไม่พอจ่ายค่าผ่านทาง ${formatMoneyM(rentAmount)}`,
                    '#f97316',
                    newLogs
                  );
                } else {

                const actualRent = rentAmount;
                const remainingCash = playerCash - rentAmount;
                updatedCash[currentTurnPlayer.id] = remainingCash;
                if (owner) {
                  updatedCash[owner.id] = (updatedCash[owner.id] ?? INITIAL_CASH_M) + actualRent;
                }

                sfx.playDrinkPenalty();
                newLogs = addLog(
                  `💸 ${currentTurnPlayer.display_name} จ่ายค่าผ่านทางให้ ${owner?.display_name || 'เจ้าของ'} ${formatMoneyM(actualRent)} (เงินเหลือ ${formatMoneyM(remainingCash)})`,
                  '#ef4444',
                  newLogs
                );

                if (owner) {
                  rentReceiptBroadcast = {
                    ownerId: owner.id,
                    payerName: currentTurnPlayer.display_name,
                    tileName: targetTile.name,
                    tileIcon: targetTile.icon || '🏨',
                    amount: actualRent,
                    ownerCashAfter: updatedCash[owner.id],
                    at: Date.now(),
                  };
                }

                // Show Penalty Modal for Human to acknowledge
                setActivePenaltyModal({
                  type: 'rent',
                  tileName: targetTile.name,
                  tileIcon: targetTile.icon || '🏨',
                  reason: `คุณเดินมาตกที่ดินของ [${owner?.display_name || 'เจ้าของที่ดิน'}]`,
                  amount: actualRent,
                  recipientName: owner?.display_name || 'เจ้าของที่ดิน',
                  previousCash: playerCash,
                  remainingCash: remainingCash,
                  houses: ownership.houses,
                  isUtility: targetTile.isUtility,
                });
                requiresUserModalAction = true;
                }
              }
            } else if (targetTile.type === 'chest') {
              const drawn = drawFromDeck(rawState.chestDeck, CHEST_CARDS);
              const card = drawn.card;
              updatedChestDeck = drawn.nextDeck;
              drawnCardBroadcast = { cardId: card.id, playerId: currentTurnPlayer.id, at: Date.now() };
              setActiveCard(card);
              requiresUserModalAction = true;
              sfx.playCardDraw();
              if (card.rewardMoney) updatedCash[currentTurnPlayer.id] += card.rewardMoney;
              if (card.collectFromAll) {
                players.forEach((other) => {
                  if (other.id !== currentTurnPlayer.id) {
                    updatedCash[other.id] = Math.max(0, (updatedCash[other.id] ?? INITIAL_CASH_M) - card.collectFromAll!);
                    updatedCash[currentTurnPlayer.id] += card.collectFromAll!;
                  }
                });
              }
              if (card.payToAll) {
                players.forEach((other) => {
                  if (other.id !== currentTurnPlayer.id) {
                    updatedCash[other.id] = (updatedCash[other.id] ?? INITIAL_CASH_M) + card.payToAll!;
                    updatedCash[currentTurnPlayer.id] = Math.max(0, updatedCash[currentTurnPlayer.id] - card.payToAll!);
                  }
                });
              }
              let chestDesc = `🎁 ${currentTurnPlayer.display_name} เปิดหีบ: [${card.title}]`;
              if (card.rewardMoney && card.rewardMoney > 0) {
                chestDesc += ` ➔ ได้รับ +${formatMoneyM(card.rewardMoney)} (รวม ${formatMoneyM(updatedCash[currentTurnPlayer.id])})`;
              } else if (card.rewardMoney && card.rewardMoney < 0) {
                chestDesc += ` ➔ เสียเงิน ${formatMoneyM(Math.abs(card.rewardMoney))} (เหลือ ${formatMoneyM(updatedCash[currentTurnPlayer.id])})`;
              } else if (card.collectFromAll) {
                chestDesc += ` ➔ เก็บเงินจากเพื่อนทุกคน คนละ ${formatMoneyM(card.collectFromAll)}`;
              } else if (card.payToAll) {
                chestDesc += ` ➜ จ่ายให้เพื่อนทุกคน คนละ ${formatMoneyM(card.payToAll)} (เหลือ ${formatMoneyM(updatedCash[currentTurnPlayer.id])})`;
              }
              newLogs = addLog(chestDesc, '#ec4899', newLogs);
            } else if (targetTile.type === 'chance') {
              const drawn = drawFromDeck(rawState.chanceDeck, CHANCE_CARDS);
              const card = drawn.card;
              updatedChanceDeck = drawn.nextDeck;
              drawnCardBroadcast = { cardId: card.id, playerId: currentTurnPlayer.id, at: Date.now() };
              setActiveCard(card);
              requiresUserModalAction = true;
              sfx.playCardDraw();
              let teleportPassedGo = false;
              if (card.rewardMoney) {
                playerCash += card.rewardMoney;
                updatedCash[currentTurnPlayer.id] = playerCash;
              }
              if (card.teleportToIndex !== undefined) {
                updatedPositions[currentTurnPlayer.id] = card.teleportToIndex;
                // A card move goes forward round the board, so a destination
                // behind you means you went past the start. Every one of these
                // cards has always promised that salary in its text and none of
                // them ever paid it.
                if (card.teleportToIndex <= finalPos) {
                  playerCash += SALARY_M;
                  updatedCash[currentTurnPlayer.id] = playerCash;
                  teleportPassedGo = true;
                }
                const destTile = SUPER_MONOPOLY_TILES[card.teleportToIndex];
                if (destTile?.type === 'property') {
                  setPendingTeleportTile(card.teleportToIndex);
                } else if (destTile?.type === 'airport') {
                  // Dropped at the airport by a card: the same deal as walking
                  // in without a double - the seat is booked for the next turn.
                  // Without this the card left you standing on the runway with
                  // no flight at all.
                  updatedFlights[currentTurnPlayer.id] = true;
                }
              }
              if (card.chooseDestination && canActThisTurn) {
                setPendingCardFlight(true);
                requiresUserModalAction = true;
              }
              if (card.goJail) {
                updatedPositions[currentTurnPlayer.id] = 10;
                updatedJail[currentTurnPlayer.id] = 1;
              }
              let chanceDesc = `⛩️ ${currentTurnPlayer.display_name} เปิดดวง: [${card.title}]`;
              if (card.rewardMoney && card.rewardMoney > 0) {
                chanceDesc += ` ➔ ได้รับ +${formatMoneyM(card.rewardMoney)} (รวม ${formatMoneyM(updatedCash[currentTurnPlayer.id])})`;
              } else if (card.rewardMoney && card.rewardMoney < 0) {
                chanceDesc += ` ➔ เสียเงิน ${formatMoneyM(Math.abs(card.rewardMoney))} (เหลือ ${formatMoneyM(updatedCash[currentTurnPlayer.id])})`;
              } else if (card.teleportToIndex !== undefined) {
                const targetT = SUPER_MONOPOLY_TILES[card.teleportToIndex];
                chanceDesc +=
                  targetT?.type === 'airport'
                    ? ` ➔ บินไปลงที่ [${targetT.name}] ➜ ตาหน้าเลือกบินไปช่องไหนก็ได้`
                    : ` ➔ วาร์ปไปที่ [${targetT?.name}]`;
                if (teleportPassedGo) {
                  chanceDesc += ` (ผ่านจุดเริ่มต้น รับ +${formatMoneyM(SALARY_M)})`;
                }
              } else if (card.chooseDestination) {
                chanceDesc += ` ➔ เลือกได้เลยว่าจะไปช่องไหน`;
              } else if (card.goJail) {
                chanceDesc += ` ➔ ถูกส่งตัวเข้าห้องขังทันที!`;
              }
              newLogs = addLog(chanceDesc, '#eab308', newLogs);
            } else if (targetTile.type === 'tax') {
              const taxAmount = 1.0;
              if (playerCash < taxAmount) {
                const raisable = raisableFor(currentTurnPlayer.id, properties);
                setDebtDecision({
                  amount: taxAmount,
                  creditorId: null,
                  creditorName: null,
                  tileName: targetTile.name,
                  tileIcon: '💰',
                  reason: 'ภาษีบำรุงเมือง',
                  cashNow: playerCash,
                  raisable,
                  canCover: playerCash + raisable >= taxAmount,
                });
                requiresUserModalAction = true;
                newLogs = addLog(
                  `⚠️ ${currentTurnPlayer.display_name} เงินสดไม่พอจ่ายภาษี ${formatMoneyM(taxAmount)}`,
                  '#f97316',
                  newLogs
                );
              } else {
              const remainingCash = playerCash - taxAmount;
              updatedCash[currentTurnPlayer.id] = remainingCash;
              sfx.playDrinkPenalty();
              newLogs = addLog(`💰 ${currentTurnPlayer.display_name} จ่ายภาษี ${formatMoneyM(taxAmount)} (เงินเหลือ ${formatMoneyM(remainingCash)})`, '#f97316', newLogs);

              // Show Penalty Modal for Tax
              setActivePenaltyModal({
                type: 'tax',
                tileName: targetTile.name,
                tileIcon: '💰',
                reason: 'คุณเดินมาตกช่องภาษี ต้องชำระภาษีบำรุงเมืองเข้ากองกลาง',
                amount: taxAmount,
                previousCash: playerCash,
                remainingCash: remainingCash,
              });
              requiresUserModalAction = true;
              }
            } else if (targetTile.type === 'airport') {
              // Arriving on a double means the plane is already waiting;
              // otherwise the seat is booked for the next turn.
              sfx.playSuccess();
              if (isDoubleRoll) {
                newLogs = addLog(
                  `✈️ ${currentTurnPlayer.display_name} ถึงสนามบินพอดีตอนทอยได้แต้มคู่ ➜ บินต่อได้ทันที!`,
                  '#0ea5e9',
                  newLogs
                );
                if (canActThisTurn) {
                  setShowFlightPicker(true);
                  requiresUserModalAction = true;
                }
              } else {
                updatedFlights[currentTurnPlayer.id] = true;
                newLogs = addLog(
                  `✈️ ${currentTurnPlayer.display_name} ถึงสนามบิน ➜ ตาหน้าเลือกบินไปช่องไหนก็ได้`,
                  '#0ea5e9',
                  newLogs
                );
                if (canActThisTurn) {
                  setFlightNotice({ tileName: targetTile.name });
                  requiresUserModalAction = true;
                }
              }
            } else if (targetTile.type === 'jail') {
              // No such thing as just visiting here: standing on the cell means
              // you are in it, exactly as if the police had sent you.
              updatedJail[currentTurnPlayer.id] = 1;
              sfx.playDrinkPenalty();
              newLogs = addLog(
                `⛓️ ${currentTurnPlayer.display_name} เดินมาตกห้องขัง ➜ ติดคุก!`,
                '#dc2626',
                newLogs
              );
              if (canActThisTurn) {
                setJailNotice({ tileName: targetTile.name, wasDouble: isDoubleRoll });
                requiresUserModalAction = true;
              }
            } else if (targetTile.type === 'parking') {
              // Costs a turn the way jail does: safe from rent, but you sit the
              // next one out.
              updatedRest[currentTurnPlayer.id] = 1;
              sfx.playSuccess();
              newLogs = addLog(
                `🏖️ ${currentTurnPlayer.display_name} แวะพักที่ [${targetTile.name}] ➜ ปลอดภัยจากค่าผ่านทาง แต่ต้องพัก 1 ตา`,
                '#38bdf8',
                newLogs
              );
              if (canActThisTurn) {
                setRestNotice({ tileName: targetTile.name, wasDouble: isDoubleRoll });
                requiresUserModalAction = true;
              }
            } else if (targetTile.type === 'start') {
              sfx.playSuccess();
              newLogs = addLog(`🏁 ${currentTurnPlayer.display_name} อยู่ที่จุดเริ่มต้น รับเงินทุน 2.0M`, '#22c55e', newLogs);
            }

            // Sync single update to server
            await onUpdateGameState({
              positions: updatedPositions,
              cash: updatedCash,
              inJailTurns: updatedJail,
              restTurns: updatedRest,
              pendingFlights: updatedFlights,
              gameLogs: newLogs,
              ...(updatedProperties ? { properties: updatedProperties } : {}),
              ...(updatedChestDeck ? { chestDeck: updatedChestDeck } : {}),
              ...(updatedChanceDeck ? { chanceDeck: updatedChanceDeck } : {}),
              drawnCard: drawnCardBroadcast,
              rentReceipt: rentReceiptBroadcast,
            });

            // If no modal required:
            if (!requiresUserModalAction) {
              if (
                isDoubleRoll &&
                !updatedJail[currentTurnPlayer.id] &&
                !updatedRest[currentTurnPlayer.id]
              ) {
                showToast('🎉 ได้แต้มคู่! คุณมีสิทธิ์ทอยเต๋าต่ออีก 1 รอบ', 'success');
                setHasRolledThisTurn(false);
              } else {
                setTimeout(() => {
                  handleEndTurn();
                }, 2200);
              }
            }
          }, 500);
        }
      }, 320); // 320ms per step walk
    },
    [currentTurnPlayer, positions, cash, properties, inJailTurns, restTurns, players, addLog, onUpdateGameState, handleEndTurn]
  );

  // Roll 2 Dice (Human)
  const rollDice = useCallback(async () => {
    if (!canActThisTurn || isRolling || isMoving || hasRolledThisTurn || !currentTurnPlayer || !rawState.roll_order_done) return;
    if (isCurrentPlayerInJail || isCurrentPlayerResting) return; // Must resolve jail or rest first
    if (isCurrentPlayerBoarding) return; // A booked flight is taken instead of a roll

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;

    setHasRolledThisTurn(true);
    setIsDouble(d1 === d2);

    // 1. Broadcast roll event to all other players in the room immediately!
    await onUpdateGameState({
      dice: [d1, d2],
      isRolling: true,
      isMoving: false,
      activeStepTileIndex: null,
    });

    // 2. Wait 1200ms for dice roll animation to complete and stop spinning
    setTimeout(async () => {
      // Reveal final dice numbers on all screens
      await onUpdateGameState({
        dice: [d1, d2],
        isRolling: false,
        isMoving: false,
        activeStepTileIndex: null,
      });

      // 3. Pause 800ms so player clearly sees final dice result and total score before walk starts
      setTimeout(() => {
        executeHumanWalk(d1, d2);
      }, 800);
    }, 1200);
  }, [
    isMyTurn,
    canActThisTurn,
    isRolling,
    isMoving,
    hasRolledThisTurn,
    currentTurnPlayer,
    isCurrentPlayerInJail,
    isCurrentPlayerResting,
    executeHumanWalk,
    onUpdateGameState,
  ]);

  const startProxyTurn = useCallback(async () => {
    if (!isHost || isMyTurn || !currentTurnPlayer || isBotTurn) return;
    setIsProxying(true);
    const proxyLog = addLog(
      `👑 หัวหน้าห้องเล่นแทน [${currentTurnPlayer.display_name}]`,
      '#a855f7'
    );
    await onUpdateGameState({ gameLogs: proxyLog });
  }, [isHost, isMyTurn, isBotTurn, currentTurnPlayer, addLog, gameLogs, onUpdateGameState]);

  // Jail Option 1: Serve 1 Turn in Jail (หยุดรับโทษ 1 ตา)
  const handleServeJailTurn = useCallback(async () => {
    if (!currentTurnPlayer || !canActThisTurn || !isCurrentPlayerInJail || isRolling || isMoving) return;
    setIsEndingTurn(true);
    setHasRolledThisTurn(true);

    const updatedJail = { ...inJailTurns, [currentTurnPlayer.id]: 0 };
    sfx.playDrinkPenalty();

    const newLogs = addLog(
      `⛓️ ${currentTurnPlayer.display_name} เลือกหยุดรับโทษในคุก 1 ตา (ข้ามตาเดิน) ➔ ในรอบถัดไปจะได้รับอิสรภาพ`,
      '#a855f7'
    );

    showToast('คุณเลือกหยุดรับโทษ 1 ตา ในรอบถัดไปจะสามารถเดินได้ตามปกติ', 'info');

    await onUpdateGameState({
      inJailTurns: updatedJail,
      gameLogs: newLogs,
    });

    setTimeout(() => {
      handleEndTurn();
    }, 1500);
  }, [currentPlayer, isMyTurn, isCurrentPlayerInJail, isRolling, isMoving, inJailTurns, addLog, gameLogs, onUpdateGameState, handleEndTurn]);

  // Jail Option 2: Pay the fine and carry on with this turn
  const handlePayJailBail = useCallback(async () => {
    if (!currentTurnPlayer || !canActThisTurn || !isCurrentPlayerInJail || isRolling || isMoving) return;

    const myCashNow = cash[currentTurnPlayer.id] ?? INITIAL_CASH_M;
    if (myCashNow < JAIL_BAIL_M) {
      showToast(`เงินไม่พอจ่ายค่าปรับ ${formatMoneyM(JAIL_BAIL_M)} ต้องรับโทษ 1 ตาแทน`, 'warning');
      return;
    }

    const remaining = myCashNow - JAIL_BAIL_M;
    sfx.playDrinkPenalty();

    const newLogs = addLog(
      `💸 ${currentTurnPlayer.display_name} จ่ายค่าปรับ ${formatMoneyM(JAIL_BAIL_M)} ออกจากคุกทันที (เงินเหลือ ${formatMoneyM(remaining)})`,
      '#f59e0b'
    );

    showToast('จ่ายค่าปรับแล้ว ออกจากคุกและทอยเต๋าต่อได้เลย', 'success');

    await onUpdateGameState({
      inJailTurns: { ...inJailTurns, [currentTurnPlayer.id]: 0 },
      cash: { ...cashRef.current, [currentTurnPlayer.id]: remaining },
      gameLogs: newLogs,
    });
  }, [
    currentTurnPlayer,
    canActThisTurn,
    isCurrentPlayerInJail,
    isRolling,
    isMoving,
    cash,
    inJailTurns,
    addLog,
    onUpdateGameState,
  ]);

  // Rest Option: Serve 1 Turn of Rest at Parking (หยุดทอย 1 ตา)
  const handleServeRestTurn = useCallback(async () => {
    if (!currentTurnPlayer || !canActThisTurn || !isCurrentPlayerResting || isRolling || isMoving) return;
    setIsEndingTurn(true);
    setHasRolledThisTurn(true);

    const updatedRest = { ...restTurns, [currentTurnPlayer.id]: 0 };
    sfx.playSuccess();

    const newLogs = addLog(
      `🏖️ ${currentTurnPlayer.display_name} หยุดพักผ่อน 1 ตาตามกฎจุดพัก (ข้ามตาเดิน) ➔ ในรอบถัดไปจะสามารถเดินได้ตามปกติ`,
      '#38bdf8'
    );

    showToast('คุณได้หยุดพักผ่อน 1 ตาแล้ว ในรอบถัดไปสามารถทอยเต๋าได้ตามปกติ', 'info');

    await onUpdateGameState({
      restTurns: updatedRest,
      gameLogs: newLogs,
    });

    setTimeout(() => {
      handleEndTurn();
    }, 1500);
  }, [currentPlayer, isMyTurn, isCurrentPlayerResting, isRolling, isMoving, restTurns, addLog, gameLogs, onUpdateGameState, handleEndTurn]);




  // Buy Land (Human)
  const handleBuyLand = async () => {
    if (!currentTurnPlayer || !activePropertyModal || activePropertyModal.cost === undefined) return;
    const tileIdx = activePropertyModal.index;
    const cost = activePropertyModal.cost;
    const currentMoney = cash[currentTurnPlayer.id] ?? 0;

    if (currentMoney < cost) {
      showToast('เงินสดไม่เพียงพอในการซื้อที่ดินนี้', 'warning');
      return;
    }

    const updatedCash = { ...cashRef.current, [currentTurnPlayer.id]: currentMoney - cost };
    // Buying it is the first visit, which is what lets two houses go up on the
    // spot instead of waiting for the next lap.
    const updatedProperties = {
      ...properties,
      [tileIdx]: { ownerId: currentTurnPlayer.id, houses: 0, visits: 1 },
    };

    sfx.playSuccess();
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });

    const remainingMoney = currentMoney - cost;
    let newLogs = addLog(
      `🏡 ${currentTurnPlayer.display_name} ตกลง [ซื้อที่ดิน] [${activePropertyModal.name}] (${formatMoneyM(cost)}) ➔ เงินคงเหลือ ${formatMoneyM(remainingMoney)}`,
      '#10b981'
    );

    // Buying can complete a side of the board, which takes the bonus off
    // whoever held it before.
    const nextRowBonus = recomputeRowBonus(updatedProperties, rowBonus, {
      tileIndex: tileIdx,
      ownerId: currentTurnPlayer.id,
    });
    newLogs = rowBonusAnnouncement(rowBonus, nextRowBonus, newLogs);

    await onUpdateGameState({
      cash: updatedCash,
      properties: updatedProperties,
      rowBonus: nextRowBonus,
      gameLogs: newLogs,
    });

    // The card stays open on a province: you have just earned the right to put
    // up two houses, and closing it would make you wait a whole lap for them.
    const canBuildNow =
      !activePropertyModal.isUtility && remainingMoney >= (activePropertyModal.houseCost || 0.8);
    if (canBuildNow) {
      showToast('ซื้อที่ดินแล้ว — สร้างบ้านได้ทันทีสูงสุด 2 หลัง', 'success');
      return;
    }

    setActivePropertyModal(null);

    if (isDouble && !isEndingTurn && !isCurrentPlayerInJail && !isCurrentPlayerResting) {
      showToast('🎉 ได้แต้มคู่! คุณมีสิทธิ์ทอยเต๋าต่ออีกรอบ', 'success');
      setHasRolledThisTurn(false);
    } else {
      setTimeout(() => {
        handleEndTurn();
      }, 1200);
    }
  };

  // Build House or Hotel (Human)
  const handleBuildHouse = async () => {
    if (!currentTurnPlayer || !activePropertyModal) return;
    if (activePropertyModal.isUtility) {
      showToast('สาธารณูปโภคไม่สามารถสร้างบ้านได้', 'warning');
      return;
    }
    const tileIdx = activePropertyModal.index;
    const ownership = properties[tileIdx];
    if (!ownership || ownership.ownerId !== currentTurnPlayer.id) return;

    const currentHouses = ownership.houses;
    // How far this visit is allowed to take the land. Two houses on the first
    // landing, the third on the second, the hotel on the third.
    const cap = maxHousesForVisits(ownership.visits || 1);
    if (currentHouses >= cap) {
      showToast(
        cap >= 4
          ? 'ที่ดินนี้พัฒนาถึงขั้นสูงสุดแล้ว'
          : `รอบนี้สร้างได้ถึง ${cap} หลัง ต้องเดินมาตกที่ดินนี้อีกครั้งจึงจะสร้างต่อได้`,
        'warning'
      );
      return;
    }

    const isUpgradingToHotel = currentHouses === 3;
    const cost = isUpgradingToHotel
      ? activePropertyModal.hotelCost || 2.0
      : activePropertyModal.houseCost || 0.8;

    const currentMoney = cash[currentTurnPlayer.id] ?? 0;
    if (currentMoney < cost) {
      showToast('เงินสดไม่เพียงพอในการสร้างสิ่งปลูกสร้าง', 'warning');
      return;
    }

    const updatedCash = { ...cashRef.current, [currentTurnPlayer.id]: currentMoney - cost };
    const updatedProperties = {
      ...properties,
      [tileIdx]: {
        ...ownership,
        houses: currentHouses + 1,
      },
    };

    sfx.playSuccess();
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });

    const upgradeLabel = isUpgradingToHotel ? 'โรงแรมหรู' : `บ้านหลังที่ ${currentHouses + 1}`;
    const remainingMoney = currentMoney - cost;
    const newLogs = addLog(
      `🏨 ${currentTurnPlayer.display_name} สร้าง${upgradeLabel} บน [${activePropertyModal.name}] (${formatMoneyM(cost)}) ➔ เงินคงเหลือ ${formatMoneyM(remainingMoney)}`,
      '#06b6d4'
    );

    await onUpdateGameState({
      cash: updatedCash,
      properties: updatedProperties,
      gameLogs: newLogs,
    });

    // A first landing is worth two houses, so the card has to survive the first
    // one. It closes when the visit has nothing left to offer.
    const nextHouses = currentHouses + 1;
    const nextCost =
      nextHouses === 3 ? activePropertyModal.hotelCost || 2.0 : activePropertyModal.houseCost || 0.8;
    if (nextHouses < cap && remainingMoney >= nextCost) {
      return;
    }

    setActivePropertyModal(null);

    // Building has to settle the turn the way buying does. The card used to
    // close itself afterwards and the close handler did this - so once the card
    // stopped closing twice, building a house quietly ate the reroll a double
    // had earned and left the turn waiting on "pass".
    if (isDouble && !isEndingTurn && !isCurrentPlayerInJail && !isCurrentPlayerResting) {
      showToast('🎉 ได้แต้มคู่! คุณมีสิทธิ์ทอยเต๋าต่ออีกรอบ', 'success');
      setHasRolledThisTurn(false);
    } else {
      setTimeout(() => {
        handleEndTurn();
      }, 1200);
    }
  };

  // A bot's flight plan: the cheapest land it can afford that nobody owns, and
  // failing that, any square that is not someone else's property.
  const chooseBotDestination = (
    fromIndex: number,
    ownProps: Record<number, { ownerId: string; houses: number }>,
    botId: string,
    budget: number
  ): number => {
    const affordable = SUPER_MONOPOLY_TILES.filter(
      (t) =>
        t.index !== fromIndex &&
        t.type === 'property' &&
        !ownProps[t.index] &&
        (t.cost ?? 99) <= budget
    ).sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0));
    if (affordable.length > 0) return affordable[0].index;

    const safe = SUPER_MONOPOLY_TILES.filter(
      (t) =>
        t.index !== fromIndex &&
        t.type !== 'jail' &&
        (t.type !== 'property' || !ownProps[t.index] || ownProps[t.index].ownerId === botId)
    );
    return safe.length > 0 ? safe[Math.floor(Math.random() * safe.length)].index : 0;
  };

  // Raise the money by handing squares back to the bank at half of what went
  // into them - cheapest first, only as many as the bill needs.
  const handleMortgageAndPay = async () => {
    if (!debtDecision || !currentTurnPlayer || !canActThisTurn) return;
    const me = currentTurnPlayer.id;
    const cashNow = cash[me] ?? INITIAL_CASH_M;
    const shortfall = Math.max(0, debtDecision.amount - cashNow);
    const { props: nextProps, raised, soldNames } = mortgageUntil(me, properties, shortfall);
    const remaining = Math.max(0, cashNow + raised - debtDecision.amount);

    const nextCash = { ...cashRef.current, [me]: remaining };
    if (debtDecision.creditorId) {
      nextCash[debtDecision.creditorId] =
        (nextCash[debtDecision.creditorId] ?? INITIAL_CASH_M) + debtDecision.amount;
    }

    sfx.playDrinkPenalty();
    let logs = addLog(
      `🏦 ${currentTurnPlayer.display_name} จำนอง [${soldNames.join(', ')}] ได้ ${formatMoneyM(raised)} ➜ จ่าย ${formatMoneyM(debtDecision.amount)} (เงินเหลือ ${formatMoneyM(remaining)})`,
      '#f59e0b'
    );

    const afterSaleRow = recomputeRowBonus(nextProps, rowBonus);
    logs = rowBonusAnnouncement(rowBonus, afterSaleRow, logs);

    await onUpdateGameState({
      cash: nextCash,
      properties: nextProps,
      rowBonus: afterSaleRow,
      gameLogs: logs,
      rentReceipt: debtDecision.creditorId
        ? {
            ownerId: debtDecision.creditorId,
            payerName: currentTurnPlayer.display_name,
            tileName: debtDecision.tileName,
            tileIcon: debtDecision.tileIcon,
            amount: debtDecision.amount,
            ownerCashAfter: nextCash[debtDecision.creditorId],
            at: Date.now(),
          }
        : null,
    });

    setDebtDecision(null);
    setTimeout(() => {
      handleEndTurn();
    }, 1200);
  };

  // Give up: whatever cash is left goes to the creditor, the land goes back on
  // the market, and the player is out for good.
  const handleDeclareBankrupt = async () => {
    if (!debtDecision || !currentTurnPlayer || !canActThisTurn) return;
    const me = currentTurnPlayer.id;
    const cashNow = cash[me] ?? 0;

    const nextCash = { ...cashRef.current, [me]: 0 };
    if (debtDecision.creditorId) {
      nextCash[debtDecision.creditorId] =
        (nextCash[debtDecision.creditorId] ?? INITIAL_CASH_M) + cashNow;
    }

    const nextProps: Record<number, PropertyOwnership> = {};
    Object.entries(properties).forEach(([idx, own]) => {
      if (own.ownerId !== me) nextProps[Number(idx)] = own;
    });

    const nextBankrupt = { ...bankrupt, [me]: true };
    const left = orderedPlayers.filter((p) => !nextBankrupt[p.id]);
    const winner = left.length === 1 ? left[0] : null;

    sfx.playDrinkPenalty();
    let logs = addLog(
      `💀 ${currentTurnPlayer.display_name} ล้มละลาย! ออกจากเกม ที่ดินทั้งหมดกลับมาเป็นที่ว่าง`,
      '#ef4444'
    );
    if (winner) {
      logs = addLog(`🏆 ${winner.display_name} เป็นผู้ชนะ!`, '#facc15', logs);
    }

    const afterBustRow = recomputeRowBonus(nextProps, rowBonus);
    logs = rowBonusAnnouncement(rowBonus, afterBustRow, logs);

    await onUpdateGameState({
      cash: nextCash,
      properties: nextProps,
      rowBonus: afterBustRow,
      bankrupt: nextBankrupt,
      winnerId: winner ? winner.id : null,
      bankruptcyNotice: {
        playerId: me,
        name: currentTurnPlayer.display_name,
        cause: debtDecision.reason || 'จ่ายหนี้ไม่ไหว',
        at: Date.now(),
      },
      gameLogs: logs,
    });

    setDebtDecision(null);
    if (!winner) {
      setTimeout(() => {
        handleEndTurn();
      }, 1200);
    }
  };

  // Landing somewhere without walking there - a teleport card, a flight - still
  // has to settle the square: free land offers the buy, someone else's charges
  // rent. Returns true when it put a modal up and the turn must wait.
  const resolveArrivalAt = async (destIndex: number, how: string): Promise<boolean> => {
    if (!currentTurnPlayer) return false;
    const destTile = SUPER_MONOPOLY_TILES[destIndex];
    const destOwnership = properties[destIndex];
    if (!destTile || destTile.type !== 'property') return false;

    // Arriving by air or by card is still arriving: the visit counts the same
    // as walking here, or flying to your own hotel would be free of charge.
    if (destOwnership && destOwnership.ownerId === currentTurnPlayer.id) {
      const visits = (destOwnership.visits || 0) + 1;
      const bumped = { ...properties, [destIndex]: { ...destOwnership, visits } };
      const arriveLog = destTile.isUtility
        ? `🏨 ${currentTurnPlayer.display_name} ${how}มาถึงกิจการของตัวเอง [${destTile.name}] ➜ ค่าผ่านทางคูณ x${visitMultiplier(
            visits
          )}`
        : `🏡 ${currentTurnPlayer.display_name} ${how}มาถึงที่ดินของตัวเอง [${destTile.name}] (ครั้งที่ ${visits})`;
      await onUpdateGameState({ properties: bumped, gameLogs: addLog(arriveLog, '#06b6d4') });
      setActivePropertyModal(destTile);
      return true;
    }

    if (!destOwnership) {
      setActivePropertyModal(destTile);
      return true;
    }

    const owner = players.find((p) => p.id === destOwnership.ownerId);
    const myCashNow = cash[currentTurnPlayer.id] ?? INITIAL_CASH_M;
    const rent = computeRent(destTile, destOwnership, properties, rowBonus);

    if (myCashNow < rent) {
      const raisable = raisableFor(currentTurnPlayer.id, properties);
      setDebtDecision({
        amount: rent,
        creditorId: owner?.id ?? null,
        creditorName: owner?.display_name ?? null,
        tileName: destTile.name,
        tileIcon: destTile.icon || '🏨',
        reason: `ค่าผ่านทางที่ดินของ [${owner?.display_name || 'เจ้าของที่ดิน'}]`,
        cashNow: myCashNow,
        raisable,
        canCover: myCashNow + raisable >= rent,
      });
      await onUpdateGameState({
        gameLogs: addLog(
          `⚠️ ${currentTurnPlayer.display_name} เงินสดไม่พอจ่ายค่าผ่านทาง ${formatMoneyM(rent)}`,
          '#f97316'
        ),
      });
      return true;
    }

    const actualRent = rent;
    const remaining = myCashNow - rent;

    const rentCash = { ...cashRef.current, [currentTurnPlayer.id]: remaining };
    if (owner) {
      rentCash[owner.id] = (rentCash[owner.id] ?? INITIAL_CASH_M) + actualRent;
    }

    sfx.playDrinkPenalty();
    const rentLogs = addLog(
      `💸 ${currentTurnPlayer.display_name} ${how}มาตกที่ดินของ ${owner?.display_name || 'เจ้าของ'} จ่ายค่าผ่านทาง ${formatMoneyM(actualRent)} (เงินเหลือ ${formatMoneyM(remaining)})`,
      '#ef4444'
    );

    await onUpdateGameState({
      cash: rentCash,
      gameLogs: rentLogs,
      rentReceipt: owner
        ? {
            ownerId: owner.id,
            payerName: currentTurnPlayer.display_name,
            tileName: destTile.name,
            tileIcon: destTile.icon || '🏨',
            amount: actualRent,
            ownerCashAfter: rentCash[owner.id],
            at: Date.now(),
          }
        : null,
    });

    setActivePenaltyModal({
      type: 'rent',
      tileName: destTile.name,
      tileIcon: destTile.icon || '🏨',
      reason: `คุณ${how}มาตกที่ดินของ [${owner?.display_name || 'เจ้าของที่ดิน'}]`,
      amount: actualRent,
      recipientName: owner?.display_name || 'เจ้าของที่ดิน',
      previousCash: myCashNow,
      remainingCash: remaining,
      houses: destOwnership.houses,
      isUtility: destTile.isUtility,
    });
    return true;
  };

  // Take the flight: land anywhere on the board, collecting the salary if the
  // route passes the start the way walking there would.
  const handleChooseFlight = async (destIndex: number) => {
    if (!currentTurnPlayer || !canActThisTurn) return;
    const fromIndex = positions[currentTurnPlayer.id] ?? 0;
    if (destIndex === fromIndex) return;

    setShowFlightPicker(false);
    // The flight is the whole turn, so nothing else may be offered until the
    // turn actually moves on - and it counts as this turn's move, which is what
    // stops a stray tap on the dice from walking again.
    setIsEndingTurn(true);
    setHasRolledThisTurn(true);
    // Landing on the airport with a double buys the flight, not a flight and
    // then another roll. Without this the card that opens on arrival handed
    // back a re-roll the turn had already spent, and since the turn was also
    // marked as ending, the dice never came back and the turn simply stopped.
    setIsDouble(false);

    const destTile = SUPER_MONOPOLY_TILES[destIndex];
    const passedStart = destIndex <= fromIndex;
    const myCashNow = cash[currentTurnPlayer.id] ?? INITIAL_CASH_M;
    const newCash = passedStart ? myCashNow + SALARY_M : myCashNow;

    sfx.playSuccess();
    let flightLogs = addLog(
      `✈️ ${currentTurnPlayer.display_name} บินจาก [${SUPER_MONOPOLY_TILES[fromIndex]?.name || fromIndex}] ไป [${destTile?.name || destIndex}]${
        passedStart ? ` (ผ่านจุดเริ่มต้น รับ +${formatMoneyM(SALARY_M)})` : ''
      }`,
      '#0ea5e9'
    );

    await onUpdateGameState({
      positions: { ...positions, [currentTurnPlayer.id]: destIndex },
      cash: { ...cashRef.current, [currentTurnPlayer.id]: newCash },
      pendingFlights: { ...pendingFlights, [currentTurnPlayer.id]: false },
      gameLogs: flightLogs,
      activeStepTileIndex: null,
      isMoving: false,
      isRolling: false,
    });

    // If the square needs a decision, the modal that opens takes it from here
    // and its close handler ends the turn.
    if (await resolveArrivalAt(destIndex, 'บิน')) return;

    setTimeout(() => {
      handleEndTurn();
    }, 1200);
  };

  // A booked flight is the whole turn - there is nothing else to do with it, so
  // the map opens by itself rather than making the traveller press a button
  // first. It waits for anything else on screen to be dealt with.
  useEffect(() => {
    if (!isCurrentPlayerBoarding || !canActThisTurn) return;
    // The seat is for the next turn, so the map waits for it. Opening the
    // moment it was booked put the map on screen for the tail of a turn that
    // was already ending, and it vanished again a second later.
    if (hasRolledThisTurn || isEndingTurn) return;
    if (isRolling || isMoving) return;
    if (activePropertyModal || activeCard || activePenaltyModal) return;
    if (jailNotice || restNotice || flightNotice || debtDecision) return;
    setShowFlightPicker(true);
  }, [
    isCurrentPlayerBoarding,
    canActThisTurn,
    isRolling,
    isMoving,
    activePropertyModal,
    activeCard,
    activePenaltyModal,
    jailNotice,
    restNotice,
    flightNotice,
    debtDecision,
    hasRolledThisTurn,
    isEndingTurn,
  ]);

  const handleOpenFlightPicker = () => {
    if (!canActThisTurn || isRolling || isMoving) return;
    setShowFlightPicker(true);
  };

  // Close Active Modal and Auto Advance Turn
  const handleCloseActiveModal = async () => {
    // The card now stays open after a purchase so the two houses a first visit
    // is worth can go up. Closing it is therefore not always a refusal - only
    // log the skip when the land really is not ours.
    const alreadyMine =
      activePropertyModal &&
      propertiesRef.current[activePropertyModal.index]?.ownerId === currentTurnPlayer?.id;
    if (activePropertyModal && canActThisTurn && !alreadyMine) {
      const pCash = cash[currentTurnPlayer.id] ?? 0;
      const skipLog = addLog(
        `⏭️ ${currentTurnPlayer.display_name} เลือก [ไม่ซื้อ / ข้ามที่ดิน] [${activePropertyModal.name}] (เงินคงเหลือ ${formatMoneyM(pCash)})`,
        '#9ca3af'
      );
      await onUpdateGameState({ gameLogs: skipLog });
    }

    const wasCard = Boolean(activeCard);

    setActivePropertyModal(null);
    setActiveCard(null);
    setActivePenaltyModal(null);

    // Everyone at the table is watching a copy of this card. Clearing the
    // broadcast closes their copy at the same moment the drawer closes theirs,
    // so nobody is left reading a card the table has moved on from - and no
    // timer decides for them.
    if (wasCard) {
      await onUpdateGameState({ drawnCard: null });
    }

    // A teleport card just moved us: resolve the tile we landed on before the
    // turn is allowed to end, so warping onto free land still offers the buy.
    if (wasCard && pendingTeleportTile !== null && canActThisTurn && currentTurnPlayer) {
      const destIndex = pendingTeleportTile;
      setPendingTeleportTile(null);
      if (await resolveArrivalAt(destIndex, 'วาร์ป')) return;
    }

    // A card that hands over the choice: the picker opens now that the card is
    // off the screen, and handleChooseFlight takes the turn from there.
    if (wasCard && pendingCardFlight && canActThisTurn) {
      setPendingCardFlight(false);
      setShowFlightPicker(true);
      return;
    }

    if (canActThisTurn && hasRolledThisTurn) {
      if (isDouble && !isEndingTurn && !isCurrentPlayerInJail && !isCurrentPlayerResting) {
        showToast('🎉 ได้แต้มคู่! คุณมีสิทธิ์ทอยเต๋าต่ออีกรอบ', 'success');
        setHasRolledThisTurn(false);
      } else {
        await handleEndTurn();
      }
    }
  };

  // Acknowledge Penalty/Rent Modal and Auto Advance Turn
  const handleAcknowledgePenalty = useCallback(async () => {
    setActivePenaltyModal(null);
    if (canActThisTurn && hasRolledThisTurn) {
      if (isDouble && !isEndingTurn && !isCurrentPlayerInJail && !isCurrentPlayerResting) {
        showToast('🎉 ได้แต้มคู่! คุณมีสิทธิ์ทอยเต๋าต่ออีกรอบ', 'success');
        setHasRolledThisTurn(false);
      } else {
        await handleEndTurn();
      }
    }
  }, [isMyTurn, hasRolledThisTurn, isDouble, isCurrentPlayerInJail, handleEndTurn]);

  const handleAcknowledgeJail = useCallback(async () => {
    setJailNotice(null);
    await handleEndTurn();
  }, [handleEndTurn]);

  const handleAcknowledgeRest = useCallback(async () => {
    setRestNotice(null);
    await handleEndTurn();
  }, [handleEndTurn]);

  const handleAcknowledgeFlight = useCallback(async () => {
    setFlightNotice(null);
    await handleEndTurn();
  }, [handleEndTurn]);

  // -------------------------------------------------------------
  // BOT AUTO-PLAY ENGINE (Rock-Solid: No Deadlocks, No Freezes)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isHost || !rawState.roll_order_done) return;

    const turnPlayerId = room.current_turn_player_id;
    if (!turnPlayerId) return;

    // Whether it is a bot's turn is decided from the turn id itself, never from
    // isBotTurn. That value comes from sorting the roster, so it flickers false
    // for a render whenever the room update and the players update land on
    // different polls - and a flicker used to tear the running turn down while
    // handledTurnKeyRef blocked it from ever restarting.
    const turnPlayer = orderedPlayersRef.current.find((p) => p.id === turnPlayerId);
    const turnIsBot = turnPlayerId.startsWith('bot-') || turnPlayer?.line_user_id === 'bot';
    if (!turnIsBot) return;

    // Don't start the same bot turn twice, but do restart one that was torn
    // down before it finished.
    if (handledTurnKeyRef.current === turnPlayerId && botTurnRunningRef.current) return;
    handledTurnKeyRef.current = turnPlayerId;
    botTurnRunningRef.current = true;

    let isMounted = true;

    // Safety watchdog for a bot that has genuinely stalled. It used to fire on a
    // flat 16s, which a legitimate turn can exceed - a double rolls twice, and
    // twelve steps take four seconds on their own - so it stole the turn from a
    // bot that was still walking and left the walking flags on for the next
    // player. It now only fires when the bot has made no progress for a while,
    // and re-arms whenever it has.
    const armWatchdog = () => {
      if (botWatchdogTimerRef.current) clearTimeout(botWatchdogTimerRef.current);
      botWatchdogTimerRef.current = setTimeout(async () => {
        if (!isMounted) return;
        if (Date.now() - botProgressAtRef.current < 9000) {
          armWatchdog();
          return;
        }
        console.warn('[Bot Watchdog] Bot made no progress! Auto-passing turn...');
        const nextPlayer = nextActiveAfter(orderedPlayersRef.current, turnPlayerId, bankrupt);
        if (nextPlayer) {
          await onNextTurn(nextPlayer.id);
        }
      }, 9000);
    };
    botProgressAtRef.current = Date.now();
    armWatchdog();

    const executeBotTurn = async () => {
      // Every write the bot makes counts as progress, so the watchdog can tell a
      // long-but-healthy turn from one that has actually stalled.
      const botSync = async (partial: Record<string, any>) => {
        botProgressAtRef.current = Date.now();
        return onUpdateGameState(partial);
      };
      try {
        let rollsThisTurn = 0;
        let shouldRollAgain = true;
        let botTurnLogs = gameLogsRef.current;
        let botCash: number = cash[turnPlayerId] ?? INITIAL_CASH_M;
        // Everyone's cash, carried across the whole turn the way botProperties
        // and botRowBonus are. `cash` is the render-time snapshot from when this
        // turn started, so re-spreading it on the second roll of a double threw
        // away any rent the bot had just paid on the first: the landlord was
        // credited and then silently reset to their pre-rent balance.
        let botCashAll: Record<string, number> = { ...cash };
        let botJailTurns: number = inJailTurns[turnPlayerId] ?? 0;
        let botRestTurns: number = restTurns[turnPlayerId] ?? 0;
        let currentPos: number = positions[turnPlayerId] ?? 0;
        let botProperties = { ...properties };
        let botChestDeck: string[] | undefined = rawState.chestDeck;
        let botChanceDeck: string[] | undefined = rawState.chanceDeck;
        let botDrawnCard: { cardId: string; playerId: string; at: number } | null = null;
        let botRentReceipt: RentReceipt | null = null;
        let botJailState = { ...inJailTurns };
        let botRestState = { ...restTurns };
        let botFlightState = { ...pendingFlights };
        let botRowBonus: RowBonus | null = rowBonus;
        let botBankrupted = false;

        type BotLogs = Array<{ text: string; time: string; color?: string }>;

        // Going out of the game looks the same whether it happened on foot or
        // on arrival, so both paths send the one patch.
        const botBankruptPatch = (logs: BotLogs): { patch: Record<string, unknown>; logs: BotLogs } => {
          const nextBankrupt = { ...bankrupt, [turnPlayerId]: true };
          const freed: Record<number, PropertyOwnership> = {};
          Object.entries(botProperties).forEach(([idx, own]) => {
            if (own.ownerId !== turnPlayerId) freed[Number(idx)] = own;
          });
          const left = orderedPlayersRef.current.filter((pl) => !nextBankrupt[pl.id]);
          botRowBonus = recomputeRowBonus(freed, botRowBonus);
          let nextLogs = addLog(
            `💀 🤖 ${currentTurnPlayer.display_name} ล้มละลาย! ออกจากเกม`,
            '#ef4444',
            logs
          );
          if (left.length === 1) {
            nextLogs = addLog(`🏆 ${left[0].display_name} เป็นผู้ชนะ!`, '#facc15', nextLogs);
          }
          return {
            patch: {
              bankrupt: nextBankrupt,
              properties: freed,
              rowBonus: botRowBonus,
              winnerId: left.length === 1 ? left[0].id : null,
              bankruptcyNotice: {
                playerId: turnPlayerId,
                name: currentTurnPlayer.display_name,
                cause: 'จ่ายค่าผ่านทางไม่ไหว',
                at: Date.now(),
              },
            },
            logs: nextLogs,
          };
        };

        // What a bot owes the board for arriving somewhere by air or by card.
        // Walking has its own long block below; a flight used to move the token
        // and nothing else, so a bot could sit on someone's hotel rent-free.
        const botResolveArrival = (
          destIndex: number,
          how: string,
          logs: BotLogs
        ): {
          logs: BotLogs;
          ownerPay: { id: string; amount: number } | null;
          receipt: RentReceipt | null;
          wentBankrupt: boolean;
        } => {
          const tile = SUPER_MONOPOLY_TILES[destIndex];
          let nextLogs = logs;
          if (!tile || tile.type !== 'property') {
            return { logs: nextLogs, ownerPay: null, receipt: null, wentBankrupt: false };
          }

          const held = botProperties[destIndex];

          if (!held) {
            if (tile.cost && botCash > tile.cost * 1.3) {
              botCash -= tile.cost;
              botProperties[destIndex] = { ownerId: turnPlayerId, houses: 0, visits: 1 };
              botRowBonus = recomputeRowBonus(botProperties, botRowBonus, {
                tileIndex: destIndex,
                ownerId: turnPlayerId,
              });
              nextLogs = addLog(
                `🏡 🤖 ${currentTurnPlayer.display_name} ${how}มาแล้วซื้อที่ดิน [${tile.name}] (${formatMoneyM(
                  tile.cost
                )}) ➔ เงินเหลือ ${formatMoneyM(botCash)}`,
                '#22c55e',
                nextLogs
              );
              const built = botBuildUpTo(destIndex, tile, 1);
              if (built.log) nextLogs = addLog(built.log, '#06b6d4', nextLogs);
            }
            return { logs: nextLogs, ownerPay: null, receipt: null, wentBankrupt: false };
          }

          if (held.ownerId === turnPlayerId) {
            const visits = (held.visits || 0) + 1;
            botProperties[destIndex] = { ...held, visits };
            if (tile.isUtility) {
              nextLogs = addLog(
                `🏨 🤖 ${currentTurnPlayer.display_name} ${how}มาถึงกิจการของตัวเอง [${tile.name}] ➜ ค่าผ่านทางคูณ x${visitMultiplier(
                  visits
                )}`,
                '#06b6d4',
                nextLogs
              );
            } else {
              const built = botBuildUpTo(destIndex, tile, visits);
              if (built.log) nextLogs = addLog(built.log, '#06b6d4', nextLogs);
            }
            return { logs: nextLogs, ownerPay: null, receipt: null, wentBankrupt: false };
          }

          const owner = players.find((pl) => pl.id === held.ownerId);
          const rent = computeRent(tile, held, botProperties, botRowBonus);
          let broke = false;
          if (botCash < rent) {
            const sale = mortgageUntil(turnPlayerId, botProperties, rent - botCash);
            if (botCash + sale.raised >= rent) {
              botProperties = sale.props;
              botCash += sale.raised;
              botRowBonus = recomputeRowBonus(botProperties, botRowBonus);
              nextLogs = addLog(
                `🏦 🤖 ${currentTurnPlayer.display_name} จำนอง [${sale.soldNames.join(
                  ', '
                )}] ได้ ${formatMoneyM(sale.raised)} มาจ่ายค่าผ่านทาง`,
                '#f59e0b',
                nextLogs
              );
            } else {
              broke = true;
            }
          }

          const paid = broke ? botCash : rent;
          botCash = Math.max(0, botCash - paid);
          nextLogs = addLog(
            `💸 🤖 ${currentTurnPlayer.display_name} ${how}มาตกที่ดินของ ${
              owner?.display_name || 'เจ้าของ'
            } จ่ายค่าผ่านทาง ${formatMoneyM(paid)} (เงินเหลือ ${formatMoneyM(botCash)})`,
            '#ef4444',
            nextLogs
          );

          return {
            logs: nextLogs,
            ownerPay: owner ? { id: owner.id, amount: paid } : null,
            receipt: owner
              ? {
                  ownerId: owner.id,
                  payerName: currentTurnPlayer.display_name,
                  tileName: tile.name,
                  tileIcon: tile.icon || '🏨',
                  amount: paid,
                  ownerCashAfter: (cash[owner.id] ?? INITIAL_CASH_M) + paid,
                  at: Date.now(),
                }
              : null,
            wentBankrupt: broke,
          };
        };

        // Puts up as much as this visit allows and the wallet can stand, and
        // reports it as one line so the feed does not get three in a row.
        const botBuildUpTo = (
          tileIndex: number,
          tile: SuperPropertyTile,
          visits: number
        ): { log: string | null } => {
          // A hotel or a utility is never built on - it earns its multiplier by
          // being visited instead.
          if (tile.isUtility) return { log: null };
          const cap = maxHousesForVisits(visits);
          let built = 0;
          let spent = 0;
          for (;;) {
            const held = botProperties[tileIndex];
            if (!held || held.houses >= cap) break;
            const cost = held.houses === 3 ? tile.hotelCost || 2.0 : tile.houseCost || 0.8;
            if (botCash <= cost * 1.5) break;
            botCash -= cost;
            spent += cost;
            built++;
            botProperties[tileIndex] = { ...held, houses: held.houses + 1 };
          }
          if (!built) return { log: null };
          const houses = botProperties[tileIndex].houses;
          const what = houses === 4 ? 'โรงแรมหรู' : `บ้านรวม ${houses} หลัง`;
          return {
            log: `🏨 🤖 ${currentTurnPlayer.display_name} สร้าง${what} บน [${tile.name}] (${formatMoneyM(
              spent
            )}) ➔ เงินเหลือ ${formatMoneyM(botCash)}`,
          };
        };

        // A bot gets the same doubles rule a player gets: keep rolling. This
        // used to stop at two rolls, so a bot that rolled a double on its
        // second roll handed the turn over anyway - the feed said "แต้มคู่!"
        // and then "ส่งตาให้" on the very next line. The ceiling that is left
        // is a safety valve against a runaway turn, not a rule, and it says so
        // in the feed on the once-in-thousands turn that reaches it.
        while (shouldRollAgain && rollsThisTurn < BOT_MAX_ROLLS_PER_TURN && isMounted) {
          rollsThisTurn++;
          shouldRollAgain = false;

          // 1. Pause briefly
          await new Promise((resolve) => setTimeout(resolve, 1000));
          if (!isMounted) return;

          // A seat booked last turn is used now, in place of the roll.
          if (botFlightState[turnPlayerId]) {
            botFlightState[turnPlayerId] = false;
            const dest = chooseBotDestination(currentPos, botProperties, turnPlayerId, botCash);
            const passedStart = dest <= currentPos;
            if (passedStart) botCash += SALARY_M;
            currentPos = dest;
            botTurnLogs = addLog(
              `✈️ 🤖 ${currentTurnPlayer.display_name} ขึ้นเครื่องบินไป [${SUPER_MONOPOLY_TILES[dest]?.name}]${
                passedStart ? ` (ผ่านจุดเริ่มต้น รับ +${formatMoneyM(SALARY_M)})` : ''
              }`,
              '#0ea5e9',
              botTurnLogs
            );
            // Landing by air is landing: buy it, build on it, or pay for it.
            const arrival = botResolveArrival(dest, 'บิน', botTurnLogs);
            botTurnLogs = arrival.logs;
            if (arrival.wentBankrupt) botBankrupted = true;

            const flightCash = { ...botCashAll, [turnPlayerId]: botCash };
            if (arrival.ownerPay) {
              // Credit the landlord against the running tally, not the snapshot
              // this turn opened with, and bank it afterwards - reading `cash`
              // here lost a payment the same way the walk path used to.
              flightCash[arrival.ownerPay.id] =
                (botCashAll[arrival.ownerPay.id] ?? INITIAL_CASH_M) + arrival.ownerPay.amount;
            }
            botCashAll = { ...flightCash };

            const bust = botBankrupted ? botBankruptPatch(botTurnLogs) : null;
            if (bust) botTurnLogs = bust.logs;

            botTurnLogs = rowBonusAnnouncement(rowBonus, botRowBonus, botTurnLogs);

            await botSync({
              positions: { ...positions, [turnPlayerId]: dest },
              cash: flightCash,
              properties: botProperties,
              rowBonus: botRowBonus,
              pendingFlights: botFlightState,
              rentReceipt:
                arrival.receipt && arrival.ownerPay
                  ? { ...arrival.receipt, ownerCashAfter: flightCash[arrival.ownerPay.id] }
                  : arrival.receipt,
              ...(bust ? bust.patch : {}),
              gameLogs: botTurnLogs,
              activeStepTileIndex: null,
              isMoving: false,
              isRolling: false,
            });
            await new Promise((resolve) => setTimeout(resolve, 1500));
            break; // the flight was the turn
          }

          // Check if bot is resting at parking spot (หยุดทอย 1 ตา):
          if (botRestTurns > 0) {
            botRestState[turnPlayerId] = 0;
            botTurnLogs = addLog(
              `🏖️ 🤖 ${currentTurnPlayer.display_name} กำลังหยุดพักผ่อนที่จุดพัก ต้องหยุดทอย 1 ตา (ข้ามตานี้)`,
              '#38bdf8',
              botTurnLogs
            );
            await botSync({
              restTurns: botRestState,
              gameLogs: botTurnLogs,
            });
            await new Promise((resolve) => setTimeout(resolve, 1500));
            break; // exit while loop to end turn
          }

          // Same choice a player gets: buy your way out if the fine is small
          // change, otherwise sit the turn out. No escape roll for anyone.
          if (botJailTurns > 0) {
            botJailTurns = 0;
            botJailState[turnPlayerId] = 0;

            if (botCash >= JAIL_BAIL_M * 6) {
              botCash = botCash - JAIL_BAIL_M;
              botTurnLogs = addLog(
                `💸 🤖 ${currentTurnPlayer.display_name} จ่ายค่าปรับ ${formatMoneyM(JAIL_BAIL_M)} ออกจากคุกทันที (เงินเหลือ ${formatMoneyM(botCash)})`,
                '#f59e0b',
                botTurnLogs
              );
              await botSync({
                inJailTurns: botJailState,
                cash: { ...botCashAll, [turnPlayerId]: botCash },
                gameLogs: botTurnLogs,
              });
              await new Promise((resolve) => setTimeout(resolve, 1200));
              // fall through and take the turn
            } else {
              botTurnLogs = addLog(
                `⛓️ 🤖 ${currentTurnPlayer.display_name} เงินไม่พอจ่ายค่าปรับ รับโทษในคุก 1 ตา (ข้ามตานี้)`,
                '#a855f7',
                botTurnLogs
              );
              await botSync({
                inJailTurns: botJailState,
                gameLogs: botTurnLogs,
              });
              await new Promise((resolve) => setTimeout(resolve, 1500));
              break; // exit while loop to end turn
            }
          }

          // 2. Roll 2 dice (with live synchronized shuffle)
          const d1 = Math.floor(Math.random() * 6) + 1;
          const d2 = Math.floor(Math.random() * 6) + 1;
          const totalRoll = d1 + d2;
          const isDoubleRoll = d1 === d2;

          // Broadcast roll start to all players in the room immediately!
          await botSync({
            dice: [d1, d2],
            isRolling: true,
            isMoving: false,
            activeStepTileIndex: null,
          });

          await new Promise((resolve) => setTimeout(resolve, 1200));
          if (!isMounted) return;

          // Reveal final dice numbers on all screens
          await botSync({
            dice: [d1, d2],
            isRolling: false,
            isMoving: false,
            activeStepTileIndex: null,
          });

          await new Promise((resolve) => setTimeout(resolve, 800));
          if (!isMounted) return;

          let stepPos = currentPos;
          let passedGoInWalk = false;

          // 3. Step-by-step synchronized walk across the room
          for (let s = 1; s <= totalRoll; s++) {
            if (!isMounted) return;
            stepPos = (stepPos + 1) % 40;

            if (stepPos === 0) {
              passedGoInWalk = true;
              botCash += SALARY_M;
              sfx.playSuccess();
            }

            const botStepPositions = { ...positions, [turnPlayerId]: stepPos };
            await botSync({
              positions: botStepPositions,
              activeStepTileIndex: stepPos,
              activeStepPlayerId: turnPlayerId,
              isRolling: false,
              isMoving: true,
              cash: { ...botCashAll, [turnPlayerId]: botCash },
            });

            await new Promise((resolve) => setTimeout(resolve, 320));
          }

          if (!isMounted) return;
          sfx.playTileLand();
          await new Promise((resolve) => setTimeout(resolve, 500));
          if (!isMounted) return;

          const finalPos = stepPos;
          currentPos = finalPos;
          const targetTile = SUPER_MONOPOLY_TILES[finalPos];
          let logText = `🎯 🤖 ${currentTurnPlayer.display_name} ทอยได้ [${d1}][${d2}] (${totalRoll} แต้ม) ➔ ตกที่ [${targetTile.name}]`;

          if (passedGoInWalk) {
            logText += ` (ผ่านจุดเริ่มต้น รับ +${formatMoneyM(SALARY_M)})`;
          }
          if (isDoubleRoll) {
            logText +=
              targetTile.type === 'airport'
                ? ' (แต้มคู่ ➜ บินได้ทันที)'
                : targetTile.type === 'jail'
                ? ' (แต้มคู่ แต่ติดคุก ไม่ได้ทอยต่อ)'
                : targetTile.type === 'parking'
                ? ' (แต้มคู่ แต่ต้องพัก ไม่ได้ทอยต่อ)'
                : ' 🎉 แต้มคู่!';
          }

          botTurnLogs = addLog(logText, '#93c5fd', botTurnLogs);
          const updatedPositions = { ...positions, [turnPlayerId]: finalPos };
          const updatedCash = { ...botCashAll, [turnPlayerId]: botCash };
          botJailState[turnPlayerId] = 0;

          // 4. Bot Decision on Target Tile:
          if (targetTile.type === 'property') {
            const ownership = botProperties[finalPos];
            if (!ownership && targetTile.cost && botCash > targetTile.cost * 1.2) {
              // Bot buys property
              botCash -= targetTile.cost;
              updatedCash[turnPlayerId] = botCash;
              botProperties[finalPos] = { ownerId: turnPlayerId, houses: 0, visits: 1 };
              botRowBonus = recomputeRowBonus(botProperties, botRowBonus, {
                tileIndex: finalPos,
                ownerId: turnPlayerId,
              });
              botTurnLogs = addLog(
                `🏡 🤖 ${currentTurnPlayer.display_name} ตกลง [ซื้อที่ดิน] [${targetTile.name}] (${formatMoneyM(targetTile.cost)}) ➔ เงินเหลือ ${formatMoneyM(botCash)}`,
                '#10b981',
                botTurnLogs
              );
              // Buying it counts as the first visit, so the bot may raise two
              // houses right away, the same as a player.
              const built = botBuildUpTo(finalPos, targetTile, 1);
              if (built.log) botTurnLogs = addLog(built.log, '#06b6d4', botTurnLogs);
              updatedCash[turnPlayerId] = botCash;
            } else if (!ownership && targetTile.cost) {
              // Bot skips buying!
              botTurnLogs = addLog(
                `⏭️ 🤖 ${currentTurnPlayer.display_name} เลือก [ไม่ซื้อที่ดิน] [${targetTile.name}] (เงินเหลือ ${formatMoneyM(botCash)})`,
                '#9ca3af',
                botTurnLogs
              );
            } else if (ownership && ownership.ownerId === turnPlayerId) {
              // The bot plays the visit rules a player does: the landing counts,
              // and it buys as much as this visit and its wallet allow.
              const visits = (ownership.visits || 0) + 1;
              botProperties[finalPos] = { ...ownership, visits };
              if (targetTile.isUtility) {
                const boost = visitMultiplier(visits);
                botTurnLogs = addLog(
                  `🏨 🤖 ${currentTurnPlayer.display_name} แวะกิจการของตัวเอง [${targetTile.name}] ➜ ค่าผ่านทางคูณ x${boost}${
                    boost >= MAX_VISIT_MULTIPLIER ? ' (สูงสุดแล้ว)' : ''
                  }`,
                  '#06b6d4',
                  botTurnLogs
                );
              } else {
                const built = botBuildUpTo(finalPos, targetTile, visits);
                if (built.log) botTurnLogs = addLog(built.log, '#06b6d4', botTurnLogs);
                updatedCash[turnPlayerId] = botCash;
              }
            } else if (ownership && ownership.ownerId !== turnPlayerId) {
              // Bot pays rent
              const owner = players.find((p) => p.id === ownership.ownerId);
              const rent = computeRent(targetTile, ownership, botProperties, botRowBonus);

              if (botCash < rent) {
                // Same choice a player gets, taken without asking: sell what it
                // takes, and if that is still not enough, the bot is out.
                const shortfall = rent - botCash;
                const sale = mortgageUntil(turnPlayerId, botProperties, shortfall);
                if (botCash + sale.raised >= rent) {
                  botProperties = sale.props;
                  botCash = botCash + sale.raised;
                  botRowBonus = recomputeRowBonus(botProperties, botRowBonus);
                  botTurnLogs = addLog(
                    `🏦 🤖 ${currentTurnPlayer.display_name} จำนอง [${sale.soldNames.join(', ')}] ได้ ${formatMoneyM(sale.raised)} มาจ่ายค่าผ่านทาง`,
                    '#f59e0b',
                    botTurnLogs
                  );
                } else {
                  botBankrupted = true;
                }
              }

              const actualRent = botBankrupted ? botCash : rent;
              botCash = Math.max(0, botCash - actualRent);
              updatedCash[turnPlayerId] = botCash;
              if (owner) {
                updatedCash[owner.id] = (updatedCash[owner.id] ?? INITIAL_CASH_M) + actualRent;
              }
              botTurnLogs = addLog(
                `💸 🤖 ${currentTurnPlayer.display_name} จ่ายค่าผ่านทางให้ ${owner?.display_name || 'เจ้าของ'} ${formatMoneyM(actualRent)} (เงินเหลือ ${formatMoneyM(botCash)})`,
                '#ef4444',
                botTurnLogs
              );
              if (owner) {
                botRentReceipt = {
                  ownerId: owner.id,
                  payerName: currentTurnPlayer.display_name,
                  tileName: targetTile.name,
                  tileIcon: targetTile.icon || '🏨',
                  amount: actualRent,
                  ownerCashAfter: updatedCash[owner.id],
                  at: Date.now(),
                };
              }
            }
          } else if (targetTile.type === 'chest') {
            const drawnChest = drawFromDeck(botChestDeck, CHEST_CARDS);
            const card = drawnChest.card;
            botChestDeck = drawnChest.nextDeck;
            botDrawnCard = { cardId: card.id, playerId: turnPlayerId, at: Date.now() };
            if (card.rewardMoney) {
              botCash += card.rewardMoney;
              updatedCash[turnPlayerId] = botCash;
            }
            if (card.collectFromAll) {
              players.forEach((other) => {
                if (other.id !== turnPlayerId) {
                  updatedCash[other.id] = Math.max(0, (updatedCash[other.id] ?? INITIAL_CASH_M) - card.collectFromAll!);
                  botCash += card.collectFromAll!;
                }
              });
              updatedCash[turnPlayerId] = botCash;
            }
            if (card.payToAll) {
              players.forEach((other) => {
                if (other.id !== turnPlayerId) {
                  updatedCash[other.id] = (updatedCash[other.id] ?? INITIAL_CASH_M) + card.payToAll!;
                  botCash = Math.max(0, botCash - card.payToAll!);
                }
              });
              updatedCash[turnPlayerId] = botCash;
            }
            let botChestDesc = `🎁 🤖 ${currentTurnPlayer.display_name} เปิดหีบ: [${card.title}]`;
            if (card.rewardMoney && card.rewardMoney > 0) {
              botChestDesc += ` ➔ ได้รับ +${formatMoneyM(card.rewardMoney)} (รวม ${formatMoneyM(botCash)})`;
            } else if (card.rewardMoney && card.rewardMoney < 0) {
              botChestDesc += ` ➔ เสียเงิน ${formatMoneyM(Math.abs(card.rewardMoney))} (เหลือ ${formatMoneyM(botCash)})`;
            }
            botTurnLogs = addLog(botChestDesc, '#ec4899', botTurnLogs);
          } else if (targetTile.type === 'chance') {
            const drawnChance = drawFromDeck(botChanceDeck, CHANCE_CARDS);
            const card = drawnChance.card;
            botChanceDeck = drawnChance.nextDeck;
            botDrawnCard = { cardId: card.id, playerId: turnPlayerId, at: Date.now() };
            if (card.rewardMoney) {
              botCash += card.rewardMoney;
              updatedCash[turnPlayerId] = botCash;
            }
            let botTeleportPassedGo = false;
            let botCardFlightDest: number | null = null;
            let botCardFlightPassedGo = false;
            if (card.teleportToIndex !== undefined) {
              // Forward round the board: a destination behind you means the
              // start went past, and the salary with it.
              if (card.teleportToIndex <= currentPos) {
                botCash += SALARY_M;
                updatedCash[turnPlayerId] = botCash;
                botTeleportPassedGo = true;
              }
              updatedPositions[turnPlayerId] = card.teleportToIndex;
              currentPos = card.teleportToIndex;

              // Resolve the tile we warped onto. Without this the bot lands on
              // free property and simply stands there.
              const destTile = SUPER_MONOPOLY_TILES[card.teleportToIndex];
              const destOwnership = botProperties[card.teleportToIndex];
              if (destTile && destTile.type === 'property') {
                if (!destOwnership && destTile.cost && botCash > destTile.cost * 1.3) {
                  botCash -= destTile.cost;
                  updatedCash[turnPlayerId] = botCash;
                  botProperties[card.teleportToIndex] = { ownerId: turnPlayerId, houses: 0, visits: 1 };
                  botRowBonus = recomputeRowBonus(botProperties, botRowBonus, {
                    tileIndex: card.teleportToIndex,
                    ownerId: turnPlayerId,
                  });
                  botTurnLogs = addLog(
                    `🏡 🤖 ${currentTurnPlayer.display_name} วาร์ปมาแล้วซื้อที่ดิน [${destTile.name}] (${formatMoneyM(destTile.cost)}) \u279c เงินเหลือ ${formatMoneyM(botCash)}`,
                    '#22c55e',
                    botTurnLogs
                  );
                } else if (destOwnership && destOwnership.ownerId === turnPlayerId) {
                  // Warping onto its own land counts as a visit too.
                  const visits = (destOwnership.visits || 0) + 1;
                  botProperties[card.teleportToIndex] = { ...destOwnership, visits };
                  if (destTile.isUtility) {
                    botTurnLogs = addLog(
                      `🏨 🤖 ${currentTurnPlayer.display_name} วาร์ปมาถึงกิจการของตัวเอง [${destTile.name}] ➜ ค่าผ่านทางคูณ x${visitMultiplier(
                        visits
                      )}`,
                      '#06b6d4',
                      botTurnLogs
                    );
                  } else {
                    const built = botBuildUpTo(card.teleportToIndex, destTile, visits);
                    if (built.log) botTurnLogs = addLog(built.log, '#06b6d4', botTurnLogs);
                    updatedCash[turnPlayerId] = botCash;
                  }
                } else if (destOwnership && destOwnership.ownerId !== turnPlayerId) {
                  const destOwner = players.find((pl) => pl.id === destOwnership.ownerId);
                  const rent = computeRent(destTile, destOwnership, botProperties, botRowBonus);
                  const paid = Math.min(botCash, rent);
                  botCash = Math.max(0, botCash - rent);
                  updatedCash[turnPlayerId] = botCash;
                  if (destOwner) {
                    updatedCash[destOwner.id] = (updatedCash[destOwner.id] ?? INITIAL_CASH_M) + paid;
                  }
                  botTurnLogs = addLog(
                    `💸 🤖 ${currentTurnPlayer.display_name} วาร์ปมาตกที่ดินของ ${destOwner?.display_name || 'เจ้าของ'} จ่ายค่าผ่านทาง ${formatMoneyM(paid)} (เงินเหลือ ${formatMoneyM(botCash)})`,
                    '#ef4444',
                    botTurnLogs
                  );
                  if (destOwner) {
                    botRentReceipt = {
                      ownerId: destOwner.id,
                      payerName: currentTurnPlayer.display_name,
                      tileName: destTile.name,
                      tileIcon: destTile.icon || '🏨',
                      amount: paid,
                      ownerCashAfter: updatedCash[destOwner.id],
                      at: Date.now(),
                    };
                  }
                }
              } else if (destTile && destTile.type === 'airport') {
                // Same deal the bot gets for walking in: the seat is booked
                // for its next turn.
                botFlightState[turnPlayerId] = true;
              }
            }
            if (card.chooseDestination) {
              // No trip to the airport and no waiting: the bot picks now, from
              // where it stands, exactly as a player would.
              const dest = chooseBotDestination(currentPos, botProperties, turnPlayerId, botCash);
              if (dest !== currentPos) {
                if (dest <= currentPos) {
                  botCash += SALARY_M;
                  updatedCash[turnPlayerId] = botCash;
                  botCardFlightPassedGo = true;
                }
                currentPos = dest;
                updatedPositions[turnPlayerId] = dest;
                botCardFlightDest = dest;
              }
            }
            if (card.goJail) {
              updatedPositions[turnPlayerId] = 10;
              botJailState[turnPlayerId] = 1;
              currentPos = 10;
            }
            let botChanceDesc = `⛩️ 🤖 ${currentTurnPlayer.display_name} เปิดดวง: [${card.title}]`;
            if (card.rewardMoney && card.rewardMoney > 0) {
              botChanceDesc += ` ➔ ได้รับ +${formatMoneyM(card.rewardMoney)} (รวม ${formatMoneyM(botCash)})`;
            } else if (card.rewardMoney && card.rewardMoney < 0) {
              botChanceDesc += ` ➔ เสียเงิน ${formatMoneyM(Math.abs(card.rewardMoney))} (เหลือ ${formatMoneyM(botCash)})`;
            } else if (card.teleportToIndex !== undefined) {
              const targetT = SUPER_MONOPOLY_TILES[card.teleportToIndex];
              botChanceDesc +=
                targetT?.type === 'airport'
                  ? ` ➔ บินไปลงที่ [${targetT.name}] ➜ ตาหน้าจะบินต่อ`
                  : ` ➔ วาร์ปไป [${targetT?.name}]`;
              if (botTeleportPassedGo) {
                botChanceDesc += ` (ผ่านจุดเริ่มต้น รับ +${formatMoneyM(SALARY_M)})`;
              }
            } else if (card.chooseDestination && botCardFlightDest !== null) {
              botChanceDesc += ` ➔ ย้ายไป [${SUPER_MONOPOLY_TILES[botCardFlightDest]?.name}]${
                botCardFlightPassedGo ? ` (ผ่านจุดเริ่มต้น รับ +${formatMoneyM(SALARY_M)})` : ''
              }`;
            } else if (card.goJail) {
              botChanceDesc += ` ➔ เข้าห้องขังทันที!`;
            }
            botTurnLogs = addLog(botChanceDesc, '#eab308', botTurnLogs);

            // Landing by card is landing: buy it, build on it, or pay for it.
            if (botCardFlightDest !== null) {
              const arrival = botResolveArrival(botCardFlightDest, 'ย้ายฐาน', botTurnLogs);
              botTurnLogs = arrival.logs;
              if (arrival.wentBankrupt) botBankrupted = true;
              updatedCash[turnPlayerId] = botCash;
              if (arrival.ownerPay) {
                updatedCash[arrival.ownerPay.id] =
                  (botCashAll[arrival.ownerPay.id] ?? INITIAL_CASH_M) + arrival.ownerPay.amount;
                if (arrival.receipt) {
                  botRentReceipt = {
                    ...arrival.receipt,
                    ownerCashAfter: updatedCash[arrival.ownerPay.id],
                  };
                }
              }
            }
          } else if (targetTile.type === 'tax') {
            botCash = Math.max(0, botCash - 1.0);
            updatedCash[turnPlayerId] = botCash;
            botTurnLogs = addLog(`💰 🤖 ${currentTurnPlayer.display_name} จ่ายภาษี 1.0M (เงินเหลือ ${formatMoneyM(botCash)})`, '#f97316', botTurnLogs);
          } else if (targetTile.type === 'airport') {
            if (isDoubleRoll) {
              const dest = chooseBotDestination(finalPos, botProperties, turnPlayerId, botCash);
              const passedStart = dest <= finalPos;
              if (passedStart) {
                botCash += SALARY_M;
                updatedCash[turnPlayerId] = botCash;
              }
              updatedPositions[turnPlayerId] = dest;
              currentPos = dest;
              botTurnLogs = addLog(
                `✈️ 🤖 ${currentTurnPlayer.display_name} ถึงสนามบินตอนได้แต้มคู่ ➜ บินไป [${SUPER_MONOPOLY_TILES[dest]?.name}]${
                  passedStart ? ` (ผ่านจุดเริ่มต้น รับ +${formatMoneyM(SALARY_M)})` : ''
                }`,
                '#0ea5e9',
                botTurnLogs
              );

              // The square it flew to still has to be settled.
              const arrival = botResolveArrival(dest, 'บิน', botTurnLogs);
              botTurnLogs = arrival.logs;
              updatedCash[turnPlayerId] = botCash;
              if (arrival.ownerPay) {
                updatedCash[arrival.ownerPay.id] =
                  (updatedCash[arrival.ownerPay.id] ?? INITIAL_CASH_M) + arrival.ownerPay.amount;
              }
              if (arrival.receipt && arrival.ownerPay) {
                botRentReceipt = {
                  ...arrival.receipt,
                  ownerCashAfter: updatedCash[arrival.ownerPay.id],
                };
              }
              if (arrival.wentBankrupt) botBankrupted = true;
            } else {
              botFlightState[turnPlayerId] = true;
              botTurnLogs = addLog(
                `✈️ 🤖 ${currentTurnPlayer.display_name} ถึงสนามบิน ➜ ตาหน้าจะบินต่อ`,
                '#0ea5e9',
                botTurnLogs
              );
            }
          } else if (targetTile.type === 'jail') {
            botJailState[turnPlayerId] = 1;
            botTurnLogs = addLog(
              `⛓️ 🤖 ${currentTurnPlayer.display_name} เดินมาตกห้องขัง ➜ ติดคุก!`,
              '#dc2626',
              botTurnLogs
            );
          } else if (targetTile.type === 'parking') {
            // Costs a turn the way jail does
            botRestState[turnPlayerId] = 1;
            botTurnLogs = addLog(
              `🏖️ 🤖 ${currentTurnPlayer.display_name} แวะพักที่ [${targetTile.name}] ➜ ปลอดภัยจากค่าผ่านทาง แต่ต้องพัก 1 ตา`,
              '#38bdf8',
              botTurnLogs
            );
          } else if (targetTile.type === 'start') {
            botTurnLogs = addLog(`🏁 🤖 ${currentTurnPlayer.display_name} ถึงจุดเริ่มต้น`, '#22c55e', botTurnLogs);
          }

          botTurnLogs = rowBonusAnnouncement(rowBonus, botRowBonus, botTurnLogs);

          // Bank this roll's cash before sending it: on a double the next roll
          // starts from here, not from the snapshot this turn opened with.
          botCashAll = { ...updatedCash };

          // Single clean server state sync
          await botSync({
            positions: updatedPositions,
            cash: updatedCash,
            properties: botProperties,
            rowBonus: botRowBonus,
            inJailTurns: botJailState,
            restTurns: botRestState,
            pendingFlights: botFlightState,
            ...(botBankrupted
              ? (() => {
                  const bust = botBankruptPatch(botTurnLogs);
                  botTurnLogs = bust.logs;
                  return bust.patch;
                })()
              : {}),
            gameLogs: botTurnLogs,
            chestDeck: botChestDeck,
            chanceDeck: botChanceDeck,
            drawnCard: botDrawnCard,
            rentReceipt: botRentReceipt,
            activeStepTileIndex: null,
            isMoving: false,
            isRolling: false,
          });

          // A double rolls again - unless the square took the turn: jail, the
          // rest stop, or a flight, which is itself the extra move.
          if (
            isDoubleRoll &&
            targetTile.type !== 'airport' &&
            !botJailState[turnPlayerId] &&
            !botRestState[turnPlayerId]
          ) {
            if (rollsThisTurn >= BOT_MAX_ROLLS_PER_TURN) {
              botTurnLogs = addLog(
                `🛑 🤖 ${currentTurnPlayer.display_name} ทอยแต้มคู่ครบ ${BOT_MAX_ROLLS_PER_TURN} ครั้งในตาเดียว ➜ จบตา`,
                '#f59e0b',
                botTurnLogs
              );
            } else {
              shouldRollAgain = true;
              await new Promise((resolve) => setTimeout(resolve, 1500));
            }
          }
        } // end while loop

        // 5. Pass turn to next player
        if (!isMounted) return;
        await new Promise((resolve) => setTimeout(resolve, 1800));
        if (!isMounted) return;

        const nextPlayer = nextActiveAfter(orderedPlayersRef.current, turnPlayerId, bankrupt);
        if (!nextPlayer) return;

        botTurnLogs = addLog(`🎲 ส่งตาให้ [${nextPlayer.display_name}]`, '#93c5fd', botTurnLogs);
        await botSync({
          gameLogs: botTurnLogs,
          isRolling: false,
          isMoving: false,
          activeStepTileIndex: null,
          // Nobody can press close on a bot's card, so its turn ending is what
          // takes it off everyone's screen.
          drawnCard: null,
        });
        await onNextTurn(nextPlayer.id);
      } catch (err) {
        console.error('Bot turn error:', err);
        // Guaranteed recovery on error
        const nextPlayer = nextActiveAfter(orderedPlayersRef.current, turnPlayerId, bankrupt);
        if (!nextPlayer) return;
        if (nextPlayer) {
          await onNextTurn(nextPlayer.id);
        }
      } finally {
        botTurnRunningRef.current = false;
        if (botWatchdogTimerRef.current) {
          clearTimeout(botWatchdogTimerRef.current);
          botWatchdogTimerRef.current = null;
        }
      }
    };

    executeBotTurn();

    return () => {
      isMounted = false;
      botTurnRunningRef.current = false;
      if (botWatchdogTimerRef.current) {
        clearTimeout(botWatchdogTimerRef.current);
        botWatchdogTimerRef.current = null;
      }
    };
  }, [room.current_turn_player_id, isHost, rawState.roll_order_done]);

  return {
    dice,
    drawnCard: (rawState.drawnCard as { cardId: string; playerId: string; at: number } | null) || null,
    rentReceipt,
    isProxying,
    canActThisTurn,
    startProxyTurn,
    diceTotal: dice[0] + dice[1],
    isDouble,
    hasRolledThisTurn,
    isRolling,
    isMoving,
    activeStepTileIndex,
    activeStepPlayerId,
    isMyTurn,
    isBotTurn,
    isCurrentPlayerInJail,
    isCurrentPlayerResting,
    inJailTurns,
    restTurns,
    handleServeJailTurn,
    bankrupt,
    bankruptcyNotice,
    rowBonus,
    startingDeal,
    winnerId,
    debtDecision,
    handleMortgageAndPay,
    handleDeclareBankrupt,
    isCurrentPlayerBoarding,
    showFlightPicker,
    handleOpenFlightPicker,
    handleChooseFlight,
    closeFlightPicker: () => setShowFlightPicker(false),
    handlePayJailBail,
    jailBailCost: JAIL_BAIL_M,
    handleServeRestTurn,
    currentTurnPlayer,
    positions,
    properties,
    cash,
    activePropertyModal,
    setActivePropertyModal,
    activeCard,
    setActiveCard,
    activePenaltyModal,
    setActivePenaltyModal,
    handleAcknowledgePenalty,
    jailNotice,
    handleAcknowledgeJail,
    restNotice,
    handleAcknowledgeRest,
    flightNotice,
    handleAcknowledgeFlight,
    gameLogs,
    rollDice,
    handleBuyLand,
    handleBuildHouse,
    handleEndTurn,
    isEndingTurn,
    handleCloseActiveModal,
    orderedPlayers,
    rollOrderDone: Boolean(rawState.roll_order_done),
  };
}
