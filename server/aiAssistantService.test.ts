import { describe, expect, it } from "vitest";
import { buildDshareAssistantMessages, decryptAiAssistantApiKey, encryptAiAssistantApiKey, selectGeminiChatModel } from "./aiAssistantService";

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

  it("thêm môn học và Quiz đã xác nhận như ngữ cảnh hệ thống, không như đáp án để làm bài", () => {
    const messages = buildDshareAssistantMessages(
      [{ role: "user", content: "Giúp tôi lập kế hoạch ôn tập" }],
      { categoryTitle: "Tin học", subject: "IC3", lessonTitle: "Bảng tính", quizTitle: "Ôn tập Excel", difficulty: "medium" },
    );

    expect(messages[1].role).toBe("system");
    expect(messages[1].content).toContain("Môn học: IC3");
    expect(messages[1].content).toContain("Bộ đề đang ôn: Ôn tập Excel");
    expect(messages[1].content).toContain("Không suy diễn hoặc tiết lộ đáp án");
  });

  it("tự chọn Gemini Flash có generateContent và bỏ qua model chuyên biệt", () => {
    const model = selectGeminiChatModel([
      { name: "models/gemini-3.1-flash-image", supportedGenerationMethods: ["generateContent"] },
      { name: "models/gemini-2.5-pro", supportedGenerationMethods: ["generateContent"] },
      { name: "models/gemini-2.5-flash", supportedGenerationMethods: ["generateContent"] },
      { name: "models/gemini-embedding-001", supportedGenerationMethods: ["embedContent"] },
    ]);
    expect(model).toBe("gemini-2.5-flash");
  });
});
