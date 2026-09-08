'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BaseGameProps } from '@/types/game';
import { Bottle2D } from './Bottle2D';
import { Bottle3D } from './Bottle3D';
import { getRandomPrompt, BottlePrompt } from './spinBottleData';
import { sfx } from '@/lib/sound';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { Sparkles, Eye, Box, Wine, HelpCircle, Trophy } from 'lucide-react';
import { showToast } from '@/lib/alerts';

export const SpinBottleGame: React.FC<BaseGameProps> = ({
  room,
  players,
  currentPlayer,
  isHost,
  onUpdateGameState,
  onUpdatePlayerDrink,
  onNextTurn,
}) => {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [localAngle, setLocalAngle] = useState<number>(0);
  const [localSpinning, setLocalSpinning] = useState<boolean>(false);
  const spinIntervalRef = useRef<any>(null);

  // Read game state from room (with fallbacks)
  const gameState = room.game_state || {};
  const currentAngle = gameState.bottleAngle ?? localAngle;
  const isSpinning = gameState.isSpinning ?? localSpinning;
  const activePrompt: BottlePrompt | null = gameState.activePrompt || null;
  const targetPlayerId: string | null = gameState.selectedPlayerId || null;
  const currentTurnPlayerId: string =
    gameState.currentTurnPlayerId || room.current_turn_player_id || players[0]?.id;

  const targetPlayer = players.find((p) => p.id === targetPlayerId);
  const currentTurnPlayer = players.find((p) => p.id === currentTurnPlayerId);
  const isMyTurn = currentPlayer?.id === currentTurnPlayerId;

  // Local visual angle to guarantee smooth CSS animation without polling interruptions
  const [displayAngle, setDisplayAngle] = useState<number>(gameState.bottleAngle || 0);

  // Visual spinning animation state: runs for the full 3.2s with deceleration
  const [isSpinAnimating, setIsSpinAnimating] = useState<boolean>(false);
  const spinTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with remote state when not spinning
  useEffect(() => {
    if (gameState.bottleAngle !== undefined && !localSpinning && !isSpinAnimating) {
      setDisplayAngle(gameState.bottleAngle);
    }
  }, [gameState.bottleAngle, localSpinning, isSpinAnimating]);

  // When remote or local triggers isSpinning
  useEffect(() => {
    if (gameState.isSpinning && gameState.bottleAngle !== undefined) {
      setDisplayAngle(gameState.bottleAngle);
      setIsSpinAnimating(true);
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
      spinTimerRef.current = setTimeout(() => {
        setIsSpinAnimating(false);
      }, 3200);
    }
  }, [gameState.isSpinning, gameState.bottleAngle]);

  // Sound ticking effect while spinning
  useEffect(() => {
    let stopSound: (() => void) | undefined;
    if (isSpinAnimating || isSpinning) {
      // Bottle spins for 3.2s, sound decelerates and finishes right as bottle lands
      stopSound = sfx.playBottleSpin(3200);
    }
    return () => {
      if (stopSound) stopSound();
    };
  }, [isSpinAnimating, isSpinning]);

  // Handle spin action
  const handleSpin = async () => {
    if (isSpinning || players.length === 0) return;
    if (!isMyTurn && !isHost) {
      showToast('ยังไม่ถึงตาของคุณในการหมุนขวด!', 'info');
      return;
    }

    // Pick random target player
    const numPlayers = players.length;
    const targetIndex = Math.floor(Math.random() * numPlayers);
    const chosenPlayer = players[targetIndex];

    // Base angle for target player:
    const baseWedge = 360 / numPlayers;
    const jitter = (Math.random() - 0.5) * (baseWedge * 0.25);
    const targetDegree = targetIndex * baseWedge + jitter;

    // Add 5 to 7 full spins forward from current displayAngle
    const fullSpins = (5 + Math.floor(Math.random() * 3)) * 360;
    const currentBase = Math.floor(displayAngle / 360) * 360;
    const finalAngle = currentBase + fullSpins + targetDegree;

    const prompt = getRandomPrompt();

    // 1. Mark spinning locally and visual animation first
    setLocalSpinning(true);
    setIsSpinAnimating(true);
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    spinTimerRef.current = setTimeout(() => {
      setIsSpinAnimating(false);
    }, 3200);

    // 2. Schedule angle update in the next animation frame so CSS transition registers start -> end
    requestAnimationFrame(() => {
      setDisplayAngle(finalAngle);
    });

    // 3. Broadcast to room
    await onUpdateGameState({
      isSpinning: true,
      bottleAngle: finalAngle,
      selectedPlayerId: null,
      activePrompt: null,
    });

    // Spin duration = 3.2 seconds (matches CSS transition & sound exactly)
    setTimeout(async () => {
      setLocalSpinning(false);
      sfx.playTileLand();

      // Show result prompt
      await onUpdateGameState({
        isSpinning: false,
        bottleAngle: finalAngle,
        selectedPlayerId: chosenPlayer.id,
        activePrompt: prompt,
      });
    }, 3200);
  };

  // Close prompt dialog and move to next turn
  const handleCompleteAction = async (drinkPenalty: number = 0) => {
    if (targetPlayer && drinkPenalty > 0) {
      sfx.playDrinkPenalty();
      await onUpdatePlayerDrink(targetPlayer.id, drinkPenalty);
    } else {
      sfx.playSuccess();
    }

    // Next turn calculation
    const currentIndex = players.findIndex((p) => p.id === currentTurnPlayerId);
    const nextIndex = (currentIndex + 1) % Math.max(players.length, 1);
    const nextPlayer = players[nextIndex];

    await onUpdateGameState({
      activePrompt: null,
      selectedPlayerId: null,
      currentTurnPlayerId: nextPlayer?.id,
    });

    if (nextPlayer) {
      await onNextTurn(nextPlayer.id);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-2 py-2 flex flex-col items-center">
      {/* Top Game Bar */}
      <div className="w-full flex items-center justify-between mb-3 bg-surface-card/80 backdrop-blur border border-amber-900/50 rounded-2xl px-4 py-2.5 shadow-lg">
        {/* Left: Turn Status */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg">
            🍾
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-amber-300 font-black">
              ตาของ
            </div>
            <div className="text-sm font-black text-white flex items-center gap-1.5">
              <span>{currentTurnPlayer?.display_name || 'กำลังรอผู้เล่น...'}</span>
              {isMyTurn && (
                <span className="text-[10px] bg-neon-green/20 text-neon-green border border-neon-green/40 px-1.5 py-0.2 rounded font-bold">
                  (ตาคุณ)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: 3D / 2D Switcher (Matching Monopoly Game style) */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setViewMode(viewMode === '3d' ? '2d' : '3d')}
            className="flex items-center gap-1.5 text-xs font-black text-yellow-300 bg-[#3b1805] hover:bg-[#522207] px-3 py-1.5 rounded-xl border border-yellow-500/50 shadow transition active:scale-95"
            title="สลับมุมมอง 3D / 2D"
          >
            <Box className="w-3.5 h-3.5" />
            <span>{viewMode === '3d' ? '3D' : '2D'}</span>
          </button>
        </div>
      </div>

      {/* Main Game Stage (3D or 2D) */}
      <div className="w-full flex justify-center items-center py-2">
        {viewMode === '3d' ? (
          <Bottle3D
            players={players}
            rotationAngle={displayAngle}
            isSpinning={isSpinAnimating || isSpinning}
            selectedPlayerId={targetPlayerId}
            onSpinClick={handleSpin}
            canSpin={isMyTurn || isHost}
            costumes={gameState.costumes}
            currentTurnPlayerId={currentTurnPlayerId}
          />
        ) : (
          <Bottle2D
            players={players}
            rotationAngle={displayAngle}
            isSpinning={isSpinAnimating || isSpinning}
            selectedPlayerId={targetPlayerId}
            onSpinClick={handleSpin}
            canSpin={isMyTurn || isHost}
          />
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="w-full max-w-md mt-4 flex flex-col items-center gap-2">
        <Button
          variant="wood-gold"
          size="lg"
          onClick={handleSpin}
          disabled={isSpinning || (!isMyTurn && !isHost)}
          className="w-full py-4 text-base font-black bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 border border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.5)]"
        >
          {isSpinning ? (
            <span className="flex items-center gap-2 animate-pulse">
              <span>🍾 กำลังหมุนขวดสุ่มชะตา...</span>
            </span>
          ) : isMyTurn ? (
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-200" />
              <span>กดหมุนขวดเลย! (ตาคุณ)</span>
            </span>
          ) : isHost ? (
            <span>หมุนขวดแทนผู้เล่น (Host)</span>
          ) : (
            <span>รอ {currentTurnPlayer?.display_name} หมุนขวด...</span>
          )}
        </Button>

        <p className="text-[11px] text-gray-400 text-center">
          💡 สลับโหมดภาพ 2D / 3D ได้ที่ปุ่มมุมบนขวา | ขวดจะชี้ผู้โชคดีรอบวง
        </p>
      </div>

      {/* Challenge / Truth or Dare Modal */}
      {activePrompt && targetPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#2a1306] via-[#1c0c04] to-[#120702] border-2 border-amber-500/60 p-6 shadow-[0_0_50px_rgba(245,158,11,0.4)] text-center relative overflow-hidden">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ขวดชี้ไปที่: {targetPlayer.display_name}</span>
            </div>

            {/* Target Player Big Avatar */}
            <div className="flex justify-center mb-3">
              <Avatar
                src={targetPlayer.avatar_url}
                name={targetPlayer.display_name}
                size="xl"
                className="ring-4 ring-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.8)] animate-bounce"
              />
            </div>

            {/* Prompt Type Badge */}
            <div className="mb-2">
              <span
                className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                  activePrompt.type === 'truth'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    : activePrompt.type === 'dare'
                    ? 'bg-red-500/20 text-red-400 border-red-500/40'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                }`}
              >
                {activePrompt.badge}
              </span>
            </div>

            {/* Title & Description */}
            <h3 className="text-xl font-black text-white mb-2">{activePrompt.title}</h3>
            <p className="text-sm text-gray-300 leading-relaxed mb-6 bg-black/40 p-3.5 rounded-2xl border border-white/5">
              {activePrompt.description}
            </p>

            {/* Penalty Info */}
            {activePrompt.penaltyDrinks > 0 && (
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-neon-pink mb-4">
                <Wine className="w-4 h-4" />
                <span>บทลงโทษหากไม่ทำ: ดื่ม {activePrompt.penaltyDrinks} จิบ/ดื่ม</span>
              </div>
            )}

            {/* Action Buttons for Host or Target Player */}
            <div className="flex flex-col gap-2">
              <Button
                variant="wood-green"
                onClick={() => handleCompleteAction(0)}
                className="w-full text-white font-black py-3 rounded-xl shadow-lg"
              >
                ✅ ทำภารกิจสำเร็จ (รอดดื่ม)
              </Button>

              {activePrompt.penaltyDrinks > 0 && (
                <Button
                  variant="ghost"
                  onClick={() => handleCompleteAction(activePrompt.penaltyDrinks)}
                  className="w-full text-red-400 hover:bg-red-500/10 border border-red-500/30 font-bold py-2.5 rounded-xl text-xs"
                >
                  🍺 ยอมแพ้ / ขอรับดื่ม {activePrompt.penaltyDrinks} จิบ
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


