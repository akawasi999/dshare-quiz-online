import { describe, expect, it } from "vitest";
import { LOGIN_CAPTCHA_COOKIE, createLoginCaptcha, verifyLoginCaptcha } from "./loginCaptcha";

describe("loginCaptcha", () => {
  it("xác minh đáp án đúng từ cookie HTTP-only có chữ ký", () => {
    const now = new Date("2026-08-24T03:00:00.000Z");
    const captcha = createLoginCaptcha(now, () => 0, "test-secret");
    expect(captcha.question).toBe("3 + 2 = ?");
    expect(verifyLoginCaptcha(`${LOGIN_CAPTCHA_COOKIE}=${captcha.cookieValue}`, "5", now, "test-secret")).toBe(true);
  });

  it("từ chối đáp án sai, chữ ký sai hoặc CAPTCHA hết hạn", () => {
    const now = new Date("2026-08-24T03:00:00.000Z");
    const captcha = createLoginCaptcha(now, () => 0, "test-secret");
    expect(verifyLoginCaptcha(`${LOGIN_CAPTCHA_COOKIE}=${captcha.cookieValue}`, "4", now, "test-secret")).toBe(false);
    expect(verifyLoginCaptcha(`${LOGIN_CAPTCHA_COOKIE}=${captcha.cookieValue}x`, "5", now, "test-secret")).toBe(false);
    expect(verifyLoginCaptcha(`${LOGIN_CAPTCHA_COOKIE}=${captcha.cookieValue}`, "5", new Date(now.getTime() + 5 * 60_000 + 1), "test-secret")).toBe(false);
  });
});
