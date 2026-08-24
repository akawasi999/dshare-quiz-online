import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gt, inArray, isNull, ne, sql } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import {
  aiAssistantConversations,
  aiAssistantSettings,
  achievements,
  attempts,
  attemptAnswers,
  auditLogs,
  brandSettings,
  badges,
  bugReports,
  categories,
  discussionPosts,
  emailDeliverySettings,
  gamificationCelebrations,
  gamificationFeatures,
  learnerProfiles,
  levelFeatureUnlocks,
  lessons,
  membershipGroupPermissions,
  missionDefinitions,
  oauthProviderSettings,
  paymentEmailDeliveries,
  questionOptions,
  paymentRecords,
  pointPriceRules,
  questions,
  quizCreatorDrafts,
  quizCreatorDraftVersions,
  quizzes,
  quizQuestions,
  quizSourceHistories,
  seoSettings,
  siteNavigationItems,
  siteSettings,
  supportFaqs,
  supportMessages,
  subscriptionPlans,
  subjects,
  topics,
  userAchievements,
  userBadges,
  userCredentials,
  userMissionAssignments,
  userOAuthIdentities,
  userGroupMembers,
  userGroupPermissions,
  userGroups,
  userNotifications,
  users,
  walletTransactions,
  xpLevels,
  xpRules,
  xpTransactions,
} from "../drizzle/schema";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM, listLLMModels } from "./_core/llm";
import { buildQuizAssistantMessages, type QuizAssistantIntent } from "./aiAssistant";
import { buildAttemptMilestoneAlert } from "./attemptNotifications";
import { getReferralValidationError, normalizeReferralCode } from "./referralUtils";
import { richTextToPlainText, sanitizeRichTextHtml } from "../shared/richText";
import { allocateQuestionCounts } from "./randomQuiz";
import { getTrueFalseStatements, validateQuestionConfiguration } from "../shared/questionValidation";
import { notifyOwner } from "./_core/notification";
import { storageGetSignedUrl, storagePut } from "./storage";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, permissionProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createAttempt,
  ensureLearnerProfile,
  getDb,
  getLeaderboard,
  getLearnerSummary,
  getMonthlyQuotaUsage,
  getXpLeaderboard,
  getQuizDetail,
  getOwnedQuizAnalytics,
  getQuizQuestionSet,
  getWalletTransactions,
  listCategories,
  listPublishedCatalog,
  logSecurityEvent,
  recordAiUsage,
  saveAnswer,
  submitAttempt,
} from "./db";
import { shuffledForAttempt } from "./quizEngine";
import { buildPayosCallbackUrls, createPayosPaymentLink } from "./payosService";
import { encryptEmailApiKey, sendContactEmailVerification, sendPasswordResetEmail, sendTestEmail } from "./paymentConfirmationEmail";
import { decryptAiAssistantApiKey, discoverGeminiChatModel, encryptAiAssistantApiKey, generateAiAssistantReply } from "./aiAssistantService";
import { analyzeAiAssistantImage } from "./aiAssistantMultimodal";
import { buildPaymentOffer, createPayosOrderCode, getPaymentAmount, getPaymentPackage, isFirstPurchaseDiscountEligible, isPaymentPackageCode, paymentPackages } from "./payosUtils";
import { hasReachedQuota, membershipQuotas, quotaLabel, type QuotaTier } from "./quotaUtils";
import { getLearnerGamificationSummary } from "./gamification";
import { getAiPointQuotes, runWithAiPointCharge } from "./aiPointPricing";
import { aiQuestionInputSchema, parseAiQuestionDraft } from "./aiQuestionGenerator";
import { buildQuestionEnhancementMessages, buildQuizStudioChatMessages, parseQuestionEnhancement, parseQuizStudioChatResponse, questionEnhancementInputSchema, quizStudioChatInputSchema } from "./quizStudioChat";
import { extractQuizDocumentText, generateMultipleChoiceFromDocument } from "./documentQuizExtraction";
import { importManualQuizFile, ocrPdfWithVision } from "./manualQuizImport";
import { cpanelLearningRouter } from "./cpanelLearningRouter";
import { createInAppNotification } from "./inAppNotifications";
import { extractRemoteQuizSource } from "./remoteQuizExtraction";
import { transcribeAudio } from "./_core/voiceTranscription";
import { defaultMembershipGroupPermissions, membershipPermissionKeys, type MembershipPermissionKey } from "../shared/membershipGroupPermissions";
import { hashPassword, hashToken, newOneTimeToken, normalizeEmail, verifyPassword } from "./localAuth";
import { LOGIN_CAPTCHA_THRESHOLD, loginLockoutMessage, nextFailedLoginState } from "./loginThrottle";
import { createLoginCaptcha, LOGIN_CAPTCHA_COOKIE, LOGIN_CAPTCHA_MAX_AGE_MS, verifyLoginCaptcha } from "./loginCaptcha";
import { sdk } from "./_core/sdk";
import { accountStatusMessage } from "../shared/accessControl";

const tierRank = { basic: 1, pro: 2, premium: 3 } as const;
const defaultAiAssistantConfig = { provider: "manus" as const, model: "gpt-5-mini", isEnabled: false, welcomeMessage: "Chào bạn, tôi là Dshare AI Assistant. Tôi có thể giúp bạn lập kế hoạch ôn tập, giải thích khái niệm và gợi ý cách học hiệu quả." };
const publicAiAssistantConfig = (config: typeof aiAssistantSettings.$inferSelect | undefined) => ({ provider: config?.provider ?? defaultAiAssistantConfig.provider, model: config?.model ?? defaultAiAssistantConfig.model, isEnabled: config?.isEnabled ?? defaultAiAssistantConfig.isEnabled, welcomeMessage: config?.welcomeMessage ?? defaultAiAssistantConfig.welcomeMessage, hasApiKey: Boolean(config?.apiKeyCiphertext), updatedAt: config?.updatedAt ?? null });
const quizIdInput = z.object({ quizId: z.number().int().positive() });
const quizImageUploadInput = z.object({ fileName: z.string().trim().min(1).max(160), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), base64: z.string().min(20).max(8_000_000) });
const quizImageMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const maxQuizImageBytes = 5 * 1024 * 1024;
const avatarUploadInput = z.object({ fileName: z.string().trim().min(1).max(160), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), base64: z.string().min(20).max(5_000_000) });
const maxAvatarImageBytes = 3 * 1024 * 1024;
const hashContactEmailVerificationToken = (token: string) => createHash("sha256").update(token).digest("hex");
const passwordInput = z.string().min(10, "Mật khẩu cần tối thiểu 10 ký tự.").max(128).refine(value => /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value), { message: "Mật khẩu cần gồm chữ hoa, chữ thường và số." });
const requestOrigin = (req: { protocol?: string; get?: (header: string) => string | undefined; headers?: Record<string, unknown> }) => {
  const forwarded = req.headers?.["x-forwarded-proto"];
  const protocol = typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : req.protocol || "https";
  const host = req.get?.("host") || (typeof req.headers?.host === "string" ? req.headers.host : "dsharequiz-jxleeaps.manus.space");
  return `${protocol || "https"}://${host}`;
};
const safeUploadFileName = (fileName: string) => fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 120) || "image";
const quizAssetUrlInput = z.string().trim().max(1024).refine(value => value.startsWith("/manus-storage/") || /^https?:\/\//i.test(value), { message: "URL ảnh phải là liên kết HTTPS/HTTP hoặc đường dẫn lưu trữ hợp lệ." });
const decodeQuizImageUpload = (input: z.infer<typeof quizImageUploadInput>) => {
  const match = input.base64.match(/^data:([^;]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match || match[1] !== input.mimeType || !quizImageMimeTypes.includes(input.mimeType)) throw new TRPCError({ code: "BAD_REQUEST", message: "Dữ liệu ảnh không hợp lệ." });
  const bytes = Buffer.from(match[2]!, "base64");
  if (!bytes.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Tệp ảnh trống hoặc không đọc được." });
  if (bytes.length > maxQuizImageBytes) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Ảnh tối đa 5 MB." });
  return bytes;
};
const decodeAvatarImageUpload = (input: z.infer<typeof avatarUploadInput>) => {
  const match = input.base64.match(/^data:([^;]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match || match[1] !== input.mimeType || !quizImageMimeTypes.includes(input.mimeType)) throw new TRPCError({ code: "BAD_REQUEST", message: "Dữ liệu ảnh đại diện không hợp lệ." });
  const bytes = Buffer.from(match[2]!, "base64");
  if (!bytes.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Ảnh đại diện trống hoặc không đọc được." });
  if (bytes.length > maxAvatarImageBytes) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Ảnh đại diện tối đa 3 MB." });
  return bytes;
};
const assertOwnedAttempt = async (userId: number, attemptId: number, questionId?: number) => {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Cơ sở dữ liệu chưa sẵn sàng." });
  const [attempt] = await db.select({ id: attempts.id, quizId: attempts.quizId, status: attempts.status }).from(attempts).where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId))).limit(1);
  if (!attempt) throw new TRPCError({ code: "FORBIDDEN", message: "Bạn không có quyền thao tác lượt làm bài này." });
  if (attempt.status !== "in_progress") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Lượt làm bài này không còn có thể chỉnh sửa." });
  if (questionId) {
    const [question] = await db.select({ questionId: quizQuestions.questionId }).from(quizQuestions).where(and(eq(quizQuestions.quizId, attempt.quizId), eq(quizQuestions.questionId, questionId))).limit(1);
    if (!question) throw new TRPCError({ code: "FORBIDDEN", message: "Câu hỏi không thuộc lượt làm bài này." });
  }
  return attempt;
};
const csvEscape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const membershipGroupPermissionInput = z.object({
  tier: z.enum(["basic", "pro", "premium"]),
  canCreateQuiz: z.boolean(),
  canUseAi: z.boolean(),
  canExportData: z.boolean(),
  canViewAdvancedReports: z.boolean(),
  canReceivePrioritySupport: z.boolean(),
});
const gamificationFeatureInput = z.object({
  id: z.number().int().positive().optional(),
  code: z.string().trim().regex(/^[a-z][a-z0-9_.-]{2,99}$/),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().min(4).max(500),
  icon: z.string().trim().max(80).nullable().optional(),
  category: z.enum(["learning", "creation", "ai", "analytics", "premium"]),
  isActive: z.boolean(),
});
const missionDefinitionInput = z.object({
  id: z.number().int().positive().optional(),
  code: z.string().trim().regex(/^[a-z][a-z0-9_.-]{2,99}$/),
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().min(4).max(500),
  icon: z.string().trim().max(80).nullable().optional(),
  repeatType: z.enum(["daily", "weekly", "special"]),
  metricType: z.enum(["quiz_completed", "questions_answered", "score_threshold", "study_minutes", "ai_content_created"]),
  target: z.number().int().positive().max(1_000_000),
  xpReward: z.number().int().min(1).max(100_000),
  conditionConfig: z.record(z.string(), z.unknown()).nullable().optional(),
  displayOrder: z.number().int().min(0).max(100_000),
  isActive: z.boolean(),
  startsAt: z.date().nullable().optional(),
  endsAt: z.date().nullable().optional(),
});
const badgeInput = z.object({
  id: z.number().int().positive().optional(),
  code: z.string().trim().regex(/^[a-z][a-z0-9_.-]{2,99}$/),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().min(4).max(500),
  icon: z.string().trim().min(1).max(80),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/),
  isActive: z.boolean(),
});
const achievementInput = z.object({
  id: z.number().int().positive().optional(),
  code: z.string().trim().regex(/^[a-z][a-z0-9_.-]{2,99}$/),
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().min(4).max(500),
  icon: z.string().trim().min(1).max(80),
  conditionType: z.enum(["quiz_completed", "perfect_score"]),
  conditionConfig: z.record(z.string(), z.unknown()).nullable().optional(),
  xpReward: z.number().int().min(0).max(100_000),
  badgeId: z.number().int().positive().nullable().optional(),
  displayOrder: z.number().int().min(0).max(100_000),
  isActive: z.boolean(),
});
const pointPriceRuleInput = z.object({
  id: z.number().int().positive().optional(),
  code: z.string().trim().regex(/^[a-z][a-z0-9_.-]{2,99}$/),
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().max(500).nullable().optional(),
  pointCost: z.number().int().min(0).max(10_000_000),
  conditionConfig: z.record(z.string(), z.unknown()).nullable().optional(),
  isActive: z.boolean(),
});
const subscriptionPlanInput = z.object({ id: z.number().int().positive().optional(), code: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).min(3).max(80), name: z.string().trim().min(2).max(120), tier: z.enum(["basic", "pro", "premium"]), description: z.string().trim().max(500).nullable().optional(), benefits: z.array(z.string().trim().min(2).max(180)).max(12).refine(items => new Set(items).size === items.length, { message: "Không được trùng quyền lợi." }).default([]), monthlyPrice: z.number().int().min(0).max(100_000_000), promoPrice: z.number().int().min(0).max(100_000_000).nullable().optional(), payosEnabled: z.boolean().default(false), payosRewardPoints: z.number().int().min(0).max(1_000_000).default(0), membershipMonths: z.number().int().min(1).max(24).default(1), displayOrder: z.number().int().min(0).max(100_000).default(0), isActive: z.boolean() });
const userGroupInput = z.object({ id: z.number().int().positive().optional(), planId: z.number().int().positive().nullable().optional(), name: z.string().trim().min(2).max(120), description: z.string().trim().max(500).nullable().optional(), displayOrder: z.number().int().min(0).max(100_000).default(0) });
const groupPermissionInput = z.object({ permissionKey: z.string().trim().min(2).max(80).regex(/^[A-Za-z][A-Za-z0-9_-]*$/), isAllowed: z.boolean() });
const customGroupPermissionsInput = z.object({ groupId: z.number().int().positive(), permissions: z.array(groupPermissionInput).min(1).max(30).refine(items => new Set(items.map(item => item.permissionKey)).size === items.length, { message: "Không được trùng mã quyền." }) });
const planLinkedPermissionsInput = z.object({ planId: z.number().int().positive(), permissions: z.array(groupPermissionInput).min(1).max(30).refine(items => new Set(items.map(item => item.permissionKey)).size === items.length, { message: "Không được trùng mã quyền." }) });
const emailDeliverySettingsInput = z.object({ provider: z.literal("resend").default("resend"), fromEmail: z.string().trim().email().max(320).nullable().optional(), apiKey: z.string().trim().min(10).max(500).optional(), isEnabled: z.boolean() });
const defaultSubscriptionPlans = [
  { code: "basic", name: "Basic", tier: "basic" as const, description: "Gói cơ bản", monthlyPrice: 0 },
  { code: "pro-monthly", name: "PRO", tier: "pro" as const, description: "Gói thành viên PRO theo tháng", monthlyPrice: 50_000 },
  { code: "premium-monthly", name: "PREMIUM", tier: "premium" as const, description: "Gói thành viên PREMIUM theo tháng", monthlyPrice: 100_000 },
];

async function getMembershipGroupPermissions() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập cấu hình nhóm người dùng." });
  for (const group of defaultMembershipGroupPermissions) {
    await db.insert(membershipGroupPermissions).values(group).onDuplicateKeyUpdate({ set: { tier: group.tier } });
  }
  return db.select().from(membershipGroupPermissions);
}

async function ensureMembershipManagementDefaults() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập quản trị thành viên." });
  return db;
}

async function assertMembershipGroupPermission(userId: number, permission: MembershipPermissionKey, featureLabel: string) {
  const profile = await ensureLearnerProfile(userId);
  if (!profile) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập hồ sơ thành viên." });
  const db = await getDb();
  if (db) {
    const customPermission = await db.select({ isAllowed: userGroupPermissions.isAllowed }).from(userGroupMembers)
      .innerJoin(userGroupPermissions, and(eq(userGroupMembers.groupId, userGroupPermissions.groupId), eq(userGroupPermissions.permissionKey, permission)))
      .where(eq(userGroupMembers.userId, userId)).limit(1);
    if (customPermission[0]) {
      if (!customPermission[0].isAllowed) throw new TRPCError({ code: "FORBIDDEN", message: `Nhóm tùy chỉnh chưa được cấp quyền ${featureLabel}.` });
      return;
    }
  }
  const groups = await getMembershipGroupPermissions();
  const group = groups.find(item => item.tier === profile.tier);
  if (!group?.[permission]) throw new TRPCError({ code: "FORBIDDEN", message: `Nhóm ${profile.tier.toUpperCase()} chưa được cấp quyền ${featureLabel}.` });
}

