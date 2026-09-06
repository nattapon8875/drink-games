'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RoomRecord, PlayerRecord } from '@/types/database';
import {
  PlayingCard,
  CardValue,
  DoraemonRule,
  DEFAULT_DORAEMON_RULES,
  createDeck,
  shuffleDeck,
  SUIT_SYMBOLS,
  KingMode,
  KingPresetRule,
  DEFAULT_KING_PRESET_RULES,
} from './doraemonCardData';
import { CardCircle } from './CardCircle';
import { DoraemonRulesModal } from './DoraemonRulesModal';
import { DoraemonActionModal } from './DoraemonActionModal';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { BuffaloLogo } from '@/components/common/BuffaloLogo';
import { sfx } from '@/lib/sound';
import { showToast, showConfirm } from '@/lib/alerts';
import { Sparkles, Layers, Settings, Users, AlertTriangle, ShieldAlert, Award } from 'lucide-react';

interface DoraemonCardGameProps {
  room: RoomRecord;
  players: PlayerRecord[];
  currentPlayer: PlayerRecord | null;
  isHost: boolean;
  onUpdateGameState: (partialState: Record<string, any>) => Promise<void>;
  onUpdatePlayerDrink: (playerId: string, amount: number) => Promise<void>;
  onNextTurn: (nextPlayerId: string) => Promise<void>;
}

