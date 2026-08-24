export const LOGIN_MAX_FAILED_ATTEMPTS = 5;
export const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000;
export const LOGIN_CAPTCHA_THRESHOLD = 3;

export function nextFailedLoginState(currentAttempts: number, now = new Date()) {
  const failedLoginAttempts = Math.max(0, currentAttempts) + 1;
  if (failedLoginAttempts < LOGIN_MAX_FAILED_ATTEMPTS) return { failedLoginAttempts, loginLockedUntil: null as Date | null };
  return { failedLoginAttempts: 0, loginLockedUntil: new Date(now.getTime() + LOGIN_LOCK_DURATION_MS) };
}

export function loginLockoutMessage(lockedUntil: Date, now = new Date()) {
  const remainingMinutes = Math.max(1, Math.ceil((lockedUntil.getTime() - now.getTime()) / 60_000));
  return `Đăng nhập tạm thời bị giới hạn. Vui lòng thử lại sau ${remainingMinutes} phút.`;
}
