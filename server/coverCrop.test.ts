import { describe, expect, it } from "vitest";
import { calculateCoverCropBounds, defaultCoverCropFocus } from "../shared/coverCrop";

describe("calculateCoverCropBounds", () => {
  it("cắt chính giữa theo tỷ lệ 16:9 khi ảnh nguồn rộng", () => {
    const bounds = calculateCoverCropBounds(2400, 1200, defaultCoverCropFocus);
    expect(bounds.sourceX).toBeCloseTo(133.33333333333334);
    expect(bounds.sourceY).toBe(0);
    expect(bounds.sourceWidth).toBeCloseTo(2133.3333333333335);
    expect(bounds.sourceHeight).toBe(1200);
  });

  it("giới hạn zoom và tâm cắt trong phạm vi ảnh nguồn", () => {
    const bounds = calculateCoverCropBounds(900, 1600, { zoom: 8, focusX: 10, focusY: -10 });
    expect(bounds.sourceX).toBeGreaterThanOrEqual(0);
    expect(bounds.sourceY).toBeGreaterThanOrEqual(0);
    expect(bounds.sourceX + bounds.sourceWidth).toBeLessThanOrEqual(900);
    expect(bounds.sourceY + bounds.sourceHeight).toBeLessThanOrEqual(1600);
  });
});
