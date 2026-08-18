import { createPayosSignature } from "./payosUtils";

type PayosLinkResponse = {
  code?: string;
  desc?: string;
  data?: { paymentLinkId?: string; checkoutUrl?: string };
};

export function buildPayosCallbackUrls(origin: string, orderCode: number) {
  const base = origin.replace(/\/$/, "");
  return {
    returnUrl: `${base}/thanh-toan?status=return&orderCode=${orderCode}`,
    cancelUrl: `${base}/thanh-toan?status=cancel&orderCode=${orderCode}`,
  };
}

export function buildPayosCreateRequest(input: { orderCode: number; amount: number; description: string; returnUrl: string; cancelUrl: string; checksumKey: string }) {
  const unsigned = {
    orderCode: input.orderCode,
    amount: input.amount,
    description: input.description,
    returnUrl: input.returnUrl,
    cancelUrl: input.cancelUrl,
  };
  return { ...unsigned, signature: createPayosSignature(unsigned, input.checksumKey) };
}

export async function createPayosPaymentLink(input: {
  clientId: string;
  apiKey: string;
  checksumKey: string;
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}) {
  const payload = buildPayosCreateRequest(input);
  const response = await fetch("https://api-merchant.payos.vn/v2/payment-requests", {
    method: "POST",
    headers: { "content-type": "application/json", "x-client-id": input.clientId, "x-api-key": input.apiKey },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({})) as PayosLinkResponse;
  if (!response.ok || body.code !== "00" || !body.data?.checkoutUrl || !body.data.paymentLinkId) {
    throw new Error(body.desc || "PayOS chưa thể tạo liên kết thanh toán.");
  }
  return { paymentLinkId: body.data.paymentLinkId, checkoutUrl: body.data.checkoutUrl };
}
