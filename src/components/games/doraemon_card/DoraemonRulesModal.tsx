'use client';

import React, { useState, useEffect } from 'react';
import {
  CardValue,
  DoraemonRule,
  DEFAULT_DORAEMON_RULES,
  KingMode,
  KingPresetRule,
  DEFAULT_KING_PRESET_RULES,
} from './doraemonCardData';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Settings, RotateCcw, Check, Crown, Layers } from 'lucide-react';
import { showConfirm, showToast } from '@/lib/alerts';

interface DoraemonRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  customRules?: Record<string, DoraemonRule>;
  kingMode?: KingMode;
  kingPresetRules?: Record<string, KingPresetRule>;
  isHost: boolean;
  onSaveRules: (
    rules: Record<CardValue, DoraemonRule>,
    kingMode?: KingMode,
    kingPresetRules?: Record<string, KingPresetRule>
  ) => Promise<void>;
}

const ORDERED_VALUES: CardValue[] = [
  'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'
];

export const DoraemonRulesModal: React.FC<DoraemonRulesModalProps> = ({
  isOpen,
  onClose,
  customRules,
  kingMode: initialKingMode = 'preset',
  kingPresetRules: initialKingPresetRules,
  isHost,
  onSaveRules,
}) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'king'>('cards');
  const [rules, setRules] = useState<Record<CardValue, DoraemonRule>>(DEFAULT_DORAEMON_RULES);
  const [selectedKingMode, setSelectedKingMode] = useState<KingMode>(initialKingMode);
  const [presetRules, setPresetRules] = useState<Record<string, KingPresetRule>>(
    initialKingPresetRules || DEFAULT_KING_PRESET_RULES
  );
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (customRules && Object.keys(customRules).length > 0) {
        setRules({ ...DEFAULT_DORAEMON_RULES, ...customRules });
      } else {
        setRules(DEFAULT_DORAEMON_RULES);
      }
      setSelectedKingMode(initialKingMode || 'preset');
      setPresetRules(initialKingPresetRules || DEFAULT_KING_PRESET_RULES);
      setSavedSuccess(false);
    }
  }, [isOpen, customRules, initialKingMode, initialKingPresetRules]);

  const handleRuleChange = (
    val: CardValue,
    field: keyof DoraemonRule,
    value: any
  ) => {
    if (!isHost) return;
    setRules((prev) => ({
      ...prev,
      [val]: {
        ...prev[val],
        [field]: value,
      },
    }));
  };

  const handleKingPresetChange = (
    part: string,
    field: keyof KingPresetRule,
    value: string
  ) => {
    if (!isHost) return;
    setPresetRules((prev) => ({
      ...prev,
      [part]: {
        ...prev[part],
        [field]: value,
      },
    }));
  };

  const handleReset = async () => {
    if (!isHost) return;
    const confirmed = await showConfirm(
      'คืนค่ากฎดั้งเดิม?',
      'ต้องการรีเซ็ตกฎของไพ่โดราเอมอนและคำสั่ง King ทุกใบกลับเป็นค่าเริ่มต้นใช่หรือไม่?',
      'รีเซ็ตกฎเดิม',
      'ยกเลิก'
    );
    if (confirmed) {
      setRules(DEFAULT_DORAEMON_RULES);
      setSelectedKingMode('preset');
      setPresetRules(DEFAULT_KING_PRESET_RULES);
      showToast('คืนค่ากฎโดราเอมอนมาตรฐานแล้ว', 'success');
    }
  };

  const handleSave = async () => {
    if (!isHost) return;
    setSaving(true);
    try {
      await onSaveRules(rules, selectedKingMode, presetRules);
      setSavedSuccess(true);
      showToast('บันทึกกฎไพ่โดราเอมอนเรียบร้อยแล้ว!', 'success');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isHost ? '⚙️ ปรับแต่งกฎไพ่โดราเอมอน (A - K)' : '📜 กฎไพ่โดราเอมอน (A - K)'}
      className="max-w-xl max-h-[88vh] flex flex-col p-4 sm:p-5"
    >
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 mb-3 bg-[#1e0a02] p-1 rounded-xl border border-[#4a1d06]">
        <button
          onClick={() => setActiveTab('cards')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition ${
            activeTab === 'cards'
              ? 'bg-amber-600 text-stone-950 shadow'
              : 'text-amber-300/70 hover:text-amber-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>ไพ่ทั่วไป (A - K)</span>
        </button>

        <button
          onClick={() => setActiveTab('king')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition ${
            activeTab === 'king'
              ? 'bg-amber-600 text-stone-950 shadow'
              : 'text-amber-300/70 hover:text-amber-200'
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          <span>ระบบไพ่ K ทั้ง 4 ใบ 👑</span>
        </button>
      </div>

      {activeTab === 'cards' ? (
        <>
          {/* Top Description */}
          <div className="mb-3 text-xs text-amber-200/80 bg-[#2b1204] p-3 rounded-2xl border border-[#522208]">
            💡 {isHost ? 'คุณในฐานะ Host สามารถปรับแต่งชื่อและคำสั่งของไพ่แต่ละใบตามใจชอบ กฎใหม่จะซิงก์ให้ทุกคนในห้องทันที' : 'ดูกฎและคำสั่งของไพ่แต่ละใบที่ใช้ในห้องนี้'}
          </div>

          {/* Rules Scroll Area */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[48vh] scrollbar-thin scrollbar-thumb-amber-700">
            {ORDERED_VALUES.map((val) => {
              const rule = rules[val] || DEFAULT_DORAEMON_RULES[val];
              return (
                <div
                  key={val}
                  className="p-3 rounded-2xl bg-[#220d03] border border-[#4a1d06] flex flex-col gap-2 shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{rule.icon}</span>
                      {isHost ? (
                        <input
                          type="text"
                          value={rule.title}
                          onChange={(e) => handleRuleChange(val, 'title', e.target.value)}
                          className="bg-[#381604] border border-[#6b2e0a] rounded-lg px-2 py-0.5 text-xs sm:text-sm font-black text-amber-200 focus:outline-none focus:border-amber-400"
                        />
                      ) : (
                        <span className="font-black text-xs sm:text-sm text-amber-200">
                          {rule.title}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-amber-400/80 font-bold">ดื่ม:</span>
                      {isHost ? (
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={rule.drinkCount}
                          onChange={(e) => handleRuleChange(val, 'drinkCount', parseInt(e.target.value) || 0)}
                          className="w-12 text-center bg-[#381604] border border-[#6b2e0a] rounded px-1 py-0.5 text-xs font-black text-amber-300"
                        />
                      ) : (
                        <span className="text-xs font-black text-amber-300 px-1.5 py-0.5 rounded bg-[#381604]">
                          {rule.drinkCount} อึก
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Description */}
                  {isHost ? (
                    <textarea
                      rows={2}
                      value={rule.actionText}
                      onChange={(e) => handleRuleChange(val, 'actionText', e.target.value)}
                      className="w-full bg-[#170802] border border-[#451803] rounded-xl p-2 text-xs text-gray-200 focus:outline-none focus:border-amber-400 resize-none font-medium leading-relaxed"
                    />
                  ) : (
                    <p className="text-xs text-gray-300 font-medium leading-relaxed bg-[#170802] p-2 rounded-xl border border-[#3b1503]">
                      {rule.actionText}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* King Tab Content */}
          <div className="mb-3 text-xs text-amber-200/80 bg-[#2b1204] p-3 rounded-2xl border border-[#522208] space-y-2">
            <div className="font-black text-amber-300 flex items-center gap-1">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span>การตั้งค่าแอ็กชันไพ่ K (ทั้ง 4 ใบ)</span>
            </div>
            <p>
              เลือกว่าจะให้คนจั่ว K ปฏิบัติตาม **คำสั่งตายตัว (Preset)** หรือให้คนจั่ว **พิมพ์สดในเกม (Custom Input)**
            </p>

            {/* Mode Selection */}
            {isHost ? (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedKingMode('preset')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black border transition ${
                    selectedKingMode === 'preset'
                      ? 'bg-amber-500 text-stone-950 border-amber-300 shadow'
                      : 'bg-[#180802] text-gray-300 border-amber-900/60 hover:border-amber-600'
                  }`}
                >
                  📌 คำสั่งตายตัว (Preset)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedKingMode('custom_input')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black border transition ${
                    selectedKingMode === 'custom_input'
                      ? 'bg-amber-500 text-stone-950 border-amber-300 shadow'
                      : 'bg-[#180802] text-gray-300 border-amber-900/60 hover:border-amber-600'
                  }`}
                >
                  ✍️ พิมพ์สดในเกม (Custom Input)
                </button>
              </div>
            ) : (
              <div className="text-xs font-bold text-amber-300 bg-[#160601] p-2 rounded-xl border border-amber-900/50">
                โหมดปัจจุบัน: <b>{selectedKingMode === 'preset' ? '📌 คำสั่งตายตัว (Preset)' : '✍️ พิมพ์สดในเกม (Custom Input)'}</b>
              </div>
            )}
          </div>

          {/* King 4 Rules Form/List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[46vh] scrollbar-thin scrollbar-thumb-amber-700">
            {['1', '2', '3', '4'].map((idx) => {
              const pRule = presetRules[idx] || DEFAULT_KING_PRESET_RULES[idx];
              return (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-[#220d03] border border-[#4a1d06] flex flex-col gap-2 shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">👑</span>
                      {isHost ? (
                        <input
                          type="text"
                          value={pRule.title}
                          onChange={(e) => handleKingPresetChange(idx, 'title', e.target.value)}
                          className="bg-[#381604] border border-[#6b2e0a] rounded-lg px-2 py-0.5 text-xs sm:text-sm font-black text-amber-200 focus:outline-none focus:border-amber-400"
                        />
                      ) : (
                        <span className="font-black text-xs sm:text-sm text-amber-200">
                          {pRule.title}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-amber-400/80 font-bold bg-[#381604] px-2 py-0.5 rounded-full">
                      ใบที่ {idx} / 4
                    </span>
                  </div>

                  {/* King Description */}
                  {isHost ? (
                    <textarea
                      rows={2}
                      value={pRule.description}
                      onChange={(e) => handleKingPresetChange(idx, 'description', e.target.value)}
                      placeholder="คำสั่ง / บทลงโทษสำหรับ K ใบนี้"
                      className="w-full bg-[#170802] border border-[#451803] rounded-xl p-2 text-xs text-gray-200 focus:outline-none focus:border-amber-400 resize-none font-medium leading-relaxed"
                    />
                  ) : (
                    <p className="text-xs text-gray-300 font-medium leading-relaxed bg-[#170802] p-2 rounded-xl border border-[#3b1503]">
                      {pRule.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Bottom Footer Actions */}
      <div className="pt-3 mt-3 border-t border-[#4a1d06] flex items-center justify-between gap-2">
        {isHost ? (
          <>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-amber-400/80 hover:text-amber-200 font-bold px-3 py-2 rounded-xl bg-[#260e03] border border-[#481c05] transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>คืนค่าเดิม</span>
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
                  'บันทึกกฎ'
                )}
              </Button>
            </div>
          </>
        ) : (
          <Button variant="wood-gold" size="sm" fullWidth onClick={onClose}>
            รับทราบกฎ
          </Button>
        )}
      </div>
    </Modal>
  );
};