export const DoraemonCardGame: React.FC<DoraemonCardGameProps> = ({
  room,
  players,
  currentPlayer,
  isHost,
  onUpdateGameState,
  onUpdatePlayerDrink,
  onNextTurn,
}) => {
  const gameState = room.game_state || {};
  const currentTurnPlayerId =
    gameState.currentTurnPlayerId || room.current_turn_player_id || players[0]?.id;

  const currentTurnPlayer = players.find((p) => p.id === currentTurnPlayerId);
  const isMyTurn = currentPlayer?.id === currentTurnPlayerId;

  // Deck state
  const deck: PlayingCard[] = gameState.deck || [];
  const drawnCards: PlayingCard[] = gameState.drawnCards || [];
  const lastDrawnCard: PlayingCard | null = gameState.lastDrawnCard || null;
  const isDrawing: boolean = gameState.isDrawing || false;

  // Game rules (customized or default)
  const customRules: Record<CardValue, DoraemonRule> =
    gameState.custom_rules || DEFAULT_DORAEMON_RULES;

  // Special Doraemon States
  const buddies: Record<string, string> = gameState.buddies || {}; // playerId -> buddyId
  const ghostPlayerId: string | null = gameState.ghostPlayerId || null;
  const toiletPasses: Record<string, number> = gameState.toilet_passes || {}; // playerId -> count
  
  // King State (with backward compatibility)
  const kingCount: number = gameState.kings_drawn_count !== undefined ? gameState.kings_drawn_count : (gameState.kingCount || 0);
  const kingMode: KingMode = gameState.king_mode || 'preset';
  const kingPresetRules: Record<string, KingPresetRule> = gameState.king_preset_rules || DEFAULT_KING_PRESET_RULES;
  const kingSentences: Record<string, string> = gameState.king_sentences || {
    '1': gameState.kingParts?.what || '',
    '2': gameState.kingParts?.where || '',
    '3': gameState.kingParts?.howMany || '',
    '4': gameState.kingParts?.who || '',
  };
  const kingParts: {
    what?: string;
    where?: string;
    howMany?: string;
    who?: string;
  } = gameState.kingParts || {
    what: kingSentences['1'],
    where: kingSentences['2'],
    howMany: kingSentences['3'],
    who: kingSentences['4'],
  };

  // Modals
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showActionModal, setShowActionModal] = useState<boolean>(false);
  const [localDrawing, setLocalDrawing] = useState<boolean>(false);

  // Initialize deck if empty
  useEffect(() => {
    if (isHost && (!gameState.deck || gameState.deck.length === 0) && (!gameState.drawnCards || gameState.drawnCards.length === 0)) {
      const freshDeck = shuffleDeck(createDeck());
      onUpdateGameState({
        deck: freshDeck,
        drawnCards: [],
        lastDrawnCard: null,
        isDrawing: false,
        kingCount: 0,
        kings_drawn_count: 0,
        king_mode: 'preset',
        king_preset_rules: DEFAULT_KING_PRESET_RULES,
        king_sentences: { '1': '', '2': '', '3': '', '4': '' },
        kingParts: {},
        buddies: {},
        ghostPlayerId: null,
        toilet_passes: {},
      });
    }
  }, [isHost, gameState.deck, gameState.drawnCards, onUpdateGameState]);

  // Open action modal whenever a card is drawn
  useEffect(() => {
    if (lastDrawnCard && !isDrawing) {
      setShowActionModal(true);
    }
  }, [lastDrawnCard, isDrawing]);

  // Handle Draw Card
  const handleDrawCard = async () => {
    if (localDrawing || isDrawing) return;
    if (!isMyTurn && !isHost) {
      showToast('ยังไม่ถึงตาของคุณในการจั่วไพ่!', 'info');
      return;
    }

    let currentDeck = [...deck];
    if (currentDeck.length === 0) {
      // Reshuffle fresh deck
      currentDeck = shuffleDeck(createDeck());
      showToast('ไพ่หมดสำรับ! ทำการสับไพ่ใหม่ 52 ใบ 🃏', 'success');
    }

    const drawn = currentDeck.pop();
    if (!drawn) return;

    setLocalDrawing(true);
    sfx.playCardDraw();

    // Broadcast drawing animation start
    await onUpdateGameState({
      isDrawing: true,
      lastDrawnCard: drawn,
      deck: currentDeck,
    });

    // 1 second flip animation
    setTimeout(async () => {
      sfx.playCardFlip();
      setLocalDrawing(false);

      // Determine updated King Count
      let nextKingCount = kingCount;
      if (drawn.value === 'K') {
        nextKingCount = Math.min(kingCount + 1, 4);
      }

      await onUpdateGameState({
        isDrawing: false,
        lastDrawnCard: drawn,
        drawnCards: [drawn, ...drawnCards],
        kingCount: nextKingCount,
        kings_drawn_count: nextKingCount,
      });
    }, 900);
  };

  // Complete action from Modal & pass turn
  const handleCompleteAction = async (data: {
    drinkPenalty?: number;
    targetPlayerId?: string;
    toiletPassPlayerId?: string;
    ghostPlayerId?: string;
    buddyPair?: [string, string];
    kingPartInput?: string;
  }) => {
    const nextUpdates: Record<string, any> = {};

    // 1. Drink penalty
    if (data.drinkPenalty && data.drinkPenalty > 0 && currentTurnPlayer) {
      sfx.playDrinkPenalty();
      await onUpdatePlayerDrink(currentTurnPlayer.id, data.drinkPenalty);

      // Check if buddy exists and drinks along
      const buddyId = buddies[currentTurnPlayer.id];
      if (buddyId) {
        const buddyPlayer = players.find((p) => p.id === buddyId);
        if (buddyPlayer) {
          await onUpdatePlayerDrink(buddyId, data.drinkPenalty);
          showToast(`บัดดี้ร่วมชะตา! ${buddyPlayer.display_name} ต้องดื่มตาม ${data.drinkPenalty} อึก! 🤝`, 'warning');
        }
      }
    } else {
      sfx.playSuccess();
    }

    // 2. Buddy linking (5)
    if (data.buddyPair) {
      const [p1, p2] = data.buddyPair;
      const updatedBuddies = { ...buddies, [p1]: p2, [p2]: p1 };
      nextUpdates.buddies = updatedBuddies;
      const bPlayer = players.find((p) => p.id === p2);
      showToast(`ผูกชะตาบัดดี้เรียบร้อย! ${currentTurnPlayer?.display_name} 🤝 ${bPlayer?.display_name}`, 'success');
    }

    // 3. Toilet pass (8)
    if (data.toiletPassPlayerId) {
      const currentCount = toiletPasses[data.toiletPassPlayerId] || 0;
      const updatedPasses = {
        ...toiletPasses,
        [data.toiletPassPlayerId]: currentCount + 1,
      };
      nextUpdates.toilet_passes = updatedPasses;
      showToast(`คุณได้รับบัตรเข้าห้องน้ำ 1 ใบ! (รวมมี ${currentCount + 1} ใบ) 🚽🎫`, 'success');
    }

    // 4. Ghost status (Q)
    if (data.ghostPlayerId) {
      nextUpdates.ghostPlayerId = data.ghostPlayerId;
      showToast(`${currentTurnPlayer?.display_name} กลายเป็น "คนไร้ตัวตน" แล้ว! ห้ามใครคุยด้วยเด็ดขาด 👻`, 'warning');
    }

    // 5. King Punishment stages (K)
    if (data.kingPartInput && lastDrawnCard?.value === 'K') {
      const updatedSentences = { ...kingSentences, [String(kingCount)]: data.kingPartInput };
      const updatedParts = { ...kingParts };
      if (kingCount === 1) updatedParts.what = data.kingPartInput;
      else if (kingCount === 2) updatedParts.where = data.kingPartInput;
      else if (kingCount === 3) updatedParts.howMany = data.kingPartInput;
      else if (kingCount === 4) updatedParts.who = data.kingPartInput;

      nextUpdates.king_sentences = updatedSentences;
      nextUpdates.kingParts = updatedParts;

      if (kingCount === 4) {
        showToast('👑 บทลงโทษไพ่คิงครบ 4 ส่วนแล้ว! ทุกคนเตรียมตัว!', 'warning');
      }
    }

    // Calculate next turn player
    const currentIndex = players.findIndex((p) => p.id === currentTurnPlayerId);
    const nextIndex = (currentIndex + 1) % Math.max(players.length, 1);
    const nextPlayer = players[nextIndex];

    nextUpdates.currentTurnPlayerId = nextPlayer?.id;
    nextUpdates.lastDrawnCard = null;

    await onUpdateGameState(nextUpdates);
    if (nextPlayer) {
      await onNextTurn(nextPlayer.id);
    }
  };

  // Host saves custom rules & King settings
  const handleSaveRules = async (
    updatedRules: Record<CardValue, DoraemonRule>,
    updatedKingMode?: KingMode,
    updatedKingPresetRules?: Record<string, KingPresetRule>
  ) => {
    const updates: Record<string, any> = {
      custom_rules: updatedRules,
    };
    if (updatedKingMode) {
      updates.king_mode = updatedKingMode;
    }
    if (updatedKingPresetRules) {
      updates.king_preset_rules = updatedKingPresetRules;
    }
    await onUpdateGameState(updates);
  };

  const currentRule = lastDrawnCard ? customRules[lastDrawnCard.value] || DEFAULT_DORAEMON_RULES[lastDrawnCard.value] : null;

  return (
    <div className="w-full max-w-4xl mx-auto px-2 py-2 flex flex-col items-center select-none">
      {/* ⚠️ Permanent Doraemon Golden Rule Banner (Always Visible) */}
      <div className="w-full mb-3 bg-gradient-to-r from-red-950 via-amber-950 to-red-950 border-2 border-amber-500/70 rounded-2xl p-2.5 sm:p-3 shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg animate-pulse">
            ☝️
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-amber-300 font-black flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span>กฎกลางโดราเอมอนประจำวง</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-white">
              ห้ามชี้นิ้วเด็ดขาด! <span className="text-amber-300">ใครเผลอชี้นิ้ว ดื่ม 1 อึก</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowRulesModal(true)}
          className="flex items-center gap-1.5 text-xs font-black text-yellow-300 bg-[#3b1805] hover:bg-[#522207] px-3 py-1.5 rounded-xl border border-yellow-500/50 shadow transition active:scale-95 flex-shrink-0"
          title="ดู/แก้ไขกฎไพ่ A-K"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>{isHost ? 'แก้กฎ' : 'ดูกฎ'}</span>
        </button>
      </div>

      {/* Turn Status & Roster Bar */}
      <div className="w-full flex items-center justify-between mb-3 bg-[#260e03]/90 border border-amber-900/50 rounded-2xl px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg">
            🃏
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

        {/* King Counter Badge (K 1-4) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#180802] px-3 py-1 rounded-xl border border-amber-500/40 text-xs font-black text-amber-300">
            <span>👑 King:</span>
            <span className="text-amber-100">{kingCount} / 4</span>
          </div>

          <div className="text-xs text-gray-300 bg-[#180802] px-2.5 py-1 rounded-xl border border-amber-900/40">
            ไพ่เหลือ: <b className="text-amber-300">{deck.length}</b> ใบ
          </div>
        </div>
      </div>

      {/* Special Status Ribbons (Ghost & King Punishment Summary) */}
      <div className="w-full space-y-1.5 mb-2">
        {/* Ghost Ribbon if active */}
        {ghostPlayerId && (
          <div className="w-full py-1.5 px-3 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-between text-xs text-purple-200">
            <span className="flex items-center gap-1.5 font-bold">
              <span>👻 คนไร้ตัวตน:</span>
              <b className="text-white">
                {players.find((p) => p.id === ghostPlayerId)?.display_name || 'เพื่อนในวง'}
              </b>
              <span>(ห้ามใครคุยด้วยเด็ดขาด!)</span>
            </span>
          </div>
        )}

        {/* 4th King Complete Punishment Grand Announcement */}
        {kingCount === 4 && (
          <div className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 font-black text-center shadow-[0_0_30px_rgba(245,158,11,0.8)] border-2 border-yellow-200 animate-pulse">
            <div className="text-xs uppercase tracking-widest text-stone-900 mb-1">
              ⚡ มหาบทลงโทษไพ่คิงครบ 4 ส่วน! ⚡
            </div>
            {kingMode === 'preset' ? (
              <div className="text-xs sm:text-sm drop-shadow space-y-0.5">
                <div>👑 <b>{kingPresetRules['4']?.title || 'K ใบที่ 4'}:</b> {kingPresetRules['4']?.description}</div>
                <div className="text-[11px] font-bold text-amber-950 mt-1">
                  (ภารกิจ K1-3: {kingPresetRules['1']?.description} | {kingPresetRules['2']?.description} | {kingPresetRules['3']?.description})
                </div>
              </div>
            ) : (
              <div className="text-sm sm:text-base drop-shadow">
                "{kingParts.who || 'คนแพ้'} ต้อง {kingParts.what || 'ทำอะไร'} ที่ {kingParts.where || 'ที่ไหน'} จำนวน {kingParts.howMany || 'กี่ครั้ง'}!"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Game Stage: Circular Card Spread */}
      <div className="w-full flex justify-center items-center py-1">
        <CardCircle
          remainingCards={deck}
          lastDrawnCard={lastDrawnCard}
          isDrawing={isDrawing || localDrawing}
          canDraw={isMyTurn || isHost}
          onDrawCard={handleDrawCard}
          ruleTitle={currentRule?.title}
          ruleIcon={currentRule?.icon}
        />
      </div>

      {/* Players Mini Status Roster */}
      <div className="w-full max-w-lg mt-3 p-3 rounded-2xl bg-[#1c0a02] border border-[#481c05] shadow-lg">
        <div className="flex items-center justify-between text-[11px] font-black text-amber-300 mb-2">
          <span>สหายร่วมวง ({players.length})</span>
          <span className="text-[10px] text-gray-400">กฎกลาง: ห้ามชี้นิ้ว ☝️</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {players.map((p) => {
            const isTurn = p.id === currentTurnPlayerId;
            const isGhost = p.id === ghostPlayerId;
            const passes = toiletPasses[p.id] || 0;
            const buddyId = buddies[p.id];

            return (
              <div
                key={p.id}
                className={`relative flex flex-col items-center p-2 rounded-xl transition border text-center ${
                  isTurn
                    ? 'bg-[#3b1805] border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                    : isGhost
                    ? 'bg-purple-950/60 border-purple-500/50'
                    : 'bg-[#150601] border-amber-950/60'
                }`}
              >
                {/* Active Badges */}
                <div className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5">
                  {isGhost && (
                    <span className="text-xs bg-purple-900 border border-purple-400 rounded-full px-1 shadow animate-pulse" title="คนไร้ตัวตน">
                      👻
                    </span>
                  )}
                  {passes > 0 && (
                    <span className="text-[10px] bg-cyan-900 text-cyan-200 border border-cyan-400 rounded-full px-1 font-black shadow" title="บัตรห้องน้ำ">
                      🎫{passes}
                    </span>
                  )}
                </div>

                <div className="w-9 h-9 relative">
                  <Avatar src={p.avatar_url} name={p.display_name} size="sm" />
                </div>
                <span className="text-[10px] font-bold text-gray-200 truncate w-full mt-1">
                  {p.display_name}
                </span>
                <span className="text-[9px] text-amber-400 font-black">
                  🍺 {p.drinks_count}
                </span>
                {buddyId && (
                  <span className="text-[8px] text-blue-300 font-bold truncate w-full">
                    🤝 บัดดี้
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Main Button */}
      <div className="w-full max-w-md mt-3 flex flex-col items-center gap-2">
        <Button
          variant="wood-gold"
          size="lg"
          onClick={handleDrawCard}
          disabled={isDrawing || localDrawing || (!isMyTurn && !isHost)}
          className="w-full py-4 text-base font-black bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 border border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.5)]"
        >
          {isDrawing || localDrawing ? (
            <span className="flex items-center gap-2 animate-pulse">
              <span>🃏 กำลังจั่วและหงายไพ่...</span>
            </span>
          ) : isMyTurn ? (
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-200" />
              <span>แตะเพื่อจั่วไพ่เลย! (ตาคุณ)</span>
            </span>
          ) : isHost ? (
            <span>จั่วไพ่แทนผู้เล่น (Host)</span>
          ) : (
            <span>รอ {currentTurnPlayer?.display_name} จั่วไพ่...</span>
          )}
        </Button>
      </div>

      {/* Rules Editing Modal */}
      <DoraemonRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        customRules={customRules}
        kingMode={kingMode}
        kingPresetRules={kingPresetRules}
        isHost={isHost}
        onSaveRules={handleSaveRules}
      />

      {/* Card Action Popup Modal */}
      <DoraemonActionModal
        isOpen={showActionModal && !!lastDrawnCard}
        onClose={() => setShowActionModal(false)}
        card={lastDrawnCard}
        rule={currentRule}
        drawerPlayer={currentTurnPlayer || null}
        players={players}
        currentUserId={currentPlayer?.id || ''}
        isHost={isHost}
        onCompleteAction={handleCompleteAction}
        kingCount={kingCount}
        kingMode={kingMode}
        kingPresetRules={kingPresetRules}
        kingSentences={kingSentences}
        kingParts={kingParts}
      />
    </div>
  );
};
