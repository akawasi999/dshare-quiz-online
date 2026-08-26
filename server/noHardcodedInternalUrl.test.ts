import { describe, expect, it } from "vitest";
import { isHardcodedInternalUrl } from "./eslint-rules/no-hardcoded-internal-url.mjs";

describe("no-hardcoded-internal-url", () => {
  it("cảnh báo URL điều hướng nội bộ và cho phép đường dẫn static/API", () => {
    expect(isHardcodedInternalUrl("/my-quizzes")).toBe(true);
    expect(isHardcodedInternalUrl("/manus-storage/logo.png")).toBe(false);
    expect(isHardcodedInternalUrl("https://example.com")).toBe(false);
  });
});
