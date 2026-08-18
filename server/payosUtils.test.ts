import { describe, expect, it } from "vitest";
import {
  addMembershipMonths,
  buildPayosSignaturePayload,
  buildPaymentOffer,
  createPayosOrderCode,
  createPayosSignature,
  getPaymentAmount,
  getPaymentPackage,
  isFirstPurchaseDiscountEligible,
  verifyPayosSignature,
} from "./payosUtils";

describe("PayOS package rules", () => {
  it("giữ đúng bảng giá Point đã được phê duyệt", () => {
    expect(getPaymentPackage("point_150")).toMatchObject({ regularAmount: 30_000, pointAmount: 150 });
    expect(getPaymentPackage("point_250")).toMatchObject({ regularAmount: 47_000, pointAmount: 250 });
    expect(getPaymentPackage("point_500")).toMatchObject({ regularAmount: 89_000, pointAmount: 500 });
    expect(getPaymentPackage("point_1000")).toMatchObject({ regularAmount: 169_000, pointAmount: 1_000 });
  });

  it("chỉ giảm 50% cho lần mua đầu tiên của từng gói thành viên", () => {
    const pro = getPaymentPackage("pro_monthly");
    const premium = getPaymentPackage("premium_monthly");
    expect(getPaymentAmount(pro, 0)).toBe(25_000);
    expect(getPaymentAmount(pro, 1)).toBe(50_000);
    expect(getPaymentAmount(premium, 0)).toBe(50_000);
    expect(getPaymentAmount(premium, 2)).toBe(100_000);
    expect(isFirstPurchaseDiscountEligible(pro, 0)).toBe(true);
    expect(isFirstPurchaseDiscountEligible(pro, 1)).toBe(false);
  });

  it("trả payload offer Standard/PRO đúng giá ưu đãi và Point thưởng cho giao diện", () => {
    expect(buildPaymentOffer(getPaymentPackage("pro_monthly"), 0)).toMatchObject({ label: "Standard (Pro) · 1 tháng", amount: 25_000, regularAmount: 50_000, pointAmount: 150, targetTier: "pro", discounted: true, discountLabel: "Giảm 50% lần mua đầu" });
    expect(buildPaymentOffer(getPaymentPackage("premium_monthly"), 0)).toMatchObject({ label: "Gói PRO (Premium) · 1 tháng", amount: 50_000, regularAmount: 100_000, pointAmount: 1_000, targetTier: "premium", discounted: true });
    expect(buildPaymentOffer(getPaymentPackage("premium_monthly"), 1)).toMatchObject({ amount: 100_000, discounted: false, discountLabel: null });
  });
});

describe("PayOS signature and membership helpers", () => {
  it("tạo và xác minh chữ ký HMAC từ dữ liệu được sắp xếp theo key", () => {
    const data = { amount: 30_000, orderCode: 1_787_025_000_123_001, code: "00", description: "DSP123" };
    const checksumKey = "unit-test-key";
    const signature = createPayosSignature(data, checksumKey);
    expect(buildPayosSignaturePayload(data)).toBe("amount=30000&code=00&description=DSP123&orderCode=1787025000123001");
    expect(verifyPayosSignature(data, signature, checksumKey)).toBe(true);
    expect(verifyPayosSignature({ ...data, amount: 30_001 }, signature, checksumKey)).toBe(false);
  });

  it("tạo mã đơn số và gia hạn gói theo tháng UTC", () => {
    expect(createPayosOrderCode(1_787_025_000_000, () => 0.456)).toBe(1_787_025_000_000_456);
    expect(addMembershipMonths(new Date("2026-01-31T00:00:00.000Z"), 1).toISOString()).toBe("2026-03-03T00:00:00.000Z");
  });
});
