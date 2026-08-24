import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { parse } from "cookie";
import { ENV } from "./_core/env";

export const LOGIN_CAPTCHA_COOKIE = "login_captcha";
export const LOGIN_CAPTCHA_MAX_AGE_MS = 5 * 60 * 1000;

type CaptchaPayload = { answer: number; expiresAt: number; nonce: string };

function signature(payload: string, secret = ENV.cookieSecret) {
  if (!secret) throw new Error("Thiếu khóa ký CAPTCHA.");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createLoginCaptcha(now = new Date(), random = Math.random, secret = ENV.cookieSecret) {
  const first = 3 + Math.floor(random() * 7);
  const second = 2 + Math.floor(random() * 8);
  const payload: CaptchaPayload = { answer: first + second, expiresAt: now.getTime() + LOGIN_CAPTCHA_MAX_AGE_MS, nonce: randomBytes(16).toString("base64url") };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { question: `${first} + ${second} = ?`, cookieValue: `${encoded}.${signature(encoded, secret)}` };
}

export function verifyLoginCaptcha(cookieHeader: string | undefined, answer: string | undefined, now = new Date(), secret = ENV.cookieSecret) {
  if (!cookieHeader || !answer?.trim()) return false;
  const rawCookie = parse(cookieHeader)[LOGIN_CAPTCHA_COOKIE];
  if (!rawCookie) return false;
  const [encoded, actualSignature] = rawCookie.split(".");
  if (!encoded || !actualSignature) return false;
  const expectedSignature = signature(encoded, secret);
  const equal = actualSignature.length === expectedSignature.length && timingSafeEqual(Buffer.from(actualSignature), Buffer.from(expectedSignature));
  if (!equal) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as CaptchaPayload;
    return payload.expiresAt > now.getTime() && /^\d{1,3}$/.test(answer.trim()) && Number(answer.trim()) === payload.answer;
  } catch { return false; }
}
