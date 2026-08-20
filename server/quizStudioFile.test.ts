import { describe, expect, it } from "vitest";
import { getQuizStudioFileKind, toStudioQuestion, validateQuizStudioFile } from "../client/src/lib/quizStudioFile";

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
});
