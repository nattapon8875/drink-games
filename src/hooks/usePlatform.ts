'use client';

import { useState, useEffect } from 'react';
import { UnifiedUser, PlatformType } from '@/lib/platforms/types';
import { detectAndInitPlatform, getRandomGuestUser, saveGuestUser } from '@/lib/platforms/adapter';

export const INITIAL_GUEST_USER: UnifiedUser = {
  id: 'guest-init',
  displayName: 'นักดื่มนิรนาม',
  avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=guest',
  platformType: 'web',
};

export function usePlatform() {
  const [user, setUser] = useState<UnifiedUser>(INITIAL_GUEST_USER);
  const [platform, setPlatform] = useState<PlatformType>('web');
  const [discordRoomCode, setDiscordRoomCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    let active = true;

    async function init() {
      try {
        const result = await detectAndInitPlatform();
        if (active) {
          setUser(result.user);
          setPlatform(result.platform);
          if (result.discordRoomCode) {
            setDiscordRoomCode(result.discordRoomCode);
          }
        }
      } catch (err) {
        console.error('Error detecting platform:', err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      active = false;
    };
  }, []);

  const updateUserProfile = (name: string, avatarUrl?: string) => {
    const updated: UnifiedUser = {
      ...user,
      displayName: name,
      avatarUrl: avatarUrl || user.avatarUrl,
    };
    setUser(updated);
    saveGuestUser(updated);
  };

  return {
    user,
    platform,
    discordRoomCode,
    isLoading,
    isMounted,
    updateUserProfile,
  };
}
