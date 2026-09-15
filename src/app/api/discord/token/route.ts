import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Discord Client ID or Client Secret not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Discord Token API Error]', response.status, data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log('[Discord Token API] Successfully exchanged token');

    // Fetch real Discord user profile directly from Discord REST API
    let discordUser = null;
    try {
      const userRes = await fetch('https://discord.com/api/v10/users/@me', {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      if (userRes.ok) {
        const u = await userRes.json();
        const avatarUrl = u.avatar
          ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
          : `https://cdn.discordapp.com/embed/avatars/${parseInt(u.discriminator || '0') % 5}.png`;

        discordUser = {
          id: u.id,
          displayName: u.global_name || u.username,
          avatarUrl,
          platformType: 'discord',
          rawPayload: u,
        };
        console.log('[Discord Token API] Successfully fetched user:', discordUser.displayName, discordUser.id);
      } else {
        const uErr = await userRes.json().catch(() => ({}));
        console.warn('[Discord Token API] Failed to fetch /users/@me:', userRes.status, uErr);
      }
    } catch (uErr) {
      console.error('[Discord Token API] Error fetching user profile:', uErr);
    }

    return NextResponse.json({
      access_token: data.access_token,
      user: discordUser,
    });
  } catch (error: any) {
    console.error('[Discord Token API Exception]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to exchange token' },
      { status: 500 }
    );
  }
}
