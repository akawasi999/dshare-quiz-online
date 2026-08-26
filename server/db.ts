import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
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
	quizStudioAiHistories,
	seoSettings,
	subscriptionPlans,
	subjects,
	topics,
	  users,
	  walletTransactions,
	  xpLevels,
	  xpTransactions,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { sortLeaderboardEntries } from "./leaderboard";
import { scoreQuiz } from "./quizEngine";
import { getAcceptedAnswers, getHotspots, getMatchingPairs, getOrderingItems, getTrueFalseStatements } from "../shared/questionValidation";
import { getEffectiveTier } from "./membershipUtils";
import { awardXp, processGamificationForAttempt } from "./gamification";
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

export async function saveQuizStudioAiHistory(input: { userId: number; kind: "chat" | "enhancement"; label: string; payload: Record<string, unknown> }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(quizStudioAiHistories).values({
    userId: input.userId,
    kind: input.kind,
    label: input.label.slice(0, 220),
    payload: input.payload,
  });
  const result = await db.select().from(quizStudioAiHistories).where(eq(quizStudioAiHistories.userId, input.userId)).orderBy(desc(quizStudioAiHistories.createdAt)).limit(1);
  return result[0] ?? null;
}

export async function listQuizStudioAiHistories(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizStudioAiHistories).where(eq(quizStudioAiHistories.userId, userId)).orderBy(desc(quizStudioAiHistories.createdAt)).limit(30);
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: new Date() };
  if (user.name !== undefined) values.name = user.name ?? null;
  (["email", "loginMethod"] as const).forEach(field => {
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

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
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

/** @deprecated Dùng ensureAccountProfile cho mã mới; giữ lại để không phá các luồng hiện hữu. */
export const ensureAccountProfile = ensureLearnerProfile;

export async function getAccountSummary(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const profile = await ensureAccountProfile(userId);
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

/** @deprecated Dùng getAccountSummary cho mã mới. */
export const getLearnerSummary = getAccountSummary;

export async function listPublishedCatalog(search?: string, categoryId?: number, rootTopicId?: number) {
  const db = await getDb();
  if (!db) return [];
  const seoConfig = (await db.select({ defaultQuizCoverUrl: seoSettings.defaultQuizCoverUrl, updatedAt: seoSettings.updatedAt }).from(seoSettings).limit(1))[0];
  const defaultCoverUrl = seoConfig?.defaultQuizCoverUrl || DEFAULT_QUIZ_COVER_URL;
  const activeTopics = await db.select({ id: topics.id, name: topics.name, parentId: topics.parentId })
    .from(topics)
    .where(and(eq(topics.status, "active"), isNull(topics.deletedAt)));
  const topicsById = new Map(activeTopics.map(topic => [topic.id, topic]));
  const rootTopicById = new Map<number, { id: number; name: string }>();
  const topicPathById = new Map<number, string>();
  for (const topic of activeTopics) {
    let current = topic;
    const pathNames = [topic.name];
    const visited = new Set<number>();
    while (current.parentId && topicsById.has(current.parentId) && !visited.has(current.id)) {
      visited.add(current.id);
      current = topicsById.get(current.parentId)!;
      pathNames.unshift(current.name);
    }
    rootTopicById.set(topic.id, { id: current.id, name: current.name });
    topicPathById.set(topic.id, pathNames.join(" › "));
  }
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
    topicId: quizzes.topicId,
    topicTitle: topics.name,
    categoryId: categories.id,
    categoryTitle: categories.title,
    subjectTitle: subjects.title,
    lessonTitle: lessons.title,
    creatorName: users.name,
  }).from(quizzes)
    .leftJoin(lessons, eq(quizzes.lessonId, lessons.id))
    .leftJoin(subjects, eq(lessons.subjectId, subjects.id))
    .leftJoin(categories, eq(subjects.categoryId, categories.id))
    .leftJoin(topics, and(eq(quizzes.topicId, topics.id), eq(topics.status, "active"), isNull(topics.deletedAt)))
    .leftJoin(users, eq(quizzes.creatorUserId, users.id))
    .leftJoin(attempts, and(eq(attempts.quizId, quizzes.id), eq(attempts.status, "submitted")))
    .where(and(
      eq(quizzes.isPublished, true),
      eq(quizzes.visibility, "public"),
      isNull(quizzes.deletedAt),
      sql`(${quizzes.topicId} is null or ${topics.id} is not null)`,
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
      quizzes.topicId,
      categories.coverImageUrl,
      quizzes.updatedAt,
      categories.updatedAt,
      quizzes.createdAt,
      topics.name,
      categories.id,
      categories.title,
      subjects.title,
      lessons.title,
      users.name,
    )
    .orderBy(desc(quizzes.createdAt));
  return rows.map(row => {
    const inheritedCategoryCover = !row.coverImageUrl && Boolean(row.categoryUpdatedAt);
    const version = row.coverImageUrl ? row.quizUpdatedAt : inheritedCategoryCover ? row.categoryUpdatedAt : seoConfig?.updatedAt;
    const rootTopic = row.topicId ? rootTopicById.get(row.topicId) : undefined;
    return {
      ...row,
      rootTopicId: rootTopic?.id ?? null,
      rootTopicTitle: rootTopic?.name ?? null,
      topicPath: row.topicId ? topicPathById.get(row.topicId) ?? row.topicTitle : null,
      coverImageUrl: withImageCacheVersion(row.coverImageUrl || defaultCoverUrl, version),
    };
  }).filter(row => !rootTopicId || row.rootTopicId === rootTopicId);
}

export async function listCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.isPublished, true)).orderBy(categories.sortOrder);
}

