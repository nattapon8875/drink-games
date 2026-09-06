import { initLiff, shareLiffInvite } from './liff';
import { initDiscord, isDiscordActivity, channelIdToRoomCode } from './discord';
import { PlatformType, UnifiedUser } from './types';

const THAI_PARTY_NICKNAMES = [
  'เสี่ยสายเปย์',
  'ตับเหล็กทองคำ',
  'เทพเจ้าหมดแก้ว',
  'น้องใหม่ใจถึง',
  'สายจิบไม่จำกัด',
  'ช็อตเดียวหลับ',
  'บาร์เทนเดอร์ตัวตึง',
  'คนดีประจำวง',
  'พี่เบิ้มเทกระจาด',
  'นักชนแก้วในตำนาน',
];

export function getRandomGuestUser(): UnifiedUser {
  if (typeof window === 'undefined') {
    return {
      id: 'guest-init',
      displayName: 'นักดื่มนิรนาม',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=guest',
      platformType: 'web',
    };
  }

  const storedUser = localStorage.getItem('party_drink_guest_user');
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch {
      // ignore
    }
  }

  const randomNick = THAI_PARTY_NICKNAMES[Math.floor(Math.random() * THAI_PARTY_NICKNAMES.length)];
  const randomSeed = Math.random().toString(36).substring(2, 9);
  const newUser: UnifiedUser = {
    id: `web-${randomSeed}`,
    displayName: randomNick,
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`,
    platformType: 'web',
  };

  localStorage.setItem('party_drink_guest_user', JSON.stringify(newUser));
  return newUser;
}

export function saveGuestUser(user: UnifiedUser) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('party_drink_guest_user', JSON.stringify(user));
  }
}

export async function detectAndInitPlatform(): Promise<{
  platform: PlatformType;
  user: UnifiedUser;
  discordRoomCode?: string | null;
}> {
  if (typeof window === 'undefined') {
    return {
      platform: 'web',
      user: getRandomGuestUser(),
    };
  }

  // 1. Check Discord Activity
  if (isDiscordActivity()) {
    try {
      const { user, roomCode } = await initDiscord();
      if (user) {
        return {
          platform: 'discord',
          user,
          discordRoomCode: roomCode,
        };
      }
    } catch (e) {
      console.warn('[Adapter] Discord check error:', e);
    }
  }

  // 2. Check LINE LIFF
  const userAgent = navigator.userAgent.toLowerCase();
  const isLine = userAgent.includes('line');
  if (isLine || process.env.NEXT_PUBLIC_LIFF_ID) {
    try {
      const liffUser = await initLiff();
      if (liffUser) {
        return {
          platform: 'line',
          user: liffUser,
        };
      }
    } catch (e) {
      console.warn('[Adapter] LIFF check error:', e);
    }
  }

  // 3. Fallback: Regular Web Browser
  return {
    platform: 'web',
    user: getRandomGuestUser(),
  };
}

export async function shareInvite(platform: PlatformType, roomCode: string, hostName: string): Promise<boolean> {
  if (platform === 'line') {
    const shared = await shareLiffInvite(roomCode, hostName);
    if (shared) return true;
  }

  // Generic Web / Discord copy link
  if (typeof window !== 'undefined' && navigator.clipboard) {
    const url = `${window.location.origin}/lobby/${roomCode}`;
    await navigator.clipboard.writeText(url);
    return true;
  }

  return false;
}
