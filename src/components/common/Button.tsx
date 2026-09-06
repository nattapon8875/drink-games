import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'wood-gold' | 'wood-brown' | 'wood-red' | 'wood-green' | 'neon-pink' | 'neon-cyan' | 'neon-purple' | 'neon-yellow' | 'neon-green' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  glow?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'wood-gold',
  size = 'md',
  fullWidth = false,
  glow = true,
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-black rounded-2xl select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none transition-all duration-100';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm sm:text-base',
    lg: 'px-6 py-3.5 text-base sm:text-lg',
  };

  const variantStyles = {
    // 1. Fantasy RPG Wood & Gold Buttons (Reference Image Style)
    'wood-gold': 'wood-btn-gold',
    'wood-brown': 'wood-btn-brown',
    'wood-red': 'wood-btn-red',
    'wood-green': 'wood-btn-green',

    // Fallbacks mapped gracefully to RPG or Neon
    'neon-pink': 'wood-btn-gold',
    'neon-cyan': 'wood-btn-green',
    'neon-purple': 'wood-btn-brown',
    'neon-yellow': 'wood-btn-gold',
    'neon-green': 'wood-btn-green',
    ghost: 'bg-transparent text-amber-200/80 hover:text-white hover:bg-black/30 border border-transparent',
    glass: 'bg-[#2a1104]/80 backdrop-blur-md text-amber-100 border border-[#522207] hover:border-[#823a0d] shadow-sm',
  };

  return (
    <button
      className={twMerge(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
