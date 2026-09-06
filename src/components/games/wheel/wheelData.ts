export type WheelActionType = 'self' | 'left' | 'right' | 'choose' | 'all' | 'safe';

export interface WheelItem {
  id: string;
  text: string;
  color: string;
  drinkCount: number;
  actionType: WheelActionType;
  enabled: boolean;
}

export const PRESET_COLORS = [
  '#dc2626', // Red
  '#ea580c', // Orange
  '#d97706', // Amber
  '#ca8a04', // Yellow-Gold
  '#16a34a', // Green
  '#0d9488', // Teal
  '#0284c7', // Sky Blue
  '#4f46e5', // Indigo
  '#7c3aed', // Purple
  '#c026d3', // Fuchsia
  '#e11d48', // Rose
  '#78350f', // Warm Wood
];

export const DEFAULT_WHEEL_ITEMS: WheelItem[] = [
  {
    id: 'wheel-1',
    text: 'ดื่ม 1 อึก',
    color: '#ea580c',
    drinkCount: 1,
    actionType: 'self',
    enabled: true,
  },
  {
    id: 'wheel-2',
    text: 'คนซ้ายดื่ม 1 อึก',
    color: '#0284c7',
    drinkCount: 1,
    actionType: 'left',
    enabled: true,
  },
  {
    id: 'wheel-3',
    text: 'ดื่ม 2 อึก!',
    color: '#dc2626',
    drinkCount: 2,
    actionType: 'self',
    enabled: true,
  },
  {
    id: 'wheel-4',
    text: 'รอดตัว! 🎉',
    color: '#16a34a',
    drinkCount: 0,
    actionType: 'safe',
    enabled: true,
  },
  {
    id: 'wheel-5',
    text: 'คนขวาดื่ม 1 อึก',
    color: '#7c3aed',
    drinkCount: 1,
    actionType: 'right',
    enabled: true,
  },
  {
    id: 'wheel-6',
    text: 'เลือกเพื่อนดื่ม 1 คน',
    color: '#d97706',
    drinkCount: 1,
    actionType: 'choose',
    enabled: true,
  },
  {
    id: 'wheel-7',
    text: 'ทุกคนในวงชนแก้ว! 🍻',
    color: '#c026d3',
    drinkCount: 1,
    actionType: 'all',
    enabled: true,
  },
  {
    id: 'wheel-8',
    text: 'หมดแก้ว! 🍾',
    color: '#b91c1c',
    drinkCount: 4,
    actionType: 'self',
    enabled: true,
  },
];

export function getSelectedItemAtTop(
  items: WheelItem[],
  rotationDegree: number
): WheelItem | null {
  const activeItems = items.filter((it) => it.enabled);
  if (activeItems.length === 0) return null;

  const sliceAngle = 360 / activeItems.length;
  const normalizedRotation = ((rotationDegree % 360) + 360) % 360;
  const pointerAngle = (270 - normalizedRotation + 360) % 360;
  const targetIndex = Math.floor(pointerAngle / sliceAngle) % activeItems.length;

  return activeItems[targetIndex] || activeItems[0];
}
