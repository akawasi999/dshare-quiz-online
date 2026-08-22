import { describe, expect, it } from "vitest";
import { buildTopicPath, isTopicDescendantPath, normalizeCpanelLearningSlug, remapDescendantPath } from "./cpanelLearningUtils";

describe("CPanel Learning Topic invariants", () => {
  it("chuẩn hóa slug tiếng Việt một cách ổn định", () => {
    expect(normalizeCpanelLearningSlug("  Tin học văn phòng & Excel  ")).toBe("tin-hoc-van-phong-excel");
    expect(normalizeCpanelLearningSlug("Đề 01!!!")).toBe("de-01");
  });

  it("tạo materialized path đúng cho root và node con", () => {
    expect(buildTopicPath(null, 4)).toBe("/4/");
    expect(buildTopicPath("/4/", 7)).toBe("/4/7/");
  });

  it("phát hiện node con không được dùng làm cha để ngăn cycle", () => {
    expect(isTopicDescendantPath("/4/7/11/", "/4/7/")).toBe(true);
    expect(isTopicDescendantPath("/4/8/", "/4/7/")).toBe(false);
  });

  it("remap path của descendant khi di chuyển một nhánh", () => {
    expect(remapDescendantPath("/4/7/11/", "/4/7/", "/9/7/")).toBe("/9/7/11/");
  });
});
