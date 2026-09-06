// Crocodile Dentist Game Data & Types

export interface ToothInfo {
  index: number;
  label: string;
  angleDeg: number;
}

export type CrocodilePenaltyMode = 'fixed' | 'random' | 'shot';

export interface CrocodilePenaltyConfig {
  mode: CrocodilePenaltyMode;
  drinkCount: number;
  actionNote: string;
  totalTeeth: number; // 8, 10, 12, 14, 16
  trapCount: number;  // 1, 2, 3, etc.
}

export const DEFAULT_CROCODILE_CONFIG: CrocodilePenaltyConfig = {
  mode: 'fixed',
  drinkCount: 2,
  actionNote: 'ผู้เล่นที่กดโดนฟันผุ น้องควายงับมือ ดื่ม 2 อึก! 🐃🍺',
  totalTeeth: 10,
  trapCount: 1,
};

// Generate dynamic teeth arrangement along the horseshoe curve
export function generateCrocodileTeeth(total: number = 10): ToothInfo[] {
  const count = Math.max(4, Math.min(16, total));
  const teeth: ToothInfo[] = [];
  const startAngle = -72;
  const endAngle = 72;
  const step = count > 1 ? (endAngle - startAngle) / (count - 1) : 0;

  for (let i = 0; i < count; i++) {
    const angleDeg = Math.round(startAngle + i * step);
    teeth.push({
      index: i,
      label: (i + 1).toString(),
      angleDeg,
    });
  }
  return teeth;
}

export const CROCODILE_TEETH = generateCrocodileTeeth(10);
export const TOTAL_TEETH_COUNT = CROCODILE_TEETH.length;

// Helper to choose multiple unique random trap teeth
export function getRandomTrapTeeth(totalTeeth: number = 10, trapCount: number = 1): number[] {
  const actualTrapCount = Math.min(Math.max(1, trapCount), totalTeeth - 1);
  const indices: number[] = [];
  while (indices.length < actualTrapCount) {
    const r = Math.floor(Math.random() * totalTeeth);
    if (!indices.includes(r)) {
      indices.push(r);
    }
  }
  return indices;
}

// Fun penalty phrases when bitten
export const BITE_QUOTES = [
  'งับเต็มคำ! โดนน้องควายงับมือเข้าให้แล้ว 🐃💥',
  'ฟันผุซี่นี้น้องควายเคี้ยวหญ้าไม่เข้า พอโดนจิ้มเลยงับเลย!',
  'ร้องมออออ! น้องควายงับฉับแบบไม่ทันตั้งตัว ยกแก้วดื่มปลอบใจด่วน 🍺',
  'มือบอนไปหน่อย! น้องควายสะบัดเขา งับคาปาก!',
  'หมดสิทธิ์แก้ตัว! ฟันกับดักควายบ๊องทำงานสมบูรณ์แบบ 🍾',
];
