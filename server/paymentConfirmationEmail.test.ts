import { describe, expect, it } from "vitest";
import { buildContactEmailVerification, buildPasswordResetEmail, buildPaymentConfirmationEmail, decryptEmailApiKey, encryptEmailApiKey, isEmailDeliveryConfigured, sendPaymentConfirmationEmail } from "./paymentConfirmationEmail";

describe("payment confirmation email", () => {
  it("mã hóa khóa API và chỉ giải mã được qua tiện ích máy chủ", () => {
    const encrypted = encryptEmailApiKey("re_test_key_123456789");
    expect(encrypted).not.toContain("re_test_key_123456789");
    expect(decryptEmailApiKey(encrypted)).toBe("re_test_key_123456789");
  });

  it("không gọi nhà cung cấp email khi cấu hình chưa có API hoặc chưa bật", async () => {
    const result = await sendPaymentConfirmationEmail({ apiKeyCiphertext: null, fromEmail: null, isEnabled: false }, { recipient: "learner@example.com", learnerName: "Học viên", planName: "PRO", amount: 50000, pointAmount: 150, membershipMonths: 1, orderCode: 123 });
    expect(isEmailDeliveryConfigured({ apiKeyCiphertext: null, fromEmail: null, isEnabled: false })).toBe(false);
    expect(result).toMatchObject({ attempted: false, sent: false, reason: "not_configured" });
  });

  it("dùng các URL tiếng Anh canonical trong email xác nhận", () => {
    const email = buildPaymentConfirmationEmail({ recipient: "learner@example.com", learnerName: "Học viên", planName: "PRO", amount: 50000, pointAmount: 150, membershipMonths: 1, orderCode: 123, appOrigin: "https://quiz.example.vn/" });
    expect(email.html).toContain('href="https://quiz.example.vn/account"');
    expect(email.html).toContain('href="https://quiz.example.vn/explore"');
    expect(email.html).not.toContain("/ho-so");
    expect(email.html).not.toContain("/kham-pha");
  });

  it("tạo liên kết xác nhận email liên hệ có token và thời hạn rõ ràng", () => {
    const email = buildContactEmailVerification({ recipient: "new@example.com", learnerName: "Học viên", verificationToken: "secure-token", appOrigin: "https://quiz.example.vn" });
    expect(email.subject).toContain("Xác nhận email liên hệ mới");
    expect(email.html).toContain("https://quiz.example.vn/account/profile?verifyContactEmail=secure-token");
    expect(email.html).toContain("24 giờ");
  });

  it("tạo email đặt lại mật khẩu với token một lần và hạn 30 phút", () => {
    const email = buildPasswordResetEmail({ recipient: "user@example.com", learnerName: "Học viên", resetToken: "reset-token", appOrigin: "https://quiz.example.vn" });
    expect(email.html).toContain("https://quiz.example.vn/?resetPassword=reset-token");
    expect(email.html).toContain("30 phút");
  });
});
