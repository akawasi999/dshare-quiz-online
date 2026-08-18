import { createHmac, timingSafeEqual } from "node:crypto";

export type PaymentPackageCode = "point_150" | "point_250" | "point_500" | "point_1000" | "pro_monthly" | "premium_monthly";

export type PaymentPackage = {
  code: PaymentPackageCode;
  itemType: "points" | "membership";
  label: string;
  regularAmount: number;
  pointAmount: number;
  targetTier?: "pro" | "premium";
  membershipMonths?: number;
};

export const paymentPackages: Record<PaymentPackageCode, PaymentPackage> = {
  point_150: { code: "point_150", itemType: "points", label: "150 Point", regularAmount: 30_000, pointAmount: 150 },
  point_250: { code: "point_250", itemType: "points", label: "250 Point", regularAmount: 47_000, pointAmount: 250 },
  point_500: { code: "point_500", itemType: "points", label: "500 Point", regularAmount: 89_000, pointAmount: 500 },
  point_1000: { code: "point_1000", itemType: "points", label: "1.000 Point", regularAmount: 169_000, pointAmount: 1_000 },
  pro_monthly: { code: "pro_monthly", itemType: "membership", label: "Gói PRO (Pro) · 1 tháng", regularAmount: 50_000, pointAmount: 150, targetTier: "pro", membershipMonths: 1 },
  premium_monthly: { code: "premium_monthly", itemType: "membership", label: "Gói PREMIUM (Premium) · 1 tháng", regularAmount: 100_000, pointAmount: 1_000, targetTier: "premium", membershipMonths: 1 },
};

export function isPaymentPackageCode(value: string): value is PaymentPackageCode {
  return value in paymentPackages;
}

export function getPaymentPackage(code: PaymentPackageCode) {
  return paymentPackages[code];
}

export function buildPaymentOffer(pkg: PaymentPackage, previousPaidPurchases: number) {
  const discounted = isFirstPurchaseDiscountEligible(pkg, previousPaidPurchases);
  return {
    ...pkg,
    amount: getPaymentAmount(pkg, previousPaidPurchases),
    discounted,
    discountLabel: discounted ? "Giảm 50% lần mua đầu" : null,
  };
}

export function getPaymentAmount(pkg: PaymentPackage, previousPaidPurchases: number) {
  return pkg.itemType === "membership" && previousPaidPurchases === 0
    ? Math.floor(pkg.regularAmount / 2)
    : pkg.regularAmount;
}

export function isFirstPurchaseDiscountEligible(pkg: PaymentPackage, previousPaidPurchases: number) {
  return pkg.itemType === "membership" && previousPaidPurchases === 0;
}

export function createPayosOrderCode(now = Date.now(), random = Math.random) {
  return now * 1_000 + Math.floor(random() * 1_000);
}

export function buildPayosSignaturePayload(data: Record<string, unknown>) {
  return Object.keys(data)
    .filter(key => key !== "signature")
    .sort((a, b) => a.localeCompare(b))
    .map(key => `${key}=${data[key] == null ? "" : String(data[key])}`)
    .join("&");
}

export function createPayosSignature(data: Record<string, unknown>, checksumKey: string) {
  return createHmac("sha256", checksumKey).update(buildPayosSignaturePayload(data)).digest("hex");
}

export function verifyPayosSignature(data: Record<string, unknown>, signature: string, checksumKey: string) {
  const expected = createPayosSignature(data, checksumKey);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function addMembershipMonths(base: Date, months: number) {
  const result = new Date(base);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}
