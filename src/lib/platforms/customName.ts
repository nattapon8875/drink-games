// Custom display names chosen by the user in the edit-name modal.
// Kept in its own module so both the platform adapter and the Discord
// initializer can use it without importing each other.

const CUSTOM_NAME_KEY = 'party_custom_name';
const LEGACY_CUSTOM_NAME_KEY = 'party_discord_custom_name';

// A custom name must be scoped to the identity that set it. An unscoped name would
// overwrite the real Discord profile name of whoever opens the app next on this device.
export function saveCustomName(userId: string, name: string) {
  if (typeof window === 'undefined' || !userId || !name.trim()) return;
  localStorage.setItem(
    CUSTOM_NAME_KEY,
    JSON.stringify({ id: userId, name: name.trim() })
  );
  localStorage.removeItem(LEGACY_CUSTOM_NAME_KEY);
}

// Returns the custom name only if this exact user is the one who set it.
// `allowLegacy` migrates the old unscoped key, which is only safe for the local
// fallback identity (never for a real Discord account name).
export function getCustomNameFor(userId: string, allowLegacy = false): string | null {
  if (typeof window === 'undefined' || !userId) return null;

  const stored = localStorage.getItem(CUSTOM_NAME_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.id === userId && parsed?.name?.trim()) {
        return parsed.name.trim();
      }
      return null;
    } catch {
      // fall through to legacy handling
    }
  }

  const legacy = localStorage.getItem(LEGACY_CUSTOM_NAME_KEY);
  if (legacy?.trim()) {
    if (!allowLegacy) return null;
    saveCustomName(userId, legacy.trim());
    return legacy.trim();
  }

  return null;
}
