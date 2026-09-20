import React from 'react';

export default function PartyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex justify-center items-start md:py-6 md:px-2">
      <div className="w-full max-w-[440px] min-h-screen md:min-h-[90vh] md:rounded-[36px] overflow-hidden relative shadow-[0_0_60px_rgba(0,0,0,0.95)] md:border-2 md:border-[rgb(var(--c-surface-3))]/80 bg-tavern flex flex-col">
        {children}
      </div>
    </div>
  );
}
