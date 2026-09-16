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
} from './superMonopolyData';
import { sfx } from '@/lib/sound';
import confetti from 'canvas-confetti';
import { showToast } from '@/lib/alerts';
import { PenaltyNotice } from './PenaltyModal';
import { RentReceipt } from './RentReceiptModal';

const INITIAL_CASH_M = 15.0; // 15M starting cash
// Buying your way out of jail costs a turn's worth of nothing if it is free, and
// a fortune if it is steep. Half a million is roughly two bare-land rents.
const JAIL_BAIL_M = 0.5;
const SALARY_M = 2.0; // 2M for passing GO


// Rent for landing on someone else's tile, including the utility and hotel-chain rules.
function computeRent(
  tile: SuperPropertyTile,
  ownership: PropertyOwnership,
  allProperties: Record<number, PropertyOwnership>
): number {
  if (tile.isUtility) {
    if (tile.index === 5 || tile.index === 12) {
      const owned = [5, 12].filter((i) => allProperties[i]?.ownerId === ownership.ownerId).length;
      return owned >= 2 ? 1.2 : 0.5;
    }
    const hotels = [4, 15, 25, 26, 35].filter((i) => allProperties[i]?.ownerId === ownership.ownerId).length;
    return (tile.baseRent || 0.4) * Math.max(1, hotels);
  }
  if (ownership.houses === 1) return tile.rent1House || 0.5;
  if (ownership.houses === 2) return tile.rent2House || 1.2;
  if (ownership.houses === 3) return tile.rent3House || 2.5;
  if (ownership.houses === 4) return tile.rentHotel || 5.0;
  return tile.baseRent || 0.2;
}

