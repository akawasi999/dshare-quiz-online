import { describe, expect, it } from "vitest";
import { getInitialTheme } from "../client/src/lib/themeUtils";

describe("theme preference", () => {
  it("khôi phục đúng chủ đề đã lưu", () => {
    expect(getInitialTheme("dark")).toBe("dark");
    expect(getInitialTheme("light", "dark")).toBe("light");
  });
  it("trở về chủ đề mặc định khi storage trống hoặc không hợp lệ", () => {
    expect(getInitialTheme(null)).toBe("light");
    expect(getInitialTheme("contrast", "dark")).toBe("dark");
  });
  it("ưu tiên chủ đề được chỉ định trong URL khi có", () => {
    expect(getInitialTheme("light", "light", "dark")).toBe("dark");
    expect(getInitialTheme("dark", "light", "invalid")).toBe("dark");
  });
});
