import type { Express, Request, Response, NextFunction } from "express";
import { LEGACY_ROUTE_MAP, ROUTES } from "../client/src/lib/routes";

export const SITE_ORIGIN = "https://dsharequiz-jxleeaps.manus.space";
export const SITEMAP_PATHS = [ROUTES.home, ROUTES.explore, ROUTES.pricing, ROUTES.leaderboard] as const;

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
}
