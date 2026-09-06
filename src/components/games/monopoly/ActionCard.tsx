import React, { useState } from 'react';
import { MonopolyTileRecord, PlayerRecord } from '@/types/database';
import { Wine, Award, HelpCircle, ShieldCheck, CheckCircle, Sparkles, Dices, RotateCw, Timer, Play, RotateCcw } from 'lucide-react';
import { sfx } from '@/lib/sound';
import confetti from 'canvas-confetti';

interface ActionCardProps {
  isOpen: boolean;
  tile: MonopolyTileRecord;
  targetPlayer: PlayerRecord;
  isMyTurn: boolean;
  diceResult?: number;
  onComplete: (drankCount: number) => Promise<void>;
}

// 🪙 Interactive Coin Toss Component
const InteractiveCoinToss: React.FC<{
  isMyTurn: boolean;
  onFinished: (result: 'heads' | 'tails', won: boolean) => void;
}> = ({ isMyTurn, onFinished }) => {
  const [selectedSide, setSelectedSide] = useState<'heads' | 'tails' | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [coinResult, setCoinResult] = useState<'heads' | 'tails' | null>(null);
  const [rotationDegrees, setRotationDegrees] = useState(0);

  const flipCoin = () => {
    if (!isMyTurn || flipping || !selectedSide) return;

    setFlipping(true);
    setCoinResult(null);
    sfx.playCoinFlip();

    const result: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';
    const extraSpins = 6 + Math.floor(Math.random() * 3);
    const targetDeg = extraSpins * 360 + (result === 'tails' ? 180 : 0);
    setRotationDegrees((prev) => prev + targetDeg);

    setTimeout(() => {
      setCoinResult(result);
      setFlipping(false);

      const won = selectedSide === result;
      if (won) {
        sfx.playSuccess();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } else {
        sfx.playDrinkPenalty();
      }

      onFinished(result, won);
    }, 2200);
  };

  return (
    <div className="flex flex-col items-center w-full my-2 bg-[#250e03] border border-[#592607] rounded-2xl p-3 shadow-inner">
      <div className="text-xs font-black text-amber-300 mb-1 flex items-center gap-1.5">
        <span>🪙 มินิเกม: โยนเหรียญเสี่ยงทาย</span>
      </div>

      {/* 3D Flipping Coin */}
      <div className="relative w-24 h-24 [perspective:800px] my-2">
        <div
          className="w-full h-full relative transition-transform duration-[2200ms] [transform-style:preserve-3d] ease-out"
          style={{
            transform: `rotateY(${rotationDegrees}deg) ${flipping ? 'scale(1.15) translateY(-15px)' : 'scale(1) translateY(0)'}`,
          }}
        >
          {/* Heads (หัว) */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#996515] via-[#ffd700] to-[#fff8dc] border-4 border-[#b8860b] shadow-[0_8px_20px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-2px_4px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center [backface-visibility:hidden]">
            <div className="w-16 h-16 rounded-full border border-dashed border-[#855700] flex flex-col items-center justify-center bg-gradient-to-b from-[#ffdf00]/30 to-[#b8860b]/40">
              <span className="text-2xl filter drop-shadow">👑</span>
              <span className="text-[10px] font-black text-[#5c3c00] tracking-wider">หัว</span>
            </div>
          </div>

          {/* Tails (ก้อย) */}
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#8a5d1b] via-[#f3c853] to-[#fffae6] border-4 border-[#8c5717] shadow-[0_8px_20px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-2px_4px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center [backface-visibility:hidden]"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <div className="w-16 h-16 rounded-full border border-dashed border-[#693e03] flex flex-col items-center justify-center bg-gradient-to-b from-[#e6b800]/30 to-[#8c5717]/40">
              <span className="text-2xl filter drop-shadow">🍷</span>
              <span className="text-[10px] font-black text-[#4d2600] tracking-wider">ก้อย</span>
            </div>
          </div>
        </div>
      </div>

      {/* Choice Buttons */}
      {isMyTurn && !coinResult && (
        <div className="flex flex-col items-center gap-2 w-full mt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={flipping}
              onClick={() => setSelectedSide('heads')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs border-2 transition active:scale-95 ${
                selectedSide === 'heads'
                  ? 'bg-amber-400 border-yellow-200 text-[#3d2300] shadow-[0_0_10px_rgba(252,211,77,0.7)]'
                  : 'bg-[#361604] border-[#5e2b0c] text-amber-200/80 hover:text-white'
              }`}
            >
              👑 เลือก &quot;หัว&quot;
            </button>
            <button
              type="button"
              disabled={flipping}
              onClick={() => setSelectedSide('tails')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs border-2 transition active:scale-95 ${
                selectedSide === 'tails'
                  ? 'bg-amber-400 border-yellow-200 text-[#3d2300] shadow-[0_0_10px_rgba(252,211,77,0.7)]'
                  : 'bg-[#361604] border-[#5e2b0c] text-amber-200/80 hover:text-white'
              }`}
            >
              🍷 เลือก &quot;ก้อย&quot;
            </button>
          </div>

          <button
            type="button"
            onClick={flipCoin}
            disabled={!selectedSide || flipping}
            className="wood-btn-gold px-5 py-1.5 rounded-xl font-black text-xs shadow-md active:scale-95 transition disabled:opacity-40"
          >
            {flipping
              ? '🪙 เหรียญกำลังหมุน...'
              : !selectedSide
              ? '👈 เลือกหัวหรือก้อยก่อนกดโยน'
              : '🪙 โยนเหรียญเลย!'}
          </button>
        </div>
      )}

      {/* Result Display */}
      {coinResult && (
        <div
          className={`mt-2 px-3 py-1 rounded-xl text-xs font-black border ${
            selectedSide === coinResult
              ? 'bg-[#154721] border-emerald-400 text-emerald-100 shadow'
              : 'bg-[#52130a] border-rose-400 text-rose-100 shadow'
          }`}
        >
          {coinResult === 'heads' ? '👑 ออก "หัว"!' : '🍷 ออก "ก้อย"!'} —{' '}
          {selectedSide === coinResult ? '🎉 ทายถูก! รอดตัว!' : '💀 ทายผิด! ดื่ม 2 จิบ!'}
        </div>
      )}
    </div>
  );
};

// 🎲 Interactive Mini Dice Component
const InteractiveMiniDice: React.FC<{
  isMyTurn: boolean;
  tileTitle: string;
  onFinished: (roll: number) => void;
}> = ({ isMyTurn, tileTitle, onFinished }) => {
  const [rolling, setRolling] = useState(false);
  const [diceVal, setDiceVal] = useState<number | null>(null);

  const rollMiniDice = () => {
    if (!isMyTurn || rolling) return;

    setRolling(true);
    setDiceVal(null);
    sfx.playDiceRoll();

    let rollCount = 0;
    const interval = setInterval(() => {
      rollCount++;
      setDiceVal(Math.floor(Math.random() * 6) + 1);
      sfx.playDiceRoll();
      if (rollCount >= 10) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDiceVal(finalRoll);
        setRolling(false);
        sfx.playTileLand();
        onFinished(finalRoll);
      }
    }, 120);
  };

  const renderDots = (val: number) => {
    const dotsMap: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };
    const active = dotsMap[val] || [4];

    return (
      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-14 h-14 p-1.5 bg-gradient-to-b from-[#fffff5] via-[#f5eed6] to-[#e4d6ad] rounded-2xl border-2 border-b-4 border-[#8c6735] shadow-lg select-none">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-center justify-center">
            {active.includes(i) && (
              <span
                className={`rounded-full ${
                  val === 1
                    ? 'w-3 h-3 bg-red-600 shadow-inner'
                    : 'w-2 h-2 bg-[#261506] shadow-inner'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full my-2 bg-[#250e03] border border-[#592607] rounded-2xl p-3 shadow-inner">
      <div className="text-xs font-black text-amber-300 mb-1 flex items-center gap-1.5">
        <Dices className="w-4 h-4 text-yellow-400" />
        <span>มินิเกม: ทอยลูกเต๋าตัดสิน</span>
      </div>

      <div className="my-2 p-2 rounded-2xl bg-[#341404] border border-[#54240a] shadow-inner">
        <div className={rolling ? 'animate-spin' : ''}>
          {renderDots(diceVal ?? 1)}
        </div>
      </div>

      {isMyTurn && !diceVal && (
        <button
          type="button"
          onClick={rollMiniDice}
          disabled={rolling}
          className="wood-btn-gold px-5 py-1.5 rounded-xl font-black text-xs shadow-md active:scale-95 transition disabled:opacity-50"
        >
          {rolling ? '🎲 กำลังทอยลูกเต๋า...' : '🎲 กดทอยลูกเต๋ามินิเกม!'}
        </button>
      )}

      {diceVal !== null && (
        <div className="mt-2 px-3 py-1 rounded-xl text-xs font-black bg-[#154721] border border-emerald-400 text-emerald-100 shadow">
          {tileTitle.includes('ยืมมือเพื่อน') ? (
            diceVal % 2 === 0 ? (
              <span>🎲 ออกแต้ม {diceVal} (เลขคู่) — คนสั่งดื่ม 1 จิบ!</span>
            ) : (
              <span>🎲 ออกแต้ม {diceVal} (เลขคี่) — เพื่อนขวาต้องดื่ม 1 จิบ!</span>
            )
          ) : (
            <span>🎲 ออกแต้ม {diceVal}! ดื่มตามแต้ม {diceVal} วินาที!</span>
          )}
        </div>
      )}
    </div>
  );
};

// ⏱️ Interactive Countdown Timer Component (for 20s Word Guessing or speed challenges)
const InteractiveCountdownTimer: React.FC<{
  initialSeconds: number;
  isMyTurn: boolean;
  onTimeout?: () => void;
}> = ({ initialSeconds, isMyTurn, onTimeout }) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  React.useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer!);
            setIsRunning(false);
            setFinished(true);
            sfx.playDrinkPenalty();
            if (onTimeout) onTimeout();
            return 0;
          }
          if (prev <= 6) {
            sfx.playStep();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft, onTimeout]);

  const handleStart = () => {
    setTimeLeft(initialSeconds);
    setFinished(false);
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(initialSeconds);
    setFinished(false);
  };

  const percent = (timeLeft / initialSeconds) * 100;
  const isDanger = timeLeft <= 5;

  return (
    <div className="flex flex-col items-center w-full my-2 bg-[#250e03] border-2 border-[#592607] rounded-2xl p-3.5 shadow-inner">
      <div className="text-xs font-black text-amber-300 mb-2 flex items-center gap-1.5">
        <Timer className="w-4 h-4 text-amber-400" />
        <span>จับเวลาท้าทาย ({initialSeconds} วินาที)</span>
      </div>

      {/* Chunky Countdown Clock Face */}
      <div className="relative w-24 h-24 my-1 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="#3a1505"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke={isDanger ? '#ef4444' : '#f59e0b'}
            strokeWidth="8"
            fill="none"
            strokeDasharray="264"
            strokeDashoffset={264 - (264 * percent) / 100}
            strokeLinecap="round"
            className="transition-all duration-500 ease-linear"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <span
            className={`text-2xl font-black font-mono tracking-tight ${
              isDanger ? 'text-red-400 animate-ping' : 'text-amber-200'
            }`}
          >
            {timeLeft}s
          </span>
          <span className="text-[9px] font-bold text-amber-400/70">
            {isRunning ? 'กำลังจับเวลา' : finished ? 'หมดเวลา!' : 'พร้อม'}
          </span>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex items-center gap-2 mt-2">
        {!isRunning ? (
          <button
            type="button"
            onClick={handleStart}
            className="wood-btn-gold px-4 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{finished ? 'เริ่มจับเวลาใหม่' : 'กดเริ่มจับเวลา 20 วิ!'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleReset}
            className="wood-btn-brown px-3 py-1 rounded-xl font-bold text-xs flex items-center gap-1 text-amber-200 border border-[#522207]"
          >
            <RotateCcw className="w-3 h-3" />
            <span>รีเซ็ต</span>
          </button>
        )}
      </div>

      {finished && (
        <div className="mt-2 text-xs font-black text-rose-300 bg-red-950/80 border border-red-800 px-3 py-1 rounded-xl animate-bounce">
          ⏰ หมดเวลาแล้ว! ทายไม่ทันโดนเพียว 1 ช็อต!
        </div>
      )}
    </div>
  );
};

export const ActionCard: React.FC<ActionCardProps> = ({
  isOpen,
  tile,
  targetPlayer,
  isMyTurn,
  diceResult,
  onComplete,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [minigameDrinks, setMinigameDrinks] = useState<number | null>(null);

  if (!isOpen) return null;

  const isCoinGame =
    tile.title.includes('หัวก้อย') ||
    tile.action_text.includes('หัวก้อย') ||
    tile.action_text.includes('เหรียญ');

  const isDiceGame =
    tile.title.includes('ทอยเต๋า') ||
    tile.action_text.includes('ทอยเต๋า') ||
    tile.title.includes('แต้มเต๋า') ||
    tile.action_text.includes('ยืมมือเพื่อน');

  const isTimerGame =
    tile.action_text.includes('จับเวลา') ||
    tile.title.includes('ใบ้คำ') ||
    tile.action_text.includes('20 วินาที');

  const timerSeconds = tile.action_text.includes('20 วินาที') || tile.action_text.includes('20 วิ') ? 20 : 15;

  const handleAction = async (drankCount: number) => {
    setSubmitting(true);
    try {
      await onComplete(drankCount);
    } finally {
      setSubmitting(false);
    }
  };

  const getTileTypeMeta = (type: string) => {
    switch (type) {
      case 'drink':
        return {
          icon: <Wine className="w-9 h-9 text-red-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] animate-bounce" />,
          titleColor: 'rpg-text-gold',
          badgeBg: 'bg-[#5c1307] text-rose-200 border-[#852313]',
          label: '📜 คำสั่งบทลงโทษ / ดื่ม!',
          suggestedDrinks: tile.action_text.includes('2 ช็อต') || tile.action_text.includes('2 จิบ') ? 2 : 1,
        };
      case 'order_others':
        return {
          icon: <Award className="w-9 h-9 text-amber-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] animate-pulse" />,
          titleColor: 'rpg-text-gold',
          badgeBg: 'bg-[#6b3504] text-amber-200 border-[#944d08]',
          label: '📜 คำสั่งชี้เป้าคนอื่น!',
          suggestedDrinks: 0,
        };
      case 'challenge':
        return {
          icon: <HelpCircle className="w-9 h-9 text-purple-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] animate-bounce" />,
          titleColor: 'rpg-text-gold',
          badgeBg: 'bg-[#3b114d] text-purple-200 border-[#5e2079]',
          label: '📜 มินิเกมท้าทาย!',
          suggestedDrinks: 1,
        };
      default:
        return {
          icon: <ShieldCheck className="w-9 h-9 text-emerald-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] animate-pulse" />,
          titleColor: 'rpg-text-gold',
          badgeBg: 'bg-[#103a1d] text-emerald-200 border-[#1d6332]',
          label: '📜 โซนปลอดภัย / รอดตัว',
          suggestedDrinks: 0,
        };
    }
  };

  const meta = getTileTypeMeta(tile.tile_type);
  const effectiveDrinks = minigameDrinks !== null ? minigameDrinks : meta.suggestedDrinks;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      {/* Wooden Quest Window */}
      <div className="wood-panel rounded-3xl p-5 sm:p-6 w-full max-w-sm relative text-center shadow-[0_16px_36px_rgba(0,0,0,0.9)] max-h-[92vh] overflow-y-auto scrollbar-none">
        {/* 4 Corner Brass Rivets */}
        <div className="wood-rivet absolute top-3 left-3" />
        <div className="wood-rivet absolute top-3 right-3" />
        <div className="wood-rivet absolute bottom-3 left-3" />
        <div className="wood-rivet absolute bottom-3 right-3" />

        {/* Dice Result Badge */}
        {diceResult !== undefined && (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-yellow-400/60 bg-gradient-to-r from-amber-600 to-yellow-500 shadow-md mb-2">
            <span className="text-xs sm:text-sm font-black text-amber-950">
              🎲 ทอยได้แต้ม {diceResult}!
            </span>
          </div>
        )}

        {/* Top Header Plaque */}
        <div className="block">
          <div className="inline-block px-4 py-1 rounded-full border border-[#fcd34d]/40 bg-[#2d1104] shadow-inner mb-2">
            <span className="text-xs font-black tracking-wider text-amber-300">
              {meta.label}
            </span>
          </div>
        </div>

        {/* Icon Crest with Recessed Carving */}
        <div className="w-16 h-16 mx-auto my-2 rounded-2xl bg-[#321303] border-2 border-[#54250a] flex items-center justify-center shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)]">
          {meta.icon}
        </div>

        {/* Quest Title */}
        <h2 className="text-2xl font-black mt-1 rpg-text-gold">
          {tile.title}
        </h2>

        {/* Action text card / Parchment Box */}
        <div className="w-full bg-[#f4e7c5] text-[#361705] border-2 border-[#8c5720] rounded-2xl p-4 my-2 text-sm sm:text-base leading-relaxed shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.5)]">
          <p className="font-extrabold">{tile.action_text}</p>
        </div>

        {/* Interactive Minigame Embed on the Card */}
        {isCoinGame && (
          <InteractiveCoinToss
            isMyTurn={isMyTurn}
            onFinished={(_result, won) => {
              setMinigameDrinks(won ? 0 : 2);
            }}
          />
        )}

        {isDiceGame && (
          <InteractiveMiniDice
            isMyTurn={isMyTurn}
            tileTitle={tile.title + ' ' + tile.action_text}
            onFinished={(val) => {
              if (tile.action_text.includes('ยืมมือเพื่อน')) {
                setMinigameDrinks(val % 2 === 0 ? 1 : 0);
              } else {
                setMinigameDrinks(1);
              }
            }}
          />
        )}

        {isTimerGame && (
          <InteractiveCountdownTimer
            initialSeconds={timerSeconds}
            isMyTurn={isMyTurn}
            onTimeout={() => {
              setMinigameDrinks(1);
            }}
          />
        )}

        {/* Target player info ribbon */}
        <div className="inline-flex items-center gap-2 text-xs text-amber-100 bg-[#200a02] border border-[#522207] px-3 py-1.5 rounded-full shadow-inner my-2">
          <span className="text-amber-300/80">ผู้เล่นที่ตกช่องนี้:</span>
          <span className="font-black text-amber-200">{targetPlayer.display_name}</span>
        </div>

        {/* Interaction controls: Chunky 3D RPG Buttons */}
        {isMyTurn ? (
          <div className="flex flex-col gap-2.5 w-full mt-1">
            {effectiveDrinks > 0 ? (
              <>
                <button
                  onClick={() => handleAction(effectiveDrinks)}
                  disabled={submitting}
                  className="wood-btn-red w-full rounded-2xl py-3 text-base font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Wine className="w-5 h-5 text-rose-200" />
                  <span>
                    {submitting
                      ? 'กำลังบันทึก...'
                      : `จัดไป! ดื่มแล้ว (${effectiveDrinks} จิบ/ช็อต)`}
                  </span>
                </button>
                <button
                  onClick={() => handleAction(0)}
                  disabled={submitting}
                  className="wood-btn-gold w-full rounded-2xl py-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <span>ผ่าน</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => handleAction(0)}
                disabled={submitting}
                className="wood-btn-green w-full rounded-2xl py-3 text-base font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5 text-emerald-100" />
                <span>
                  {submitting ? 'กำลังส่งตา...' : 'ผ่าน (รอดตัว / ทำเสร็จแล้ว)'}
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="w-full p-3 rounded-2xl bg-[#220c02] border border-[#481c05] shadow-inner mt-1">
            <p className="text-xs text-amber-200/80 font-bold flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>
                กำลังรอดูว่า <b>{targetPlayer.display_name}</b> กำลังเล่นมินิเกม/ทำคำสั่ง...
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
