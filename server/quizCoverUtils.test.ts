import { describe, expect, it } from "vitest";
import { quizCoverMaxFileSize, validateQuizCoverFile } from "../shared/quizCover";

describe("validateQuizCoverFile", () => {
  it("chấp nhận ảnh JPEG, PNG và WebP trong giới hạn dung lượng", () => {
    expect(validateQuizCoverFile({ type: "image/jpeg", size: quizCoverMaxFileSize })).toBeNull();
    expect(validateQuizCoverFile({ type: "image/png", size: 1_024 })).toBeNull();
    expect(validateQuizCoverFile({ type: "image/webp", size: 2_048 })).toBeNull();
  });

  it("từ chối định dạng hoặc dung lượng không được hỗ trợ", () => {
    expect(validateQuizCoverFile({ type: "image/gif", size: 1_024 })).toBe("Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.");
    expect(validateQuizCoverFile({ type: "image/png", size: quizCoverMaxFileSize + 1 })).toBe("Ảnh bìa cần nhỏ hơn 5 MB.");
  });
});
