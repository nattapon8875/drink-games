import liff from '@line/liff';
import { UnifiedUser } from './types';

let isLiffInitialized = false;

export async function initLiff(): Promise<UnifiedUser | null> {
  if (typeof window === 'undefined') return null;

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) {
    console.warn('[LIFF] NEXT_PUBLIC_LIFF_ID is not configured in .env');
    return null;
  }

  try {
    if (!isLiffInitialized) {
      await liff.init({ liffId });
      isLiffInitialized = true;
    }

    if (!liff.isLoggedIn()) {
      // In external browser, can trigger login if desired, or return null to allow guest
      if (liff.isInClient()) {
        liff.login();
        return null;
      }
      return null;
    }

    const profile = await liff.getProfile();
    return {
      id: profile.userId,
      displayName: profile.displayName || 'นักดื่ม LINE',
      avatarUrl: profile.pictureUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + profile.userId,
      platformType: 'line',
      rawPayload: profile,
    };
  } catch (err) {
    console.error('[LIFF] Initialization error:', err);
    return null;
  }
}

export async function shareLiffInvite(roomCode: string, hostName: string): Promise<boolean> {
  if (typeof window === 'undefined' || !isLiffInitialized) return false;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const joinUrl = `${appUrl}/lobby/${roomCode}`;

  if (liff.isApiAvailable('shareTargetPicker')) {
    try {
      const res = await liff.shareTargetPicker([
        {
          type: 'flex',
          altText: `🍻 ${hostName} ชวนเข้าวงเหล้า! ห้อง: ${roomCode}`,
          contents: {
            type: 'bubble',
            hero: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '🐃 BUFFY PARTY DRINK 🍻',
                  weight: 'bold',
                  size: 'xl',
                  color: '#F59E0B',
                  align: 'center',
                },
                {
                  type: 'text',
                  text: 'เกมเศรษฐีวงเหล้าออนไลน์',
                  size: 'sm',
                  color: '#00F0FF',
                  align: 'center',
                  margin: 'xs',
                },
              ],
              backgroundColor: '#0F0F1E',
              paddingAll: '20px',
            },
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: `${hostName} เปิดตี้แล้ว!`,
                  weight: 'bold',
                  size: 'lg',
                  color: '#FFFFFF',
                },
                {
                  type: 'text',
                  text: `รหัสห้อง: ${roomCode}`,
                  size: 'xxl',
                  weight: 'bold',
                  color: '#FFEA00',
                  margin: 'md',
                },
                {
                  type: 'text',
                  text: 'กดปุ่มด้านล่างเพื่อร่วมวงทันที เตรียมแก้วให้พร้อม!',
                  size: 'xs',
                  color: '#AAAAAA',
                  wrap: true,
                  margin: 'sm',
                },
              ],
              backgroundColor: '#19192D',
            },
            footer: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'button',
                  action: {
                    type: 'uri',
                    label: '🔥 เข้าห้องเล่นเลย!',
                    uri: joinUrl,
                  },
                  style: 'primary',
                  color: '#FF007F',
                },
              ],
              backgroundColor: '#19192D',
            },
          },
        },
      ]);
      return !!res;
    } catch (error) {
      console.error('[LIFF] shareTargetPicker error:', error);
      return false;
    }
  }
  return false;
}
