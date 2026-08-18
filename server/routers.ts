import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  attempts,
  attemptAnswers,
  auditLogs,
  bugReports,
  categories,
  discussionPosts,
  learnerProfiles,
  lessons,
  questionOptions,
  paymentRecords,
  questions,
  quizzes,
  quizQuestions,
  subjects,
  users,
  walletTransactions,
} from "../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM, listLLMModels } from "./_core/llm";
import { buildQuizAssistantMessages, type QuizAssistantIntent } from "./aiAssistant";
import { buildAttemptMilestoneAlert } from "./attemptNotifications";
import { getReferralValidationError, normalizeReferralCode } from "./referralUtils";
import { allocateQuestionCounts } from "./randomQuiz";
import { validateQuestionConfiguration } from "../shared/questionValidation";
import { notifyOwner } from "./_core/notification";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createAttempt,
  ensureLearnerProfile,
  getDb,
  getLeaderboard,
  getLearnerSummary,
  getQuizDetail,
  getQuizQuestionSet,
  getWalletTransactions,
  listCategories,
  listPublishedCatalog,
  logSecurityEvent,
  saveAnswer,
  submitAttempt,
} from "./db";
import { shuffledForAttempt } from "./quizEngine";
import { buildPayosCallbackUrls, createPayosPaymentLink } from "./payosService";
import { buildPaymentOffer, createPayosOrderCode, getPaymentAmount, getPaymentPackage, isFirstPurchaseDiscountEligible, isPaymentPackageCode, paymentPackages } from "./payosUtils";

