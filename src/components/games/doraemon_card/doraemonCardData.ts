export type CardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardValue =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K';

export interface PlayingCard {
  id: string;
  suit: CardSuit;
  value: CardValue;
  rank: number;
}

export interface DoraemonRule {
  value: CardValue;
  title: string;
  subtitle: string;
  actionText: string;
  drinkCount: number;
  type:
    | 'drink'
    | 'buddy'
    | 'category'
    | 'seven_up'
    | 'toilet_pass'
    | 'neighbor'
    | 'mimic'
    | 'ghost'
    | 'king_punishment';
  icon: string;
  color: string;
}

export type KingMode = 'custom_input' | 'preset';

export interface KingPresetRule {
  title: string;
  description: string;
}

export const DEFAULT_KING_PRESET_RULES: Record<string, KingPresetRule> = {
  '1': {
    title: 'K ใบที่ 1',
    description: 'คนจั่วเลือกบทลงโทษ 1 อย่าง',
  },
  '2': {
    title: 'K ใบที่ 2',
    description: 'คนจั่วเลือกสถานที่ทำโทษ',
  },
  '3': {
    title: 'K ใบที่ 3',
    description: 'คนจั่วกำหนดจำนวนครั้ง/วินาที',
  },
  '4': {
    title: 'K ใบที่ 4 (ผู้รับเคราะห์)',
    description: 'คนที่เปิดได้ใบนี้ ต้องทำภารกิจที่ K ทั้ง 3 ใบแรกสั่งไว้!',
  },
};

