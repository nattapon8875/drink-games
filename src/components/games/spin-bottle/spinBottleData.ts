export interface BottlePrompt {
  id: string;
  type: 'truth' | 'dare' | 'drink';
  title: string;
  description: string;
  penaltyDrinks: number;
  badge: string;
}

export const SPIN_BOTTLE_PROMPTS: BottlePrompt[] = [
  // TRUTH (ความจริง)
  {
    id: 't-1',
    type: 'truth',
    title: 'สารภาพความจริงในใจ',
    description: 'บอกความลับที่คุณไม่เคยเล่าให้ใครในวงนี้ฟังมาก่อน 1 ข้อ (ถ้าไม่ยอมตอบ ต้องยกดื่มตามจำนวน)',
    penaltyDrinks: 2,
    badge: 'ความจริง',
  },
  {
    id: 't-2',
    type: 'truth',
    title: 'สเปกในวงนี้',
    description: 'ถ้าจำเป็นต้องเลือกออกเดตกับคนในวงนี้ 1 คน จะเลือกใครและเพราะอะไร?',
    penaltyDrinks: 2,
    badge: 'ความจริง',
  },
  {
    id: 't-3',
    type: 'truth',
    title: 'ความประทับใจแรก',
    description: 'พูดตรงๆ ว่าตอนเจอคนที่อยู่ทางซ้ายมือครั้งแรก คิดว่าเขาเป็นคนยังไง?',
    penaltyDrinks: 1,
    badge: 'ความจริง',
  },
  {
    id: 't-4',
    type: 'truth',
    title: 'วีรกรรมเมาสุดรั่ว',
    description: 'เล่าวีรกรรมตอนเมาที่น่าอับอายที่สุดในชีวิตที่เคยทำมาให้ทุกคนฟัง!',
    penaltyDrinks: 2,
    badge: 'ความจริง',
  },
  {
    id: 't-5',
    type: 'truth',
    title: 'แชทล่าสุดที่ปิดบัง',
    description: 'เปิดเผยข้อความล่าสุดที่คุยกับคนที่แอบชอบหรือแฟนเก่าให้ทุกคนฟัง!',
    penaltyDrinks: 3,
    badge: 'ความจริง',
  },
  {
    id: 't-6',
    type: 'truth',
    title: 'โกหกครั้งใหญ่',
    description: 'เรื่องอะไรที่คุณเคยโกหกคนในครอบครัวหรือเพื่อนสนิทแล้วยังไม่มีใครจับได้?',
    penaltyDrinks: 2,
    badge: 'ความจริง',
  },
  {
    id: 't-7',
    type: 'truth',
    title: 'ใครน่ากลัวสุดตอนเมา',
    description: 'ชี้ตัวคนในวงนี้ที่คิดว่าเวลาเมาแล้วควบคุมสติตัวเองยากที่สุด!',
    penaltyDrinks: 1,
    badge: 'ความจริง',
  },
  {
    id: 't-8',
    type: 'truth',
    title: 'ความหลังฝังใจ',
    description: 'เคยแอบชอบเพื่อนในกลุ่มเดียวกันบ้างไหม และตอนนั้นทำอย่างไร?',
    penaltyDrinks: 2,
    badge: 'ความจริง',
  },

  // DARE (คำท้า)
  {
    id: 'd-1',
    type: 'dare',
    title: 'โทรหาสายสุ่ม',
    description: 'โทรหาเบอร์คนที่ 5 ในรายชื่อล่าสุด แล้วพูดว่า "คิดถึงนะ" แล้วตัดสายทันที!',
    penaltyDrinks: 3,
    badge: 'คำท้า',
  },
  {
    id: 'd-2',
    type: 'dare',
    title: 'เต้นเพลงฮิต 15 วินาที',
    description: 'ลุกขึ้นเต้นเพลงที่เพื่อนในวงเปิดให้ดูเป็นเวลา 15 วินาที ห้ามหยุด!',
    penaltyDrinks: 2,
    badge: 'คำท้า',
  },
  {
    id: 'd-3',
    type: 'dare',
    title: 'ชมคนทางขวาแบบหวานเจี๊ยบ',
    description: 'จ้องตาคนทางขวามือ 10 วินาที พร้อมพูดชมด้วยคำหวานเยิ้ม 3 ประโยค',
    penaltyDrinks: 1,
    badge: 'คำท้า',
  },
  {
    id: 'd-4',
    type: 'dare',
    title: 'โพสต์สตอรี่สุดแปลก',
    description: 'ถ่ายรูปหน้าเหวอของตัวเองแล้วลง IG Story หรือส่งลงกลุ่มแชททิ้งไว้ 5 นาที!',
    penaltyDrinks: 3,
    badge: 'คำท้า',
  },
  {
    id: 'd-5',
    type: 'dare',
    title: 'เลียนแบบเสียงควายบัฟฟี่',
    description: 'ทำท่าและร้องเสียงควายป่าบัฟฟี่แบบสุดพลัง 3 ครั้งให้ทุกคนในวงยอมรับ!',
    penaltyDrinks: 1,
    badge: 'คำท้า',
  },
  {
    id: 'd-6',
    type: 'dare',
    title: 'พูดสำเนียงฝรั่งตลอด 1 รอบ',
    description: 'จนกว่าขวดจะหมุนครั้งถัดไป ทุกครั้งที่พูดต้องพูดทองแดงสำเนียงฝรั่งเท่านั้น!',
    penaltyDrinks: 1,
    badge: 'คำท้า',
  },
  {
    id: 'd-7',
    type: 'dare',
    title: 'ส่งสติกเกอร์ปริศนา',
    description: 'ส่งสติกเกอร์หัวใจ ❤️ ให้คนที่ทักแชทมาเป็นคนล่าสุดโดยไม่ต้องอธิบายอะไร!',
    penaltyDrinks: 2,
    badge: 'คำท้า',
  },

  // DRINK (คำสั่งยกแก้ว / วัดใจ)
  {
    id: 'p-1',
    type: 'drink',
    title: 'โดนเต็มๆ ปากขวดชี้!',
    description: 'ไม่ต้องถามอะไรมาก ปากขวดชี้มาที่คุณ ยกดื่มไปเลย 1 ดื่มเต็มๆ!',
    penaltyDrinks: 1,
    badge: 'ยกดื่ม',
  },
  {
    id: 'p-2',
    type: 'drink',
    title: 'ชนแก้วกับคนหมุนขวด',
    description: 'คุณและคนที่กดหมุนขวด ต้องชนแก้วกันแล้วดื่มคนละ 1 จิบพร้อมกัน!',
    penaltyDrinks: 1,
    badge: 'ชนแก้วคู่',
  },
  {
    id: 'p-3',
    type: 'drink',
    title: 'สั่งเพื่อนดื่มแทน',
    description: 'โชคเข้าข้าง! คุณรอด แต่คุณมีสิทธิ์สั่งให้เพื่อนคนไหนก็ได้ในวง ดื่มแทน 2 จิบ!',
    penaltyDrinks: 0,
    badge: 'สิทธิ์พิเศษ',
  },
  {
    id: 'p-4',
    type: 'drink',
    title: 'มิตรภาพรอบวง',
    description: 'ทุกคนในวงยกแก้วขึ้นมาแล้วชนพร้อมกัน ดื่มมิตรภาพคนละ 1 จิบ!',
    penaltyDrinks: 1,
    badge: 'หมดวง',
  },
  {
    id: 'p-5',
    type: 'drink',
    title: 'ดับเบิ้ลช็อตวัดใจ!',
    description: 'ปากขวดเล็งเป้าชัดเจน ยกดื่มไปเลย 2 จิบเต็มเหนี่ยว!',
    penaltyDrinks: 2,
    badge: 'ดับเบิ้ลดื่ม',
  },
];

export function getRandomPrompt(): BottlePrompt {
  const index = Math.floor(Math.random() * SPIN_BOTTLE_PROMPTS.length);
  return SPIN_BOTTLE_PROMPTS[index];
}
