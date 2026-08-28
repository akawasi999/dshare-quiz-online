import { describe, expect, it } from "vitest";
import { getAiQuizFileMimeType, normalizeExtractedFileText, parseGeneratedFileQuizQuestions } from "./fileQuizGeneration";

describe("fileQuizGeneration", () => {
  it("nhận diện bốn định dạng được phép và chuẩn hóa văn bản trích xuất", () => {
    expect(getAiQuizFileMimeType("Bai giang.PDF")).toBe("application/pdf");
    expect(getAiQuizFileMimeType("Bai giang.docx")).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    expect(getAiQuizFileMimeType("Bai giang.pptx")).toBe("application/vnd.openxmlformats-officedocument.presentationml.presentation");
    expect(getAiQuizFileMimeType("Bai giang.txt")).toBe("text/plain");
    expect(getAiQuizFileMimeType("Bai giang.xlsx")).toBeNull();
    expect(normalizeExtractedFileText("  Hàng 1\r\n\r\n\r\nHàng\t\t2\u0000  ")).toBe("Hàng 1\n\nHàng 2");
  });

  it("xác thực và chuẩn hóa đầu ra AI thành dữ liệu Studio bốn dạng", () => {
    const questions = parseGeneratedFileQuizQuestions({ questions: [
      { type: "single", difficulty: "easy", points: 2, prompt: "Trái Đất quay quanh thiên thể nào?", explanation: "Trái Đất quay quanh Mặt Trời.", options: [{ body: "Mặt Trời", isCorrect: true }, { body: "Mặt Trăng", isCorrect: false }, { body: "Sao Hỏa", isCorrect: false }, { body: "Sao Kim", isCorrect: false }], answerConfig: {} },
      { type: "true_false_statements", difficulty: "medium", points: 3, prompt: "Chọn Có hoặc Không cho các nhận định sau.", explanation: "Đối chiếu từng nhận định với kiến thức bài học.", options: [], answerConfig: { statements: [{ text: "Nước sôi ở 100 độ C.", answer: "Có" }, { text: "Mặt Trời quay quanh Trái Đất.", answer: "Không" }] } },
      { type: "matching", difficulty: "medium", points: 3, prompt: "Ghép chất với công thức hóa học tương ứng.", explanation: "Mỗi chất có một công thức hóa học riêng.", options: [], answerConfig: { pairs: [{ left: "Nước", right: "H2O" }, { left: "Muối ăn", right: "NaCl" }] } },
      { type: "ordering", difficulty: "hard", points: 4, prompt: "Sắp xếp thứ tự các bước bay hơi của nước.", explanation: "Nước cần nhận nhiệt trước khi bốc hơi.", options: [], answerConfig: { steps: ["Đun nóng nước", "Nước bốc hơi"] } },
    ] }, 4);
    expect(questions).toHaveLength(4);
    expect(questions[1]?.answerConfig).toMatchObject({ statements: [{ correct: true }, { correct: false }] });
    expect((questions[2]?.answerConfig.pairs as Array<{ left: string; right: string }>)[0]).toMatchObject({ left: "Nước", right: "H2O" });
    expect(questions[3]?.answerConfig).toMatchObject({ orderingItems: [{ id: "step-1", text: "Đun nóng nước" }, { id: "step-2", text: "Nước bốc hơi" }] });
  });
});
