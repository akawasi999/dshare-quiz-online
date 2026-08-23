import { describe, expect, it } from "vitest";
import { getSocialUrlError } from "../client/src/components/FooterIcons";

describe("getSocialUrlError", () => {
  it("bắt buộc URL khi nền tảng được bật và chấp nhận URL HTTP(S) hợp lệ", () => {
    expect(getSocialUrlError("", true)).toContain("Nhập URL");
    expect(getSocialUrlError("facebook.com/dshare", false)).toContain("không hợp lệ");
    expect(getSocialUrlError("https://facebook.com/dshare", true)).toBeNull();
    expect(getSocialUrlError("ftp://facebook.com/dshare", true)).toContain("http://");
  });
});
