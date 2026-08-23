import type { Express, Request, Response, NextFunction } from "express";
import { LEGACY_ROUTE_MAP, ROUTES } from "../client/src/lib/routes";
import { getDb, getQuizDetail, getQuizQuestionSet, listPublishedCatalog } from "./db";
import { seoSettings } from "../drizzle/schema";

export const SITE_ORIGIN = "https://dsharequiz-jxleeaps.manus.space";
export const SITEMAP_PATHS = [ROUTES.home, ROUTES.explore, ROUTES.pricing, ROUTES.leaderboard] as const;

type SeoSettings = { googleAnalyticsMeasurementId: string | null; googleSearchConsoleVerification: string | null };
type PageMeta = { title: string; description: string; canonicalPath: string; image?: string | null; type?: "website" | "article"; publishedAt?: Date | null; noindex?: boolean; jsonLd?: Record<string, unknown> };

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
const compactText = (value: string, max: number) => {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…` : text;
};
const absoluteUrl = (url: string) => url.startsWith("/") ? `${SITE_ORIGIN}${url}` : url;

export function buildSitemapXml(items: Array<{ quizId: number; createdAt: Date | null }>) {
  const staticUrls = SITEMAP_PATHS.map(path => `<url><loc>${SITE_ORIGIN}${path}</loc></url>`).join("");
  const quizUrls = items.map(item => `<url><loc>${SITE_ORIGIN}${ROUTES.quiz}/${item.quizId}</loc>${item.createdAt ? `<lastmod>${item.createdAt.toISOString()}</lastmod>` : ""}</url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${quizUrls}</urlset>`;
}

export function buildImageSitemapXml(items: Array<{ quizId: number; title: string; coverImageUrl: string | null }>) {
  const quizUrls = items.filter(item => Boolean(item.coverImageUrl)).map(item => `<url><loc>${SITE_ORIGIN}${ROUTES.quiz}/${item.quizId}</loc><image:image><image:loc>${escapeHtml(absoluteUrl(item.coverImageUrl!))}</image:loc><image:title>${escapeHtml(compactText(item.title, 100))}</image:title></image:image></url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${quizUrls}</urlset>`;
}

export function buildQuizJsonLd(input: { quizId: number; title: string; summary: string | null; image: string | null; datePublished: Date | null; category: string; questions: Array<{ prompt: string }> }) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: input.title,
    description: input.summary || `Quiz ${input.title} trên Dshare Quiz Online.`,
    url: `${SITE_ORIGIN}${ROUTES.quiz}/${input.quizId}`,
    image: input.image ? absoluteUrl(input.image) : undefined,
    datePublished: input.datePublished?.toISOString(),
    inLanguage: "vi-VN",
    learningResourceType: "Quiz",
    educationalLevel: input.category,
    hasPart: input.questions.slice(0, 50).map(question => ({ "@type": "Question", name: compactText(question.prompt, 300) })),
  };
}

export function buildSeoHead(meta: PageMeta, settings: SeoSettings) {
  const title = compactText(meta.title, 70);
  const description = compactText(meta.description, 200);
  const canonical = `${SITE_ORIGIN}${meta.canonicalPath}`;
  const image = meta.image ? absoluteUrl(meta.image) : undefined;
  const analyticsId = settings.googleAnalyticsMeasurementId?.match(/^G-[A-Z0-9]{6,20}$/) ? settings.googleAnalyticsMeasurementId : null;
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="${meta.type ?? "website"}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:site_name" content="Dshare Quiz Online" />`,
    `<meta property="og:locale" content="vi_VN" />`,
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    settings.googleSearchConsoleVerification ? `<meta name="google-site-verification" content="${escapeHtml(settings.googleSearchConsoleVerification)}" />` : "",
    image ? `<meta property="og:image" content="${escapeHtml(image)}" /><meta name="twitter:image" content="${escapeHtml(image)}" />` : "",
    meta.type === "article" && meta.publishedAt ? `<meta property="article:published_time" content="${meta.publishedAt.toISOString()}" />` : "",
    meta.noindex ? `<meta name="robots" content="noindex, follow" />` : "",
    analyticsId ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${analyticsId}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${analyticsId}',{send_page_view:true});</script>` : "",
    meta.jsonLd ? `<script type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(/</g, "\\u003c")}</script>` : "",
  ];
  return tags.filter(Boolean).join("\n");
}

