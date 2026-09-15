import { DiscordSDK } from '@discord/embedded-app-sdk';
import { UnifiedUser } from './types';
import { getCustomNameFor } from './customName';

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
    let authCode: string | null = null;

    try {
      // Call authorize without prompt: 'none' so Discord can open the consent modal if not authorized yet
      const authRes = await discordSdk.commands.authorize({
        client_id: clientId,
        response_type: 'code',
        scope: ['identify'],
      });
      authCode = authRes.code;
    } catch (authErr) {
      console.warn('[Discord] Authorize cancelled or failed:', authErr);
    }

    if (authCode) {
      try {
        const response = await fetch('/api/discord/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: authCode }),
        });

        if (response.ok) {
          const data = await response.json();
          const { access_token, user: serverUser } = data;

          if (serverUser) {
            user = serverUser;
          }

          if (access_token) {
            try {
              const auth = await discordSdk.commands.authenticate({ access_token });
              if (auth?.user && !user) {
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
            } catch (authCmdErr) {
              console.warn('[Discord] SDK authenticate notice:', authCmdErr);
            }
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn('[Discord] Token endpoint error:', response.status, errData);
        }
      } catch (exchangeErr) {
        console.warn('[Discord] Token exchange network error:', exchangeErr);
      }
    }

    if (user) {
      if (typeof window !== 'undefined') {
        // Keep a custom name ONLY if this same Discord account is the one that set it.
        // Legacy unscoped names are ignored here so the real profile name always wins.
        const customName = getCustomNameFor(user.id);
        if (customName) {
          user.displayName = customName;
        }
        localStorage.setItem('party_discord_user', JSON.stringify(user));
        localStorage.setItem('party_drink_guest_user', JSON.stringify(user));
      }
    }

    // Fallback if OAuth denied or skipped:
    // IMPORTANT: Never use discordSdk.instanceId as player ID because instanceId is shared by all users in the activity!
    if (!user) {
      let localUser: UnifiedUser | null = null;
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('party_discord_user') || localStorage.getItem('party_drink_guest_user');
        if (stored) {
          try {
            localUser = JSON.parse(stored);
          } catch {}
        }
      }

      if (!localUser || !localUser.id || localUser.id.startsWith('i-')) {
        const randomSeed = Math.random().toString(36).substring(2, 8);
        localUser = {
          id: `dc-${randomSeed}`,
          displayName: `เพื่อนใน Discord (${randomSeed.substring(0, 4).toUpperCase()})`,
          avatarUrl: '/buffy-mascot.png',
          platformType: 'discord',
        };
      }

      if (typeof window !== 'undefined') {
        const customName = getCustomNameFor(localUser.id, true);
        if (customName) {
          localUser.displayName = customName;
        }
        localStorage.setItem('party_discord_user', JSON.stringify(localUser));
        localStorage.setItem('party_drink_guest_user', JSON.stringify(localUser));
      }

      user = localUser;
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
