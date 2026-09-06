'use client';

import React, { useMemo } from 'react';
import { PlayerRecord } from '@/types/database';
import { generateCrocodileTeeth, ToothInfo } from './crocodileData';

interface Crocodile2DProps {
  players: PlayerRecord[];
  totalTeeth?: number;
  currentTurnPlayerId?: string | null;
  pressedTeeth: number[];
  isBitten: boolean;
  onToothClick?: (index: number) => void;
  canInteract: boolean;
}

export const Crocodile2D: React.FC<Crocodile2DProps> = ({
  players,
  totalTeeth = 10,
  currentTurnPlayerId,
  pressedTeeth,
  isBitten,
  onToothClick,
  canInteract,
}) => {
  const teethList = useMemo(() => generateCrocodileTeeth(totalTeeth), [totalTeeth]);

  return (
    <div className="relative w-full max-w-[420px] aspect-[9/13] mx-auto flex flex-col items-center justify-between p-3 select-none rounded-3xl bg-[#1e1008] border-2 border-amber-900/60 shadow-2xl overflow-hidden">
      {/* Wood plank texture backdrop */}
      <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(90deg,#000_0px,#000_40px,#222_41px,#222_42px)] pointer-events-none" />

      {/* Header Info */}
      <div className="relative z-10 w-full flex justify-between items-center px-2 pt-1 text-xs font-bold text-amber-200">
        <span className="bg-black/60 px-3 py-1 rounded-full border border-amber-800/40">
          🐃 น้องควายงับนิ้ว
        </span>
        <span className="bg-black/60 px-3 py-1 rounded-full border border-amber-800/40">
          กดแล้ว: {pressedTeeth.length} / {totalTeeth} ซี่
        </span>
      </div>

      {/* Main Toy Body Container */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center my-1">
        <div className="relative w-[320px] h-[440px] flex flex-col items-center">
          {/* Buffalo Giant Horns (Curving outward and upward) */}
          <div className="absolute -top-6 inset-x-0 flex justify-between px-2 z-10 pointer-events-none">
            {/* Left Curved Horn */}
            <div className="relative w-24 h-20 -rotate-12">
              <div className="w-20 h-20 rounded-tl-[80px] rounded-br-[20px] border-t-8 border-l-8 border-[#0f172a] bg-gradient-to-br from-[#1e293b] to-[#334155] shadow-lg" />
              {/* Golden Ring on Horn */}
              <div className="absolute top-5 left-7 w-3 h-5 border-2 border-yellow-400 bg-yellow-500/40 rounded-full rotate-45" />
            </div>
            {/* Right Curved Horn */}
            <div className="relative w-24 h-20 rotate-12 flex justify-end">
              <div className="w-20 h-20 rounded-tr-[80px] rounded-bl-[20px] border-t-8 border-r-8 border-[#0f172a] bg-gradient-to-bl from-[#1e293b] to-[#334155] shadow-lg" />
              {/* Golden Ring on Horn */}
              <div className="absolute top-5 right-7 w-3 h-5 border-2 border-yellow-400 bg-yellow-500/40 rounded-full -rotate-45" />
            </div>
          </div>

          {/* Top Head (Upper Jaw with cartoon Buffalo design) */}
          <div
            className={
              'relative w-[250px] h-[225px] rounded-t-[100px] rounded-b-[45px] bg-gradient-to-b from-[#334155] via-[#1e293b] to-[#0f172a] border-4 border-[#0f172a] shadow-xl flex flex-col items-center pt-3 transition-all duration-300 z-20 ' +
              (isBitten ? 'translate-y-20 scale-y-95' : 'translate-y-0')
            }
          >
            {/* Cute Buffalo Ears on sides */}
            <div className="absolute -left-7 top-14 w-10 h-7 rounded-[50%] bg-[#334155] border-2 border-[#0f172a] shadow -rotate-45 flex items-center justify-center">
              <div className="w-6 h-3 rounded-[50%] bg-[#fed7aa]" />
            </div>
            <div className="absolute -right-7 top-14 w-10 h-7 rounded-[50%] bg-[#334155] border-2 border-[#0f172a] shadow rotate-45 flex items-center justify-center">
              <div className="w-6 h-3 rounded-[50%] bg-[#fed7aa]" />
            </div>

            {/* Forehead Hair Fluff */}
            <div className="flex gap-1 -mt-2">
              <div className="w-4 h-4 rounded-full bg-[#0f172a]" />
              <div className="w-5 h-5 rounded-full bg-[#0f172a] -mt-1" />
              <div className="w-4 h-4 rounded-full bg-[#0f172a]" />
            </div>

            {/* Large Expressive Cartoon Eyes */}
            <div className="flex gap-6 items-center mt-2">
              {/* Left Eye */}
              <div className="relative w-12 h-14 rounded-[50%] bg-white border-2 border-[#0f172a] shadow-md flex items-center justify-center overflow-hidden">
                <div
                  className={
                    'w-7 h-9 rounded-[50%] flex items-center justify-center transition-colors relative ' +
                    (isBitten ? 'bg-rose-600' : 'bg-[#0f172a]')
                  }
                >
                  {/* Catchlights */}
                  <div className="absolute top-1.5 left-1.5 w-2 h-2.5 rounded-full bg-white" />
                  <div className="absolute bottom-1.5 right-1.5 w-1 h-1.5 rounded-full bg-white" />
                </div>
              </div>

              {/* Right Eye */}
              <div className="relative w-12 h-14 rounded-[50%] bg-white border-2 border-[#0f172a] shadow-md flex items-center justify-center overflow-hidden">
                <div
                  className={
                    'w-7 h-9 rounded-[50%] flex items-center justify-center transition-colors relative ' +
                    (isBitten ? 'bg-rose-600' : 'bg-[#0f172a]')
                  }
                >
                  {/* Catchlights */}
                  <div className="absolute top-1.5 left-1.5 w-2 h-2.5 rounded-full bg-white" />
                  <div className="absolute bottom-1.5 right-1.5 w-1 h-1.5 rounded-full bg-white" />
                </div>
              </div>
            </div>

            {/* Broad Tan Buffalo Snout with Golden Ring */}
            <div className="mt-2 w-[180px] h-[85px] rounded-[40px] bg-gradient-to-b from-[#fed7aa] to-[#fdba74] border-2 border-amber-900/40 shadow-inner flex flex-col items-center justify-center relative">
              {/* Nostrils */}
              <div className="flex gap-10 mt-1">
                <div className="w-5 h-6 rounded-full bg-[#431407] shadow-inner" />
                <div className="w-5 h-6 rounded-full bg-[#431407] shadow-inner" />
              </div>

              {/* Golden Buffalo Nose Ring! 🐃💍 */}
              <div className="absolute -bottom-3 w-10 h-10 rounded-full border-4 border-yellow-400 bg-yellow-400/20 shadow-md flex items-center justify-center" />
            </div>
          </div>

          {/* Lower Jaw & Mouth Cavity (Buffalo Underbelly style) */}
          <div
            className={
              'relative w-[270px] h-[230px] -mt-6 rounded-b-[100px] rounded-t-[40px] bg-[#334155] border-4 border-[#0f172a] shadow-2xl flex flex-col items-center justify-between p-3 pt-8 overflow-hidden transition-all duration-300 ' +
              (isBitten ? 'border-rose-600 bg-stone-900' : '')
            }
          >
            {/* Deep Red Inside Mouth Throat & Tongue */}
            <div className="w-[210px] h-[120px] rounded-[50px] bg-gradient-to-b from-[#4c0519] via-[#881337] to-[#be123c] shadow-inner flex items-center justify-center border-2 border-rose-950">
              {isBitten ? (
                <span className="text-2xl font-black text-white animate-bounce">
                  💥 งับบบบ!
                </span>
              ) : (
                <div className="w-24 h-12 rounded-full bg-rose-500/80 shadow-md" />
              )}
            </div>

            {/* Teeth Layout: Upright vertical bars with equal horizontal spacing along mouth curve */}
            <div className="relative w-[240px] h-16 -mt-2">
              {teethList.map((tooth: ToothInfo, idx: number) => {
                const isPressed = pressedTeeth.includes(tooth.index);
                const count = teethList.length;
                
                // Equal horizontal spacing across 210px width
                const startX = 15;
                const totalWidth = 210;
                const step = count > 1 ? totalWidth / (count - 1) : 0;
                const posX = startX + idx * step;

                // Normalized position: -1 (left edge) to 0 (center) to 1 (right edge)
                const normX = count > 1 ? (idx / (count - 1)) * 2 - 1 : 0;

                // Arch upward: center (normX = 0) is highest up (lowest posY), edges (normX = ±1) dip down
                // Wait, in screen coordinates, smaller posY is UP, larger posY is DOWN.
                // In the current image, center teeth have posY=10 (HIGHER on screen) and edges have posY=28 (LOWER on screen), creating a frown ∩.
                // Arch upward curve (U-shape): center dips down, edges curve up
                const arcHeight = 45;
                const posY = 6 + (1 - normX * normX) * arcHeight;

                // When pressed: tooth sinks down vertically into gum
                let toothStyle = 'w-[15px] h-9 bg-white shadow-sm';
                if (isPressed) {
                  toothStyle = 'w-[14px] h-6 bg-stone-300 shadow-inner cursor-not-allowed opacity-75';
                } else if (canInteract && !isBitten) {
                  toothStyle = 'w-[15px] h-9 bg-gradient-to-b from-white to-slate-100 hover:h-10 hover:bg-yellow-50 shadow-md cursor-pointer active:scale-95';
                }

                return (
                  <button
                    key={tooth.index}
                    type="button"
                    disabled={isPressed || !canInteract || isBitten}
                    onClick={() => onToothClick && onToothClick(tooth.index)}
                    style={{
                      left: `${posX}px`,
                      top: `${posY}px`,
                      transform: `translate(-50%, -50%) ${isPressed ? 'translateY(10px) scale(0.9)' : ''}`,
                    }}
                    className={'absolute rounded-t-md rounded-b-sm border-2 border-black flex flex-col items-center justify-end pb-1 transition-all duration-200 ' + toothStyle}
                    title={'ฟันซี่ที่ ' + (idx + 1)}
                  >
                    {isPressed ? (
                      <div className="w-1.5 h-1 rounded-full bg-stone-500 mb-0.5" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-300 mb-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="relative z-10 w-full text-center pb-1">
        <span className="text-xs font-black text-amber-200 bg-[#2b1104] px-4 py-1.5 rounded-full border border-[#522108] shadow">
          {isBitten
            ? '💥 น้องควายงับมือแล้ว! แตะเริ่มรอบใหม่'
            : canInteract
            ? '👆 แตะเลือกซี่ฟันน้องควายเพื่อเสี่ยงดวง!'
            : '⏳ กำลังรอเพื่อนกดฟัน...'}
        </span>
      </div>
    </div>
  );
};
