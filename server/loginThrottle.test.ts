import { describe, expect, it } from "vitest";
import { LOGIN_LOCK_DURATION_MS, LOGIN_MAX_FAILED_ATTEMPTS, loginLockoutMessage, nextFailedLoginState } from "./loginThrottle";

describe("loginThrottle", () => {
  it("chỉ khóa sau năm lần đăng nhập sai và khóa trong mười lăm phút", () => {
    const now = new Date("2026-08-24T03:00:00.000Z");
    expect(LOGIN_MAX_FAILED_ATTEMPTS).toBe(5);
    expect(nextFailedLoginState(3, now)).toEqual({ failedLoginAttempts: 4, loginLockedUntil: null });
    expect(nextFailedLoginState(4, now)).toEqual({ failedLoginAttempts: 0, loginLockedUntil: new Date(now.getTime() + LOGIN_LOCK_DURATION_MS) });
  });

  it("hiển thị số phút chờ còn lại theo thời điểm thực tế", () => {
    const now = new Date("2026-08-24T03:00:00.000Z");
    expect(loginLockoutMessage(new Date(now.getTime() + 14 * 60_000 + 1), now)).toContain("15 phút");
  });
});
