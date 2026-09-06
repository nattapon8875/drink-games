'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Settings, Check, Sparkles, AlertTriangle } from 'lucide-react';
import { CrocodilePenaltyConfig, DEFAULT_CROCODILE_CONFIG } from './crocodileData';
import { showToast } from '@/lib/alerts';

interface CrocodileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: CrocodilePenaltyConfig;
  isHost: boolean;
  onSaveConfig: (cfg: CrocodilePenaltyConfig) => Promise<void>;
}

export const CrocodileSettingsModal: React.FC<CrocodileSettingsModalProps> = ({
  isOpen,
  onClose,
  config = DEFAULT_CROCODILE_CONFIG,
  isHost,
  onSaveConfig,
}) => {
  const [drinkCount, setDrinkCount] = useState<number>(config.drinkCount || 2);
  const [totalTeeth, setTotalTeeth] = useState<number>(config.totalTeeth || 10);
  const [trapCount, setTrapCount] = useState<number>(config.trapCount || 1);
  const [saving, setSaving] = useState(false);

  // Track previous open state to only sync from config when the modal opens
  const prevOpenRef = React.useRef(isOpen);

  useEffect(() => {
    // When modal opens (transition from closed to open), initialize local state from config
    if (isOpen && !prevOpenRef.current) {
      setDrinkCount(config.drinkCount || 2);
      setTotalTeeth(config.totalTeeth || 10);
      setTrapCount(config.trapCount || 1);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, config.drinkCount, config.totalTeeth, config.trapCount]);

  // Ensure trapCount is less than totalTeeth
  const safeTrapCount = Math.min(trapCount, Math.max(1, totalTeeth - 1));

  const handleSave = async () => {
    if (!isHost) return;
    setSaving(true);
    try {
      await onSaveConfig({
        mode: 'fixed',
        drinkCount,
        totalTeeth,
        trapCount: safeTrapCount,
        actionNote:
          drinkCount === 4
            ? 'ผู้เล่นที่กดโดนฟันผุ ดื่มหมดแก้ว! 🍾'
            : `ผู้เล่นที่กดโดนฟันผุ ดื่ม ${drinkCount} อึก! 🐊🍺`,
      });
      showToast('บันทึกการตั้งค่าเกมจระเข้แล้ว!', 'success');
      onClose();
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
      title={isHost ? '⚙️ ปรับแต่งเกมน้องควายงับนิ้ว' : '📜 กติกาและบทลงโทษ'}
      className="max-w-md p-5"
    >
      <div className="space-y-4">
        <div className="text-xs text-amber-200/80 bg-[#2b1204] p-3 rounded-2xl border border-[#522208]">
          💡 {isHost
            ? 'Host สามารถกำหนดจำนวนซี่ฟัน, ฟันกับดักน้องควาย และจำนวนอึกที่ต้องดื่ม'
            : 'กติกาและบทลงโทษในรอบนี้'}
        </div>

        {/* 1. Total Teeth Configuration */}
        <div>
          <label className="text-xs font-bold text-gray-300 block mb-2">
            จำนวนซี่ฟันทั้งหมดในปาก:
          </label>
          {isHost ? (
            <div className="grid grid-cols-4 gap-2">
              {[8, 10, 12, 14].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => {
                    setTotalTeeth(cnt);
                    if (trapCount >= cnt) setTrapCount(cnt - 1);
                  }}
                  className={
                    'py-2 px-1 rounded-xl border text-center font-black transition text-xs ' +
                    (totalTeeth === cnt
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow ring-1 ring-amber-400/40'
                      : 'bg-[#220e04] border-[#481c05] text-gray-400 hover:bg-[#311406]')
                  }
                >
                  {cnt} ซี่
                </button>
              ))}
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-[#220e04] border border-[#481c05] text-xs font-black text-amber-300">
              {totalTeeth} ซี่
            </div>
          )}
        </div>

        {/* 2. Trap Count Configuration */}
        <div>
          <label className="text-xs font-bold text-gray-300 block mb-2 flex items-center justify-between">
            <span>จำนวนฟันกับดัก (ฟันผุที่จะงับ):</span>
            {safeTrapCount > 1 && (
              <span className="text-[10px] text-rose-400 font-normal">
                💥 โอกาสโดนงับสูงขึ้น!
              </span>
            )}
          </label>
          {isHost ? (
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((cnt) => {
                const disabled = cnt >= totalTeeth;
                return (
                  <button
                    key={cnt}
                    type="button"
                    disabled={disabled}
                    onClick={() => setTrapCount(cnt)}
                    className={
                      'py-2.5 px-2 rounded-xl border text-center transition ' +
                      (safeTrapCount === cnt
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow ring-1 ring-rose-500/40 font-black'
                        : 'bg-[#220e04] border-[#481c05] text-gray-400 hover:bg-[#311406] font-bold') +
                      (disabled ? ' opacity-30 cursor-not-allowed' : '')
                    }
                  >
                    <div className="text-xs">{cnt} ซี่</div>
                    <div className="text-[9px] text-gray-400">
                      {cnt === 1 ? 'คลาสสิก' : cnt === 2 ? 'ระทึกขวัญ' : 'ดุเดือด!'}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-[#220e04] border border-[#481c05] text-xs font-black text-rose-300">
              {safeTrapCount} ซี่
            </div>
          )}
        </div>

        {/* 3. Penalty Drinks */}
        <div>
          <label className="text-xs font-bold text-gray-300 block mb-2">
            บทลงโทษเมื่อโดนงับ:
          </label>
          {isHost ? (
            <div className="grid grid-cols-2 gap-2">
              {[
                { count: 1, label: '1 อึก', desc: 'จิบเบาๆ พอเป็นพิธี' },
                { count: 2, label: '2 อึก', desc: 'มาตรฐานวงเหล้า' },
                { count: 3, label: '3 อึก', desc: 'เริ่มตึงเปรี๊ยะ' },
                { count: 4, label: 'หมดแก้ว! 🍾', desc: 'ชนแก้วยกเพียว' },
              ].map((opt) => (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => setDrinkCount(opt.count)}
                  className={
                    'p-2.5 rounded-2xl border text-left transition ' +
                    (drinkCount === opt.count
                      ? 'bg-amber-600/30 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                      : 'bg-[#220e04] border-[#481c05] hover:bg-[#311406]')
                  }
                >
                  <div className="text-xs font-black text-amber-300">{opt.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-[#220e04] border border-[#481c05] text-center">
              <div className="text-sm font-black text-amber-300">
                {drinkCount === 4 ? '🍾 ยกหมดแก้ว!' : `ดื่ม ${drinkCount} อึก`}
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-[#481c05] flex justify-end gap-2">
          {isHost ? (
            <>
              <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
                ยกเลิก
              </Button>
              <Button
                variant="wood-gold"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="px-5 font-black text-xs"
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
              </Button>
            </>
          ) : (
            <Button variant="wood-gold" size="sm" fullWidth onClick={onClose}>
              รับทราบ
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