async function assertQuotaAvailable(userId: number, resource: "attemptsPerMonth" | "quizzesPerMonth" | "aiCreditsPerMonth") {
  const profile = await ensureLearnerProfile(userId);
  if (!profile) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập quota thành viên." });
  const usage = await getMonthlyQuotaUsage(userId);
  const tier = profile.tier as QuotaTier;
  const quota = membershipQuotas[tier];
  const limit = quota[resource];
  const used = resource === "attemptsPerMonth" ? usage.attempts : resource === "quizzesPerMonth" ? usage.quizzes : usage.aiCredits;
  if (hasReachedQuota(used, limit)) {
    const label = resource === "attemptsPerMonth" ? "lượt thi" : resource === "quizzesPerMonth" ? "quiz tạo" : "AI Credits";
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Bạn đã dùng hết quota ${label} (${quotaLabel(limit)}) của gói ${tier.toUpperCase()}.` });
  }
  return { tier, limit, used };
}

async function getOwnedQuizDraft(userId: number, quizId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập Quiz lúc này." });
  const rows = await db.select().from(quizzes).where(and(eq(quizzes.id, quizId), eq(quizzes.creatorUserId, userId))).limit(1);
  const quiz = rows[0];
  if (!quiz) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy Quiz riêng của bạn." });
  const linked = await db.select({ question: questions, sortOrder: quizQuestions.sortOrder, points: quizQuestions.points }).from(quizQuestions).innerJoin(questions, eq(quizQuestions.questionId, questions.id)).where(eq(quizQuestions.quizId, quizId)).orderBy(asc(quizQuestions.sortOrder));
  const draftQuestions = await Promise.all(linked.map(async item => ({ ...item.question, points: item.points, options: await db.select().from(questionOptions).where(eq(questionOptions.questionId, item.question.id)).orderBy(asc(questionOptions.sortOrder)) })));
  return { db, quiz, questions: draftQuestions };
}

async function removeOwnedQuizQuestions(db: any, quizId: number, items: Array<{ id: number }>) {
  for (const item of items) await db.delete(questionOptions).where(eq(questionOptions.questionId, item.id));
  await db.delete(quizQuestions).where(eq(quizQuestions.quizId, quizId));
  for (const item of items) await db.delete(questions).where(eq(questions.id, item.id));
}
export const parseCsv = (text: string) => text.trim().split(/\r?\n/).map(line => {
  const values: string[] = []; let value = ""; let quoted = false;
  for (let index = 0; index < line.length; index += 1) { const char = line[index]; const next = line[index + 1]; if (char === '"' && quoted && next === '"') { value += '"'; index += 1; } else if (char === '"') quoted = !quoted; else if (char === ',' && !quoted) { values.push(value); value = ""; } else value += char; }
  values.push(value); return values;
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => {
      if (opts.ctx.user && opts.ctx.user.accountStatus && opts.ctx.user.accountStatus !== "active") throw new TRPCError({ code: "FORBIDDEN", message: accountStatusMessage(opts.ctx.user.accountStatus) });
      return opts.ctx.user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    getLoginCaptcha: publicProcedure.query(({ ctx }) => {
      const captcha = createLoginCaptcha();
      ctx.res.cookie(LOGIN_CAPTCHA_COOKIE, captcha.cookieValue, { ...getSessionCookieOptions(ctx.req), maxAge: LOGIN_CAPTCHA_MAX_AGE_MS });
      return { question: captcha.question, expiresInSeconds: LOGIN_CAPTCHA_MAX_AGE_MS / 1000 } as const;
    }),
    register: publicProcedure.input(z.object({ name: z.string().trim().min(2).max(160), email: z.string().trim().email().max(320), password: passwordInput, acceptedTerms: z.literal(true) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Cơ sở dữ liệu chưa sẵn sàng." });
      const email = normalizeEmail(input.email);
      const existing = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Email này đã được sử dụng. Hãy đăng nhập hoặc khôi phục mật khẩu." });
      const openId = `local_${randomBytes(24).toString("base64url")}`.slice(0, 64);
      const now = new Date();
      await db.insert(users).values({ openId, name: input.name.trim(), email, loginMethod: "email", lastSignedIn: now });
      const user = (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể tạo tài khoản." });
      await db.insert(userCredentials).values({ userId: user.id, passwordHash: await hashPassword(input.password), passwordUpdatedAt: now });
      await ensureLearnerProfile(user.id);
      const session = await sdk.createSessionToken(user.openId, { name: user.name ?? "", expiresInMs: ONE_YEAR_MS });
      ctx.res.cookie(COOKIE_NAME, session, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return { success: true } as const;
    }),
    loginWithPassword: publicProcedure.input(z.object({ email: z.string().trim().email().max(320), password: z.string().min(1).max(128), remember: z.boolean().default(true), captchaAnswer: z.string().trim().max(3).optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Cơ sở dữ liệu chưa sẵn sàng." });
      const user = (await db.select().from(users).where(eq(users.email, normalizeEmail(input.email))).limit(1))[0];
      const credential = user ? (await db.select().from(userCredentials).where(eq(userCredentials.userId, user.id)).limit(1))[0] : undefined;
      const now = new Date();
      if (credential?.loginLockedUntil && credential.loginLockedUntil > now) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: loginLockoutMessage(credential.loginLockedUntil, now) });
      if (credential && credential.failedLoginAttempts >= LOGIN_CAPTCHA_THRESHOLD && !verifyLoginCaptcha(ctx.req.headers.cookie, input.captchaAnswer, now)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Vui lòng hoàn tất CAPTCHA trước khi tiếp tục đăng nhập." });
      if (!user || !credential || !(await verifyPassword(input.password, credential.passwordHash))) {
        if (credential) {
          const nextState = nextFailedLoginState(credential.failedLoginAttempts, now);
          await db.update(userCredentials).set(nextState).where(eq(userCredentials.id, credential.id));
          if (nextState.failedLoginAttempts >= LOGIN_CAPTCHA_THRESHOLD) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Bạn đã nhập sai 3 lần. Vui lòng hoàn tất CAPTCHA trước lần đăng nhập tiếp theo." });
        }
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Email hoặc mật khẩu không đúng." });
      }
      if (user.accountStatus !== "active") throw new TRPCError({ code: "FORBIDDEN", message: accountStatusMessage(user.accountStatus) });
      await db.update(userCredentials).set({ failedLoginAttempts: 0, loginLockedUntil: null }).where(eq(userCredentials.id, credential.id));
      const expiresInMs = input.remember ? ONE_YEAR_MS : 24 * 60 * 60 * 1000;
      const session = await sdk.createSessionToken(user.openId, { name: user.name ?? "", expiresInMs });
      ctx.res.cookie(COOKIE_NAME, session, { ...getSessionCookieOptions(ctx.req), maxAge: expiresInMs });
      return { success: true } as const;
    }),
    requestPasswordReset: publicProcedure.input(z.object({ email: z.string().trim().email().max(320) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Cơ sở dữ liệu chưa sẵn sàng." });
      const email = normalizeEmail(input.email);
      const user = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
      const credential = user ? (await db.select().from(userCredentials).where(eq(userCredentials.userId, user.id)).limit(1))[0] : undefined;
      if (user && credential) {
        const resetToken = newOneTimeToken();
        await db.update(userCredentials).set({ resetTokenHash: hashToken(resetToken), resetTokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000) }).where(eq(userCredentials.id, credential.id));
        const delivery = (await db.select().from(emailDeliverySettings).limit(1))[0];
        if (delivery) await sendPasswordResetEmail(delivery, { recipient: email, learnerName: user.name, resetToken, appOrigin: requestOrigin(ctx.req) });
      }
      return { success: true } as const;
    }),
    resetPassword: publicProcedure.input(z.object({ token: z.string().min(20).max(256), password: passwordInput })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Cơ sở dữ liệu chưa sẵn sàng." });
      const credential = (await db.select().from(userCredentials).where(and(eq(userCredentials.resetTokenHash, hashToken(input.token)), gt(userCredentials.resetTokenExpiresAt, new Date()))).limit(1))[0];
      if (!credential) throw new TRPCError({ code: "BAD_REQUEST", message: "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." });
      const user = (await db.select().from(users).where(eq(users.id, credential.userId)).limit(1))[0];
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy tài khoản." });
      if (user.accountStatus !== "active") throw new TRPCError({ code: "FORBIDDEN", message: accountStatusMessage(user.accountStatus) });
      await db.update(userCredentials).set({ passwordHash: await hashPassword(input.password), resetTokenHash: null, resetTokenExpiresAt: null, failedLoginAttempts: 0, loginLockedUntil: null, passwordUpdatedAt: new Date() }).where(eq(userCredentials.id, credential.id));
      const session = await sdk.createSessionToken(user.openId, { name: user.name ?? "", expiresInMs: ONE_YEAR_MS });
      ctx.res.cookie(COOKIE_NAME, session, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return { success: true } as const;
    }),
  }),

  aiAssistant: router({
    config: protectedProcedure.query(async () => {
      const db = await getDb();
      const config = db ? (await db.select().from(aiAssistantSettings).limit(1))[0] : undefined;
      const safeConfig = publicAiAssistantConfig(config);
      return { isEnabled: safeConfig.isEnabled, welcomeMessage: safeConfig.welcomeMessage, provider: safeConfig.provider };
    }),
    history: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select({ id: aiAssistantConversations.id, role: aiAssistantConversations.role, content: aiAssistantConversations.content, createdAt: aiAssistantConversations.createdAt }).from(aiAssistantConversations).where(eq(aiAssistantConversations.userId, ctx.user.id)).orderBy(desc(aiAssistantConversations.createdAt)).limit(20);
      return rows.reverse();
    }),
    clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Cơ sở dữ liệu chưa sẵn sàng." });
      await db.delete(aiAssistantConversations).where(eq(aiAssistantConversations.userId, ctx.user.id));
      return { success: true };
    }),
    chat: protectedProcedure.input(z.object({ message: z.string().trim().min(2).max(4_000), context: z.object({ subject: z.string().trim().min(2).max(120).optional(), quizId: z.number().int().positive().optional(), mode: z.enum(["socratic", "study_plan"]).optional() }).optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Cơ sở dữ liệu chưa sẵn sàng." });
      const config = (await db.select().from(aiAssistantSettings).limit(1))[0];
      const safeConfig = publicAiAssistantConfig(config);
      if (!config || !safeConfig.isEnabled) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "AI Assistant chưa được quản trị viên kích hoạt." });
      if (config.provider === "gemini" && !config.apiKeyCiphertext) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "AI Assistant Gemini chưa có API key hợp lệ." });
      await assertMembershipGroupPermission(ctx.user.id, "canUseAi", "dùng AI Assistant");
      const quota = await assertQuotaAvailable(ctx.user.id, "aiCreditsPerMonth");
      const priorRows = await db.select({ role: aiAssistantConversations.role, content: aiAssistantConversations.content }).from(aiAssistantConversations).where(eq(aiAssistantConversations.userId, ctx.user.id)).orderBy(desc(aiAssistantConversations.createdAt)).limit(12);
      const selectedQuiz = input.context?.quizId ? await getQuizDetail(input.context.quizId) : undefined;
      if (input.context?.quizId && (!selectedQuiz || !selectedQuiz.quiz.isPublished)) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy bộ đề công khai để đặt làm ngữ cảnh." });
      const studyContext = input.context?.subject || selectedQuiz ? {
        subject: selectedQuiz?.subject.title ?? input.context?.subject ?? null,
        categoryTitle: selectedQuiz?.category.title ?? null,
        lessonTitle: selectedQuiz?.lesson.title ?? null,
        quizTitle: selectedQuiz?.quiz.title ?? null,
        quizSummary: selectedQuiz?.quiz.summary ?? null,
        difficulty: selectedQuiz?.quiz.difficulty ?? null, mode: input.context?.mode,
      } : undefined;
      const reply = await generateAiAssistantReply({ provider: config.provider, model: config.model, apiKeyCiphertext: config.apiKeyCiphertext, messages: [...priorRows.reverse(), { role: "user", content: input.message }], studyContext });
      await db.insert(aiAssistantConversations).values([{ userId: ctx.user.id, role: "user", content: input.message }, { userId: ctx.user.id, role: "assistant", content: reply }]);
      await recordAiUsage(ctx.user.id, "assist");
      return { content: reply, quota: { used: quota.used + 1, limit: quota.limit } };
    }),
    gradeEssay: protectedProcedure.input(z.object({ question: z.string().trim().min(8).max(5_000), answer: z.string().trim().min(10).max(12_000), rubric: z.string().trim().min(8).max(5_000).optional(), context: z.object({ subject: z.string().trim().min(2).max(120).optional() }).optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Cơ sở dữ liệu chưa sẵn sàng." });
      const config = (await db.select().from(aiAssistantSettings).limit(1))[0]; const safeConfig = publicAiAssistantConfig(config);
      if (!config || !safeConfig.isEnabled) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "AI Assistant chưa được quản trị viên kích hoạt." });
      await assertMembershipGroupPermission(ctx.user.id, "canUseAi", "nhận xét bài tự luận bằng AI"); const quota = await assertQuotaAvailable(ctx.user.id, "aiCreditsPerMonth");
      const prompt = `Câu hỏi tự luận:\n${input.question}\n\nBài làm của người học:\n${input.answer}\n\nRubric/tiêu chí chấm:\n${input.rubric ?? "Đánh giá mức độ đúng kiến thức, lập luận, ví dụ và diễn đạt."}\n\nHãy phản hồi theo các phần: Nhận xét tổng quan, Điểm mạnh, Cần cải thiện, Gợi ý sửa từng bước, Bài luyện tiếp theo.`;
      const charged = await runWithAiPointCharge(db, { userId: ctx.user.id, code: "ai_essay_feedback", requestKey: `essay:${ctx.user.id}:${Date.now()}` }, () => generateAiAssistantReply({ provider: config.provider, model: config.model, apiKeyCiphertext: config.apiKeyCiphertext, messages: [{ role: "user", content: prompt }], studyContext: { subject: input.context?.subject ?? null, mode: "essay_feedback" } }));
      const content = charged.value;
      await db.insert(aiAssistantConversations).values([{ userId: ctx.user.id, role: "user", content: "Đã gửi bài tự luận để nhận xét theo rubric." }, { userId: ctx.user.id, role: "assistant", content }]); await recordAiUsage(ctx.user.id, "assist"); return { content, quota: { used: quota.used + 1, limit: quota.limit }, pointCharge: charged.pointCharge };
    }),
    analyzeImage: protectedProcedure.input(z.object({ fileName: z.string().trim().min(1).max(160), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), base64: z.string().min(40).max(16_000_000), instruction: z.string().trim().min(2).max(2_000).default("Hãy giúp tôi hiểu bài tập trong ảnh."), context: z.object({ subject: z.string().trim().min(2).max(120).optional() }).optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Cơ sở dữ liệu chưa sẵn sàng." });
      const config = (await db.select().from(aiAssistantSettings).limit(1))[0]; const safeConfig = publicAiAssistantConfig(config);
      if (!config || !safeConfig.isEnabled) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "AI Assistant chưa được quản trị viên kích hoạt." });
      await assertMembershipGroupPermission(ctx.user.id, "canUseAi", "phân tích ảnh học tập"); const quota = await assertQuotaAvailable(ctx.user.id, "aiCreditsPerMonth");
      const match = input.base64.match(/^data:([^;]+);base64,(.+)$/); if (!match || match[1] !== input.mimeType) throw new TRPCError({ code: "BAD_REQUEST", message: "Ảnh đính kèm không hợp lệ." });
      const bytes = Buffer.from(match[2], "base64"); if (bytes.length > 10 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Ảnh tối đa 10 MB." });
      await storagePut(`ai-assistant/${ctx.user.id}/images/${input.fileName}`, bytes, input.mimeType);
      const charged = await runWithAiPointCharge(db, { userId: ctx.user.id, code: "ai_image_analysis", requestKey: `image:${ctx.user.id}:${Date.now()}` }, () => analyzeAiAssistantImage({ provider: config.provider, model: config.model, apiKeyCiphertext: config.apiKeyCiphertext, dataUrl: input.base64, instruction: input.instruction, studyContext: { subject: input.context?.subject ?? null } }));
      const content = charged.value;
      await db.insert(aiAssistantConversations).values([{ userId: ctx.user.id, role: "user", content: `Đã gửi ảnh: ${input.fileName}. ${input.instruction}` }, { userId: ctx.user.id, role: "assistant", content }]); await recordAiUsage(ctx.user.id, "assist");
      return { content, quota: { used: quota.used + 1, limit: quota.limit }, pointCharge: charged.pointCharge };
    }),
    transcribeVoice: protectedProcedure.input(z.object({ fileName: z.string().trim().min(1).max(160), mimeType: z.enum(["audio/webm", "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"]), base64: z.string().min(40).max(23_000_000) })).mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Cơ sở dữ liệu chưa sẵn sàng." }); const config = (await db.select().from(aiAssistantSettings).limit(1))[0];
      if (!config || !publicAiAssistantConfig(config).isEnabled) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "AI Assistant chưa được quản trị viên kích hoạt." });
      await assertMembershipGroupPermission(ctx.user.id, "canUseAi", "chuyển giọng nói thành văn bản"); const quota = await assertQuotaAvailable(ctx.user.id, "aiCreditsPerMonth");
      const match = input.base64.match(/^data:([^;]+);base64,(.+)$/); if (!match || match[1] !== input.mimeType) throw new TRPCError({ code: "BAD_REQUEST", message: "Tệp âm thanh không hợp lệ." });
      const bytes = Buffer.from(match[2], "base64"); if (bytes.length > 16 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Âm thanh tối đa 16 MB." });
      const stored = await storagePut(`ai-assistant/${ctx.user.id}/audio/${input.fileName}`, bytes, input.mimeType); const audioUrl = await storageGetSignedUrl(stored.key);
      const charged = await runWithAiPointCharge(db, { userId: ctx.user.id, code: "ai_voice_transcription", requestKey: `voice:${ctx.user.id}:${Date.now()}` }, async () => { const result = await transcribeAudio({ audioUrl, language: "vi", prompt: "Chuyển giọng nói tiếng Việt của người học thành văn bản rõ ràng." }); if ("error" in result) throw new TRPCError({ code: "BAD_GATEWAY", message: result.details || result.error }); return result; });
      const result = charged.value;
      await recordAiUsage(ctx.user.id, "assist"); return { text: result.text, quota: { used: quota.used + 1, limit: quota.limit }, pointCharge: charged.pointCharge };
    }),
  }),

  aiAssistantAdmin: router({
    config: adminProcedure.query(async () => {
      const db = await getDb();
      const config = db ? (await db.select().from(aiAssistantSettings).limit(1))[0] : undefined;
      return publicAiAssistantConfig(config);
    }),
    manusModels: adminProcedure.query(async () => {
      const models = await listLLMModels();
      return models.data.map(model => model.id);
    }),
    testGeminiConnection: adminProcedure.input(z.object({ apiKey: z.string().trim().min(10).max(500) })).mutation(async ({ ctx, input }) => {
      const model = await discoverGeminiChatModel(input.apiKey);
      const database = await getDb();
      if (database) await database.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "ai_assistant.gemini_connection_tested", entityType: "ai_assistant_settings", entityId: null, metadata: { model, success: true } });
      return { success: true as const, model };
    }),
    saveConfig: adminProcedure.input(z.object({ provider: z.enum(["manus", "gemini"]), model: z.string().trim().min(2).max(120).optional(), apiKey: z.string().max(500).optional(), isEnabled: z.boolean(), welcomeMessage: z.string().trim().min(10).max(500) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Cơ sở dữ liệu chưa sẵn sàng." });
      const existing = (await db.select().from(aiAssistantSettings).limit(1))[0];
      const apiKeyCiphertext = input.apiKey?.trim() ? encryptAiAssistantApiKey(input.apiKey.trim()) : existing?.apiKeyCiphertext ?? null;
      if (input.provider === "gemini" && !apiKeyCiphertext) throw new TRPCError({ code: "BAD_REQUEST", message: "Vui lòng nhập Gemini API key trước khi kích hoạt Gemini." });
      const model = input.provider === "gemini"
        ? await discoverGeminiChatModel(input.apiKey?.trim() || decryptAiAssistantApiKey(apiKeyCiphertext || ""))
        : input.model || existing?.model || defaultAiAssistantConfig.model;
      const values = { provider: input.provider, model, apiKeyCiphertext, isEnabled: input.isEnabled, welcomeMessage: input.welcomeMessage };
      if (existing) await db.update(aiAssistantSettings).set(values).where(eq(aiAssistantSettings.id, existing.id)); else await db.insert(aiAssistantSettings).values(values);
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "ai_assistant.config_updated", entityType: "ai_assistant_settings", entityId: existing?.id ?? null, metadata: { provider: input.provider, model, isEnabled: input.isEnabled, apiKeyUpdated: Boolean(input.apiKey?.trim()), modelAutoSelected: input.provider === "gemini" } });
      const saved = (await db.select().from(aiAssistantSettings).limit(1))[0];
      return publicAiAssistantConfig(saved);
    }),
  }),

  catalog: router({
    categories: publicProcedure.query(() => listCategories()),
    topics: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select({ id: topics.id, name: topics.name, slug: topics.slug, parentId: topics.parentId, depth: topics.depth, sortOrder: topics.sortOrder })
        .from(topics)
        .where(and(eq(topics.status, "active"), isNull(topics.deletedAt)))
        .orderBy(asc(topics.sortOrder), asc(topics.name));
      const childrenByParent = new Map<number | null, typeof rows>();
      for (const row of rows) childrenByParent.set(row.parentId, [...(childrenByParent.get(row.parentId) ?? []), row]);
      const ordered: typeof rows = [];
      const visit = (parentId: number | null) => {
        for (const row of childrenByParent.get(parentId) ?? []) {
          ordered.push(row);
          visit(row.id);
        }
      };
      visit(null);
      return ordered.map(({ sortOrder: _sortOrder, ...topic }) => topic);
    }),
    membershipPlans: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true)).orderBy(asc(subscriptionPlans.displayOrder), subscriptionPlans.name);
    }),
    list: publicProcedure.input(z.object({ search: z.string().trim().max(120).optional(), categoryId: z.number().int().positive().optional() }).optional())
      .query(({ input }) => listPublishedCatalog(input?.search, input?.categoryId)),
    detail: publicProcedure.input(quizIdInput).query(async ({ ctx, input }) => {
      const detail = await getQuizDetail(input.quizId);
      if (!detail || !detail.quiz.isPublished) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy bộ đề." });
      if (detail.quiz.visibility === "private" && detail.quiz.creatorUserId !== ctx.user?.id) throw new TRPCError({ code: "FORBIDDEN", message: "Quiz riêng tư chỉ dành cho chủ sở hữu." });
      return detail;
    }),
  }),

  learner: router({
    summary: protectedProcedure.query(({ ctx }) => getLearnerSummary(ctx.user.id)),
    gamification: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể tải tiến trình Gamification." });
      await ensureLearnerProfile(ctx.user.id);
      const summary = await getLearnerGamificationSummary(db, ctx.user.id);
      if (!summary) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể khởi tạo tiến trình học tập." });
      return summary;
    }),
    celebrations: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(gamificationCelebrations).where(and(eq(gamificationCelebrations.userId, ctx.user.id), isNull(gamificationCelebrations.seenAt))).orderBy(asc(gamificationCelebrations.createdAt)).limit(5);
    }),
    markCelebrationsSeen: protectedProcedure.input(z.object({ ids: z.array(z.number().int().positive()).min(1).max(5) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể cập nhật phần thưởng." });
      await db.update(gamificationCelebrations).set({ seenAt: new Date() }).where(and(eq(gamificationCelebrations.userId, ctx.user.id), inArray(gamificationCelebrations.id, input.ids), isNull(gamificationCelebrations.seenAt)));
      return { success: true };
    }),
    aiPricing: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể tải giá Point AI." });
      await ensureLearnerProfile(ctx.user.id);
      return getAiPointQuotes(db, ctx.user.id);
    }),
    quota: protectedProcedure.query(async ({ ctx }) => {
      const profile = await ensureLearnerProfile(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập quota thành viên." });
      const tier = profile.tier as QuotaTier;
      const limits = membershipQuotas[tier];
      const usage = await getMonthlyQuotaUsage(ctx.user.id);
      const remaining = {
        attempts: limits.attemptsPerMonth === null ? null : Math.max(0, limits.attemptsPerMonth - usage.attempts),
        quizzes: limits.quizzesPerMonth === null ? null : Math.max(0, limits.quizzesPerMonth - usage.quizzes),
        aiCredits: limits.aiCreditsPerMonth === null ? null : Math.max(0, limits.aiCreditsPerMonth - usage.aiCredits),
      };
      return { tier, limits, usage, remaining };
    }),
    wallet: protectedProcedure.query(({ ctx }) => getWalletTransactions(ctx.user.id)),
    notifications: protectedProcedure.input(z.object({ limit: z.number().int().min(1).max(50).default(20) }).optional()).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { items: [], unreadCount: 0 };
      const limit = input?.limit ?? 20;
      const [items, unread] = await Promise.all([
        db.select().from(userNotifications).where(eq(userNotifications.userId, ctx.user.id)).orderBy(desc(userNotifications.createdAt)).limit(limit),
        db.select({ count: sql<number>`count(*)` }).from(userNotifications).where(and(eq(userNotifications.userId, ctx.user.id), eq(userNotifications.isRead, false))),
      ]);
      return { items, unreadCount: Number(unread[0]?.count ?? 0) };
    }),
    markNotificationRead: protectedProcedure.input(z.object({ notificationId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể cập nhật thông báo." });
      await db.update(userNotifications).set({ isRead: true, readAt: new Date() }).where(and(eq(userNotifications.id, input.notificationId), eq(userNotifications.userId, ctx.user.id), eq(userNotifications.isRead, false)));
      return { success: true };
    }),
    markAllNotificationsRead: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể cập nhật thông báo." });
      await db.update(userNotifications).set({ isRead: true, readAt: new Date() }).where(and(eq(userNotifications.userId, ctx.user.id), eq(userNotifications.isRead, false)));
      return { success: true };
    }),
    updateProfile: protectedProcedure.input(z.object({ bio: z.string().trim().max(500).optional(), learningGoal: z.string().trim().max(220).optional(), contactEmail: z.string().trim().email().max(320).optional().or(z.literal("")), birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")), address: z.string().trim().max(500).optional(), countryCode: z.string().trim().length(2).optional().or(z.literal("")), province: z.string().trim().max(120).optional(), origin: z.string().url().optional(), avatarUrl: z.string().url().max(1024).optional().or(z.literal("")), notificationPreferences: z.object({ studyReminders: z.boolean(), resultUpdates: z.boolean(), platformUpdates: z.boolean() }).optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const profile = await ensureLearnerProfile(ctx.user.id);
        if (!profile) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const requestedEmail = input.contactEmail?.trim().toLowerCase();
        const requiresEmailConfirmation = Boolean(requestedEmail && requestedEmail !== profile.contactEmail);
        const verificationToken = requiresEmailConfirmation ? randomBytes(32).toString("base64url") : null;
        const verificationExpiresAt = requiresEmailConfirmation ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;
        await db.update(learnerProfiles).set({ bio: input.bio === undefined ? profile.bio : input.bio || null, learningGoal: input.learningGoal === undefined ? profile.learningGoal : input.learningGoal || null, contactEmail: input.contactEmail === "" ? null : profile.contactEmail, pendingContactEmail: requiresEmailConfirmation ? requestedEmail! : profile.pendingContactEmail, contactEmailVerificationTokenHash: requiresEmailConfirmation ? hashContactEmailVerificationToken(verificationToken!) : profile.contactEmailVerificationTokenHash, contactEmailVerificationExpiresAt: requiresEmailConfirmation ? verificationExpiresAt : profile.contactEmailVerificationExpiresAt, birthDate: input.birthDate === undefined ? profile.birthDate : input.birthDate || null, address: input.address === undefined ? profile.address : input.address || null, countryCode: input.countryCode === undefined ? profile.countryCode : input.countryCode || null, province: input.province === undefined ? profile.province : input.province || null, avatarUrl: input.avatarUrl === undefined ? profile.avatarUrl : input.avatarUrl || null, notificationPreferences: input.notificationPreferences === undefined ? profile.notificationPreferences : input.notificationPreferences }).where(eq(learnerProfiles.id, profile.id));
        let emailDeliverySent = false;
        if (requiresEmailConfirmation) {
          const settings = (await db.select().from(emailDeliverySettings).limit(1))[0];
          try { emailDeliverySent = Boolean(settings && (await sendContactEmailVerification(settings, { recipient: requestedEmail!, learnerName: ctx.user.name ?? null, verificationToken: verificationToken!, appOrigin: input.origin ?? "" })).sent); } catch (error) { console.error("[Profile Email] Verification email failed:", error); }
        }
        return { success: true, emailVerificationPending: requiresEmailConfirmation, emailDeliverySent };
      }),
    confirmContactEmail: publicProcedure.input(z.object({ token: z.string().min(32).max(200) })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể xác nhận email lúc này." });
      const tokenHash = hashContactEmailVerificationToken(input.token);
      const profile = (await db.select().from(learnerProfiles).where(and(eq(learnerProfiles.contactEmailVerificationTokenHash, tokenHash), gt(learnerProfiles.contactEmailVerificationExpiresAt, new Date()))).limit(1))[0];
      if (!profile?.pendingContactEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "Liên kết xác nhận không hợp lệ hoặc đã hết hạn." });
      await db.update(learnerProfiles).set({ contactEmail: profile.pendingContactEmail, pendingContactEmail: null, contactEmailVerificationTokenHash: null, contactEmailVerificationExpiresAt: null }).where(eq(learnerProfiles.id, profile.id));
      return { success: true, contactEmail: profile.pendingContactEmail };
    }),
    uploadAvatar: protectedProcedure.input(avatarUploadInput).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể tải ảnh đại diện lúc này." });
      const profile = await ensureLearnerProfile(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập hồ sơ người học." });
      const bytes = decodeAvatarImageUpload(input);
      const uploaded = await storagePut(`learner-avatars/${ctx.user.id}/${Date.now()}-${safeUploadFileName(input.fileName)}`, bytes, input.mimeType);
      await db.update(learnerProfiles).set({ avatarUrl: uploaded.url }).where(eq(learnerProfiles.id, profile.id));
      return { url: uploaded.url };
    }),
    referral: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { referralCode: "", referredByCode: null, invitations: [], rewards: [], totalRewarded: 0 };
      const profile = await ensureLearnerProfile(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập hồ sơ referral." });
      const [invitations, rewards] = await Promise.all([
        db.select({ profile: learnerProfiles, name: users.name, email: users.email }).from(learnerProfiles).leftJoin(users, eq(learnerProfiles.userId, users.id)).where(eq(learnerProfiles.referredByCode, profile.referralCode)).orderBy(desc(learnerProfiles.createdAt)).limit(50),
        db.select().from(walletTransactions).where(and(eq(walletTransactions.userId, ctx.user.id), eq(walletTransactions.type, "referral_reward"))).orderBy(desc(walletTransactions.createdAt)).limit(50),
      ]);
      return { referralCode: profile.referralCode, referredByCode: profile.referredByCode, invitations, rewards, totalRewarded: rewards.reduce((sum, item) => sum + item.amount, 0) };
    }),
    applyReferralCode: protectedProcedure.input(z.object({ code: z.string().trim().toUpperCase().min(4).max(20) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể kết nối chương trình giới thiệu." });
      const profile = await ensureLearnerProfile(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập hồ sơ referral." });
      const referralCode = normalizeReferralCode(input.code);
      const validationError = getReferralValidationError({ code: referralCode, ownCode: profile.referralCode, hasReferredByCode: Boolean(profile.referredByCode) });
      if (validationError) throw new TRPCError({ code: validationError.includes("chính mình") ? "BAD_REQUEST" : "PRECONDITION_FAILED", message: validationError });
      const referrer = await db.select().from(learnerProfiles).where(eq(learnerProfiles.referralCode, referralCode)).limit(1);
      const referrerProfile = referrer[0];
      if (!referrerProfile) throw new TRPCError({ code: "NOT_FOUND", message: "Mã giới thiệu chưa hợp lệ." });
      const recipientReward = 10;
      const referrerReward = 20;
      const recipientBalance = profile.pointBalance + recipientReward;
      const referrerBalance = referrerProfile.pointBalance + referrerReward;
      await db.update(learnerProfiles).set({ referredByCode: referralCode, pointBalance: recipientBalance }).where(eq(learnerProfiles.id, profile.id));
      await db.update(learnerProfiles).set({ pointBalance: referrerBalance }).where(eq(learnerProfiles.id, referrerProfile.id));
      await db.insert(walletTransactions).values([
        { userId: ctx.user.id, type: "referral_reward", amount: recipientReward, balanceAfter: recipientBalance, description: `Thưởng chào mừng từ mã ${referralCode}`, referenceType: "referral", referenceId: referrerProfile.userId },
        { userId: referrerProfile.userId, type: "referral_reward", amount: referrerReward, balanceAfter: referrerBalance, description: `Thưởng giới thiệu học viên mới`, referenceType: "referral", referenceId: ctx.user.id },
      ]);
      return { success: true, recipientReward, referrerReward };
    }),
    history: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select({ attempt: attempts, quizTitle: quizzes.title, quizMode: quizzes.mode })
        .from(attempts).innerJoin(quizzes, eq(attempts.quizId, quizzes.id))
        .where(eq(attempts.userId, ctx.user.id)).orderBy(desc(attempts.startedAt)).limit(30);
    }),
  }),

  payment: router({
    offers: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập dữ liệu thanh toán." });
      const records = await db.select({ itemCode: paymentRecords.itemCode })
        .from(paymentRecords)
        .where(and(eq(paymentRecords.userId, ctx.user.id), eq(paymentRecords.status, "paid")));
      const pointOffers = Object.values(paymentPackages).filter(pkg => pkg.itemType === "points").map(pkg => ({ ...buildPaymentOffer(pkg, records.filter(record => record.itemCode === pkg.code).length), benefits: [] as string[] }));
      const membershipPlans = (await db.select().from(subscriptionPlans).where(and(eq(subscriptionPlans.isActive, true), eq(subscriptionPlans.payosEnabled, true)))).sort((left, right) => left.displayOrder - right.displayOrder || left.name.localeCompare(right.name, "vi"));
      const membershipOffers = membershipPlans.map(plan => ({ code: `membership-${plan.id}`, itemType: "membership" as const, label: plan.name, regularAmount: plan.monthlyPrice, amount: plan.promoPrice ?? plan.monthlyPrice, discounted: plan.promoPrice !== null, discountLabel: plan.promoPrice !== null ? "Giá ưu đãi" : null, pointAmount: plan.payosRewardPoints, targetTier: plan.tier, membershipMonths: plan.membershipMonths, planId: plan.id, benefits: plan.benefits ?? [] }));
      return [...pointOffers, ...membershipOffers];
    }),
    createLink: protectedProcedure.input(z.object({ packageCode: z.string().trim() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể kết nối hệ thống thanh toán." });
      const clientId = process.env.PAYOS_CLIENT_ID;
      const apiKey = process.env.PAYOS_API_KEY;
      const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
      if (!clientId || !apiKey || !checksumKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "PayOS chưa được cấu hình đầy đủ." });

      const staticPackage = isPaymentPackageCode(input.packageCode) ? getPaymentPackage(input.packageCode) : undefined;
      const planMatch = /^membership-(\d+)$/.exec(input.packageCode);
      const plan = planMatch ? (await db.select().from(subscriptionPlans).where(and(eq(subscriptionPlans.id, Number(planMatch[1])), eq(subscriptionPlans.isActive, true), eq(subscriptionPlans.payosEnabled, true))).limit(1))[0] : undefined;
      if (!staticPackage && !plan) throw new TRPCError({ code: "BAD_REQUEST", message: "Gói thanh toán không hợp lệ hoặc chưa bật PayOS." });
      const pkg = staticPackage ?? { code: input.packageCode, itemType: "membership" as const, pointAmount: plan!.payosRewardPoints, targetTier: plan!.tier, membershipMonths: plan!.membershipMonths };
      const priorPurchases = await db.select({ id: paymentRecords.id }).from(paymentRecords)
        .where(and(eq(paymentRecords.userId, ctx.user.id), eq(paymentRecords.itemCode, pkg.code), eq(paymentRecords.status, "paid")));
      const amount = plan ? (plan.promoPrice ?? plan.monthlyPrice) : getPaymentAmount(staticPackage!, priorPurchases.length);
      const orderCode = createPayosOrderCode();
      const origin = `${ctx.req.protocol}://${ctx.req.get("host")}`;
      const callbacks = buildPayosCallbackUrls(origin, orderCode);
      const description = `DS ${plan?.code ?? pkg.code}`.slice(0, 25);
      const created = await db.insert(paymentRecords).values({
        userId: ctx.user.id,
        itemType: pkg.itemType,
        itemCode: pkg.code,
        payosOrderCode: orderCode,
        amount,
        pointAmount: pkg.pointAmount,
        targetTier: pkg.targetTier,
        membershipMonths: pkg.membershipMonths,
        description,
      });
      const recordId = Number(created[0].insertId);
      try {
        const link = await createPayosPaymentLink({ clientId, apiKey, checksumKey, orderCode, amount, description, ...callbacks });
        await db.update(paymentRecords).set({ payosPaymentLinkId: link.paymentLinkId }).where(eq(paymentRecords.id, recordId));
        return { recordId, orderCode, amount, checkoutUrl: link.checkoutUrl, discounted: plan ? plan.promoPrice !== null : isFirstPurchaseDiscountEligible(staticPackage!, priorPurchases.length) };
      } catch (error) {
        await db.update(paymentRecords).set({ status: "failed" }).where(eq(paymentRecords.id, recordId));
        throw new TRPCError({ code: "BAD_GATEWAY", message: error instanceof Error ? error.message : "Không thể tạo liên kết PayOS." });
      }
    }),
    status: protectedProcedure.input(z.object({ orderCode: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập trạng thái thanh toán." });
      const rows = await db.select({ id: paymentRecords.id, status: paymentRecords.status, amount: paymentRecords.amount, itemCode: paymentRecords.itemCode, pointAmount: paymentRecords.pointAmount, targetTier: paymentRecords.targetTier, paidAt: paymentRecords.paidAt })
        .from(paymentRecords).where(and(eq(paymentRecords.userId, ctx.user.id), eq(paymentRecords.payosOrderCode, input.orderCode))).limit(1);
      const record = rows[0];
      if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy đơn thanh toán của bạn." });
      return record;
    }),
  }),

  leaderboard: router({
    list: publicProcedure.input(z.object({ quizId: z.number().int().positive().optional() }).optional())
      .query(({ input }) => getLeaderboard(input?.quizId)),
    xp: publicProcedure.input(z.object({ period: z.enum(["all", "week", "month"]).default("all") }).optional())
      .query(({ input }) => getXpLeaderboard(input?.period ?? "all")),
  }),

  quiz: router({
    practiceWrong: protectedProcedure.input(z.object({ quizId: z.number().int().positive().optional() }).optional()).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const wrongRows = await db.select({ questionId: attemptAnswers.questionId, latestAnswerId: sql<number>`max(${attemptAnswers.id})` })
        .from(attemptAnswers).innerJoin(attempts, eq(attemptAnswers.attemptId, attempts.id))
        .where(and(eq(attempts.userId, ctx.user.id), eq(attempts.status, "submitted"), eq(attemptAnswers.isCorrect, false), input?.quizId ? eq(attempts.quizId, input.quizId) : undefined))
        .groupBy(attemptAnswers.questionId).limit(30);
      const result = [];
      for (const row of wrongRows) {
        const question = await db.select({ question: questions, categoryId: categories.id, categoryTitle: categories.title })
          .from(questions)
          .innerJoin(lessons, eq(questions.lessonId, lessons.id))
          .innerJoin(subjects, eq(lessons.subjectId, subjects.id))
          .innerJoin(categories, eq(subjects.categoryId, categories.id))
          .where(eq(questions.id, row.questionId)).limit(1);
        if (!question[0]) continue;
        const options = await db.select().from(questionOptions).where(eq(questionOptions.questionId, row.questionId)).orderBy(questionOptions.sortOrder);
        result.push({
          question: question[0].question,
          category: { id: question[0].categoryId, title: question[0].categoryTitle },
          options: options.map(option => ({ id: option.id, body: option.body, isCorrect: option.isCorrect })),
        });
      }
      return result;
    }),
    completePractice: protectedProcedure.input(z.object({ questionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể cập nhật tiến trình luyện tập." });
      const source = await db.select({ categoryId: categories.id, categoryTitle: categories.title })
        .from(questions)
        .innerJoin(lessons, eq(questions.lessonId, lessons.id))
        .innerJoin(subjects, eq(lessons.subjectId, subjects.id))
        .innerJoin(categories, eq(subjects.categoryId, categories.id))
        .where(eq(questions.id, input.questionId)).limit(1);
      const category = source[0];
      if (!category) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy nguồn nội dung của câu luyện tập." });
      const profile = await ensureLearnerProfile(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập hồ sơ học viên." });
      await db.update(learnerProfiles).set({ lastPracticeCategoryId: category.categoryId }).where(eq(learnerProfiles.id, profile.id));
      return { category };
    }),
    start: protectedProcedure.input(quizIdInput).mutation(async ({ ctx, input }) => {
      const detail = await getQuizDetail(input.quizId);
      if (!detail || (!detail.quiz.isPublished && detail.quiz.creatorUserId !== ctx.user.id)) throw new TRPCError({ code: "NOT_FOUND", message: "Bộ đề chưa sẵn sàng." });
      if (detail.quiz.visibility === "private" && detail.quiz.creatorUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Quiz riêng tư chỉ dành cho chủ sở hữu." });
      const profile = await ensureLearnerProfile(ctx.user.id);
      if (!profile || profile.isBanned) throw new TRPCError({ code: "FORBIDDEN", message: "Tài khoản hiện không thể tham gia bài thi." });
      const runtimeSettings = (detail.quiz.creatorSettings ?? {}) as { maxAttempts?: number; expiresAt?: string };
      if (runtimeSettings.expiresAt && new Date(runtimeSettings.expiresAt).getTime() <= Date.now()) throw new TRPCError({ code: "FORBIDDEN", message: "Quiz này đã hết thời hạn làm bài." });
      if (runtimeSettings.maxAttempts && runtimeSettings.maxAttempts > 0) {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể kiểm tra số lượt làm bài." });
        const rows = await db.select({ count: sql<number>`count(${attempts.id})` }).from(attempts).where(and(eq(attempts.quizId, detail.quiz.id), eq(attempts.userId, ctx.user.id), eq(attempts.status, "submitted")));
        if (Number(rows[0]?.count ?? 0) >= runtimeSettings.maxAttempts) throw new TRPCError({ code: "FORBIDDEN", message: `Bạn đã dùng hết ${runtimeSettings.maxAttempts} lượt làm Quiz này.` });
      }
      await assertQuotaAvailable(ctx.user.id, "attemptsPerMonth");
      if (tierRank[profile.tier as keyof typeof tierRank] < tierRank[detail.quiz.accessTier]) {
        throw new TRPCError({ code: "FORBIDDEN", message: `Bộ đề này dành cho thành viên ${detail.quiz.accessTier.toUpperCase()} trở lên.` });
      }
      const questionSet = await getQuizQuestionSet(input.quizId);
      if (!questionSet.length) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Bộ đề chưa có câu hỏi hợp lệ." });
      if (detail.quiz.mode === "testing" && detail.quiz.entryPointCost > 0) {
        if (profile.pointBalance < detail.quiz.entryPointCost) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Số dư Point chưa đủ để bắt đầu bài kiểm tra." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể kết nối ví Point." });
        const balanceAfter = profile.pointBalance - detail.quiz.entryPointCost;
        await db.update(learnerProfiles).set({ pointBalance: balanceAfter }).where(eq(learnerProfiles.id, profile.id));
        await db.insert(walletTransactions).values({
          userId: ctx.user.id,
          type: "quiz_fee",
          amount: -detail.quiz.entryPointCost,
          balanceAfter,
          description: `Phí tham gia: ${detail.quiz.title}`,
          referenceType: "quiz",
          referenceId: detail.quiz.id,
        });
      }
      const ordered = detail.quiz.randomizeQuestions
        ? shuffledForAttempt(questionSet, Date.now())
        : questionSet;
      const attemptId = await createAttempt({
        userId: ctx.user.id,
        quizId: detail.quiz.id,
        mode: detail.quiz.mode,
        questionOrder: ordered.map(item => item.question.id),
      });
      return {
        attemptId,
        quiz: detail.quiz,
        hierarchy: { category: detail.category.title, subject: detail.subject.title, lesson: detail.lesson.title },
        questions: ordered.map((item, questionIndex) => ({
          id: item.question.id,
          prompt: item.question.prompt,
          type: item.question.type,
          difficulty: item.question.difficulty,
          tags: item.question.tags,
          imageUrl: item.question.imageUrl,
          media: ((item.question.answerConfig as { media?: unknown } | null)?.media ?? null) as { url: string; kind: "audio" | "video"; fileName: string } | null,
          statements: item.question.type === "true_false_statements" ? getTrueFalseStatements(item.question.answerConfig ?? {}).map(statement => ({ id: statement.id, text: statement.text })) : [],
          questionIndex,
          options: detail.quiz.randomizeOptions
            ? shuffledForAttempt(item.options, attemptId + item.question.id)
            : item.options,
        })).map(question => ({
          ...question,
          options: question.options.map(option => ({ id: option.id, body: option.body })),
        })),
      };
    }),
    saveAnswer: permissionProcedure("quiz.submit").input(z.object({ attemptId: z.number().int().positive(), questionId: z.number().int().positive(), selectedOptionIds: z.array(z.number().int().positive()).max(10), answerPayload: z.object({ statementAnswers: z.record(z.string().min(1).max(64), z.boolean()).refine(values => Object.keys(values).length <= 8, "Tối đa tám nhận định.") }).optional() }))
      .mutation(async ({ ctx, input }) => { await assertOwnedAttempt(ctx.user.id, input.attemptId, input.questionId); return saveAnswer(input); }),
    submit: protectedProcedure.input(z.object({ attemptId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const result = await submitAttempt(input.attemptId, ctx.user.id);
      const alert = buildAttemptMilestoneAlert({ learnerName: ctx.user.name ?? "Một học viên", quizTitle: result.quiz.title, scorePercent: result.scorePercent, passed: result.passed, isFirstCompletion: result.isFirstCompletion, isQuizRecord: result.isQuizRecord, isPersonalRecord: result.isPersonalRecord });
      try { await notifyOwner(alert); } catch (error) { console.warn("[Quiz notification] Delivery failed without affecting submission", error); }
      return result;
    }),
    securityEvent: permissionProcedure("quiz.submit").input(z.object({ attemptId: z.number().int().positive(), eventType: z.enum(["copy", "paste", "context_menu", "tab_hidden", "fullscreen_exit"]) }))
      .mutation(async ({ ctx, input }) => { await assertOwnedAttempt(ctx.user.id, input.attemptId); return logSecurityEvent(input.attemptId, input.eventType); }),
  }),

  creator: router({
    contentOptions: permissionProcedure("quiz.create").query(async () => {
      const db = await getDb();
      if (!db) return { categories: [], subjects: [], lessons: [], topics: [] };
      const [categoryRows, subjectRows, lessonRows, topicRows] = await Promise.all([
        db.select().from(categories).where(eq(categories.isPublished, true)).orderBy(categories.sortOrder),
        db.select().from(subjects).where(eq(subjects.isPublished, true)).orderBy(subjects.sortOrder),
        db.select().from(lessons).where(eq(lessons.isPublished, true)).orderBy(lessons.sortOrder),
        db.select().from(topics).where(and(eq(topics.status, "active"), isNull(topics.deletedAt))).orderBy(asc(topics.path), asc(topics.sortOrder), asc(topics.name)),
      ]);
      return { categories: categoryRows, subjects: subjectRows, lessons: lessonRows, topics: topicRows };
    }),
    uploadCover: permissionProcedure("quiz.create").input(quizImageUploadInput).mutation(async ({ ctx, input }) => {
      const bytes = decodeQuizImageUpload(input);
      const uploaded = await storagePut(`quiz-covers/${ctx.user.id}/${Date.now()}-${safeUploadFileName(input.fileName)}`, bytes, input.mimeType);
      return { url: uploaded.url };
    }),
    uploadQuestionImage: permissionProcedure("quiz.create").input(quizImageUploadInput).mutation(async ({ ctx, input }) => {
      const bytes = decodeQuizImageUpload(input);
      const uploaded = await storagePut(`quiz-question-images/${ctx.user.id}/${Date.now()}-${safeUploadFileName(input.fileName)}`, bytes, input.mimeType);
      return { url: uploaded.url };
    }),
    uploadQuestionMedia: permissionProcedure("quiz.create").input(z.object({ fileName: z.string().min(1).max(160), kind: z.enum(["audio", "video"]), mimeType: z.enum(["audio/mpeg", "audio/mp4", "audio/x-m4a", "video/mp4", "video/webm"]), base64: z.string().min(20).max(72_000_000) })).mutation(async ({ ctx, input }) => {
      const bytes = Buffer.from(input.base64.split(",").pop() ?? "", "base64");
      const allowedMime = input.kind === "audio" ? ["audio/mpeg", "audio/mp4", "audio/x-m4a"] : ["video/mp4", "video/webm"];
      const maxBytes = input.kind === "audio" ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
      if (!allowedMime.includes(input.mimeType)) throw new TRPCError({ code: "BAD_REQUEST", message: "Định dạng tệp không phù hợp với loại media đã chọn." });
      if (bytes.length > maxBytes) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: input.kind === "audio" ? "Audio tối đa 10 MB." : "Video tối đa 50 MB." });
      const uploaded = await storagePut(`quiz-media/${ctx.user.id}/${input.kind}/${input.fileName}`, bytes, input.mimeType);
      return { url: uploaded.url, kind: input.kind, fileName: input.fileName };
    }),
    myQuizzes: permissionProcedure("quiz.view").query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(quizzes).where(eq(quizzes.creatorUserId, ctx.user.id)).orderBy(desc(quizzes.updatedAt));
    }),
    getQuizForEdit: permissionProcedure("quiz.edit").input(quizIdInput).query(async ({ ctx, input }) => {
      const draft = await getOwnedQuizDraft(ctx.user.id, input.quizId);
      return { quiz: draft.quiz, questions: draft.questions };
    }),
    quizAnalytics: permissionProcedure("quiz.view").input(quizIdInput).query(async ({ ctx, input }) => {
      const analytics = await getOwnedQuizAnalytics(ctx.user.id, input.quizId);
      if (!analytics) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy Quiz thuộc quyền quản lý của bạn." });
      return analytics;
    }),
    getDraft: protectedProcedure.input(z.object({ draftKey: z.string().min(8).max(96) })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const [draft] = await db.select().from(quizCreatorDrafts).where(and(eq(quizCreatorDrafts.userId, ctx.user.id), eq(quizCreatorDrafts.draftKey, input.draftKey))).limit(1);
      return draft ?? null;
    }),
    saveDraft: protectedProcedure.input(z.object({ draftKey: z.string().min(8).max(96), quizId: z.number().int().positive().optional(), title: z.string().max(220).default(""), payload: z.record(z.string(), z.unknown()) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể tự lưu nháp lúc này." });
      const savedAt = new Date();
      const values = { userId: ctx.user.id, draftKey: input.draftKey, quizId: input.quizId ?? null, title: input.title.slice(0, 220), payload: input.payload };
      await db.insert(quizCreatorDrafts).values(values).onDuplicateKeyUpdate({ set: { quizId: values.quizId, title: values.title, payload: values.payload, updatedAt: new Date() } });
      await db.insert(quizCreatorDraftVersions).values({ userId: ctx.user.id, draftKey: input.draftKey, title: values.title, payload: values.payload, savedAt });
      const versions = await db.select({ id: quizCreatorDraftVersions.id, isPinned: quizCreatorDraftVersions.isPinned }).from(quizCreatorDraftVersions).where(and(eq(quizCreatorDraftVersions.userId, ctx.user.id), eq(quizCreatorDraftVersions.draftKey, input.draftKey))).orderBy(desc(quizCreatorDraftVersions.isPinned), desc(quizCreatorDraftVersions.savedAt)).limit(41);
      const staleIds = versions.filter(version => !version.isPinned).slice(20).map(version => version.id);
      if (staleIds.length) await db.delete(quizCreatorDraftVersions).where(and(eq(quizCreatorDraftVersions.userId, ctx.user.id), eq(quizCreatorDraftVersions.draftKey, input.draftKey), sql`${quizCreatorDraftVersions.id} in (${sql.join(staleIds.map(id => sql`${id}`), sql`, `)})`));
      return { savedAt };
    }),
    listDraftVersions: protectedProcedure.input(z.object({ draftKey: z.string().min(8).max(96) })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select({ id: quizCreatorDraftVersions.id, title: quizCreatorDraftVersions.title, payload: quizCreatorDraftVersions.payload, isPinned: quizCreatorDraftVersions.isPinned, savedAt: quizCreatorDraftVersions.savedAt }).from(quizCreatorDraftVersions).where(and(eq(quizCreatorDraftVersions.userId, ctx.user.id), eq(quizCreatorDraftVersions.draftKey, input.draftKey))).orderBy(desc(quizCreatorDraftVersions.isPinned), desc(quizCreatorDraftVersions.savedAt)).limit(40);
    }),
    toggleDraftVersionPin: protectedProcedure.input(z.object({ draftKey: z.string().min(8).max(96), versionId: z.number().int().positive(), isPinned: z.boolean() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể cập nhật phiên bản nháp lúc này." });
      const [version] = await db.select({ id: quizCreatorDraftVersions.id }).from(quizCreatorDraftVersions).where(and(eq(quizCreatorDraftVersions.id, input.versionId), eq(quizCreatorDraftVersions.userId, ctx.user.id), eq(quizCreatorDraftVersions.draftKey, input.draftKey))).limit(1);
      if (!version) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy phiên bản nháp." });
      await db.update(quizCreatorDraftVersions).set({ isPinned: input.isPinned }).where(eq(quizCreatorDraftVersions.id, version.id));
      return { id: version.id, isPinned: input.isPinned };
    }),
    restoreDraftVersion: protectedProcedure.input(z.object({ draftKey: z.string().min(8).max(96), versionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể khôi phục bản nháp lúc này." });
      const [version] = await db.select().from(quizCreatorDraftVersions).where(and(eq(quizCreatorDraftVersions.id, input.versionId), eq(quizCreatorDraftVersions.userId, ctx.user.id), eq(quizCreatorDraftVersions.draftKey, input.draftKey))).limit(1);
      if (!version) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy phiên bản nháp." });
      const savedAt = new Date();
      await db.insert(quizCreatorDrafts).values({ userId: ctx.user.id, draftKey: input.draftKey, title: version.title, payload: version.payload }).onDuplicateKeyUpdate({ set: { title: version.title, payload: version.payload, updatedAt: savedAt } });
      return { title: version.title, payload: version.payload, savedAt };
    }),
    deleteDraft: protectedProcedure.input(z.object({ draftKey: z.string().min(8).max(96) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      await db.delete(quizCreatorDrafts).where(and(eq(quizCreatorDrafts.userId, ctx.user.id), eq(quizCreatorDrafts.draftKey, input.draftKey)));
      await db.delete(quizCreatorDraftVersions).where(and(eq(quizCreatorDraftVersions.userId, ctx.user.id), eq(quizCreatorDraftVersions.draftKey, input.draftKey)));
      return { success: true };
    }),
    duplicateQuiz: permissionProcedure("quiz.create").input(quizIdInput).mutation(async ({ ctx, input }) => {
      await assertQuotaAvailable(ctx.user.id, "quizzesPerMonth");
      await assertMembershipGroupPermission(ctx.user.id, "canCreateQuiz", "sao chép Quiz");
      const source = await getOwnedQuizDraft(ctx.user.id, input.quizId);
      const legacyLessonId = source.quiz.lessonId;
      if (!legacyLessonId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Quiz thuộc mô hình Chủ đề mới không thể sao chép bằng luồng legacy." });
      const title = `${source.quiz.title.slice(0, 200)} (Bản sao)`;
      const copy = await source.db.insert(quizzes).values({ lessonId: legacyLessonId, creatorUserId: ctx.user.id, title, slug: `${source.quiz.slug}-copy-${Date.now().toString(36)}`.slice(0, 240), summary: source.quiz.summary, coverImageUrl: source.quiz.coverImageUrl, mode: source.quiz.mode, difficulty: source.quiz.difficulty, accessTier: source.quiz.accessTier, durationSeconds: source.quiz.durationSeconds, passingScore: source.quiz.passingScore, entryPointCost: source.quiz.entryPointCost, completionReward: source.quiz.completionReward, questionCount: source.questions.length, randomizeQuestions: source.quiz.randomizeQuestions, randomizeOptions: source.quiz.randomizeOptions, creatorSettings: source.quiz.creatorSettings, isPublished: false });
      const quizId = Number(copy[0].insertId);
      for (let index = 0; index < source.questions.length; index += 1) { const item = source.questions[index]!; const copiedQuestion = await source.db.insert(questions).values({ lessonId: legacyLessonId, creatorUserId: ctx.user.id, prompt: item.prompt, explanation: item.explanation, imageUrl: item.imageUrl, type: item.type, difficulty: item.difficulty, tags: item.tags, answerConfig: item.answerConfig }); const questionId = Number(copiedQuestion[0].insertId); if (item.options.length) await source.db.insert(questionOptions).values(item.options.map((option: any, optionIndex: number) => ({ questionId, body: option.body, isCorrect: option.isCorrect, sortOrder: optionIndex }))); await source.db.insert(quizQuestions).values({ quizId, questionId, sortOrder: index, points: item.points }); }
      return { quizId, title };
    }),
    deleteQuiz: permissionProcedure("quiz.delete").input(quizIdInput).mutation(async ({ ctx, input }) => {
      const source = await getOwnedQuizDraft(ctx.user.id, input.quizId);
      await removeOwnedQuizQuestions(source.db, source.quiz.id, source.questions);
      await source.db.delete(quizzes).where(and(eq(quizzes.id, source.quiz.id), eq(quizzes.creatorUserId, ctx.user.id)));
      return { success: true };
    }),
    updateCover: permissionProcedure("quiz.edit").input(z.object({ quizId: z.number().int().positive(), coverImageUrl: quizAssetUrlInput.nullable() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể cập nhật ảnh bìa lúc này." });
      const ownedQuiz = await db.select({ id: quizzes.id }).from(quizzes).where(and(eq(quizzes.id, input.quizId), eq(quizzes.creatorUserId, ctx.user.id))).limit(1);
      if (!ownedQuiz.length) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy quiz riêng của bạn." });
      await db.update(quizzes).set({ coverImageUrl: input.coverImageUrl }).where(eq(quizzes.id, input.quizId));
      return { success: true, coverImageUrl: input.coverImageUrl };
    }),
    createQuiz: permissionProcedure("quiz.create").input(z.object({
      lessonId: z.number().int().positive().optional(), topicId: z.number().int().positive().optional(), title: z.string().trim().min(4).max(220), slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(200).optional(), summary: z.string().trim().max(1000).optional(), coverImageUrl: quizAssetUrlInput.optional(), isPublished: z.boolean().default(false),
      settings: z.object({ durationMinutes: z.number().int().min(1).max(1440).default(15), maxAttempts: z.number().int().min(0).max(1000).default(0), expiresAt: z.string().datetime().optional(), antiCheatMonitor: z.boolean().default(false), hideHintsAndExplanation: z.boolean().default(false), allowBackNavigation: z.boolean().default(true), requireRegistration: z.boolean().default(true), liveMonitoring: z.boolean().default(false), requireEmail: z.boolean().default(false), shuffleQuestions: z.boolean().default(false), shuffleAnswers: z.boolean().default(false), visibility: z.enum(["public", "private"]).default("public") }).default({ durationMinutes: 15, maxAttempts: 0, antiCheatMonitor: false, hideHintsAndExplanation: false, allowBackNavigation: true, requireRegistration: true, liveMonitoring: false, requireEmail: false, shuffleQuestions: false, shuffleAnswers: false, visibility: "public" }),
      questions: z.array(z.object({ prompt: z.string().trim().min(8).max(5000), explanation: z.string().trim().max(5000).optional(), imageUrl: quizAssetUrlInput.optional(), type: z.enum(["single", "multiple", "true_false", "true_false_statements", "fill_blank", "matching", "essay"]), difficulty: z.enum(["easy", "medium", "hard"]).default("medium"), tags: z.array(z.string().trim().min(1).max(40)).max(6).default([]), points: z.number().int().min(1).max(100).default(1), options: z.array(z.object({ body: z.string().trim().min(1).max(2000), isCorrect: z.boolean() })).max(10), answerConfig: z.record(z.string(), z.unknown()).default({}) })).min(1).max(50),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể tạo quiz lúc này." });
      await assertQuotaAvailable(ctx.user.id, "quizzesPerMonth");
      await assertMembershipGroupPermission(ctx.user.id, "canCreateQuiz", "tạo Quiz");
      const topic = input.topicId ? (await db.select().from(topics).where(and(eq(topics.id, input.topicId), eq(topics.status, "active"), isNull(topics.deletedAt))).limit(1))[0] : undefined;
      if (input.topicId && !topic) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Chủ đề đã chọn không còn hoạt động." });
      if (topic && !topic.allowQuizCreation) throw new TRPCError({ code: "FORBIDDEN", message: "Chủ đề này hiện không cho phép tạo Quiz." });
      const lesson = input.lessonId ? await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.id, input.lessonId)).limit(1) : await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.isPublished, true)).limit(1);
      if (!lesson.length) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy bài học để gắn quiz." });
      for (const item of input.questions) {
        const error = validateQuestionConfiguration({ type: item.type, options: item.options, answerConfig: item.answerConfig, imageUrl: item.imageUrl ?? null });
        if (error) throw new TRPCError({ code: "BAD_REQUEST", message: `Câu hỏi không hợp lệ: ${error}` });
      }
      const autoSlug = input.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 170) || "quiz";
      const requestedSlug = input.slug || autoSlug;
      const slugExists = await db.select({ id: quizzes.id }).from(quizzes).where(eq(quizzes.slug, requestedSlug)).limit(1);
      const quizSlug = slugExists.length ? `${requestedSlug}-${Date.now().toString(36)}` : requestedSlug;
      const status = topic?.requireQuizModeration && input.isPublished ? "pending_review" : input.isPublished ? "published" : "draft";
      const createdQuiz = await db.insert(quizzes).values({ lessonId: lesson[0]!.id, topicId: topic?.id ?? null, creatorUserId: ctx.user.id, title: input.title, slug: quizSlug, summary: input.summary, coverImageUrl: input.coverImageUrl, mode: "training", accessTier: "basic", durationSeconds: input.settings.durationMinutes * 60, passingScore: 70, questionCount: input.questions.length, randomizeQuestions: input.settings.shuffleQuestions, randomizeOptions: input.settings.shuffleAnswers, visibility: input.settings.visibility, creatorSettings: input.settings, status, isPublished: status === "published" });
      const quizId = Number(createdQuiz[0].insertId);
      for (let index = 0; index < input.questions.length; index += 1) {
        const item = input.questions[index]!;
        const createdQuestion = await db.insert(questions).values({ lessonId: lesson[0]!.id, topicId: topic?.id ?? null, creatorUserId: ctx.user.id, prompt: item.prompt, explanation: item.explanation, imageUrl: item.imageUrl, type: item.type, difficulty: item.difficulty, tags: item.tags, answerConfig: item.answerConfig });
        const questionId = Number(createdQuestion[0].insertId);
        if (item.options.length) await db.insert(questionOptions).values(item.options.map((option: { body: string; isCorrect: boolean }, optionIndex: number) => ({ questionId, body: option.body, isCorrect: option.isCorrect, sortOrder: optionIndex })));
        await db.insert(quizQuestions).values({ quizId, questionId, sortOrder: index, points: item.points });
      }
      return { quizId, title: input.title, slug: quizSlug, questionCount: input.questions.length, isPublished: status === "published", status, visibility: input.settings.visibility };
    }),
    updateQuiz: permissionProcedure("quiz.edit").input(z.object({
      quizId: z.number().int().positive(), lessonId: z.number().int().positive().optional(), topicId: z.number().int().positive().optional(), title: z.string().trim().min(4).max(220), summary: z.string().trim().max(1000).optional(), coverImageUrl: quizAssetUrlInput.optional(), isPublished: z.boolean().default(false),
      settings: z.object({ durationMinutes: z.number().int().min(1).max(1440), maxAttempts: z.number().int().min(0).max(1000), expiresAt: z.string().datetime().optional(), antiCheatMonitor: z.boolean(), hideHintsAndExplanation: z.boolean(), allowBackNavigation: z.boolean(), requireRegistration: z.boolean(), liveMonitoring: z.boolean(), requireEmail: z.boolean(), shuffleQuestions: z.boolean(), shuffleAnswers: z.boolean(), visibility: z.enum(["public", "private"]) }),
      questions: z.array(z.object({ prompt: z.string().trim().min(8).max(5000), explanation: z.string().trim().max(5000).optional(), imageUrl: quizAssetUrlInput.optional(), type: z.enum(["single", "multiple", "true_false", "true_false_statements", "fill_blank", "matching", "essay"]), difficulty: z.enum(["easy", "medium", "hard"]).default("medium"), tags: z.array(z.string().trim().min(1).max(40)).max(6).default([]), points: z.number().int().min(1).max(100).default(1), options: z.array(z.object({ body: z.string().trim().min(1).max(2000), isCorrect: z.boolean() })).max(10), answerConfig: z.record(z.string(), z.unknown()).default({}) })).min(1).max(50),
    })).mutation(async ({ ctx, input }) => {
      const source = await getOwnedQuizDraft(ctx.user.id, input.quizId);
      for (const item of input.questions) { const error = validateQuestionConfiguration({ type: item.type, options: item.options, answerConfig: item.answerConfig, imageUrl: item.imageUrl ?? null }); if (error) throw new TRPCError({ code: "BAD_REQUEST", message: `Câu hỏi không hợp lệ: ${error}` }); }
      const lessonId = input.lessonId ?? source.quiz.lessonId;
      if (!lessonId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Quiz thuộc mô hình Chủ đề mới cần được chỉnh sửa trong Quiz System." });
      const topicId = input.topicId ?? source.quiz.topicId ?? undefined;
      const topic = topicId ? (await source.db.select().from(topics).where(and(eq(topics.id, topicId), eq(topics.status, "active"), isNull(topics.deletedAt))).limit(1))[0] : undefined;
      if (!topic) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Hãy chọn một Chủ đề đang hoạt động từ CPanel." });
      if (!topic.allowQuizCreation) throw new TRPCError({ code: "FORBIDDEN", message: "Chủ đề này hiện không cho phép tạo Quiz." });
      const status = topic.requireQuizModeration && input.isPublished ? "pending_review" : input.isPublished ? "published" : "draft";
      await removeOwnedQuizQuestions(source.db, source.quiz.id, source.questions);
      await source.db.update(quizzes).set({ lessonId, topicId, status, title: input.title, summary: input.summary, coverImageUrl: input.coverImageUrl, durationSeconds: input.settings.durationMinutes * 60, questionCount: input.questions.length, randomizeQuestions: input.settings.shuffleQuestions, randomizeOptions: input.settings.shuffleAnswers, visibility: input.settings.visibility, creatorSettings: input.settings, isPublished: status === "published" }).where(and(eq(quizzes.id, source.quiz.id), eq(quizzes.creatorUserId, ctx.user.id)));
      for (let index = 0; index < input.questions.length; index += 1) { const item = input.questions[index]!; const createdQuestion = await source.db.insert(questions).values({ lessonId, topicId, creatorUserId: ctx.user.id, prompt: item.prompt, explanation: item.explanation, imageUrl: item.imageUrl, type: item.type, difficulty: item.difficulty, tags: item.tags, answerConfig: item.answerConfig }); const questionId = Number(createdQuestion[0].insertId); if (item.options.length) await source.db.insert(questionOptions).values(item.options.map((option, optionIndex) => ({ questionId, body: option.body, isCorrect: option.isCorrect, sortOrder: optionIndex }))); await source.db.insert(quizQuestions).values({ quizId: source.quiz.id, questionId, sortOrder: index, points: item.points }); }
      return { quizId: source.quiz.id, title: input.title, questionCount: input.questions.length, isPublished: status === "published", status, visibility: input.settings.visibility };
    }),
    generateQuestionAI: permissionProcedure("ai.quiz.generate").input(aiQuestionInputSchema.omit({ lessonId: true })).mutation(async ({ ctx, input }) => {
      await assertMembershipGroupPermission(ctx.user.id, "canUseAi", "tạo câu hỏi bằng AI");
      const quota = await assertQuotaAvailable(ctx.user.id, "aiCreditsPerMonth");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập ví Point." });
      try { const charged = await runWithAiPointCharge(db, { userId: ctx.user.id, code: "ai_question_generation", requestKey: `question:${ctx.user.id}:${Date.now()}` }, async () => { const response = await invokeLLM({ messages: [{ role: "system", content: "Bạn là chuyên gia biên soạn câu hỏi bằng tiếng Việt. Chỉ trả về JSON hợp lệ, không có markdown." }, { role: "user", content: `Tạo một câu hỏi loại ${input.type}, độ khó ${input.difficulty}, chủ đề ${input.topic}. Ngữ cảnh: ${input.context ?? "Không có"}. Trả JSON gồm prompt, explanation, options và answerConfig. Với fill_blank dùng answerConfig.acceptedAnswers; matching dùng pairs {left,right}; true_false dùng Đúng/Sai; essay cần answerConfig.sampleOutline.` }], maxTokens: 1200, response_format: { type: "json_schema", json_schema: { name: "creator_question_draft", strict: true, schema: { type: "object", properties: { prompt: { type: "string" }, explanation: { type: "string" }, options: { type: "array", items: { type: "object", properties: { body: { type: "string" }, isCorrect: { type: "boolean" } }, required: ["body", "isCorrect"], additionalProperties: false } }, answerConfig: { type: "object", additionalProperties: true } }, required: ["prompt", "explanation", "options", "answerConfig"], additionalProperties: false } } } }); return parseAiQuestionDraft(response.choices[0]?.message.content, input.type); }); await recordAiUsage(ctx.user.id, "generate_question"); return { ...input, ...charged.value, quota: { used: quota.used + 1, limit: quota.limit }, pointCharge: charged.pointCharge }; }
      catch (error) { if (error instanceof TRPCError) throw error; throw new TRPCError({ code: "BAD_GATEWAY", message: error instanceof Error ? `AI tạo câu hỏi không hợp lệ: ${error.message}` : "AI tạo câu hỏi không hợp lệ." }); }
    }),
    studioAiChat: permissionProcedure("ai.quiz.generate").input(quizStudioChatInputSchema).mutation(async ({ ctx, input }) => {
      await assertMembershipGroupPermission(ctx.user.id, "canUseAi", "dùng chat AI trong Studio");
      const response = await invokeLLM({ messages: buildQuizStudioChatMessages(input), maxTokens: 2_400, response_format: { type: "json_schema", json_schema: { name: "quiz_studio_chat", strict: true, schema: { type: "object", properties: { action: { type: "string", enum: ["clarify", "generate"] }, reply: { type: "string" }, detected: { type: "object", properties: { topic: { type: ["string", "null"] }, type: { type: ["string", "null"] }, difficulty: { type: ["string", "null"] }, count: { type: ["integer", "null"] } }, required: ["topic", "type", "difficulty", "count"], additionalProperties: false }, questions: { type: "array", items: { type: "object", properties: { type: { type: "string" }, difficulty: { type: "string" }, prompt: { type: "string" }, explanation: { type: "string" }, options: { type: "array", items: { type: "object", properties: { body: { type: "string" }, isCorrect: { type: "boolean" } }, required: ["body", "isCorrect"], additionalProperties: false } }, answerConfig: { type: "object", additionalProperties: true } }, required: ["type", "difficulty", "prompt", "explanation", "options", "answerConfig"], additionalProperties: false } }, suggestedPrompts: { type: "array", items: { type: "string" } } }, required: ["action", "reply", "detected", "questions", "suggestedPrompts"], additionalProperties: false } } } });
      try {
        const result = parseQuizStudioChatResponse(response.choices[0]?.message.content);
        if (result.action === "generate") {
          const quota = await assertQuotaAvailable(ctx.user.id, "aiCreditsPerMonth");
          if (quota.limit !== null && quota.used + result.questions.length > quota.limit) throw new TRPCError({ code: "FORBIDDEN", message: `Bạn cần ${result.questions.length} AI Credits nhưng chỉ còn ${Math.max(0, quota.limit - quota.used)} Credit.` });
          for (const _question of result.questions) await recordAiUsage(ctx.user.id, "generate_question");
          return { ...result, quota: { used: quota.used + result.questions.length, limit: quota.limit } };
        }
        return { ...result, quota: null };
      } catch (error) { if (error instanceof TRPCError) throw error; throw new TRPCError({ code: "BAD_GATEWAY", message: error instanceof Error ? `AI Studio chưa thể xử lý yêu cầu: ${error.message}` : "AI Studio chưa thể xử lý yêu cầu." }); }
    }),
    enhanceQuestionAI: permissionProcedure("ai.quiz.generate").input(questionEnhancementInputSchema).mutation(async ({ ctx, input }) => {
      await assertMembershipGroupPermission(ctx.user.id, "canUseAi", "dùng công cụ AI cho câu hỏi");
      const quota = await assertQuotaAvailable(ctx.user.id, "aiCreditsPerMonth");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập ví Point." });
      try { const charged = await runWithAiPointCharge(db, { userId: ctx.user.id, code: "ai_question_enhancement", requestKey: `enhancement:${ctx.user.id}:${Date.now()}` }, async () => { const response = await invokeLLM({ messages: buildQuestionEnhancementMessages(input), maxTokens: 1_600, response_format: { type: "json_schema", json_schema: { name: "quiz_question_enhancement", strict: true, schema: { type: "object", properties: { action: { type: "string", enum: ["explain", "rephrase", "latex"] }, prompt: { type: "string" }, explanation: { type: "string" }, options: { type: "array", items: { type: "object", properties: { body: { type: "string" }, isCorrect: { type: "boolean" } }, required: ["body", "isCorrect"], additionalProperties: false } }, answerConfig: { type: "object", additionalProperties: true } }, required: ["action", "prompt", "explanation", "options", "answerConfig"], additionalProperties: false } } } }); return parseQuestionEnhancement(response.choices[0]?.message.content, input.question.type); }); await recordAiUsage(ctx.user.id, "generate_question"); return { ...charged.value, quota: { used: quota.used + 1, limit: quota.limit }, pointCharge: charged.pointCharge }; }
      catch (error) { if (error instanceof TRPCError) throw error; throw new TRPCError({ code: "BAD_GATEWAY", message: error instanceof Error ? `AI chưa thể nâng cấp câu hỏi: ${error.message}` : "AI chưa thể nâng cấp câu hỏi." }); }
    }),
    generateQuestionsFromDocument: permissionProcedure("ai.quiz.generate").input(z.object({ fileName: z.string().min(1).max(160), mimeType: z.enum(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]), base64: z.string().min(80).max(22_000_000), questionCount: z.number().int().min(1).max(20).default(5), difficulty: z.enum(["easy", "medium", "hard"]).default("medium") })).mutation(async ({ ctx, input }) => {
      await assertMembershipGroupPermission(ctx.user.id, "canUseAi", "tạo câu hỏi từ tài liệu bằng AI");
      const quota = await assertQuotaAvailable(ctx.user.id, "aiCreditsPerMonth");
      if (quota.limit !== null && quota.used + input.questionCount > quota.limit) throw new TRPCError({ code: "FORBIDDEN", message: `Bạn cần ${input.questionCount} AI Credits nhưng chỉ còn ${Math.max(0, quota.limit - quota.used)} Credit.` });
      try {
        const document = await extractQuizDocumentText({ userId: ctx.user.id, fileName: input.fileName, mimeType: input.mimeType, base64: input.base64 });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập ví Point." });
        const charged = await runWithAiPointCharge(db, { userId: ctx.user.id, code: "ai_question_generation", requestKey: `document:${ctx.user.id}:${Date.now()}` }, () => generateMultipleChoiceFromDocument({ text: document.text, count: input.questionCount, difficulty: input.difficulty }));
        const generated = charged.value;
        for (let index = 0; index < generated.length; index += 1) await recordAiUsage(ctx.user.id, "generate_question");
        const sourceTextLimit = 6_000;
        return {
          sourceName: document.sourceName,
          sourceUrl: document.sourceUrl,
          sourceText: document.text.slice(0, sourceTextLimit),
          sourceTextTruncated: document.text.length > sourceTextLimit,
          sourceCharacterCount: document.text.length,
          questions: generated,
          quota: { used: quota.used + generated.length, limit: quota.limit },
          pointCharge: charged.pointCharge,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Không thể đọc tài liệu để tạo câu hỏi." });
      }
    }),
    generateQuestionsFromRemoteSource: protectedProcedure.input(z.object({ url: z.string().trim().url().max(2_000), questionCount: z.number().int().min(1).max(20).default(5), difficulty: z.enum(["easy", "medium", "hard"]).default("medium") })).mutation(async ({ ctx, input }) => {
      await assertMembershipGroupPermission(ctx.user.id, "canUseAi", "tạo câu hỏi từ YouTube hoặc trang web");
      const quota = await assertQuotaAvailable(ctx.user.id, "aiCreditsPerMonth");
      if (quota.limit !== null && quota.used + input.questionCount > quota.limit) throw new TRPCError({ code: "FORBIDDEN", message: `Bạn cần ${input.questionCount} AI Credits nhưng chỉ còn ${Math.max(0, quota.limit - quota.used)} Credit.` });
      try {
        const source = await extractRemoteQuizSource(input.url);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập ví Point." });
        const charged = await runWithAiPointCharge(db, { userId: ctx.user.id, code: "ai_question_generation", requestKey: `remote:${ctx.user.id}:${Date.now()}` }, () => generateMultipleChoiceFromDocument({ text: source.text, count: input.questionCount, difficulty: input.difficulty }));
        const generated = charged.value;
        for (let index = 0; index < generated.length; index += 1) await recordAiUsage(ctx.user.id, "generate_question");
        if (db) await db.insert(quizSourceHistories).values({ userId: ctx.user.id, sourceUrl: source.sourceUrl, sourceName: source.sourceName, sourceType: source.sourceType, sourceCharacterCount: source.text.length, lastQuestionCount: input.questionCount, lastDifficulty: input.difficulty }).onDuplicateKeyUpdate({ set: { sourceName: source.sourceName, sourceType: source.sourceType, sourceCharacterCount: source.text.length, lastQuestionCount: input.questionCount, lastDifficulty: input.difficulty, useCount: sql`${quizSourceHistories.useCount} + 1`, lastUsedAt: new Date() } });
        const sourceTextLimit = 6_000;
        return { sourceName: source.sourceName, sourceUrl: source.sourceUrl, sourceType: source.sourceType, sourceText: source.text.slice(0, sourceTextLimit), sourceTextTruncated: source.text.length > sourceTextLimit, sourceCharacterCount: source.text.length, questions: generated, quota: { used: quota.used + generated.length, limit: quota.limit }, pointCharge: charged.pointCharge };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Không thể trích xuất nguồn để tạo câu hỏi." });
      }
    }),
    sourceHistory: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(quizSourceHistories).where(eq(quizSourceHistories.userId, ctx.user.id)).orderBy(desc(quizSourceHistories.lastUsedAt)).limit(8);
    }),
    importManualQuizFile: protectedProcedure.input(z.object({ fileName: z.string().min(1).max(160), mimeType: z.enum(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"]), base64: z.string().min(80).max(22_000_000) })).mutation(async ({ ctx, input }) => {
      await assertMembershipGroupPermission(ctx.user.id, "canCreateQuiz", "tạo Quiz");
      try {
        return await importManualQuizFile({ userId: ctx.user.id, ...input, ocrFallback: async dataUrl => {
          await assertMembershipGroupPermission(ctx.user.id, "canUseAi", "OCR PDF dạng ảnh");
          await assertQuotaAvailable(ctx.user.id, "aiCreditsPerMonth");
          const text = await ocrPdfWithVision(dataUrl);
          await recordAiUsage(ctx.user.id, "generate_question");
          return text;
        } });
      } catch (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Không thể nhập tệp vào Quiz thủ công." });
      }
    }),
  }),

  discussion: router({
    list: protectedProcedure.input(quizIdInput).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const completed = await db.select({ id: attempts.id }).from(attempts)
        .where(and(eq(attempts.userId, ctx.user.id), eq(attempts.quizId, input.quizId), eq(attempts.status, "submitted"))).limit(1);
      if (!completed.length) throw new TRPCError({ code: "FORBIDDEN", message: "Thảo luận được mở sau khi bạn hoàn thành bài." });
      return db.select({ post: discussionPosts, author: users.name }).from(discussionPosts)
        .innerJoin(users, eq(discussionPosts.userId, users.id)).where(and(eq(discussionPosts.quizId, input.quizId), eq(discussionPosts.status, "visible")))
        .orderBy(desc(discussionPosts.createdAt));
    }),
    create: protectedProcedure.input(z.object({ quizId: z.number().int().positive(), body: z.string().trim().min(3).max(1200) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const completed = await db.select({ id: attempts.id }).from(attempts)
          .where(and(eq(attempts.userId, ctx.user.id), eq(attempts.quizId, input.quizId), eq(attempts.status, "submitted"))).limit(1);
        if (!completed.length) throw new TRPCError({ code: "FORBIDDEN", message: "Hãy hoàn thành bài trước khi tham gia thảo luận." });
        await db.insert(discussionPosts).values({ quizId: input.quizId, userId: ctx.user.id, body: input.body });
        return { success: true };
      }),
  }),

  ai: router({
    explain: protectedProcedure.input(z.object({ question: z.string().trim().min(8).max(2000), context: z.string().trim().max(2000).optional() }))
      .mutation(async ({ ctx, input }) => {
        const quota = await assertQuotaAvailable(ctx.user.id, "aiCreditsPerMonth");
        await assertMembershipGroupPermission(ctx.user.id, "canUseAi", "dùng trợ lý AI");
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Bạn là trợ lý học tập Dshare. Trả lời bằng tiếng Việt, giải thích khái niệm ngắn gọn, có cấu trúc, không bịa nguồn tham khảo và khuyến khích người học tự kiểm chứng." },
            { role: "user", content: `Câu hỏi: ${input.question}\nNgữ cảnh: ${input.context ?? "Không có"}\nHãy đưa ra giải thích học thuật, gợi ý cách suy luận và 2 từ khóa để tự tìm tài liệu.` },
          ],
          maxTokens: 700,
        });
        await recordAiUsage(ctx.user.id, "explain");
        return { content: typeof response.choices[0]?.message.content === "string" ? response.choices[0].message.content : "Chưa thể tạo giải thích lúc này.", quota: { used: quota.used + 1, limit: quota.limit } };
      }),
    assist: protectedProcedure.input(z.object({ questionId: z.number().int().positive(), intent: z.enum(["explain", "resources", "follow_up"]), followUp: z.string().trim().min(3).max(600).optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập nội dung quiz lúc này." });
        const completedQuestion = await db.select({ question: questions }).from(questions)
          .innerJoin(attemptAnswers, eq(attemptAnswers.questionId, questions.id))
          .innerJoin(attempts, eq(attemptAnswers.attemptId, attempts.id))
          .where(and(eq(questions.id, input.questionId), eq(attempts.userId, ctx.user.id), eq(attempts.status, "submitted")))
          .limit(1);
        const question = completedQuestion[0]?.question;
        if (!question) throw new TRPCError({ code: "FORBIDDEN", message: "Trợ lý chỉ mở cho câu hỏi bạn đã hoàn thành." });
        const quota = await assertQuotaAvailable(ctx.user.id, "aiCreditsPerMonth");
        await assertMembershipGroupPermission(ctx.user.id, "canUseAi", "dùng trợ lý AI");
        const options = await db.select({ body: questionOptions.body, isCorrect: questionOptions.isCorrect }).from(questionOptions)
          .where(eq(questionOptions.questionId, question.id)).orderBy(questionOptions.sortOrder);
        const models = await listLLMModels();
        const model = models.data.find(candidate => candidate.id === "gpt-5-mini")?.id ?? models.data[0]?.id;
        const response = await invokeLLM({
          model,
          messages: buildQuizAssistantMessages({
            intent: input.intent as QuizAssistantIntent,
            prompt: question.prompt,
            explanation: question.explanation,
            options,
            followUp: input.followUp,
          }),
          maxTokens: 850,
        });
        const content = response.choices[0]?.message.content;
        await recordAiUsage(ctx.user.id, "assist");
        return { content: typeof content === "string" && content.trim() ? content : "Trợ lý chưa thể tạo phản hồi lúc này. Vui lòng thử lại sau.", intent: input.intent, quota: { used: quota.used + 1, limit: quota.limit } };
      }),
  }),

  reports: router({
    submit: protectedProcedure.input(z.object({ questionId: z.number().int().positive(), attemptId: z.number().int().positive().optional(), details: z.string().trim().min(10).max(2000) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        if (input.attemptId) {
          const ownedAttempt = await db.select({ id: attempts.id }).from(attempts)
            .where(and(eq(attempts.id, input.attemptId), eq(attempts.userId, ctx.user.id))).limit(1);
          if (!ownedAttempt.length) throw new TRPCError({ code: "FORBIDDEN", message: "Lượt làm bài không hợp lệ." });
        }
        const created = await db.insert(bugReports).values({ userId: ctx.user.id, questionId: input.questionId, attemptId: input.attemptId, details: input.details });
        await notifyOwner({ title: "Dshare Quiz: báo lỗi câu hỏi mới", content: `${ctx.user.name ?? "Một học viên"} vừa báo lỗi câu hỏi #${input.questionId}.` });
        return { success: true, reportId: Number(created[0].insertId) };
      }),
  }),

  branding: router({
    get: publicProcedure.query(async () => { const db = await getDb(); if (!db) return null; return (await db.select().from(brandSettings).limit(1))[0] ?? null; }),
    save: adminProcedure.input(z.object({ primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/), accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/), successColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/), attentionColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/), pageColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/), surfaceColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/), questionTabContentWidth: z.number().int().min(760).max(1440), settingsTabContentWidth: z.number().int().min(760).max(1440) })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const existing = (await db.select().from(brandSettings).limit(1))[0]; if (existing) await db.update(brandSettings).set(input).where(eq(brandSettings.id, existing.id)); else await db.insert(brandSettings).values(input); return input; }),
    saveAppearance: adminProcedure.input(z.object({ styleConfig: z.record(z.string(), z.unknown()) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể lưu Appearance." });
      const config = input.styleConfig as { colors?: Record<string, unknown>; studio?: Record<string, unknown> };
      const colors = config.colors ?? {};
      const studio = config.studio ?? {};
      const color = (key: string, fallback: string) => typeof colors[key] === "string" && /^#[0-9A-Fa-f]{6}$/.test(colors[key] as string) ? colors[key] as string : fallback;
      const width = (key: string, fallback: number) => typeof studio[key] === "number" && Number.isInteger(studio[key]) && studio[key] >= 760 && studio[key] <= 1440 ? studio[key] as number : fallback;
      const payload = { styleConfig: input.styleConfig, primaryColor: color("primary", "#565BE5"), accentColor: color("info", "#3762D2"), successColor: color("success", "#00845A"), attentionColor: color("danger", "#DC2626"), pageColor: color("body", "#F6F8FC"), surfaceColor: color("surface", "#FFFFFF"), questionTabContentWidth: width("questionsWidth", 1440), settingsTabContentWidth: width("settingsWidth", 1040) };
      const existing = (await db.select({ id: brandSettings.id }).from(brandSettings).limit(1))[0];
      if (existing) await db.update(brandSettings).set(payload).where(eq(brandSettings.id, existing.id)); else await db.insert(brandSettings).values(payload);
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "appearance.style_updated", entityType: "brand_settings", metadata: { sections: Object.keys(input.styleConfig) } });
      return { success: true, styleConfig: input.styleConfig };
    }),
  }),
  seo: router({
    publicSettings: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { googleAnalyticsMeasurementId: null };
      const settings = (await db.select({ googleAnalyticsMeasurementId: seoSettings.googleAnalyticsMeasurementId }).from(seoSettings).limit(1))[0];
      return { googleAnalyticsMeasurementId: settings?.googleAnalyticsMeasurementId ?? null };
    }),
  }),
  site: router({
    navigation: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select({ id: siteNavigationItems.id, label: siteNavigationItems.label, url: siteNavigationItems.url, position: siteNavigationItems.position }).from(siteNavigationItems).where(eq(siteNavigationItems.isEnabled, true)).orderBy(asc(siteNavigationItems.position));
    }),
    legalSupport: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return null;
      return (await db.select({ termsContent: siteSettings.termsContent, termsUpdatedAt: siteSettings.termsUpdatedAt, privacyContent: siteSettings.privacyContent, privacyUpdatedAt: siteSettings.privacyUpdatedAt, supportTitle: siteSettings.supportTitle, supportDescription: siteSettings.supportDescription, supportEmail: siteSettings.supportEmail, supportPhone: siteSettings.supportPhone, supportHours: siteSettings.supportHours, supportUpdatedAt: siteSettings.supportUpdatedAt }).from(siteSettings).limit(1))[0] ?? null;
    }),
    supportFaqs: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select({ id: supportFaqs.id, question: supportFaqs.question, answer: supportFaqs.answer, position: supportFaqs.position }).from(supportFaqs).where(eq(supportFaqs.isEnabled, true)).orderBy(asc(supportFaqs.position));
    }),
    submitContactMessage: publicProcedure.input(z.object({ name: z.string().trim().min(2).max(180), email: z.string().trim().email().max(320), subject: z.string().trim().max(320).nullable(), message: z.string().trim().min(20).max(5000) })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể gửi yêu cầu hỗ trợ." });
      const result = await db.insert(supportMessages).values({ name: input.name, email: input.email, subject: input.subject || null, message: input.message });
      return { success: true, id: result[0].insertId };
    }),
  }),
  admin: router({
    siteSettings: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập cài đặt hệ thống." });
      const [settings, navigation] = await Promise.all([
        db.select().from(siteSettings).limit(1),
        db.select().from(siteNavigationItems).orderBy(asc(siteNavigationItems.position)),
      ]);
      return {
        settings: settings[0] ?? { homePageUrl: "https://dsharequiz-jxleeaps.manus.space", boardTitle: "Dshare Quiz Online", metaDescription: "Nền tảng tạo Quiz, học tập và chia sẻ kiến thức trực tuyến.", defaultEmailAddress: null, updatedAt: null },
        navigation,
      };
    }),
    saveSiteSettings: adminProcedure.input(z.object({ homePageUrl: z.string().trim().url().max(1024), boardTitle: z.string().trim().min(2).max(180), metaDescription: z.string().trim().min(20).max(320), defaultEmailAddress: z.string().trim().email().max(320).nullable() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể lưu cài đặt hệ thống." });
      const payload = { ...input, defaultEmailAddress: input.defaultEmailAddress || null };
      const current = (await db.select({ id: siteSettings.id }).from(siteSettings).limit(1))[0];
      if (current) await db.update(siteSettings).set(payload).where(eq(siteSettings.id, current.id)); else await db.insert(siteSettings).values(payload);
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "site.settings_updated", entityType: "site_settings", metadata: { homePageUrl: payload.homePageUrl, boardTitle: payload.boardTitle } });
      return { success: true, ...payload };
    }),
    saveLegalContent: adminProcedure.input(z.object({ document: z.enum(["terms", "privacy"]), content: z.string().trim().min(40).max(20000) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể lưu nội dung pháp lý." });
      const cleanContent = sanitizeRichTextHtml(input.content);
      if (richTextToPlainText(cleanContent).length < 40) throw new TRPCError({ code: "BAD_REQUEST", message: "Nội dung pháp lý cần tối thiểu 40 ký tự." });
      const now = new Date();
      const payload = input.document === "terms" ? { termsContent: cleanContent, termsUpdatedAt: now } : { privacyContent: cleanContent, privacyUpdatedAt: now };
      const current = (await db.select({ id: siteSettings.id }).from(siteSettings).limit(1))[0];
      if (current) await db.update(siteSettings).set(payload).where(eq(siteSettings.id, current.id)); else await db.insert(siteSettings).values(payload);
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: `site.${input.document}_updated`, entityType: "site_settings", metadata: { length: richTextToPlainText(cleanContent).length } });
      return { success: true, updatedAt: now };
    }),
    saveSupportContent: adminProcedure.input(z.object({ title: z.string().trim().min(2).max(180), description: z.string().trim().min(20).max(5000), email: z.string().trim().email().max(320).nullable(), phone: z.string().trim().max(80).nullable(), hours: z.string().trim().max(320).nullable() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể lưu thông tin hỗ trợ." });
      const now = new Date();
      const payload = { supportTitle: input.title, supportDescription: input.description, supportEmail: input.email || null, supportPhone: input.phone || null, supportHours: input.hours || null, supportUpdatedAt: now };
      const current = (await db.select({ id: siteSettings.id }).from(siteSettings).limit(1))[0];
      if (current) await db.update(siteSettings).set(payload).where(eq(siteSettings.id, current.id)); else await db.insert(siteSettings).values(payload);
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "site.support_updated", entityType: "site_settings", metadata: { hasEmail: Boolean(payload.supportEmail), hasPhone: Boolean(payload.supportPhone) } });
      return { success: true, updatedAt: now };
    }),
    supportFaqs: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể tải FAQ." });
      return db.select().from(supportFaqs).orderBy(asc(supportFaqs.position), asc(supportFaqs.id));
    }),
    saveSupportFaq: adminProcedure.input(z.object({ id: z.number().int().positive().optional(), question: z.string().trim().min(5).max(500), answer: z.string().trim().min(10).max(5000), position: z.number().int().min(1).max(999), isEnabled: z.boolean() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể lưu FAQ." });
      const payload = { question: input.question, answer: input.answer, position: input.position, isEnabled: input.isEnabled };
      if (input.id) await db.update(supportFaqs).set(payload).where(eq(supportFaqs.id, input.id)); else await db.insert(supportFaqs).values(payload);
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: input.id ? "support.faq_updated" : "support.faq_created", entityType: "support_faq", entityId: input.id, metadata: { question: input.question } });
      return { success: true };
    }),
    deleteSupportFaq: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể xóa FAQ." });
      await db.delete(supportFaqs).where(eq(supportFaqs.id, input.id));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "support.faq_deleted", entityType: "support_faq", entityId: input.id, metadata: {} });
      return { success: true };
    }),
    reorderSupportFaqs: adminProcedure.input(z.object({ items: z.array(z.object({ id: z.number().int().positive(), position: z.number().int().min(1).max(999) })).min(1).max(50) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể sắp xếp FAQ." });
      await Promise.all(input.items.map(item => db.update(supportFaqs).set({ position: item.position }).where(eq(supportFaqs.id, item.id))));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "support.faq_reordered", entityType: "support_faq", metadata: { count: input.items.length } });
      return { success: true };
    }),
    supportMessages: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể tải hộp thư hỗ trợ." });
      return db.select().from(supportMessages).orderBy(desc(supportMessages.createdAt)).limit(50);
    }),
    updateSupportMessageStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["new", "read", "resolved"]) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể cập nhật tin nhắn." });
      await db.update(supportMessages).set({ status: input.status }).where(eq(supportMessages.id, input.id));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "support.message_status_updated", entityType: "support_message", entityId: input.id, metadata: { status: input.status } });
      return { success: true };
    }),
    saveNavigationItem: adminProcedure.input(z.object({ id: z.number().int().positive().optional(), label: z.string().trim().min(1).max(100), url: z.string().trim().min(1).max(1024).refine(value => value.startsWith("/") || /^https?:\/\//.test(value), "URL phải bắt đầu bằng / hoặc http(s)://"), position: z.number().int().min(1).max(999), isEnabled: z.boolean() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể lưu Navigation." });
      const payload = { label: input.label, url: input.url, position: input.position, isEnabled: input.isEnabled };
      if (input.id) await db.update(siteNavigationItems).set(payload).where(eq(siteNavigationItems.id, input.id)); else await db.insert(siteNavigationItems).values(payload);
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: input.id ? "site.navigation_updated" : "site.navigation_created", entityType: "site_navigation", entityId: input.id, metadata: payload });
      return { success: true };
    }),
    deleteNavigationItem: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể xóa mục Navigation." });
      await db.delete(siteNavigationItems).where(eq(siteNavigationItems.id, input.id));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "site.navigation_deleted", entityType: "site_navigation", entityId: input.id, metadata: {} });
      return { success: true };
    }),
    reorderNavigation: adminProcedure.input(z.object({ items: z.array(z.object({ id: z.number().int().positive(), position: z.number().int().min(1).max(999) })).min(1).max(50) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể sắp xếp Navigation." });
      await Promise.all(input.items.map(item => db.update(siteNavigationItems).set({ position: item.position }).where(eq(siteNavigationItems.id, item.id))));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "site.navigation_reordered", entityType: "site_navigation", metadata: { count: input.items.length } });
      return { success: true };
    }),
    learning: cpanelLearningRouter,
    seoSettings: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập cấu hình Google." });
      const settings = (await db.select().from(seoSettings).limit(1))[0];
      return settings ? { googleAnalyticsMeasurementId: settings.googleAnalyticsMeasurementId, googleSearchConsoleVerification: settings.googleSearchConsoleVerification, defaultQuizCoverUrl: settings.defaultQuizCoverUrl, updatedAt: settings.updatedAt } : { googleAnalyticsMeasurementId: null, googleSearchConsoleVerification: null, defaultQuizCoverUrl: null, updatedAt: null };
    }),
    saveSeoSettings: adminProcedure.input(z.object({ googleAnalyticsMeasurementId: z.string().trim().regex(/^G-[A-Z0-9]{6,20}$/).nullable(), googleSearchConsoleVerification: z.string().trim().min(8).max(255).nullable(), defaultQuizCoverUrl: z.string().url().max(1024).nullable() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể lưu cấu hình Google." });
      const payload = { googleAnalyticsMeasurementId: input.googleAnalyticsMeasurementId || null, googleSearchConsoleVerification: input.googleSearchConsoleVerification || null, defaultQuizCoverUrl: input.defaultQuizCoverUrl || null };
      const current = (await db.select().from(seoSettings).limit(1))[0];
      if (current) await db.update(seoSettings).set(payload).where(eq(seoSettings.id, current.id));
      else await db.insert(seoSettings).values(payload);
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "seo.google_settings_updated", entityType: "seo_settings", metadata: { analyticsConfigured: Boolean(payload.googleAnalyticsMeasurementId), searchConsoleConfigured: Boolean(payload.googleSearchConsoleVerification), defaultCoverConfigured: Boolean(payload.defaultQuizCoverUrl) } });
      return { success: true, ...payload };
    }),
    oauthSettings: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập cấu hình OAuth." });
      const google = (await db.select().from(oauthProviderSettings).where(eq(oauthProviderSettings.provider, "google")).limit(1))[0];
      return { googleClientId: google?.clientId ?? null, googleEnabled: google?.isEnabled ?? false, hasGoogleClientSecret: Boolean(google?.clientSecretCiphertext), updatedAt: google?.updatedAt ?? null };
    }),
    saveGoogleOAuthSettings: adminProcedure.input(z.object({ googleClientId: z.string().trim().max(320).nullable(), googleClientSecret: z.string().trim().max(2048).optional(), googleEnabled: z.boolean() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể lưu cấu hình OAuth." });
      const current = (await db.select().from(oauthProviderSettings).where(eq(oauthProviderSettings.provider, "google")).limit(1))[0];
      const clientId = input.googleClientId || null;
      const clientSecretCiphertext = input.googleClientSecret ? encryptEmailApiKey(input.googleClientSecret) : current?.clientSecretCiphertext ?? null;
      if (input.googleEnabled && (!clientId || !clientSecretCiphertext)) throw new TRPCError({ code: "BAD_REQUEST", message: "Cần Client ID và Client Secret trước khi bật Google OAuth." });
      const payload = { provider: "google", clientId, clientSecretCiphertext, isEnabled: input.googleEnabled };
      if (current) await db.update(oauthProviderSettings).set(payload).where(eq(oauthProviderSettings.id, current.id)); else await db.insert(oauthProviderSettings).values(payload);
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "auth.google_oauth_settings_updated", entityType: "oauth_provider_settings", entityId: current?.id ?? null, metadata: { configured: Boolean(clientId && clientSecretCiphertext), enabled: input.googleEnabled } });
      return { success: true, googleClientId: clientId, googleEnabled: input.googleEnabled, hasGoogleClientSecret: Boolean(clientSecretCiphertext) };
    }),
    emailDeliverySettings: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập cấu hình email." });
      const settings = (await db.select().from(emailDeliverySettings).limit(1))[0];
      return settings ? { provider: settings.provider, fromEmail: settings.fromEmail, isEnabled: settings.isEnabled, hasApiKey: Boolean(settings.apiKeyCiphertext), updatedAt: settings.updatedAt } : { provider: "resend" as const, fromEmail: null, isEnabled: false, hasApiKey: false, updatedAt: null };
    }),
    saveEmailDeliverySettings: adminProcedure.input(emailDeliverySettingsInput).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể lưu cấu hình email." });
      const current = (await db.select().from(emailDeliverySettings).limit(1))[0];
      if (input.isEnabled && (!input.fromEmail || !(input.apiKey || current?.apiKeyCiphertext))) throw new TRPCError({ code: "BAD_REQUEST", message: "Cần nhập địa chỉ gửi và khóa API trước khi bật gửi email." });
      const payload = { provider: input.provider, fromEmail: input.fromEmail ?? null, isEnabled: input.isEnabled, ...(input.apiKey ? { apiKeyCiphertext: encryptEmailApiKey(input.apiKey) } : {}) };
      if (current) await db.update(emailDeliverySettings).set(payload).where(eq(emailDeliverySettings.id, current.id));
      else await db.insert(emailDeliverySettings).values(payload);
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "email_delivery.settings_updated", entityType: "email_delivery_settings", metadata: { provider: input.provider, fromEmail: input.fromEmail ?? null, isEnabled: input.isEnabled, apiKeyUpdated: Boolean(input.apiKey) } });
      return { success: true, hasApiKey: Boolean(input.apiKey || current?.apiKeyCiphertext) };
    }),
    sendTestEmail: adminProcedure.input(z.object({ recipient: z.string().trim().email().max(320) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập cấu hình email." });
      const settings = (await db.select().from(emailDeliverySettings).limit(1))[0];
      if (!settings?.apiKeyCiphertext || !settings.fromEmail) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Hãy lưu API email và địa chỉ gửi trước khi gửi thử." });
      try {
        const result = await sendTestEmail(settings, input.recipient);
        if (!result.sent) throw new Error("Chưa thể gửi email thử.");
        await db.insert(paymentEmailDeliveries).values({ paymentRecordId: null, recipient: input.recipient, kind: "test", status: "sent", subject: result.subject, providerMessageId: result.providerMessageId });
        await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "email_delivery.test_sent", entityType: "email_delivery", metadata: { recipient: input.recipient } });
        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Không thể gửi email thử.";
        await db.insert(paymentEmailDeliveries).values({ paymentRecordId: null, recipient: input.recipient, kind: "test", status: "failed", subject: "Email thử nghiệm · Dshare Quiz Online", errorMessage: message });
        throw new TRPCError({ code: "BAD_GATEWAY", message });
      }
    }),
    overview: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { users: 0, quizzes: 0, submitted: 0, pendingReports: 0 };
      const [userStat, quizStat, attemptStat, reportStat] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(users),
        db.select({ count: sql<number>`count(*)` }).from(quizzes),
        db.select({ count: sql<number>`count(*)` }).from(attempts).where(eq(attempts.status, "submitted")),
        db.select({ count: sql<number>`count(*)` }).from(bugReports).where(eq(bugReports.status, "pending")),
      ]);
      return { users: Number(userStat[0]?.count ?? 0), quizzes: Number(quizStat[0]?.count ?? 0), submitted: Number(attemptStat[0]?.count ?? 0), pendingReports: Number(reportStat[0]?.count ?? 0) };
    }),
    contentTree: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { categories: [], subjects: [], lessons: [], quizzes: [] };
      const [categoryRows, subjectRows, lessonRows, quizRows] = await Promise.all([
        db.select().from(categories).orderBy(categories.sortOrder),
        db.select().from(subjects).orderBy(subjects.sortOrder),
        db.select().from(lessons).orderBy(lessons.sortOrder),
        db.select().from(quizzes).orderBy(desc(quizzes.updatedAt)),
      ]);
      return { categories: categoryRows, subjects: subjectRows, lessons: lessonRows, quizzes: quizRows };
    }),
    uploadCategoryCover: adminProcedure.input(z.object({ fileName: z.string().min(1).max(160), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), base64: z.string().min(20).max(8_000_000) })).mutation(async ({ ctx, input }) => {
      const bytes = Buffer.from(input.base64.split(",").pop() ?? "", "base64");
      const uploaded = await storagePut(`category-covers/${ctx.user.id}/${input.fileName}`, bytes, input.mimeType);
      return { url: uploaded.url };
    }),
    uploadSeoDefaultCover: adminProcedure.input(z.object({ fileName: z.string().min(1).max(160), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), base64: z.string().min(20).max(8_000_000) })).mutation(async ({ ctx, input }) => {
      const bytes = Buffer.from(input.base64.split(",").pop() ?? "", "base64");
      const uploaded = await storagePut(`seo-default-covers/${ctx.user.id}/${input.fileName}`, bytes, input.mimeType);
      return { url: uploaded.url };
    }),
    uploadAppearanceAsset: adminProcedure.input(z.object({ kind: z.enum(["logo", "favicon", "avatar", "thumbnail", "cover", "open-graph", "not-found", "empty-state"]), fileName: z.string().min(1).max(160), mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/x-icon"]), base64: z.string().min(20).max(8_000_000) })).mutation(async ({ ctx, input }) => {
      const bytes = Buffer.from(input.base64.split(",").pop() ?? "", "base64");
      const uploaded = await storagePut(`appearance/${input.kind}/${ctx.user.id}/${input.fileName}`, bytes, input.mimeType);
      return { url: uploaded.url };
    }),
    updateCategoryCover: adminProcedure.input(z.object({ categoryId: z.number().int().positive(), coverImageUrl: z.string().url().max(1024).nullable() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể cập nhật ảnh chủ đề." });
      const category = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, input.categoryId)).limit(1);
      if (!category.length) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy chủ đề." });
      await db.update(categories).set({ coverImageUrl: input.coverImageUrl }).where(eq(categories.id, input.categoryId));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "category.cover_updated", entityType: "category", entityId: input.categoryId, metadata: { coverImageUrl: input.coverImageUrl } });
      return { success: true, coverImageUrl: input.coverImageUrl };
    }),
    liveMonitoring: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { active: [], recent: [], refreshedAt: new Date() };
      const since = new Date(Date.now() - 60 * 60 * 1000);
      const rows = await db.select({ attempt: attempts, learnerName: users.name, learnerEmail: users.email, quizTitle: quizzes.title })
        .from(attempts).innerJoin(users, eq(attempts.userId, users.id)).innerJoin(quizzes, eq(attempts.quizId, quizzes.id))
        .where(sql`${attempts.startedAt} >= ${since}`).orderBy(desc(attempts.startedAt)).limit(50);
      return { active: rows.filter(row => row.attempt.status === "in_progress"), recent: rows.filter(row => row.attempt.status !== "in_progress").slice(0, 20), refreshedAt: new Date() };
    }),
    generateQuestionAI: adminProcedure.input(aiQuestionInputSchema).mutation(async ({ ctx, input }) => {
      const quota = await assertQuotaAvailable(ctx.user.id, "aiCreditsPerMonth");
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "Bạn là chuyên gia biên soạn câu hỏi học thuật bằng tiếng Việt. Chỉ trả về JSON hợp lệ, không thêm markdown. Không dùng nội dung có bản quyền dài hoặc thông tin bịa đặt." },
          { role: "user", content: `Tạo đúng một câu hỏi loại ${input.type}, độ khó ${input.difficulty}, về chủ đề: ${input.topic}. Ngữ cảnh: ${input.context ?? "Không có"}. Trả JSON có prompt, explanation, options (mỗi phần tử body/isCorrect) và answerConfig. Với fill_blank, answerConfig.acceptedAnswers là mảng chuỗi; với matching, answerConfig.pairs là mảng {left,right}; với true_false, options phải là Đúng/Sai.` },
        ],
        maxTokens: 1200,
        response_format: { type: "json_schema", json_schema: { name: "question_draft", strict: true, schema: { type: "object", properties: { prompt: { type: "string" }, explanation: { type: "string" }, options: { type: "array", items: { type: "object", properties: { body: { type: "string" }, isCorrect: { type: "boolean" } }, required: ["body", "isCorrect"], additionalProperties: false } }, answerConfig: { type: "object", additionalProperties: true } }, required: ["prompt", "explanation", "options", "answerConfig"], additionalProperties: false } } },
      });
      try {
        const draft = parseAiQuestionDraft(response.choices[0]?.message.content, input.type);
        await recordAiUsage(ctx.user.id, "generate_question");
        return { ...input, ...draft, quota: { used: quota.used + 1, limit: quota.limit } };
      } catch (error) {
        throw new TRPCError({ code: "BAD_GATEWAY", message: error instanceof Error ? `AI tạo bản nháp không hợp lệ: ${error.message}` : "AI tạo bản nháp không hợp lệ." });
      }
    }),
    saveQuiz: adminProcedure.input(z.object({ id: z.number().int().positive().optional(), lessonId: z.number().int().positive(), title: z.string().trim().min(4).max(220), slug: z.string().trim().regex(/^[a-z0-9-]+$/), mode: z.enum(["training", "testing"]), accessTier: z.enum(["basic", "pro", "premium"]), durationSeconds: z.number().int().min(60).max(14400), passingScore: z.number().int().min(0).max(100), entryPointCost: z.number().int().min(0), completionReward: z.number().int().min(0), isPublished: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const data = { lessonId: input.lessonId, title: input.title, slug: input.slug, mode: input.mode, accessTier: input.accessTier, durationSeconds: input.durationSeconds, passingScore: input.passingScore, entryPointCost: input.entryPointCost, completionReward: input.completionReward, isPublished: input.isPublished };
        if (input.id) await db.update(quizzes).set(data).where(eq(quizzes.id, input.id));
        else {
          await assertQuotaAvailable(ctx.user.id, "quizzesPerMonth");
          await db.insert(quizzes).values({ ...data, creatorUserId: ctx.user.id });
        }
        await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: input.id ? "quiz.updated" : "quiz.created", entityType: "quiz", entityId: input.id, metadata: { title: input.title } });
        return { success: true };
      }),
    generateRandomQuiz: adminProcedure.input(z.object({
      lessonId: z.number().int().positive(),
      title: z.string().trim().min(4).max(220),
      slug: z.string().trim().regex(/^[a-z0-9-]+$/),
      mode: z.enum(["training", "testing"]),
      questionCount: z.number().int().min(5).max(200),
      easyRatio: z.number().min(0).max(1),
      mediumRatio: z.number().min(0).max(1),
      hardRatio: z.number().min(0).max(1),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertQuotaAvailable(ctx.user.id, "quizzesPerMonth");
      const ratioSum = input.easyRatio + input.mediumRatio + input.hardRatio;
      if (Math.abs(ratioSum - 1) > 0.001) throw new TRPCError({ code: "BAD_REQUEST", message: "Tổng tỷ lệ độ khó phải bằng 100%." });
      const pool = await db.select().from(questions).where(and(eq(questions.lessonId, input.lessonId), eq(questions.isActive, true)));
      const wanted = allocateQuestionCounts(input.questionCount, { easy: input.easyRatio, medium: input.mediumRatio, hard: input.hardRatio });
      const selected = (["easy", "medium", "hard"] as const).flatMap(difficulty => shuffledForAttempt(pool.filter(question => question.difficulty === difficulty), Date.now() + difficulty.length).slice(0, wanted[difficulty]));
      if (selected.length < input.questionCount) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Ngân hàng chưa đủ câu hỏi theo tỷ lệ đã chọn (có ${selected.length}/${input.questionCount} câu).` });
      const created = await db.insert(quizzes).values({ lessonId: input.lessonId, creatorUserId: ctx.user.id, title: input.title, slug: input.slug, mode: input.mode, difficulty: "medium", durationSeconds: input.questionCount * 60, passingScore: 70, entryPointCost: input.mode === "testing" ? 20 : 0, completionReward: input.mode === "testing" ? 40 : 0, questionCount: input.questionCount, randomizeQuestions: true, randomizeOptions: true, isPublished: false });
      const quizId = Number(created[0].insertId);
      await db.insert(quizQuestions).values(selected.map((question, sortOrder) => ({ quizId, questionId: question.id, points: 1, sortOrder })));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "quiz.generated", entityType: "quiz", entityId: quizId, metadata: { questionCount: input.questionCount, ratios: { easy: input.easyRatio, medium: input.mediumRatio, hard: input.hardRatio } } });
      return { success: true, quizId, selectedCount: selected.length };
    }),
    removeQuiz: adminProcedure.input(quizIdInput).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(quizzes).where(eq(quizzes.id, input.quizId));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "quiz.deleted", entityType: "quiz", entityId: input.quizId });
      return { success: true };
    }),
    listQuestions: adminProcedure.input(z.object({ lessonId: z.number().int().positive().optional() }).optional()).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(questions).where(input?.lessonId ? eq(questions.lessonId, input.lessonId) : undefined).orderBy(desc(questions.updatedAt));
      if (!rows.length) return [];
      const options = await db.select().from(questionOptions).where(sql`${questionOptions.questionId} in (${sql.join(rows.map(row => sql`${row.id}`), sql`, `)})`).orderBy(questionOptions.sortOrder);
      return rows.map(question => ({ ...question, options: options.filter(option => option.questionId === question.id) }));
    }),
    saveQuestion: adminProcedure.input(z.object({
      id: z.number().int().positive().optional(),
      lessonId: z.number().int().positive(),
      quizId: z.number().int().positive().optional(),
      prompt: z.string().trim().min(8).max(5000),
      type: z.enum(["single", "multiple", "true_false", "true_false_statements", "fill_blank", "image", "matching", "essay"]),
      difficulty: z.enum(["easy", "medium", "hard"]),
      explanation: z.string().trim().max(5000).optional(),
      tags: z.array(z.string().trim().min(1).max(40)).min(1).max(12),
      answerConfig: z.record(z.string(), z.unknown()).optional(),
      imageUrl: z.string().url().max(1024).optional().or(z.literal("")),
      options: z.array(z.object({ body: z.string().trim().min(1).max(2000), isCorrect: z.boolean() })).max(10),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const validationError = validateQuestionConfiguration(input);
      if (validationError) throw new TRPCError({ code: "BAD_REQUEST", message: validationError });
      const questionData = { lessonId: input.lessonId, prompt: input.prompt, type: input.type, difficulty: input.difficulty, explanation: input.explanation || null, tags: input.tags, answerConfig: input.answerConfig, imageUrl: input.imageUrl || null };
      let questionId = input.id;
      if (questionId) {
        await db.update(questions).set(questionData).where(eq(questions.id, questionId));
        await db.delete(questionOptions).where(eq(questionOptions.questionId, questionId));
      } else {
        const created = await db.insert(questions).values(questionData);
        questionId = Number(created[0].insertId);
      }
      if (input.options.length) await db.insert(questionOptions).values(input.options.map((option, sortOrder) => ({ questionId: questionId!, body: option.body, isCorrect: option.isCorrect, sortOrder })));
      if (input.quizId) await db.insert(quizQuestions).values({ quizId: input.quizId, questionId: questionId!, points: 1, sortOrder: 0 }).onDuplicateKeyUpdate({ set: { questionId: questionId! } });
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: input.id ? "question.updated" : "question.created", entityType: "question", entityId: questionId, metadata: { prompt: input.prompt.slice(0, 160) } });
      return { success: true, questionId };
    }),
    exportQuestions: adminProcedure.input(z.object({ lessonId: z.number().int().positive().optional() }).optional()).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { filename: "dshare-question-bank.csv", csv: "" };
      const rows = await db.select().from(questions).where(input?.lessonId ? eq(questions.lessonId, input.lessonId) : undefined).orderBy(desc(questions.updatedAt));
      const options = rows.length ? await db.select().from(questionOptions).where(sql`${questionOptions.questionId} in (${sql.join(rows.map(row => sql`${row.id}`), sql`, `)})`).orderBy(questionOptions.sortOrder) : [];
      const header = ["lessonId", "prompt", "type", "difficulty", "tags", "explanation", "imageUrl", "answerConfig", "options"].join(",");
      const lines = rows.map(question => [question.lessonId, question.prompt, question.type, question.difficulty, JSON.stringify(question.tags), question.explanation, question.imageUrl, JSON.stringify(question.answerConfig ?? {}), JSON.stringify(options.filter(option => option.questionId === question.id).map(option => ({ body: option.body, isCorrect: option.isCorrect })))].map(csvEscape).join(","));
      return { filename: `dshare-question-bank-${new Date().toISOString().slice(0, 10)}.csv`, csv: [header, ...lines].join("\n") };
    }),
    importQuestions: adminProcedure.input(z.object({ csv: z.string().min(20).max(2_000_000) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [header, ...rows] = parseCsv(input.csv);
      const columns = header.map(column => column.trim());
      const required = ["lessonId", "prompt", "type", "difficulty", "tags", "options"];
      if (required.some(column => !columns.includes(column))) throw new TRPCError({ code: "BAD_REQUEST", message: "CSV thiếu cột bắt buộc. Hãy export mẫu để dùng đúng định dạng." });
      let created = 0; const errors: Array<{ row: number; message: string }> = [];
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        try {
          const data = Object.fromEntries(columns.map((column, columnIndex) => [column, row[columnIndex] ?? ""]));
          const lessonId = Number(data.lessonId); const type = data.type as "single" | "multiple" | "true_false" | "fill_blank" | "image" | "matching"; const difficulty = data.difficulty as "easy" | "medium" | "hard";
          if (!Number.isInteger(lessonId) || !["single", "multiple", "true_false", "fill_blank", "image", "matching"].includes(type) || !["easy", "medium", "hard"].includes(difficulty)) throw new Error("lessonId, type hoặc difficulty không hợp lệ");
          const tags = JSON.parse(data.tags || "[]") as string[]; const importedOptions = JSON.parse(data.options || "[]") as Array<{ body: string; isCorrect: boolean }>;
          const answerConfig = JSON.parse(data.answerConfig || "{}") as Record<string, unknown>;
          if (!Array.isArray(tags) || !tags.length || !Array.isArray(importedOptions)) throw new Error("tags hoặc options không hợp lệ");
          const validationError = validateQuestionConfiguration({ type, options: importedOptions, answerConfig, imageUrl: data.imageUrl || null });
          if (validationError) throw new Error(validationError);
          const createdQuestion = await db.insert(questions).values({ lessonId, prompt: data.prompt, type, difficulty, tags, explanation: data.explanation || null, imageUrl: data.imageUrl || null, answerConfig });
          const questionId = Number(createdQuestion[0].insertId);
          await db.insert(questionOptions).values(importedOptions.map((option, sortOrder) => ({ questionId, body: option.body, isCorrect: option.isCorrect, sortOrder })));
          created += 1;
        } catch (error) { errors.push({ row: index + 2, message: error instanceof Error ? error.message : "Dữ liệu không hợp lệ" }); }
      }
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "question.imported", entityType: "question_bank", metadata: { created, failed: errors.length } });
      return { created, failed: errors.length, errors: errors.slice(0, 50) };
    }),
    removeQuestion: adminProcedure.input(z.object({ questionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(quizQuestions).where(eq(quizQuestions.questionId, input.questionId));
      await db.delete(questionOptions).where(eq(questionOptions.questionId, input.questionId));
      await db.delete(questions).where(eq(questions.id, input.questionId));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "question.deleted", entityType: "question", entityId: input.questionId });
      return { success: true };
    }),
    reports: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select({ report: bugReports, reporter: users.name, prompt: questions.prompt })
        .from(bugReports).innerJoin(users, eq(bugReports.userId, users.id)).innerJoin(questions, eq(bugReports.questionId, questions.id))
        .orderBy(desc(bugReports.createdAt)).limit(50);
    }),
    reviewReport: adminProcedure.input(z.object({ reportId: z.number().int().positive(), approved: z.boolean(), moderatorNote: z.string().trim().max(1000).optional(), rewardPoints: z.number().int().min(0).max(100000).default(0) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const rows = await db.select().from(bugReports).where(eq(bugReports.id, input.reportId)).limit(1);
        const report = rows[0];
        if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy báo cáo." });
        if (report.status !== "pending") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Báo cáo này đã được duyệt trước đó." });
        const rewardPoints = input.approved ? input.rewardPoints : 0;
        await db.update(bugReports).set({ status: input.approved ? "approved" : "rejected", moderatorNote: input.moderatorNote || null, rewardPoints, reviewedAt: new Date() }).where(eq(bugReports.id, report.id));
        if (input.approved && rewardPoints > 0) {
          const profile = await ensureLearnerProfile(report.userId);
          if (profile) {
            const balanceAfter = profile.pointBalance + rewardPoints;
            await db.update(learnerProfiles).set({ pointBalance: balanceAfter }).where(eq(learnerProfiles.id, profile.id));
            await db.insert(walletTransactions).values({ userId: report.userId, type: "report_reward", amount: rewardPoints, balanceAfter, description: `Bồi hoàn báo lỗi câu hỏi #${report.questionId}`, referenceType: "bug_report", referenceId: report.id });
          }
        }
        await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: input.approved ? "report.approved" : "report.rejected", entityType: "bug_report", entityId: report.id, metadata: { rewardPoints } });
        return { success: true };
      }),
    users: adminProcedure.input(z.object({ search: z.string().trim().max(120).optional(), tier: z.enum(["basic", "pro", "premium"]).optional(), status: z.enum(["active", "suspended", "banned", "deactivated"]).optional(), page: z.number().int().min(1).default(1), pageSize: z.number().int().min(5).max(50).default(12) }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { items: [], total: 0, page: 1, pageSize: input?.pageSize ?? 12, totalPages: 0 };
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 12;
        const where = and(
          input?.tier ? eq(learnerProfiles.tier, input.tier) : undefined,
          input?.status ? eq(users.accountStatus, input.status) : undefined,
          input?.search ? sql`(lower(coalesce(${users.name}, '')) like ${`%${input.search.toLowerCase()}%`} or lower(coalesce(${users.email}, '')) like ${`%${input.search.toLowerCase()}%`})` : undefined,
        );
        const rows = await db.select({ user: users, profile: learnerProfiles })
          .from(users).leftJoin(learnerProfiles, eq(users.id, learnerProfiles.userId))
          .where(where).orderBy(desc(users.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
        const totalRow = await db.select({ total: sql<number>`count(*)` }).from(users).leftJoin(learnerProfiles, eq(users.id, learnerProfiles.userId)).where(where);
        const counts = await db.select({ userId: attempts.userId, completed: sql<number>`count(*)` })
          .from(attempts).where(eq(attempts.status, "submitted")).groupBy(attempts.userId);
        const countByUser = new Map(counts.map(row => [row.userId, Number(row.completed)]));
        const total = Number(totalRow[0]?.total ?? 0);
        return { items: rows.map(row => ({ ...row, completedCount: countByUser.get(row.user.id) ?? 0 })), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
    userDetail: adminProcedure.input(z.object({ userId: z.number().int().positive() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập người dùng." });
      const account = (await db.select({ user: users, profile: learnerProfiles }).from(users).leftJoin(learnerProfiles, eq(users.id, learnerProfiles.userId)).where(eq(users.id, input.userId)).limit(1))[0];
      if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy người dùng." });
      const [activity, recentAttempts, recentTransactions, paymentOrders, emailDeliveries, memberships] = await Promise.all([
        db.select().from(auditLogs).where(and(eq(auditLogs.entityType, "user"), eq(auditLogs.entityId, input.userId))).orderBy(desc(auditLogs.createdAt)).limit(12),
        db.select({ attempt: attempts, quizTitle: quizzes.title }).from(attempts).leftJoin(quizzes, eq(attempts.quizId, quizzes.id)).where(eq(attempts.userId, input.userId)).orderBy(desc(attempts.startedAt)).limit(8),
        db.select().from(walletTransactions).where(eq(walletTransactions.userId, input.userId)).orderBy(desc(walletTransactions.createdAt)).limit(8),
        db.select().from(paymentRecords).where(eq(paymentRecords.userId, input.userId)).orderBy(desc(paymentRecords.createdAt)).limit(12),
        db.select().from(paymentEmailDeliveries).orderBy(desc(paymentEmailDeliveries.createdAt)).limit(60),
        db.select({ membership: userGroupMembers, group: userGroups, plan: subscriptionPlans }).from(userGroupMembers).innerJoin(userGroups, eq(userGroupMembers.groupId, userGroups.id)).leftJoin(subscriptionPlans, eq(userGroups.planId, subscriptionPlans.id)).where(eq(userGroupMembers.userId, input.userId)).limit(1),
      ]);
      const membership = memberships[0] ?? null;
      const permissionRows = membership ? await db.select().from(userGroupPermissions).where(eq(userGroupPermissions.groupId, membership.group.id)) : [];
      const effectivePermissions = permissionRows.map(permission => ({ permissionKey: permission.permissionKey, isAllowed: permission.isAllowed }));
      const emailsByPayment = new Map<number, typeof emailDeliveries>();
      emailDeliveries.forEach(delivery => { if (delivery.paymentRecordId) emailsByPayment.set(delivery.paymentRecordId, [...(emailsByPayment.get(delivery.paymentRecordId) ?? []), delivery]); });
      return { ...account, activity, recentAttempts, recentTransactions, membership, effectivePermissions, paymentOrders: paymentOrders.map(order => ({ order, emailDeliveries: emailsByPayment.get(order.id) ?? [] })) };
    }),
    bulkUpdateUsers: adminProcedure.input(z.object({ userIds: z.array(z.number().int().positive()).min(1).max(50), tier: z.enum(["basic", "pro", "premium"]).optional(), isBanned: z.boolean().optional() }).refine(input => input.tier !== undefined || input.isBanned !== undefined, { message: "Cần chọn thay đổi hạng hoặc trạng thái." }))
      .mutation(async ({ ctx, input }) => {
        const uniqueUserIds = Array.from(new Set(input.userIds));
        if (uniqueUserIds.includes(ctx.user.id)) throw new TRPCError({ code: "BAD_REQUEST", message: "Không thể thay đổi hàng loạt tài khoản quản trị đang sử dụng." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể cập nhật người dùng." });
        for (const userId of uniqueUserIds) {
          const profile = await ensureLearnerProfile(userId);
          if (!profile) continue;
          await db.update(learnerProfiles).set({ ...(input.tier ? { tier: input.tier } : {}), ...(input.isBanned !== undefined ? { isBanned: input.isBanned } : {}) }).where(eq(learnerProfiles.id, profile.id));
          if (input.tier) await createInAppNotification(db, { userId, type: "account_plan", title: "Gói tài khoản đã được cập nhật", body: `Quản trị viên đã cập nhật gói tài khoản của bạn thành ${input.tier.toUpperCase()}.`, href: "/ho-so", metadata: { tier: input.tier, source: "bulk" } });
        }
        await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "users.bulk_updated", entityType: "user_batch", metadata: { userIds: uniqueUserIds, tier: input.tier, isBanned: input.isBanned } });
        return { success: true, updatedCount: uniqueUserIds.length };
      }),
    groupPermissions: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const [groups, counts] = await Promise.all([
        getMembershipGroupPermissions(),
        db.select({ tier: learnerProfiles.tier, count: sql<number>`count(*)` }).from(learnerProfiles).groupBy(learnerProfiles.tier),
      ]);
      const countByTier = new Map(counts.map(item => [item.tier, Number(item.count)]));
      return defaultMembershipGroupPermissions.map(defaultGroup => {
        const group = groups.find(item => item.tier === defaultGroup.tier) ?? defaultGroup;
        return { ...group, memberCount: countByTier.get(defaultGroup.tier) ?? 0 };
      });
    }),
    saveGroupPermissions: adminProcedure.input(membershipGroupPermissionInput).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể lưu quyền nhóm." });
      await getMembershipGroupPermissions();
      await db.update(membershipGroupPermissions).set({ ...input, updatedAt: new Date() }).where(eq(membershipGroupPermissions.tier, input.tier));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "membership_group.permissions_updated", entityType: "membership_group", metadata: { tier: input.tier, permissions: Object.fromEntries(membershipPermissionKeys.map(permission => [permission, input[permission]])) } });
      return { success: true };
    }),
    membershipManagement: adminProcedure.query(async () => {
      const db = await ensureMembershipManagementDefaults();
      const [plans, groups, permissions, memberships, membershipCounts] = await Promise.all([
        db.select().from(subscriptionPlans).orderBy(desc(subscriptionPlans.isSystem), asc(subscriptionPlans.displayOrder), subscriptionPlans.name),
        db.select().from(userGroups).orderBy(desc(userGroups.isSystem), asc(userGroups.displayOrder), userGroups.name),
        db.select().from(userGroupPermissions),
        db.select({ membership: userGroupMembers, user: users, profile: learnerProfiles }).from(userGroupMembers).innerJoin(users, eq(userGroupMembers.userId, users.id)).leftJoin(learnerProfiles, eq(learnerProfiles.userId, users.id)).orderBy(desc(userGroupMembers.updatedAt)),
        db.select({ groupId: userGroupMembers.groupId, count: sql<number>`count(*)` }).from(userGroupMembers).groupBy(userGroupMembers.groupId),
      ]);
      const countByGroup = new Map(membershipCounts.map(item => [item.groupId, Number(item.count)]));
      const permissionCatalog = Array.from(new Set([...membershipPermissionKeys, ...permissions.map(permission => permission.permissionKey)]));
      return {
        plans,
        permissionCatalog,
        groups: groups.map(group => ({ ...group, memberCount: countByGroup.get(group.id) ?? 0, permissions: permissionCatalog.map(permissionKey => ({ permissionKey, isAllowed: permissions.find(item => item.groupId === group.id && item.permissionKey === permissionKey)?.isAllowed ?? false })) })),
        memberships,
      };
    }),
    saveSubscriptionPlan: adminProcedure.input(subscriptionPlanInput).mutation(async ({ ctx, input }) => {
      const db = await ensureMembershipManagementDefaults();
      const existing = input.id ? (await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, input.id)).limit(1))[0] : undefined;
      if (input.id && !existing) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy gói đăng ký." });
      if (input.promoPrice !== null && input.promoPrice !== undefined && input.promoPrice > input.monthlyPrice) throw new TRPCError({ code: "BAD_REQUEST", message: "Giá khuyến mãi không được lớn hơn giá gốc." });
      const data = { code: input.code, name: input.name, tier: input.tier, description: input.description ?? null, benefits: input.benefits, monthlyPrice: input.monthlyPrice, promoPrice: input.promoPrice ?? null, payosEnabled: input.payosEnabled, payosRewardPoints: input.payosRewardPoints, membershipMonths: input.membershipMonths, displayOrder: input.displayOrder, isActive: input.isActive };
      if (existing) await db.update(subscriptionPlans).set(data).where(eq(subscriptionPlans.id, existing.id));
      else {
        const result = await db.insert(subscriptionPlans).values({ ...data, isSystem: false });
        const planId = Number(result[0].insertId);
        await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "subscription_plan.created", entityType: "subscription_plan", entityId: planId, metadata: { code: input.code, tier: input.tier } });
        return { success: true, planId };
      }
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: existing ? "subscription_plan.updated" : "subscription_plan.created", entityType: "subscription_plan", entityId: existing?.id, metadata: { code: input.code, tier: input.tier } });
      return { success: true, planId: existing.id };
    }),
    deleteSubscriptionPlan: adminProcedure.input(z.object({ planId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await ensureMembershipManagementDefaults();
      const plan = (await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, input.planId)).limit(1))[0];
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy gói đăng ký." });
      const groups = await db.select({ id: userGroups.id }).from(userGroups).where(eq(userGroups.planId, plan.id));
      await db.update(userGroups).set({ planId: null }).where(eq(userGroups.planId, plan.id));
      await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, plan.id));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "subscription_plan.deleted", entityType: "subscription_plan", entityId: plan.id, metadata: { code: plan.code, unlinkedGroupCount: groups.length } });
      return { success: true, unlinkedGroupCount: groups.length };
    }),
    saveUserGroup: adminProcedure.input(userGroupInput).mutation(async ({ ctx, input }) => {
      const db = await ensureMembershipManagementDefaults();
      const existing = input.id ? (await db.select().from(userGroups).where(eq(userGroups.id, input.id)).limit(1))[0] : undefined;
      if (input.id && !existing) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy nhóm người dùng." });
      if (input.planId) {
        const plan = (await db.select({ id: subscriptionPlans.id }).from(subscriptionPlans).where(eq(subscriptionPlans.id, input.planId)).limit(1))[0];
        if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Gói đăng ký được chọn không tồn tại." });
      }
      const data = { planId: input.planId ?? null, name: input.name, description: input.description ?? null, displayOrder: input.displayOrder };
      let groupId = existing?.id;
      if (existing) await db.update(userGroups).set(data).where(eq(userGroups.id, existing.id));
      else { const result = await db.insert(userGroups).values({ ...data, isSystem: false }); groupId = Number(result[0].insertId); }
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: existing ? "user_group.updated" : "user_group.created", entityType: "user_group", entityId: groupId, metadata: { name: input.name, planId: input.planId } });
      return { success: true, groupId };
    }),
    deleteUserGroup: adminProcedure.input(z.object({ groupId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await ensureMembershipManagementDefaults();
      const group = (await db.select().from(userGroups).where(eq(userGroups.id, input.groupId)).limit(1))[0];
      if (!group) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy nhóm người dùng." });
      const members = await db.select({ id: userGroupMembers.id }).from(userGroupMembers).where(eq(userGroupMembers.groupId, group.id));
      await db.delete(userGroupMembers).where(eq(userGroupMembers.groupId, group.id));
      await db.delete(userGroupPermissions).where(eq(userGroupPermissions.groupId, group.id));
      await db.delete(userGroups).where(eq(userGroups.id, group.id));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "user_group.deleted", entityType: "user_group", entityId: group.id, metadata: { name: group.name, removedMemberCount: members.length, wasDefaultGroup: group.isSystem } });
      return { success: true, removedMemberCount: members.length };
    }),
    saveCustomGroupPermissions: adminProcedure.input(customGroupPermissionsInput).mutation(async ({ ctx, input }) => {
      const db = await ensureMembershipManagementDefaults();
      const group = (await db.select({ id: userGroups.id }).from(userGroups).where(eq(userGroups.id, input.groupId)).limit(1))[0];
      if (!group) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy nhóm người dùng." });
      for (const permission of input.permissions) await db.insert(userGroupPermissions).values({ groupId: input.groupId, ...permission }).onDuplicateKeyUpdate({ set: { isAllowed: permission.isAllowed } });
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "user_group.permissions_updated", entityType: "user_group", entityId: input.groupId, metadata: { permissions: input.permissions } });
      return { success: true };
    }),
    savePlanLinkedGroupPermissions: adminProcedure.input(planLinkedPermissionsInput).mutation(async ({ ctx, input }) => {
      const db = await ensureMembershipManagementDefaults();
      const groups = await db.select({ id: userGroups.id }).from(userGroups).where(eq(userGroups.planId, input.planId));
      for (const group of groups) for (const permission of input.permissions) await db.insert(userGroupPermissions).values({ groupId: group.id, ...permission }).onDuplicateKeyUpdate({ set: { isAllowed: permission.isAllowed } });
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "subscription_plan.linked_group_permissions_updated", entityType: "subscription_plan", entityId: input.planId, metadata: { groupCount: groups.length, permissions: input.permissions } });
      return { success: true, groupCount: groups.length };
    }),
    assignUserGroupMember: adminProcedure.input(z.object({ userId: z.number().int().positive(), groupId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await ensureMembershipManagementDefaults();
      if (input.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Không thể tự thay đổi nhóm của tài khoản quản trị đang sử dụng." });
      const [user, groupRows] = await Promise.all([
        db.select({ id: users.id }).from(users).where(eq(users.id, input.userId)).limit(1),
        db.select({ group: userGroups, plan: subscriptionPlans }).from(userGroups).leftJoin(subscriptionPlans, eq(userGroups.planId, subscriptionPlans.id)).where(eq(userGroups.id, input.groupId)).limit(1),
      ]);
      const group = groupRows[0];
      if (!user[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy thành viên." });
      if (!group?.group) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy nhóm người dùng." });
      await db.insert(userGroupMembers).values(input).onDuplicateKeyUpdate({ set: { groupId: input.groupId, updatedAt: new Date() } });
      if (group.plan) {
        const profile = await ensureLearnerProfile(input.userId);
        if (profile) await db.update(learnerProfiles).set({ tier: group.plan.tier }).where(eq(learnerProfiles.id, profile.id));
      }
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "user_group.member_assigned", entityType: "user", entityId: input.userId, metadata: { groupId: input.groupId } });
      await createInAppNotification(db, { userId: input.userId, type: "account_permission", title: "Quyền truy cập đã được cập nhật", body: `Bạn đã được đưa vào nhóm “${group.group.name}”${group.plan ? `, liên kết gói ${group.plan.name}` : ""}.`, href: "/ho-so", metadata: { groupId: input.groupId, planId: group.plan?.id ?? null } });
      return { success: true };
    }),
    removeUserGroupMember: adminProcedure.input(z.object({ userId: z.number().int().positive(), groupId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await ensureMembershipManagementDefaults();
      if (input.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Không thể tự xóa tài khoản quản trị đang sử dụng khỏi nhóm." });
      await db.delete(userGroupMembers).where(and(eq(userGroupMembers.userId, input.userId), eq(userGroupMembers.groupId, input.groupId)));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "user_group.member_removed", entityType: "user", entityId: input.userId, metadata: { groupId: input.groupId } });
      return { success: true };
    }),
    updateUserTier: adminProcedure.input(z.object({ userId: z.number().int().positive(), tier: z.enum(["basic", "pro", "premium"]) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const profile = await ensureLearnerProfile(input.userId);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy hồ sơ học viên." });
        await db.update(learnerProfiles).set({ tier: input.tier }).where(eq(learnerProfiles.id, profile.id));
        await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "user.tier_updated", entityType: "user", entityId: input.userId, metadata: { tier: input.tier } });
        await createInAppNotification(db, { userId: input.userId, type: "account_plan", title: "Gói tài khoản đã được cập nhật", body: `Quản trị viên đã cập nhật gói tài khoản của bạn thành ${input.tier.toUpperCase()}.`, href: "/ho-so", metadata: { tier: input.tier, source: "user-management" } });
        return { success: true };
      }),
    updateUserStatus: adminProcedure.input(z.object({ userId: z.number().int().positive(), status: z.enum(["active", "suspended", "banned", "deactivated"]).optional(), reason: z.string().trim().min(3, "Vui lòng nhập lý do tối thiểu 3 ký tự.").max(500).optional(), isBanned: z.boolean().optional() }).refine(input => input.status !== undefined || input.isBanned !== undefined, { message: "Vui lòng chọn trạng thái tài khoản." }))
      .mutation(async ({ ctx, input }) => {
        const status = input.status ?? (input.isBanned ? "banned" : "active");
        const reason = input.reason ?? "Thay đổi trạng thái từ giao diện quản trị cũ.";
        if (input.userId === ctx.user.id && status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "Không thể thay đổi trạng thái tài khoản quản trị đang sử dụng." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [account] = await db.select({ id: users.id, accountStatus: users.accountStatus }).from(users).where(eq(users.id, input.userId)).limit(1);
        if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy người dùng." });
        const profile = await ensureLearnerProfile(input.userId);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy hồ sơ học viên." });
        await db.update(users).set({ accountStatus: status }).where(eq(users.id, input.userId));
        await db.update(learnerProfiles).set({ isBanned: status === "banned" }).where(eq(learnerProfiles.id, profile.id));
        const action = status === "active" ? "user.reactivated" : status === "suspended" ? "user.suspended" : status === "banned" ? "user.banned" : "user.deactivated";
        await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action, entityType: "user", entityId: input.userId, metadata: { previousStatus: account.accountStatus, accountStatus: status, reason } });
        await createInAppNotification(db, { userId: input.userId, type: "account_permission", title: status === "active" ? "Tài khoản đã được kích hoạt lại" : "Trạng thái tài khoản đã thay đổi", body: status === "active" ? `Quản trị viên đã kích hoạt lại tài khoản của bạn. Lý do: ${reason}` : `Tài khoản của bạn đang ở trạng thái ${status}. Lý do: ${reason}`, href: "/support", metadata: { accountStatus: status, reason, source: "user-management" } });
        return { success: true, status, previousStatus: account.accountStatus };
      }),
    adjustPoints: adminProcedure.input(z.object({ userId: z.number().int().positive(), amount: z.number().int().min(-100000).max(100000).refine(value => value !== 0), description: z.string().trim().min(4).max(500) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const profile = await ensureLearnerProfile(input.userId);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy hồ sơ học viên." });
        const balanceAfter = profile.pointBalance + input.amount;
        if (balanceAfter < 0) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Điều chỉnh này khiến số dư Point âm." });
        await db.update(learnerProfiles).set({ pointBalance: balanceAfter }).where(eq(learnerProfiles.id, profile.id));
        await db.insert(walletTransactions).values({ userId: input.userId, type: "admin_adjustment", amount: input.amount, balanceAfter, description: input.description, referenceType: "admin", referenceId: ctx.user.id });
        await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "wallet.adjusted", entityType: "user", entityId: input.userId, metadata: { amount: input.amount, description: input.description } });
        return { success: true, balanceAfter };
      }),
    pointLedger: adminProcedure.input(z.object({ type: z.enum(["top_up", "quiz_fee", "quiz_reward", "referral_reward", "report_reward", "admin_adjustment", "plan_upgrade"]).optional(), search: z.string().trim().max(120).optional() }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select({ transaction: walletTransactions, userName: users.name, userEmail: users.email })
          .from(walletTransactions).leftJoin(users, eq(walletTransactions.userId, users.id))
          .where(and(input?.type ? eq(walletTransactions.type, input.type) : undefined, input?.search ? sql`(lower(coalesce(${users.name}, '')) like ${`%${input.search.toLowerCase()}%`} or lower(coalesce(${users.email}, '')) like ${`%${input.search.toLowerCase()}%`})` : undefined))
          .orderBy(desc(walletTransactions.createdAt)).limit(150);
      }),
    xp: router({
      overview: adminProcedure.query(async () => {
        const db = await getDb();
        if (!db) return { totalIssued: 0, activeLearners: 0, levels: [], rules: [], recent: [] };
        const [totals, activeLearners, levels, rules, recent] = await Promise.all([
          db.select({ total: sql<number>`coalesce(sum(${xpTransactions.amount}), 0)` }).from(xpTransactions),
          db.select({ count: sql<number>`count(distinct ${xpTransactions.userId})` }).from(xpTransactions),
          db.select().from(xpLevels).orderBy(asc(xpLevels.displayOrder), asc(xpLevels.minXp)),
          db.select().from(xpRules).orderBy(desc(xpRules.updatedAt)).limit(40),
          db.select({ transaction: xpTransactions, userName: users.name, userEmail: users.email }).from(xpTransactions).leftJoin(users, eq(xpTransactions.userId, users.id)).orderBy(desc(xpTransactions.createdAt)).limit(30),
        ]);
        return { totalIssued: Number(totals[0]?.total ?? 0), activeLearners: Number(activeLearners[0]?.count ?? 0), levels, rules, recent };
      }),
      saveLevel: adminProcedure.input(z.object({ id: z.number().int().positive().optional(), name: z.string().trim().min(2).max(120), minXp: z.number().int().min(0), icon: z.string().trim().max(80).nullable().optional(), rewardMetadata: z.record(z.string(), z.unknown()).optional(), displayOrder: z.number().int().min(0), isActive: z.boolean() })).mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể lưu Level XP." });
        const duplicate = await db.select({ id: xpLevels.id }).from(xpLevels).where(and(eq(xpLevels.minXp, input.minXp), input.id ? ne(xpLevels.id, input.id) : undefined)).limit(1);
        if (duplicate.length) throw new TRPCError({ code: "CONFLICT", message: "Mốc XP này đã được sử dụng bởi một Level khác." });
        const data = { name: input.name, minXp: input.minXp, icon: input.icon ?? null, rewardMetadata: input.rewardMetadata ?? null, displayOrder: input.displayOrder, isActive: input.isActive };
        if (input.id) { await db.update(xpLevels).set(data).where(eq(xpLevels.id, input.id)); await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "xp.level_updated", entityType: "xp_level", entityId: input.id, metadata: { after: data } }); return { id: input.id }; }
        const created = await db.insert(xpLevels).values(data); const id = Number(created[0].insertId); await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "xp.level_created", entityType: "xp_level", entityId: id, metadata: { after: data } }); return { id };
      }),
      saveRule: adminProcedure.input(z.object({ id: z.number().int().positive().optional(), code: z.string().trim().regex(/^[a-z][a-z0-9_.-]{2,99}$/), name: z.string().trim().min(2).max(160), trigger: z.string().trim().min(2).max(100), conditionConfig: z.record(z.string(), z.unknown()).optional(), xpAmount: z.number().int().min(1).max(100000), cooldownSeconds: z.number().int().min(0).max(31_536_000), dailyCap: z.number().int().positive().nullable().optional(), status: z.enum(["draft", "active", "paused", "archived"]), effectiveAt: z.date().nullable().optional(), expiresAt: z.date().nullable().optional() })).mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể lưu Rule XP." });
        if (input.expiresAt && input.effectiveAt && input.expiresAt <= input.effectiveAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Ngày hết hiệu lực phải sau ngày bắt đầu." });
        const duplicate = await db.select({ id: xpRules.id }).from(xpRules).where(and(eq(xpRules.code, input.code), input.id ? ne(xpRules.id, input.id) : undefined)).limit(1);
        if (duplicate.length) throw new TRPCError({ code: "CONFLICT", message: "Mã Rule XP đã tồn tại." });
        const data = { code: input.code, name: input.name, trigger: input.trigger, conditionConfig: input.conditionConfig ?? null, xpAmount: input.xpAmount, cooldownSeconds: input.cooldownSeconds, dailyCap: input.dailyCap ?? null, status: input.status, effectiveAt: input.effectiveAt ?? null, expiresAt: input.expiresAt ?? null, updatedByUserId: ctx.user.id };
        if (input.id) { await db.update(xpRules).set(data).where(eq(xpRules.id, input.id)); await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "xp.rule_updated", entityType: "xp_rule", entityId: input.id, metadata: { after: data } }); return { id: input.id }; }
        const created = await db.insert(xpRules).values({ ...data, createdByUserId: ctx.user.id }); const id = Number(created[0].insertId); await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "xp.rule_created", entityType: "xp_rule", entityId: id, metadata: { after: data } }); return { id };
      }),
      adjust: adminProcedure.input(z.object({ userId: z.number().int().positive(), amount: z.number().int().min(-100000).max(100000).refine(value => value !== 0), reason: z.string().trim().min(4).max(500) })).mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể điều chỉnh XP." });
        const account = (await db.select({ id: users.id }).from(users).where(eq(users.id, input.userId)).limit(1))[0];
        if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy người dùng." });
        const balance = (await db.select({ total: sql<number>`coalesce(sum(${xpTransactions.amount}), 0)` }).from(xpTransactions).where(eq(xpTransactions.userId, input.userId)))[0];
        if (Number(balance?.total ?? 0) + input.amount < 0) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Điều chỉnh này khiến tổng XP của người dùng âm." });
        const created = await db.insert(xpTransactions).values({ userId: input.userId, amount: input.amount, sourceType: "admin_adjustment", reason: input.reason, actorUserId: ctx.user.id });
        const id = Number(created[0].insertId); await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "xp.adjusted", entityType: "user", entityId: input.userId, metadata: { amount: input.amount, reason: input.reason, xpTransactionId: id } }); return { id, balanceAfter: Number(balance?.total ?? 0) + input.amount };
      }),
    }),
    gamification: router({
      overview: adminProcedure.query(async () => {
        const db = await getDb();
        if (!db) return { features: [], unlocks: [], missions: [], achievements: [], badges: [], priceRules: [], missionAssignments: 0, achievementUnlocks: 0 };
        const [features, unlocks, missions, achievementRows, badgeRows, priceRules, assignmentStat, achievementStat] = await Promise.all([
          db.select().from(gamificationFeatures).orderBy(asc(gamificationFeatures.category), asc(gamificationFeatures.name)),
          db.select({ unlock: levelFeatureUnlocks, level: xpLevels, feature: gamificationFeatures }).from(levelFeatureUnlocks).innerJoin(xpLevels, eq(levelFeatureUnlocks.levelId, xpLevels.id)).innerJoin(gamificationFeatures, eq(levelFeatureUnlocks.featureId, gamificationFeatures.id)).orderBy(asc(xpLevels.minXp)),
          db.select().from(missionDefinitions).orderBy(asc(missionDefinitions.displayOrder), asc(missionDefinitions.title)),
          db.select({ achievement: achievements, badge: badges }).from(achievements).leftJoin(badges, eq(achievements.badgeId, badges.id)).orderBy(asc(achievements.displayOrder)),
          db.select().from(badges).orderBy(asc(badges.name)),
          db.select().from(pointPriceRules).orderBy(asc(pointPriceRules.name)),
          db.select({ count: sql<number>`count(*)` }).from(userMissionAssignments),
          db.select({ count: sql<number>`count(*)` }).from(userAchievements).where(eq(userAchievements.status, "unlocked")),
        ]);
        return { features, unlocks, missions, achievements: achievementRows, badges: badgeRows, priceRules, missionAssignments: Number(assignmentStat[0]?.count ?? 0), achievementUnlocks: Number(achievementStat[0]?.count ?? 0) };
      }),
      saveFeature: adminProcedure.input(gamificationFeatureInput).mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể lưu tính năng mở khóa." });
        const duplicate = await db.select({ id: gamificationFeatures.id }).from(gamificationFeatures).where(and(eq(gamificationFeatures.code, input.code), input.id ? ne(gamificationFeatures.id, input.id) : undefined)).limit(1);
        if (duplicate.length) throw new TRPCError({ code: "CONFLICT", message: "Mã tính năng đã tồn tại." });
        const data = { code: input.code, name: input.name, description: input.description, icon: input.icon ?? null, category: input.category, isActive: input.isActive };
        if (input.id) { await db.update(gamificationFeatures).set(data).where(eq(gamificationFeatures.id, input.id)); await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "gamification.feature_updated", entityType: "gamification_feature", entityId: input.id, metadata: { after: data } }); return { id: input.id }; }
        const created = await db.insert(gamificationFeatures).values(data); const id = Number(created[0].insertId); await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "gamification.feature_created", entityType: "gamification_feature", entityId: id, metadata: { after: data } }); return { id };
      }),
      setLevelUnlocks: adminProcedure.input(z.object({ levelId: z.number().int().positive(), featureIds: z.array(z.number().int().positive()).max(50).refine(values => new Set(values).size === values.length) })).mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể cập nhật feature unlock." });
        const level = await db.select({ id: xpLevels.id }).from(xpLevels).where(eq(xpLevels.id, input.levelId)).limit(1);
        if (!level[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy Level." });
        if (input.featureIds.length) {
          const features = await db.select({ id: gamificationFeatures.id }).from(gamificationFeatures).where(inArray(gamificationFeatures.id, input.featureIds));
          if (features.length !== input.featureIds.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Một hoặc nhiều feature không hợp lệ." });
        }
        await db.transaction(async tx => { await tx.delete(levelFeatureUnlocks).where(eq(levelFeatureUnlocks.levelId, input.levelId)); if (input.featureIds.length) await tx.insert(levelFeatureUnlocks).values(input.featureIds.map(featureId => ({ levelId: input.levelId, featureId }))); });
        await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "gamification.level_unlocks_updated", entityType: "xp_level", entityId: input.levelId, metadata: { featureIds: input.featureIds } });
        return { success: true };
      }),
      saveMission: adminProcedure.input(missionDefinitionInput).mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể lưu nhiệm vụ." });
        if (input.endsAt && input.startsAt && input.endsAt <= input.startsAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Ngày kết thúc phải sau ngày bắt đầu." });
        const duplicate = await db.select({ id: missionDefinitions.id }).from(missionDefinitions).where(and(eq(missionDefinitions.code, input.code), input.id ? ne(missionDefinitions.id, input.id) : undefined)).limit(1);
        if (duplicate.length) throw new TRPCError({ code: "CONFLICT", message: "Mã nhiệm vụ đã tồn tại." });
        const data = { code: input.code, title: input.title, description: input.description, icon: input.icon ?? null, repeatType: input.repeatType, metricType: input.metricType, target: input.target, xpReward: input.xpReward, conditionConfig: input.conditionConfig ?? null, displayOrder: input.displayOrder, isActive: input.isActive, startsAt: input.startsAt ?? null, endsAt: input.endsAt ?? null };
        if (input.id) { await db.update(missionDefinitions).set(data).where(eq(missionDefinitions.id, input.id)); await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "gamification.mission_updated", entityType: "mission", entityId: input.id, metadata: { after: data } }); return { id: input.id }; }
        const created = await db.insert(missionDefinitions).values(data); const id = Number(created[0].insertId); await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "gamification.mission_created", entityType: "mission", entityId: id, metadata: { after: data } }); return { id };
      }),
      saveBadge: adminProcedure.input(badgeInput).mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể lưu badge." });
        const duplicate = await db.select({ id: badges.id }).from(badges).where(and(eq(badges.code, input.code), input.id ? ne(badges.id, input.id) : undefined)).limit(1);
        if (duplicate.length) throw new TRPCError({ code: "CONFLICT", message: "Mã badge đã tồn tại." });
        const data = { code: input.code, name: input.name, description: input.description, icon: input.icon, color: input.color, isActive: input.isActive };
        if (input.id) { await db.update(badges).set(data).where(eq(badges.id, input.id)); await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "gamification.badge_updated", entityType: "badge", entityId: input.id, metadata: { after: data } }); return { id: input.id }; }
        const created = await db.insert(badges).values(data); const id = Number(created[0].insertId); await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "gamification.badge_created", entityType: "badge", entityId: id, metadata: { after: data } }); return { id };
      }),
      saveAchievement: adminProcedure.input(achievementInput).mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể lưu thành tích." });
        const duplicate = await db.select({ id: achievements.id }).from(achievements).where(and(eq(achievements.code, input.code), input.id ? ne(achievements.id, input.id) : undefined)).limit(1);
        if (duplicate.length) throw new TRPCError({ code: "CONFLICT", message: "Mã thành tích đã tồn tại." });
        if (input.badgeId) { const badge = await db.select({ id: badges.id }).from(badges).where(eq(badges.id, input.badgeId)).limit(1); if (!badge[0]) throw new TRPCError({ code: "BAD_REQUEST", message: "Badge liên kết không hợp lệ." }); }
        const data = { code: input.code, title: input.title, description: input.description, icon: input.icon, conditionType: input.conditionType, conditionConfig: input.conditionConfig ?? null, xpReward: input.xpReward, badgeId: input.badgeId ?? null, displayOrder: input.displayOrder, isActive: input.isActive };
        if (input.id) { await db.update(achievements).set(data).where(eq(achievements.id, input.id)); await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "gamification.achievement_updated", entityType: "achievement", entityId: input.id, metadata: { after: data } }); return { id: input.id }; }
        const created = await db.insert(achievements).values(data); const id = Number(created[0].insertId); await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "gamification.achievement_created", entityType: "achievement", entityId: id, metadata: { after: data } }); return { id };
      }),
      savePointPriceRule: adminProcedure.input(pointPriceRuleInput).mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể lưu cấu hình giá Point." });
        const duplicate = await db.select({ id: pointPriceRules.id }).from(pointPriceRules).where(and(eq(pointPriceRules.code, input.code), input.id ? ne(pointPriceRules.id, input.id) : undefined)).limit(1);
        if (duplicate.length) throw new TRPCError({ code: "CONFLICT", message: "Mã pricing rule đã tồn tại." });
        const data = { code: input.code, name: input.name, description: input.description ?? null, pointCost: input.pointCost, conditionConfig: input.conditionConfig ?? null, isActive: input.isActive };
        if (input.id) { await db.update(pointPriceRules).set(data).where(eq(pointPriceRules.id, input.id)); await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "gamification.point_price_updated", entityType: "point_price_rule", entityId: input.id, metadata: { after: data } }); return { id: input.id }; }
        const created = await db.insert(pointPriceRules).values(data); const id = Number(created[0].insertId); await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "gamification.point_price_created", entityType: "point_price_rule", entityId: id, metadata: { after: data } }); return { id };
      }),
    }),
    analytics: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { users: 0, completed: 0, passRate: 0, pointsConsumed: 0, pointsRewarded: 0, pointsTopUp: 0, popularQuizzes: [] as Array<{ title: string; count: number; passRate: number }> };
      const [userRows, attemptRows, pointRows, popularRows] = await Promise.all([
        db.select({ total: sql<number>`count(*)` }).from(users),
        db.select({ completed: sql<number>`count(*)`, passed: sql<number>`sum(case when ${attempts.passed} = true then 1 else 0 end)` }).from(attempts).where(eq(attempts.status, "submitted")),
        db.select({
          topUp: sql<number>`coalesce(sum(case when ${walletTransactions.type} = 'top_up' then ${walletTransactions.amount} else 0 end), 0)`,
          consumed: sql<number>`coalesce(sum(case when ${walletTransactions.type} = 'quiz_fee' then -${walletTransactions.amount} else 0 end), 0)`,
          rewarded: sql<number>`coalesce(sum(case when ${walletTransactions.type} in ('quiz_reward', 'report_reward', 'referral_reward') then ${walletTransactions.amount} else 0 end), 0)`,
        }).from(walletTransactions),
        db.select({ title: quizzes.title, count: sql<number>`count(${attempts.id})`, passed: sql<number>`sum(case when ${attempts.passed} = true then 1 else 0 end)` })
          .from(quizzes).leftJoin(attempts, and(eq(quizzes.id, attempts.quizId), eq(attempts.status, "submitted"))).groupBy(quizzes.id, quizzes.title).orderBy(desc(sql`count(${attempts.id})`)).limit(5),
      ]);
      const completed = Number(attemptRows[0]?.completed ?? 0);
      const passed = Number(attemptRows[0]?.passed ?? 0);
      const point = pointRows[0];
      return {
        users: Number(userRows[0]?.total ?? 0), completed, passRate: completed ? Math.round((passed / completed) * 100) : 0,
        pointsConsumed: Number(point?.consumed ?? 0), pointsRewarded: Number(point?.rewarded ?? 0), pointsTopUp: Number(point?.topUp ?? 0),
        popularQuizzes: popularRows.map(row => ({ title: row.title, count: Number(row.count), passRate: Number(row.count) ? Math.round((Number(row.passed) / Number(row.count)) * 100) : 0 })),
      };
    }),
    auditTrail: adminProcedure.input(z.object({ actorUserId: z.number().int().positive().optional(), action: z.string().trim().max(120).optional() }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select({ log: auditLogs, actorName: users.name, actorEmail: users.email })
          .from(auditLogs).leftJoin(users, eq(auditLogs.actorUserId, users.id))
          .where(and(input?.actorUserId ? eq(auditLogs.actorUserId, input.actorUserId) : undefined, input?.action ? eq(auditLogs.action, input.action) : undefined))
          .orderBy(desc(auditLogs.createdAt)).limit(100);
      }),
    saveContentNode: adminProcedure.input(z.object({
      kind: z.enum(["category", "subject", "lesson"]),
      id: z.number().int().positive().optional(),
      parentId: z.number().int().positive().optional(),
      title: z.string().trim().min(2).max(180),
      slug: z.string().trim().regex(/^[a-z0-9-]+$/),
      description: z.string().trim().max(3000).optional(),
      coverImageUrl: z.string().url().max(1024).optional(),
      isPublished: z.boolean(),
      sortOrder: z.number().int().min(0).max(10000),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (input.kind === "category") {
        const data = { title: input.title, slug: input.slug, description: input.description || null, coverImageUrl: input.coverImageUrl || null, isPublished: input.isPublished, sortOrder: input.sortOrder };
        if (input.id) await db.update(categories).set(data).where(eq(categories.id, input.id)); else await db.insert(categories).values(data);
      } else if (input.kind === "subject") {
        if (!input.parentId) throw new TRPCError({ code: "BAD_REQUEST", message: "Môn học cần thuộc một Chủ đề." });
        const data = { categoryId: input.parentId, title: input.title, slug: input.slug, description: input.description || null, isPublished: input.isPublished, sortOrder: input.sortOrder };
        if (input.id) await db.update(subjects).set(data).where(eq(subjects.id, input.id)); else await db.insert(subjects).values(data);
      } else {
        if (!input.parentId) throw new TRPCError({ code: "BAD_REQUEST", message: "Bài học cần thuộc một Môn học." });
        const data = { subjectId: input.parentId, title: input.title, slug: input.slug, summary: input.description || null, isPublished: input.isPublished, sortOrder: input.sortOrder };
        if (input.id) await db.update(lessons).set(data).where(eq(lessons.id, input.id)); else await db.insert(lessons).values(data);
      }
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: `${input.kind}.${input.id ? "updated" : "created"}`, entityType: input.kind, entityId: input.id, metadata: { title: input.title } });
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
