import React, { useEffect } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  // Pinned under the scrolling body. The action that dismisses a card has to
  // stay reachable however tall the card's contents get.
  footer?: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  footer,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/92 animate-fadeIn">
      {/* A card taller than the window used to be clipped with no way to reach
          the rest of it - in a short Discord window that put the button that
          closes it off the bottom of the screen. It keeps to the window now and
          scrolls inside instead. */}
      <div
        className={clsx(
          'relative w-full max-w-md rpg-dialog-box rounded-3xl p-5 sm:p-6 text-white overflow-hidden',
          'max-h-[calc(100dvh-2rem)] flex flex-col',
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

        <div className="relative z-10 flex flex-col min-h-0 flex-1">
          {/* Header Plaque / Scroll Banner */}
          <div className="shrink-0 flex items-center justify-between mb-4 pb-2 border-b border-[rgb(var(--c-surface-3))]">
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
                className="wood-btn-brown p-1.5 rounded-xl text-amber-200 hover:text-[rgb(var(--c-ink))] transition shadow-sm ml-auto"
                title="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* -mx/px pair keeps the scrollbar off the content's own edge */}
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-none -mx-1 px-1">
            {children}
          </div>

          {footer && <div className="shrink-0 pt-3">{footer}</div>}
        </div>
      </div>
    </div>
  );
};
