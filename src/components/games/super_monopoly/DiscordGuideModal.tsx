import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import {
  Copy,
  Check,
  Share2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { showToast } from '@/lib/alerts';

interface DiscordGuideModalProps {
  isOpen: boolean;
  roomCode: string;
  onClose: () => void;
}

export const DiscordGuideModal: React.FC<DiscordGuideModalProps> = ({
  isOpen,
  roomCode,
  onClose,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://drink.buffydevs.com';
  const inviteUrl = `${origin}/super/lobby/${roomCode}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      showToast(`คัดลอกรหัสห้อง ${roomCode} เรียบร้อย!`, 'success');
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      showToast('ไม่สามารถคัดลอกได้ กรุณาลองใหม่', 'warning');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      showToast('คัดลอกลิงก์เข้าห้องเรียบร้อย!', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      showToast('ไม่สามารถคัดลอกได้ กรุณาลองใหม่', 'warning');
    }
  };

  const handleCopyFullMessage = async () => {
    const message = `🎲 ขอเชิญร่วมวงประลอง "ซุปเปอร์เศรษฐี คลาสสิก"!\n🔑 รหัสห้อง: ${roomCode}\n🔗 ลิงก์เข้าห้อง: ${inviteUrl}\n(เล่นผ่าน Discord Activity หรือกดเปิดลิงก์บน Browser ได้ทันที)`;
    try {
      await navigator.clipboard.writeText(message);
      setCopiedMsg(true);
      showToast('คัดลอกข้อความชวนเพื่อนเรียบร้อย! นำไปวางในแชทได้เลย', 'success');
      setTimeout(() => setCopiedMsg(false), 2500);
    } catch {
      showToast('ไม่สามารถคัดลอกได้ กรุณาลองใหม่', 'warning');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🎮 รหัสห้อง & ขั้นตอนการเข้า Discord"
      className="max-w-xl"
    >
      <div className="flex flex-col gap-4 py-1">
        {/* Quick Copy Section */}
        <div className="p-3.5 rounded-2xl bg-[rgb(var(--c-bg-deep))] border-2 border-[rgb(var(--c-surface-3))] shadow-inner flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-yellow-400" />
              <span>ข้อมูลห้องสำหรับแชร์ให้เพื่อน:</span>
            </span>
            <span className="text-[10px] font-mono text-amber-400/80 font-bold">
              SUPER MONOPOLY
            </span>
          </div>

          {/* Row: Code + Copy Code */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[rgb(var(--c-surface-2))] border border-[rgb(var(--c-surface-2))] rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300/80">รหัสห้อง:</span>
              <span className="font-mono text-lg font-black text-yellow-300 tracking-wider">
                {roomCode}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3.5 py-2.5 rounded-xl bg-[rgb(var(--c-surface-2))] hover:bg-[rgb(var(--c-surface-3))] border border-[rgb(var(--c-line))] text-xs font-black text-yellow-300 hover:text-[rgb(var(--c-ink))] flex items-center gap-1.5 shadow active:scale-95 transition cursor-pointer shrink-0"
              title="คัดลอกเฉพาะรหัส 6 ตัว"
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>คัดลอกรหัส</span>
                </>
              )}
            </button>
          </div>

          {/* Row: Link + Copy Link */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[rgb(var(--c-surface-2))] border border-[rgb(var(--c-surface-2))] rounded-xl px-3 py-2 text-xs font-mono text-amber-200/80 truncate">
              {inviteUrl}
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="wood-btn-gold px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow active:scale-95 transition cursor-pointer shrink-0"
              title="คัดลอกลิงก์ตรงสำหรับเปิดบนบราวเซอร์"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-[rgb(var(--c-mint-label))]" />
                  <span>คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  <span>คัดลอกลิงก์</span>
                </>
              )}
            </button>
          </div>

          {/* Copy Full Message Button */}
          <button
            type="button"
            onClick={handleCopyFullMessage}
            className="w-full py-2.5 rounded-xl bg-mint hover:from-amber-600 hover:to-amber-500 border border-yellow-500/50 text-xs font-black text-[rgb(var(--c-on-accent))] flex items-center justify-center gap-2 shadow active:scale-95 transition cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-yellow-300" />
            <span>
              {copiedMsg ? 'คัดลอกข้อความแล้ว! นำไปวางใน Discord ได้ทันที' : 'คัดลอกข้อความชวนเพื่อน (พร้อมรหัส + ลิงก์)'}
            </span>
          </button>
        </div>

        {/* Discord Join Guide Steps */}
        <div className="max-h-[46vh] overflow-y-auto pr-1 space-y-3 text-left">
          {/* Option 1: Discord Activity */}
          <div className="p-3.5 rounded-2xl bg-[rgb(var(--c-sky-soft))] border-2 border-[#5865F2]/60 shadow-md space-y-2.5">
            <div className="flex items-center gap-2 text-[rgb(var(--c-grape))] font-black text-sm">
              <span className="text-xl">🚀</span>
              <span className="text-white font-extrabold">วิธีที่ 1: เข้าเล่นผ่าน Discord Activity (ในห้องเสียง)</span>
            </div>
            <p className="text-xs text-[rgb(var(--c-ink-soft))] font-medium leading-relaxed">
              เหมาะสำหรับเพื่อนๆ ที่กำลังพูดคุยอยู่ใน Voice Channel บน Discord:
            </p>

            <div className="space-y-2 text-xs text-[rgb(var(--c-ink))]">
              <div className="flex items-start gap-2 bg-[rgb(var(--c-surface-2))] p-2.5 rounded-xl border border-[#5865F2]/30">
                <span className="font-black text-[rgb(var(--c-ink))] bg-[rgb(var(--c-butter-soft))] px-2 py-0.5 rounded-md shrink-0">
                  ขั้นที่ 1
                </span>
                <span>
                  เข้าไปที่ห้องคุยเสียง (<strong>Voice Channel</strong>) ใน Discord Server กับเพื่อนๆ
                </span>
              </div>

              <div className="flex items-start gap-2 bg-[rgb(var(--c-surface-2))] p-2.5 rounded-xl border border-[#5865F2]/30">
                <span className="font-black text-[rgb(var(--c-ink))] bg-[rgb(var(--c-butter-soft))] px-2 py-0.5 rounded-md shrink-0">
                  ขั้นที่ 2
                </span>
                <span>
                  กดที่ปุ่มไอคอนรูปจรวด <strong>🚀 (Start an Activity / เริ่มกิจกรรม)</strong> ตรงแถบควบคุมด้านล่าง (ข้างปุ่มไมโครโฟน/แชร์จอ)
                </span>
              </div>

              <div className="flex items-start gap-2 bg-[rgb(var(--c-surface-2))] p-2.5 rounded-xl border border-[#5865F2]/30">
                <span className="font-black text-[rgb(var(--c-ink))] bg-[rgb(var(--c-butter-soft))] px-2 py-0.5 rounded-md shrink-0">
                  ขั้นที่ 3
                </span>
                <span>
                  เลือกแอป <strong>"Party Games"</strong> หรือ <strong>"Drink Games"</strong>
                </span>
              </div>

              <div className="flex items-start gap-2 bg-[rgb(var(--c-surface-2))] p-2.5 rounded-xl border border-[#5865F2]/30">
                <span className="font-black text-[rgb(var(--c-ink))] bg-[rgb(var(--c-butter-soft))] px-2 py-0.5 rounded-md shrink-0">
                  ขั้นที่ 4
                </span>
                <span>
                  <strong>ระบบ Auto-Sync:</strong> หากเพื่อนเปิดกิจกรรมในห้อง Voice เดียวกัน ระบบจะตรวจพบและพาเข้าห้อง <strong className="text-yellow-300 font-mono text-sm">{roomCode}</strong> ให้โดยอัตโนมัติทันที! (คนแรกที่เข้าจะสร้างห้องให้อัตโนมัติ คนถัดไปจะซิงก์เข้ามารวมกันทันทีโดยไม่ต้องกรอกรหัส)
                </span>
              </div>
            </div>
          </div>

          {/* Option 2: Web Browser Link */}
          <div className="p-3.5 rounded-2xl bg-[rgb(var(--c-bg-deep))] border border-[rgb(var(--c-surface-3))] shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
              <span className="text-xl">🌐</span>
              <span>วิธีที่ 2: เข้าเล่นผ่าน Web Browser (คอมพิวเตอร์ / มือถือ)</span>
            </div>
            <p className="text-xs text-amber-200/90 font-medium leading-relaxed">
              สำหรับเพื่อนที่สะดวกเล่นผ่านเบราว์เซอร์ โดยไม่ต้องเปิด Discord Activity:
            </p>

            <ul className="list-disc list-inside text-xs text-amber-100/90 font-medium space-y-1.5 pl-1">
              <li>
                <strong>คลิกลิงก์ตรง:</strong> ส่งลิงก์ห้องให้เพื่อนในช่องแชท เพื่อนคลิกแล้วจะเข้าสู่ห้องรอ (Lobby) ทันที
              </li>
              <li>
                <strong>เข้าผ่านหน้าเว็บ:</strong> เข้าไปที่ <span className="text-yellow-300 font-mono">https://drink.buffydevs.com/super</span> กดปุ่ม <strong>"เข้าร่วมห้อง"</strong> แล้วกรอกรหัสห้อง <span className="text-yellow-300 font-mono font-bold">{roomCode}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Close Button */}
        <div className="pt-2 border-t border-[rgb(var(--c-surface-2))] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 rounded-xl wood-btn-gold font-black text-xs shadow-lg active:scale-95 transition"
          >
            เข้าใจแล้ว ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </Modal>
  );
};
