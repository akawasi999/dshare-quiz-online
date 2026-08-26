export const DISPLAY_NAME_CHANGE_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;

export function getDisplayNameChangeAvailableAt(nameChangedAt: Date | null | undefined) {
  return nameChangedAt ? new Date(nameChangedAt.getTime() + DISPLAY_NAME_CHANGE_INTERVAL_MS) : null;
}

export function canChangeDisplayName(nameChangedAt: Date | null | undefined, now = new Date()) {
  const availableAt = getDisplayNameChangeAvailableAt(nameChangedAt);
  return !availableAt || availableAt.getTime() <= now.getTime();
}
