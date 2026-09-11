import React from 'react';

interface BuffaloLogoProps {
  className?: string;
  size?: number | string;
}

export const BuffaloLogo: React.FC<BuffaloLogoProps> = ({
  className = 'w-8 h-8',
  size,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden border border-yellow-500/40 shadow-inner ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <img
        src="/buffy-mascot.png"
        alt="Buffy Mascot"
        className="w-full h-full object-cover scale-110"
      />
    </div>
  );
};
