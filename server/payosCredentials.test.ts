import { describe, expect, it } from "vitest";

describe("PayOS credentials", () => {
  it("xác thực được với API PayOS bằng truy vấn chỉ đọc không tạo giao dịch", async () => {
    const clientId = process.env.PAYOS_CLIENT_ID;
    const apiKey = process.env.PAYOS_API_KEY;
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
    expect(clientId).toBeTruthy();
    expect(apiKey).toBeTruthy();
    expect(checksumKey).toBeTruthy();

    const response = await fetch("https://api-merchant.payos.vn/v2/payment-requests/0", {
      headers: { "x-client-id": clientId!, "x-api-key": apiKey! },
    });

    expect([401, 403]).not.toContain(response.status);
  }, 15_000);
});
