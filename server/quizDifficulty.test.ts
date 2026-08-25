import { describe, expect, it } from "vitest";
import { getQuizDifficultyTone } from "../client/src/lib/quizDifficulty";

describe("Quiz difficulty tone", () => {
  it("chuẩn hóa Dễ xanh lá, Trung bình cam và Nâng cao hồng", () => {
    expect(getQuizDifficultyTone("Dễ")).toMatchObject({
      label: "Dễ",
      badgeClass: expect.stringContaining("#DCFCE7"),
      dotClass: "bg-[#22C55E]",
    });
    expect(getQuizDifficultyTone("medium")).toMatchObject({
      label: "Trung bình",
      badgeClass: expect.stringContaining("#FFEDD5"),
      dotClass: "bg-[#F97316]",
    });
    expect(getQuizDifficultyTone("Khó")).toMatchObject({
      label: "Nâng cao",
      badgeClass: expect.stringContaining("#FCE7F3"),
      dotClass: "bg-[#EC4899]",
    });
  });
});
