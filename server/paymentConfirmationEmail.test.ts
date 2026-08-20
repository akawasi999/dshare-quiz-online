import { describe, expect, it } from "vitest";
import { decryptEmailApiKey, encryptEmailApiKey, isEmailDeliveryConfigured, sendPaymentConfirmationEmail } from "./paymentConfirmationEmail";

describe("payment confirmation email", () => {
  it("mã hóa khóa API và chỉ giải mã được qua tiện ích máy chủ", () => {
    const encrypted = encryptEmailApiKey("re_test_key_123456789");
    expect(encrypted).not.toContain("re_test_key_123456789");
    expect(decryptEmailApiKey(encrypted)).toBe("re_test_key_123456789");
  });

  it("không gọi nhà cung cấp email khi cấu hình chưa có API hoặc chưa bật", async () => {
    const result = await sendPaymentConfirmationEmail({ apiKeyCiphertext: null, fromEmail: null, isEnabled: false }, { recipient: "learner@example.com", learnerName: "Học viên", planName: "PRO", amount: 50000, pointAmount: 150, membershipMonths: 1, orderCode: 123 });
    expect(isEmailDeliveryConfigured({ apiKeyCiphertext: null, fromEmail: null, isEnabled: false })).toBe(false);
    expect(result).toEqual({ attempted: false, sent: false, reason: "not_configured" });
  });
});
