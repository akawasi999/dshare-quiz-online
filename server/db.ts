import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
	attempts,
	attemptAnswers,
	attemptSecurityEvents,
	aiUsageEvents,
	categories,
  InsertUser,
  learnerProfiles,
  lessons,
  questionOptions,
	questions,
	quizzes,
	quizQuestions,
	seoSettings,
	subscriptionPlans,
	subjects,
  users,
  walletTransactions,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { sortLeaderboardEntries } from "./leaderboard";
import { scoreQuiz } from "./quizEngine";
import { getTrueFalseStatements } from "../shared/questionValidation";
import { getEffectiveTier } from "./membershipUtils";
import { getQuotaPeriod } from "./quotaUtils";

export const DEFAULT_QUIZ_COVER_URL = "/manus-storage/dshare-default-quiz-cover_d96ff2fa.png";
export const withImageCacheVersion = (url: string, version: Date | number | null | undefined) => {
  const token = version instanceof Date ? version.getTime() : version;
  return token ? `${url}${url.includes("?") ? "&" : "?"}v=${token}` : url;
};

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: new Date() };
  (["name", "email", "loginMethod"] as const).forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function ensureLearnerProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const referralCode = `DS${userId.toString(36).toUpperCase().padStart(6, "0")}`;
  await db.insert(learnerProfiles).values({ userId, referralCode }).onDuplicateKeyUpdate({
    set: { userId },
  });
  const result = await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, userId)).limit(1);
  const profile = result[0];
  if (profile && getEffectiveTier({ tier: profile.tier, tierExpiresAt: profile.tierExpiresAt }) === "basic" && profile.tier !== "basic") {
    await db.update(learnerProfiles).set({ tier: "basic", tierExpiresAt: null }).where(eq(learnerProfiles.id, profile.id));
    return { ...profile, tier: "basic", tierExpiresAt: null };
  }
  return profile;
}

export async function getLearnerSummary(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const profile = await ensureLearnerProfile(userId);
  if (!profile) return undefined;
  const stats = await db.select({
    completed: sql<number>`count(${attempts.id})`,
    averageScore: sql<number>`coalesce(round(avg(${attempts.score})), 0)`,
    passedCount: sql<number>`sum(case when ${attempts.passed} = true then 1 else 0 end)`,
  }).from(attempts).where(and(eq(attempts.userId, userId), eq(attempts.status, "submitted")));
  const plans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true)).orderBy(subscriptionPlans.displayOrder, subscriptionPlans.name);
  const tierRank = { basic: 1, pro: 2, premium: 3 } as const;
  const currentPlan = plans.find(plan => plan.tier === profile.tier) ?? null;
  const profileTier = profile.tier as keyof typeof tierRank;
  const upgradePlans = plans.filter(plan => tierRank[plan.tier as keyof typeof tierRank] > tierRank[profileTier]);
  return { profile, stats: stats[0] ?? { completed: 0, averageScore: 0, passedCount: 0 }, currentPlan, upgradePlans };
}

