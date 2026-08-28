import { describe, expect, it } from "vitest";
import { getAiQuizGenerationFileKind, getQuizStudioFileKind, toStudioQuestion, validateAiQuizGenerationFile, validateQuizStudioFile } from "../client/src/lib/quizStudioFile";

describe("quizStudioFile", () => {
  it("nhận diện định dạng tài liệu Studio và chặn tệp không hỗ trợ", () => {
    expect(getQuizStudioFileKind(new File(["a"], "bai-giang.docx"))?.kind).toBe("document");
    expect(getQuizStudioFileKind(new File(["a"], "ngan-hang.xlsx"))?.kind).toBe("spreadsheet");
    expect(validateQuizStudioFile(new File(["a"], "anh.png"))).toContain("Chỉ hỗ trợ");
  });

  it("chuyển câu hỏi nhập từ tệp về cấu trúc draft Studio", () => {
    const question = toStudioQuestion({ prompt: "Điền từ", explanation: "Lời giải", type: "fill_blank", difficulty: "easy", options: [], accepted: "Hà Nội|Ha Noi" });
    expect(question.answerConfig).toEqual({ acceptedAnswers: ["Hà Nội", "Ha Noi"] });
  });

  it("nhận diện Word, PDF, PowerPoint và TXT cho AI sinh câu hỏi", () => {
    expect(getAiQuizGenerationFileKind(new File(["a"], "bai-giang.docx"))?.mimeType).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    expect(getAiQuizGenerationFileKind(new File(["a"], "bai-giang.pdf"))?.mimeType).toBe("application/pdf");
    expect(getAiQuizGenerationFileKind(new File(["a"], "bai-giang.pptx"))?.mimeType).toBe("application/vnd.openxmlformats-officedocument.presentationml.presentation");
    expect(getAiQuizGenerationFileKind(new File(["a"], "bai-giang.txt"))?.mimeType).toBe("text/plain");
    expect(validateAiQuizGenerationFile(new File(["a"], "bai-giang.xlsx"))).toContain("Chỉ hỗ trợ");
  });
});
