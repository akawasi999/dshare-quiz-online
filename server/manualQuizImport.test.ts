import { describe, expect, it } from "vitest";
import { parseManualQuizSpreadsheetRows, parseManualQuizText } from "./manualQuizImport";

describe("manual Quiz file import", () => {
  it("đọc câu trắc nghiệm có đáp án từ văn bản Word/PDF đã trích xuất", () => {
    const result = parseManualQuizText(`Câu 1: Thủ đô của Việt Nam là đâu?\nA. Hà Nội\nB. Huế\nC. Đà Nẵng\nĐáp án: A\nLời giải: Hà Nội là thủ đô của Việt Nam.`);
    expect(result.warnings).toEqual([]);
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0]).toMatchObject({ prompt: "Thủ đô của Việt Nam là đâu?", type: "single", explanation: "Hà Nội là thủ đô của Việt Nam." });
    expect(result.questions[0]?.options.filter(option => option.isCorrect).map(option => option.body)).toEqual(["Hà Nội"]);
  });

  it("đọc cột chuẩn từ sheet Excel và giữ loại câu, điểm, lời giải, đáp án JSON", () => {
    const result = parseManualQuizSpreadsheetRows([{ prompt: "Chọn các số chẵn", type: "multiple", difficulty: "easy", points: "2", options: '[{"body":"2","isCorrect":true},{"body":"3","isCorrect":false},{"body":"4","isCorrect":true}]', explanation: "Số chẵn chia hết cho 2." }]);
    expect(result.warnings).toEqual([]);
    expect(result.questions[0]).toMatchObject({ prompt: "Chọn các số chẵn", type: "multiple", difficulty: "easy", points: 2, explanation: "Số chẵn chia hết cho 2." });
    expect(result.questions[0]?.options.filter(option => option.isCorrect).map(option => option.body)).toEqual(["2", "4"]);
  });

  it("báo lỗi có thể hành động khi tài liệu không khai báo đáp án đúng", () => {
    const result = parseManualQuizText("Câu 1: Câu không có đáp án\nA. Lựa chọn A\nB. Lựa chọn B");
    expect(result.questions).toHaveLength(0);
    expect(result.warnings[0]).toContain("không xác định được một đáp án đúng");
  });
});