export async function listPublishedCatalog(search?: string, categoryId?: number) {
  const db = await getDb();
  if (!db) return [];
  const seoConfig = (await db.select({ defaultQuizCoverUrl: seoSettings.defaultQuizCoverUrl, updatedAt: seoSettings.updatedAt }).from(seoSettings).limit(1))[0];
  const defaultCoverUrl = seoConfig?.defaultQuizCoverUrl || DEFAULT_QUIZ_COVER_URL;
  const rows = await db.select({
    quizId: quizzes.id,
    title: quizzes.title,
    slug: quizzes.slug,
    summary: quizzes.summary,
    mode: quizzes.mode,
    difficulty: quizzes.difficulty,
    accessTier: quizzes.accessTier,
    durationSeconds: quizzes.durationSeconds,
    passingScore: quizzes.passingScore,
    entryPointCost: quizzes.entryPointCost,
    completionReward: quizzes.completionReward,
    questionCount: quizzes.questionCount,
    createdAt: quizzes.createdAt,
    coverImageUrl: sql<string | null>`coalesce(${quizzes.coverImageUrl}, ${categories.coverImageUrl})`,
    quizUpdatedAt: quizzes.updatedAt,
    categoryUpdatedAt: categories.updatedAt,
    attemptCount: sql<number>`count(${attempts.id})`,
    recentAttemptCount: sql<number>`sum(case when ${attempts.completedAt} >= date_sub(now(), interval 24 hour) then 1 else 0 end)`,
    categoryId: categories.id,
    categoryTitle: categories.title,
    subjectTitle: subjects.title,
    lessonTitle: lessons.title,
  }).from(quizzes)
    .innerJoin(lessons, eq(quizzes.lessonId, lessons.id))
    .innerJoin(subjects, eq(lessons.subjectId, subjects.id))
    .innerJoin(categories, eq(subjects.categoryId, categories.id))
    .leftJoin(attempts, and(eq(attempts.quizId, quizzes.id), eq(attempts.status, "submitted")))
    .where(and(
      eq(quizzes.isPublished, true),
      eq(quizzes.visibility, "public"),
      categoryId ? eq(categories.id, categoryId) : undefined,
      search ? sql`lower(${quizzes.title}) like ${`%${search.toLowerCase()}%`}` : undefined,
    ))
    .groupBy(
      quizzes.id,
      quizzes.title,
      quizzes.slug,
      quizzes.summary,
      quizzes.mode,
      quizzes.difficulty,
      quizzes.accessTier,
      quizzes.durationSeconds,
      quizzes.passingScore,
      quizzes.entryPointCost,
      quizzes.completionReward,
      quizzes.questionCount,
      quizzes.coverImageUrl,
      categories.coverImageUrl,
      quizzes.updatedAt,
      categories.updatedAt,
      quizzes.createdAt,
      categories.id,
      categories.title,
      subjects.title,
      lessons.title,
    )
    .orderBy(desc(quizzes.createdAt));
  return rows.map(row => {
    const inheritedCategoryCover = !row.coverImageUrl && Boolean(row.categoryUpdatedAt);
    const version = row.coverImageUrl ? row.quizUpdatedAt : inheritedCategoryCover ? row.categoryUpdatedAt : seoConfig?.updatedAt;
    return { ...row, coverImageUrl: withImageCacheVersion(row.coverImageUrl || defaultCoverUrl, version) };
  });
}

export async function listCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.isPublished, true)).orderBy(categories.sortOrder);
}

export async function getQuizDetail(quizId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const quizRows = await db.select({
    quiz: quizzes,
    lesson: lessons,
    subject: subjects,
    category: categories,
  }).from(quizzes)
    .innerJoin(lessons, eq(quizzes.lessonId, lessons.id))
    .innerJoin(subjects, eq(lessons.subjectId, subjects.id))
    .innerJoin(categories, eq(subjects.categoryId, categories.id))
    .where(eq(quizzes.id, quizId)).limit(1);
  return quizRows[0];
}

export async function getOwnedQuizAnalytics(userId: number, quizId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [quiz] = await db.select({ id: quizzes.id, title: quizzes.title }).from(quizzes)
    .where(and(eq(quizzes.id, quizId), eq(quizzes.creatorUserId, userId))).limit(1);
  if (!quiz) return undefined;

  const [summaryRow] = await db.select({
    completedAttempts: sql<number>`count(${attempts.id})`,
    averageScore: sql<number>`coalesce(round(avg(${attempts.score})), 0)`,
    passedAttempts: sql<number>`coalesce(sum(case when ${attempts.passed} = true then 1 else 0 end), 0)`,
    latestCompletedAt: sql<Date | null>`max(${attempts.completedAt})`,
  }).from(attempts).where(and(eq(attempts.quizId, quizId), eq(attempts.status, "submitted")));

  const questionRows = await db.select({
    questionId: questions.id,
    prompt: questions.prompt,
    type: questions.type,
    points: quizQuestions.points,
    sortOrder: quizQuestions.sortOrder,
    answerCount: sql<number>`count(${attemptAnswers.id})`,
    correctCount: sql<number>`coalesce(sum(case when ${attemptAnswers.isCorrect} = true then 1 else 0 end), 0)`,
  }).from(quizQuestions)
    .innerJoin(questions, eq(quizQuestions.questionId, questions.id))
    .leftJoin(attempts, and(eq(attempts.quizId, quizQuestions.quizId), eq(attempts.status, "submitted")))
    .leftJoin(attemptAnswers, and(eq(attemptAnswers.attemptId, attempts.id), eq(attemptAnswers.questionId, questions.id)))
    .where(eq(quizQuestions.quizId, quizId))
    .groupBy(questions.id, questions.prompt, questions.type, quizQuestions.points, quizQuestions.sortOrder)
    .orderBy(asc(quizQuestions.sortOrder));

  const completedAttempts = Number(summaryRow?.completedAttempts ?? 0);
  const passedAttempts = Number(summaryRow?.passedAttempts ?? 0);
  return {
    quiz,
    summary: {
      completedAttempts,
      averageScore: Number(summaryRow?.averageScore ?? 0),
      passRate: completedAttempts ? Math.round((passedAttempts / completedAttempts) * 100) : 0,
      latestCompletedAt: summaryRow?.latestCompletedAt ?? null,
    },
    questions: questionRows.map(row => {
      const answerCount = Number(row.answerCount ?? 0);
      const correctCount = Number(row.correctCount ?? 0);
      return { questionId: row.questionId, prompt: row.prompt, type: row.type, points: row.points, answerCount, correctCount, correctRate: answerCount ? Math.round((correctCount / answerCount) * 100) : null };
    }),
  };
}

