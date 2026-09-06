'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BaseGameProps } from '@/types/game';
import { WheelItem, DEFAULT_WHEEL_ITEMS, getSelectedItemAtTop } from './wheelData';
import { WheelCanvas } from './WheelCanvas';
import { WheelCustomModal } from './WheelCustomModal';
import { WheelResultModal } from './WheelResultModal';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { sfx } from '@/lib/sound';
import { showToast } from '@/lib/alerts';
import { Settings, Sparkles, Disc, RefreshCw, Trophy } from 'lucide-react';

export const WheelGame: React.FC<BaseGameProps> = ({
  room,
  players,
  currentPlayer,
  isHost,
  onUpdateGameState,
  onUpdatePlayerDrink,
  onNextTurn,
}) => {
  const gameState = room.game_state || {};
  const currentTurnPlayerId: string =
    gameState.currentTurnPlayerId || room.current_turn_player_id || players[0]?.id;

  const currentTurnPlayer = players.find((p) => p.id === currentTurnPlayerId);
  const isMyTurn = currentPlayer?.id === currentTurnPlayerId;

  // Wheel Items
  const wheelItems: WheelItem[] = gameState.wheel_items || DEFAULT_WHEEL_ITEMS;
  const activeItems = wheelItems.filter((it) => it.enabled);

  // Synchronized Spinning States
  const isSpinning: boolean = gameState.isSpinning || false;
  const targetAngle: number = gameState.final_angle ?? 0;
  const selectedItem: WheelItem | null = gameState.selected_item || null;

  // Local Animation Angle and Timers
  const [displayAngle, setDisplayAngle] = useState<number>(targetAngle);
  const [localSpinning, setLocalSpinning] = useState<boolean>(false);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const spinTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize wheel items in room state if missing
  useEffect(() => {
    if (isHost && (!gameState.wheel_items || gameState.wheel_items.length === 0)) {
      onUpdateGameState({
        wheel_items: DEFAULT_WHEEL_ITEMS,
        final_angle: 0,
        isSpinning: false,
        selected_item: null,
      });
    }
  }, [isHost, gameState.wheel_items, onUpdateGameState]);

  // Sync display angle when idle
  useEffect(() => {
    if (!isSpinning && !localSpinning) {
      setDisplayAngle(targetAngle);
    }
  }, [targetAngle, isSpinning, localSpinning]);

  // Handle remote or local trigger of isSpinning
  useEffect(() => {
    if (gameState.isSpinning && gameState.final_angle !== undefined) {
      setShowResultModal(false);
      setDisplayAngle(gameState.final_angle);
      setLocalSpinning(true);

      // Play sound ticking with deceleration over 4 seconds
      const stopSound = sfx.playBottleSpin(4000);

      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
      spinTimerRef.current = setTimeout(() => {
        setLocalSpinning(false);
        if (stopSound) stopSound();
        sfx.playTileLand();
        setShowResultModal(true);
      }, 4000);

      return () => {
        if (stopSound) stopSound();
      };
    }
  }, [gameState.isSpinning, gameState.final_angle]);

  // Handle Spin Click (Turn Player or Host)
  const handleSpinClick = async () => {
    if (isSpinning || localSpinning || activeItems.length < 2) {
      if (activeItems.length < 2) {
        showToast('ต้องมีคำสั่งในวงล้ออย่างน้อย 2 ชิ้น!', 'warning');
      }
      return;
    }

    if (!isMyTurn && !isHost) {
      showToast('ยังไม่ถึงตาของคุณในการหมุนวงล้อ!', 'info');
      return;
    }

    // Immediately close any old modal
    setShowResultModal(false);

    // 1. Calculate random slice landing
    const sliceCount = activeItems.length;
    const sliceAngle = 360 / sliceCount;
    const chosenIndex = Math.floor(Math.random() * sliceCount);
    const chosenItem = activeItems[chosenIndex];

    // Pointer is at 270 deg (top needle).
    // Center angle of slice in initial circle is:
    const sliceCenter = chosenIndex * sliceAngle + sliceAngle / 2;
    // We want: (270 - (finalAngle % 360) + 360) % 360 = sliceCenter
    // => (finalAngle % 360) = (270 - sliceCenter + 360) % 360
    const targetRemainder = (270 - sliceCenter + 360) % 360;

    // Add 6 to 8 full rotations (2160 - 2880 deg) + slight random jitter within slice
    const fullSpins = (6 + Math.floor(Math.random() * 3)) * 360;
    const jitter = (Math.random() - 0.5) * (sliceAngle * 0.6);
    const currentBase = Math.floor(displayAngle / 360) * 360;
    const nextFinalAngle = currentBase + fullSpins + targetRemainder + jitter;

    // 2. Start animation locally and broadcast to all room devices
    setLocalSpinning(true);
    requestAnimationFrame(() => {
      setDisplayAngle(nextFinalAngle);
    });

    // Start spin: set isSpinning true, but keep selected_item null so modal cannot open early
    await onUpdateGameState({
      isSpinning: true,
      final_angle: nextFinalAngle,
      selected_item: null,
    });

    // 3. Complete spin after 4 seconds
    setTimeout(async () => {
      setLocalSpinning(false);
      sfx.playTileLand();

      await onUpdateGameState({
        isSpinning: false,
        final_angle: nextFinalAngle,
        selected_item: chosenItem,
      });
      setShowResultModal(true);
    }, 4000);
  };

  // Complete result action & pass turn
  const handleConfirmResult = async (drinkPenalty: number, targetPlayerId?: string) => {
    // Apply drink penalties
    if (selectedItem?.actionType === 'all') {
      sfx.playDrinkPenalty();
      // All players drink
      for (const p of players) {
        await onUpdatePlayerDrink(p.id, drinkPenalty || 1);
      }
      showToast('ทุกคนในวงชนแก้วและดื่มพร้อมกัน! 🍻', 'warning');
    } else if (targetPlayerId && drinkPenalty > 0) {
      sfx.playDrinkPenalty();
      await onUpdatePlayerDrink(targetPlayerId, drinkPenalty);
      const targetP = players.find((p) => p.id === targetPlayerId);
      showToast(`${targetP?.display_name || 'ผู้เล่น'} ดื่ม ${drinkPenalty} อึก! 🍺`, 'warning');
    } else {
      sfx.playSuccess();
    }

    // Move to next turn
    const currentIndex = players.findIndex((p) => p.id === currentTurnPlayerId);
    const nextIndex = (currentIndex + 1) % Math.max(players.length, 1);
    const nextPlayer = players[nextIndex];

    await onUpdateGameState({
      selected_item: null,
      currentTurnPlayerId: nextPlayer?.id,
    });

    if (nextPlayer) {
      await onNextTurn(nextPlayer.id);
    }
  };

  // Host saves custom items
  const handleSaveItems = async (updatedItems: WheelItem[]) => {
    await onUpdateGameState({
      wheel_items: updatedItems,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 py-2 flex flex-col items-center select-none">
      {/* Top Banner Control Bar */}
      <div className="w-full mb-3 bg-[#260e03]/90 border border-amber-900/50 rounded-2xl px-4 py-2.5 shadow-lg flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg">
            🎡
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

        {/* Custom Wheel Button */}
        <button
          onClick={() => setShowCustomModal(true)}
          className="flex items-center gap-1.5 text-xs font-black text-yellow-300 bg-[#3b1805] hover:bg-[#522207] px-3 py-1.5 rounded-xl border border-yellow-500/50 shadow transition active:scale-95 flex-shrink-0"
          title="ดู/แก้ไขข้อความในวงล้อ"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>{isHost ? 'ปรับแต่งวงล้อ' : 'ดูคำสั่ง'}</span>
        </button>
      </div>

      {/* Main Wheel Canvas Area */}
      <div className="w-full flex justify-center items-center py-2">
        <WheelCanvas
          items={wheelItems}
          rotationAngle={displayAngle}
          isSpinning={isSpinning || localSpinning}
          onSpinClick={handleSpinClick}
          canSpin={isMyTurn || isHost}
        />
      </div>

      {/* Players Mini Status Roster */}
      <div className="w-full max-w-lg mt-3 p-3 rounded-2xl bg-[#1c0a02] border border-[#481c05] shadow-lg">
        <div className="flex items-center justify-between text-[11px] font-black text-amber-300 mb-2">
          <span>สหายร่วมวง ({players.length})</span>
          <span className="text-[10px] text-gray-400">คำสั่งในวงล้อ: {activeItems.length} ช่อง</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {players.map((p) => {
            const isTurn = p.id === currentTurnPlayerId;
            return (
              <div
                key={p.id}
                className={`flex flex-col items-center p-2 rounded-xl transition border text-center ${
                  isTurn
                    ? 'bg-[#3b1805] border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                    : 'bg-[#150601] border-amber-950/60'
                }`}
              >
                <div className="w-9 h-9 relative">
                  <Avatar src={p.avatar_url} name={p.display_name} size="sm" />
                </div>
                <span className="text-[10px] font-bold text-gray-200 truncate w-full mt-1">
                  {p.display_name}
                </span>
                <span className="text-[9px] text-amber-400 font-black">
                  🍺 {p.drinks_count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Main Spin Action Button */}
      <div className="w-full max-w-md mt-4 flex flex-col items-center gap-2">
        <Button
          variant="wood-gold"
          size="lg"
          onClick={handleSpinClick}
          disabled={isSpinning || localSpinning || (!isMyTurn && !isHost) || activeItems.length < 2}
          className="w-full py-4 text-base font-black bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 border border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.5)]"
        >
          {isSpinning || localSpinning ? (
            <span className="flex items-center gap-2 animate-pulse">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-100" />
              <span>วงล้อกำลังหมุนเสี่ยงทาย...</span>
            </span>
          ) : isMyTurn ? (
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-200" />
              <span>แตะเพื่อหมุนวงล้อเลย! (ตาคุณ) 🎡</span>
            </span>
          ) : isHost ? (
            <span>หมุนวงล้อแทนผู้เล่น (Host) 🎡</span>
          ) : (
            <span>รอ {currentTurnPlayer?.display_name} หมุนวงล้อ...</span>
          )}
        </Button>
      </div>

      {/* Host Customization Modal */}
      <WheelCustomModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        wheelItems={wheelItems}
        isHost={isHost}
        onSaveItems={handleSaveItems}
      />

      {/* Result Modal */}
      <WheelResultModal
        isOpen={showResultModal && !isSpinning && !localSpinning && !!selectedItem}
        onClose={() => setShowResultModal(false)}
        item={selectedItem}
        spinnerPlayer={currentTurnPlayer || null}
        players={players}
        currentUserId={currentPlayer?.id || ''}
        isHost={isHost}
        onConfirm={handleConfirmResult}
      />
    </div>
  );
};
