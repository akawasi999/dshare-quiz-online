import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  paymentRecord: null as Record<string, unknown> | null,
  profile: null as Record<string, unknown> | null,
  txSelectCount: 0,
  transaction: vi.fn(),
  updates: [] as Array<Record<string, unknown>>,
  inserts: [] as Array<Record<string, unknown>>,
}));

vi.mock("./db", () => ({
  ensureLearnerProfile: vi.fn(async () => undefined),
  getDb: vi.fn(async () => ({
    select: () => ({ from: () => ({ where: () => ({ limit: async () => [harness.paymentRecord] }) }) }),
    transaction: harness.transaction,
  })),
}));

import { processPayosWebhook } from "./payosWebhook";

function query(result: unknown) {
  return { from: () => ({ where: () => ({ limit: async () => result }) }) };
}

describe("PayOS webhook integration", () => {
  beforeEach(() => {
    harness.updates = [];
    harness.inserts = [];
    harness.txSelectCount = 0;
    harness.transaction.mockReset();
    harness.paymentRecord = {
      id: 42, userId: 7, status: "pending", payosOrderCode: 1787025000123001, amount: 30_000,
      itemType: "points", itemCode: "point_150", pointAmount: 150, targetTier: null, membershipMonths: null, payosPaymentLinkId: "link-1",
    };
    harness.profile = { id: 9, userId: 7, tier: "basic", tierExpiresAt: null, pointBalance: 20 };
    const tx = {
      select: () => query(harness.txSelectCount++ === 0 ? [harness.paymentRecord] : [harness.profile]),
      update: () => ({ set: (value: Record<string, unknown>) => ({ where: async () => { harness.updates.push(value); return [{ affectedRows: 1 }]; } }) }),
      insert: () => ({ values: async (value: Record<string, unknown>) => { harness.inserts.push(value); return {}; } }),
    };
    harness.transaction.mockImplementation(async (callback: (tx: typeof tx) => unknown) => callback(tx));
  });

  it("xác nhận một đơn, ghi paid, cộng Point và tạo đúng một dòng sổ cái", async () => {
    const result = await processPayosWebhook({ code: "00", desc: "success", success: true, signature: "test", data: { orderCode: 1787025000123001, amount: 30_000, code: "00", desc: "success", currency: "VND", reference: "REF-1", paymentLinkId: "link-1" } });
    expect(result).toMatchObject({ idempotent: false, recordId: 42, status: "paid" });
    expect(harness.updates).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: "paid" }),
      expect.objectContaining({ pointBalance: 170, tier: "basic" }),
    ]));
    expect(harness.inserts).toEqual(expect.arrayContaining([
      expect.objectContaining({ userId: 7, type: "top_up", amount: 150, balanceAfter: 170, referenceId: 42 }),
    ]));
    expect(harness.inserts.filter(item => item.type === "top_up")).toHaveLength(1);
  });

  it("không mở transaction và không nhân đôi sổ cái khi đơn đã paid", async () => {
    harness.paymentRecord = { ...harness.paymentRecord!, status: "paid" };
    const result = await processPayosWebhook({ code: "00", desc: "success", success: true, signature: "test", data: { orderCode: 1787025000123001, amount: 30_000, code: "00", desc: "success", currency: "VND" } });
    expect(result).toEqual({ idempotent: true, recordId: 42 });
    expect(harness.transaction).not.toHaveBeenCalled();
    expect(harness.inserts).toHaveLength(0);
  });

  it("cấp Premium, hạn dùng và Point thưởng đúng một lần trong luồng webhook membership", async () => {
    harness.paymentRecord = {
      id: 88, userId: 7, status: "pending", payosOrderCode: 1787025000123002, amount: 100_000,
      itemType: "membership", itemCode: "premium_monthly", pointAmount: 1_000, targetTier: "premium", membershipMonths: 1, payosPaymentLinkId: "link-2",
    };
    harness.profile = { id: 9, userId: 7, tier: "basic", tierExpiresAt: null, pointBalance: 35 };
    const result = await processPayosWebhook({ code: "00", desc: "success", success: true, signature: "test", data: { orderCode: 1787025000123002, amount: 100_000, code: "00", desc: "success", currency: "VND", reference: "REF-2", paymentLinkId: "link-2" } });
    expect(result).toMatchObject({ idempotent: false, recordId: 88, status: "paid" });
    expect(harness.updates).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: "paid" }),
      expect.objectContaining({ pointBalance: 1_035, tier: "premium", tierExpiresAt: expect.any(Date) }),
    ]));
    expect(harness.inserts).toEqual(expect.arrayContaining([
      expect.objectContaining({ userId: 7, type: "plan_upgrade", amount: 1_000, balanceAfter: 1_035, referenceId: 88 }),
    ]));
    const insertCount = harness.inserts.length;
    harness.paymentRecord = { ...harness.paymentRecord, status: "paid" };
    const duplicate = await processPayosWebhook({ code: "00", desc: "success", success: true, signature: "test", data: { orderCode: 1787025000123002, amount: 100_000, code: "00", desc: "success", currency: "VND" } });
    expect(duplicate).toEqual({ idempotent: true, recordId: 88 });
    expect(harness.inserts).toHaveLength(insertCount);
  });
});
