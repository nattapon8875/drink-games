import { MonopolyTileRecord } from '@/types/database';

export const DEFAULT_MONOPOLY_TILES: MonopolyTileRecord[] = [
  { tile_index: 0, title: 'จุดเริ่มต้น (GO)', action_text: 'วนครบรอบหรือตกช่องนี้ สั่งใครก็ได้ดื่ม 2 จิบ', tile_type: 'order_others', icon: '🚩' },
  { tile_index: 1, title: 'ประเดิมวง', action_text: 'คนเดินตก ดื่มเองเบาๆ 1 จิบ', tile_type: 'drink', icon: '🍺' },
  { tile_index: 2, title: 'ซ้าย-ขวา สามัคคี', action_text: 'คนนั่งซ้ายและขวาของคนทอย ชนแก้วดื่มคนละ 1 จิบ', tile_type: 'drink', icon: '🍻' },
  { tile_index: 3, title: 'ทายหัวก้อย', action_text: 'ทายเหรียญ ถ้าทายผิดดื่ม 2 จิบ ถ้าถูกรอด', tile_type: 'challenge', icon: '🪙' },
  { tile_index: 4, title: 'ชี้เป้า', action_text: 'สั่งใครในวงก็ได้ดื่ม 1 ช็อต/จิบ', tile_type: 'order_others', icon: '🎯' },
  { tile_index: 5, title: 'รหัสต้องห้าม', action_text: 'ห้ามพูดคำว่า "กิน/ดื่ม/ชน" จนกว่าจะถึงตาหน้า ใครหลุดดื่ม 1 จิบ', tile_type: 'challenge', icon: '🤫' },
  { tile_index: 6, title: 'ตัวเต็งประจำโต๊ะ', action_text: 'โหวตชี้คนที่น่าจะเมาก่อนเพื่อน คนโดนชี้มากสุดดื่ม 1 จิบ', tile_type: 'order_others', icon: '👑' },
  { tile_index: 7, title: 'ห้องพยาบาล (พักยก)', action_text: 'จุดปลอดภัย นั่งพักหายใจ ไม่ต้องดื่มรอบนี้', tile_type: 'safe', icon: '🏥' },
  { tile_index: 8, title: 'ฉันไม่เคย...', action_text: 'คนตกช่องนี้พูดสิ่งที่ไม่เคยทำ 1 ข้อ ขึ้นต้นด้วย "ฉันไม่เคย..." ใครในวงที่ เคยทำ ต้องยกดื่มคนละ 1 จิบ (ถ้าไม่มีใครเคยทำเลย คนพูดต้องดื่มรับผิดชอบ 1 จิบ)', tile_type: 'challenge', icon: '🤫' },
  { tile_index: 9, title: 'เจ้าภาพใจดี', action_text: 'คนเดินตกต้องชนแก้วกับทุกคนในวง (ดื่มพร้อมกัน 1 จิบ)', tile_type: 'drink', icon: '🥂' },
  { tile_index: 10, title: 'ชายล้วน', action_text: 'ผู้ชายทุกคนในวง ดื่มคนละ 1 จิบ', tile_type: 'drink', icon: '⚔️' },
  { tile_index: 11, title: 'ยืมมือเพื่อน', action_text: 'ให้เพื่อนทางขวาทอยเต๋าแทน เลขคู่คนสั่งดื่ม คี่เพื่อนดื่ม', tile_type: 'challenge', icon: '🤝' },
  { tile_index: 12, title: 'หญิงแกร่ง', action_text: 'ผู้หญิงทุกคนในวง ดื่มคนละ 1 จิบ', tile_type: 'drink', icon: '🌸' },
  { tile_index: 13, title: 'ใบ้คำห้ามหลุดชื่อ', action_text: 'ให้เพื่อนทางขวาตั้งโจทย์คำอะไรก็ได้ 1 คำ จากนั้นคนตกกดปุ่ม เริ่มจับเวลา 20 วินาที บนหน้าจอ แล้วพูดใบ้อธิบายลักษณะได้เต็มที่แต่ห้ามพูดคำนั้นออกมาเด็ดขาด หากหมดเวลาไม่มีใครทายถูก คนใบ้โดนเพียว 1 ช็อต', tile_type: 'challenge', icon: '🎭' },
  { tile_index: 14, title: 'จุดจอดพักรถ', action_text: 'ช่องฟรี นั่งชิลล์ คุยเล่นได้ตามสบาย', tile_type: 'safe', icon: '⛺' },
  { tile_index: 15, title: 'สั่งคูณสอง', action_text: 'สั่งเพื่อน 1 คนดื่ม 2 จิบ หรือสั่ง 2 คน คนละ 1 จิบ', tile_type: 'order_others', icon: '✌️' },
  { tile_index: 16, title: '7-Up ล้มโต๊ะ', action_text: 'วนนับเลขตั้งแต่ 1 ไปเรื่อยๆ หากถึงเลขที่ลงท้ายด้วย 7 (7, 17, 27) หรือเลขที่ 7 หารลงตัว (14, 21, 28) ต้องพูดคำว่า "อัป!" ห้ามออกเสียงตัวเลขเด็ดขาด ใครพูดเลข หลุด หรือคิดช้าเกิน 3 วินาที ดื่ม 1 จิบ', tile_type: 'challenge', icon: '🆙' },
  { tile_index: 17, title: 'โสดโปรดดื่ม', action_text: 'คนที่มีสถานะโสดในวง ยกแก้วดื่มคนละ 1 จิบ', tile_type: 'drink', icon: '💔' },
  { tile_index: 18, title: 'แบกเพื่อน', action_text: 'เลือกเพื่อน 1 คนมาเป็นบัดดี้ คนใดคนหนึ่งโดน อีกคนต้องโดนด้วย 1 รอบ', tile_type: 'challenge', icon: '🛡️' },
  { tile_index: 19, title: 'ดื่มตามแต้มเต๋า', action_text: 'ทอยเต๋าอีก 1 ครั้ง แต้มออกเท่าไหร่ ดื่มเท่านั้นวินาที', tile_type: 'drink', icon: '🎲' },
  { tile_index: 20, title: 'ตกถังข้าวสาร', action_text: 'ได้สิทธิ์สั่งใครก็ได้ "หมดแก้ว" หรือเพียว 1 ฝา', tile_type: 'order_others', icon: '🏆' },
  { tile_index: 21, title: 'ด่านตรวจแอลกอฮอล์', action_text: 'โดนกักตัว 1 เทิร์น (ข้ามตาเดินรอบหน้า) เว้นแต่ยอมดื่ม 2 จิบเพื่อผ่านทาง', tile_type: 'challenge', icon: '🚨' },
  { tile_index: 22, title: 'ต่อท้ายตายวง', action_text: 'คนตกช่องนี้เริ่มร้องเพลง 1 ท่อน แล้วส่งต่อให้คนถัดไปโดยต้องนำ "คำสุดท้าย" มาใช้เป็นคำขึ้นต้นของเพลงใหม่ (เช่น "...มาจากไหน" ➔ "ไหนว่าจะไม่หลอกกัน") ใครคิดไม่ออกใน 5 วินาที ดื่ม 1 จิบ', tile_type: 'challenge', icon: '🎵' },
  { tile_index: 23, title: 'แก้วกักขัง (ชงให้เพื่อน)', action_text: 'คนแรกที่เดินมาตกทำหน้าที่เป็นผู้ปรุง เท/ชงเครื่องดื่มใส่แก้วช็อตกลางจอไว้ (รินเท่าไหร่หรือผสมอะไรก็ได้) ใครก็ตามที่เดินมาตกช่องนี้เป็นคนถัดไป ต้องยกดื่มแก้วนั้นจนหมด แล้วรับหน้าที่ชงแก้วใหม่ต่อ', tile_type: 'drink', icon: '🧪' },
  { tile_index: 24, title: 'หมวดหมู่สายฟ้า', action_text: 'คนตกช่องนี้ตั้งโจทย์หมวดหมู่ 1 อย่าง (เช่น ชื่อหนังผี, ยี่ห้อรถ) จากนั้นทุกคนวนตอบชื่อที่ตรงหมวดหมู่คนละ 1 คำ ห้ามซ้ำและตอบภายใน 3 วินาที ใครคิดไม่ออกหรือตอบซ้ำ ดื่ม 1 จิบ', tile_type: 'challenge', icon: '⚡' },
  { tile_index: 25, title: 'แย่งแตะจมูก', action_text: 'คนตกแตะจมูกตัวเอง ใครแตะตามช้าสุด ดื่ม 1 จิบ', tile_type: 'challenge', icon: '👃' },
  { tile_index: 26, title: 'หมดแก้วสามัคคี', action_text: 'ทุกคนในวงชนแก้วและดื่มพร้อมกัน 1 อึกใหญ่', tile_type: 'drink', icon: '🍻' },
  { tile_index: 27, title: 'ดวงกึ่ม', action_text: 'คนเดินตกโดนเอง 2 จิบส่งท้ายรอบ', tile_type: 'drink', icon: '🥴' },
];

