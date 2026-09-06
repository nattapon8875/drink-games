import React from 'react';
import { Wine } from 'lucide-react';
import { clsx } from 'clsx';

interface DrinkCounterProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const DrinkCounter: React.FC<DrinkCounterProps> = ({
  count,
  size = 'md',
  className,
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <div
      className={clsx(
        'inline-flex items-center rounded-full wood-bar-track text-amber-200 font-black',
        sizeStyles[size],
        className
      )}
      title={`${count} ช็อต`}
    >
      <div className="p-0.5 rounded-full bg-rose-900/80 border border-rose-500/50 shadow-sm flex items-center justify-center">
        <Wine className={clsx(iconSizes[size], 'text-rose-300')} />
      </div>
      <span className="rpg-text-gold font-extrabold">{count}</span>
      <span className="text-[9px] text-amber-300/70 font-normal">ช็อต</span>
    </div>
  );
};
