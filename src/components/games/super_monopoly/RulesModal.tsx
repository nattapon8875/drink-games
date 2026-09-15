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

type TabType = 'overview' | 'dice' | 'properties' | 'corners' | 'cards';

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
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-[#4d1f06]">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-amber-950 shadow'
                : 'text-amber-300/70 hover:text-white bg-[#1a0801]'
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
                ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-amber-950 shadow'
                : 'text-amber-300/70 hover:text-white bg-[#1a0801]'
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
                ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-amber-950 shadow'
                : 'text-amber-300/70 hover:text-white bg-[#1a0801]'
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
                ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-amber-950 shadow'
                : 'text-amber-300/70 hover:text-white bg-[#1a0801]'
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
                ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-amber-950 shadow'
                : 'text-amber-300/70 hover:text-white bg-[#1a0801]'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>การ์ดดวง/สมบัติ</span>
          </button>
        </div>

        {/* Tab Content Box */}
        <div className="max-h-[55vh] overflow-y-auto pr-1 text-left space-y-3">
          {/* TAB 1: ภาพรวม */}
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[#1d0801] border border-[#4a1c06] shadow-sm">
                <h4 className="text-sm font-black text-amber-300 flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span>เป้าหมายของเกม (Objective)</span>
                </h4>
                <p className="text-xs text-amber-100 font-medium leading-relaxed">
                  ผู้เล่นแต่ละคนจะเริ่มต้นด้วยทุน <strong className="text-yellow-300">15.0M</strong> เดินวนรอบกระดาน 40 ช่อง ซื้อที่ดิน สร้างบ้าน และโรงแรม เพื่อดักเก็บค่าเช่าจากผู้เล่นคนอื่น ใครที่เงินสดหมดจนล้มละลายจะต้องออกจากเกม ผู้ที่มีทรัพย์สินและเงินสดสูงสุดจะเป็นผู้ชนะ!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-[#260e03] border border-[#522007]">
                  <div className="text-xs font-black text-amber-300 flex items-center gap-1.5 mb-1">
                    <span>💵 ทุนเริ่มต้น</span>
                  </div>
                  <p className="text-xs text-amber-200/90 font-medium">
                    ทุกคนเริ่มเกมด้วยเงินสด <strong className="text-yellow-400">15.0M</strong>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#260e03] border border-[#522007]">
                  <div className="text-xs font-black text-amber-300 flex items-center gap-1.5 mb-1">
                    <span>🏁 เงินเดือนรอบละ</span>
                  </div>
                  <p className="text-xs text-amber-200/90 font-medium">
                    เดินผ่านหรือตกจุดเริ่มต้น รับทันที <strong className="text-emerald-400">+2.0M</strong>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#260e03] border border-[#522007]">
                  <div className="text-xs font-black text-amber-300 flex items-center gap-1.5 mb-1">
                    <span>💀 การล้มละลาย</span>
                  </div>
                  <p className="text-xs text-amber-200/90 font-medium">
                    หากเงินไม่พอจ่ายค่าเช่าหรือค่าปรับ จะถือว่าล้มละลายทันที
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#260e03] border border-[#522007]">
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
              <div className="p-3 rounded-2xl bg-[#1d0801] border border-[#4a1c06]">
                <h4 className="text-sm font-black text-amber-300 flex items-center gap-2 mb-1.5">
                  <Dices className="w-4 h-4 text-yellow-400" />
                  <span>ระบบลูกเต๋าคู่ (Double Dice)</span>
                </h4>
                <p className="text-xs text-amber-100 font-medium leading-relaxed">
                  เกมใช้ลูกเต๋า 2 ลูกพร้อมกัน ผลรวมแต้มจะอยู่ระหว่าง <strong className="text-yellow-300">2 ถึง 12 ช่อง</strong> ตัวหมากจะเดินวนตามเข็มนาฬิกาทีละก้าว
                </p>
              </div>

              <div className="p-3 rounded-xl bg-gradient-to-r from-[#311102] to-[#421703] border-2 border-yellow-500/40">
                <div className="flex items-center gap-2 text-yellow-300 text-xs font-black mb-1">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span>สิทธิพิเศษ: ทอยได้แต้มคู่ (Double)!</span>
                </div>
                <p className="text-xs text-amber-200/90 font-medium leading-relaxed">
                  เมื่อทอยลูกเต๋าได้แต้มเหมือนกันทั้ง 2 ลูก (เช่น 1-1, 3-3, 6-6) หลังจากเดินและทำกิจกรรมในช่องนั้นเสร็จสิ้น คุณจะได้รับสิทธิ์ <strong className="text-yellow-300">"ทอยเต๋าเดินต่ออีกรอบทันที"</strong> โดยไม่ต้องสลับตาให้ผู้เล่นคนถัดไป!
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#260e03] border border-[#522007]">
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
              <div className="p-3 rounded-2xl bg-[#1d0801] border border-[#4a1c06]">
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
              <div className="p-3 rounded-2xl bg-[#2b1002] border-2 border-cyan-700/60 shadow-sm">
                <h4 className="text-sm font-black text-cyan-300 flex items-center gap-2 mb-1.5">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>กิจการสาธารณูปโภค (Utilities)</span>
                </h4>
                <p className="text-xs text-amber-100 font-medium leading-relaxed mb-2">
                  ประกอบด้วย <strong className="text-cyan-300">การประปานครหลวง (ช่อง 5)</strong> และ <strong className="text-yellow-300">โรงไฟฟ้านครหลวง (ช่อง 12)</strong>:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#190901] p-2 rounded-xl border border-cyan-800 text-center">
                    <span className="text-amber-400 block font-bold">ถือครอง 1 แห่ง</span>
                    <span className="text-sm font-black text-yellow-300">ค่าเช่า 0.5M</span>
                  </div>
                  <div className="bg-[#190901] p-2 rounded-xl border border-cyan-800 text-center">
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
              <div className="p-3 rounded-2xl bg-[#1d0801] border border-[#4a1c06]">
                <h4 className="text-sm font-black text-amber-300 flex items-center gap-2 mb-1.5">
                  <ShieldAlert className="w-4 h-4 text-yellow-400" />
                  <span>จุดพิเศษทั้ง 4 มุมกระดาน</span>
                </h4>
                <p className="text-xs text-amber-200/80 font-medium mb-2">
                  ในกระดานจะมีจุดพิเศษเพียง 4 มุมเท่านั้น (ช่องอื่นๆ เป็นที่ดิน โรงแรม สาธารณูปโภค และการ์ด):
                </p>

                <div className="space-y-2">
                  {/* Start 0 */}
                  <div className="p-2.5 rounded-xl bg-[#260d02] border border-[#572005] flex items-start gap-2.5">
                    <span className="text-xl">🏁</span>
                    <div>
                      <span className="text-xs font-black text-yellow-300 block">ช่อง 0: จุดเริ่มต้น (GO)</span>
                      <span className="text-[11px] text-amber-100 font-medium">เดินผ่านหรือตกช่องนี้ รับเงินเดือน 2.0M ทันที</span>
                    </div>
                  </div>

                  {/* Jail 10 */}
                  <div className="p-2.5 rounded-xl bg-[#2e0e07] border-2 border-orange-700/60 flex items-start gap-2.5">
                    <span className="text-xl">⛓️</span>
                    <div>
                      <span className="text-xs font-black text-orange-300 block">ช่อง 10: ห้องขัง (Jail)</span>
                      <span className="text-[11px] text-amber-100 font-medium block leading-relaxed">
                        เมื่อถูกส่งเข้าคุก คุณจะไม่สามารถทอยเต๋าได้ โดยสามารถเลือกจัดการได้ 3 วิธี:
                      </span>
                      <ul className="list-disc list-inside text-[11px] text-amber-200/90 font-medium mt-1 space-y-0.5">
                        <li><strong>หยุดรับโทษ:</strong> ยอมหยุดเล่น 1 ตา เพื่อปลดปล่อยในรอบถัดไป</li>
                        <li><strong>จ่ายค่าปรับ:</strong> เสียเงิน 0.5M เพื่อปล่อยตัวและทอยเต๋าได้ทันที</li>
                        <li><strong>ดื่ม 1 ช็อต:</strong> (โหมดปาร์ตี้) ดื่มเครื่องดื่มเพื่อปลดปล่อยทันทีโดยไม่เสียเงิน!</li>
                      </ul>
                    </div>
                  </div>

                  {/* Rest 20 */}
                  <div className="p-2.5 rounded-xl bg-[#0c242e] border-2 border-sky-600/60 flex items-start gap-2.5">
                    <span className="text-xl">🏖️</span>
                    <div>
                      <span className="text-xs font-black text-sky-300 block">ช่อง 20: จุดพักผ่อน (Rest Area)</span>
                      <span className="text-[11px] text-amber-100 font-medium">
                        เมื่อเดินมาตกช่องนี้ จะต้องหยุดพัก 1 ตาในรอบถัดไป (ข้ามการทอยลูกเต๋า 1 รอบ)
                      </span>
                    </div>
                  </div>

                  {/* Go To Jail 30 */}
                  <div className="p-2.5 rounded-xl bg-[#360909] border-2 border-red-700/60 flex items-start gap-2.5">
                    <span className="text-xl">🚨</span>
                    <div>
                      <span className="text-xs font-black text-red-300 block">ช่อง 30: ไปห้องขัง (Go to Jail)</span>
                      <span className="text-[11px] text-amber-100 font-medium">
                        เมื่อเดินมาตกช่องนี้ จะถูกส่งตัวเข้าห้องขัง (ช่อง 10) โดยตรงทันที และไม่ได้รับเงินเดือนผ่านจุดเริ่มต้น!
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
                <div className="p-3 rounded-2xl bg-gradient-to-b from-[#2e0d16] to-[#1c080e] border-2 border-pink-700/60">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-2xl">🎁</span>
                    <h4 className="text-xs font-black text-pink-300">หีบสมบัติ (Chest)</h4>
                  </div>
                  <p className="text-[11px] text-amber-100 font-medium leading-relaxed">
                    สุ่มเปิดการ์ดโชคลาภ เช่น เงินรางวัลมรดก, ลอตเตอรี่ถูกรางวัล, ได้รับของขวัญจากเพื่อน หรือเงินปันผลธุรกิจ
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-gradient-to-b from-[#331c03] to-[#1c0e01] border-2 border-yellow-600/60">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-2xl">⛩️</span>
                    <h4 className="text-xs font-black text-yellow-300">ประตูดวง (Chance)</h4>
                  </div>
                  <p className="text-[11px] text-amber-100 font-medium leading-relaxed">
                    สุ่มเปิดการ์ดชะตากรรม เช่น จ่ายค่าซ่อมแซมบ้าน, เสียภาษีทรัพย์สิน, ย้ายตำแหน่งเดินไปข้างหน้า หรือคำสั่งพิเศษ
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#260e03] border border-[#522007]">
                <div className="text-xs font-black text-amber-300 flex items-center gap-1.5 mb-1">
                  <span>💡 คำแนะนำสำหรับมหาเศรษฐี</span>
                </div>
                <p className="text-xs text-amber-200/90 font-medium leading-relaxed">
                  พยายามสะสมที่ดินในแถบเดียวกัน หรือคว้าสัมปทานการประปาและโรงไฟฟ้าเพื่อผูกขาดรายได้ และคอยบริหารเงินสดสำรองไว้เสมอเพื่อไม่ให้ล้มละลายเมื่อตกบ้านของศัตรู!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Close Button */}
        <div className="pt-2 border-t border-[#4d1f06] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-amber-950 font-black text-xs shadow-lg transition active:scale-95"
          >
            เข้าใจแล้ว ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </Modal>
  );
};
