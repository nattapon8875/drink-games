'use client';

import React, { useRef, useEffect } from 'react';
import { WheelItem } from './wheelData';

interface WheelCanvasProps {
  items: WheelItem[];
  rotationAngle: number;
  isSpinning: boolean;
  onSpinClick?: () => void;
  canSpin: boolean;
}

export const WheelCanvas: React.FC<WheelCanvasProps> = ({
  items,
  rotationAngle,
  isSpinning,
  onSpinClick,
  canSpin,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeItems = items.filter((item) => item.enabled);

  // Render the 2D Canvas Wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina support (DPR 2)
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2;
    const size = 500;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 24; // Padding for outer wooden bezel
    const numSlices = Math.max(activeItems.length, 1);
    const sliceAngle = (2 * Math.PI) / numSlices;

    ctx.clearRect(0, 0, size, size);

    // 1. Draw Outer Heavy Wooden Frame / Bezel
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 20, 0, 2 * Math.PI);
    const outerWoodGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      radius - 10,
      centerX,
      centerY,
      radius + 20
    );
    outerWoodGradient.addColorStop(0, '#5a250a');
    outerWoodGradient.addColorStop(0.5, '#3b1704');
    outerWoodGradient.addColorStop(1, '#1e0a02');
    ctx.fillStyle = outerWoodGradient;
    ctx.fill();

    // Outer Gold Rim Border
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#d97706';
    ctx.stroke();

    // Inner Gold Bezel Ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4, 0, 2 * Math.PI);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fef08a';
    ctx.stroke();

    // Draw Gold Rivets around the Wooden Frame
    const rivetCount = Math.max(numSlices * 2, 16);
    for (let i = 0; i < rivetCount; i++) {
      const angle = (i * 2 * Math.PI) / rivetCount;
      const rivetX = centerX + (radius + 12) * Math.cos(angle);
      const rivetY = centerY + (radius + 12) * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(rivetX, rivetY, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#78350f';
      ctx.stroke();
    }
    ctx.restore();

    // 2. Draw Wheel Slices
    activeItems.forEach((item, index) => {
      const startAngle = index * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      // Slice background
      ctx.fillStyle = item.color;
      ctx.fill();

      // Slice divider border with inner highlight
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#fbbf24';
      ctx.stroke();

      // Subtle slice gradient overlay (shadow towards center)
      const sliceGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.2,
        centerX,
        centerY,
        radius
      );
      sliceGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
      sliceGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.05)');
      sliceGrad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
      ctx.fillStyle = sliceGrad;
      ctx.fill();

      // Draw Item Text & Action Badge
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);

      // Text styling
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px "Prompt", sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // Truncate long text if necessary
      const displayText = item.text.length > 18 ? item.text.slice(0, 17) + '…' : item.text;
      ctx.fillText(displayText, radius - 24, 0);

      // Mini drink indicator
      if (item.drinkCount > 0) {
        ctx.font = '12px "Prompt", sans-serif';
        ctx.fillStyle = '#fde68a';
        ctx.fillText(item.drinkCount === 4 ? '🍾' : `🍺 ${item.drinkCount}`, radius - 160, 0);
      }

      ctx.restore();
      ctx.restore();
    });

    // 3. Center Hub / Golden Boss Medallion
    ctx.save();
    // Shadow under central hub
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    ctx.beginPath();
    ctx.arc(centerX, centerY, 46, 0, 2 * Math.PI);
    const hubGradient = ctx.createRadialGradient(
      centerX - 10,
      centerY - 10,
      4,
      centerX,
      centerY,
      46
    );
    hubGradient.addColorStop(0, '#fef08a'); // Bright gold
    hubGradient.addColorStop(0.4, '#f59e0b'); // Amber gold
    hubGradient.addColorStop(0.8, '#b45309'); // Dark gold
    hubGradient.addColorStop(1, '#451a03'); // Wooden deep ring
    ctx.fillStyle = hubGradient;
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fef3c7';
    ctx.stroke();

    // Inner ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, 36, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#78350f';
    ctx.stroke();

    // Hub Symbol / Icon
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#451a03';
    ctx.fillText('🍻', centerX, centerY);

    ctx.restore();
  }, [activeItems]);

  return (
    <div className="relative w-full max-w-[420px] sm:max-w-[460px] aspect-square mx-auto flex items-center justify-center select-none py-2">
      {/* 📍 Golden Arrow Needle at TOP (12 o'clock pointing down) */}
      <div className="absolute -top-3 z-30 flex flex-col items-center pointer-events-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]">
        {/* Needle Top Shield */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-800 border-2 border-yellow-100 flex items-center justify-center shadow-lg">
          <div className="w-4 h-4 rounded-full bg-red-600 border border-amber-200 shadow-inner" />
        </div>
        {/* Downward pointing triangle arrow */}
        <div
          className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[26px] border-t-amber-500 -mt-2"
          style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }}
        />
      </div>

      {/* 🎡 Rotating Canvas Wheel with Smooth Cubic Deceleration */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-[4000ms]"
        style={{
          transform: `rotate(${rotationAngle}deg)`,
          transitionTimingFunction: 'cubic-bezier(0.15, 0.9, 0.2, 1)',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%' }}
          className="rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.85)]"
        />
      </div>

      {/* Center Interactive Button / Overlay for drawing/spinning */}
      <button
        type="button"
        onClick={onSpinClick}
        disabled={!canSpin || isSpinning}
        className={`absolute z-20 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center text-center transition-transform active:scale-95 ${
          isSpinning
            ? 'cursor-not-allowed opacity-90 scale-100 animate-pulse'
            : canSpin
            ? 'cursor-pointer hover:scale-105 shadow-[0_0_25px_rgba(245,158,11,0.8)]'
            : 'cursor-not-allowed opacity-80'
        }`}
        title={canSpin ? 'กดเพื่อหมุนวงล้อ!' : 'รอก่อน...'}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-b from-[#854d0e] via-[#54240a] to-[#270e02] border-4 border-amber-400 p-1 flex flex-col items-center justify-center shadow-2xl">
          <span className="text-xl sm:text-2xl drop-shadow">🎡</span>
          <span className="text-[11px] sm:text-xs font-black text-amber-200 tracking-wider mt-0.5">
            {isSpinning ? 'กำลังหมุน' : canSpin ? 'หมุนเลย!' : 'รอก่อน'}
          </span>
        </div>
      </button>
    </div>
  );
};
