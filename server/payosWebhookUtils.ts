export type PayosWebhookData = {
  orderCode: number;
  amount: number;
  code: string;
  desc: string;
  reference?: string;
  currency?: string;
  paymentLinkId?: string;
};

export function isSuccessfulPayosWebhook(payload: { success: boolean; code: string; data: PayosWebhookData }) {
  return payload.success && payload.code === "00" && payload.data.code === "00";
}

export function getPayosWebhookValidationError(input: { expectedOrderCode: number; expectedAmount: number; payload: { data: PayosWebhookData } }) {
  if (input.payload.data.orderCode !== input.expectedOrderCode) return "Mã đơn PayOS không khớp.";
  if (input.payload.data.amount !== input.expectedAmount) return "Số tiền PayOS không khớp với đơn hàng.";
  if (input.payload.data.currency && input.payload.data.currency !== "VND") return "Đơn PayOS không dùng tiền tệ VND.";
  return null;
}

export function getPayosFulfillmentDecision(input: { currentStatus: "pending" | "paid" | "cancelled" | "failed" | "expired"; webhookSuccess: boolean }) {
  if (input.currentStatus === "paid") return "idempotent" as const;
  if (!input.webhookSuccess) return "mark_failed" as const;
  if (input.currentStatus !== "pending") return "reject" as const;
  return "fulfill" as const;
}
