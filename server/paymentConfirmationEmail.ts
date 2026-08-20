import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

type EmailDeliveryConfig = {
  apiKeyCiphertext: string | null;
  fromEmail: string | null;
  isEnabled: boolean;
};

type PaymentConfirmationInput = {
  recipient: string | null;
  learnerName: string | null;
  planName: string;
  amount: number;
  pointAmount: number;
  membershipMonths: number;
  orderCode: number | null;
};

const key = () => createHash("sha256").update(process.env.JWT_SECRET || "dshare-email-config").digest();
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);

export function encryptEmailApiKey(apiKey: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${ciphertext.toString("base64url")}`;
}

export function decryptEmailApiKey(ciphertext: string) {
  const [version, ivValue, tagValue, encryptedValue] = ciphertext.split(":");
  if (version !== "v1" || !ivValue || !tagValue || !encryptedValue) throw new Error("Cấu hình khóa email không hợp lệ.");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8");
}

export function isEmailDeliveryConfigured(config: EmailDeliveryConfig) {
  return Boolean(config.isEnabled && config.apiKeyCiphertext && config.fromEmail);
}

export async function sendPaymentConfirmationEmail(config: EmailDeliveryConfig, input: PaymentConfirmationInput) {
  if (!isEmailDeliveryConfigured(config) || !input.recipient) return { attempted: false, sent: false, reason: "not_configured" as const };
  const amount = input.amount.toLocaleString("vi-VN");
  const name = escapeHtml(input.learnerName?.trim() || "bạn");
  const planName = escapeHtml(input.planName);
  const orderCode = input.orderCode ? `<p style="margin:0 0 8px">Mã đơn: <strong>${input.orderCode}</strong></p>` : "";
  const points = input.pointAmount > 0 ? `<p style="margin:0 0 8px">Point thưởng: <strong>${input.pointAmount.toLocaleString("vi-VN")} Point</strong></p>` : "";
  const html = `<main style="font-family:Arial,sans-serif;color:#172554;max-width:560px;margin:auto"><h1 style="font-size:24px">Thanh toán thành công</h1><p>Chào ${name}, gói <strong>${planName}</strong> của bạn đã được kích hoạt.</p><div style="background:#EBF4FF;padding:18px;border-radius:12px"><p style="margin:0 0 8px">Số tiền: <strong>${amount}đ</strong></p><p style="margin:0 0 8px">Thời hạn: <strong>${input.membershipMonths} tháng</strong></p>${points}${orderCode}</div><p style="margin-top:20px">Cảm ơn bạn đã đồng hành cùng Dshare Quiz Online.</p></main>`;
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${decryptEmailApiKey(config.apiKeyCiphertext!)}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: config.fromEmail, to: [input.recipient], subject: `Xác nhận kích hoạt ${input.planName}`, html }) });
  if (!response.ok) throw new Error(`Email provider trả về lỗi ${response.status}.`);
  return { attempted: true, sent: true };
}
