import React, { useState } from 'react';
import { PlayerRecord } from '@/types/database';
import { Avatar } from '@/components/common/Avatar';
import { DrinkCounter } from '@/components/common/DrinkCounter';
import { Crown, Users, UserPlus, Trash2, Bot, Dice5, Sparkles } from 'lucide-react';
import { PlatformType } from '@/lib/platforms/types';

interface PlayerListProps {
  players: PlayerRecord[];
  hostId: string;
  currentUserId?: string;
  isHostUser?: boolean;
  costumes?: Record<string, number>;
  onReorderPlayers?: (newOrderedIds: string[]) => void;
  onAddBotPlayer?: (name: string) => Promise<void>;
  onRemovePlayer?: (playerId: string) => Promise<void>;
}

const RANDOM_NAMES = [
  'สายเปย์',
  'ตับเหล็ก',
  'น้องแนน',
  'พี่เบิ้ม',
  'สายแข็ง',
  'แก้วเดียวจอด',
  'เจ้าถิ่น',
  'เด็กดริ้งค์',
  'บอสใหญ่',
  'หวานเจี๊ยบ',
  'สมชาย',
  'ผู้พิชิต',
  'สายยกหมด',
  'น้องส้ม',
  'เจ๊หมวย',
];

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  hostId,
  currentUserId,
  isHostUser,
  costumes,
  onReorderPlayers,
  onAddBotPlayer,
  onRemovePlayer,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [botNameInput, setBotNameInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleRandomName = () => {
    const random = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    setBotNameInput(random);
  };

  const handleAddSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = botNameInput.trim();
    if (!name || isAdding || !onAddBotPlayer) return;

    setIsAdding(true);
    try {
      await onAddBotPlayer(name);
      setBotNameInput('');
      setShowAddForm(false);
    } finally {
      setIsAdding(false);
    }
  };

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

      <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-none">
        {players.map((p, idx) => {
          const isPlayerHost = p.id === hostId;
          const isMe = p.id === currentUserId;
          const isBot = p.line_user_id === 'bot' || p.id.startsWith('bot-');
          const platformType: PlatformType = isBot
            ? 'web'
            : p.line_user_id?.startsWith('U')
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
              <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                {/* Host Reorder Buttons */}
                {isHostUser && players.length > 1 && (
                  <div className="flex flex-col gap-0.5 mr-0.5 shrink-0">
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
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-black text-sm text-amber-100">
                    <span className="truncate max-w-[130px] sm:max-w-[170px] drop-shadow">{p.display_name}</span>
                    {isMe && (
                      <span className="text-[9px] bg-amber-500 text-[#301103] font-black px-1.5 py-0.2 rounded-md shrink-0">
                        คุณ
                      </span>
                    )}
                    {isBot && (
                      <span className="text-[9px] bg-[#3a1d6e] border border-purple-400/50 text-purple-200 font-black px-1.5 py-0.2 rounded-md shrink-0 flex items-center gap-0.5">
                        <Bot className="w-2.5 h-2.5" /> บอท
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

              <div className="flex items-center gap-2">
                <DrinkCounter count={p.drinks_count} size="sm" />
                {/* Host can kick bot or other player in lobby */}
                {isHostUser && !isMe && onRemovePlayer && (
                  <button
                    type="button"
                    onClick={() => onRemovePlayer(p.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-300 hover:text-red-100 transition active:scale-95 shrink-0"
                    title={isBot ? 'ลบบอทตัวนี้ออก' : 'เตะผู้เล่นนี้ออกจากห้อง'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Host Action: Add Bot / Local Player for Pass & Play */}
      {isHostUser && onAddBotPlayer && (
        <div className="mt-3 pt-3 border-t border-[#54240a]/80">
          {!showAddForm ? (
            <button
              type="button"
              onClick={() => {
                setShowAddForm(true);
                handleRandomName();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-[#361604] hover:bg-[#4d1f05] border-2 border-dashed border-[#6b2e0a] hover:border-yellow-400/60 text-amber-200 hover:text-yellow-300 text-xs font-black transition active:scale-95 shadow-inner"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>+ เพิ่มบอท / สหายในเครื่อง (เล่นเวียน)</span>
            </button>
          ) : (
            <form onSubmit={handleAddSubmit} className="flex flex-col gap-2 bg-[#250d02] border border-[#5a2408] p-3 rounded-2xl shadow-inner animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-black text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                  ตั้งชื่อผู้เล่นบอท / คนในวง
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-amber-200/60 hover:text-amber-100 text-[11px]"
                >
                  ยกเลิก
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={botNameInput}
                  onChange={(e) => setBotNameInput(e.target.value)}
                  placeholder="เช่น พี่เบิ้ม, น้องแนน..."
                  maxLength={15}
                  autoFocus
                  className="flex-1 bg-[#180701] border border-[#522005] focus:border-yellow-400 text-amber-100 text-xs px-3 py-2 rounded-xl outline-none font-bold placeholder:text-amber-400/30"
                />
                <button
                  type="button"
                  onClick={handleRandomName}
                  className="p-2 rounded-xl bg-[#381604] hover:bg-[#522207] border border-[#6b2e0a] text-yellow-400 text-xs font-bold transition active:scale-95"
                  title="สุ่มชื่อน่ารักๆ ในวงเหล้า"
                >
                  <Dice5 className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  disabled={!botNameInput.trim() || isAdding}
                  className="px-3.5 py-2 rounded-xl wood-btn-gold text-xs font-black transition active:scale-95 disabled:opacity-40"
                >
                  {isAdding ? '...' : 'เพิ่ม'}
                </button>
              </div>
              <p className="text-[10px] text-amber-200/60">
                💡 ผู้เล่นนี้จะเล่นบนเครื่องหัวหน้าห้อง สามารถกดทอยหรือทำคำสั่งแทนกันได้เมื่อถึงตา
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
