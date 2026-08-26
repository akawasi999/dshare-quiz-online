import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export type EmailDeliveryConfig = { apiKeyCiphertext: string | null; fromEmail: string | null; isEnabled: boolean };
export type PaymentConfirmationInput = { recipient: string | null; learnerName: string | null; planName: string; amount: number; pointAmount: number; membershipMonths: number; orderCode: number | null; appOrigin?: string };
export type ContactEmailVerificationInput = { recipient: string; learnerName: string | null; verificationToken: string; appOrigin: string };
export type PasswordResetInput = { recipient: string; learnerName: string | null; resetToken: string; appOrigin: string };
type PreparedEmail = { subject: string; html: string };

const key = () => createHash("sha256").update(process.env.JWT_SECRET || "dshare-email-config").digest();
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
const formatVnd = (amount: number) => `${amount.toLocaleString("vi-VN")}đ`;
const appOrigin = (value?: string) => (value?.trim() || process.env.APP_ORIGIN || "https://dsharequiz-jxleeaps.manus.space").replace(/\/$/, "");
const emailButton = (href: string, label: string) => `<a href="${href}" style="display:inline-block;background:#065BE5;border-radius:999px;padding:13px 20px;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none">${label}</a>`;

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

export function isEmailDeliveryConfigured(config: EmailDeliveryConfig) { return Boolean(config.isEnabled && config.apiKeyCiphertext && config.fromEmail); }

function emailLayout({ eyebrow, title, body, card, footer }: { eyebrow: string; title: string; body: string; card: string; footer: string }) {
  return `<!doctype html><html><body style="margin:0;background:#edf5ff;color:#172554;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 14px 38px rgba(23,37,84,.12)"><tr><td style="background:linear-gradient(135deg,#065BE5,#3762D2);padding:28px 32px"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="width:42px;height:42px;border-radius:12px;background:#ffffff;color:#065BE5;text-align:center;font-size:22px;font-weight:800">D</td><td style="padding-left:12px;color:#ffffff"><div style="font-size:16px;font-weight:800">Dshare</div><div style="margin-top:2px;font-size:10px;letter-spacing:1.5px;font-weight:700;opacity:.82">QUIZ ONLINE</div></td></tr></table></td></tr><tr><td style="padding:32px"><p style="margin:0 0 10px;color:#065BE5;font-size:11px;font-weight:800;letter-spacing:1.3px;text-transform:uppercase">${eyebrow}</p><h1 style="margin:0;font-size:28px;line-height:1.25;color:#172554">${title}</h1><div style="margin-top:16px;font-size:15px;line-height:1.65;color:#526775">${body}</div><div style="margin-top:24px;background:#EBF4FF;border:1px solid #d7e8ff;border-radius:16px;padding:20px">${card}</div><p style="margin:26px 0 0;color:#71838d;font-size:12px;line-height:1.55">${footer}</p></td></tr><tr><td style="padding:18px 32px;background:#f7faff;color:#71838d;font-size:11px;text-align:center">Dshare Quiz Online · Học chủ động, tiến bộ rõ ràng</td></tr></table></td></tr></table></body></html>`;
}