export async function getQuizQuestionSet(quizId: number) {
  const db = await getDb();
  if (!db) return [];
  const questionRows = await db.select({ question: questions, points: quizQuestions.points, sortOrder: quizQuestions.sortOrder })
    .from(quizQuestions)
    .innerJoin(questions, eq(quizQuestions.questionId, questions.id))
    .where(and(eq(quizQuestions.quizId, quizId), eq(questions.isActive, true)))
    .orderBy(quizQuestions.sortOrder);
  if (!questionRows.length) return [];
  const optionRows = await db.select().from(questionOptions)
    .where(inArray(questionOptions.questionId, questionRows.map(row => row.question.id)))
    .orderBy(questionOptions.sortOrder);
  return questionRows.map(row => ({
    ...row,
    options: optionRows.filter(option => option.questionId === row.question.id),
  }));
}

export async function createAttempt(input: { userId: number; quizId: number; mode: "training" | "testing"; questionOrder: number[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(attempts).values({
    userId: input.userId,
    quizId: input.quizId,
    mode: input.mode,
    questionOrder: input.questionOrder,
    totalQuestions: input.questionOrder.length,
  });
  return Number(result[0].insertId);
}

export async function getMonthlyQuotaUsage(userId: number, now = new Date()) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const { start, end } = getQuotaPeriod(now);
  const [attemptRows, quizRows, aiRows] = await Promise.all([
    db.select({ count: sql<number>`count(${attempts.id})` }).from(attempts).where(and(eq(attempts.userId, userId), sql`${attempts.startedAt} >= ${start}`, sql`${attempts.startedAt} < ${end}`)),
    db.select({ count: sql<number>`count(${quizzes.id})` }).from(quizzes).where(and(eq(quizzes.creatorUserId, userId), sql`${quizzes.createdAt} >= ${start}`, sql`${quizzes.createdAt} < ${end}`)),
    db.select({ count: sql<number>`count(${aiUsageEvents.id})` }).from(aiUsageEvents).where(and(eq(aiUsageEvents.userId, userId), sql`${aiUsageEvents.createdAt} >= ${start}`, sql`${aiUsageEvents.createdAt} < ${end}`)),
  ]);
  return {
    attempts: Number(attemptRows[0]?.count ?? 0),
    quizzes: Number(quizRows[0]?.count ?? 0),
    aiCredits: Number(aiRows[0]?.count ?? 0),
  };
}

export async function recordAiUsage(userId: number, action: "explain" | "assist" | "generate_question") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(aiUsageEvents).values({ userId, action });
}

export async function saveAnswer(input: { attemptId: number; questionId: number; selectedOptionIds: number[]; answerPayload?: Record<string, unknown> }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(attemptAnswers).values({
    attemptId: input.attemptId,
    questionId: input.questionId,
    selectedOptionIds: input.selectedOptionIds,
    answerPayload: input.answerPayload ?? null,
  }).onDuplicateKeyUpdate({ set: { selectedOptionIds: input.selectedOptionIds, answerPayload: input.answerPayload ?? null, savedAt: new Date() } });
}

