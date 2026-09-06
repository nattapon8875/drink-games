import React, { useEffect } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  className,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div
        className={clsx(
          'relative w-full max-w-md rpg-dialog-box rounded-3xl p-5 sm:p-6 text-white overflow-hidden',
          className
        )}
      >
        {/* Ornate Gold Corner Accents (Reference Image Style) */}
        <div className="rpg-corner-gold rpg-corner-tl" />
        <div className="rpg-corner-gold rpg-corner-tr" />
        <div className="rpg-corner-gold rpg-corner-bl" />
        <div className="rpg-corner-gold rpg-corner-br" />

        {/* Corner Brass Rivets */}
        <div className="wood-rivet absolute top-2.5 left-2.5" />
        <div className="wood-rivet absolute top-2.5 right-2.5" />
        <div className="wood-rivet absolute bottom-2.5 left-2.5" />
        <div className="wood-rivet absolute bottom-2.5 right-2.5" />

        <div className="relative z-10">
          {/* Header Plaque / Scroll Banner */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#5e2802]">
            {title && (
              <div className="rpg-scroll-banner px-4 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-black tracking-wide uppercase">
                  {title}
                </span>
              </div>
            )}
            {showCloseButton && onClose && (
              <button
                onClick={onClose}
                className="wood-btn-brown p-1.5 rounded-xl text-amber-200 hover:text-white transition shadow-sm ml-auto"
                title="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