export function buildPaymentConfirmationEmail(input: PaymentConfirmationInput): PreparedEmail {
  const name = escapeHtml(input.learnerName?.trim() || "bạn");
  const planName = escapeHtml(input.planName);
  const origin = appOrigin(input.appOrigin);
  const pointRow = input.pointAmount > 0 ? `<tr><td style="padding:8px 0;color:#617786">Point thưởng</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#007453">+${input.pointAmount.toLocaleString("vi-VN")} Point</td></tr>` : "";
  const orderRow = input.orderCode ? `<tr><td style="padding:8px 0;color:#617786">Mã đơn</td><td style="padding:8px 0;text-align:right;font-family:monospace;font-weight:700">${input.orderCode}</td></tr>` : "";
  return { subject: `Xác nhận kích hoạt ${input.planName} · Dshare Quiz Online`, html: emailLayout({ eyebrow: "Thanh toán thành công", title: "Gói học của bạn đã sẵn sàng", body: `Chào <strong>${name}</strong>, Dshare đã xác nhận thanh toán và kích hoạt gói <strong>${planName}</strong> cho tài khoản của bạn.<div style="margin-top:22px">${emailButton(`${origin}/account`, "Tới không gian học tập")}</div>`, card: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:0 0 12px;font-size:16px;font-weight:800;color:#172554" colspan="2">${planName}</td></tr><tr><td style="padding:8px 0;color:#617786">Số tiền thanh toán</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#172554">${formatVnd(input.amount)}</td></tr><tr><td style="padding:8px 0;color:#617786">Thời hạn gói</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#172554">${input.membershipMonths} tháng</td></tr>${pointRow}${orderRow}</table><div style="margin-top:18px">${emailButton(`${origin}/quiz`, "Khám phá Quiz")}</div>`, footer: "Bạn có thể bắt đầu học, làm Quiz hoặc xem quyền lợi gói ngay trong không gian học tập. Nếu bạn không thực hiện giao dịch này, vui lòng liên hệ bộ phận hỗ trợ Dshare." }) };
}

export function buildTestEmail(recipient: string): PreparedEmail {
  return { subject: "Email thử nghiệm · Dshare Quiz Online", html: emailLayout({ eyebrow: "Kiểm tra kết nối", title: "Kết nối email đã sẵn sàng", body: `Email thử nghiệm này được gửi tới <strong>${escapeHtml(recipient)}</strong> từ cấu hình Quản trị Dshare.`, card: `<p style="margin:0;color:#172554;font-size:14px;line-height:1.6">Nếu bạn nhận được email này, địa chỉ gửi và kết nối API email đang hoạt động. Bạn có thể bật email xác nhận thanh toán khi sẵn sàng.</p>`, footer: "Đây là email kiểm tra, không liên quan đến bất kỳ đơn thanh toán nào." }) };
}

export function buildContactEmailVerification(input: ContactEmailVerificationInput): PreparedEmail {
  const name = escapeHtml(input.learnerName?.trim() || "bạn");
  const verificationUrl = `${appOrigin(input.appOrigin)}/account/profile?verifyContactEmail=${encodeURIComponent(input.verificationToken)}`;
  return { subject: "Xác nhận email liên hệ mới · Dshare Quiz Online", html: emailLayout({ eyebrow: "Xác nhận email", title: "Xác nhận địa chỉ email mới", body: `Chào <strong>${name}</strong>, Dshare nhận được yêu cầu cập nhật email liên hệ. Vui lòng xác nhận địa chỉ email này để hoàn tất thay đổi.<div style="margin-top:22px">${emailButton(verificationUrl, "Xác nhận email")}</div>`, card: `<p style="margin:0;color:#172554;font-size:14px;line-height:1.6">Liên kết có hiệu lực trong <strong>24 giờ</strong>. Nếu bạn không yêu cầu thay đổi này, bạn có thể bỏ qua email và địa chỉ hiện tại sẽ không bị thay đổi.</p>`, footer: "Dshare không bao giờ yêu cầu mật khẩu qua email. Chỉ xác nhận khi bạn vừa cập nhật thông tin trong tài khoản của mình." }) };
}

export function buildPasswordResetEmail(input: PasswordResetInput): PreparedEmail {
  const name = escapeHtml(input.learnerName?.trim() || "bạn");
  const resetUrl = `${appOrigin(input.appOrigin)}/?resetPassword=${encodeURIComponent(input.resetToken)}`;
  return { subject: "Đặt lại mật khẩu · Dshare Quiz Online", html: emailLayout({ eyebrow: "Khôi phục mật khẩu", title: "Đặt lại mật khẩu của bạn", body: `Chào <strong>${name}</strong>, chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản Dshare của bạn.<div style="margin-top:22px">${emailButton(resetUrl, "Đặt lại mật khẩu")}</div>`, card: `<p style="margin:0;color:#172554;font-size:14px;line-height:1.6">Liên kết có hiệu lực trong <strong>30 phút</strong> và chỉ sử dụng được một lần. Nếu bạn không gửi yêu cầu này, hãy bỏ qua email.</p>`, footer: "Dshare không bao giờ yêu cầu bạn gửi mật khẩu qua email. Hãy dùng liên kết trên chỉ khi bạn vừa yêu cầu khôi phục tài khoản." }) };
}

async function sendPreparedEmail(config: EmailDeliveryConfig, recipient: string | null, email: PreparedEmail) {
  if (!isEmailDeliveryConfigured(config) || !recipient) return { attempted: false, sent: false, reason: "not_configured" as const, subject: email.subject, recipient: recipient ?? "" };
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${decryptEmailApiKey(config.apiKeyCiphertext!)}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: config.fromEmail, to: [recipient], subject: email.subject, html: email.html }) });
  const payload = await response.json().catch(() => ({})) as { id?: string; message?: string };
  if (!response.ok) throw new Error(payload.message || `Email provider trả về lỗi ${response.status}.`);
  return { attempted: true, sent: true, subject: email.subject, recipient, providerMessageId: payload.id ?? null };
}

export async function sendPaymentConfirmationEmail(config: EmailDeliveryConfig, input: PaymentConfirmationInput) { return sendPreparedEmail(config, input.recipient, buildPaymentConfirmationEmail(input)); }
export async function sendTestEmail(config: EmailDeliveryConfig, recipient: string) { return sendPreparedEmail({ ...config, isEnabled: true }, recipient, buildTestEmail(recipient)); }
export async function sendContactEmailVerification(config: EmailDeliveryConfig, input: ContactEmailVerificationInput) { return sendPreparedEmail(config, input.recipient, buildContactEmailVerification(input)); }
export async function sendPasswordResetEmail(config: EmailDeliveryConfig, input: PasswordResetInput) { return sendPreparedEmail(config, input.recipient, buildPasswordResetEmail(input)); }
