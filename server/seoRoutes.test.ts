import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { legacyRedirectMiddleware, resolveLegacyRedirect, SITEMAP_PATHS, SITE_ORIGIN } from "./seoRoutes";

describe("SEO routes", () => {
  it("chuyển URL tiếng Việt cũ sang route tiếng Anh, kể cả trang kết quả động", () => {
    expect(resolveLegacyRedirect("/kham-pha")).toBe("/explore");
    expect(resolveLegacyRedirect("/quan-tri/chu-de")).toBe("/admin/learning/topics");
    expect(resolveLegacyRedirect("/ket-qua/42")).toBe("/results/42");
    expect(resolveLegacyRedirect("/api/trpc")).toBeNull();
  });

  it("công bố sitemap chỉ với URL canonical tiếng Anh", () => {
    const sitemap = readFileSync(path.resolve(import.meta.dirname, "../client/public/sitemap.xml"), "utf8");
    for (const route of SITEMAP_PATHS) expect(sitemap).toContain(`${SITE_ORIGIN}${route}`);
    expect(sitemap).not.toContain("/kham-pha");
    expect(sitemap).not.toContain("/bang-gia");
  });

  it("trả HTTP 301 và giữ query string khi khách truy cập URL cũ", () => {
    const redirect = vi.fn();
    const next = vi.fn();
    legacyRedirectMiddleware({ method: "GET", path: "/thanh-toan", originalUrl: "/thanh-toan?status=return&orderCode=12" } as never, { redirect } as never, next);
    expect(redirect).toHaveBeenCalledWith(301, "/payment-status?status=return&orderCode=12");
    expect(next).not.toHaveBeenCalled();
  });
});
