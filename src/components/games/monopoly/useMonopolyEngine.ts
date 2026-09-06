import { useState, useCallback } from 'react';
import { BaseGameProps } from '@/types/game';
import { DEFAULT_MONOPOLY_TILES } from '@/lib/mockTiles';
import { MonopolyTileRecord } from '@/types/database';
import { sfx } from '@/lib/sound';
import confetti from 'canvas-confetti';

export function useMonopolyEngine({
  room,
  players,
  currentPlayer,
  onUpdateGameState,
  onUpdatePlayerDrink,
  onNextTurn,
}: BaseGameProps) {
  const [isRollingLocal, setIsRollingLocal] = useState(false);

  // Dynamic tiles: Use room's custom_tiles if configured, or default 28 tiles
  const tiles: MonopolyTileRecord[] =
    room.game_state?.custom_tiles && room.game_state.custom_tiles.length === 28
      ? room.game_state.custom_tiles
      : DEFAULT_MONOPOLY_TILES;

  const totalTiles = 28;

  // Turn verification
  const isMyTurn = Boolean(
    currentPlayer &&
    room.current_turn_player_id &&
    room.current_turn_player_id === currentPlayer.id
  );

  const currentTurnPlayer = players.find((p) => p.id === room.current_turn_player_id) || players[0];

  // Positions dictionary: { [playerId]: tileIndex (0-27) }
  const positions: Record<string, number> = room.game_state?.positions || {};

  // Action modal active
  const activeActionModal = Boolean(room.game_state?.activeActionModal);
  const lastTileIndex = room.game_state?.lastTileIndex ?? 0;
  const currentTile = tiles[lastTileIndex] || tiles[0];
  const diceResult = room.game_state?.diceResult ?? 1;

  // Roll the dice with multi-step walking animation and delayed modal
  const rollDice = useCallback(async () => {
    if (!isMyTurn || isRollingLocal || activeActionModal || !currentPlayer) return;

    setIsRollingLocal(true);
    sfx.playDiceRoll();

    // Roll random 1-6
    const roll = Math.floor(Math.random() * 6) + 1;
    const startPos = positions[currentPlayer.id] ?? 0;
    const finalPos = (startPos + roll) % totalTiles;

    // 1. Broadcast dice rolling status & result so everyone sees the dice spin & stop on number
    await onUpdateGameState({
      diceResult: roll,
      isRolling: true,
      activeActionModal: false,
    });

    // 2. Wait 1.2s for dice rolling animation to stop and show number
    setTimeout(async () => {
      // Dice has landed and shows number
      await onUpdateGameState({
        diceResult: roll,
        isRolling: false,
        activeActionModal: false,
      });

      // 3. Pause for 900ms so everyone clearly sees the dice number result before walking
      setTimeout(() => {
        let currentStep = 0;
        let currentStepPos = startPos;

        const stepInterval = setInterval(async () => {
          currentStep++;
          currentStepPos = (currentStepPos + 1) % totalTiles;
          sfx.playStep();

          const stepPositions = { ...positions, [currentPlayer.id]: currentStepPos };
          await onUpdateGameState({
            positions: stepPositions,
            lastTileIndex: currentStepPos,
            diceResult: roll,
            isRolling: false,
            activeActionModal: false,
          });

          // When reached destination tile
          if (currentStep >= roll) {
            clearInterval(stepInterval);
            sfx.playTileLand();

            // Trigger confetti on celebratory tiles
            if (finalPos === 0 || finalPos === 12 || finalPos === 20 || finalPos === 27) {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
              });
            }

            // Pause on landing tile before opening Action Modal
            setTimeout(async () => {
              await onUpdateGameState({
                positions: { ...positions, [currentPlayer.id]: finalPos },
                diceResult: roll,
                lastTileIndex: finalPos,
                lastActionPlayerId: currentPlayer.id,
                isRolling: false,
                activeActionModal: true,
              });
              setIsRollingLocal(false);
            }, 550);
          }
        }, 360); // 360ms per step hop
      }, 900);
    }, 1200);
  }, [
    isMyTurn,
    isRollingLocal,
    activeActionModal,
    currentPlayer,
    positions,
    onUpdateGameState,
    totalTiles,
  ]);

  // Complete action & hand over turn
  const completeAction = useCallback(
    async (drankCount: number = 0) => {
      if (!currentPlayer) return;

      if (drankCount > 0) {
        sfx.playDrinkPenalty();
        await onUpdatePlayerDrink(currentPlayer.id, drankCount);
      }

      // Find next player by turn order
      const currentIndex = players.findIndex((p) => p.id === currentPlayer.id);
      const nextIndex = (currentIndex + 1) % (players.length || 1);
      const nextPlayer = players[nextIndex];

      if (nextPlayer) {
        await onNextTurn(nextPlayer.id);
      }
    },
    [currentPlayer, players, onUpdatePlayerDrink, onNextTurn]
  );

  return {
    tiles,
    positions,
    isMyTurn,
    currentTurnPlayer,
    isRolling: Boolean(room.game_state?.isRolling),
    isMoving: isRollingLocal,
    diceResult,
    currentTile,
    activeActionModal,
    rollDice,
    completeAction,
  };
}