export const DEFAULT_DORAEMON_RULES: Record<CardValue, DoraemonRule> = {
  A: {
    value: 'A',
    title: 'A - ดื่มตามเลข',
    subtitle: 'จิบเบาๆ เบิกโรงเตี๊ยม',
    actionText: 'คนจั่วได้ดื่ม 1 อึก!',
    drinkCount: 1,
    type: 'drink',
    icon: '🍺',
    color: '#ef4444',
  },
  '2': {
    value: '2',
    title: '2 - ดื่ม 2 อึก',
    subtitle: 'เบิ้ลสองสบายๆ',
    actionText: 'คนจั่วได้ดื่ม 2 อึก!',
    drinkCount: 2,
    type: 'drink',
    icon: '🍻',
    color: '#f97316',
  },
  '3': {
    value: '3',
    title: '3 - ดื่ม 3 อึก',
    subtitle: 'เริ่มตึงขึ้นมาหน่อย',
    actionText: 'คนจั่วได้ดื่ม 3 อึก!',
    drinkCount: 3,
    type: 'drink',
    icon: '🍷',
    color: '#f59e0b',
  },
  '4': {
    value: '4',
    title: '4 - ดื่มหมดแก้ว!',
    subtitle: 'ล้างคอจัดเต็ม',
    actionText: 'คนจั่วได้ต้องยกซด หมดแก้ว ทันที!',
    drinkCount: 4,
    type: 'drink',
    icon: '🍾',
    color: '#dc2626',
  },
  '5': {
    value: '5',
    title: '5 - จับคู่บัดดี้ (Buddy)',
    subtitle: 'ร่วมทุกข์ร่วมดื่ม',
    actionText: 'เลือกเพื่อนในวง 1 คนเป็นบัดดี้! หลังจากนี้ถ้าใครคนใดคนหนึ่งต้องดื่ม อีกคนต้องดื่มตามไปด้วยเสมอ!',
    drinkCount: 0,
    type: 'buddy',
    icon: '🤝',
    color: '#3b82f6',
  },
  '6': {
    value: '6',
    title: '6 - เปิดหมวดหมู่',
    subtitle: 'ประลองไหวพริบ',
    actionText: 'คนจั่วตั้งชื่อหมวดหมู่ (เช่น ชื่อเหล้า, แบรนด์รถ, ประเทศ) แล้ววนตอบตามเข็มนาฬิกา ใครนึกไม่ออกใน 5 วิ หรือตอบซ้ำ ดื่ม 2 อึก!',
    drinkCount: 2,
    type: 'category',
    icon: '🧠',
    color: '#8b5cf6',
  },
  '7': {
    value: '7',
    title: '7 - เกมนับเลข 7-Up',
    subtitle: 'ห้ามพูด 7 หรือหาร 7 ลงตัว',
    actionText: 'เริ่มนับ 1, 2, 3... วนรอบวง แต่ถ้าเจอเลขที่มีเลข 7 หรือหาร 7 ลงตัว (7, 14, 17, 21...) ให้ ปรบมือ ห้ามพูดเลข! ใครพลาดดื่ม 2 อึก!',
    drinkCount: 2,
    type: 'seven_up',
    icon: '👏',
    color: '#10b981',
  },
  '8': {
    value: '8',
    title: '8 - บัตรเข้าห้องน้ำ 🚽',
    subtitle: 'Toilet VIP Pass',
    actionText: 'ยินดีด้วย! คุณได้รับ บัตรอนุญาตลุกไปห้องน้ำ 1 ใบ (เก็บไว้ใช้หรือจะขายต่อให้เพื่อนก็ได้!)',
    drinkCount: 0,
    type: 'toilet_pass',
    icon: '🎫',
    color: '#06b6d4',
  },
  '9': {
    value: '9',
    title: '9 - คนซ้ายดื่ม!',
    subtitle: 'เพื่อนทางซ้ายรับเคราะห์',
    actionText: 'สหายที่นั่ง ทางซ้าย ของคนจั่ว ยกซด 1 อึก!',
    drinkCount: 1,
    type: 'neighbor',
    icon: '👈',
    color: '#e11d48',
  },
  '10': {
    value: '10',
    title: '10 - คนขวาดื่ม!',
    subtitle: 'เพื่อนทางขวารับเคราะห์',
    actionText: 'สหายที่นั่ง ทางขวา ของคนจั่ว ยกซด 1 อึก!',
    drinkCount: 1,
    type: 'neighbor',
    icon: '👉',
    color: '#e11d48',
  },
  J: {
    value: 'J',
    title: 'J - ทำตามคนจั่ว (Mimic)',
    subtitle: 'ใครช้าสุดโดน!',
    actionText: 'คนจั่วทำท่าอะไรก็ได้ 1 ท่า (เช่น แตะจมูก, ยกสองมือ, แกล้งหลับ) ทุกคนในวงต้องรีบทำตามทันที! ใครทำตามช้าสุด ดื่ม 2 อึก!',
    drinkCount: 2,
    type: 'mimic',
    icon: '🤸',
    color: '#d946ef',
  },
  Q: {
    value: 'Q',
    title: 'Q - คนไร้ตัวตน (Ghost 👻)',
    subtitle: 'กลายเป็นวิญญาณห้ามคุยด้วย',
    actionText: 'คนจั่วติดสถานะ วิญญาณไร้ตัวตน ห้ามใครในวงพูดคุย ตอบคำถาม หรือสบตาด้วย! ถ้าใครเผลอคุยกับคนติดสถานะนี้ คนนั้นต้องดื่ม 1 อึก! (สถานะจะหลุดเมื่อมีคนจั่วได้ Q ใบถัดไป)',
    drinkCount: 0,
    type: 'ghost',
    icon: '👻',
    color: '#a855f7',
  },
  K: {
    value: 'K',
    title: 'K - สร้างบทลงโทษ 4 ส่วน (King)',
    subtitle: 'จิ๊กซอว์มรณะแห่งวงเหล้า',
    actionText: 'ไพ่ K แต่ละใบจะร่วมสร้างบทลงโทษ 4 ส่วน: ใบที่ 1 กำหนดทำอะไร, ใบที่ 2 ทำที่ไหน, ใบที่ 3 ทำกี่ครั้ง, และใบที่ 4 ระบุผู้โชคร้ายที่จะต้องทำตามทั้งหมด!',
    drinkCount: 0,
    type: 'king_punishment',
    icon: '👑',
    color: '#fbbf24',
  },
};

export function createDeck(): PlayingCard[] {
  const suits: CardSuit[] = ['spades', 'hearts', 'clubs', 'diamonds'];
  const values: CardValue[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: PlayingCard[] = [];

  for (const suit of suits) {
    values.forEach((value, idx) => {
      deck.push({
        id: `${suit}-${value}`,
        suit,
        value,
        rank: idx + 1,
      });
    });
  }

  return deck;
}

export function shuffleDeck(deck: PlayingCard[]): PlayingCard[] {
  const array = [...deck];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export const SUIT_SYMBOLS: Record<CardSuit, { symbol: string; color: string; label: string }> = {
  spades: { symbol: '♠', color: '#0f172a', label: 'โพดำ' },
  hearts: { symbol: '♥', color: '#dc2626', label: 'โพแดง' },
  clubs: { symbol: '♣', color: '#0f172a', label: 'ดอกจิก' },
  diamonds: { symbol: '♦', color: '#dc2626', label: 'ข้าวหลามตัด' },
};
