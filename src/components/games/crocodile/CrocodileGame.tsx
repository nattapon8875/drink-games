'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BaseGameProps } from '@/types/game';
import { Crocodile3D } from './Crocodile3D';
import { Crocodile2D } from './Crocodile2D';
import { CrocodileBiteModal } from './CrocodileBiteModal';
import { CrocodileSettingsModal } from './CrocodileSettingsModal';
import {
  CrocodilePenaltyConfig,
  DEFAULT_CROCODILE_CONFIG,
  generateCrocodileTeeth,
  getRandomTrapTeeth,
} from './crocodileData';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { sfx } from '@/lib/sound';
import { showToast } from '@/lib/alerts';
import { Box, Settings, Sparkles, RotateCcw } from 'lucide-react';

export const CrocodileGame: React.FC<BaseGameProps> = ({
  room,
  players,
  currentPlayer,
  isHost,
  onUpdateGameState,
  onUpdatePlayerDrink,
  onNextTurn,
}) => {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showBiteModal, setShowBiteModal] = useState<boolean>(false);

  // Read game state from room
  const gameState = room.game_state || {};
  const pressedTeeth: number[] = gameState.pressed_teeth || [];
  
  // Support both trap_teeth array and legacy single trap_tooth_index
  const trapTeeth: number[] = useMemo(() => {
    if (Array.isArray(gameState.trap_teeth)) return gameState.trap_teeth;
    if (gameState.trap_tooth_index !== undefined) return [gameState.trap_tooth_index];
    return [0];
  }, [gameState.trap_teeth, gameState.trap_tooth_index]);

  const triggeredTooth: number =
    gameState.triggered_tooth !== undefined
      ? gameState.triggered_tooth
      : (trapTeeth[0] || 0);

  const isBitten: boolean = gameState.is_bitten || false;
  const bittenPlayerId: string | null = gameState.bitten_player_id || null;
  const penaltyConfig: CrocodilePenaltyConfig = {
    ...DEFAULT_CROCODILE_CONFIG,
    ...(gameState.penalty_config || {}),
  };

  const currentTurnPlayerId: string =
    gameState.currentTurnPlayerId || room.current_turn_player_id || players[0]?.id;

  const currentTurnPlayer = players.find((p) => p.id === currentTurnPlayerId);
  const bittenPlayer = players.find((p) => p.id === bittenPlayerId) || null;
  const isMyTurn = currentPlayer?.id === currentTurnPlayerId;

  const totalTeeth = penaltyConfig.totalTeeth || 10;
  const trapCount = penaltyConfig.trapCount || 1;

  // Initialize trap teeth on room creation if missing
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    if (isHost && gameState.trap_teeth === undefined && gameState.trap_tooth_index === undefined) {
      initRef.current = true;
      const currentConfig = gameState.penalty_config || DEFAULT_CROCODILE_CONFIG;
      const initialTraps = getRandomTrapTeeth(
        currentConfig.totalTeeth || 10,
        currentConfig.trapCount || 1
      );
      onUpdateGameState({
        trap_teeth: initialTraps,
        pressed_teeth: [],
        is_bitten: false,
        bitten_player_id: null,
        penalty_config: currentConfig,
      });
    }
  }, [isHost, gameState.trap_teeth, gameState.trap_tooth_index, gameState.penalty_config, onUpdateGameState]);

  // When is_bitten becomes true, pop up modal with dramatic sound
  useEffect(() => {
    if (gameState.is_bitten) {
      sfx.playChompBite();
      const timer = setTimeout(() => {
        setShowBiteModal(true);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setShowBiteModal(false);
    }
  }, [gameState.is_bitten]);

  // Handle player pressing a tooth
  const handleToothClick = async (toothIdx: number) => {
    if (isBitten) return;
    if (pressedTeeth.includes(toothIdx)) return;

    if (!isMyTurn && !isHost) {
      showToast('ยังไม่ถึงตาของคุณในการกดฟันจระเข้!', 'info');
      return;
    }

    const nextPressed = [...pressedTeeth, toothIdx];

    // Check if this tooth is one of the trap teeth! 🐊
    if (trapTeeth.includes(toothIdx)) {
      // BITTEN!
      sfx.playChompBite();

      const victim = currentTurnPlayer || currentPlayer;
      const penaltyDrinks = penaltyConfig.drinkCount || 2;

      // Apply penalty drinks
      if (victim) {
        await onUpdatePlayerDrink(victim.id, penaltyDrinks);
      }

      await onUpdateGameState({
        pressed_teeth: nextPressed,
        is_bitten: true,
        bitten_player_id: victim?.id || null,
        triggered_tooth: toothIdx,
      });
    } else {
      // SAFE TOOTH! Click sound & pass turn
      sfx.playToothClick();

      // Find next player in turn order
      const currentIndex = players.findIndex((p) => p.id === currentTurnPlayerId);
      const nextIndex = (currentIndex + 1) % Math.max(players.length, 1);
      const nextPlayer = players[nextIndex];

      await onUpdateGameState({
        pressed_teeth: nextPressed,
        is_bitten: false,
      });

      if (nextPlayer) {
        await onNextTurn(nextPlayer.id);
      }
    }
  };

  // Host starts new round: reset teeth & roll new trap teeth
  const handleStartNewRound = async () => {
    if (!isHost) return;
    setShowBiteModal(false);

    // Pick new trap teeth based on current configuration
    const newTraps = getRandomTrapTeeth(totalTeeth, trapCount);

    // Advance turn to next person to start the new round
    const currentIndex = players.findIndex((p) => p.id === currentTurnPlayerId);
    const nextIndex = (currentIndex + 1) % Math.max(players.length, 1);
    const nextPlayer = players[nextIndex];

    await onUpdateGameState({
      trap_teeth: newTraps,
      pressed_teeth: [],
      is_bitten: false,
      bitten_player_id: null,
      triggered_tooth: null,
    });

    if (nextPlayer) {
      await onNextTurn(nextPlayer.id);
    }

    showToast('เริ่มรอบใหม่แล้ว! สุ่มฟันกับดักใหม่เรียบร้อย 🐊', 'success');
  };

  // Host saves custom penalty and teeth config
  const handleSaveConfig = async (newConfig: CrocodilePenaltyConfig) => {
    const newTraps = getRandomTrapTeeth(newConfig.totalTeeth, newConfig.trapCount);
    await onUpdateGameState({
      penalty_config: newConfig,
      trap_teeth: newTraps,
      pressed_teeth: [],
      is_bitten: false,
      bitten_player_id: null,
    });
    showToast('เริ่มเกมใหม่ด้วยการตั้งค่าใหม่เรียบร้อย!', 'success');
  };

  return (
    <div className="w-full max-w-md mx-auto px-2 py-2 flex flex-col items-center select-none">
      {/* Top Banner Control Bar */}
      <div className="w-full mb-3 bg-[#260e03]/90 border border-amber-900/50 rounded-2xl px-4 py-2.5 shadow-lg flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg">
            🐃
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-amber-300 font-black">
              ตาของ
            </div>
            <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
              <span>{currentTurnPlayer?.display_name || 'กำลังรอผู้เล่น...'}</span>
              {isMyTurn && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold">
                  (ตาคุณ)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Controls: 3D/2D Switcher & Settings */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setViewMode(viewMode === '3d' ? '2d' : '3d')}
            className="flex items-center gap-1.5 text-xs font-black text-yellow-300 bg-[#3b1805] hover:bg-[#522207] px-3 py-1.5 rounded-xl border border-yellow-500/50 shadow transition active:scale-95"
            title="สลับมุมมอง 3D / 2D"
          >
            <Box className="w-3.5 h-3.5" />
            <span>{viewMode === '3d' ? '3D' : '2D'}</span>
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-200 bg-[#351505] hover:bg-[#481c05] px-3 py-1.5 rounded-xl border border-[#6b2e0a] shadow transition active:scale-95"
            title="ปรับแต่งบทลงโทษและฟันน้องควาย"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHost ? 'ตั้งค่าฟัน' : 'กติกา'}</span>
          </button>
        </div>
      </div>

      {/* Main Game Stage (3D or 2D) */}
      <div className="w-full flex justify-center items-center py-2">
        {viewMode === '3d' ? (
          <Crocodile3D
            players={players}
            totalTeeth={totalTeeth}
            currentTurnPlayerId={currentTurnPlayerId}
            pressedTeeth={pressedTeeth}
            isBitten={isBitten}
            onToothClick={handleToothClick}
            canInteract={(isMyTurn || isHost) && !isBitten}
          />
        ) : (
          <Crocodile2D
            players={players}
            totalTeeth={totalTeeth}
            currentTurnPlayerId={currentTurnPlayerId}
            pressedTeeth={pressedTeeth}
            isBitten={isBitten}
            onToothClick={handleToothClick}
            canInteract={(isMyTurn || isHost) && !isBitten}
          />
        )}
      </div>

      {/* Roster & Stats Footer */}
      <div className="w-full max-w-lg mt-3 p-3 rounded-2xl bg-[#1c0a02] border border-[#481c05] shadow-lg">
        <div className="flex items-center justify-between text-[11px] font-black text-amber-300 mb-2">
          <span>สหายร่วมวง ({players.length})</span>
          <span className="text-[10px] text-gray-400">
            ฟันที่ถูกกด: {pressedTeeth.length} / {totalTeeth} ซี่ ({trapCount} กับดัก)
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {players.map((p) => {
            const isTurn = p.id === currentTurnPlayerId;
            return (
              <div
                key={p.id}
                className={
                  'flex items-center gap-1.5 p-1.5 rounded-xl border transition ' +
                  (isTurn
                    ? 'bg-amber-500/20 border-amber-400 shadow-sm ring-1 ring-amber-400/50'
                    : 'bg-[#2b1205]/60 border-[#50220a]')
                }
              >
                <Avatar
                  name={p.display_name}
                  src={p.avatar_url || undefined}
                  size="sm"
                  className="w-6 h-6 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-white truncate">
                    {p.display_name}
                  </div>
                  <div className="text-[9px] text-amber-400/80 font-semibold">
                    🍺 {p.drinks_count} อึก
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Host Action Button (Start New Round when bitten) */}
      {isBitten && isHost && (
        <div className="w-full max-w-md mt-3 flex justify-center">
          <Button
            variant="wood-gold"
            size="lg"
            onClick={handleStartNewRound}
            className="w-full py-3 text-sm font-black flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 shadow-xl"
          >
            <RotateCcw className="w-4 h-4" />
            <span>เริ่มรอบใหม่ (สุ่มฟันใหม่)</span>
          </Button>
        </div>
      )}

      {/* Bite Modal */}
      <CrocodileBiteModal
        isOpen={showBiteModal}
        onClose={() => setShowBiteModal(false)}
        bittenPlayer={bittenPlayer}
        toothIndex={triggeredTooth}
        drinkCount={penaltyConfig.drinkCount || 2}
        isHost={isHost}
        onStartNewRound={handleStartNewRound}
      />

      {/* Settings Modal */}
      <CrocodileSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        config={penaltyConfig}
        isHost={isHost}
        onSaveConfig={handleSaveConfig}
      />
    </div>
  );
};
