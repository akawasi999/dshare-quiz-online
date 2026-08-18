import { describe, expect, it } from "vitest";
import { getPayosWebhookValidationError, isSuccessfulPayosWebhook } from "./payosWebhookUtils";

const successPayload = { success: true, code: "00", data: { orderCode: 99, amount: 30_000, code: "00", desc: "success", currency: "VND" } };

describe("PayOS webhook rules", () => {
  it("chỉ chấp nhận webhook thành công khi cả hai mã trạng thái đều thành công", () => {
    expect(isSuccessfulPayosWebhook(successPayload)).toBe(true);
    expect(isSuccessfulPayosWebhook({ ...successPayload, data: { ...successPayload.data, code: "01" } })).toBe(false);
  });

  it("đối soát chính xác mã đơn, số tiền và tiền tệ trước khi cấp quyền", () => {
    expect(getPayosWebhookValidationError({ expectedOrderCode: 99, expectedAmount: 30_000, payload: successPayload })).toBeNull();
    expect(getPayosWebhookValidationError({ expectedOrderCode: 100, expectedAmount: 30_000, payload: successPayload })).toContain("Mã đơn");
    expect(getPayosWebhookValidationError({ expectedOrderCode: 99, expectedAmount: 47_000, payload: successPayload })).toContain("Số tiền");
    expect(getPayosWebhookValidationError({ expectedOrderCode: 99, expectedAmount: 30_000, payload: { ...successPayload, data: { ...successPayload.data, currency: "USD" } } })).toContain("VND");
  });
});
