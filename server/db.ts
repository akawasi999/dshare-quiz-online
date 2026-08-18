import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  attempts,
  attemptAnswers,
  attemptSecurityEvents,
  categories,
  InsertUser,
  learnerProfiles,
  lessons,
  questionOptions,
  questions,
  quizzes,
  quizQuestions,
  subjects,
  users,
  walletTransactions,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { sortLeaderboardEntries } from "./leaderboard";
import { scoreQuiz } from "./quizEngine";
import { getEffectiveTier } from "./membershipUtils";

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
  return { profile, stats: stats[0] ?? { completed: 0, averageScore: 0, passedCount: 0 } };
}

export async function listPublishedCatalog(search?: string, categoryId?: number) {
  const db = await getDb();
  if (!db) return [];
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
    categoryId: categories.id,
    categoryTitle: categories.title,
    subjectTitle: subjects.title,
    lessonTitle: lessons.title,
  }).from(quizzes)
    .innerJoin(lessons, eq(quizzes.lessonId, lessons.id))
    .innerJoin(subjects, eq(lessons.subjectId, subjects.id))
    .innerJoin(categories, eq(subjects.categoryId, categories.id))
    .where(and(
      eq(quizzes.isPublished, true),
      categoryId ? eq(categories.id, categoryId) : undefined,
      search ? sql`lower(${quizzes.title}) like ${`%${search.toLowerCase()}%`}` : undefined,
    ))
    .orderBy(desc(quizzes.createdAt));
  return rows;
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

export async function saveAnswer(input: { attemptId: number; questionId: number; selectedOptionIds: number[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(attemptAnswers).values({
    attemptId: input.attemptId,
    questionId: input.questionId,
    selectedOptionIds: input.selectedOptionIds,
  }).onDuplicateKeyUpdate({ set: { selectedOptionIds: input.selectedOptionIds, savedAt: new Date() } });
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
      points: row.points,
    })),
    answers.map(answer => ({ questionId: answer.questionId, selectedOptionIds: answer.selectedOptionIds }))
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
  const correctnessByQuestion = new Map(summary.answerResults.map(result => [result.questionId, result.isCorrect]));
  const review = questionSet.map(row => ({
    questionId: row.question.id,
    prompt: row.question.prompt,
    explanation: row.question.explanation,
    selectedOptionIds: selectedByQuestion.get(row.question.id) ?? [],
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