export async function getQuizDetail(quizId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const activeTopics = await db
    .select({ id: topics.id, name: topics.name, parentId: topics.parentId })
    .from(topics)
    .where(and(eq(topics.status, "active"), isNull(topics.deletedAt)));
  const topicsById = new Map(activeTopics.map(topic => [topic.id, topic]));
  const quizRows = await db
    .select({
      quiz: quizzes,
      lesson: lessons,
      subject: subjects,
      category: categories,
      topic: topics,
    })
    .from(quizzes)
    .leftJoin(lessons, eq(quizzes.lessonId, lessons.id))
    .leftJoin(subjects, eq(lessons.subjectId, subjects.id))
    .leftJoin(categories, eq(subjects.categoryId, categories.id))
    .leftJoin(
      topics,
      and(
        eq(quizzes.topicId, topics.id),
        eq(topics.status, "active"),
        isNull(topics.deletedAt)
      )
    )
    .where(and(eq(quizzes.id, quizId), isNull(quizzes.deletedAt)))
    .limit(1);
  const detail = quizRows[0];
  if (!detail || (detail.quiz.topicId && !detail.topic)) return undefined;
  if (!detail.topic)
    return {
      ...detail,
      topicPath: null,
      rootTopicId: null,
      rootTopicTitle: null,
    };

  const pathNames = [detail.topic.name];
  let current: { id: number; name: string; parentId: number | null } = detail.topic;
  const visited = new Set<number>();
  while (
    current.parentId &&
    topicsById.has(current.parentId) &&
    !visited.has(current.id)
  ) {
    visited.add(current.id);
    current = topicsById.get(current.parentId)!;
    pathNames.unshift(current.name);
  }
  return {
    ...detail,
    topicPath: pathNames.join(" › "),
    rootTopicId: current.id,
    rootTopicTitle: current.name,
  };
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

  const [distributionRows, recentAttempts] = await Promise.all([
    db.select({ below50: sql<number>`coalesce(sum(case when ${attempts.score} < 50 then 1 else 0 end), 0)`, from50To69: sql<number>`coalesce(sum(case when ${attempts.score} >= 50 and ${attempts.score} < 70 then 1 else 0 end), 0)`, from70To84: sql<number>`coalesce(sum(case when ${attempts.score} >= 70 and ${attempts.score} < 85 then 1 else 0 end), 0)`, from85: sql<number>`coalesce(sum(case when ${attempts.score} >= 85 then 1 else 0 end), 0)` }).from(attempts).where(and(eq(attempts.quizId, quizId), eq(attempts.status, "submitted"))),
    db.select({ attemptId: attempts.id, learnerName: users.name, learnerEmail: users.email, score: attempts.score, passed: attempts.passed, completedAt: attempts.completedAt, violationCount: attempts.violationCount }).from(attempts).innerJoin(users, eq(attempts.userId, users.id)).where(and(eq(attempts.quizId, quizId), eq(attempts.status, "submitted"))).orderBy(desc(attempts.completedAt)).limit(30),
  ]);

  const distributionRow = distributionRows[0];
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
    distribution: { below50: Number(distributionRow?.below50 ?? 0), from50To69: Number(distributionRow?.from50To69 ?? 0), from70To84: Number(distributionRow?.from70To84 ?? 0), from85: Number(distributionRow?.from85 ?? 0) },
    learners: recentAttempts.map(row => ({ ...row, score: Number(row.score), violationCount: Number(row.violationCount ?? 0) })),
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
      matchingPairs: row.question.type === "matching" ? getMatchingPairs(row.question.answerConfig ?? {}) : undefined,
      orderingItems: row.question.type === "ordering" ? getOrderingItems(row.question.answerConfig ?? {}) : undefined,
      hotspots: row.question.type === "hotspot" ? getHotspots(row.question.answerConfig ?? {}) : undefined,
      acceptedAnswers: ["fill_blank", "short_answer_ai"].includes(row.question.type) ? getAcceptedAnswers(row.question.answerConfig ?? {}) : undefined,
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
  await ensureLearnerProfile(userId);
  const completedAt = new Date();
  const gamification = await db.transaction(async tx => {
    const updated = await tx.update(attempts).set({
      status: "submitted",
      completedAt,
      score: summary.scorePercent,
      correctCount: summary.correctCount,
      passed,
    }).where(and(eq(attempts.id, attemptId), eq(attempts.status, "in_progress")));
    if (!updated[0].affectedRows) throw new Error("Attempt has already been submitted");

    const quizXpReward = passed && detail.quiz.completionReward > 0
      ? await awardXp(tx, {
          userId,
          amount: detail.quiz.completionReward,
          sourceType: "quiz_completion",
          sourceId: String(attemptId),
          dedupeKey: `attempt:${attemptId}:quiz-xp-reward`,
          reason: `Thưởng hoàn thành Quiz: ${detail.quiz.title}`,
          metadata: { quizId: detail.quiz.id, scorePercent: summary.scorePercent },
        })
      : null;
    const progression = await processGamificationForAttempt(tx, {
      userId,
      attemptId,
      quizId: detail.quiz.id,
      quizTitle: detail.quiz.title,
      scorePercent: summary.scorePercent,
      passed,
      questionCount: questionSet.length,
      completedAt,
    });
    return quizXpReward?.awarded
      ? {
          ...progression,
          xpRewards: [{ amount: detail.quiz.completionReward, reason: "Thưởng hoàn thành Quiz", sourceType: "quiz_completion", sourceId: String(attemptId) }, ...progression.xpRewards],
          levelUps: quizXpReward.levelUp && quizXpReward.level ? [{ level: quizXpReward.level, features: quizXpReward.unlockedFeatures }, ...progression.levelUps] : progression.levelUps,
        }
      : progression;
  });
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
    selectedMatchingAnswers: (payloadByQuestion.get(row.question.id) as { matchingAnswers?: Record<string, string> } | null)?.matchingAnswers ?? {},
    selectedTextAnswer: (payloadByQuestion.get(row.question.id) as { textAnswer?: string } | null)?.textAnswer ?? "",
    statements: row.question.type === "true_false_statements" ? getTrueFalseStatements(row.question.answerConfig ?? {}).map(statement => ({ id: statement.id, text: statement.text, correct: statement.correct })) : [],
    matchingPairs: row.question.type === "matching" ? getMatchingPairs(row.question.answerConfig ?? {}) : [],
    acceptedAnswers: row.question.type === "fill_blank" ? getAcceptedAnswers(row.question.answerConfig ?? {}) : [],
    sampleOutline: row.question.type === "essay" ? String((row.question.answerConfig as { sampleOutline?: unknown } | null)?.sampleOutline ?? "") : "",
    correctOptionIds: row.options.filter(option => option.isCorrect).map(option => option.id),
    isCorrect: correctnessByQuestion.get(row.question.id) ?? false,
    options: row.options.map(option => ({ id: option.id, body: option.body })),
  }));
  return { ...summary, passed, quiz: detail.quiz, review, isFirstCompletion, isPersonalRecord, isQuizRecord, gamification };
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