const tierRank = { basic: 1, pro: 2, premium: 3 } as const;
const quizIdInput = z.object({ quizId: z.number().int().positive() });
const csvEscape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
export const parseCsv = (text: string) => text.trim().split(/\r?\n/).map(line => {
  const values: string[] = []; let value = ""; let quoted = false;
  for (let index = 0; index < line.length; index += 1) { const char = line[index]; const next = line[index + 1]; if (char === '"' && quoted && next === '"') { value += '"'; index += 1; } else if (char === '"') quoted = !quoted; else if (char === ',' && !quoted) { values.push(value); value = ""; } else value += char; }
  values.push(value); return values;
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  catalog: router({
    categories: publicProcedure.query(() => listCategories()),
    list: publicProcedure.input(z.object({ search: z.string().trim().max(120).optional(), categoryId: z.number().int().positive().optional() }).optional())
      .query(({ input }) => listPublishedCatalog(input?.search, input?.categoryId)),
    detail: publicProcedure.input(quizIdInput).query(async ({ input }) => {
      const detail = await getQuizDetail(input.quizId);
      if (!detail || !detail.quiz.isPublished) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy bộ đề." });
      return detail;
    }),
  }),

  learner: router({
    summary: protectedProcedure.query(({ ctx }) => getLearnerSummary(ctx.user.id)),
    wallet: protectedProcedure.query(({ ctx }) => getWalletTransactions(ctx.user.id)),
    updateProfile: protectedProcedure.input(z.object({ bio: z.string().trim().max(500).optional(), learningGoal: z.string().trim().max(220).optional(), avatarUrl: z.string().url().max(1024).optional().or(z.literal("")), notificationPreferences: z.object({ studyReminders: z.boolean(), resultUpdates: z.boolean(), platformUpdates: z.boolean() }).optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const profile = await ensureLearnerProfile(ctx.user.id);
        if (!profile) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(learnerProfiles).set({ bio: input.bio || null, learningGoal: input.learningGoal || null, avatarUrl: input.avatarUrl || null, notificationPreferences: input.notificationPreferences }).where(eq(learnerProfiles.id, profile.id));
        return { success: true };
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
      return Object.values(paymentPackages).map(pkg => buildPaymentOffer(pkg, records.filter(record => record.itemCode === pkg.code).length));
    }),
    createLink: protectedProcedure.input(z.object({ packageCode: z.string().trim() })).mutation(async ({ ctx, input }) => {
      if (!isPaymentPackageCode(input.packageCode)) throw new TRPCError({ code: "BAD_REQUEST", message: "Gói thanh toán không hợp lệ." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể kết nối hệ thống thanh toán." });
      const clientId = process.env.PAYOS_CLIENT_ID;
      const apiKey = process.env.PAYOS_API_KEY;
      const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
      if (!clientId || !apiKey || !checksumKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "PayOS chưa được cấu hình đầy đủ." });

      const pkg = getPaymentPackage(input.packageCode);
      const priorPurchases = await db.select({ id: paymentRecords.id }).from(paymentRecords)
        .where(and(eq(paymentRecords.userId, ctx.user.id), eq(paymentRecords.itemCode, pkg.code), eq(paymentRecords.status, "paid")));
      const amount = getPaymentAmount(pkg, priorPurchases.length);
      const orderCode = createPayosOrderCode();
      const origin = `${ctx.req.protocol}://${ctx.req.get("host")}`;
      const callbacks = buildPayosCallbackUrls(origin, orderCode);
      const description = `DS ${pkg.code}`.slice(0, 25);
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
        return { recordId, orderCode, amount, checkoutUrl: link.checkoutUrl, discounted: isFirstPurchaseDiscountEligible(pkg, priorPurchases.length) };
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
      if (!detail || !detail.quiz.isPublished) throw new TRPCError({ code: "NOT_FOUND", message: "Bộ đề chưa sẵn sàng." });
      const profile = await ensureLearnerProfile(ctx.user.id);
      if (!profile || profile.isBanned) throw new TRPCError({ code: "FORBIDDEN", message: "Tài khoản hiện không thể tham gia bài thi." });
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
    saveAnswer: protectedProcedure.input(z.object({ attemptId: z.number().int().positive(), questionId: z.number().int().positive(), selectedOptionIds: z.array(z.number().int().positive()).max(10) }))
      .mutation(({ input }) => saveAnswer(input)),
    submit: protectedProcedure.input(z.object({ attemptId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const result = await submitAttempt(input.attemptId, ctx.user.id);
      const alert = buildAttemptMilestoneAlert({ learnerName: ctx.user.name ?? "Một học viên", quizTitle: result.quiz.title, scorePercent: result.scorePercent, passed: result.passed, isFirstCompletion: result.isFirstCompletion, isQuizRecord: result.isQuizRecord, isPersonalRecord: result.isPersonalRecord });
      try { await notifyOwner(alert); } catch (error) { console.warn("[Quiz notification] Delivery failed without affecting submission", error); }
      return result;
    }),
    securityEvent: protectedProcedure.input(z.object({ attemptId: z.number().int().positive(), eventType: z.enum(["copy", "paste", "context_menu", "tab_hidden", "fullscreen_exit"]) }))
      .mutation(({ input }) => logSecurityEvent(input.attemptId, input.eventType)),
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
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Bạn là trợ lý học tập Dshare. Trả lời bằng tiếng Việt, giải thích khái niệm ngắn gọn, có cấu trúc, không bịa nguồn tham khảo và khuyến khích người học tự kiểm chứng." },
            { role: "user", content: `Câu hỏi: ${input.question}\nNgữ cảnh: ${input.context ?? "Không có"}\nHãy đưa ra giải thích học thuật, gợi ý cách suy luận và 2 từ khóa để tự tìm tài liệu.` },
          ],
          maxTokens: 700,
        });
        return { content: typeof response.choices[0]?.message.content === "string" ? response.choices[0].message.content : "Chưa thể tạo giải thích lúc này." };
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
        return { content: typeof content === "string" && content.trim() ? content : "Trợ lý chưa thể tạo phản hồi lúc này. Vui lòng thử lại sau.", intent: input.intent };
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

  admin: router({
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
    saveQuiz: adminProcedure.input(z.object({ id: z.number().int().positive().optional(), lessonId: z.number().int().positive(), title: z.string().trim().min(4).max(220), slug: z.string().trim().regex(/^[a-z0-9-]+$/), mode: z.enum(["training", "testing"]), accessTier: z.enum(["basic", "pro", "premium"]), durationSeconds: z.number().int().min(60).max(14400), passingScore: z.number().int().min(0).max(100), entryPointCost: z.number().int().min(0), completionReward: z.number().int().min(0), isPublished: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const data = { lessonId: input.lessonId, title: input.title, slug: input.slug, mode: input.mode, accessTier: input.accessTier, durationSeconds: input.durationSeconds, passingScore: input.passingScore, entryPointCost: input.entryPointCost, completionReward: input.completionReward, isPublished: input.isPublished };
        if (input.id) await db.update(quizzes).set(data).where(eq(quizzes.id, input.id));
        else await db.insert(quizzes).values(data);
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
      const ratioSum = input.easyRatio + input.mediumRatio + input.hardRatio;
      if (Math.abs(ratioSum - 1) > 0.001) throw new TRPCError({ code: "BAD_REQUEST", message: "Tổng tỷ lệ độ khó phải bằng 100%." });
      const pool = await db.select().from(questions).where(and(eq(questions.lessonId, input.lessonId), eq(questions.isActive, true)));
      const wanted = allocateQuestionCounts(input.questionCount, { easy: input.easyRatio, medium: input.mediumRatio, hard: input.hardRatio });
      const selected = (["easy", "medium", "hard"] as const).flatMap(difficulty => shuffledForAttempt(pool.filter(question => question.difficulty === difficulty), Date.now() + difficulty.length).slice(0, wanted[difficulty]));
      if (selected.length < input.questionCount) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Ngân hàng chưa đủ câu hỏi theo tỷ lệ đã chọn (có ${selected.length}/${input.questionCount} câu).` });
      const created = await db.insert(quizzes).values({ lessonId: input.lessonId, title: input.title, slug: input.slug, mode: input.mode, difficulty: "medium", durationSeconds: input.questionCount * 60, passingScore: 70, entryPointCost: input.mode === "testing" ? 20 : 0, completionReward: input.mode === "testing" ? 40 : 0, questionCount: input.questionCount, randomizeQuestions: true, randomizeOptions: true, isPublished: false });
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
      type: z.enum(["single", "multiple", "true_false", "fill_blank", "image", "matching"]),
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
    users: adminProcedure.input(z.object({ search: z.string().trim().max(120).optional(), tier: z.enum(["basic", "pro", "premium"]).optional(), status: z.enum(["active", "banned"]).optional() }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const rows = await db.select({ user: users, profile: learnerProfiles })
          .from(users).leftJoin(learnerProfiles, eq(users.id, learnerProfiles.userId))
          .where(and(
            input?.tier ? eq(learnerProfiles.tier, input.tier) : undefined,
            input?.status ? eq(learnerProfiles.isBanned, input.status === "banned") : undefined,
            input?.search ? sql`(lower(coalesce(${users.name}, '')) like ${`%${input.search.toLowerCase()}%`} or lower(coalesce(${users.email}, '')) like ${`%${input.search.toLowerCase()}%`})` : undefined,
          )).orderBy(desc(users.createdAt)).limit(100);
        const counts = await db.select({ userId: attempts.userId, completed: sql<number>`count(*)` })
          .from(attempts).where(eq(attempts.status, "submitted")).groupBy(attempts.userId);
        const countByUser = new Map(counts.map(row => [row.userId, Number(row.completed)]));
        return rows.map(row => ({ ...row, completedCount: countByUser.get(row.user.id) ?? 0 }));
      }),
    updateUserTier: adminProcedure.input(z.object({ userId: z.number().int().positive(), tier: z.enum(["basic", "pro", "premium"]) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const profile = await ensureLearnerProfile(input.userId);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy hồ sơ học viên." });
        await db.update(learnerProfiles).set({ tier: input.tier }).where(eq(learnerProfiles.id, profile.id));
        await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "user.tier_updated", entityType: "user", entityId: input.userId, metadata: { tier: input.tier } });
        return { success: true };
      }),
    updateUserStatus: adminProcedure.input(z.object({ userId: z.number().int().positive(), isBanned: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        if (input.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Không thể khóa tài khoản quản trị đang sử dụng." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const profile = await ensureLearnerProfile(input.userId);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy hồ sơ học viên." });
        await db.update(learnerProfiles).set({ isBanned: input.isBanned }).where(eq(learnerProfiles.id, profile.id));
        await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: input.isBanned ? "user.banned" : "user.unbanned", entityType: "user", entityId: input.userId });
        return { success: true };
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
      isPublished: z.boolean(),
      sortOrder: z.number().int().min(0).max(10000),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (input.kind === "category") {
        const data = { title: input.title, slug: input.slug, description: input.description || null, isPublished: input.isPublished, sortOrder: input.sortOrder };
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
