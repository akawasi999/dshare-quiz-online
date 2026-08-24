import { and, eq } from "drizzle-orm";
import { randomBytes, timingSafeEqual } from "node:crypto";
import type { Express, Request, Response } from "express";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { oauthProviderSettings, userOAuthIdentities, users } from "../drizzle/schema";
import { getDb, ensureLearnerProfile } from "./db";
import { decryptEmailApiKey } from "./paymentConfirmationEmail";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { accountStatusMessage } from "../shared/accessControl";

const STATE_COOKIE = "__Host-google_oauth_state";
const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

const getOrigin = (req: Request) => {
  const forwarded = req.headers["x-forwarded-proto"];
  const protocol = typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : req.protocol;
  return `${protocol || "https"}://${req.get("host")}`;
};
const stateEqual = (left: string, right: string) => {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
};
const safeReturnTo = (value: unknown) => typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";

export function registerGoogleOAuthRoutes(app: Express) {
  app.get("/api/oauth/google/start", async (req: Request, res: Response) => {
    const db = await getDb();
    const setting = db ? (await db.select().from(oauthProviderSettings).where(eq(oauthProviderSettings.provider, "google")).limit(1))[0] : undefined;
    if (!setting?.isEnabled || !setting.clientId || !setting.clientSecretCiphertext) return res.status(503).send("Google OAuth chưa được quản trị viên cấu hình.");
    const nonce = randomBytes(32).toString("base64url");
    const returnTo = safeReturnTo(req.query.returnTo);
    const state = Buffer.from(JSON.stringify({ nonce, returnTo })).toString("base64url");
    const redirectUri = `${getOrigin(req)}/api/oauth/google/callback`;
    res.cookie(STATE_COOKIE, nonce, { ...getSessionCookieOptions(req), maxAge: 10 * 60 * 1000 });
    const params = new URLSearchParams({ client_id: setting.clientId, redirect_uri: redirectUri, response_type: "code", scope: "openid email profile", state, prompt: "select_account" });
    res.redirect(302, `${GOOGLE_AUTH_ENDPOINT}?${params}`);
  });

  app.get("/api/oauth/google/callback", async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const state = typeof req.query.state === "string" ? req.query.state : undefined;
    const expectedState = parseCookieHeader(req.headers.cookie ?? "")[STATE_COOKIE];
    res.clearCookie(STATE_COOKIE, getSessionCookieOptions(req));
    let statePayload: { nonce?: string; returnTo?: string } = {};
    try { statePayload = JSON.parse(Buffer.from(state ?? "", "base64url").toString("utf8")); } catch { statePayload = {}; }
    if (!code || !state || !expectedState || !statePayload.nonce || !stateEqual(statePayload.nonce, expectedState)) return res.status(403).send("Trạng thái Google OAuth không hợp lệ.");
    try {
      const db = await getDb();
      const setting = db ? (await db.select().from(oauthProviderSettings).where(eq(oauthProviderSettings.provider, "google")).limit(1))[0] : undefined;
      if (!db || !setting?.isEnabled || !setting.clientId || !setting.clientSecretCiphertext) return res.status(503).send("Google OAuth chưa sẵn sàng.");
      const redirectUri = `${getOrigin(req)}/api/oauth/google/callback`;
      const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: setting.clientId, client_secret: decryptEmailApiKey(setting.clientSecretCiphertext), redirect_uri: redirectUri, grant_type: "authorization_code" }) });
      const token = await tokenResponse.json() as { access_token?: string; error_description?: string };
      if (!tokenResponse.ok || !token.access_token) throw new Error(token.error_description || "Google không trả access token.");
      const profileResponse = await fetch(GOOGLE_USERINFO_ENDPOINT, { headers: { Authorization: `Bearer ${token.access_token}` } });
      const profile = await profileResponse.json() as { sub?: string; email?: string; email_verified?: boolean; name?: string };
      if (!profileResponse.ok || !profile.sub || !profile.email || profile.email_verified !== true) throw new Error("Google không cung cấp email đã xác minh.");
      let identity = (await db.select().from(userOAuthIdentities).where(and(eq(userOAuthIdentities.provider, "google"), eq(userOAuthIdentities.providerSubject, profile.sub))).limit(1))[0];
      let user = identity ? (await db.select().from(users).where(eq(users.id, identity.userId)).limit(1))[0] : undefined;
      if (!user) user = (await db.select().from(users).where(eq(users.email, profile.email.toLowerCase())).limit(1))[0];
      if (!user) {
        const openId = `google_${randomBytes(24).toString("base64url")}`.slice(0, 64);
        await db.insert(users).values({ openId, name: profile.name ?? null, email: profile.email.toLowerCase(), loginMethod: "google", lastSignedIn: new Date() });
        user = (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
      }
      if (!user) throw new Error("Không thể tạo tài khoản Google.");
      if (user.accountStatus !== "active") return res.status(403).send(accountStatusMessage(user.accountStatus));
      await db.insert(userOAuthIdentities).values({ userId: user.id, provider: "google", providerSubject: profile.sub }).onDuplicateKeyUpdate({ set: { userId: user.id } });
      await ensureLearnerProfile(user.id);
      const session = await sdk.createSessionToken(user.openId, { name: user.name ?? "", expiresInMs: ONE_YEAR_MS });
      res.cookie(COOKIE_NAME, session, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
      res.redirect(302, safeReturnTo(statePayload.returnTo));
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error);
      res.redirect(302, "/?authError=google");
    }
  });
}
