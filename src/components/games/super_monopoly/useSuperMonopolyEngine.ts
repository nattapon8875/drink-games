import { useState, useCallback, useEffect } from 'react';
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

const INITIAL_CASH_M = 15.0; // 15M starting cash
const SALARY_M = 2.0; // 2M for passing GO

export function useSuperMonopolyEngine(props: BaseGameProps) {
  const { room, players, currentPlayer, isHost, onUpdateGameState, onNextTurn } = props;

  // Local state for smooth animations
  const [diceResult, setDiceResult] = useState<number>(1);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [activePropertyModal, setActivePropertyModal] = useState<SuperPropertyTile | null>(null);
  const [activeCard, setActiveCard] = useState<CardAction | null>(null);

  // Extract game_state with safe defaults
  const rawState = room.game_state || {};
  const positions: Record<string, number> = rawState.positions || {};
  const properties: Record<number, PropertyOwnership> = rawState.properties || {};
  const cash: Record<string, number> = rawState.cash || {};
  const inJailTurns: Record<string, number> = rawState.inJailTurns || {};
  const isBankrupt: Record<string, boolean> = rawState.isBankrupt || {};
  const gameLogs: Array<{ text: string; time: string; color?: string }> = rawState.gameLogs || [];

  const currentTurnPlayer = players.find((p) => p.id === room.current_turn_player_id) || players[0];
  const isMyTurn = Boolean(currentPlayer && currentPlayer.id === currentTurnPlayer?.id);
  const isBotTurn = Boolean(currentTurnPlayer?.id?.startsWith('bot-'));

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

  // Roll Dice & Move
  const rollDice = useCallback(async () => {
    if ((!isMyTurn && !isBotTurn) || isRolling || isMoving || !currentTurnPlayer) return;

    setIsRolling(true);
    sfx.playDiceRoll();

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const totalRoll = d1 + d2;

    setTimeout(async () => {
      setDiceResult(totalRoll);
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

      // Calculate new cash if passed GO
      let playerCash = cash[currentTurnPlayer.id] ?? INITIAL_CASH_M;
      let logColor = '#f59e0b';
      let moveLog = `${currentTurnPlayer.display_name} ทอยได้ ${totalRoll} เดินไปที่ [${SUPER_MONOPOLY_TILES[newPos].name}]`;

      if (passedGo) {
        playerCash += SALARY_M;
        sfx.playSuccess();
        moveLog += ` (ผ่านจุดเริ่มต้น รับ +${formatMoneyM(SALARY_M)})`;
      }

      const updatedPositions = { ...positions, [currentTurnPlayer.id]: newPos };
      const updatedCash = { ...cash, [currentTurnPlayer.id]: playerCash };
      let newLogs = addLog(moveLog, logColor);

      // Handle Tile Effect
      const targetTile = SUPER_MONOPOLY_TILES[newPos];

      // 1. Property Tile
      if (targetTile.type === 'property') {
        const ownership = properties[newPos];
        if (!ownership) {
          // Unowned -> Can Buy
          setActivePropertyModal(targetTile);
        } else if (ownership.ownerId !== currentTurnPlayer.id) {
          // Owned by opponent -> Pay Rent!
          const owner = players.find((p) => p.id === ownership.ownerId);
          let rentAmount = targetTile.baseRent || 0.2;
          if (ownership.houses === 1) rentAmount = targetTile.rent1House || 0.5;
          if (ownership.houses === 2) rentAmount = targetTile.rent2House || 1.2;
          if (ownership.houses === 3) rentAmount = targetTile.rent3House || 2.5;
          if (ownership.houses === 4) rentAmount = targetTile.rentHotel || 5.0;

          // Deduct rent
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

          if (playerCash - rentAmount < 0) {
            newLogs = addLog(`💥 ${currentTurnPlayer.display_name} เงินหมดเกลี้ยง ล้มละลาย!`, '#dc2626');
          }
        }
      }

      // 2. Chest Card
      if (targetTile.type === 'chest') {
        const card = CHEST_CARDS[Math.floor(Math.random() * CHEST_CARDS.length)];
        setActiveCard(card);
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
        sfx.playCardDraw();
        if (card.rewardMoney) {
          updatedCash[currentTurnPlayer.id] += card.rewardMoney;
        }
        if (card.teleportToIndex !== undefined) {
          updatedPositions[currentTurnPlayer.id] = card.teleportToIndex;
        }
        if (card.goJail) {
          updatedPositions[currentTurnPlayer.id] = 8; // Jail tile
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
        updatedPositions[currentTurnPlayer.id] = 8; // Teleport to Jail
        sfx.playDrinkPenalty();
        newLogs = addLog(`⛓️ ${currentTurnPlayer.display_name} โดนจับส่งเข้าห้องขัง!`, '#dc2626');
      }

      setIsMoving(false);

      await onUpdateGameState({
        positions: updatedPositions,
        cash: updatedCash,
        gameLogs: newLogs,
      });
    }, 1200);
  }, [
    isMyTurn,
    isBotTurn,
    isRolling,
    isMoving,
    currentTurnPlayer,
    positions,
    cash,
    properties,
    players,
    addLog,
    onUpdateGameState,
  ]);

  // Buy Land
  const handleBuyLand = async () => {
    if (!currentTurnPlayer || !activePropertyModal || activePropertyModal.cost === undefined) return;
    const tileIdx = activePropertyModal.index;
    const cost = activePropertyModal.cost;
    const currentMoney = cash[currentTurnPlayer.id] ?? 0;

    if (currentMoney < cost) return;

    const updatedCash = { ...cash, [currentTurnPlayer.id]: currentMoney - cost };
    const updatedProperties = {
      ...properties,
      [tileIdx]: { ownerId: currentTurnPlayer.id, houses: 0 },
    };

    sfx.playSuccess();
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });

    const newLogs = addLog(
      `🏡 ${currentTurnPlayer.display_name} ซื้อที่ดิน [${activePropertyModal.name}] ในราคา ${formatMoneyM(cost)}`,
      '#10b981'
    );

    setActivePropertyModal(null);

    await onUpdateGameState({
      cash: updatedCash,
      properties: updatedProperties,
      gameLogs: newLogs,
    });
  };

  // Build House or Hotel
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
    if (currentMoney < cost) return;

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

  // End Turn & Pass to Next Player
  const handleEndTurn = async () => {
    if (!isMyTurn && !isBotTurn) return;
    setActivePropertyModal(null);
    setActiveCard(null);

    const currentIndex = players.findIndex((p) => p.id === currentTurnPlayer?.id);
    const nextIndex = (currentIndex + 1) % players.length;
    const nextPlayer = players[nextIndex];

    const newLogs = addLog(`🎲 ถึงตาของ ${nextPlayer.display_name}`, '#93c5fd');

    await onUpdateGameState({ gameLogs: newLogs });
    await onNextTurn(nextPlayer.id);
  };

  // Bot Auto-turn Logic
  useEffect(() => {
    if (!isHost || !isBotTurn || isRolling || isMoving) return;

    const botTimer = setTimeout(async () => {
      // 1. Roll dice
      await rollDice();

      // 2. Decide to buy if landed on unowned property and has plenty of cash
      setTimeout(async () => {
        if (activePropertyModal && activePropertyModal.cost) {
          const botCash = cash[currentTurnPlayer?.id || ''] ?? 0;
          if (botCash > activePropertyModal.cost * 1.5) {
            await handleBuyLand();
          }
        }
        // 3. End turn
        setTimeout(async () => {
          await handleEndTurn();
        }, 1500);
      }, 1500);
    }, 1200);

    return () => clearTimeout(botTimer);
  }, [isHost, isBotTurn, isRolling, isMoving, activePropertyModal]);

  return {
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
  };
}
