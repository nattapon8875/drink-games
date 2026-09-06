export type PlatformType = 'line' | 'discord' | 'web';

export interface UnifiedUser {
  id: string;
  displayName: string;
  avatarUrl: string;
  platformType: PlatformType;
  rawPayload?: any;
}

export interface PlatformAdapter {
  type: PlatformType;
  init: () => Promise<UnifiedUser | null>;
  getUser: () => UnifiedUser | null;
  shareInvite: (options: { roomCode: string; hostName: string }) => Promise<boolean>;
  getChannelId?: () => string | null;
}
