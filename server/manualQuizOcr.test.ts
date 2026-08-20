import { describe, expect, it, vi } from "vitest";

const llm = vi.hoisted(() => ({
  listLLMModels: vi.fn(async () => ({ data: [{ id: "gemini-3-flash-preview" }] })),
  invokeLLM: vi.fn(async () => ({ choices: [{ message: { content: "Câu 1: Bản quét minh họa có đầy đủ nội dung để kiểm tra OCR từ PDF dạng ảnh.\nA. Đáp án A\nB. Đáp án B\nĐáp án: A\nLời giải: Đây là nội dung OCR hợp lệ." } }] })),
}));

vi.mock("./_core/llm", () => llm);

import { ocrPdfWithVision } from "./manualQuizImport";

describe("manual Quiz OCR fallback", () => {
  it("gửi PDF dạng ảnh tới mô hình thị giác và trả lại văn bản OCR", async () => {
    const text = await ocrPdfWithVision("data:application/pdf;base64,JVBERi0xLjQ=");
    expect(text).toContain("Câu 1");
    expect(llm.invokeLLM).toHaveBeenCalledWith(expect.objectContaining({ model: "gemini-3-flash-preview" }));
    const call = llm.invokeLLM.mock.calls[0]?.[0];
    expect(call.messages[1].content).toEqual(expect.arrayContaining([expect.objectContaining({ type: "file_url" })]));
  });
});