export async function submitAttempt(attemptId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const attemptRows = await db.select().from(attempts).where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId))).limit(1);
  const attempt = attemptRows[0];
  if (!attempt) throw new Error("Attempt not found");
  if (attempt.status !== "in_progress") throw new Error("Attempt has already been submitted");
  const detail = await getQuizDetail(attempt.quizId);
  if (!detail) throw new Error("Quiz not found");
  const questionSet = await getQuizQuestionSet(attempt.quizId);
  const answers = await db.select().from(attemptAnswers).where(eq(attemptAnswers.attemptId, attemptId));
  const summary = scoreQuiz(
    questionSet.map(row => ({
      questionId: row.question.id,
      optionIds: row.options.map(option => option.id),
      correctOptionIds: row.options.filter(option => option.isCorrect).map(option => option.id),
      type: row.question.type,
      statementAnswers: row.question.type === "true_false_statements" ? Object.fromEntries(getTrueFalseStatements(row.question.answerConfig ?? {}).map(statement => [statement.id, statement.correct])) : undefined,
      points: row.points,
    })),
    answers.map(answer => ({ questionId: answer.questionId, selectedOptionIds: answer.selectedOptionIds, answerPayload: answer.answerPayload }))
  );
  const passed = summary.scorePercent >= detail.quiz.passingScore;
  const [priorCompletions, priorQuizCompletions] = await Promise.all([
    db.select({ quizId: attempts.quizId, score: attempts.score }).from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.status, "submitted"))),
    db.select({ score: attempts.score }).from(attempts)
      .where(and(eq(attempts.quizId, attempt.quizId), eq(attempts.status, "submitted"))),
  ]);
  const priorQuizScores = priorCompletions.filter(item => item.quizId === attempt.quizId).map(item => item.score ?? 0);
  const previousBest = priorQuizScores.length ? Math.max(...priorQuizScores) : -1;
  const previousQuizBest = priorQuizCompletions.length ? Math.max(...priorQuizCompletions.map(item => item.score ?? 0)) : -1;
  const isFirstCompletion = priorCompletions.length === 0;
  const isPersonalRecord = summary.scorePercent > previousBest;
  const isQuizRecord = summary.scorePercent > previousQuizBest;
  await db.update(attempts).set({
    status: "submitted",
    completedAt: new Date(),
    score: summary.scorePercent,
    correctCount: summary.correctCount,
    passed,
  }).where(eq(attempts.id, attemptId));

  if (passed && detail.quiz.completionReward > 0) {
    const profile = await ensureLearnerProfile(userId);
    if (profile) {
      const balanceAfter = profile.pointBalance + detail.quiz.completionReward;
      await db.update(learnerProfiles).set({ pointBalance: balanceAfter }).where(eq(learnerProfiles.id, profile.id));
      await db.insert(walletTransactions).values({
        userId,
        type: "quiz_reward",
        amount: detail.quiz.completionReward,
        balanceAfter,
        description: `Thưởng hoàn thành: ${detail.quiz.title}`,
        referenceType: "attempt",
        referenceId: attemptId,
      });
    }
  }
  const selectedByQuestion = new Map(answers.map(answer => [answer.questionId, answer.selectedOptionIds]));
  const payloadByQuestion = new Map(answers.map(answer => [answer.questionId, answer.answerPayload]));
  const correctnessByQuestion = new Map(summary.answerResults.map(result => [result.questionId, result.isCorrect]));
  const review = questionSet.map(row => ({
    questionId: row.question.id,
    prompt: row.question.prompt,
    explanation: row.question.explanation,
    type: row.question.type,
    selectedOptionIds: selectedByQuestion.get(row.question.id) ?? [],
    selectedStatementAnswers: (payloadByQuestion.get(row.question.id) as { statementAnswers?: Record<string, boolean> } | null)?.statementAnswers ?? {},
    statements: row.question.type === "true_false_statements" ? getTrueFalseStatements(row.question.answerConfig ?? {}).map(statement => ({ id: statement.id, text: statement.text, correct: statement.correct })) : [],
    correctOptionIds: row.options.filter(option => option.isCorrect).map(option => option.id),
    isCorrect: correctnessByQuestion.get(row.question.id) ?? false,
    options: row.options.map(option => ({ id: option.id, body: option.body })),
  }));
  return { ...summary, passed, quiz: detail.quiz, review, isFirstCompletion, isPersonalRecord, isQuizRecord };
}

export async function logSecurityEvent(attemptId: number, eventType: "copy" | "paste" | "context_menu" | "tab_hidden" | "fullscreen_exit") {
  const db = await getDb();
  if (!db) return;
  await db.insert(attemptSecurityEvents).values({ attemptId, eventType });
  await db.update(attempts).set({ violationCount: sql`${attempts.violationCount} + 1` }).where(eq(attempts.id, attemptId));
}

export async function getLeaderboard(quizId?: number) {
  const db = await getDb();
  if (!db) return [];
  const bestScore = sql<number>`max(${attempts.score})`;
  const completedCount = sql<number>`count(${attempts.id})`;
  const rows = await db.select({
    userId: attempts.userId,
    name: users.name,
    bestScore,
    completedCount,
  }).from(attempts)
    .innerJoin(users, eq(attempts.userId, users.id))
    .where(and(eq(attempts.status, "submitted"), quizId ? eq(attempts.quizId, quizId) : undefined))
    .groupBy(attempts.userId, users.name)
    .orderBy(desc(bestScore), desc(completedCount), asc(attempts.userId))
    .limit(20);
  return sortLeaderboardEntries(rows);
}

export async function getWalletTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(walletTransactions).where(eq(walletTransactions.userId, userId)).orderBy(desc(walletTransactions.createdAt)).limit(30);
}
