import { describe, expect, it } from "vitest";
import { parseCsv } from "./routers";

describe("question bank CSV parser", () => {
  it("keeps JSON option data containing commas within the same CSV cell", () => {
    const rows = parseCsv('lessonId,prompt,options\n"12","Câu hỏi, có dấu phẩy","[{""body"":""A, B"",""isCorrect"":true}]"');
    expect(rows).toHaveLength(2);
    expect(rows[1]).toEqual(["12", "Câu hỏi, có dấu phẩy", '[{"body":"A, B","isCorrect":true}]']);
  });

  it("supports CRLF spreadsheet exports", () => {
    expect(parseCsv("lessonId,prompt\r\n12,Câu hỏi")).toEqual([["lessonId", "prompt"], ["12", "Câu hỏi"]]);
  });
});
