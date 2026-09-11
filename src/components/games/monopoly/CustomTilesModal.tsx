'use client';

import React, { useState, useEffect } from 'react';
import { MonopolyTileRecord } from '@/types/database';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { DEFAULT_MONOPOLY_TILES, getTileIcon } from '@/lib/mockTiles';
import { Settings, RotateCcw, Check, Wine, Award, HelpCircle, ShieldCheck, Smile } from 'lucide-react';
import { showConfirm, showToast } from '@/lib/alerts';

interface CustomTilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTiles: MonopolyTileRecord[];
  isHost: boolean;
  onSaveTiles: (updatedTiles: MonopolyTileRecord[]) => Promise<void>;
}

export const CustomTilesModal: React.FC<CustomTilesModalProps> = ({
  isOpen,
  onClose,
  currentTiles,
  isHost,
  onSaveTiles,
}) => {
  const [tiles, setTiles] = useState<MonopolyTileRecord[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTiles(currentTiles && currentTiles.length === 28 ? currentTiles : DEFAULT_MONOPOLY_TILES);
      setSavedSuccess(false);
    }
  }, [isOpen, currentTiles]);

  const handleTileChange = (
    tileIndex: number,
    field: keyof MonopolyTileRecord,
    value: string
  ) => {
    if (!isHost) return;
    setTiles((prev) =>
      prev.map((tile) => (tile.tile_index === tileIndex ? { ...tile, [field]: value } : tile))
    );
  };

  const handleResetToDefault = async () => {
    if (!isHost) return;
    const confirmed = await showConfirm(
      'คืนค่าคำสั่งเดิม?',
      'ต้องการรีเซ็ตคำสั่งทั้ง 28 ช่องกลับเป็นค่าเริ่มต้นใช่หรือไม่?',
      'รีเซ็ตคำสั่ง',
      'ยกเลิก'
    );
    if (confirmed) {
      setTiles(DEFAULT_MONOPOLY_TILES);
      showToast('คืนค่าคำสั่งมาตรฐานเรียบร้อย', 'success');
    }
  };

  const handleSave = async () => {
    if (!isHost) return;
    setSaving(true);
    try {
      await onSaveTiles(tiles);
      setSavedSuccess(true);
      showToast('บันทึกคำสั่งกระดานสำเร็จ!', 'success');
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (e) {
      showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
    } finally {
      setSaving(false);
    }
  };

  const typeOptions = [
    { value: 'drink', label: 'คำสั่งดื่ม', color: 'text-rose-300' },
    { value: 'order_others', label: 'สั่งเพื่อน', color: 'text-amber-300' },
    { value: 'challenge', label: 'มินิเกม', color: 'text-purple-300' },
    { value: 'safe', label: 'รอดตัว', color: 'text-emerald-300' },
  ];

  const filteredTiles = tiles.filter((t) => {
    if (filter === 'all') return true;
    return t.tile_type === filter;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚙️ ปรับแต่งคำสั่งกระดาน (28 ช่อง)">
      <div className="flex flex-col gap-3 max-h-[75vh]">
        {/* Subtitle */}
        <p className="text-xs text-amber-200/80 font-bold">
          {isHost
            ? 'คุณสามารถแก้ไขคำสั่งทั้ง 28 ช่องให้เข้ากับกลุ่มสหายของคุณได้ตามใจชอบ'
            : 'ดูคำสั่งประจำห้องนี้ (เฉพาะหัวหน้าห้องเท่านั้นที่แก้ไขได้)'}
        </p>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {[
            { id: 'all', label: 'ทั้งหมด (28)' },
            { id: 'drink', label: 'คำสั่งดื่ม' },
            { id: 'order_others', label: 'สั่งเพื่อน' },
            { id: 'challenge', label: 'มินิเกม' },
            { id: 'safe', label: 'รอดตัว' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1 rounded-xl font-black whitespace-nowrap transition ${
                filter === tab.id
                  ? 'wood-btn-gold text-white'
                  : 'bg-[#291104] text-amber-200/60 border border-[#4d1f06] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tiles Editor List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[48vh] scrollbar-none">
          {filteredTiles.map((tile) => (
            <div
              key={tile.tile_index}
              className="p-3 bg-[#240c02] border-2 border-[#54240a] rounded-2xl space-y-2 shadow-inner"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-amber-300">
                  ช่อง #{tile.tile_index}
                </span>

                {/* Category Select */}
                {isHost ? (
                  <select
                    value={tile.tile_type}
                    onChange={(e) =>
                      handleTileChange(tile.tile_index, 'tile_type', e.target.value)
                    }
                    className="bg-[#1b0801] border-2 border-[#572408] rounded-xl px-2.5 py-1 text-xs font-bold text-amber-200 focus:outline-none focus:border-amber-400"
                  >
                    {typeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs font-bold text-amber-200/80">
                    {typeOptions.find((o) => o.value === tile.tile_type)?.label}
                  </span>
                )}
              </div>

              {/* Title Input with Icon Selector */}
              {isHost ? (
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] text-amber-300/70 font-bold mb-0.5">ไอคอน</span>
                    <input
                      type="text"
                      value={tile.icon || getTileIcon(tile)}
                      onChange={(e) =>
                        handleTileChange(tile.tile_index, 'icon', e.target.value)
                      }
                      placeholder="ไอคอน"
                      maxLength={4}
                      className="w-12 text-center bg-[#1b0801] border-2 border-[#54240a] rounded-xl py-1 text-base font-bold text-white focus:outline-none focus:border-amber-400"
                      title="พิมพ์ Emoji หรือเลือกด้านล่าง"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-[9px] text-amber-300/70 font-bold mb-0.5 block">ชื่อช่อง</span>
                    <input
                      type="text"
                      value={tile.title}
                      onChange={(e) =>
                        handleTileChange(tile.tile_index, 'title', e.target.value)
                      }
                      placeholder="ชื่อช่อง"
                      maxLength={50}
                      className="w-full bg-[#1b0801] border-2 border-[#54240a] rounded-xl px-2.5 py-1.5 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getTileIcon(tile)}</span>
                  <div className="text-xs sm:text-sm font-bold text-white">
                    {tile.title}
                  </div>
                </div>
              )}

              {/* Quick Preset Emoji Row for Host */}
              {isHost && (
                <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none text-xs">
                  <span className="text-[9px] text-amber-200/50 mr-1 shrink-0">เลือกด่วน:</span>
                  {['🍺', '🍻', '🥃', '🍷', '👑', '🎯', '🪙', '🎲', '💣', '🛡️', '💃', '🎤', '🌸', '⚔️', '💔', '👀'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleTileChange(tile.tile_index, 'icon', emoji)}
                      className="w-6 h-6 rounded-lg bg-[#301204] border border-[#522207] hover:bg-[#4a1c06] hover:scale-110 active:scale-95 transition flex items-center justify-center shrink-0"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {isHost ? (
                <div>
                  <textarea
                    value={tile.action_text}
                    onChange={(e) =>
                      handleTileChange(tile.tile_index, 'action_text', e.target.value)
                    }
                    placeholder="คำสั่งบทลงโทษ..."
                    rows={3}
                    maxLength={300}
                    className="w-full bg-[#1b0801] border-2 border-[#54240a] rounded-xl p-2.5 text-xs text-amber-100 font-semibold focus:outline-none focus:border-amber-400 resize-y shadow-inner"
                  />
                  <div className="text-[10px] text-amber-300/40 text-right pr-1">
                    {tile.action_text.length}/300 ตัวอักษร
                  </div>
                </div>
              ) : (
                <p className="text-xs text-amber-200/90 font-medium">{tile.action_text}</p>
              )}
            </div>
          ))}
        </div>

        {/* Action Controls for Host */}
        {isHost ? (
          <div className="flex gap-2 pt-3 border-t border-[#54240a]">
            <Button
              variant="wood-brown"
              size="sm"
              onClick={handleResetToDefault}
              disabled={saving}
              className="text-xs px-3"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>คืนค่าเดิม</span>
            </Button>

            <Button
              variant="wood-gold"
              size="md"
              fullWidth
              onClick={handleSave}
              disabled={saving}
              className="text-sm font-black"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 mr-1 text-emerald-200" />
                  <span>บันทึกสำเร็จ!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  <span>{saving ? 'กำลังบันทึก...' : 'บันทึกคำสั่งกระดาน'}</span>
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button variant="wood-brown" size="sm" fullWidth onClick={onClose}>
            ปิด
          </Button>
        )}
      </div>
    </Modal>
  );
};
