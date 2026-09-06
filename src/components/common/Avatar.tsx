import React from 'react';
import { clsx } from 'clsx';
import { PlatformType } from '@/lib/platforms/types';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  platform?: PlatformType;
  isTurn?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  platform,
  isTurn = false,
  className,
}) => {
  const sizeMap = {
    xs: 'w-6 h-6 text-[9px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  };

  const pixelMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  };

  const platformBadge = {
    line: 'bg-[#06C755] text-white',
    discord: 'bg-[#5865F2] text-white',
    web: 'bg-neon-pink text-white',
  };

  const initials = name ? name.substring(0, 2).toUpperCase() : '??';

  return (
    <div
      className={clsx('relative inline-flex flex-shrink-0', className)}
      style={{ width: pixelMap[size], height: pixelMap[size] }}
    >
      {/* RPG Golden Ribbon Crown if it's player's turn */}
      {isTurn && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 px-1 py-0.2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-[8px] font-black text-[#3a1503] shadow-md border border-amber-200 animate-bounce">
          👑ตาคุณ
        </span>
      )}

      <div
        className={clsx(
          'rounded-full overflow-hidden flex items-center justify-center font-bold transition-all duration-300 w-full h-full',
          sizeMap[size],
          isTurn
            ? 'bg-[#3d1806] border-2 border-yellow-300 ring-4 ring-yellow-400/40 shadow-[0_0_15px_rgba(252,211,77,0.7)] scale-105'
            : 'bg-[#291104] border-2 border-[#57270b]'
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name}
            width={pixelMap[size]}
            height={pixelMap[size]}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-amber-200 font-black">{initials}</span>
        )}
      </div>

      {platform && (
        <span
          className={clsx(
            'absolute -bottom-1 -right-1 rounded-full px-1 py-0.5 text-[9px] font-black uppercase shadow-md flex items-center justify-center',
            platformBadge[platform]
          )}
          title={`Platform: ${platform}`}
        >
          {platform === 'line' ? 'LINE' : platform === 'discord' ? 'DC' : 'WEB'}
        </span>
      )}
    </div>
  );
};
