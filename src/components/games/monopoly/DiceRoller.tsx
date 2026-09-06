import React from 'react';
import { Dices } from 'lucide-react';
import { clsx } from 'clsx';

interface DiceRollerProps {
  isMyTurn: boolean;
  isRolling: boolean;
  diceResult: number;
  onRoll: () => void;
  disabled?: boolean;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({
  isMyTurn,
  isRolling,
  diceResult,
  onRoll,
  disabled = false,
}) => {
  // Dot pattern coordinates for dice 1-6
  const renderDots = (value: number) => {
    const dotsMap: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };

    const activeIndices = dotsMap[value] || [4];

    return (
      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-12 h-12 sm:w-16 sm:h-16 p-2 bg-gradient-to-b from-[#fffff2] via-[#f7f0d4] to-[#ded0a8] rounded-2xl border-x-2 border-t-2 border-b-[5px] border-[#8a6839] shadow-[0_8px_16px_rgba(0,0,0,0.7),inset_0_2px_2px_rgba(255,255,255,0.9)] select-none">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-center justify-center">
            {activeIndices.includes(i) && (
              <span
                className={clsx(
                  'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shadow-inner',
                  value === 1
                    ? 'bg-red-600 w-3 h-3 sm:w-3.5 sm:h-3.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]'
                    : 'bg-[#271505] shadow-[inset_0_1px_1px_rgba(0,0,0,0.8)]'
                )}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      {/* 3D Dice Cup / Rolling Plate */}
      <div className="p-3 rounded-2xl bg-[#321303] border-2 border-[#54250a] shadow-[inset_0_4px_8px_rgba(0,0,0,0.8),0_2px_4px_rgba(255,200,100,0.1)] relative">
        <div
          className={clsx(
            'transition-transform duration-300 transform',
            isRolling
              ? 'animate-spin scale-110'
              : 'hover:scale-105 active:scale-95'
          )}
        >
          {renderDots(diceResult)}
        </div>
      </div>

      {/* Chunky 3D Gold Action Roll Button */}
      {isMyTurn ? (
        <button
          onClick={onRoll}
          disabled={disabled || isRolling}
          className="wood-btn-gold rounded-2xl font-black text-sm sm:text-base px-5 sm:px-7 py-2.5 flex items-center gap-2 select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          <Dices className={clsx('w-5 h-5 text-amber-200 drop-shadow', isRolling && 'animate-spin')} />
          <span className="tracking-wide">{isRolling ? 'กำลังทอยเต๋า...' : 'ทอยลูกเต๋า!'}</span>
        </button>
      ) : (
        <div className="px-3 py-1 rounded-xl bg-[#220c02] border border-[#4d1f05] text-[11px] sm:text-xs text-amber-200/80 font-bold flex items-center gap-2 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>รอเพื่อนทอยเต๋า...</span>
        </div>
      )}
    </div>
  );
};
