'use client';

import React from 'react';
import { PlayerRecord } from '@/types/database';
import { PLAYER_COLORS } from '../monopoly/Board3D';
import { BuffaloLogo } from '@/components/common/BuffaloLogo';
import { Avatar } from '@/components/common/Avatar';

interface Bottle2DProps {
  players: PlayerRecord[];
  rotationAngle: number;
  isSpinning: boolean;
  selectedPlayerId: string | null;
  onSpinClick?: () => void;
  canSpin: boolean;
}

export const Bottle2D: React.FC<Bottle2DProps> = ({
  players,
  rotationAngle,
  isSpinning,
  selectedPlayerId,
  onSpinClick,
  canSpin,
}) => {
  const numPlayers = Math.max(players.length, 1);

  return (
    <div className="relative w-full max-w-[480px] aspect-square mx-auto flex items-center justify-center select-none">
      {/* Outer Glow & Tavern Table Mat */}
      <div className="absolute inset-2 rounded-full bg-gradient-to-b from-[#3d1e08] via-[#241004] to-[#140802] border-4 border-[#b47a32] shadow-[0_0_40px_rgba(217,119,6,0.3)] flex items-center justify-center overflow-hidden">
        {/* Wood ring textures */}
        <div className="absolute inset-4 rounded-full border border-amber-600/30 opacity-70" />
        <div className="absolute inset-10 rounded-full border border-amber-500/20 opacity-50" />
        <div className="absolute inset-16 rounded-full border border-amber-400/10 opacity-30" />
        
        {/* Subtle radial sheen */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.08)_0%,transparent_70%)] pointer-events-none" />

        {/* Center circular emblem */}
        <div className="absolute w-24 h-24 rounded-full border border-amber-500/40 bg-[#1e0e05]/80 shadow-inner flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full border border-amber-400/30 flex items-center justify-center opacity-40">
            <BuffaloLogo className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* Players around the circle */}
      {players.map((player, index) => {
        // Distribute players evenly around 360 degrees
        // Start from top (0 deg = -90 in standard math, so angle in rad = (index / N) * 2PI - PI/2)
        const angleDeg = (index / numPlayers) * 360;
        const angleRad = (angleDeg - 90) * (Math.PI / 180);
        
        // Calculate radius percentage (around 41% from center so it stays nicely inside bounds)
        const radiusPercent = 40;
        const x = 50 + radiusPercent * Math.cos(angleRad);
        const y = 50 + radiusPercent * Math.sin(angleRad);

        const isSelected = player.id === selectedPlayerId;
        const color = PLAYER_COLORS[index % PLAYER_COLORS.length];

        return (
          <div
            key={player.id}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`absolute flex flex-col items-center justify-center z-10 transition-all duration-300 ${
              isSelected ? 'scale-125 z-20' : 'hover:scale-110'
            }`}
          >
            {/* Player Avatar Bubble */}
            <div
              style={{ borderColor: isSelected ? '#fbbf24' : color }}
              className={`relative rounded-full transition-all duration-300 ${
                isSelected
                  ? 'ring-4 ring-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.9)] animate-pulse'
                  : ''
              }`}
            >
              <Avatar
                src={player.avatar_url}
                name={player.display_name}
                size="lg"
              />

              {/* Drinks badge if any */}
              {player.drinks_count > 0 && (
                <div className="absolute -bottom-1 -right-1 bg-neon-pink text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border border-black shadow z-20">
                  🍺 {player.drinks_count}
                </div>
              )}
            </div>

            {/* Player Name */}
            <div className="mt-1 px-2 py-0.5 rounded-md bg-black/75 border border-amber-500/30 text-[10px] md:text-xs font-bold text-gray-200 truncate max-w-[70px] text-center shadow">
              {player.display_name}
            </div>
          </div>
        );
      })}

      {/* Rotating Bottle Graphic */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div
          style={{
            transform: `rotate(${rotationAngle}deg)`,
            transformOrigin: '50% 50%',
            transition: isSpinning
              ? 'transform 3.2s cubic-bezier(0.12, 0.8, 0.15, 1)'
              : 'transform 0.5s ease-out',
          }}
        >
          {/* Bottle SVG Illustration */}
          <div className="relative flex flex-col items-center justify-center w-28 h-56 md:w-32 md:h-64 drop-shadow-[0_15px_20px_rgba(0,0,0,0.8)]">
          {/* Top Indicator Arrow Glow */}
          <div className="absolute -top-3 w-4 h-4 rotate-45 bg-amber-400 border border-white shadow-[0_0_12px_#fbbf24] animate-bounce" />

          {/* SVG Vector Bottle */}
          <svg
            viewBox="0 0 100 240"
            className="w-full h-full filter drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]"
          >
            {/* Bottle Shadow */}
            <ellipse cx="50" cy="225" rx="28" ry="8" fill="rgba(0,0,0,0.4)" />

            {/* Main Bottle Body (Emerald Glass / Dark Amber) */}
            <path
              d="M 38,10 
                 L 62,10 
                 L 62,20 
                 C 62,35 60,65 60,75 
                 C 60,85 74,105 76,125 
                 L 76,215 
                 C 76,225 68,230 50,230 
                 C 32,230 24,225 24,215 
                 L 24,125 
                 C 26,105 40,85 40,75 
                 C 40,65 38,35 38,20 
                 Z"
              fill="url(#bottleGlassGradient)"
              stroke="#0f3e23"
              strokeWidth="2.5"
            />

            {/* Bottle Shoulder & Specular Highlights */}
            <path
              d="M 33,125 C 33,105 43,85 43,75 L 43,25 L 47,25 L 47,75 C 47,85 36,105 35,125 L 35,215 C 35,220 33,220 32,215 Z"
              fill="rgba(255, 255, 255, 0.35)"
            />

            {/* Bottle Label */}
            <rect
              x="25"
              y="135"
              width="50"
              height="55"
              rx="4"
              fill="#fffbeb"
              stroke="#b45309"
              strokeWidth="1.5"
            />
            <rect
              x="28"
              y="138"
              width="44"
              height="49"
              rx="2"
              fill="#fef3c7"
            />
            {/* Buffy text on label */}
            <text
              x="50"
              y="155"
              textAnchor="middle"
              fontSize="9"
              fontWeight="900"
              fill="#78350f"
              fontFamily="sans-serif"
            >
              BUFFY
            </text>
            <text
              x="50"
              y="168"
              textAnchor="middle"
              fontSize="7"
              fontWeight="bold"
              fill="#b45309"
              fontFamily="sans-serif"
            >
              DRINK 🐃
            </text>
            <circle cx="50" cy="178" r="3.5" fill="#d97706" />

            {/* Bottle Gold Cap / Cork */}
            <rect
              x="42"
              y="4"
              width="16"
              height="8"
              rx="2"
              fill="url(#goldCapGradient)"
              stroke="#78350f"
              strokeWidth="1"
            />

            {/* Defs for gradients */}
            <defs>
              <linearGradient id="bottleGlassGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#042f1a" />
                <stop offset="30%" stopColor="#065f46" />
                <stop offset="60%" stopColor="#047857" />
                <stop offset="85%" stopColor="#065f46" />
                <stop offset="100%" stopColor="#022c17" />
              </linearGradient>

              <linearGradient id="goldCapGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="50%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        </div>
      </div>

      {/* Center Spin Hitbox / Button if idle & allowed */}
      {canSpin && !isSpinning && onSpinClick && (
        <button
          onClick={onSpinClick}
          className="absolute z-30 w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-900 font-black text-xs shadow-[0_0_20px_rgba(245,158,11,0.8)] border-2 border-white/60 hover:scale-110 active:scale-95 transition-all flex flex-col items-center justify-center animate-pulse"
        >
          <span>หมุน</span>
          <span className="text-[10px]">SPIN</span>
        </button>
      )}
    </div>
  );
};
