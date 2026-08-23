import { describe, expect, it } from "vitest";
import { plainTextToRichHtml, richTextToPlainText, sanitizeRichTextHtml } from "../shared/richText";

describe("rich text safety", () => {
  it("giữ lại định dạng allowlist và loại bỏ script, thuộc tính nguy hiểm", () => {
    const result = sanitizeRichTextHtml('<h2 onclick="alert(1)">Tiêu đề</h2><p>Văn bản <strong>quan trọng</strong><script>alert(1)</script></p><img src=x onerror=alert(1)>');
    expect(result).toContain("<h2>Tiêu đề</h2>");
    expect(result).toContain("<strong>quan trọng</strong>");
    expect(result).not.toContain("script");
    expect(result).not.toContain("onclick");
    expect(result).not.toContain("img");
  });

  it("chuyển nội dung plain text cũ sang rich text mà không mất văn bản", () => {
    const html = plainTextToRichHtml("Đoạn một\n\nĐoạn hai");
    expect(html).toBe("<p>Đoạn một</p><p>Đoạn hai</p>");
    expect(richTextToPlainText(html)).toContain("Đoạn hai");
  });
});
