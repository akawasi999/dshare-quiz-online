import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { userOAuthIdentities } from "../../drizzle/schema";
import { getDb } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { accountStatusMessage } from "../../shared/accessControl";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login. An attacker can
    // forge `state`, but cannot plant this cookie in the victim's browser.
    const { nonce, returnTo } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      const normalizedEmail = userInfo.email?.trim().toLowerCase() ?? null;
      const existingUser = normalizedEmail ? await db.getUserByEmail(normalizedEmail) : undefined;
      const account = existingUser ?? (await (async () => {
        await db.upsertUser({ openId: userInfo.openId, name: userInfo.name || null, email: normalizedEmail, loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null, lastSignedIn: new Date() });
        return db.getUserByOpenId(userInfo.openId);
      })());
      if (!account) throw new Error("Không thể đồng bộ tài khoản OAuth.");
      if (account.accountStatus !== "active") {
        res.status(403).send(accountStatusMessage(account.accountStatus));
        return;
      }
      const database = await getDb();
      if (database) await database.insert(userOAuthIdentities).values({ userId: account.id, provider: "manus", providerSubject: userInfo.openId }).onDuplicateKeyUpdate({ set: { userId: account.id } });

      const sessionToken = await sdk.createSessionToken(account.openId, {
        name: account.name || userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
