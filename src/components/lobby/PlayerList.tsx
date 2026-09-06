import React from 'react';
import { PlayerRecord } from '@/types/database';
import { Avatar } from '@/components/common/Avatar';
import { DrinkCounter } from '@/components/common/DrinkCounter';
import { Crown, Users } from 'lucide-react';
import { PlatformType } from '@/lib/platforms/types';

interface PlayerListProps {
  players: PlayerRecord[];
  hostId: string;
  currentUserId?: string;
  isHostUser?: boolean;
  costumes?: Record<string, number>;
  onReorderPlayers?: (newOrderedIds: string[]) => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  hostId,
  currentUserId,
  isHostUser,
  costumes,
  onReorderPlayers,
}) => {
  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!onReorderPlayers) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= players.length) return;

    const newPlayers = [...players];
    const [moved] = newPlayers.splice(index, 1);
    newPlayers.splice(targetIndex, 0, moved);
    onReorderPlayers(newPlayers.map((p) => p.id));
  };

  return (
    <div className="w-full wood-panel rounded-3xl p-4 sm:p-5 relative shadow-xl">
      <div className="wood-rivet absolute top-2 left-2" />
      <div className="wood-rivet absolute top-2 right-2" />
      <div className="wood-rivet absolute bottom-2 left-2" />
      <div className="wood-rivet absolute bottom-2 right-2" />

      <div className="flex items-center justify-between mb-3 border-b border-[#54240a] pb-2">
        <div className="flex items-center gap-2 text-amber-300 font-black">
          <Users className="w-5 h-5 text-amber-400" />
          <span className="drop-shadow">สหายในโรงเตี๊ยม ({players.length} คน)</span>
        </div>
        <span className="text-xs text-amber-200/70 font-bold">
          {isHostUser ? 'จัดลำดับการเดินได้' : 'พร้อมลุยศึก'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1 scrollbar-none">
        {players.map((p, idx) => {
          const isPlayerHost = p.id === hostId;
          const isMe = p.id === currentUserId;
          const platformType: PlatformType = p.line_user_id?.startsWith('U')
            ? 'line'
            : p.line_user_id?.startsWith('dc-') || /^\d{17,20}$/.test(p.line_user_id || '')
            ? 'discord'
            : 'web';

          return (
            <div
              key={p.id}
              className={`flex items-center justify-between p-2.5 rounded-2xl border-2 transition-all ${
                isMe
                  ? 'bg-[#401804] border-yellow-400/80 shadow-[0_0_12px_rgba(252,211,77,0.3)]'
                  : 'bg-[#220c02]/80 border-[#471903]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Host Reorder Buttons */}
                {isHostUser && players.length > 1 && (
                  <div className="flex flex-col gap-0.5 mr-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      className={`w-6 h-5 flex items-center justify-center rounded text-[11px] font-black border ${
                        idx === 0
                          ? 'opacity-20 text-gray-500 border-transparent cursor-not-allowed'
                          : 'bg-[#381604] border-[#6b2e0a] text-yellow-300 hover:bg-[#522207] active:scale-95'
                      }`}
                      title="เลื่อนขึ้น"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={idx === players.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      className={`w-6 h-5 flex items-center justify-center rounded text-[11px] font-black border ${
                        idx === players.length - 1
                          ? 'opacity-20 text-gray-500 border-transparent cursor-not-allowed'
                          : 'bg-[#381604] border-[#6b2e0a] text-yellow-300 hover:bg-[#522207] active:scale-95'
                      }`}
                      title="เลื่อนลง"
                    >
                      ▼
                    </button>
                  </div>
                )}

                <div className="relative shrink-0">
                  <Avatar
                    src={p.avatar_url}
                    name={p.display_name}
                    size="md"
                    platform={platformType}
                  />
                  {costumes && (
                    <span
                      className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#2b0f02] shadow"
                      style={{
                        backgroundColor: [
                          '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
                          '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#e11d48',
                          '#14b8a6', '#6366f1', '#d946ef', '#eab308', '#64748b',
                          '#fb7185', '#0284c7', '#a855f7', '#4ade80', '#fbbf24',
                        ][(costumes[p.id] ?? idx) % 20],
                      }}
                      title="สีตัวละครของคุณในเกม"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-black text-sm text-amber-100">
                    <span className="truncate max-w-[100px] drop-shadow">{p.display_name}</span>
                    {isMe && (
                      <span className="text-[9px] bg-amber-500 text-[#301103] font-black px-1.5 py-0.2 rounded-md shrink-0">
                        คุณ
                      </span>
                    )}
                    {isPlayerHost && (
                      <span title="หัวหน้าห้อง" className="shrink-0">
                        <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400 animate-bounce" />
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-amber-300/80 font-bold">
                    🎲 คิวที่ {idx + 1} {idx === 0 ? '(เริ่มก่อน)' : ''}
                  </div>
                </div>
              </div>

              <DrinkCounter count={p.drinks_count} size="sm" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
