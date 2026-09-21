'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PlayerRecord } from '@/types/database';
import { Avatar } from '@/components/common/Avatar';
import { sfx } from '@/lib/sound';
import confetti from 'canvas-confetti';
import { Dices, Crown, Sparkles, Trophy, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import {
  dealStartingProperties,
  formatMoneyM,
  recomputeRowBonus,
  rowMultiplierFor,
  ROW_NAMES,
  INITIAL_CASH_M,
  SUPER_MONOPOLY_TILES,
} from './superMonopolyData';

interface RollOrderModalProps {
  isOpen: boolean;
  players: PlayerRecord[];
  currentPlayer: PlayerRecord | null;
  isHost: boolean;
  hostId?: string;
  roomGameState: any;
  onUpdateGameState: (partialState: Record<string, any>) => Promise<void>;
  onReorderPlayers?: (orderedPlayerIds: string[]) => Promise<void>;
  onNextTurn: (nextPlayerId: string) => Promise<void>;
}

export const RollOrderModal: React.FC<RollOrderModalProps> = ({
  isOpen,
  players,
  currentPlayer,
  isHost,
  hostId,
  roomGameState,
  onUpdateGameState,
  onReorderPlayers,
  onNextTurn,
}) => {
  const rolls: Record<string, { d1: number; d2: number; total: number; tiebreaker: number }> =
    roomGameState?.roll_order_rolls || {};

  const rollsRef = useRef(rolls);
  rollsRef.current = rolls;

  const playersRef = useRef(players);
  playersRef.current = players;

  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;

  const isRollingBotsRef = useRef(false);

  const [isLocalRolling, setIsLocalRolling] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const finalizedRef = useRef(false);

  // Render authentic 3D dice faces (Red dot for 1, black dots for 2-6)
  const renderMiniDice = (val: number, isRollingAnim = false) => {
    const dots: Record<number, string[]> = {
      1: ['col-start-2 row-start-2'],
      2: ['col-start-1 row-start-1', 'col-start-3 row-start-3'],
      3: ['col-start-1 row-start-1', 'col-start-2 row-start-2', 'col-start-3 row-start-3'],
      4: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
      5: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-2 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
      6: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-2', 'col-start-3 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
    };
    const dotClasses = dots[val] || dots[1];

    return (
      <div
        className={`w-9 h-9 rounded-xl bg-gradient-to-b from-[#ffffff] via-[#fbfbf7] to-[#e9e9e0] border border-b-2 border-[#9a9a90] shadow-md flex items-center justify-center transition-all ${
          isRollingAnim ? 'animate-spin' : ''
        }`}
      >
        <div className="grid grid-cols-3 grid-rows-3 w-6 h-6 p-0.5 gap-0.5 pointer-events-none">
          {dotClasses.map((cls, idx) => (
            <span
              key={idx}
              style={{ backgroundColor: val === 1 ? '#d42a2a' : '#1b1b1b' }}
              className={`w-1.5 h-1.5 rounded-full justify-self-center self-center ${cls}`}
            />
          ))}
        </div>
      </div>
    );
  };

  // Check if all players in room have rolled
  const allRolled = useMemo(() => {
    if (players.length === 0) return false;
    return players.every((p) => Boolean(rolls[p.id]));
  }, [players, rolls]);

  // Sort players by total score (descending), tiebreaker resolves equals
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const rA = rolls[a.id];
      const rB = rolls[b.id];
      if (!rA && !rB) return 0;
      if (!rA) return 1;
      if (!rB) return -1;
      const scoreA = rA.total * 1000 + (rA.tiebreaker || 0);
      const scoreB = rB.total * 1000 + (rB.tiebreaker || 0);
      return scoreB - scoreA;
    });
  }, [players, rolls]);

  // Handle human roll
  const handleRollForMe = async () => {
    if (!currentPlayer || rollsRef.current[currentPlayer.id] || isLocalRolling) return;
    setIsLocalRolling(true);
    sfx.playDiceRoll();

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;
    const tiebreaker = Math.random() * 999;

    setTimeout(async () => {
      sfx.playTileLand();
      const updatedRolls = {
        ...(rollsRef.current || {}),
        [currentPlayer.id]: { d1, d2, total, tiebreaker },
      };

      await onUpdateGameState({
        roll_order_rolls: updatedRolls,
      });
      setIsLocalRolling(false);
    }, 700);
  };

  // Auto-roll for all bots (Reliable async loop that does NOT get cancelled by 400ms polling re-renders)
  useEffect(() => {
    if (!isOpen || allRolled) return;

    const hasUnrolledBots = players.some(
      (p) => (p.line_user_id === 'bot' || p.id.startsWith('bot-')) && !rollsRef.current[p.id]
    );

    if (!hasUnrolledBots || isRollingBotsRef.current) return;

    const firstHuman = players.find(
      (p) => p.line_user_id !== 'bot' && !p.id.startsWith('bot-')
    );
    const shouldIHandleBots = isHost || (currentPlayer && firstHuman && currentPlayer.id === firstHuman.id);
    if (!shouldIHandleBots) return;

    isRollingBotsRef.current = true;

    const runBotRolls = async () => {
      // Small initial delay so users can see the modal appear
      await new Promise((resolve) => setTimeout(resolve, 600));

      const botsToRoll = playersRef.current.filter(
        (p) => (p.line_user_id === 'bot' || p.id.startsWith('bot-')) && !rollsRef.current[p.id]
      );

      let currentRolls = { ...(rollsRef.current || {}) };

      for (const bot of botsToRoll) {
        if (currentRolls[bot.id]) continue;

        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const total = d1 + d2;
        const tiebreaker = Math.random() * 999;

        currentRolls = {
          ...currentRolls,
          ...rollsRef.current,
          [bot.id]: { d1, d2, total, tiebreaker },
        };

        sfx.playDiceRoll();

        await onUpdateGameState({
          roll_order_rolls: currentRolls,
        });

        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      isRollingBotsRef.current = false;
    };

    runBotRolls();
  }, [isOpen, allRolled, isHost, currentPlayer, players, onUpdateGameState]);

  // Host button to roll for everyone who hasn't rolled yet
  const handleRollForAll = async () => {
    sfx.playDiceRoll();
    const updated = { ...(rollsRef.current || {}) };

    for (const p of playersRef.current) {
      if (!updated[p.id]) {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        updated[p.id] = {
          d1,
          d2,
          total: d1 + d2,
          tiebreaker: Math.random() * 999,
        };
      }
    }

    await onUpdateGameState({
      roll_order_rolls: updated,
    });
  };

  // When all players have rolled, show celebration & start countdown
  useEffect(() => {
    if (!allRolled || finalizedRef.current) return;

    sfx.playSuccess();
    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
    } catch {}

    setCountdown(4);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [allRolled]);

  // Finalize Roll Order and transition into Game Turn 1
  const finalizeRollOrder = async () => {
    if (!isHost || finalizedRef.current || !allRolled) return;
    // A refresh remounts this component with finalizedRef cleared, and the
    // countdown is still at zero - so without this the starting hands were
    // dealt a second time, mid-game, charging everyone for land all over again.
    if (roomGameState?.roll_order_done) return;
    finalizedRef.current = true;

    const orderedIds = sortedPlayers.map((p) => p.id);
    const firstPlayer = sortedPlayers[0];

    // 1. Build rank score map for persistent display on left panel
    const scoreMap: Record<string, { rank: number; total: number; d1: number; d2: number }> = {};
    sortedPlayers.forEach((p, idx) => {
      const r = rolls[p.id];
      scoreMap[p.id] = {
        rank: idx + 1,
        total: r?.total ?? 0,
        d1: r?.d1 ?? 1,
        d2: r?.d2 ?? 1,
      };
    });

    const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    // Nobody owns anything for the first few laps, which is most of why a game
    // used to run long. Everyone starts holding land instead, paid for out of
    // their opening cash, so there is rent on the board from turn one.
    const { properties: dealtProperties, spend } = dealStartingProperties(orderedIds);
    const startingCash: Record<string, number> = { ...(roomGameState?.cash || {}) };
    orderedIds.forEach((id) => {
      startingCash[id] = (startingCash[id] ?? INITIAL_CASH_M) - (spend[id] || 0);
    });

    const dealLogs = sortedPlayers
      .map((p) => {
        const mine = Object.entries(dealtProperties)
          .filter(([, own]) => own.ownerId === p.id)
          .map(([idx]) => SUPER_MONOPOLY_TILES[Number(idx)]?.name)
          .filter(Boolean);
        if (mine.length === 0) return null;
        return {
          text: `🎴 [${p.display_name}] ได้ที่ดินตั้งต้น ${mine.join(', ')} (จ่าย ${formatMoneyM(
            spend[p.id] || 0
          )} ➔ เงินเหลือ ${formatMoneyM(startingCash[p.id] ?? INITIAL_CASH_M)})`,
          time: timeStr,
          color: '#10b981',
        };
      })
      .filter(Boolean) as Array<{ text: string; time: string; color: string }>;

    // Kept so every player can be shown the hand they were dealt and what it
    // cost them - the feed line scrolls away, this does not.
    const startingDeal = {
      at: Date.now(),
      hands: Object.fromEntries(
        sortedPlayers.map((p) => [
          p.id,
          {
            tiles: Object.entries(dealtProperties)
              .filter(([, own]) => own.ownerId === p.id)
              .map(([idx]) => Number(idx))
              .sort((a, b) => a - b),
            spend: spend[p.id] || 0,
            cashBefore: (roomGameState?.cash?.[p.id] ?? INITIAL_CASH_M) as number,
            cashAfter: startingCash[p.id] ?? INITIAL_CASH_M,
          },
        ])
      ),
    };

    // The opening hand can already hand somebody a side of the board.
    const openingRowBonus = recomputeRowBonus(dealtProperties, null);
    const rowLog = openingRowBonus
      ? [
          {
            text: `🎏 [${
              sortedPlayers.find((p) => p.id === openingRowBonus.ownerId)?.display_name || 'ผู้เล่น'
            }] ได้ที่ดินตั้งต้นใน [${ROW_NAMES[openingRowBonus.row]}] ถึง ${
              openingRowBonus.count
            } ช่อง ➜ ค่าผ่านทางจังหวัดในแถวนี้คูณ x${rowMultiplierFor(openingRowBonus.count)}`,
            time: timeStr,
            color: '#a855f7',
          },
        ]
      : [];

    const newLogs = [
      ...rowLog,
      {
        text: `👑 ผลทอยเต๋าตัดสินลำดับ: [${firstPlayer.display_name}] ได้แต้มสูงสุด (${rolls[firstPlayer.id]?.total} แต้ม) เริ่มเดินคนแรก!`,
        time: timeStr,
        color: '#fbbf24',
      },
      ...dealLogs.reverse(),
      ...(roomGameState?.gameLogs || []),
    ];

    try {
      // 2. Reorder players in database/room
      if (onReorderPlayers) {
        await onReorderPlayers(orderedIds);
      }

      // 3. Set first player turn
      await onNextTurn(firstPlayer.id);

      // 4. Mark roll order complete
      await onUpdateGameState({
        roll_order_done: true,
        roll_order_scores: scoreMap,
        properties: dealtProperties,
        startingDeal,
        rowBonus: openingRowBonus,
        cash: startingCash,
        gameLogs: newLogs,
        isRolling: false,
        isMoving: false,
      });
    } catch (err) {
      console.error('Error finalizing roll order:', err);
    }
  };

  // Trigger finalize when countdown reaches 0
  useEffect(() => {
    if (!isOpen || roomGameState?.roll_order_done) return;
    if (countdown === 0 && !finalizedRef.current) {
      const firstHuman = players.find(
        (p) => p.line_user_id !== 'bot' && !p.id.startsWith('bot-')
      );
      const shouldIHandleFinalize = isHost || (currentPlayer && firstHuman && currentPlayer.id === firstHuman.id);
      if (shouldIHandleFinalize) {
        finalizeRollOrder();
      }
    }
  }, [countdown, isHost, currentPlayer, players, isOpen, roomGameState?.roll_order_done]);

  if (!isOpen) return null;

  const myRoll = currentPlayer ? rolls[currentPlayer.id] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/92 animate-fadeIn">
      <div className="w-full max-w-xl bg-gradient-to-b from-[rgb(var(--c-surface))] via-[rgb(var(--c-surface))] to-[rgb(var(--c-bg-deep))] border-3 border-[rgb(var(--c-line))] rounded-3xl p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col gap-4 text-center">
        {/* Glow ambient decoration */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-black mb-2 shadow">
            <Dices className="w-4 h-4 text-yellow-400" />
            <span>เริ่มต้นการแข่งขัน • ซุปเปอร์เศรษฐี</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-amber-100 rpg-text-gold tracking-wide">
            🎲 ทอยลูกเต๋าตัดสินลำดับการเริ่มเกม
          </h2>
          <p className="text-xs text-amber-200/80 font-semibold max-w-md mt-1">
            ผู้เล่นทุกคนจะทอยลูกเต๋าคนละ 1 ครั้ง ผู้ที่ได้แต้มสูงสุดจะได้เริ่มเดินเป็นคนแรก
            และจัดลำดับการเล่นตามแต้มที่ทอยได้!
          </p>
        </div>

        {/* Players Roll Status List */}
        {/* Side padding, not just pr: scrolling clips horizontally too, and the
            winner's ring sits outside its border - without room it was shaved
            off at both edges. */}
        <div className="relative z-10 flex flex-col gap-2 max-h-[48vh] overflow-y-auto px-1.5 py-1.5">
          {players.map((p) => {
            const roll = rolls[p.id];
            const isMe = p.id === currentPlayer?.id;
            const isBot = p.line_user_id === 'bot' || p.id.startsWith('bot-');
            const isTopRoller = allRolled && sortedPlayers[0]?.id === p.id;
            const rankIndex = allRolled ? sortedPlayers.findIndex((sp) => sp.id === p.id) : -1;

            return (
              <div
                key={p.id}
                className={`p-3 rounded-2xl border-2 flex items-center justify-between transition-all ${
                  isTopRoller
                    ? 'bg-gradient-to-r from-[rgb(var(--c-surface-2))] to-[rgb(var(--c-surface))] border-yellow-400 ring-2 ring-yellow-400/50 shadow-lg'
                    : roll
                    ? 'bg-[rgb(var(--c-bg-deep))] border-[rgb(var(--c-surface-3))]'
                    : 'bg-[rgb(var(--c-bg-deep))] border-[rgb(var(--c-surface))]'
                }`}
              >
                {/* Left: Avatar, Name, Rank */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar src={p.avatar_url} name={p.display_name} size="sm" />
                    {rankIndex === 0 && (
                      <span className="absolute -top-1.5 -left-1.5 text-sm drop-shadow">🥇</span>
                    )}
                    {rankIndex === 1 && (
                      <span className="absolute -top-1.5 -left-1.5 text-sm drop-shadow">🥈</span>
                    )}
                    {rankIndex === 2 && (
                      <span className="absolute -top-1.5 -left-1.5 text-sm drop-shadow">🥉</span>
                    )}
                  </div>

                  <div className="text-left min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-amber-100 truncate max-w-[130px]">
                        {p.display_name}
                      </span>
                      {isMe && (
                        <span className="text-[8px] font-black bg-amber-500 text-[rgb(var(--c-on-accent))] px-1.5 py-0.2 rounded-full border border-white">
                          คุณ
                        </span>
                      )}
                      {isBot && (
                        <span className="text-[8px] font-black bg-purple-950 text-purple-300 px-1.5 py-0.2 rounded border border-purple-700">
                          BOT
                        </span>
                      )}
                      {(hostId ? p.id === hostId : p.id === roomGameState?.host_id || p.id === players[0]?.id) && (
                        <Crown className="w-3 h-3 text-yellow-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-amber-300/80 font-semibold block">
                      {allRolled && rankIndex >= 0
                        ? rankIndex === 0
                          ? '👑 ลำดับ 1 (เริ่มเดินคนแรก)'
                          : `ลำดับที่ ${rankIndex + 1}`
                        : roll
                        ? 'ทอยเรียบร้อยแล้ว'
                        : isBot
                        ? 'กำลังสุ่มทอย...'
                        : 'รอทอยลูกเต๋า'}
                    </span>
                  </div>
                </div>

                {/* Right: Dice Result or Roll Button */}
                <div className="flex items-center gap-2 shrink-0">
                  {roll ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {renderMiniDice(roll.d1)}
                        {renderMiniDice(roll.d2)}
                      </div>
                      <div className="bg-[rgb(var(--c-surface))] border border-yellow-500/40 px-2.5 py-1 rounded-xl text-center shadow-inner">
                        <span className="text-xs font-black font-mono text-yellow-300">
                          {roll.total}
                        </span>
                        <span className="text-[8px] text-amber-400/80 block -mt-0.5">แต้ม</span>
                      </div>
                    </div>
                  ) : isMe ? (
                    <button
                      type="button"
                      disabled={isLocalRolling}
                      onClick={handleRollForMe}
                      className="wood-btn-gold px-3.5 py-2 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 active:scale-95 animate-pulse"
                    >
                      <Dices className="w-4 h-4 text-amber-950" />
                      <span>{isLocalRolling ? 'กำลังทอย...' : 'ทอยเต๋าของฉัน!'}</span>
                    </button>
                  ) : (
                    <div className="text-[11px] text-amber-400/80 font-bold px-2 py-1 rounded-lg bg-[rgb(var(--c-bg-deep))] border border-[rgb(var(--c-surface-2))]">
                      {isBot ? '🤖 กำลังทอย...' : '⏳ รอทอย'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions / Results */}
        <div className="relative z-10 pt-2 border-t border-[rgb(var(--c-surface-2))] flex flex-col gap-2">
          {allRolled ? (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 w-full rounded-2xl bg-amber-500/15 border border-yellow-500/40 text-center">
                <p className="text-xs sm:text-sm font-black text-yellow-300 flex items-center justify-center gap-1.5">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span>
                    ผู้ชนะลำดับ 1:{' '}
                    <strong className="text-white underline">{sortedPlayers[0]?.display_name}</strong>{' '}
                    ({rolls[sortedPlayers[0]?.id]?.total} แต้ม)
                  </span>
                </p>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  ระบบได้จัดลำดับการเดินและรายชื่อทางซ้ายมือตามแต้มเรียบร้อยแล้ว
                </p>
              </div>

              {isHost && (
                <button
                  type="button"
                  onClick={finalizeRollOrder}
                  className="wood-btn-gold px-6 py-3 rounded-2xl text-xs sm:text-sm font-black shadow-xl flex items-center gap-2 active:scale-95"
                >
                  <span>
                    เข้าสู่กระดาน เริ่มตาเดินคนแรก{' '}
                    {countdown !== null && countdown > 0 ? `(${countdown}s)` : ''}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {!isHost && (
                <p className="text-xs text-amber-300/80 font-bold animate-pulse">
                  กำลังนำเข้าสู่กระดานเกมใน {countdown !== null ? countdown : 3} วินาที...
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-amber-300/85 font-semibold text-left">
                {myRoll ? '✅ คุณทอยแล้ว รอเพื่อนคนอื่นทอยครบ...' : '👉 กดปุ่มทอยเต๋าของคุณเพื่อสุ่มแต้ม'}
              </span>

              {isHost && (
                <button
                  type="button"
                  onClick={handleRollForAll}
                  className="px-3 py-1.5 rounded-xl bg-[rgb(var(--c-surface-2))] hover:bg-[rgb(var(--c-surface-2))] border border-[rgb(var(--c-surface-3))] text-[11px] font-black text-amber-200 hover:text-[rgb(var(--c-ink))] shadow transition flex items-center gap-1 shrink-0"
                  title="ทอยให้ทุกคนอัตโนมัติทันที"
                >
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  <span>ทอยให้ทุกคนทันที</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
