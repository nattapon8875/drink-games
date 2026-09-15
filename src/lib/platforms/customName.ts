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

// ---------------------------------------------------------------------------
// Previous player ids
//
// A person's id can change between visits: the Discord OAuth path yields the
// real account id while the fallback path yields a random local one. When that
// switch happens the old row is still sitting in the room, so the same human
// shows up twice. We remember the ids they used before so the room can drop
// those rows as soon as they rejoin.
// ---------------------------------------------------------------------------

const PREVIOUS_IDS_KEY = 'party_previous_ids';
const MAX_PREVIOUS_IDS = 5;

export function rememberPreviousId(oldId: string, currentId: string) {
  if (typeof window === 'undefined') return;
  if (!oldId || !currentId || oldId === currentId || oldId === 'guest-init') return;

  const existing = getPreviousPlayerIds();
  const next = [oldId, ...existing.filter((id) => id !== oldId && id !== currentId)].slice(
    0,
    MAX_PREVIOUS_IDS
  );
  localStorage.setItem(PREVIOUS_IDS_KEY, JSON.stringify(next));
}

export function getPreviousPlayerIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PREVIOUS_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function forgetPreviousPlayerId(id: string) {
  if (typeof window === 'undefined') return;
  const next = getPreviousPlayerIds().filter((x) => x !== id);
  localStorage.setItem(PREVIOUS_IDS_KEY, JSON.stringify(next));
}
