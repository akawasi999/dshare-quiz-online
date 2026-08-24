import { describe, expect, it } from "vitest";
import { hashPassword, hashToken, newOneTimeToken, normalizeEmail, verifyPassword } from "./localAuth";

describe("local authentication security", () => {
  it("chuẩn hóa email và hash mật khẩu không lộ plaintext", async () => {
    const hash = await hashPassword("SecurePass!123");
    expect(normalizeEmail(" User@Example.COM ")).toBe("user@example.com");
    expect(hash).not.toContain("SecurePass!123");
    await expect(verifyPassword("SecurePass!123", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("tạo token một lần ngẫu nhiên và chỉ lưu được mã băm", () => {
    const token = newOneTimeToken();
    expect(token.length).toBeGreaterThan(30);
    expect(hashToken(token)).toHaveLength(64);
    expect(hashToken(token)).not.toContain(token);
  });
});
