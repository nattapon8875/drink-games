'use client';

import React, { useState } from 'react';
import { PlayingCard, SUIT_SYMBOLS } from './doraemonCardData';

interface CardCircleProps {
  remainingCards: PlayingCard[];
  lastDrawnCard: PlayingCard | null;
  isDrawing: boolean;
  canDraw: boolean;
  onDrawCard: () => void;
  ruleTitle?: string;
  ruleIcon?: string;
}

export const CardCircle: React.FC<CardCircleProps> = ({
  remainingCards,
  lastDrawnCard,
  isDrawing,
  canDraw,
  onDrawCard,
  ruleTitle,
  ruleIcon,
}) => {
  const totalCards = remainingCards.length;

  // We display around 36 card backs evenly distributed in a ring to simulate a rich full circle deck
  const displayCount = Math.min(totalCards, 32);

  return (
    <div className="relative w-full max-w-[460px] aspect-square mx-auto flex items-center justify-center select-none py-2">
      {/* Outer Wooden Tavern Mat */}
      <div className="absolute inset-2 rounded-full bg-gradient-to-b from-[#3d1e08] via-[#241004] to-[#140802] border-4 border-[#b47a32] shadow-[0_0_50px_rgba(217,119,6,0.35)] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-6 rounded-full border border-amber-600/30 opacity-70 pointer-events-none" />
        <div className="absolute inset-14 rounded-full border border-amber-500/20 opacity-50 pointer-events-none" />
        <div className="absolute inset-24 rounded-full border border-amber-400/10 opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.12)_0%,transparent_70%)] pointer-events-none" />
      </div>

      {/* Ring of Face-down Cards spread around circle */}
      {Array.from({ length: displayCount }).map((_, i) => {
        const angleDeg = (i / displayCount) * 360;
        const angleRad = (angleDeg * Math.PI) / 180;
        const radiusPercent = 37;
        const x = 50 + radiusPercent * Math.cos(angleRad);
        const y = 50 + radiusPercent * Math.sin(angleRad);

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              transform: `translate(-50%, -50%) rotate(${angleDeg + 90}deg)`,
            }}
            className="w-12 h-18 sm:w-14 sm:h-22 rounded-xl bg-gradient-to-br from-[#7f1d1d] via-[#991b1b] to-[#450a0a] border-2 border-amber-400/80 shadow-[0_4px_10px_rgba(0,0,0,0.8)] flex items-center justify-center pointer-events-none overflow-hidden"
          >
            {/* Ornate Card Back Pattern */}
            <div className="w-full h-full p-1 flex items-center justify-center">
              <div className="w-full h-full border border-amber-400/40 rounded-lg flex items-center justify-center bg-[radial-gradient(ellipse_at_center,#b91c1c_0%,#450a0a_100%)]">
                <span className="text-amber-200 text-xs sm:text-sm font-black opacity-60">⚜️</span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Center Deck Stack & Drawn Card Animation Anchor */}
      <div className="relative z-20 flex flex-col items-center justify-center">
        {totalCards > 0 ? (
          <button
            onClick={onDrawCard}
            disabled={!canDraw || isDrawing}
            className={`group relative flex flex-col items-center justify-center w-28 h-40 sm:w-32 sm:h-44 rounded-2xl transition-all duration-300 ${
              isDrawing
                ? 'scale-105 animate-pulse'
                : canDraw
                ? 'hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_30px_rgba(245,158,11,0.6)]'
                : 'cursor-not-allowed opacity-90'
            }`}
          >
            {/* Stack Thickness Shadow Layers */}
            <div className="absolute inset-0 translate-x-1.5 translate-y-2 rounded-2xl bg-[#3f0f0f] border-2 border-amber-900/60 -z-10" />
            <div className="absolute inset-0 translate-x-3 translate-y-4 rounded-2xl bg-[#260a0a] border-2 border-amber-950/80 -z-20 shadow-2xl" />

            {/* Top Deck Card */}
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#881337] via-[#9f1239] to-[#4c0519] border-2 border-amber-300 p-2 flex flex-col items-center justify-between shadow-xl relative overflow-hidden">
              {/* Gold Filigree Corner Ornaments */}
              <div className="absolute top-1 left-1 text-[10px] text-amber-300">♦</div>
              <div className="absolute top-1 right-1 text-[10px] text-amber-300">♦</div>
              <div className="absolute bottom-1 left-1 text-[10px] text-amber-300">♦</div>
              <div className="absolute bottom-1 right-1 text-[10px] text-amber-300">♦</div>

              <div className="text-[10px] font-black tracking-widest text-amber-200 uppercase mt-1">
                Doraemon
              </div>

              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/40 border border-amber-400/50 flex flex-col items-center justify-center shadow-inner">
                <span className="text-2xl sm:text-3xl">🃏</span>
                <span className="text-[10px] text-amber-300 font-bold mt-0.5">
                  {totalCards} ใบ
                </span>
              </div>

              <div className="text-[10px] sm:text-xs font-black text-amber-200 bg-black/50 px-2 py-0.5 rounded-full border border-amber-400/30">
                {canDraw ? 'แตะจั่วไพ่!' : 'รอก่อน...'}
              </div>
            </div>
          </button>
        ) : (
          <div className="w-28 h-40 rounded-2xl border-2 border-dashed border-amber-600/50 flex flex-col items-center justify-center text-center p-3 bg-black/40">
            <span className="text-2xl mb-1">🎉</span>
            <span className="text-xs font-black text-amber-200">ไพ่หมดสำรับ!</span>
          </div>
        )}

        {/* Drawn Card Floating Pop Effect */}
        {lastDrawnCard && (
          <div
            className={`absolute -top-10 sm:-top-14 z-30 transition-all duration-500 ${
              isDrawing
                ? 'scale-125 -translate-y-8 rotate-3 shadow-[0_0_40px_rgba(245,158,11,0.9)] animate-bounce'
                : 'scale-90 translate-y-0 rotate-0 opacity-80'
            }`}
          >
            <div className="w-24 h-36 sm:w-28 sm:h-40 rounded-xl bg-white border-2 border-amber-400 shadow-2xl flex flex-col justify-between p-2">
              <div
                className="text-left font-black text-lg leading-none"
                style={{ color: SUIT_SYMBOLS[lastDrawnCard.suit].color }}
              >
                <div>{lastDrawnCard.value}</div>
                <div className="text-sm">{SUIT_SYMBOLS[lastDrawnCard.suit].symbol}</div>
              </div>
              <div className="text-center text-3xl">{ruleIcon || '🍺'}</div>
              <div
                className="text-right font-black text-lg leading-none rotate-180"
                style={{ color: SUIT_SYMBOLS[lastDrawnCard.suit].color }}
              >
                <div>{lastDrawnCard.value}</div>
                <div className="text-sm">{SUIT_SYMBOLS[lastDrawnCard.suit].symbol}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
