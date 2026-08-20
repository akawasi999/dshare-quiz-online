import { describe, expect, it } from "vitest";
import { buildAiAssistantFollowUpPrompts, buildAiAssistantPrompts, defaultAiAssistantPrompts } from "../client/src/lib/aiAssistantPrompts";

describe("aiAssistantPrompts", () => {
  it("trả prompt mặc định khi người học chưa chọn ngữ cảnh", () => {
    expect(buildAiAssistantPrompts({})).toEqual(defaultAiAssistantPrompts);
  });

  it("ưu tiên prompt theo bộ đề, sau đó dùng prompt theo môn học", () => {
    expect(buildAiAssistantPrompts({ subject: "IC3", quiz: { title: "Ôn tập Excel", subjectTitle: "IC3", lessonTitle: "Bảng tính" } })[0]).toContain("Ôn tập Excel");
    expect(buildAiAssistantPrompts({ subject: "Tin học văn phòng" })[2]).toContain("Tin học văn phòng");
  });

  it("tạo câu hỏi tiếp theo từ phản hồi AI và bỏ qua nội dung quá ngắn", () => {
    const prompts = buildAiAssistantFollowUpPrompts("## Hàm VLOOKUP\nHàm này giúp tìm dữ liệu theo cột trong bảng tính Excel.");
    expect(prompts).toHaveLength(3);
    expect(prompts[0]).toContain("Hàm VLOOKUP");
    expect(buildAiAssistantFollowUpPrompts("Ngắn")).toEqual([]);
  });
});
