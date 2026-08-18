import { describe, expect, it } from "vitest";
import { getReferralValidationError, normalizeReferralCode } from "./referralUtils";

describe("referral utilities", () => {
  it("chuẩn hóa mã referral trước khi tra cứu", () => expect(normalizeReferralCode(" ds000001 ")).toBe("DS000001"));
  it("chặn áp dụng lặp và tự giới thiệu", () => {
    expect(getReferralValidationError({ code: "DS000002", ownCode: "DS000001", hasReferredByCode: true })).toContain("đã sử dụng");
    expect(getReferralValidationError({ code: "DS000001", ownCode: "DS000001", hasReferredByCode: false })).toContain("chính mình");
    expect(getReferralValidationError({ code: "DS000002", ownCode: "DS000001", hasReferredByCode: false })).toBeNull();
  });
});
