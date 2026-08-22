import { describe, expect, it } from "vitest";
import { buildPayosCallbackUrls, buildPayosCreateRequest } from "./payosService";
import { verifyPayosSignature } from "./payosUtils";

describe("PayOS payment request", () => {
  it("tạo URL kết quả cùng origin và payload có chữ ký đúng", () => {
    const urls = buildPayosCallbackUrls("https://quiz.example.vn/", 1_787_025_000_123_001);
    expect(urls).toEqual({
      returnUrl: "https://quiz.example.vn/payment-status?status=return&orderCode=1787025000123001",
      cancelUrl: "https://quiz.example.vn/payment-status?status=cancel&orderCode=1787025000123001",
    });
    const request = buildPayosCreateRequest({ orderCode: 1_787_025_000_123_001, amount: 30_000, description: "DS point_150", ...urls, checksumKey: "unit-test-key" });
    expect(request.signature).toBeTruthy();
    expect(verifyPayosSignature(request, request.signature, "unit-test-key")).toBe(true);
  });
});
