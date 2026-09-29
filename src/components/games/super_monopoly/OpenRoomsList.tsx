'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Loader2, ArrowRight, Bot } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';

// Mirrors the summary GET /api/room?list=... returns.
interface OpenRoomSummary {
  code: string;
  host_name: string;
  host_avatar: string | null;
  player_count: number;
  bot_count: number;
  created_at: string;
}

const MAX_PLAYERS = 8;
const REFRESH_MS = 3000;

// Rooms other people have opened and are waiting to fill. Polls only while the
// tab is visible; a background tab has no one to show the list to.
export function OpenRoomsList() {
  const router = useRouter();
  const [rooms, setRooms] = useState<OpenRoomSummary[] | null>(null);
  const [joiningCode, setJoiningCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await fetch('/api/room?list=super-monopoly', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setRooms(data.rooms || []);
      } catch {
        // keep showing the last list; the next tick retries
      }
    };

    load();
    const timer = setInterval(load, REFRESH_MS);
    document.addEventListener('visibilitychange', load);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', load);
    };
  }, []);

  const join = (code: string) => {
    setJoiningCode(code);
    router.push(`/super/lobby/${code}`);
  };

  return (
    <div className="bg-[rgb(var(--c-surface))]/90 border-2 border-[rgb(var(--c-surface-3))] rounded-2xl p-5 shadow-xl flex flex-col min-h-[240px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-black text-[rgb(var(--c-ink))] flex items-center gap-2">
          <Globe className="w-5 h-5 text-[rgb(var(--c-butter-label))]" />
          <span>ห้องที่เปิดรอผู้เล่น</span>
        </h3>
        {rooms && rooms.length > 0 && (
          <span className="text-xs font-bold text-[rgb(var(--c-ink-soft))]">{rooms.length} ห้อง</span>
        )}
      </div>

      {rooms === null ? (
        <div className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-[rgb(var(--c-ink-soft))]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>กำลังโหลดรายการห้อง...</span>
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-1 py-6">
          <p className="text-sm font-bold text-[rgb(var(--c-ink-soft))]">ตอนนี้ยังไม่มีห้องที่เปิดรอ</p>
          <p className="text-xs text-[rgb(var(--c-ink-faint))] leading-relaxed">
            กด &ldquo;สร้างห้องซุปเปอร์เศรษฐี&rdquo; แล้วห้องของคุณจะขึ้นที่นี่ให้คนอื่นกดเข้ามาเล่นได้
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 max-h-[320px] overflow-y-auto scrollbar-none pr-1">
          {rooms.map((r) => {
            const humans = r.player_count - r.bot_count;
            const busy = joiningCode !== null;
            return (
              <li key={r.code}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => join(r.code)}
                  className="w-full p-3 rounded-xl bg-[rgb(var(--c-bg-deep))] border border-[rgb(var(--c-surface-2))] hover:border-[rgb(var(--c-butter-label))] flex items-center gap-3 text-left transition active:scale-[0.99] disabled:opacity-60"
                >
                  <Avatar src={r.host_avatar} name={r.host_name} size="md" />
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-[rgb(var(--c-ink))] truncate leading-snug">
                      ห้องของ {r.host_name}
                    </span>
                    <span className="flex items-center gap-2 text-xs font-bold text-[rgb(var(--c-ink-soft))] leading-snug">
                      <span className="font-mono">{r.code}</span>
                      <span>·</span>
                      <span>
                        {r.player_count}/{MAX_PLAYERS} คน
                      </span>
                      {r.bot_count > 0 && (
                        <span className="flex items-center gap-0.5" title={`คน ${humans} บอท ${r.bot_count}`}>
                          <Bot className="w-3.5 h-3.5" />
                          {r.bot_count}
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="wood-btn-gold shrink-0 px-3 py-2 rounded-lg text-xs font-black flex items-center gap-1">
                    {joiningCode === r.code ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>เข้าร่วม</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
