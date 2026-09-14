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

export function useSuperMonopolyEngine(props: BaseGameProps) {
  const { room, players, currentPlayer, isHost, onUpdateGameState, onNextTurn } = props;

  // Local state for 2 Dice (ลูกเต๋า 2 ลูก 🎲🎲)
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [activePropertyModal, setActivePropertyModal] = useState<SuperPropertyTile | null>(null);
  const [activeCard, setActiveCard] = useState<CardAction | null>(null);
  const [hasRolledThisTurn, setHasRolledThisTurn] = useState<boolean>(false);
  const [isDouble, setIsDouble] = useState<boolean>(false);

  const botActionRunningRef = useRef<boolean>(false);

  // Extract game_state with safe defaults
  const rawState = room.game_state || {};
  const positions: Record<string, number> = rawState.positions || {};
  const properties: Record<number, PropertyOwnership> = rawState.properties || {};
  const cash: Record<string, number> = rawState.cash || {};
  const gameLogs: Array<{ text: string; time: string; color?: string }> = rawState.gameLogs || [];

  const currentTurnPlayer = players.find((p) => p.id === room.current_turn_player_id) || players[0];
  const isMyTurn = Boolean(currentPlayer && currentPlayer.id === currentTurnPlayer?.id);
  const isBotTurn = Boolean(
    currentTurnPlayer?.id?.startsWith('bot-') || currentTurnPlayer?.line_user_id === 'bot'
  );

  // Reset turn state when current turn player changes
  useEffect(() => {
    setHasRolledThisTurn(false);
    setIsDouble(false);
    setActivePropertyModal(null);
    setActiveCard(null);
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

    if (players.length === 0) return;

    const currentIndex = players.findIndex((p) => p.id === currentTurnPlayer?.id);
    const nextIndex = (currentIndex + 1) % players.length;
    const nextPlayer = players[nextIndex];

    const newLogs = addLog(`🎲 ส่งตาให้ [${nextPlayer.display_name}]`, '#93c5fd');

    await onUpdateGameState({ gameLogs: newLogs });
    await onNextTurn(nextPlayer.id);
  }, [players, currentTurnPlayer, addLog, onUpdateGameState, onNextTurn]);

  // Roll 2 Dice & Move (For Human Player)
  const rollDice = useCallback(async () => {
    if (!isMyTurn || isRolling || isMoving || hasRolledThisTurn || !currentTurnPlayer) return;

    setIsRolling(true);
    sfx.playDiceRoll();

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const totalRoll = d1 + d2;
    const isDoubleRoll = d1 === d2;

    setDice([d1, d2]);
    setIsDouble(isDoubleRoll);
    setHasRolledThisTurn(true);

    setTimeout(async () => {
      setIsRolling(false);
      setIsMoving(true);
      sfx.playTileLand();

      const currentPos = positions[currentTurnPlayer.id] ?? 0;
      let newPos = currentPos + totalRoll;
      let passedGo = false;

      if (newPos >= 32) {
        newPos = newPos % 32;
        passedGo = true;
      }

      let playerCash = cash[currentTurnPlayer.id] ?? INITIAL_CASH_M;
      const targetTile = SUPER_MONOPOLY_TILES[newPos];
      let moveLog = `${currentTurnPlayer.display_name} ทอยได้ [${d1}][${d2}] (${totalRoll} แต้ม) เดินไปที่ [${targetTile.name}]`;

      if (passedGo) {
        playerCash += SALARY_M;
        sfx.playSuccess();
        moveLog += ` (ผ่านจุดเริ่มต้น รับ +${formatMoneyM(SALARY_M)})`;
      }

      if (isDoubleRoll) {
        moveLog += ' 🎉 แต้มคู่ (Double)! ได้ทอยต่ออีกรอบ!';
      }

      const updatedPositions = { ...positions, [currentTurnPlayer.id]: newPos };
      const updatedCash = { ...cash, [currentTurnPlayer.id]: playerCash };
      let newLogs = addLog(moveLog, '#f59e0b');

      let requiresUserModalAction = false;

      // 1. Property Tile
      if (targetTile.type === 'property') {
        const ownership = properties[newPos];
        if (!ownership) {
          // Unowned -> Open modal for human to buy or skip
          setActivePropertyModal(targetTile);
          requiresUserModalAction = true;
        } else if (ownership.ownerId !== currentTurnPlayer.id) {
          // Pay rent to owner
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
      }

      // 2. Chest Card
      if (targetTile.type === 'chest') {
        const card = CHEST_CARDS[Math.floor(Math.random() * CHEST_CARDS.length)];
        setActiveCard(card);
        requiresUserModalAction = true;
        sfx.playCardDraw();
        if (card.rewardMoney) {
          updatedCash[currentTurnPlayer.id] += card.rewardMoney;
        }
        if (card.collectFromAll) {
          players.forEach((other) => {
            if (other.id !== currentTurnPlayer.id) {
              updatedCash[other.id] = Math.max(0, (updatedCash[other.id] ?? INITIAL_CASH_M) - card.collectFromAll!);
              updatedCash[currentTurnPlayer.id] += card.collectFromAll!;
            }
          });
        }
        newLogs = addLog(`🎁 ${currentTurnPlayer.display_name} เปิดหีบสมบัติ: [${card.title}]`, '#ec4899');
      }

      // 3. Chance Card
      if (targetTile.type === 'chance') {
        const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
        setActiveCard(card);
        requiresUserModalAction = true;
        sfx.playCardDraw();
        if (card.rewardMoney) {
          updatedCash[currentTurnPlayer.id] += card.rewardMoney;
        }
        if (card.teleportToIndex !== undefined) {
          updatedPositions[currentTurnPlayer.id] = card.teleportToIndex;
        }
        if (card.goJail) {
          updatedPositions[currentTurnPlayer.id] = 8;
        }
        newLogs = addLog(`⛩️ ${currentTurnPlayer.display_name} เปิดประตูดวง: [${card.title}]`, '#eab308');
      }

      // 4. Tax
      if (targetTile.type === 'tax') {
        const taxAmount = 1.0;
        updatedCash[currentTurnPlayer.id] = Math.max(0, playerCash - taxAmount);
        sfx.playDrinkPenalty();
        newLogs = addLog(`💰 ${currentTurnPlayer.display_name} จ่ายภาษี ${formatMoneyM(taxAmount)}`, '#f97316');
      }

      // 5. Go to Jail
      if (targetTile.type === 'go_to_jail') {
        updatedPositions[currentTurnPlayer.id] = 8;
        sfx.playDrinkPenalty();
        newLogs = addLog(`⛓️ ${currentTurnPlayer.display_name} โดนจับส่งเข้าห้องขัง!`, '#dc2626');
      }

      setIsMoving(false);

      await onUpdateGameState({
        positions: updatedPositions,
        cash: updatedCash,
        gameLogs: newLogs,
      });

      // If no modal is required (e.g. rent, tax, visit jail, start):
      if (!requiresUserModalAction) {
        if (isDoubleRoll && targetTile.type !== 'go_to_jail') {
          showToast('🎉 ได้แต้มคู่! คุณมีสิทธิ์ทอยเต๋าต่ออีก 1 รอบ', 'success');
          setHasRolledThisTurn(false); // allow rolling again
        } else {
          // Automatically advance turn after 2.5 seconds!
          setTimeout(() => {
            handleEndTurn();
          }, 2500);
        }
      }
    }, 1000);
  }, [
    isMyTurn,
    isRolling,
    isMoving,
    hasRolledThisTurn,
    currentTurnPlayer,
    positions,
    cash,
    properties,
    players,
    addLog,
    onUpdateGameState,
    handleEndTurn,
  ]);

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
      // Auto advance to next player after buying!
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
  // BOT AUTO-PLAY ENGINE (Rock-solid, self-executing)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isHost || !isBotTurn || botActionRunningRef.current) return;
    botActionRunningRef.current = true;

    let isMounted = true;

    const executeBotTurn = async () => {
      // 1. Wait a moment so players see whose turn it is
      await new Promise((resolve) => setTimeout(resolve, 1400));
      if (!isMounted) return;

      // 2. Roll 2 dice for bot
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
      setIsMoving(true);
      sfx.playTileLand();

      const currentPos = positions[currentTurnPlayer.id] ?? 0;
      let newPos = currentPos + totalRoll;
      let passedGo = false;

      if (newPos >= 32) {
        newPos = newPos % 32;
        passedGo = true;
      }

      let botCash = cash[currentTurnPlayer.id] ?? INITIAL_CASH_M;
      const targetTile = SUPER_MONOPOLY_TILES[newPos];
      let logText = `🤖 ${currentTurnPlayer.display_name} ทอยได้ [${d1}][${d2}] (${totalRoll} แต้ม) เดินไปที่ [${targetTile.name}]`;

      if (passedGo) {
        botCash += SALARY_M;
        logText += ` (ผ่านจุดเริ่มต้น รับ +${formatMoneyM(SALARY_M)})`;
      }

      if (isDoubleRoll) {
        logText += ' 🎉 แต้มคู่!';
      }

      const updatedPositions = { ...positions, [currentTurnPlayer.id]: newPos };
      const updatedCash = { ...cash, [currentTurnPlayer.id]: botCash };
      const updatedProperties = { ...properties };

      let newLogs = addLog(logText, '#93c5fd');

      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!isMounted) return;
      setIsMoving(false);

      // 3. Bot Tile Decision
      if (targetTile.type === 'property') {
        const ownership = updatedProperties[newPos];
        if (!ownership && targetTile.cost && botCash > targetTile.cost * 1.2) {
          // Bot buys property!
          updatedCash[currentTurnPlayer.id] = botCash - targetTile.cost;
          updatedProperties[newPos] = { ownerId: currentTurnPlayer.id, houses: 0 };
          newLogs = addLog(
            `🏡 🤖 ${currentTurnPlayer.display_name} ตัดสินใจซื้อที่ดิน [${targetTile.name}] (${formatMoneyM(targetTile.cost)})`,
            '#10b981'
          );
        } else if (ownership && ownership.ownerId === currentTurnPlayer.id && ownership.houses < 4) {
          // Bot upgrades house!
          const cost = ownership.houses === 3 ? (targetTile.hotelCost || 2.0) : (targetTile.houseCost || 0.8);
          if (botCash > cost * 1.5) {
            updatedCash[currentTurnPlayer.id] = botCash - cost;
            updatedProperties[newPos] = { ...ownership, houses: ownership.houses + 1 };
            newLogs = addLog(
              `🏨 🤖 ${currentTurnPlayer.display_name} สร้างบ้านเพิ่มบน [${targetTile.name}]`,
              '#06b6d4'
            );
          }
        } else if (ownership && ownership.ownerId !== currentTurnPlayer.id) {
          // Bot pays rent to human/owner
          const owner = players.find((p) => p.id === ownership.ownerId);
          let rent = targetTile.baseRent || 0.2;
          if (ownership.houses === 1) rent = targetTile.rent1House || 0.5;
          if (ownership.houses === 2) rent = targetTile.rent2House || 1.2;
          if (ownership.houses === 3) rent = targetTile.rent3House || 2.5;
          if (ownership.houses === 4) rent = targetTile.rentHotel || 5.0;

          const actualRent = Math.min(botCash, rent);
          updatedCash[currentTurnPlayer.id] = Math.max(0, botCash - rent);
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
        if (card.rewardMoney) updatedCash[currentTurnPlayer.id] += card.rewardMoney;
        newLogs = addLog(`🎁 🤖 ${currentTurnPlayer.display_name} เปิดหีบ: [${card.title}]`, '#ec4899');
      } else if (targetTile.type === 'chance') {
        const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
        if (card.rewardMoney) updatedCash[currentTurnPlayer.id] += card.rewardMoney;
        if (card.teleportToIndex !== undefined) updatedPositions[currentTurnPlayer.id] = card.teleportToIndex;
        if (card.goJail) updatedPositions[currentTurnPlayer.id] = 8;
        newLogs = addLog(`⛩️ 🤖 ${currentTurnPlayer.display_name} เปิดดวง: [${card.title}]`, '#eab308');
      } else if (targetTile.type === 'tax') {
        updatedCash[currentTurnPlayer.id] = Math.max(0, botCash - 1.0);
        newLogs = addLog(`💰 🤖 ${currentTurnPlayer.display_name} จ่ายภาษี 1.0M`, '#f97316');
      } else if (targetTile.type === 'go_to_jail') {
        updatedPositions[currentTurnPlayer.id] = 8;
        newLogs = addLog(`⛓️ 🤖 ${currentTurnPlayer.display_name} โดนจับส่งเข้าห้องขัง!`, '#dc2626');
      }

      await onUpdateGameState({
        positions: updatedPositions,
        cash: updatedCash,
        properties: updatedProperties,
        gameLogs: newLogs,
      });

      // 4. If bot rolled Double, bot gets another roll!
      if (isDoubleRoll && targetTile.type !== 'go_to_jail') {
        await new Promise((resolve) => setTimeout(resolve, 1800));
        botActionRunningRef.current = false;
        // Re-runs for bot because current turn is still bot!
        return;
      }

      // 5. Automatically pass turn to next player!
      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (!isMounted) return;

      const currentIndex = players.findIndex((p) => p.id === currentTurnPlayer.id);
      const nextIndex = (currentIndex + 1) % players.length;
      const nextPlayer = players[nextIndex];

      const passLog = addLog(`🎲 ส่งตาให้ [${nextPlayer.display_name}]`, '#93c5fd');
      await onUpdateGameState({ gameLogs: passLog });
      await onNextTurn(nextPlayer.id);

      botActionRunningRef.current = false;
    };

    executeBotTurn().catch((err) => {
      console.error('Bot turn execution error:', err);
      botActionRunningRef.current = false;
    });

    return () => {
      isMounted = false;
    };
  }, [room.current_turn_player_id, isHost, isBotTurn]);

  return {
    dice,
    diceTotal: dice[0] + dice[1],
    isDouble,
    hasRolledThisTurn,
    isRolling,
    isMoving,
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
    rollDice,
    handleBuyLand,
    handleBuildHouse,
    handleEndTurn,
    handleCloseActiveModal,
  };
}