async function readSeoSettings(): Promise<SeoSettings> {
  const db = await getDb();
  if (!db) return { googleAnalyticsMeasurementId: null, googleSearchConsoleVerification: null };
  const settings = (await db.select({ googleAnalyticsMeasurementId: seoSettings.googleAnalyticsMeasurementId, googleSearchConsoleVerification: seoSettings.googleSearchConsoleVerification }).from(seoSettings).limit(1))[0];
  return settings ?? { googleAnalyticsMeasurementId: null, googleSearchConsoleVerification: null };
}

export async function attachSeoMetadata(req: Request, res: Response, next: NextFunction) {
  if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
  try {
    const settings = await readSeoSettings();
    const match = req.path.match(/^\/quiz\/(\d+)$/);
    if (match) {
      const detail = await getQuizDetail(Number(match[1]));
      if (detail?.quiz.isPublished && detail.quiz.visibility === "public") {
        const quiz = detail.quiz;
        const image = quiz.coverImageUrl ?? detail.category.coverImageUrl;
        const questions = await getQuizQuestionSet(quiz.id);
        const jsonLd = buildQuizJsonLd({ quizId: quiz.id, title: quiz.title, summary: quiz.summary, image, datePublished: quiz.publishedAt ?? quiz.createdAt, category: detail.category.title, questions: questions.map(item => ({ prompt: item.question.prompt })) });
        res.locals.seoHead = buildSeoHead({ title: `${quiz.title} · Dshare Quiz Online`, description: quiz.summary || `Làm Quiz ${quiz.title} trên Dshare Quiz Online.`, canonicalPath: `${ROUTES.quiz}/${quiz.id}`, image, type: "article", publishedAt: quiz.publishedAt ?? quiz.createdAt, jsonLd }, settings);
      } else {
        res.locals.seoHead = buildSeoHead({ title: "Quiz không khả dụng · Dshare Quiz Online", description: "Quiz này không còn công khai hoặc đã được di chuyển.", canonicalPath: req.path, noindex: true }, settings);
      }
      return next();
    }
    res.locals.seoHead = buildSeoHead({ title: "Dshare Quiz Online", description: "Nền tảng Quiz và ôn tập trực tuyến cho hành trình học tập có định hướng.", canonicalPath: req.path === "/" ? "/" : req.path }, settings);
    return next();
  } catch (error) {
    console.error("[SEO] Không thể tạo metadata động:", error);
    return next();
  }
}

export function resolveLegacyRedirect(pathname: string) {
  const staticTarget = LEGACY_ROUTE_MAP[pathname];
  if (staticTarget) return staticTarget;
  const resultMatch = pathname.match(/^\/ket-qua\/([^/]+)$/);
  if (resultMatch?.[1]) return `${ROUTES.results}/${encodeURIComponent(resultMatch[1])}`;
  return null;
}

function requestQuery(req: Request) {
  const queryIndex = req.originalUrl.indexOf("?");
  return queryIndex === -1 ? "" : req.originalUrl.slice(queryIndex);
}

export function legacyRedirectMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const target = resolveLegacyRedirect(req.path);
  if (!target) return next();
  return res.redirect(301, `${target}${requestQuery(req)}`);
}

export function registerSeoRoutes(app: Express) {
  app.use(legacyRedirectMiddleware);
  app.get("/sitemap.xml", async (_req, res, next) => {
    try {
      const quizzes = await listPublishedCatalog();
      res.type("application/xml").send(buildSitemapXml(quizzes));
    } catch (error) {
      next(error);
    }
  });
  app.get("/image-sitemap.xml", async (_req, res, next) => {
    try {
      const quizzes = await listPublishedCatalog();
      res.type("application/xml").send(buildImageSitemapXml(quizzes));
    } catch (error) {
      next(error);
    }
  });
  app.use(attachSeoMetadata);
}
