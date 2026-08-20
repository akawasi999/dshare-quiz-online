import { describe, expect, it } from "vitest";
import { buildDshareAssistantMessages, decryptAiAssistantApiKey, encryptAiAssistantApiKey } from "./aiAssistantService";

describe("aiAssistantService", () => {
  it("mã hóa Gemini API key bằng dữ liệu có IV ngẫu nhiên và giải mã chính xác", () => {
    const apiKey = "AIza-demo-secret-key";
    const encryptedA = encryptAiAssistantApiKey(apiKey);
    const encryptedB = encryptAiAssistantApiKey(apiKey);

    expect(encryptedA).toMatch(/^v1:/);
    expect(encryptedA).not.toContain(apiKey);
    expect(encryptedA).not.toBe(encryptedB);
    expect(decryptAiAssistantApiKey(encryptedA)).toBe(apiKey);
  });

  it("từ chối ciphertext không đúng phiên bản và giữ hướng dẫn chống gian lận trong system prompt", () => {
    expect(() => decryptAiAssistantApiKey("invalid")).toThrow("Cấu hình khóa AI không hợp lệ");
    const messages = buildDshareAssistantMessages([{ role: "user", content: "Giúp tôi làm bài" }]);

    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toContain("Không hỗ trợ gian lận");
    expect(messages[1]).toEqual({ role: "user", content: "Giúp tôi làm bài" });
  });
});
