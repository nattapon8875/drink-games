import { DiscordSDK } from '@discord/embedded-app-sdk';
import { UnifiedUser } from './types';

let discordSdk: DiscordSDK | null = null;
let isDiscordReady = false;

// Check if running inside Discord Embedded iframe
export function isDiscordActivity(): boolean {
  if (typeof window === 'undefined') return false;
  const urlParams = new URLSearchParams(window.location.search);
  return (
    urlParams.has('frame_id') ||
    window.location.ancestorOrigins?.contains('https://discord.com') ||
    window.parent !== window
  );
}

// Convert Discord Voice Channel ID to deterministic 4-character room code (e.g. 'D' + 3 alphanumeric)
export function channelIdToRoomCode(channelId: string): string {
  let hash = 0;
  for (let i = 0; i < channelId.length; i++) {
    hash = (hash << 5) - hash + channelId.charCodeAt(i);
    hash |= 0;
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const abs = Math.abs(hash);
  const c1 = chars[abs % chars.length];
  const c2 = chars[Math.floor(abs / chars.length) % chars.length];
  const c3 = chars[Math.floor(abs / (chars.length * chars.length)) % chars.length];
  return `D${c1}${c2}${c3}`;
}

export async function initDiscord(): Promise<{
  user: UnifiedUser | null;
  channelId: string | null;
  roomCode: string | null;
}> {
  if (typeof window === 'undefined') {
    return { user: null, channelId: null, roomCode: null };
  }

  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  if (!clientId) {
    console.warn('[Discord] NEXT_PUBLIC_DISCORD_CLIENT_ID not configured');
    return { user: null, channelId: null, roomCode: null };
  }

  try {
    if (!discordSdk) {
      discordSdk = new DiscordSDK(clientId);
    }

    if (!isDiscordReady) {
      await discordSdk.ready();
      isDiscordReady = true;
    }

    const channelId = discordSdk.channelId;
    const roomCode = channelId ? channelIdToRoomCode(channelId) : null;

    // Try OAuth authorize and authenticate with backend token endpoint
    let user: UnifiedUser | null = null;
    try {
      const { code } = await discordSdk.commands.authorize({
        client_id: clientId,
        response_type: 'code',
        state: '',
        prompt: 'none',
        scope: ['identify', 'guilds'],
      });

      const response = await fetch('/api/discord/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        const { access_token } = await response.json();
        const auth = await discordSdk.commands.authenticate({ access_token });
        if (auth.user) {
          const avatarUrl = auth.user.avatar
            ? `https://cdn.discordapp.com/avatars/${auth.user.id}/${auth.user.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${parseInt(auth.user.discriminator || '0') % 5}.png`;

          user = {
            id: auth.user.id,
            displayName: auth.user.global_name || auth.user.username,
            avatarUrl,
            platformType: 'discord',
            rawPayload: auth.user,
          };
        }
      }
    } catch (authErr) {
      console.warn('[Discord] OAuth authentication skipped or failed, using channel fallback:', authErr);
      // Fallback guest Discord profile using instanceId
      const fallbackId = discordSdk.instanceId || 'dc-' + Math.random().toString(36).substring(2, 8);
      user = {
        id: fallbackId,
        displayName: 'เพื่อนใน Discord',
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${fallbackId}`,
        platformType: 'discord',
      };
    }

    return { user, channelId, roomCode };
  } catch (err) {
    console.error('[Discord] SDK init error:', err);
    return { user: null, channelId: null, roomCode: null };
  }
}

export function getDiscordSdk(): DiscordSDK | null {
  return discordSdk;
}
