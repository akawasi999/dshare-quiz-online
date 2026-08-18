import { describe, expect, it } from "vitest";
import { getWalletTransactionMeta } from "../client/src/lib/walletUtils";

describe("wallet transaction presentation", () => {
  it("phân loại rõ giao dịch cộng và trừ Point", () => {
    expect(getWalletTransactionMeta("quiz_reward", 40)).toMatchObject({ label: "Thưởng hoàn thành", credit: true });
    expect(getWalletTransactionMeta("quiz_fee", -20)).toMatchObject({ label: "Phí làm bài", credit: false });
  });
});
