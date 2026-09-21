import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import {
  BookOpen,
  Dices,
  Home,
  Building2,
  Zap,
  ShieldAlert,
  Gift,
  HelpCircle,
  Coins,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'dice' | 'properties' | 'corners' | 'cards' | 'discord';

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📖 กติกาการเล่น ซุปเปอร์เศรษฐี"
      className="max-w-2xl"
    >
      <div className="flex flex-col gap-3 py-1">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-[rgb(var(--c-surface-2))]">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-mint text-[rgb(var(--c-on-accent))] shadow'
                : 'text-[rgb(var(--c-on-accent))]/85 hover:text-[rgb(var(--c-ink))] bg-[rgb(var(--c-bg-deep))]'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>ภาพรวม</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dice')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition flex items-center gap-1.5 ${
              activeTab === 'dice'
                ? 'bg-mint text-[rgb(var(--c-on-accent))] shadow'
                : 'text-[rgb(var(--c-on-accent))]/85 hover:text-[rgb(var(--c-ink))] bg-[rgb(var(--c-bg-deep))]'
            }`}
          >
            <Dices className="w-3.5 h-3.5" />
            <span>การทอยเต๋า</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('properties')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition flex items-center gap-1.5 ${
              activeTab === 'properties'
                ? 'bg-mint text-[rgb(var(--c-on-accent))] shadow'
                : 'text-[rgb(var(--c-on-accent))]/85 hover:text-[rgb(var(--c-ink))] bg-[rgb(var(--c-bg-deep))]'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>ที่ดิน & ค่าเช่า</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('corners')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition flex items-center gap-1.5 ${
              activeTab === 'corners'
                ? 'bg-mint text-[rgb(var(--c-on-accent))] shadow'
                : 'text-[rgb(var(--c-on-accent))]/85 hover:text-[rgb(var(--c-ink))] bg-[rgb(var(--c-bg-deep))]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>4 มุม & คุก</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cards')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition flex items-center gap-1.5 ${
              activeTab === 'cards'
                ? 'bg-mint text-[rgb(var(--c-on-accent))] shadow'
                : 'text-[rgb(var(--c-on-accent))]/85 hover:text-[rgb(var(--c-ink))] bg-[rgb(var(--c-bg-deep))]'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>การ์ดดวง/สมบัติ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('discord')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition flex items-center gap-1.5 ${
              activeTab === 'discord'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow'
                : 'text-amber-300/85 hover:text-[rgb(var(--c-ink))] bg-[rgb(var(--c-bg-deep))]'
            }`}
          >
            <span>🎮 เล่นบน Discord</span>
          </button>
        </div>

        {/* Tab Content Box */}
        <div className="max-h-[55vh] overflow-y-auto pr-1 text-left space-y-3">
          {/* TAB 1: ภาพรวม */}
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[rgb(var(--c-bg-deep))] border border-[rgb(var(--c-surface-2))] shadow-sm">
                <h4 className="text-sm font-black text-amber-300 flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span>เป้าหมายของเกม (Objective)</span>
                </h4>
                <p className="text-xs text-amber-100 font-medium leading-relaxed">
                  ผู้เล่นแต่ละคนจะเริ่มต้นด้วยทุน <strong className="text-yellow-300">15.0M</strong> เดินวนรอบกระดาน 40 ช่อง ซื้อที่ดิน สร้างบ้าน และโรงแรม เพื่อดักเก็บค่าเช่าจากผู้เล่นคนอื่น ใครที่เงินสดหมดจนล้มละลายจะต้องออกจากเกม ผู้ที่มีทรัพย์สินและเงินสดสูงสุดจะเป็นผู้ชนะ!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-3))]">
                  <div className="text-xs font-black text-amber-300 flex items-center gap-1.5 mb-1">
                    <span>💵 ทุนเริ่มต้น</span>
                  </div>
                  <p className="text-xs text-amber-200/90 font-medium">
                    ทุกคนเริ่มเกมด้วยเงินสด <strong className="text-yellow-400">15.0M</strong>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-3))]">
                  <div className="text-xs font-black text-amber-300 flex items-center gap-1.5 mb-1">
                    <span>🏁 เงินเดือนรอบละ</span>
                  </div>
                  <p className="text-xs text-amber-200/90 font-medium">
                    เดินผ่านหรือตกจุดเริ่มต้น รับทันที <strong className="text-emerald-400">+2.0M</strong>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-3))]">
                  <div className="text-xs font-black text-amber-300 flex items-center gap-1.5 mb-1">
                    <span>💀 การล้มละลาย</span>
                  </div>
                  <p className="text-xs text-amber-200/90 font-medium">
                    หากเงินไม่พอจ่ายค่าเช่าหรือค่าปรับ จะถือว่าล้มละลายทันที
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-3))]">
                  <div className="text-xs font-black text-amber-300 flex items-center gap-1.5 mb-1">
                    <span>🏆 การชนะเกม</span>
                  </div>
                  <p className="text-xs text-amber-200/90 font-medium">
                    เหลือรอดเป็นคนสุดท้าย หรือมีมูลค่าทรัพย์สินรวมสูงสุดเมื่อจบเกม
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: การทอยเต๋า */}
          {activeTab === 'dice' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[rgb(var(--c-bg-deep))] border border-[rgb(var(--c-surface-2))]">
                <h4 className="text-sm font-black text-amber-300 flex items-center gap-2 mb-1.5">
                  <Dices className="w-4 h-4 text-yellow-400" />
                  <span>ระบบลูกเต๋าคู่ (Double Dice)</span>
                </h4>
                <p className="text-xs text-amber-100 font-medium leading-relaxed">
                  เกมใช้ลูกเต๋า 2 ลูกพร้อมกัน ผลรวมแต้มจะอยู่ระหว่าง <strong className="text-yellow-300">2 ถึง 12 ช่อง</strong> ตัวหมากจะเดินวนตามเข็มนาฬิกาทีละก้าว
                </p>
              </div>

              <div className="p-3 rounded-xl bg-gradient-to-r from-[rgb(var(--c-surface))] to-[rgb(var(--c-surface-2))] border-2 border-yellow-500/40">
                <div className="flex items-center gap-2 text-yellow-300 text-xs font-black mb-1">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span>สิทธิพิเศษ: ทอยได้แต้มคู่ (Double)!</span>
                </div>
                <p className="text-xs text-amber-200/90 font-medium leading-relaxed">
                  เมื่อทอยลูกเต๋าได้แต้มเหมือนกันทั้ง 2 ลูก (เช่น 1-1, 3-3, 6-6) หลังจากเดินและทำกิจกรรมในช่องนั้นเสร็จสิ้น คุณจะได้รับสิทธิ์ <strong className="text-yellow-300">"ทอยเต๋าเดินต่ออีกรอบทันที"</strong> โดยไม่ต้องสลับตาให้ผู้เล่นคนถัดไป!
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-3))]">
                <div className="text-xs font-black text-amber-300 flex items-center gap-1.5 mb-1">
                  <span>🚶 การเดินผ่านจุดเริ่มต้น (GO)</span>
                </div>
                <p className="text-xs text-amber-200/90 font-medium">
                  ไม่ว่าจะเดินผ่าน หรือทอยแต้มตกพอดีที่ช่อง 0 (จุดเริ่มต้น) ระบบจะโอนเงินเดือน <strong className="text-emerald-400">+2.0M</strong> เข้าบัญชีทันทีอัตโนมัติ
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: ที่ดิน & ค่าเช่า */}
          {activeTab === 'properties' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[rgb(var(--c-bg-deep))] border border-[rgb(var(--c-surface-2))]">
                <h4 className="text-sm font-black text-amber-300 flex items-center gap-2 mb-1.5">
                  <Home className="w-4 h-4 text-yellow-400" />
                  <span>การซื้อที่ดินและสร้างสิ่งปลูกสร้าง</span>
                </h4>
                <div className="space-y-2 text-xs text-amber-100 font-medium leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">1.</span>
                    <p><strong>ที่ดินว่าง:</strong> เมื่อเดินมาตกช่องที่ดินที่ยังไม่มีใครครอบครอง สามารถเลือกซื้อโฉนดได้ตามราคาที่ระบุ</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">2.</span>
                    <p><strong>สร้างบ้าน:</strong> เมื่อเดินมาตกที่ดินของตนเอง สามารถจ่ายเงินสร้างบ้านเพิ่มได้ (สูงสุด 3 หลัง 🏠🏠🏠) เพื่อเพิ่มค่าเช่า</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">3.</span>
                    <p><strong>อัปเกรดเป็นโรงแรม:</strong> เมื่อมีบ้านครบ 3 หลัง และเดินมาตกอีกครั้ง สามารถอัปเกรดเป็นโรงแรมหรู 🏨 เพื่อคิดค่าเช่าสูงสุดในระดับมหาเศรษฐี!</p>
                  </div>
                </div>
              </div>

              {/* Utilities */}
              <div className="p-3 rounded-2xl bg-[rgb(var(--c-surface))] border-2 border-cyan-700/60 shadow-sm">
                <h4 className="text-sm font-black text-cyan-300 flex items-center gap-2 mb-1.5">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>กิจการสาธารณูปโภค (Utilities)</span>
                </h4>
                <p className="text-xs text-amber-100 font-medium leading-relaxed mb-2">
                  ประกอบด้วย <strong className="text-cyan-300">การประปานครหลวง (ช่อง 5)</strong> และ <strong className="text-yellow-300">โรงไฟฟ้านครหลวง (ช่อง 12)</strong>:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[rgb(var(--c-bg-deep))] p-2 rounded-xl border border-cyan-800 text-center">
                    <span className="text-amber-400 block font-bold">ถือครอง 1 แห่ง</span>
                    <span className="text-sm font-black text-yellow-300">ค่าเช่า 0.5M</span>
                  </div>
                  <div className="bg-[rgb(var(--c-bg-deep))] p-2 rounded-xl border border-cyan-800 text-center">
                    <span className="text-cyan-300 block font-bold">ถือครองครบ 2 แห่ง</span>
                    <span className="text-sm font-black text-emerald-400">ค่าเช่า 1.2M ทันที!</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 4 มุม & คุก */}
          {activeTab === 'corners' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[rgb(var(--c-bg-deep))] border border-[rgb(var(--c-surface-2))]">
                <h4 className="text-sm font-black text-amber-300 flex items-center gap-2 mb-1.5">
                  <ShieldAlert className="w-4 h-4 text-yellow-400" />
                  <span>จุดพิเศษทั้ง 4 มุมกระดาน</span>
                </h4>
                <p className="text-xs text-amber-200/80 font-medium mb-2">
                  ในกระดานจะมีจุดพิเศษเพียง 4 มุมเท่านั้น (ช่องอื่นๆ เป็นที่ดิน โรงแรม สาธารณูปโภค และการ์ด):
                </p>

                <div className="space-y-2">
                  {/* Start 0 */}
                  <div className="p-2.5 rounded-xl bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-3))] flex items-start gap-2.5">
                    <span className="text-xl">🏁</span>
                    <div>
                      <span className="text-xs font-black text-yellow-300 block">ช่อง 0: จุดเริ่มต้น (GO)</span>
                      <span className="text-[11px] text-amber-100 font-medium">เดินผ่านหรือตกช่องนี้ รับเงินเดือน 2.0M ทันที</span>
                    </div>
                  </div>

                  {/* Jail 10 */}
                  <div className="p-2.5 rounded-xl bg-[rgb(var(--c-surface))] border-2 border-orange-700/60 flex items-start gap-2.5">
                    <span className="text-xl">⛓️</span>
                    <div>
                      <span className="text-xs font-black text-orange-300 block">ช่อง 10: ห้องขัง (Jail) - ตกเองก็ติด</span>
                      <span className="text-[11px] text-amber-100 font-medium block leading-relaxed">
                        เดินมาตกช่องนี้เอง หรือถูกส่งมาจากช่อง 30 ก็ติดคุกเหมือนกัน ตาถัดไปของคุณจะเลือกได้ 2 ทาง:
                      </span>
                      <ul className="list-disc list-inside text-[11px] text-amber-200/90 font-medium mt-1 space-y-0.5">
                        <li><strong>จ่ายค่าปรับ:</strong> เสียเงิน 0.5M ออกจากคุกและทอยเต๋าต่อได้ในตานั้นเลย</li>
                        <li><strong>รับโทษ:</strong> ยอมหยุดเล่น 1 ตา แล้วรอบถัดไปจึงเดินได้ตามปกติ</li>
                      </ul>
                    </div>
                  </div>

                  {/* Rest 20 */}
                  <div className="p-2.5 rounded-xl bg-[rgb(var(--c-sky-soft))] border-2 border-sky-600/60 flex items-start gap-2.5">
                    <span className="text-xl">🏖️</span>
                    <div>
                      <span className="text-xs font-black text-sky-300 block">ช่อง 20: จุดพักผ่อน (Rest Area)</span>
                      <span className="text-[11px] text-amber-100 font-medium">
                        เมื่อเดินมาตกช่องนี้ ปลอดภัยจากค่าผ่านทาง แต่ต้องพัก 1 ตาในรอบถัดไป (ถึงทอยได้แต้มคู่ก็ไม่ได้ทอยต่อ)
                      </span>
                    </div>
                  </div>

                  {/* Go To Jail 30 */}
                  <div className="p-2.5 rounded-xl bg-[rgb(var(--c-surface))] border-2 border-red-700/60 flex items-start gap-2.5">
                    <span className="text-xl">🚨</span>
                    <div>
                      <span className="text-xs font-black text-sky-300 block">ช่อง 30: สนามบิน (Airport)</span>
                      <span className="text-[11px] text-amber-100 font-medium">
                        เลือกบินไปลงช่องไหนก็ได้บนกระดาน ถ้ามาตกตอนทอยได้แต้มคู่จะบินได้ทันที ถ้าทอยปกติจะได้บินในตาถัดไป (ตานั้นไม่ต้องทอยเต๋า) และถ้าเส้นทางผ่านจุดเริ่มต้นก็รับเงินเดือน 2.0M ตามปกติ
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: การ์ดดวง/สมบัติ */}
          {activeTab === 'cards' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-gradient-to-b from-[rgb(var(--c-berry-soft))] to-[rgb(var(--c-surface-2))] border-2 border-pink-700/60">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-2xl">🎁</span>
                    <h4 className="text-xs font-black text-pink-300">หีบสมบัติ (Chest)</h4>
                  </div>
                  <p className="text-[11px] text-amber-100 font-medium leading-relaxed">
                    สุ่มเปิดการ์ดโชคลาภ เช่น เงินรางวัลมรดก, ลอตเตอรี่ถูกรางวัล, ได้รับของขวัญจากเพื่อน หรือเงินปันผลธุรกิจ
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-gradient-to-b from-[rgb(var(--c-surface-2))] to-[rgb(var(--c-surface))] border-2 border-yellow-600/60">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-2xl">⛩️</span>
                    <h4 className="text-xs font-black text-yellow-300">ประตูดวง (Chance)</h4>
                  </div>
                  <p className="text-[11px] text-amber-100 font-medium leading-relaxed">
                    สุ่มเปิดการ์ดชะตากรรม เช่น จ่ายค่าซ่อมแซมบ้าน, เสียภาษีทรัพย์สิน, ย้ายตำแหน่งเดินไปข้างหน้า หรือคำสั่งพิเศษ
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-3))]">
                <div className="text-xs font-black text-amber-300 flex items-center gap-1.5 mb-1">
                  <span>💡 คำแนะนำสำหรับมหาเศรษฐี</span>
                </div>
                <p className="text-xs text-amber-200/90 font-medium leading-relaxed">
                  พยายามสะสมที่ดินในแถบเดียวกัน หรือคว้าสัมปทานการประปาและโรงไฟฟ้าเพื่อผูกขาดรายได้ และคอยบริหารเงินสดสำรองไว้เสมอเพื่อไม่ให้ล้มละลายเมื่อตกบ้านของศัตรู!
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: วิธีเล่นบน Discord */}
          {activeTab === 'discord' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-[rgb(var(--c-sky-soft))] border-2 border-[#5865F2]/70 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2 text-[#5865F2] font-black text-sm">
                  <span className="text-xl">🚀</span>
                  <span className="text-white font-extrabold">ขั้นตอนการเข้าเล่นผ่าน Discord Activity (ห้องเสียง)</span>
                </div>
                <p className="text-xs text-indigo-200/90 font-medium leading-relaxed">
                  ผู้เล่นสามารถเปิดเล่นพร้อมเพื่อนใน Voice Channel บน Discord ได้ทันทีแบบเรียลไทม์:
                </p>

                <div className="space-y-2 text-xs text-indigo-100">
                  <div className="flex items-start gap-2 bg-[rgb(var(--c-surface-2))] p-2.5 rounded-xl border border-[#5865F2]/30">
                    <span className="font-black text-[rgb(var(--c-ink))] bg-[rgb(var(--c-butter-soft))] px-2 py-0.5 rounded-md shrink-0">1</span>
                    <span>เข้าไปที่ห้องคุยเสียง (<strong>Voice Channel</strong>) บน Discord Server ที่กำลังคุยกับเพื่อนๆ</span>
                  </div>
                  <div className="flex items-start gap-2 bg-[rgb(var(--c-surface-2))] p-2.5 rounded-xl border border-[#5865F2]/30">
                    <span className="font-black text-[rgb(var(--c-ink))] bg-[rgb(var(--c-butter-soft))] px-2 py-0.5 rounded-md shrink-0">2</span>
                    <span>กดที่ปุ่มไอคอนรูปจรวด <strong>🚀 (Start an Activity / เริ่มกิจกรรม)</strong> ตรงแถบเมนูด้านล่างข้างปุ่มไมโครโฟน</span>
                  </div>
                  <div className="flex items-start gap-2 bg-[rgb(var(--c-surface-2))] p-2.5 rounded-xl border border-[#5865F2]/30">
                    <span className="font-black text-[rgb(var(--c-ink))] bg-[rgb(var(--c-butter-soft))] px-2 py-0.5 rounded-md shrink-0">3</span>
                    <span>ค้นหาและเลือกแอป <strong>"Party Games"</strong> หรือ <strong>"Drink Games"</strong></span>
                  </div>
                  <div className="flex items-start gap-2 bg-[rgb(var(--c-surface-2))] p-2.5 rounded-xl border border-[#5865F2]/30">
                    <span className="font-black text-[rgb(var(--c-ink))] bg-[rgb(var(--c-butter-soft))] px-2 py-0.5 rounded-md shrink-0">4</span>
                    <span>เลือก <strong>"ซุปเปอร์เศรษฐี"</strong> ➔ กดเข้าร่วมห้องแล้วใส่รหัสห้อง หรือหากมีเพื่อนเปิดกิจกรรมอยู่แล้ว สามารถกดปุ่ม <strong>"Join Activity"</strong> เพื่อเข้าร่วมเล่นได้ทันที!</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-surface-3))] space-y-1 text-xs">
                <div className="font-black text-amber-300 flex items-center gap-1.5">
                  <span>🌐 เล่นผ่านเว็บบราวเซอร์ / มือถือ</span>
                </div>
                <p className="text-amber-200/90 font-medium leading-relaxed">
                  สำหรับเพื่อนที่ไม่ได้อยู่ในห้องเสียง สามารถคัดลอกลิงก์ห้องส่งให้เพื่อนเปิดบนมือถือหรือคอมพิวเตอร์ผ่านเบราว์เซอร์ เพื่อร่วมวงเล่นกระดานเดียวกันได้ทันที!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Close Button */}
        <div className="pt-2 border-t border-[rgb(var(--c-surface-2))] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-mint hover:from-amber-500 hover:to-yellow-400 text-[rgb(var(--c-on-accent))] font-black text-xs shadow-lg transition active:scale-95"
          >
            เข้าใจแล้ว ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </Modal>
  );
};
