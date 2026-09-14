import { useState, useCallback, useEffect, useRef } from 'react';
import { BaseGameProps } from '@/types/game';
import {
  SuperMonopolyGameState,
  PropertyOwnership,
  CardAction,
  SuperPropertyTile,
} from '@/types/database';
import {
  SUPER_MONOPOLY_TILES,
  CHEST_CARDS,
  CHANCE_CARDS,
  formatMoneyM,
} from './superMonopolyData';
import { sfx } from '@/lib/sound';
import confetti from 'canvas-confetti';
import { showToast } from '@/lib/alerts';

const INITIAL_CASH_M = 15.0; // 15M starting cash
const SALARY_M = 2.0; // 2M for passing GO
const JAIL_BAIL_M = 0.5; // 0.5M fine to leave jail immediately

export function useSuperMonopolyEngine(props: BaseGameProps) {
  const { room, players, currentPlayer, isHost, onUpdateGameState, onNextTurn, onUpdatePlayerDrink } = props;

  // Local state for 2 Dice (ลูกเต๋า 2 ลูก 🎲🎲)
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [activeStepTileIndex, setActiveStepTileIndex] = useState<number | null>(null);
  const [activePropertyModal, setActivePropertyModal] = useState<SuperPropertyTile | null>(null);
  const [activeCard, setActiveCard] = useState<CardAction | null>(null);
  const [hasRolledThisTurn, setHasRolledThisTurn] = useState<boolean>(false);
  const [isDouble, setIsDouble] = useState<boolean>(false);

  // Turn management ref to prevent duplicate or frozen bot turns
  const handledTurnKeyRef = useRef<string>('');
  const botWatchdogTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Extract game_state with safe defaults
  const rawState = room.game_state || {};
  const positions: Record<string, number> = rawState.positions || {};
  const properties: Record<number, PropertyOwnership> = rawState.properties || {};
  const cash: Record<string, number> = rawState.cash || {};
  const inJailTurns: Record<string, number> = rawState.inJailTurns || {};
  const gameLogs: Array<{ text: string; time: string; color?: string }> = rawState.gameLogs || [];

  const currentTurnPlayer = players.find((p) => p.id === room.current_turn_player_id) || players[0];
  const isMyTurn = Boolean(currentPlayer && currentPlayer.id === currentTurnPlayer?.id);
  const isBotTurn = Boolean(
    currentTurnPlayer?.id?.startsWith('bot-') || currentTurnPlayer?.line_user_id === 'bot'
  );

  const isCurrentPlayerInJail = Boolean(
    currentPlayer && (inJailTurns[currentPlayer.id] ?? 0) > 0
  );

  // Reset turn state when current turn player changes
  useEffect(() => {
    setHasRolledThisTurn(false);
    setIsDouble(false);
    setActivePropertyModal(null);
    setActiveCard(null);
    setActiveStepTileIndex(null);
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

  const addLog = useCallback(
    (text: string, color?: string) => {
      const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const newLogs = [{ text, time, color }, ...gameLogs.slice(0, 40)];
      return newLogs;
    },
    [gameLogs]
  );

  // End Turn & Pass to Next Player
  const handleEndTurn = useCallback(async () => {
    setActivePropertyModal(null);
    setActiveCard(null);
    setHasRolledThisTurn(false);
    setIsDouble(false);
    setActiveStepTileIndex(null);

    if (players.length === 0) return;

    const currentIndex = players.findIndex((p) => p.id === currentTurnPlayer?.id);
    const nextIndex = (currentIndex + 1) % players.length;
    const nextPlayer = players[nextIndex];

    const newLogs = addLog(`🎲 ส่งตาให้ [${nextPlayer.display_name}]`, '#93c5fd');

    await onUpdateGameState({ gameLogs: newLogs });
    await onNextTurn(nextPlayer.id);
  }, [players, currentTurnPlayer, addLog, onUpdateGameState, onNextTurn]);

  // Execute walking and landing logic for Human player
  const executeHumanWalk = useCallback(
    async (d1: number, d2: number) => {
      const totalRoll = d1 + d2;
      const isDoubleRoll = d1 === d2;

      setIsMoving(true);
      const startPos = positions[currentTurnPlayer.id] ?? 0;
      let stepCount = 0;
      let currentStepPos = startPos;
      let playerCash = cash[currentTurnPlayer.id] ?? INITIAL_CASH_M;
      let passedGoInWalk = false;

      // Local step animation (No server flooding on every step!)
      const stepInterval = setInterval(async () => {
        stepCount++;
        currentStepPos = (currentStepPos + 1) % 32;

        sfx.playStep();
        setActiveStepTileIndex(currentStepPos);

        if (currentStepPos === 0) {
          passedGoInWalk = true;
          playerCash += SALARY_M;
          sfx.playSuccess();
        }

        // Destination reached
        if (stepCount >= totalRoll) {
          clearInterval(stepInterval);
          sfx.playTileLand();

          const finalPos = currentStepPos;
          const targetTile = SUPER_MONOPOLY_TILES[finalPos];

          let moveLog = `${currentTurnPlayer.display_name} ทอยได้ [${d1}][${d2}] (${totalRoll} แต้ม) เดินไปที่ [${targetTile.name}]`;
          if (passedGoInWalk) {
            moveLog += ` (ผ่านจุดเริ่มต้น รับ +${formatMoneyM(SALARY_M)})`;
          }
          if (isDoubleRoll) {
            moveLog += ' 🎉 แต้มคู่ (Double)!';
          }

          let newLogs = addLog(moveLog, '#f59e0b');
          const updatedPositions = { ...positions, [currentTurnPlayer.id]: finalPos };
          const updatedCash = { ...cash, [currentTurnPlayer.id]: playerCash };
          const updatedJail = { ...inJailTurns, [currentTurnPlayer.id]: 0 };

          // Wait 500ms on final tile before showing action/modal
          setTimeout(async () => {
            setIsMoving(false);
            setActiveStepTileIndex(null);

            let requiresUserModalAction = false;

            // Handle landing tile
            if (targetTile.type === 'property') {
              const ownership = properties[finalPos];
              if (!ownership) {
                // UNOWNED PROPERTY -> SHOW BUY MODAL
                setActivePropertyModal(targetTile);
                requiresUserModalAction = true;
              } else if (ownership.ownerId !== currentTurnPlayer.id) {
                // Pay Rent
                const owner = players.find((p) => p.id === ownership.ownerId);
                let rentAmount = targetTile.baseRent || 0.2;
                if (ownership.houses === 1) rentAmount = targetTile.rent1House || 0.5;
                if (ownership.houses === 2) rentAmount = targetTile.rent2House || 1.2;
                if (ownership.houses === 3) rentAmount = targetTile.rent3House || 2.5;
                if (ownership.houses === 4) rentAmount = targetTile.rentHotel || 5.0;

                const actualRent = Math.min(playerCash, rentAmount);
                updatedCash[currentTurnPlayer.id] = Math.max(0, playerCash - rentAmount);
                if (owner) {
                  updatedCash[owner.id] = (updatedCash[owner.id] ?? INITIAL_CASH_M) + actualRent;
                }

                sfx.playDrinkPenalty();
                newLogs = addLog(
                  `💸 ${currentTurnPlayer.display_name} จ่ายค่าผ่านทางให้ ${owner?.display_name || 'เจ้าของ'} จำนวน ${formatMoneyM(rentAmount)}`,
                  '#ef4444'
                );
              }
            } else if (targetTile.type === 'chest') {
              const card = CHEST_CARDS[Math.floor(Math.random() * CHEST_CARDS.length)];
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
              newLogs = addLog(`🎁 ${currentTurnPlayer.display_name} เปิดหีบสมบัติ: [${card.title}]`, '#ec4899');
            } else if (targetTile.type === 'chance') {
              const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
              setActiveCard(card);
              requiresUserModalAction = true;
              sfx.playCardDraw();
              if (card.rewardMoney) updatedCash[currentTurnPlayer.id] += card.rewardMoney;
              if (card.teleportToIndex !== undefined) updatedPositions[currentTurnPlayer.id] = card.teleportToIndex;
              if (card.goJail) {
                updatedPositions[currentTurnPlayer.id] = 8;
                updatedJail[currentTurnPlayer.id] = 1;
              }
              newLogs = addLog(`⛩️ ${currentTurnPlayer.display_name} เปิดประตูดวง: [${card.title}]`, '#eab308');
            } else if (targetTile.type === 'tax') {
              updatedCash[currentTurnPlayer.id] = Math.max(0, playerCash - 1.0);
              sfx.playDrinkPenalty();
              newLogs = addLog(`💰 ${currentTurnPlayer.display_name} จ่ายภาษี ${formatMoneyM(1.0)}`, '#f97316');
            } else if (targetTile.type === 'go_to_jail') {
              updatedPositions[currentTurnPlayer.id] = 8;
              updatedJail[currentTurnPlayer.id] = 1;
              sfx.playDrinkPenalty();
              newLogs = addLog(`⛓️ ${currentTurnPlayer.display_name} โดนจับส่งเข้าห้องขัง!`, '#dc2626');
            } else if (targetTile.type === 'jail') {
              sfx.playSuccess();
              newLogs = addLog(`⛓️ ${currentTurnPlayer.display_name} แวะเยี่ยมคุก (เป็นผู้มาเยือน ปลอดภัย)`, '#a855f7');
            } else if (targetTile.type === 'parking') {
              sfx.playSuccess();
              newLogs = addLog(`🅿️ ${currentTurnPlayer.display_name} ถึงจุดพักรถ ปลอดภัย ไม่มีค่าใช้จ่าย`, '#38bdf8');
            } else if (targetTile.type === 'start') {
              sfx.playSuccess();
              newLogs = addLog(`🏁 ${currentTurnPlayer.display_name} อยู่ที่จุดเริ่มต้น รับเงินทุน 2.0M`, '#22c55e');
            }

            // Sync single update to server
            await onUpdateGameState({
              positions: updatedPositions,
              cash: updatedCash,
              inJailTurns: updatedJail,
              gameLogs: newLogs,
            });

            // If no modal required:
            if (!requiresUserModalAction) {
              if (isDoubleRoll && targetTile.type !== 'go_to_jail' && !updatedJail[currentTurnPlayer.id]) {
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
      }, 260); // 260ms per step walk
    },
    [currentTurnPlayer, positions, cash, properties, inJailTurns, players, addLog, onUpdateGameState, handleEndTurn]
  );

  // Roll 2 Dice (Human)
  const rollDice = useCallback(async () => {
    if (!isMyTurn || isRolling || isMoving || hasRolledThisTurn || !currentTurnPlayer) return;
    if (isCurrentPlayerInJail) return; // Must resolve jail first

    setIsRolling(true);
    sfx.playDiceRoll();

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;

    setDice([d1, d2]);
    setIsDouble(d1 === d2);
    setHasRolledThisTurn(true);

    // 1. Wait 1.0s for dice roll animation
    setTimeout(async () => {
      setIsRolling(false);

      // 2. Pause 600ms so player sees dice result
      setTimeout(async () => {
        executeHumanWalk(d1, d2);
      }, 600);
    }, 1000);
  }, [isMyTurn, isRolling, isMoving, hasRolledThisTurn, currentTurnPlayer, isCurrentPlayerInJail, executeHumanWalk]);

  // Jail Option 1: Pay Bail (0.5M)
  const handlePayJailBail = useCallback(async () => {
    if (!currentPlayer || !isMyTurn || !isCurrentPlayerInJail || isRolling || isMoving) return;
    const currentMoney = cash[currentPlayer.id] ?? INITIAL_CASH_M;

    if (currentMoney < JAIL_BAIL_M) {
      showToast(`เงินสดไม่พอจ่ายค่าประกันตัว (${formatMoneyM(JAIL_BAIL_M)})`, 'warning');
      return;
    }

    const updatedCash = { ...cash, [currentPlayer.id]: currentMoney - JAIL_BAIL_M };
    const updatedJail = { ...inJailTurns, [currentPlayer.id]: 0 };
    sfx.playSuccess();
    confetti({ particleCount: 25, spread: 45, origin: { y: 0.6 } });

    const newLogs = addLog(
      `👮 ${currentPlayer.display_name} จ่ายค่าประกันตัว ${formatMoneyM(JAIL_BAIL_M)} หลุดออกจากคุกแล้ว!`,
      '#10b981'
    );

    showToast('หลุดออกจากคุกแล้ว! คุณสามารถกดทอยเต๋าได้ทันที', 'success');

    await onUpdateGameState({
      cash: updatedCash,
      inJailTurns: updatedJail,
      gameLogs: newLogs,
    });
  }, [currentPlayer, isMyTurn, isCurrentPlayerInJail, isRolling, isMoving, cash, inJailTurns, addLog, onUpdateGameState]);

  // Jail Option 2: Try Rolling Doubles to Escape
  const handleTryJailDouble = useCallback(async () => {
    if (!currentPlayer || !isMyTurn || !isCurrentPlayerInJail || isRolling || isMoving || hasRolledThisTurn) return;

    setIsRolling(true);
    setHasRolledThisTurn(true);
    sfx.playDiceRoll();

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const isDoubleRoll = d1 === d2;

    setDice([d1, d2]);
    setIsDouble(isDoubleRoll);

    setTimeout(async () => {
      setIsRolling(false);
      const updatedJail = { ...inJailTurns, [currentPlayer.id]: 0 };

      if (isDoubleRoll) {
        showToast(`🎉 ทอยได้แต้มคู่ [${d1}][${d2}] แหกคุกสำเร็จ! กำลังเดิน...`, 'success');
        sfx.playSuccess();
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });

        const newLogs = addLog(
          `🎉 ${currentPlayer.display_name} ทอยได้แต้มคู่ [${d1}][${d2}] แหกคุกสำเร็จ!`,
          '#10b981'
        );

        await onUpdateGameState({
          inJailTurns: updatedJail,
          gameLogs: newLogs,
        });

        setTimeout(() => {
          executeHumanWalk(d1, d2);
        }, 600);
      } else {
        showToast(`⛓️ ทอยได้ [${d1}][${d2}] ไม่ใช่แต้มคู่ ต้องติดคุกต่อไป (ข้ามตานี้)`, 'warning');
        sfx.playDrinkPenalty();

        const newLogs = addLog(
          `⛓️ ${currentPlayer.display_name} ทอยได้ [${d1}][${d2}] ไม่ใช่แต้มคู่ ติดคุกข้ามตานี้`,
          '#ef4444'
        );

        await onUpdateGameState({
          inJailTurns: updatedJail, // sentence served
          gameLogs: newLogs,
        });

        setTimeout(() => {
          handleEndTurn();
        }, 2200);
      }
    }, 1000);
  }, [
    currentPlayer,
    isMyTurn,
    isCurrentPlayerInJail,
    isRolling,
    isMoving,
    hasRolledThisTurn,
    inJailTurns,
    addLog,
    onUpdateGameState,
    executeHumanWalk,
    handleEndTurn,
  ]);

  // Jail Option 3: Drink 1 Shot to Break Out (Party Mode)
  const handleDrinkForJail = useCallback(async () => {
    if (!currentPlayer || !isMyTurn || !isCurrentPlayerInJail || isRolling || isMoving) return;

    const updatedJail = { ...inJailTurns, [currentPlayer.id]: 0 };
    sfx.playDrinkPenalty();

    const newLogs = addLog(
      `🍺 ${currentPlayer.display_name} ยอมดื่ม 1 ช็อตเพื่อแหกคุก!`,
      '#f59e0b'
    );

    showToast('ดื่ม 1 ช็อต แหกคุกสำเร็จ! กดทอยลูกเต๋าได้เลย', 'success');

    if (onUpdatePlayerDrink) {
      await onUpdatePlayerDrink(currentPlayer.id, 1);
    }

    await onUpdateGameState({
      inJailTurns: updatedJail,
      gameLogs: newLogs,
    });
  }, [currentPlayer, isMyTurn, isCurrentPlayerInJail, isRolling, isMoving, inJailTurns, addLog, onUpdatePlayerDrink, onUpdateGameState]);

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

    const newLogs = addLog(
      `🏡 ${currentTurnPlayer.display_name} ซื้อที่ดิน [${activePropertyModal.name}] (${formatMoneyM(cost)})`,
      '#10b981'
    );

    setActivePropertyModal(null);

    await onUpdateGameState({
      cash: updatedCash,
      properties: updatedProperties,
      gameLogs: newLogs,
    });

    if (isDouble) {
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
    const newLogs = addLog(
      `🏨 ${currentTurnPlayer.display_name} สร้าง${upgradeLabel} บนที่ดิน [${activePropertyModal.name}] (${formatMoneyM(cost)})`,
      '#06b6d4'
    );

    setActivePropertyModal(null);

    await onUpdateGameState({
      cash: updatedCash,
      properties: updatedProperties,
      gameLogs: newLogs,
    });
  };

  // Close Active Modal and Auto Advance Turn
  const handleCloseActiveModal = async () => {
    setActivePropertyModal(null);
    setActiveCard(null);

    if (isMyTurn && hasRolledThisTurn) {
      if (isDouble) {
        showToast('🎉 ได้แต้มคู่! คุณมีสิทธิ์ทอยเต๋าต่ออีกรอบ', 'success');
        setHasRolledThisTurn(false);
      } else {
        await handleEndTurn();
      }
    }
  };

  // -------------------------------------------------------------
  // BOT AUTO-PLAY ENGINE (Rock-Solid: No Deadlocks, No Freezes)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isHost || !isBotTurn) return;

    const turnPlayerId = room.current_turn_player_id;
    if (!turnPlayerId) return;

    // Ensure we don't start the exact same bot turn twice
    if (handledTurnKeyRef.current === turnPlayerId) return;
    handledTurnKeyRef.current = turnPlayerId;

    let isMounted = true;

    // Safety watchdog: If bot gets stuck for > 16s, force switch turn!
    if (botWatchdogTimerRef.current) clearTimeout(botWatchdogTimerRef.current);
    botWatchdogTimerRef.current = setTimeout(async () => {
      console.warn('[Bot Watchdog] Bot took too long! Auto-passing turn...');
      if (!isMounted) return;
      const currentIndex = players.findIndex((p) => p.id === turnPlayerId);
      const nextIndex = (currentIndex + 1) % players.length;
      const nextPlayer = players[nextIndex];
      if (nextPlayer) {
        await onNextTurn(nextPlayer.id);
      }
    }, 16000);

    const executeBotTurn = async () => {
      try {
        let rollsThisTurn = 0;
        let shouldRollAgain = true;

        while (shouldRollAgain && rollsThisTurn < 2 && isMounted) {
          rollsThisTurn++;
          shouldRollAgain = false;

          // 1. Pause briefly
          await new Promise((resolve) => setTimeout(resolve, 1000));
          if (!isMounted) return;

          let botCash: number = cash[turnPlayerId] ?? INITIAL_CASH_M;
          let botJailTurns: number = inJailTurns[turnPlayerId] ?? 0;
          let currentPos: number = positions[turnPlayerId] ?? 0;

          // Check if bot is currently in jail:
          if (botJailTurns > 0) {
            if (botCash >= 1.0) {
              // Bot pays 0.5M bail to get out immediately!
              botCash -= JAIL_BAIL_M;
              botJailTurns = 0;
              const payLog = addLog(
                `👮 🤖 ${currentTurnPlayer.display_name} จ่ายค่าประกันตัว 0.5M หลุดออกจากคุกแล้ว!`,
                '#10b981'
              );
              await onUpdateGameState({
                cash: { ...cash, [turnPlayerId]: botCash },
                inJailTurns: { ...inJailTurns, [turnPlayerId]: 0 },
                gameLogs: payLog,
              });
              await new Promise((resolve) => setTimeout(resolve, 800));
            } else {
              // Bot tries double roll:
              const d1 = Math.floor(Math.random() * 6) + 1;
              const d2 = Math.floor(Math.random() * 6) + 1;
              setDice([d1, d2]);
              setIsRolling(true);
              sfx.playDiceRoll();

              await new Promise((resolve) => setTimeout(resolve, 1000));
              setIsRolling(false);

              if (d1 === d2) {
                // Free escape!
                botJailTurns = 0;
                const escLog = addLog(
                  `🎉 🤖 ${currentTurnPlayer.display_name} ทอยได้แต้มคู่ [${d1}][${d2}] แหกคุกสำเร็จ!`,
                  '#10b981'
                );
                await onUpdateGameState({
                  inJailTurns: { ...inJailTurns, [turnPlayerId]: 0 },
                  gameLogs: escLog,
                });
              } else {
                // Stay in jail, pass turn!
                const stayLog = addLog(
                  `⛓️ 🤖 ${currentTurnPlayer.display_name} ทอยได้ [${d1}][${d2}] ไม่ใช่แต้มคู่ ติดคุกข้ามตานี้`,
                  '#ef4444'
                );
                await onUpdateGameState({
                  inJailTurns: { ...inJailTurns, [turnPlayerId]: 0 }, // served sentence
                  gameLogs: stayLog,
                });
                await new Promise((resolve) => setTimeout(resolve, 1500));
                break; // exit while loop to end turn
              }
            }
          }

          // 2. Roll 2 dice
          setIsRolling(true);
          sfx.playDiceRoll();

          const d1 = Math.floor(Math.random() * 6) + 1;
          const d2 = Math.floor(Math.random() * 6) + 1;
          const totalRoll = d1 + d2;
          const isDoubleRoll = d1 === d2;

          setDice([d1, d2]);
          setIsDouble(isDoubleRoll);

          await new Promise((resolve) => setTimeout(resolve, 1000));
          if (!isMounted) return;

          setIsRolling(false);
          await new Promise((resolve) => setTimeout(resolve, 600));
          if (!isMounted) return;

          setIsMoving(true);

          let stepPos = currentPos;
          let passedGoInWalk = false;

          // 3. Step-by-step local walk (No network request on every step!)
          for (let s = 1; s <= totalRoll; s++) {
            if (!isMounted) return;
            stepPos = (stepPos + 1) % 32;
            sfx.playStep();
            setActiveStepTileIndex(stepPos);

            if (stepPos === 0) {
              passedGoInWalk = true;
              botCash += SALARY_M;
              sfx.playSuccess();
            }
            await new Promise((resolve) => setTimeout(resolve, 260));
          }

          sfx.playTileLand();
          await new Promise((resolve) => setTimeout(resolve, 500));
          if (!isMounted) return;

          setIsMoving(false);
          setActiveStepTileIndex(null);

          const finalPos = stepPos;
          const targetTile = SUPER_MONOPOLY_TILES[finalPos];
          let logText = `🤖 ${currentTurnPlayer.display_name} ทอยได้ [${d1}][${d2}] (${totalRoll} แต้ม) เดินไปที่ [${targetTile.name}]`;

          if (passedGoInWalk) {
            logText += ` (ผ่านจุดเริ่มต้น รับ +${formatMoneyM(SALARY_M)})`;
          }
          if (isDoubleRoll) {
            logText += ' 🎉 แต้มคู่!';
          }

          const updatedPositions = { ...positions, [turnPlayerId]: finalPos };
          const updatedCash = { ...cash, [turnPlayerId]: botCash };
          const updatedProperties = { ...properties };
          const updatedJail = { ...inJailTurns, [turnPlayerId]: 0 };
          let newLogs = addLog(logText, '#93c5fd');

          // 4. Bot Decision on Target Tile:
          if (targetTile.type === 'property') {
            const ownership = updatedProperties[finalPos];
            if (!ownership && targetTile.cost && botCash > targetTile.cost * 1.2) {
              // Bot buys property
              updatedCash[turnPlayerId] = botCash - targetTile.cost;
              updatedProperties[finalPos] = { ownerId: turnPlayerId, houses: 0 };
              newLogs = addLog(
                `🏡 🤖 ${currentTurnPlayer.display_name} ซื้อที่ดิน [${targetTile.name}] (${formatMoneyM(targetTile.cost)})`,
                '#10b981'
              );
            } else if (ownership && ownership.ownerId === turnPlayerId && ownership.houses < 4) {
              // Bot upgrades house
              const cost = ownership.houses === 3 ? (targetTile.hotelCost || 2.0) : (targetTile.houseCost || 0.8);
              if (botCash > cost * 1.5) {
                updatedCash[turnPlayerId] = botCash - cost;
                updatedProperties[finalPos] = { ...ownership, houses: ownership.houses + 1 };
                newLogs = addLog(
                  `🏨 🤖 ${currentTurnPlayer.display_name} สร้างสิ่งปลูกสร้างบน [${targetTile.name}]`,
                  '#06b6d4'
                );
              }
            } else if (ownership && ownership.ownerId !== turnPlayerId) {
              // Bot pays rent
              const owner = players.find((p) => p.id === ownership.ownerId);
              let rent = targetTile.baseRent || 0.2;
              if (ownership.houses === 1) rent = targetTile.rent1House || 0.5;
              if (ownership.houses === 2) rent = targetTile.rent2House || 1.2;
              if (ownership.houses === 3) rent = targetTile.rent3House || 2.5;
              if (ownership.houses === 4) rent = targetTile.rentHotel || 5.0;

              const actualRent = Math.min(botCash, rent);
              updatedCash[turnPlayerId] = Math.max(0, botCash - rent);
              if (owner) {
                updatedCash[owner.id] = (updatedCash[owner.id] ?? INITIAL_CASH_M) + actualRent;
              }
              newLogs = addLog(
                `💸 🤖 ${currentTurnPlayer.display_name} จ่ายค่าผ่านทางให้ ${owner?.display_name || 'เจ้าของ'} จำนวน ${formatMoneyM(rent)}`,
                '#ef4444'
              );
            }
          } else if (targetTile.type === 'chest') {
            const card = CHEST_CARDS[Math.floor(Math.random() * CHEST_CARDS.length)];
            if (card.rewardMoney) updatedCash[turnPlayerId] += card.rewardMoney;
            newLogs = addLog(`🎁 🤖 ${currentTurnPlayer.display_name} เปิดหีบ: [${card.title}]`, '#ec4899');
          } else if (targetTile.type === 'chance') {
            const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
            if (card.rewardMoney) updatedCash[turnPlayerId] += card.rewardMoney;
            if (card.teleportToIndex !== undefined) updatedPositions[turnPlayerId] = card.teleportToIndex;
            if (card.goJail) {
              updatedPositions[turnPlayerId] = 8;
              updatedJail[turnPlayerId] = 1;
            }
            newLogs = addLog(`⛩️ 🤖 ${currentTurnPlayer.display_name} เปิดดวง: [${card.title}]`, '#eab308');
          } else if (targetTile.type === 'tax') {
            updatedCash[turnPlayerId] = Math.max(0, botCash - 1.0);
            newLogs = addLog(`💰 🤖 ${currentTurnPlayer.display_name} จ่ายภาษี 1.0M`, '#f97316');
          } else if (targetTile.type === 'go_to_jail') {
            updatedPositions[turnPlayerId] = 8;
            updatedJail[turnPlayerId] = 1;
            newLogs = addLog(`⛓️ 🤖 ${currentTurnPlayer.display_name} โดนจับส่งเข้าห้องขัง!`, '#dc2626');
          } else if (targetTile.type === 'jail') {
            newLogs = addLog(`⛓️ 🤖 ${currentTurnPlayer.display_name} แวะเยี่ยมคุก ชิลๆ ไม่ถูกขัง`, '#a855f7');
          } else if (targetTile.type === 'parking') {
            newLogs = addLog(`🅿️ 🤖 ${currentTurnPlayer.display_name} ถึงจุดพักรถ ปลอดภัย ไม่มีค่าใช้จ่าย`, '#38bdf8');
          } else if (targetTile.type === 'start') {
            newLogs = addLog(`🏁 🤖 ${currentTurnPlayer.display_name} ถึงจุดเริ่มต้น`, '#22c55e');
          }

          // Single clean server state sync
          await onUpdateGameState({
            positions: updatedPositions,
            cash: updatedCash,
            properties: updatedProperties,
            inJailTurns: updatedJail,
            gameLogs: newLogs,
          });

          // If rolled Double and NOT sent to jail, bot rolls again!
          if (isDoubleRoll && targetTile.type !== 'go_to_jail' && !updatedJail[turnPlayerId]) {
            shouldRollAgain = true;
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        } // end while loop

        // 5. Pass turn to next player
        if (!isMounted) return;
        await new Promise((resolve) => setTimeout(resolve, 1800));
        if (!isMounted) return;

        const currentIndex = players.findIndex((p) => p.id === turnPlayerId);
        const nextIndex = (currentIndex + 1) % players.length;
        const nextPlayer = players[nextIndex];

        const passLog = addLog(`🎲 ส่งตาให้ [${nextPlayer.display_name}]`, '#93c5fd');
        await onUpdateGameState({ gameLogs: passLog });
        await onNextTurn(nextPlayer.id);
      } catch (err) {
        console.error('Bot turn error:', err);
        // Guaranteed recovery on error
        const currentIndex = players.findIndex((p) => p.id === turnPlayerId);
        const nextIndex = (currentIndex + 1) % players.length;
        const nextPlayer = players[nextIndex];
        if (nextPlayer) {
          await onNextTurn(nextPlayer.id);
        }
      } finally {
        if (botWatchdogTimerRef.current) {
          clearTimeout(botWatchdogTimerRef.current);
          botWatchdogTimerRef.current = null;
        }
      }
    };

    executeBotTurn();

    return () => {
      isMounted = false;
      if (botWatchdogTimerRef.current) {
        clearTimeout(botWatchdogTimerRef.current);
        botWatchdogTimerRef.current = null;
      }
    };
  }, [room.current_turn_player_id, isHost, isBotTurn]);

  return {
    dice,
    diceTotal: dice[0] + dice[1],
    isDouble,
    hasRolledThisTurn,
    isRolling,
    isMoving,
    activeStepTileIndex,
    isMyTurn,
    isBotTurn,
    isCurrentPlayerInJail,
    inJailTurns,
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
    handlePayJailBail,
    handleTryJailDouble,
    handleDrinkForJail,
    handleBuyLand,
    handleBuildHouse,
    handleEndTurn,
    handleCloseActiveModal,
  };
}