// Smart Icon Detector function: checks custom icon, then keywords, then tile_type
export function getTileIcon(tile: MonopolyTileRecord): string {
  if (tile.icon && tile.icon.trim()) {
    return tile.icon.trim();
  }

  const text = (tile.title + ' ' + tile.action_text).toLowerCase();

  // 1. Keyword based matching
  if (text.includes('สายฟ้า') || text.includes('หมวดหมู่')) return '⚡';
  if (text.includes('แก้วกักขัง') || text.includes('ปรุง') || text.includes('ผสม')) return '🧪';
  if (text.includes('7-up') || text.includes('7 up') || text.includes('ล้มโต๊ะ')) return '🆙';
  if (text.includes('ฉันไม่เคย')) return '🤫';
  if (text.includes('หัวก้อย') || text.includes('เหรียญ')) return '🪙';
  if (text.includes('เต๋า')) return '🎲';
  if (text.includes('ช็อต') || text.includes('เพียว')) return '🥃';
  if (text.includes('เบียร์')) return '🍺';
  if (text.includes('ไวน์')) return '🍷';
  if (text.includes('ชนแก้ว') || text.includes('สามัคคี')) return '🍻';
  if (text.includes('ชี้') || text.includes('สั่ง')) return '🎯';
  if (text.includes('มงกุฎ') || text.includes('เต็ง') || text.includes('กษัตริย์')) return '👑';
  if (text.includes('ต่อท้าย') || text.includes('เพลง') || text.includes('ร้อง')) return '🎵';
  if (text.includes('เต้น')) return '💃';
  if (text.includes('ชาย')) return '⚔️';
  if (text.includes('หญิง') || text.includes('สาว')) return '🌸';
  if (text.includes('โสด')) return '💔';
  if (text.includes('รัก') || text.includes('แฟน')) return '💖';
  if (text.includes('พัก') || text.includes('ปลอดภัย') || text.includes('รอด') || text.includes('ฟรี')) return '🛡️';
  if (text.includes('ระเบิด') || text.includes('บูม')) return '💣';
  if (text.includes('ตรวจ') || text.includes('ตำรวจ') || text.includes('ด่าน')) return '🚨';
  if (text.includes('เริ่ม') || text.includes('go')) return '🚩';
  if (text.includes('จมูก')) return '👃';
  if (text.includes('ตา') || text.includes('สบตา')) return '👀';
  if (text.includes('ใบ้')) return '🎭';

  // 2. Fallback based on tile_type
  switch (tile.tile_type) {
    case 'drink':
      return '🍺';
    case 'order_others':
      return '👑';
    case 'challenge':
      return '⚔️';
    case 'safe':
    default:
      return '🛡️';
  }
}
