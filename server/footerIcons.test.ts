import { describe, expect, it } from "vitest";
import { getSocialUrlError, socialColorPresets, socialZoneLabels } from "../client/src/components/FooterIcons";

describe("getSocialUrlError", () => {
  it("bắt buộc URL khi nền tảng được bật và chấp nhận URL HTTP(S) hợp lệ", () => {
    expect(getSocialUrlError("", true)).toContain("Nhập URL");
    expect(getSocialUrlError("facebook.com/dshare", false)).toContain("không hợp lệ");
    expect(getSocialUrlError("https://facebook.com/dshare", true)).toBeNull();
    expect(getSocialUrlError("ftp://facebook.com/dshare", true)).toContain("http://");
  });

  it("cung cấp preset màu thương hiệu có tương phản cho mọi nền tảng", () => {
    expect(socialColorPresets.facebook.backgroundColor).toBe("#1877F2");
    expect(socialColorPresets.youtube.iconColor).toBe("#FFFFFF");
    expect(Object.keys(socialColorPresets)).toHaveLength(6);
  });

  it("đặt tên rõ ràng cho ba khu vực social trong Footer", () => {
    expect(Object.keys(socialZoneLabels)).toEqual(["brand", "navigation", "bottom"]);
  });
});
