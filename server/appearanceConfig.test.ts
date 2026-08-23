import { describe, expect, it } from "vitest";
import { defaultAppearanceConfig, mergeAppearanceConfig } from "../client/src/lib/appearanceConfig";

describe("Appearance configuration", () => {
  it("giữ các token mặc định khi đọc cấu hình cũ chưa có styleConfig", () => {
    const config = mergeAppearanceConfig(null);
    expect(config.colors.primary).toBe(defaultAppearanceConfig.colors.primary);
    expect(config.header.height).toBe(68);
    expect(config.studio.questionsWidth).toBe(1440);
  });

  it("hợp nhất token mới mà không làm mất các thiết lập lồng nhau", () => {
    const config = mergeAppearanceConfig({ colors: { primary: "#123456" }, header: { sticky: true }, studio: { questionsWidth: 1120 } });
    expect(config.colors.primary).toBe("#123456");
    expect(config.colors.success).toBe(defaultAppearanceConfig.colors.success);
    expect(config.header.sticky).toBe(true);
    expect(config.header.height).toBe(68);
    expect(config.studio.questionsWidth).toBe(1120);
  });
});
