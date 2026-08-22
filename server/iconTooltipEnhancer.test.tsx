// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { annotateIconTooltips, isIconOnlyControl } from "../client/src/components/IconTooltipEnhancer";

describe("IconTooltipEnhancer", () => {
  it("gắn tooltip từ aria-label cho control chỉ có icon và bỏ qua control có chữ", () => {
    const root = document.createElement("div");
    root.innerHTML = '<button aria-label="Mở bộ lọc"><svg></svg></button><button><svg class="lucide lucide-trash-2"></svg></button><button aria-label="Lưu thay đổi"><svg></svg>Lưu</button>';
    const [iconButton, fallbackButton, textButton] = Array.from(root.querySelectorAll("button"));

    expect(isIconOnlyControl(iconButton!)).toBe(true);
    annotateIconTooltips(root);

    expect(iconButton?.getAttribute("data-icon-tooltip")).toBe("Mở bộ lọc");
    expect(fallbackButton?.getAttribute("aria-label")).toBe("Xóa");
    expect(fallbackButton?.getAttribute("data-icon-tooltip")).toBe("Xóa");
    expect(textButton?.hasAttribute("data-icon-tooltip")).toBe(false);
  });
});