export async function getXpLeaderboard(period: "all" | "week" | "month" = "all") {
  const db = await getDb();
  if (!db) return [];
  if (period === "all") {
    const rows = await db.select({
      userId: users.id,
      name: users.name,
      xp: learnerProfiles.xpBalance,
      levelName: xpLevels.name,
      levelOrder: xpLevels.displayOrder,
      currentStreak: learnerProfiles.currentStreak,
    }).from(learnerProfiles)
      .innerJoin(users, eq(learnerProfiles.userId, users.id))
      .leftJoin(xpLevels, eq(learnerProfiles.currentLevelId, xpLevels.id))
      .where(sql`${learnerProfiles.xpBalance} > 0`)
      .orderBy(desc(learnerProfiles.xpBalance), desc(learnerProfiles.currentStreak), asc(users.id))
      .limit(50);
    return rows.map(row => ({ ...row, xp: Number(row.xp ?? 0) }));
  }
  const now = new Date();
  const start = period === "week"
    ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - ((now.getUTCDay() + 6) % 7)))
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const earned = sql<number>`coalesce(sum(case when ${xpTransactions.amount} > 0 then ${xpTransactions.amount} else 0 end), 0)`;
  const rows = await db.select({
    userId: users.id,
    name: users.name,
    xp: earned,
    levelName: xpLevels.name,
    levelOrder: xpLevels.displayOrder,
    currentStreak: learnerProfiles.currentStreak,
  }).from(xpTransactions)
    .innerJoin(users, eq(xpTransactions.userId, users.id))
    .innerJoin(learnerProfiles, eq(learnerProfiles.userId, users.id))
    .leftJoin(xpLevels, eq(learnerProfiles.currentLevelId, xpLevels.id))
    .where(sql`${xpTransactions.createdAt} >= ${start}`)
    .groupBy(users.id, users.name, xpLevels.name, xpLevels.displayOrder, learnerProfiles.currentStreak)
    .orderBy(desc(earned), desc(learnerProfiles.currentStreak), asc(users.id))
    .limit(50);
  return rows.map(row => ({ ...row, xp: Number(row.xp ?? 0) }));
}

export async function getWalletTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(walletTransactions).where(eq(walletTransactions.userId, userId)).orderBy(desc(walletTransactions.createdAt)).limit(30);
}
