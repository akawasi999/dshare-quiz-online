import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildImageSitemapXml, buildQuizJsonLd, buildSeoHead, buildSitemapXml, legacyRedirectMiddleware, resolveLegacyRedirect, SITEMAP_PATHS, SITE_ORIGIN } from "./seoRoutes";

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

  it("tạo sitemap có từng Quiz public và metadata chia sẻ canonical", () => {
    const sitemap = buildSitemapXml([{ quizId: 88, createdAt: new Date("2026-08-23T00:00:00.000Z") }]);
    const head = buildSeoHead({ title: "Excel cơ bản · Dshare Quiz Online", description: "Làm Quiz Excel cơ bản.", canonicalPath: "/quiz/88", image: "/manus-storage/excel-cover.png", type: "article", publishedAt: new Date("2026-08-23T00:00:00.000Z") }, { googleAnalyticsMeasurementId: "G-ABCD1234", googleSearchConsoleVerification: "google-verification-token" });
    expect(sitemap).toContain(`${SITE_ORIGIN}/quiz/88`);
    expect(head).toContain(`<link rel="canonical" href="${SITE_ORIGIN}/quiz/88"`);
    expect(head).toContain("og:image");
    expect(head).toContain("twitter:card");
    expect(head).toContain("google-site-verification");
    expect(head).toContain("googletagmanager.com/gtag/js?id=G-ABCD1234");
  });

  it("tạo sitemap hình ảnh và JSON-LD Quiz không tiết lộ đáp án", () => {
    const imageSitemap = buildImageSitemapXml([{ quizId: 88, title: "Excel cơ bản", coverImageUrl: "/manus-storage/excel-cover.png" }]);
    const jsonLd = buildQuizJsonLd({ quizId: 88, title: "Excel cơ bản", summary: "Ôn tập Excel.", image: "/manus-storage/excel-cover.png", datePublished: new Date("2026-08-23T00:00:00.000Z"), category: "Tin học", questions: [{ prompt: "Hàm SUM dùng để làm gì?" }] });
    expect(imageSitemap).toContain("xmlns:image");
    expect(imageSitemap).toContain("/manus-storage/excel-cover.png");
    expect(jsonLd).toMatchObject({ "@type": "LearningResource", learningResourceType: "Quiz" });
    expect(JSON.stringify(jsonLd)).toContain("Hàm SUM dùng để làm gì?");
    expect(JSON.stringify(jsonLd)).not.toContain("isCorrect");
  });
});
