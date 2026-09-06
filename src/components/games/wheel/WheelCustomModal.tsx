'use client';

import React, { useState, useEffect } from 'react';
import { WheelItem, DEFAULT_WHEEL_ITEMS, PRESET_COLORS, WheelActionType } from './wheelData';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Settings, Plus, Trash2, RotateCcw, Check, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { showConfirm, showToast } from '@/lib/alerts';

interface WheelCustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  wheelItems?: WheelItem[];
  isHost: boolean;
  onSaveItems: (items: WheelItem[]) => Promise<void>;
}

export const WheelCustomModal: React.FC<WheelCustomModalProps> = ({
  isOpen,
  onClose,
  wheelItems,
  isHost,
  onSaveItems,
}) => {
  const [items, setItems] = useState<WheelItem[]>(DEFAULT_WHEEL_ITEMS);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New item form states
  const [newText, setNewText] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [newDrinkCount, setNewDrinkCount] = useState(1);
  const [newActionType, setNewActionType] = useState<WheelActionType>('self');
  const [showAddForm, setShowAddForm] = useState(false);

  // Keep items initialized once or when modal freshly opens
  useEffect(() => {
    if (isOpen) {
      if (wheelItems && wheelItems.length > 0) {
        setItems(wheelItems);
      } else {
        setItems(DEFAULT_WHEEL_ITEMS);
      }
      setSavedSuccess(false);
      setShowAddForm(false);
      setNewText('');
    }
  }, [isOpen]);

  const activeCount = items.filter((it) => it.enabled).length;

  const handleToggleItem = (id: string) => {
    if (!isHost) return;
    const targetItem = items.find((it) => it.id === id);
    if (!targetItem) return;

    if (targetItem.enabled && activeCount <= 2) {
      showToast('ต้องมีชิ้นส่วนวงล้อที่เปิดใช้งานอย่างน้อย 2 ชิ้น!', 'warning');
      return;
    }

    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, enabled: !it.enabled } : it))
    );
  };

  const handleDeleteItem = async (id: string) => {
    if (!isHost) return;
    if (items.length <= 2) {
      showToast('ต้องมีคำสั่งในวงล้ออย่างน้อย 2 ข้อ!', 'warning');
      return;
    }

    const itemToDelete = items.find((it) => it.id === id);
    if (itemToDelete?.enabled && activeCount <= 2) {
      showToast('ต้องมีชิ้นส่วนที่เปิดใช้งานอย่างน้อย 2 ชิ้น!', 'warning');
      return;
    }

    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isHost) {
      showToast('เฉพาะหัวหน้าห้อง (Host) เท่านั้นที่สามารถเพิ่มข้อความได้', 'warning');
      return;
    }
    const trimmed = newText.trim();
    if (!trimmed) {
      showToast('กรุณากรอกข้อความบทลงโทษก่อนกดเพิ่ม', 'warning');
      return;
    }

    const newItem: WheelItem = {
      id: `wheel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      text: trimmed,
      color: newColor,
      drinkCount: newDrinkCount,
      actionType: newActionType,
      enabled: true,
    };

    setItems((prev) => [...prev, newItem]);
    setNewText('');
    setNewColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setShowAddForm(false);
    showToast('เพิ่มข้อใหม่ในรายการแล้ว! กด "บันทึกวงล้อ" ด้านล่างเพื่อใช้งาน', 'success');
  };

  const handleReset = async () => {
    if (!isHost) return;
    const confirmed = await showConfirm(
      'คืนค่าคำสั่งเริ่มต้น?',
      'ต้องการรีเซ็ตวงล้อเป็น 8 ข้อมาตรฐานใช่หรือไม่?',
      'รีเซ็ตเดิม',
      'ยกเลิก'
    );
    if (confirmed) {
      setItems(DEFAULT_WHEEL_ITEMS);
      showToast('คืนค่าวงล้อมาตรฐานแล้ว', 'success');
    }
  };

  const handleSave = async () => {
    if (!isHost) return;
    if (activeCount < 2) {
      showToast('ต้องมีชิ้นส่วนที่เปิดใช้งานอย่างน้อย 2 ชิ้น!', 'warning');
      return;
    }

    setSaving(true);
    try {
      await onSaveItems(items);
      setSavedSuccess(true);
      showToast('บันทึกการตั้งค่าวล้อเรียบร้อยแล้ว!', 'success');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch {
      showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isHost ? '⚙️ ปรับแต่งวงล้อเสี่ยงทาย' : '📜 คำสั่งในวงล้อเสี่ยงทาย'}
      className="max-w-xl max-h-[88vh] flex flex-col p-4 sm:p-5"
    >
      {/* Top Banner */}
      <div className="mb-3 text-xs text-amber-200/80 bg-[#2b1204] p-3 rounded-2xl border border-[#522208] flex items-center justify-between gap-2">
        <span>
          💡 {isHost ? 'Host สามารถเพิ่ม ลบ และสลับเปิด/ปิดชิ้นส่วนวงล้อได้ตามใจชอบ (เปิดใช้งานอยู่: ' : 'รายการข้อความทั้งหมดในวงล้อ (เปิดใช้งานอยู่: '}
          <b className="text-amber-300">{activeCount}</b> ช่อง)
        </span>
        {isHost && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 text-xs font-black text-amber-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 px-2.5 py-1 rounded-xl shadow transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'ปิดแบบฟอร์ม' : 'เพิ่มข้อใหม่'}</span>
          </button>
        )}
      </div>

      {/* Add New Rule Form */}
      {isHost && showAddForm && (
        <form
          onSubmit={handleAddItem}
          className="mb-3 p-3.5 rounded-2xl bg-[#1f0a02] border-2 border-amber-500/60 shadow-lg space-y-3"
        >
          <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>เพิ่มคำสั่งลงวงล้อ</span>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300 block mb-1">
              ข้อความบนวงล้อ:
            </label>
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddItem();
                }
              }}
              placeholder="เช่น ดื่ม 2 อึก, เล่าเรื่องผี, คนซ้ายโดน..."
              maxLength={30}
              autoFocus
              className="w-full bg-[#2e1205] border border-amber-600/60 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-gray-300 block mb-1">
                จำนวนดื่ม (อึก):
              </label>
              <select
                value={newDrinkCount}
                onChange={(e) => setNewDrinkCount(parseInt(e.target.value) || 0)}
                className="w-full bg-[#2e1205] border border-amber-600/60 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
              >
                <option value={0}>0 (รอดตัว / กิจกรรม)</option>
                <option value={1}>1 อึก</option>
                <option value={2}>2 อึก</option>
                <option value={3}>3 อึก</option>
                <option value={4}>4 (หมดแก้ว! 🍾)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-300 block mb-1">
                ผู้รับเคราะห์:
              </label>
              <select
                value={newActionType}
                onChange={(e) => setNewActionType(e.target.value as WheelActionType)}
                className="w-full bg-[#2e1205] border border-amber-600/60 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
              >
                <option value="self">คนหมุนเอง</option>
                <option value="left">เพื่อนคนซ้าย</option>
                <option value="right">เพื่อนคนขวา</option>
                <option value="choose">เลือกเพื่อน 1 คน</option>
                <option value="all">ทุกคนในวง (ชนแก้ว)</option>
                <option value="safe">รอดตัว (ไม่มีใครดื่ม)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300 block mb-1.5">
              เลือกสีชิ้นส่วน:
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    newColor === c ? 'border-white scale-125 shadow-lg' : 'border-black/50 opacity-80'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-gray-400 hover:text-white px-3 py-1 font-bold"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow active:scale-95 transition"
            >
              + บันทึกเพิ่มข้อนี้
            </button>
          </div>
        </form>
      )}

      {/* Items Scroll List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[50vh] scrollbar-thin scrollbar-thumb-amber-700">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={`p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between gap-2.5 transition ${
              item.enabled
                ? 'bg-[#220d03] border-[#522106] shadow-sm'
                : 'bg-[#140601] border-stone-900 opacity-50'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Color swatch badge */}
              <div
                style={{ backgroundColor: item.color }}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white/60 shrink-0 shadow-sm"
              />

              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black text-white truncate flex items-center gap-1.5">
                  <span>{item.text}</span>
                  {!item.enabled && (
                    <span className="text-[10px] text-gray-400 font-bold bg-black/40 px-1.5 py-0.2 rounded">
                      (ปิดใช้งาน)
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-amber-300/80 font-bold mt-0.5">
                  {item.drinkCount === 4
                    ? '🍾 หมดแก้ว'
                    : item.drinkCount > 0
                    ? `🍺 ${item.drinkCount} อึก`
                    : '🎉 รอดตัว'}{' '}
                  • {item.actionType === 'self' && 'คนหมุน'}
                  {item.actionType === 'left' && 'คนซ้าย'}
                  {item.actionType === 'right' && 'คนขวา'}
                  {item.actionType === 'choose' && 'เลือกเพื่อน'}
                  {item.actionType === 'all' && 'ทุกคนในวง'}
                  {item.actionType === 'safe' && 'ปลอดภัย'}
                </div>
              </div>
            </div>

            {/* Controls */}
            {isHost && (
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Toggle Enable/Disable Button */}
                <button
                  type="button"
                  onClick={() => handleToggleItem(item.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition flex items-center gap-1 ${
                    item.enabled
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900'
                      : 'bg-stone-900 text-stone-400 border-stone-700 hover:bg-stone-800'
                  }`}
                  title={item.enabled ? 'กดเพื่อปิดใช้งานช่องนี้' : 'กดเพื่อเปิดใช้งานช่องนี้'}
                >
                  {item.enabled ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>เปิด</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-stone-400" />
                      <span>ปิด</span>
                    </>
                  )}
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-rose-950/50 rounded-xl transition"
                  title="ลบคำสั่งนี้ออก"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Controls */}
      <div className="pt-3 mt-3 border-t border-[#4a1d06] flex items-center justify-between gap-2">
        {isHost ? (
          <>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-amber-400/80 hover:text-amber-200 font-bold px-3 py-2 rounded-xl bg-[#260e03] border border-[#481c05] transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>คืนค่า 8 ข้อเดิม</span>
            </button>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
                ยกเลิก
              </Button>
              <Button
                variant="wood-gold"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 font-black text-xs"
              >
                {savedSuccess ? (
                  <span className="flex items-center gap-1 text-emerald-950 font-black">
                    <Check className="w-4 h-4" /> บันทึกแล้ว
                  </span>
                ) : saving ? (
                  'กำลังบันทึก...'
                ) : (
                  'บันทึกวงล้อ'
                )}
              </Button>
            </div>
          </>
        ) : (
          <Button variant="wood-gold" size="sm" fullWidth onClick={onClose}>
            รับทราบคำสั่ง
          </Button>
        )}
      </div>
    </Modal>
  );
};