export function useSuperMonopolyEngine(props: BaseGameProps) {
  const { room, players, currentPlayer, isHost, onUpdateGameState, onNextTurn, onUpdatePlayerDrink } = props;

  // Extract game_state with safe defaults (Realtime Single Source of Truth like useMonopolyEngine)
  const rawState = room.game_state || {};
  const positions: Record<string, number> = rawState.positions || {};
  const properties: Record<number, PropertyOwnership> = rawState.properties || {};
  const cash: Record<string, number> = rawState.cash || {};
  const inJailTurns: Record<string, number> = rawState.inJailTurns || {};
  const restTurns: Record<string, number> = rawState.restTurns || {};
  const gameLogs: Array<{ text: string; time: string; color?: string }> = rawState.gameLogs || [];
  const rentReceipt: RentReceipt | null = (rawState.rentReceipt as RentReceipt | null) || null;

  // Synchronized across all screens via Supabase Realtime
  const isRolling = Boolean(rawState.isRolling);
  const isMoving = Boolean(rawState.isMoving);
  const serverDice: [number, number] = rawState.dice || [1, 1];
  const activeStepTileIndex: number | null = rawState.activeStepTileIndex ?? null;

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
  const [hasRolledThisTurn, setHasRolledThisTurn] = useState<boolean>(false);
  const [isDouble, setIsDouble] = useState<boolean>(false);

  // Turn management ref to prevent duplicate or frozen bot turns
  // A teleport card drops you on a new tile, and that tile has to be resolved
  // too - otherwise you warp onto empty land and are never offered the purchase.
  const [pendingTeleportTile, setPendingTeleportTile] = useState<number | null>(null);

  const handledTurnKeyRef = useRef<string>('');
  // Whether a bot turn is actually in flight. Without this, a turn torn down
  // mid-flight stays blocked forever: the key still matches, so the effect
  // refuses to start it again and the bot freezes with no watchdog left.
  const botTurnRunningRef = useRef<boolean>(false);
  const botWatchdogTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const currentTurnPlayer = orderedPlayers.find((p) => p.id === room.current_turn_player_id) || orderedPlayers[0];
  const isMyTurn = Boolean(currentPlayer && currentPlayer.id === currentTurnPlayer?.id);
  const isBotTurn = Boolean(
    currentTurnPlayer?.id?.startsWith('bot-') || currentTurnPlayer?.line_user_id === 'bot'
  );

  const isCurrentPlayerInJail = Boolean(
    currentTurnPlayer && (inJailTurns[currentTurnPlayer.id] ?? 0) > 0
  );
  const isCurrentPlayerResting = Boolean(
    currentTurnPlayer && (restTurns[currentTurnPlayer.id] ?? 0) > 0
  );

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

  const addLog = useCallback(
    (text: string, color?: string, currentLogs?: Array<{ text: string; time: string; color?: string }>) => {
      const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const base = currentLogs ?? gameLogsRef.current;
      const newLogs = [{ text, time, color }, ...base.slice(0, 50)];
      return newLogs;
    },
    []
  );

  // End Turn & Pass to Next Player
  const handleEndTurn = useCallback(async () => {
    const endingTurnId = currentTurnPlayer?.id;
    if (endingTurnId) {
      if (endedTurnRef.current === endingTurnId) return;
      endedTurnRef.current = endingTurnId;
    }

    setActivePropertyModal(null);
    setActiveCard(null);
    setActivePenaltyModal(null);
    setHasRolledThisTurn(false);
    setIsDouble(false);

    if (orderedPlayers.length === 0) return;

    const currentIndex = orderedPlayers.findIndex((p) => p.id === currentTurnPlayer?.id);
    const nextIndex = (currentIndex + 1) % orderedPlayers.length;
    const nextPlayer = orderedPlayers[nextIndex];

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
          isRolling: false,
          isMoving: true,
          cash: { ...cash, [currentTurnPlayer.id]: playerCash },
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
              targetTile.type === 'go_to_jail'
                ? ' (แต้มคู่ แต่ติดคุก ไม่ได้ทอยต่อ)'
                : targetTile.type === 'parking'
                ? ' (แต้มคู่ แต่ต้องพัก ไม่ได้ทอยต่อ)'
                : ' 🎉 แต้มคู่ (Double)!';
          }

          let newLogs = addLog(moveLog, '#f59e0b');
          const updatedPositions = { ...positions, [currentTurnPlayer.id]: finalPos };
          const updatedCash = { ...cash, [currentTurnPlayer.id]: playerCash };
          const updatedJail = { ...inJailTurns, [currentTurnPlayer.id]: 0 };
          const updatedRest = { ...restTurns, [currentTurnPlayer.id]: 0 };
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
                // OWN PROPERTY -> SHOW BUILD MODAL. Bots have always upgraded on
                // landing; humans had no branch here at all, so they could never
                // build a house anywhere in the game.
                sfx.playSuccess();
                newLogs = addLog(
                  `🏡 ${currentTurnPlayer.display_name} เดินมาตกที่ดินของตัวเอง [${targetTile.name}] ➜ สามารถพัฒนาต่อได้`,
                  '#06b6d4',
                  newLogs
                );
                setActivePropertyModal(targetTile);
                requiresUserModalAction = true;
              } else if (ownership.ownerId !== currentTurnPlayer.id) {
                // Pay Rent
                const owner = players.find((p) => p.id === ownership.ownerId);
                let rentAmount = targetTile.baseRent || 0.2;
                if (targetTile.isUtility) {
                  if (finalPos === 5 || finalPos === 12) {
                    // Utility: การประปานครหลวง (5) & โรงไฟฟ้านครหลวง (12)
                    const utilityIndices = [5, 12];
                    const ownedUtilCount = utilityIndices.filter((uIdx) => properties[uIdx]?.ownerId === ownership.ownerId).length;
                    rentAmount = ownedUtilCount >= 2 ? 1.2 : 0.5;
                  } else {
                    // Hotel chain bonus: count how many hotels (4, 15, 25, 26, 35) this owner owns
                    const hotelIndices = [4, 15, 25, 26, 35];
                    const ownedHotelsCount = hotelIndices.filter((hIdx) => properties[hIdx]?.ownerId === ownership.ownerId).length;
                    rentAmount = (targetTile.baseRent || 0.4) * Math.max(1, ownedHotelsCount);
                  }
                } else {
                  if (ownership.houses === 1) rentAmount = targetTile.rent1House || 0.5;
                  if (ownership.houses === 2) rentAmount = targetTile.rent2House || 1.2;
                  if (ownership.houses === 3) rentAmount = targetTile.rent3House || 2.5;
                  if (ownership.houses === 4) rentAmount = targetTile.rentHotel || 5.0;
                }

                const actualRent = Math.min(playerCash, rentAmount);
                const remainingCash = Math.max(0, playerCash - rentAmount);
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
              if (card.rewardMoney) updatedCash[currentTurnPlayer.id] += card.rewardMoney;
              if (card.teleportToIndex !== undefined) {
                updatedPositions[currentTurnPlayer.id] = card.teleportToIndex;
                const destTile = SUPER_MONOPOLY_TILES[card.teleportToIndex];
                if (destTile?.type === 'property') {
                  setPendingTeleportTile(card.teleportToIndex);
                }
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
                chanceDesc += ` ➔ วาร์ปไปที่ [${targetT?.name}]`;
              } else if (card.goJail) {
                chanceDesc += ` ➔ ถูกส่งตัวเข้าห้องขังทันที!`;
              }
              newLogs = addLog(chanceDesc, '#eab308', newLogs);
            } else if (targetTile.type === 'tax') {
              const taxAmount = 1.0;
              const remainingCash = Math.max(0, playerCash - taxAmount);
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
            } else if (targetTile.type === 'go_to_jail') {
              updatedPositions[currentTurnPlayer.id] = 10;
              updatedJail[currentTurnPlayer.id] = 1;
              sfx.playDrinkPenalty();
              newLogs = addLog(`⛓️ ${currentTurnPlayer.display_name} โดนจับส่งเข้าห้องขัง!`, '#dc2626', newLogs);
              if (canActThisTurn) {
                setJailNotice({ tileName: targetTile.name, wasDouble: isDoubleRoll });
                requiresUserModalAction = true;
              }
            } else if (targetTile.type === 'jail') {
              sfx.playSuccess();
              newLogs = addLog(`⛓️ ${currentTurnPlayer.display_name} แวะเยี่ยมคุก (เป็นผู้มาเยือน ปลอดภัย)`, '#a855f7', newLogs);
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
              gameLogs: newLogs,
              ...(updatedChestDeck ? { chestDeck: updatedChestDeck } : {}),
              ...(updatedChanceDeck ? { chanceDeck: updatedChanceDeck } : {}),
              drawnCard: drawnCardBroadcast,
              rentReceipt: rentReceiptBroadcast,
            });

            // If no modal required:
            if (!requiresUserModalAction) {
              if (
                isDoubleRoll &&
                targetTile.type !== 'go_to_jail' &&
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
      cash: { ...cash, [currentTurnPlayer.id]: remaining },
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

    const updatedCash = { ...cash, [currentTurnPlayer.id]: currentMoney - cost };
    const updatedProperties = {
      ...properties,
      [tileIdx]: { ownerId: currentTurnPlayer.id, houses: 0 },
    };

    sfx.playSuccess();
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });

    const remainingMoney = currentMoney - cost;
    const newLogs = addLog(
      `🏡 ${currentTurnPlayer.display_name} ตกลง [ซื้อที่ดิน] [${activePropertyModal.name}] (${formatMoneyM(cost)}) ➔ เงินคงเหลือ ${formatMoneyM(remainingMoney)}`,
      '#10b981'
    );

    setActivePropertyModal(null);

    await onUpdateGameState({
      cash: updatedCash,
      properties: updatedProperties,
      gameLogs: newLogs,
    });

    if (isDouble && !isCurrentPlayerInJail && !isCurrentPlayerResting) {
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
    const isUpgradingToHotel = currentHouses === 3;
    const cost = isUpgradingToHotel
      ? activePropertyModal.hotelCost || 2.0
      : activePropertyModal.houseCost || 0.8;

    const currentMoney = cash[currentTurnPlayer.id] ?? 0;
    if (currentMoney < cost) {
      showToast('เงินสดไม่เพียงพอในการสร้างสิ่งปลูกสร้าง', 'warning');
      return;
    }

    const updatedCash = { ...cash, [currentTurnPlayer.id]: currentMoney - cost };
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

    setActivePropertyModal(null);

    await onUpdateGameState({
      cash: updatedCash,
      properties: updatedProperties,
      gameLogs: newLogs,
    });

    // Building has to settle the turn the way buying does. The card used to
    // close itself afterwards and the close handler did this - so once the card
    // stopped closing twice, building a house quietly ate the reroll a double
    // had earned and left the turn waiting on "pass".
    if (isDouble && !isCurrentPlayerInJail && !isCurrentPlayerResting) {
      showToast('🎉 ได้แต้มคู่! คุณมีสิทธิ์ทอยเต๋าต่ออีกรอบ', 'success');
      setHasRolledThisTurn(false);
    } else {
      setTimeout(() => {
        handleEndTurn();
      }, 1200);
    }
  };

  // Close Active Modal and Auto Advance Turn
  const handleCloseActiveModal = async () => {
    if (activePropertyModal && canActThisTurn) {
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

      const destTile = SUPER_MONOPOLY_TILES[destIndex];
      const destOwnership = properties[destIndex];

      if (destTile && destTile.type === 'property') {
        if (!destOwnership || destOwnership.ownerId === currentTurnPlayer.id) {
          // Free land, or our own: open the buy / build card
          setActivePropertyModal(destTile);
          return;
        }

        // Someone else's land: charge rent and make them acknowledge it
        const owner = players.find((p) => p.id === destOwnership.ownerId);
        const myCashNow = cash[currentTurnPlayer.id] ?? INITIAL_CASH_M;
        const rent = computeRent(destTile, destOwnership, properties);
        const actualRent = Math.min(myCashNow, rent);
        const remaining = Math.max(0, myCashNow - rent);

        const rentCash = { ...cash, [currentTurnPlayer.id]: remaining };
        if (owner) {
          rentCash[owner.id] = (rentCash[owner.id] ?? INITIAL_CASH_M) + actualRent;
        }

        sfx.playDrinkPenalty();
        const rentLogs = addLog(
          `💸 ${currentTurnPlayer.display_name} วาร์ปมาตกที่ดินของ ${owner?.display_name || 'เจ้าของ'} จ่ายค่าผ่านทาง ${formatMoneyM(actualRent)} (เงินเหลือ ${formatMoneyM(remaining)})`,
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
          reason: `คุณวาร์ปมาตกที่ดินของ [${owner?.display_name || 'เจ้าของที่ดิน'}]`,
          amount: actualRent,
          recipientName: owner?.display_name || 'เจ้าของที่ดิน',
          previousCash: myCashNow,
          remainingCash: remaining,
          houses: destOwnership.houses,
          isUtility: destTile.isUtility,
        });
        return;
      }
    }

    if (canActThisTurn && hasRolledThisTurn) {
      if (isDouble && !isCurrentPlayerInJail && !isCurrentPlayerResting) {
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
      if (isDouble && !isCurrentPlayerInJail && !isCurrentPlayerResting) {
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

    // Safety watchdog: If bot gets stuck for > 16s, force switch turn!
    if (botWatchdogTimerRef.current) clearTimeout(botWatchdogTimerRef.current);
    botWatchdogTimerRef.current = setTimeout(async () => {
      console.warn('[Bot Watchdog] Bot took too long! Auto-passing turn...');
      if (!isMounted) return;
      const currentIndex = orderedPlayersRef.current.findIndex((p) => p.id === turnPlayerId);
      const nextIndex = (currentIndex + 1) % orderedPlayersRef.current.length;
      const nextPlayer = orderedPlayersRef.current[nextIndex];
      if (nextPlayer) {
        await onNextTurn(nextPlayer.id);
      }
    }, 16000);

    const executeBotTurn = async () => {
      try {
        let rollsThisTurn = 0;
        let shouldRollAgain = true;
        let botTurnLogs = gameLogsRef.current;
        let botCash: number = cash[turnPlayerId] ?? INITIAL_CASH_M;
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

        while (shouldRollAgain && rollsThisTurn < 2 && isMounted) {
          rollsThisTurn++;
          shouldRollAgain = false;

          // 1. Pause briefly
          await new Promise((resolve) => setTimeout(resolve, 1000));
          if (!isMounted) return;

          // Check if bot is resting at parking spot (หยุดทอย 1 ตา):
          if (botRestTurns > 0) {
            botRestState[turnPlayerId] = 0;
            botTurnLogs = addLog(
              `🏖️ 🤖 ${currentTurnPlayer.display_name} กำลังหยุดพักผ่อนที่จุดพัก ต้องหยุดทอย 1 ตา (ข้ามตานี้)`,
              '#38bdf8',
              botTurnLogs
            );
            await onUpdateGameState({
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
              await onUpdateGameState({
                inJailTurns: botJailState,
                cash: { ...cash, [turnPlayerId]: botCash },
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
              await onUpdateGameState({
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
          await onUpdateGameState({
            dice: [d1, d2],
            isRolling: true,
            isMoving: false,
            activeStepTileIndex: null,
          });

          await new Promise((resolve) => setTimeout(resolve, 1200));
          if (!isMounted) return;

          // Reveal final dice numbers on all screens
          await onUpdateGameState({
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
            await onUpdateGameState({
              positions: botStepPositions,
              activeStepTileIndex: stepPos,
              isRolling: false,
              isMoving: true,
              cash: { ...cash, [turnPlayerId]: botCash },
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
              targetTile.type === 'go_to_jail'
                ? ' (แต้มคู่ แต่ติดคุก ไม่ได้ทอยต่อ)'
                : targetTile.type === 'parking'
                ? ' (แต้มคู่ แต่ต้องพัก ไม่ได้ทอยต่อ)'
                : ' 🎉 แต้มคู่!';
          }

          botTurnLogs = addLog(logText, '#93c5fd', botTurnLogs);
          const updatedPositions = { ...positions, [turnPlayerId]: finalPos };
          const updatedCash = { ...cash, [turnPlayerId]: botCash };
          botJailState[turnPlayerId] = 0;

          // 4. Bot Decision on Target Tile:
          if (targetTile.type === 'property') {
            const ownership = botProperties[finalPos];
            if (!ownership && targetTile.cost && botCash > targetTile.cost * 1.2) {
              // Bot buys property
              botCash -= targetTile.cost;
              updatedCash[turnPlayerId] = botCash;
              botProperties[finalPos] = { ownerId: turnPlayerId, houses: 0 };
              botTurnLogs = addLog(
                `🏡 🤖 ${currentTurnPlayer.display_name} ตกลง [ซื้อที่ดิน] [${targetTile.name}] (${formatMoneyM(targetTile.cost)}) ➔ เงินเหลือ ${formatMoneyM(botCash)}`,
                '#10b981',
                botTurnLogs
              );
            } else if (!ownership && targetTile.cost) {
              // Bot skips buying!
              botTurnLogs = addLog(
                `⏭️ 🤖 ${currentTurnPlayer.display_name} เลือก [ไม่ซื้อที่ดิน] [${targetTile.name}] (เงินเหลือ ${formatMoneyM(botCash)})`,
                '#9ca3af',
                botTurnLogs
              );
            } else if (ownership && ownership.ownerId === turnPlayerId && !targetTile.isUtility && ownership.houses < 4) {
              // Bot upgrades house
              const cost = ownership.houses === 3 ? (targetTile.hotelCost || 2.0) : (targetTile.houseCost || 0.8);
              if (botCash > cost * 1.5) {
                botCash -= cost;
                updatedCash[turnPlayerId] = botCash;
                botProperties[finalPos] = { ...ownership, houses: ownership.houses + 1 };
                const upgName = ownership.houses === 3 ? 'โรงแรมหรู' : `บ้านหลังที่ ${ownership.houses + 1}`;
                botTurnLogs = addLog(
                  `🏨 🤖 ${currentTurnPlayer.display_name} สร้าง${upgName} บน [${targetTile.name}] (${formatMoneyM(cost)}) ➔ เงินเหลือ ${formatMoneyM(botCash)}`,
                  '#06b6d4',
                  botTurnLogs
                );
              }
            } else if (ownership && ownership.ownerId !== turnPlayerId) {
              // Bot pays rent
              const owner = players.find((p) => p.id === ownership.ownerId);
              let rent = targetTile.baseRent || 0.2;
              if (targetTile.isUtility) {
                if (finalPos === 5 || finalPos === 12) {
                  // Utility: การประปานครหลวง (5) & โรงไฟฟ้านครหลวง (12)
                  const utilityIndices = [5, 12];
                  const ownedUtilCount = utilityIndices.filter((uIdx) => botProperties[uIdx]?.ownerId === ownership.ownerId).length;
                  rent = ownedUtilCount >= 2 ? 1.2 : 0.5;
                } else {
                  // Hotel chain bonus: count how many hotels (4, 15, 25, 26, 35) this owner owns
                  const hotelIndices = [4, 15, 25, 26, 35];
                  const ownedHotelsCount = hotelIndices.filter((hIdx) => botProperties[hIdx]?.ownerId === ownership.ownerId).length;
                  rent = (targetTile.baseRent || 0.4) * Math.max(1, ownedHotelsCount);
                }
              } else {
                if (ownership.houses === 1) rent = targetTile.rent1House || 0.5;
                if (ownership.houses === 2) rent = targetTile.rent2House || 1.2;
                if (ownership.houses === 3) rent = targetTile.rent3House || 2.5;
                if (ownership.houses === 4) rent = targetTile.rentHotel || 5.0;
              }

              const actualRent = Math.min(botCash, rent);
              botCash = Math.max(0, botCash - rent);
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
            if (card.teleportToIndex !== undefined) {
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
                  botProperties[card.teleportToIndex] = { ownerId: turnPlayerId, houses: 0 };
                  botTurnLogs = addLog(
                    `🏡 🤖 ${currentTurnPlayer.display_name} วาร์ปมาแล้วซื้อที่ดิน [${destTile.name}] (${formatMoneyM(destTile.cost)}) \u279c เงินเหลือ ${formatMoneyM(botCash)}`,
                    '#22c55e',
                    botTurnLogs
                  );
                } else if (destOwnership && destOwnership.ownerId !== turnPlayerId) {
                  const destOwner = players.find((pl) => pl.id === destOwnership.ownerId);
                  const rent = computeRent(destTile, destOwnership, botProperties);
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
              botChanceDesc += ` ➔ วาร์ปไป [${targetT?.name}]`;
            } else if (card.goJail) {
              botChanceDesc += ` ➔ เข้าห้องขังทันที!`;
            }
            botTurnLogs = addLog(botChanceDesc, '#eab308', botTurnLogs);
          } else if (targetTile.type === 'tax') {
            botCash = Math.max(0, botCash - 1.0);
            updatedCash[turnPlayerId] = botCash;
            botTurnLogs = addLog(`💰 🤖 ${currentTurnPlayer.display_name} จ่ายภาษี 1.0M (เงินเหลือ ${formatMoneyM(botCash)})`, '#f97316', botTurnLogs);
          } else if (targetTile.type === 'go_to_jail') {
            updatedPositions[turnPlayerId] = 10;
            botJailState[turnPlayerId] = 1;
            currentPos = 10;
            botTurnLogs = addLog(`⛓️ 🤖 ${currentTurnPlayer.display_name} โดนจับส่งเข้าห้องขัง!`, '#dc2626', botTurnLogs);
          } else if (targetTile.type === 'jail') {
            botTurnLogs = addLog(`⛓️ 🤖 ${currentTurnPlayer.display_name} แวะเยี่ยมคุก ชิลๆ ไม่ถูกขัง`, '#a855f7', botTurnLogs);
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

          // Single clean server state sync
          await onUpdateGameState({
            positions: updatedPositions,
            cash: updatedCash,
            properties: botProperties,
            inJailTurns: botJailState,
            restTurns: botRestState,
            gameLogs: botTurnLogs,
            chestDeck: botChestDeck,
            chanceDeck: botChanceDeck,
            drawnCard: botDrawnCard,
            rentReceipt: botRentReceipt,
            activeStepTileIndex: null,
            isMoving: false,
            isRolling: false,
          });

          // If rolled Double and NOT sent to jail, bot rolls again!
          if (
            isDoubleRoll &&
            targetTile.type !== 'go_to_jail' &&
            !botJailState[turnPlayerId] &&
            !botRestState[turnPlayerId]
          ) {
            shouldRollAgain = true;
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        } // end while loop

        // 5. Pass turn to next player
        if (!isMounted) return;
        await new Promise((resolve) => setTimeout(resolve, 1800));
        if (!isMounted) return;

        const currentIndex = orderedPlayersRef.current.findIndex((p) => p.id === turnPlayerId);
        const nextIndex = (currentIndex + 1) % orderedPlayersRef.current.length;
        const nextPlayer = orderedPlayersRef.current[nextIndex];

        botTurnLogs = addLog(`🎲 ส่งตาให้ [${nextPlayer.display_name}]`, '#93c5fd', botTurnLogs);
        await onUpdateGameState({
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
        const currentIndex = orderedPlayersRef.current.findIndex((p) => p.id === turnPlayerId);
        const nextIndex = (currentIndex + 1) % orderedPlayersRef.current.length;
        const nextPlayer = orderedPlayersRef.current[nextIndex];
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
    isMyTurn,
    isBotTurn,
    isCurrentPlayerInJail,
    isCurrentPlayerResting,
    inJailTurns,
    restTurns,
    handleServeJailTurn,
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
    gameLogs,
    rollDice,
    handleBuyLand,
    handleBuildHouse,
    handleEndTurn,
    handleCloseActiveModal,
    orderedPlayers,
    rollOrderDone: Boolean(rawState.roll_order_done),
  };
}
